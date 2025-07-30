let popup = null;
let button = null;
let popupOpen = false;
let lastSelectionText = "";

function getSelectionContext() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const text = selection.toString().trim();
    if (!/^[a-zA-Z\-']{2,}$/.test(text)) return null; // Only single words

    const range = selection.getRangeAt(0);
    const container = range.startContainer;
    let node = container.nodeType === 3 ? container.parentNode : container;

    // Get the full sentence
    let paragraph = node.innerText || node.textContent || "";
    if (!paragraph) paragraph = document.body.innerText || "";
    let sentences = paragraph.match(/[^.!?]*[.!?]/g) || [paragraph];
    let contextSentence = sentences.find(s => s.includes(text)) || paragraph;

    return { word: text, context: contextSentence.trim() };
}

function removePopupAndButton() {
    if (popup) popup.remove();
    if (button) button.remove();
    popup = button = null;
    popupOpen = false;
    lastSelectionText = "";
    removeOutsideClickListener();
}

function addOutsideClickListener() {
    document.addEventListener('mousedown', handleOutsideClick);
}

function removeOutsideClickListener() {
    document.removeEventListener('mousedown', handleOutsideClick);
}

function handleOutsideClick(event) {
    if (
        (button && button.contains(event.target)) ||
        (popup && popup.contains(event.target))
    ) {
        // Clicked inside our UI; do nothing
        return;
    }
    removePopupAndButton();
}

document.addEventListener("mouseup", (e) => {
    // If popup is open, don't add anything new
    if (popupOpen) return;

    // Only trigger if the selection changed (prevents firing again on button click)
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (!text || text === lastSelectionText) return;

    setTimeout(() => {
        removePopupAndButton();

        const sel = getSelectionContext();
        if (!sel) return;

        lastSelectionText = sel.word; // Mark the last word we showed

        button = document.createElement("button");
        button.innerText = "🔎 Get Meaning";
        button.className = "dict-ext-btn";
        document.body.appendChild(button);

        let x = e.pageX, y = e.pageY;
        button.style.left = x + 8 + "px";
        button.style.top = y + 8 + "px";

        button.onclick = async (ev) => {
            ev.stopPropagation();
            // Prevent re-triggering of mouse events on the old selection:
            window.getSelection().removeAllRanges();
            if (button) button.remove();
            button = null;
            popupOpen = true; // Mark popup as open!
            await showPopup(sel, x, y);
            addOutsideClickListener();
        };
    }, 50);
});

async function showPopup(sel, x, y) {
    if (popup) popup.remove();

    popup = document.createElement("div");
    popup.className = "dict-ext-popup";
    popup.innerHTML = `<div class="dict-ext-loading">Loading...</div>`;
    document.body.appendChild(popup);
    popup.style.left = x + 10 + "px";
    popup.style.top = y + 20 + "px";

    // Fetch meanings/pronunciation from DictionaryAPI
    let dictData, synonyms = [], contextMeaning = null, audioUrl = null;
    try {
        dictData = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(sel.word)}`)
            .then(r => r.json());
        if (Array.isArray(dictData)) {
            audioUrl = dictData[0]?.phonetics?.find(p => p.audio)?.audio || null;
        }
    } catch (e) {
        dictData = null;
    }

    // Fetch synonyms from Datamuse
    try {
        synonyms = await fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(sel.word)}`)
            .then(r => r.json());
    } catch { synonyms = []; }

    // Fetch OpenAI context-aware meaning if API key present
    let openaiKey = await getOpenAIKey();
    if (openaiKey) {
        try {
            contextMeaning = await getContextMeaningOpenAI(openaiKey, sel.word, sel.context);
        } catch (e) {
            contextMeaning = null;
        }
    } else {
        contextMeaning = tryHeuristicContext(dictData, sel.context);
    }

    // Build HTML
    let html = `<div class="dict-ext-header"><strong>${sel.word}</strong>`;
    if (audioUrl)
        html += ` <button class="dict-ext-audio" title="Play pronunciation">🔊</button>`;
    html += `</div>`;

    if (sel.context)
        html += `<div class="dict-ext-context">In context: <em>${sel.context}</em></div>`;

    if (contextMeaning)
        html += `<div class="dict-ext-context-meaning"><b>Most likely meaning here:</b> ${contextMeaning}</div>`;

    if (dictData && Array.isArray(dictData)) {
        html += `<div class="dict-ext-meanings"><b>All dictionary meanings:</b><ol>`;
        for (const meaning of dictData[0].meanings || []) {
            for (const def of meaning.definitions) {
                html += `<li><span class="dict-ext-pos">${meaning.partOfSpeech}</span>: ${def.definition}`;
                if (def.example) html += `<br><span class="dict-ext-example">e.g. "${def.example}"</span>`;
                html += `</li>`;
            }
        }
        html += `</ol></div>`;
    } else {
        html += `<div class="dict-ext-error">No dictionary entry found.</div>`;
    }

    if (synonyms && synonyms.length > 0) {
        html += `<div class="dict-ext-synonyms"><b>Synonyms:</b> ${synonyms.map(s => s.word).join(", ")}</div>`;
    }

    html += `<div class="dict-ext-footer"><button class="dict-ext-close">Close</button></div>`;

    popup.innerHTML = html;

    // Play pronunciation
    if (audioUrl) {
        popup.querySelector(".dict-ext-audio").onclick = (ev) => {
            ev.stopPropagation();
            const audio = new Audio(audioUrl);
            audio.play();
        };
    }

    // Close handler
    popup.querySelector(".dict-ext-close").onclick = (ev) => {
        ev.stopPropagation();
        removePopupAndButton();
    };
}

// Get OpenAI API key from extension storage (if set)
function getOpenAIKey() {
    return new Promise((resolve) => {
        if (!chrome || !chrome.storage) return resolve(null);
        chrome.storage.sync.get(["openai_key"], (result) => {
            resolve(result.openai_key || null);
        });
    });
}

// Call OpenAI API for contextual meaning
async function getContextMeaningOpenAI(apiKey, word, context) {
    const url = "https://api.openai.com/v1/chat/completions";
    const prompt = `Given the word "${word}" in the sentence: "${context}", provide the most likely meaning of the word in this context. Then, list all other possible meanings if relevant.`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a world-class English lexicographer." },
                { role: "user", content: prompt }
            ],
            max_tokens: 180,
            temperature: 0.1
        })
    });
    const data = await res.json();
    if (data.choices && data.choices[0] && data.choices[0].message)
        return data.choices[0].message.content;
    return null;
}

// Best-guess meaning using local heuristics (fallback)
function tryHeuristicContext(dictData, context) {
    if (!dictData || !Array.isArray(dictData) || !context) return null;
    const firstMeaning = dictData[0]?.meanings?.[0]?.definitions?.[0]?.definition || null;
    return firstMeaning;
}
