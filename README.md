
# InsightPro Research Interviewer

InsightPro is a world-class qualitative research studio that uses the **Gemini 3 API** to conduct deep-dive textual interviews. It procedurally generates follow-up probes in real-time to uncover insights that static forms miss.

## 🛠️ Local Installation

If you have downloaded this project as a ZIP file, follow these steps to run it locally:

### 1. Requirements
- **Node.js**: Version 18.0 or higher. [Download here](https://nodejs.org/).
- **NPM**: Comes bundled with Node.js.

### 2. Setup
Open your terminal in the project directory and run:

```bash
# Install dependencies
npm install

# Set your Gemini API Key as an environment variable
# (On macOS/Linux)
export API_KEY="your_actual_api_key_here"
# (On Windows CMD)
set API_KEY="your_actual_api_key_here"
# (On Windows PowerShell)
$env:API_KEY="your_actual_api_key_here"

# Start the development server
npm run dev
```

### 3. Building for Production
To create a high-performance production build:
```bash
npm run build
```
The optimized files will be available in the `/dist` folder.

---

## 🗄️ Database Integration (MySQL)

InsightPro is built to sync research data to a central database. 

1.  Open `services/database.ts`.
2.  Set `USE_MOCK` to `false`.
3.  Set `ENDPOINT` to your backend API (e.g., `https://api.yourdomain.com/v1/interviews`).
4.  Your backend should accept a JSON `POST` request and write the payload to your MySQL instance.

---

## 🚀 Key Features
- **PDF Extraction**: Upload a research guide PDF, and Gemini 3 will automatically extract questions and probes.
- **Smart Probing**: The AI analyzes respondent depth and asks "Why?" or "Can you expand on that?" when answers are too brief.
- **Full Guide Support**: Support for rich-text pasting from Google Docs and MS Word.

*Built for Researchers, by Engineers. Powered by Gemini.*
