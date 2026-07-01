# SnackCheck - Full Stack AI Food Label Scanner & Health Analyst

SnackCheck is a professional full-stack platform that empowers users to scan food labels, receive AI-powered health evaluations, check ingredient safety, avoid custom allergens, and book sessions with registered dietitians and nutritionists.

The stack utilizes **Python FastAPI** and **MongoDB** for the backend, and **React + TypeScript + Vite + Tailwind CSS** for a modern, glassmorphic frontend interface.

---

## Live Demo

- **Frontend (Vercel)**: [https://snack-check-nine.vercel.app/](https://snack-check-nine.vercel.app/)
- **Backend API (Render)**: [https://snack-check.onrender.com](https://snack-check.onrender.com)

---

## Technical Features

1. **AI Food Label Scanner**: Decodes ingredients and nutrition facts in-memory using **Google Gemini API** (`gemini-2.5-flash`), computing an overall health score (0-100), health grade (A+, A, B, C, D, F), warning notifications, and healthier alternatives.
2. **Dual Authentication**: Normal password-based credentials auth + **Google Sign-In OAuth2** token validation.
3. **Dietary Preferences & Profile**: Syncs user-specific allergies (Gluten, Lactose, Peanuts, etc.) and health goals (Weight Loss, High Protein, Low Sugar), highlighting custom warnings on food scanning results.
4. **Professional Consultations**: Visual catalog of nutritionists, slot selection calendars, appointment scheduling, and consultation cancellations.

---

## Directory Structure

```
c:\snackcheck\
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # auth, scan, doctor, and user routers
│   │   ├── core/             # database config, token security, settings
│   │   ├── models/           # database schema design
│   │   ├── schemas/          # request & response Pydantic schemas
│   │   ├── services/         # Gemini Vision integration, Google Token verify
│   │   └── main.py           # entrypoint & CORS middleware
│   ├── .env                  # local secrets configuration
│   └── requirements.txt      # python dependencies list
└── frontend/                 # Vite React TypeScript Application
    ├── src/
    │   ├── components/       # Layout, Dashboard, Scanner, Doctors, History, AuthPage
    │   ├── context/          # AuthSession & Server Fetch context provider
    │   ├── schemas/          # typescript type interfaces
    │   ├── App.tsx           # router coordinator
    │   ├── index.css         # tailwind custom style base
    │   └── main.tsx          # react DOM mounter
    ├── package.json          # npm dependencies
    ├── postcss.config.js     # tailwind postcss compile config
    └── tailwind.config.js    # tailwind layout extend rules
```

---

## Getting Started

### 1. Prerequisite: Database
Make sure you have **MongoDB** installed and running locally, or use a MongoDB Atlas cloud URI.
- Default local URI: `mongodb://localhost:27017`

---

### 2. Backend Setup
Navigate to the `backend` folder, set up a virtual environment, install the requirements, and configure your keys.

1. Open a terminal and move to `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure the environment variables. Open `.env` and fill in your keys:
   - `GEMINI_API_KEY`: Get a free key from Google AI Studio.
   - `GOOGLE_CLIENT_ID`: Create a project on Google Cloud Console for OAuth.
   *Note: If these keys are not set, SnackCheck runs in **Developer Sandbox Mode**, which simulates successful scans and login flows for a smooth experience.*
5. Run the backend server:
   ```bash
   python -m app.main
   ```
   The backend will start on **`http://localhost:8000`**. You can view the Swagger API docs at `http://localhost:8000/docs`.

---

### 3. Frontend Setup
Navigate to the `frontend` folder, install the packages, and run the hot-reload Vite server.

1. Open a new terminal and move to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend application will start on **`http://localhost:5173`**. Open this URL in your web browser.

---

## Sandbox Mode (No API Setup Required)
If you just want to see the project in action instantly without configuring Google Cloud or Gemini keys:
1. **Google Login**: In the Auth page, click **"Demo Sign In (Skip Google Setup)"**. The backend bypasses validation and creates a simulated Google profile.
2. **Scanner**: Upload any food label image or file. If no Gemini API key is configured, the scanner simulates an AI analysis, returning a detailed, randomized product evaluation report (such as cookies, oatmeal, or veggie crisps) after 2 seconds.
3. **Doctors**: The database automatically seeds default nutritionist profiles on backend startup, allowing you to schedule bookings immediately.
