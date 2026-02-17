
# InsightPro Research Interviewer

InsightPro is a world-class qualitative research studio that uses **Gemini 3** to conduct deep-dive textual interviews.

## 🛠️ Local Installation

1. **Install Node.js**: [Download here](https://nodejs.org/).
2. **Setup App**:
   ```bash
   npm install
   export API_KEY="your_gemini_api_key"
   npm run dev
   ```

---

## 🗄️ MySQL Database Integration

Since browsers cannot talk directly to MySQL, you need a **Bridge Relay**. This is a tiny server that sits between this app and your database.

### 1. Create your MySQL Table
Run this SQL in your database:
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

### 2. The Bridge Script (bridge.js)
Create a file named `bridge.js` in your project root and paste this code. It uses the credentials you provided in `database.ts`.

```javascript
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

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
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(3001, () => console.log('MySQL Bridge running on port 3001'));
```

### 3. Run the Bridge
```bash
npm install express mysql2 cors
node bridge.js
```

### 4. Configure the App
In `services/database.ts`:
1. Set `USE_MOCK: false`.
2. Ensure `ENDPOINT` points to `http://localhost:3001/api/save`.
3. Fill in your `MYSQL` credentials.

---

## 🚀 Key Features
- **PDF Extraction**: Gemini 3 automatically parses your research guides.
- **Smart Probing**: AI generates context-aware follow-ups based on response depth.
- **Full Guide Support**: Support for rich-text pasting from Google Docs and MS Word.

*Built for Researchers, by Engineers. Powered by Gemini.*
