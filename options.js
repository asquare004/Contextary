// Restore saved API key
chrome.storage.sync.get(["openai_key"], (result) => {
    document.getElementById("openai-key").value = result.openai_key || "";
});

document.getElementById("key-form").onsubmit = (e) => {
    e.preventDefault();
    let key = document.getElementById("openai-key").value.trim();
    chrome.storage.sync.set({ openai_key: key }, () => {
        document.getElementById("key-msg").innerText = "Key saved!";
        setTimeout(() => document.getElementById("key-msg").innerText = "", 2000);
    });
};
