
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

### 1. Configure for Production
Open `services/database.ts` and ensure your production MySQL credentials are set. Since the app is built into static files, these credentials will be bundled into the JavaScript. 
*   Ensure `USE_MOCK` is `false`.
*   Ensure `ENDPOINT` is set to `'./bridge.php'`.

### 2. Build the Application
Run the following command in your local terminal:
```bash
npm run build
```
This will create a new folder named `dist` (or sometimes `build`) containing optimized versions of your HTML, CSS, and JavaScript.

### 3. Prepare the Server Files
1.  Navigate to your local `dist` folder.
2.  **Crucial Step**: Copy your `bridge.php` file from the project root into the `dist` folder. Build tools usually ignore `.php` files, so you must add it manually.
3.  Ensure your `dist` folder now contains:
    *   `index.html`
    *   `assets/` (folder containing JS/CSS)
    *   `bridge.php`

### 4. Upload to Server
1.  Connect to your server via FTP (e.g., FileZilla) or use your Hosting Control Panel's File Manager.
2.  Upload the **contents** of the `dist` folder directly into your server's public directory (usually `public_html`, `www`, or `htdocs`).
3.  Do **not** upload the `node_modules` folder or the `src` folder to your live server.

### 5. Final Checklist
*   **Permissions**: Ensure `bridge.php` has correct permissions (usually 644) so the server can execute it.
*   **Database**: Ensure you have run the SQL command to create the `interview_responses` table on your production database.
*   **Environment Variables**: If your server doesn't support system environment variables for the `API_KEY`, the key will be baked into the JS during the `build` step. Ensure you set the variable in your terminal *before* running `npm run build`.

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
