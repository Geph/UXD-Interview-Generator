
# InsightPro Research Interviewer

InsightPro is a world-class qualitative research studio powered by **Gemini 3**. It uses procedural generation to conduct deep-dive textual interviews with research respondents.

## 🛠️ Local Installation

Follow these steps to set up the environment on your machine:

### 1. Requirements
- **Node.js**: Version 18.0 or higher. [Download here](https://nodejs.org/).
- **MySQL**: A running instance with a database for storing responses.

### 2. Setup the Application
Open your terminal in the project directory:

```bash
# Install project dependencies
npm install
```

### 3. Configure the API Key
You **must** set your Gemini API Key as an environment variable before running the app. Choose the command for your specific operating system:

**Windows (PowerShell - Recommended)**
```powershell
$env:API_KEY="your_actual_api_key_here"
```

**Windows (Command Prompt)**
```cmd
set API_KEY="your_actual_api_key_here"
```

**macOS / Linux (Bash or Zsh)**
```bash
export API_KEY="your_actual_api_key_here"
```

### 4. Run the App
```bash
# Start the development server
npm run dev
```

---

## 🗄️ MySQL Database Integration

Browser applications cannot connect directly to MySQL due to security protocols. You must use the included **Bridge Relay**.

### 1. Create your MySQL Table
Execute this SQL in your database management tool (e.g., MySQL Workbench, phpMyAdmin):
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

### 2. Prepare the Bridge Script (bridge.cjs)
Create a file named `bridge.cjs` (the `.cjs` extension is required) in your project root and paste the following:

```javascript
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check for the UI dashboard
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/save', async (req, res) => {
    const { config, data } = req.body;
    try {
        const connection = await mysql.createConnection({
            host: config.HOST,
            user: config.USER,
            password: config.PASSWORD,
            database: config.DATABASE
        });

        const query = `INSERT INTO ${config.TABLE} 
            (study_name, respondent_id, interview_json, summary_text, created_at) 
            VALUES (?, ?, ?, ?, ?)`;
        
        await connection.execute(query, [
            data.study_name, 
            data.respondent_id, 
            data.interview_json, 
            data.summary_text, 
            data.timestamp
        ]);

        await connection.end();
        res.json({ success: true });
    } catch (err) {
        console.error("MYSQL ERROR:", err.message);
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log('------------------------------------');
    console.log('🚀 MySQL Bridge Relay Active');
    console.log(`📍 Listening on: http://localhost:${PORT}`);
    console.log('------------------------------------');
});
```

### 3. Run the Bridge Relay
In a **separate terminal window**, run:
```bash
npm install express mysql2 cors
node bridge.cjs
```

### 4. Connect the App to MySQL
1. Open `services/database.ts`.
2. Change `USE_MOCK` to `false`.
3. Enter your MySQL `HOST`, `USER`, `PASSWORD`, and `DATABASE` name.
4. Refresh the app. The **MySQL Bridge** status indicator should turn green.

---

## 🚀 Key Features
- **Health Check Dashboard**: Real-time validation of Gemini API and MySQL Relay connectivity.
- **AI PDF Extraction**: Gemini 3 automatically parses uploaded research guides into core questions.
- **Deep Probing Engine**: Intelligent follow-ups based on the "thinness" of respondent answers.
- **System Logs**: Built-in debug console to monitor background AI and DB activity.

*Built for Researchers. Powered by Gemini.*
