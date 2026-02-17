
# InsightPro Research Interviewer

InsightPro is a state-of-the-art qualitative research tool designed to conduct deep-dive textual interviews. Unlike static forms, InsightPro uses the **Gemini 3 API** to procedurally generate follow-up probes in real-time.

## 🗄️ Database Setup (MySQL)

To connect InsightPro to your database:

1.  **Backend Endpoint**: You need a simple web server (Node.js, PHP, Python, etc.) that accepts a `POST` request and inserts data into MySQL.
2.  **Configuration**: Open `services/database.ts`.
    - Set `ENDPOINT` to your API URL.
    - Set `USE_MOCK` to `false`.
3.  **Payload Structure**: Your server will receive a JSON body like this:
    ```json
    {
      "study_name": "UX Research Q1",
      "respondent_id": "user_xyz123",
      "interview_data": "[{...steps...}]",
      "created_at": "2023-10-27T10:00:00Z"
    }
    ```

## 🚀 Setup & Hosting

### 1. Requirements
- A **Google Gemini API Key** (v3 series recommended).
- A static file host (Vercel, Netlify, Github Pages).

### 2. Deployment
- Set the environment variable `API_KEY` in your hosting dashboard.
- Update the `DB_CONFIG` in `services/database.ts` with your production endpoint.

## 📝 Usage Tips
- **Pasting**: You can copy-paste formatted lists from **Google Docs** or **Microsoft Word**. 
- **Structure**: Top-level bullets are treated as Core Questions. Indented bullets (using Tab or spaces) are treated as specific probes for the AI to prioritize.
- **Reordering**: Drag and drop cards in the "Parsed Flow" sidebar to change the order of your interview.

---
*Built by Researchers, for Researchers. Powered by Gemini.*
