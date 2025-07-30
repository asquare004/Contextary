document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("openai_key");
    const msg = document.getElementById("msg");

    // Load existing key
    chrome.storage.sync.get(["openai_key"], (result) => {
        if (result.openai_key) input.value = result.openai_key;
    });

    // Save on submit
    document.getElementById("apikey-form").onsubmit = (e) => {
        e.preventDefault();
        chrome.storage.sync.set({ openai_key: input.value.trim() }, () => {
            msg.innerText = "API key saved!";
            setTimeout(() => msg.innerText = "", 2000);
        });
    };
});
