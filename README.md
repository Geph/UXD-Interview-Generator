# Robot Interviewer - UXD Research Tool

Robot Interviewer is a high-fidelity qualitative research tool designed specifically for User Experience Designers and Researchers. It leverages the **Gemini 3.0** engine to conduct autonomous, text-based interviews that go beyond static questions by dynamically generating follow-up probes to uncover deeper user insights.

## 🚀 Key Features
- **Dynamic Probing**: Unlike standard forms, the "Robot" analyzes respondent answers in real-time to ask "Why?" and "Tell me more," based on your research goals.
- **Hierarchy-Aware Parsing**: Paste your interview guide directly. The system interprets indented bullets and sub-points as specific probes for their parent questions.
- **Automated Synthesis**: Every response is analyzed for "topic exhaustion" before moving to the next core question.
- **Secure MySQL Syncing**: Built-in PHP bridge relay allows for seamless data storage on your own private server infrastructure.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Node.js**: [Download and install](https://nodejs.org/).
- **Gemini API Key**: Obtain a key from the [Google AI Studio](https://aistudio.google.com/).

### 2. Installation
```bash
npm install
```

### 3. Running the App
To run the app locally, you must provide the API key as an environment variable to allow the build tool (Vite) to inject it.

**On Windows (PowerShell):**
```powershell
$env:API_KEY="your_gemini_api_key_here"
npm run dev
```

**On macOS / Linux:**
```bash
API_KEY="your_gemini_api_key_here" npm run dev
```

---

## 🌐 Production Configuration & Deployment

### 1. The Build Process (Critical)
Robot Interviewer is a client-side application. Because the API key is used by the browser, it must be "baked in" during the build step. **Setting the environment variable on the server itself will not work; it must be set on the machine running the build command.**

**Build Command:**
```bash
API_KEY="your_actual_production_api_key" npm run build
```
This generates a `dist/` folder containing the optimized production assets.

### 2. Database Preparation
Run the following SQL script on your MySQL server to create the storage tables:

```sql
CREATE TABLE studies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    goal TEXT,
    questions_json JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interview_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    study_name VARCHAR(255),
    respondent_id VARCHAR(255),
    interview_json JSON,
    summary_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Bridge Configuration
1. Open `services/database.ts` and update the `DB_CONFIG` object with your production MySQL credentials.
2. Ensure `bridge.php` is uploaded to the same directory as your `index.html`.
3. The PHP bridge handles the relay from the frontend to your database. Ensure your server has the `PDO_MySQL` extension enabled.

---

## 🔒 Security Note
This tool is designed for qualitative research. By default, it uses a PHP bridge to communicate with your database. Ensure your `bridge.php` file is secured and only accessible via your application's domain if deploying in a sensitive environment.

*Elevating qualitative research through intelligent automation. Powered by Gemini.*