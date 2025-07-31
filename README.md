# 📖 Contextary Extension

A beautiful, privacy-first browser extension for instantly looking up accurate and context-aware meanings, synonyms, and pronunciation of any English word on any website.  
Supports both OpenAI-powered context meaning (for advanced users) and a free local alternative (no API key required).

## ✨ Features

- **Highlight any word:** Instantly get its meaning, pronunciation, and synonyms in a floating popup.
- **Context-aware meaning:** Uses either OpenAI’s models (if you provide an API key) or a smart free local method for the most accurate sense in your sentence.
- **Works everywhere:** Chrome, Firefox, Edge (Manifest v3).
- **No tracking:** No analytics, no user data collected. Your API key (if any) is stored only on your device.
- **Modern UI:** Glassy, distraction-free, theme-adaptive popup.
  
## 🚀 Installation

### For Developers / Advanced Users

1. **Clone or download this repository:**

    ```sh
    git clone https://github.com/yourusername/context-dictionary-extension.git
    cd context-dictionary-extension
    ```

2. **(Optional) Install dependencies**  
   If you want to build/minify, but the extension works out-of-the-box for most users.

3. **Load as an Unpacked Extension:**
   - Go to `chrome://extensions/` (or `edge://extensions/` or `about:debugging` in Firefox)
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the project folder (`context-dictionary-extension/`)

4. **(Optional, for context-aware GPT meanings)**
   - Click the extension’s icon → “Options” or “Settings”
   - Enter your OpenAI API key (sk-...) if you want to use GPT-powered contextual meaning.

### **Or download the latest release ZIP and load it as above.**

## ⚙️ Usage

1. **Select any word on any webpage** (double-click or drag-select).
2. **Click the “🔎 Get Meaning” button** that appears.
3. The popup will show:
    - Contextual meaning (based on your selected mode)
    - All dictionary meanings
    - Synonyms
    - Pronunciation (click 🔊)
4. Click **Close** or click outside the popup to dismiss.

## 🛡️ Privacy

- **No user data is ever collected or sent anywhere except the dictionary/synonym APIs you use.**
- If you provide an OpenAI API key, it is stored only in your browser storage and only used to fetch contextual meanings you request.
- No analytics, ads, or trackers.

## 🔀 Configuration

- Open the extension settings (right-click the icon → Options)
- Choose your preferred **context meaning source**:
    - **OpenAI** (most accurate, requires API key)
    - **Free local method** (no key, good-enough for most uses)
- (Optional) Enter your OpenAI API key

## 🌐 Supported Browsers

- Chrome (and all Chromium browsers)
- Firefox (Manifest v3)
- Edge

## 🧑‍💻 Contributing

Pull requests are welcome!  
If you want to improve the UI, add more features, or support new languages—open an issue or PR.

## 📝 License

[MIT License](LICENSE)