
# InsightPro Research Interviewer

InsightPro is a world-class qualitative research studio powered by **Gemini 3**.

## 🛠️ Local Installation & Development

1. **Install Node.js**: [Download here](https://nodejs.org/).
2. **Setup App**:
   ```bash
   npm install
   $env:API_KEY="your_gemini_api_key"
   npm run dev
   ```

---

## 🚀 Production Deployment (PHP/MySQL Server)

If you are moving from a local environment to a live server, follow these steps:

### 1. Build the Application
Frontend apps are static. The `API_KEY` must be "baked in" during the build process if your server doesn't provide it dynamically.

**On Windows (PowerShell):**
You **must** run these two commands in the **same** terminal window:
```powershell
$env:API_KEY="your_actual_api_key_here"
npm run build
```

**On macOS / Linux:**
```bash
API_KEY="your_actual_api_key_here" npm run build
```

### 2. Prepare the Server Files
1.  Navigate to your local `dist` (or `build`) folder.
2.  **Crucial Step**: Copy your `bridge.php` file from the project root into that `dist` folder.
3.  Ensure your `dist` folder contains:
    *   `index.html`
    *   `assets/` (folder containing bundled JS/CSS)
    *   `bridge.php`

### 3. Upload to Server
1.  Connect via FTP/SFTP.
2.  Upload the **contents** of the `dist` folder to your server's web root (e.g., `public_html`).
3.  **Permissions**: Set `bridge.php` permissions to `644`.

### 4. Configuration
Once uploaded, open your site. If you see "GEMINI ENGINE: OFFLINE" in the health check, the API key was not correctly set during Step 1.

---

## 🗄️ MySQL Database Setup (SQL)
Run this on your server's MySQL instance:
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

*Built for Researchers. Powered by Gemini.*
