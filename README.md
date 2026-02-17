
# InsightPro Research Interviewer

InsightPro is a world-class qualitative research studio powered by **Gemini 3**.

## 🛠️ Local Installation

1. **Install Node.js**: [Download here](https://nodejs.org/).
2. **Setup App**:
   ```bash
   npm install
   $env:API_KEY="your_gemini_api_key"
   npm run dev
   ```

---

## 🗄️ MySQL Database Integration

Since browsers cannot connect directly to MySQL, you must use a **Bridge Relay**. 

### 1. Create your MySQL Table
```sql
CREATE TABLE interview_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    study_name VARCHAR(255),
    respondent_id VARCHAR(255),
    interview_json JSON,
    summary_text TEXT,
    created_at DATETIME
);
```

### 2. Choose Your Bridge Method

#### Option A: PHP Bridge (Best for shared hosting / servers)
If you are deploying to a standard web server where you cannot run Node.js background processes:
1. Upload the provided `bridge.php` to your server (in the same folder as `index.html`).
2. Open `services/database.ts`.
3. Set `ENDPOINT: './bridge.php'`.
4. Enter your MySQL credentials in the `MYSQL` object.
5. The app will automatically connect via PHP.

#### Option B: Node.js Bridge (Best for local development)
1. Ensure `bridge.cjs` is in your project root.
2. Install bridge dependencies: `npm install express mysql2 cors`.
3. Run: `node bridge.cjs`.
4. Set `ENDPOINT: 'http://localhost:3001/api/save'` in `services/database.ts`.

---

## 🚀 Key Features
- **Health Check Dashboard**: Real-time validation of Gemini API and MySQL Relay connectivity.
- **AI PDF Extraction**: Gemini 3 automatically parses uploaded research guides into core questions.
- **Deep Probing Engine**: Intelligent follow-ups based on response quality.
- **System Logs**: Built-in debug console to monitor background activity.

*Built for Researchers. Powered by Gemini.*
