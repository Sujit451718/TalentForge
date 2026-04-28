# AI Interview Simulator

A full-stack AI-powered Interview Simulator with a Flask REST API, MongoDB persistence, React UI, Tailwind styling, JWT authentication, free/premium plan logic, simulated payments, resume-based questions, and answer evaluation.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Axios, React Router, lucide-react
- Backend: Python, Flask, PyMongo, JWT, bcrypt, PyPDF2
- Database: MongoDB, usable locally or through MongoDB Compass
- Evaluation: keyword matching plus lightweight NLP-style token analysis, with optional Gemini fallback if `GOOGLE_API_KEY` is configured

## Folder Structure

```text
ai-interview-simulator/
  backend/
    app.py
    config.py
    requirements.txt
    .env.example
    routes/
      auth_routes.py
      user_routes.py
      interview_routes.py
      payment_routes.py
    services/
      ai_service.py
      auth_service.py
      db_service.py
      llm_service.py
    utils/
      auth_middleware.py
      helpers.py
  frontend/
    index.html
    package.json
    vite.config.js
    tailwind.config.js
    postcss.config.js
    src/
      App.jsx
      main.jsx
      index.css
      components/
      context/
      pages/
      services/
  database_schema.sql
```

## API Endpoints

The backend supports root routes and `/api` routes. The React client uses the grouped `/api/...` routes.

- `POST /register` and `POST /api/auth/register`
- `POST /login` and `POST /api/auth/login`
- `POST /logout` and `POST /api/auth/logout`
- `GET /dashboard` and `GET /api/user/dashboard`
- `POST /upgrade-plan` and `POST /api/user/upgrade-plan`
- `POST /start-interview` and `POST /api/interview/start-interview`
- `POST /submit-answer` and `POST /api/interview/submit-answer`
- `GET /feedback` and `GET /api/interview/feedback`
- `POST /upload-resume` and `POST /api/user/upload-resume`
- `POST /simulate-payment` and `POST /api/payment/simulate-payment`

## MongoDB Collections

- `users`: name, email, bcrypt password, plan type, interview count, resume questions, timestamps
- `interviews`: user id, role, experience level, plan type, score, status, timestamps
- `questions`: interview id, question, answer, score, feedback, strengths, weaknesses, suggested answer

`database_schema.sql` contains the MySQL equivalent requested in the prompt, but the running app is wired to MongoDB.

## Run Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python app.py
```

Make sure MongoDB is running locally or update `MONGO_URI` in `backend/.env`.

If MongoDB is not running, the app automatically switches to a local demo database when `ENABLE_LOCAL_DEMO_DB=true`. This removes the browser "Network Error" during local demos while keeping MongoDB as the primary database path.

## Run Frontend

```bash
cd frontend
npm install
npm run start
```

Open `http://localhost:5173`.

## Environment Variables

```env
MONGO_URI=mongodb://localhost:27017/
DB_NAME=ai_interview_simulator
SECRET_KEY=replace-with-a-long-random-secret
JWT_EXPIRATION_HOURS=24
FREE_DAILY_LIMIT=2
FRONTEND_URL=http://localhost:5173
GOOGLE_API_KEY=
ADMIN_NAME=Admin Profile
ADMIN_EMAIL=admin@interviewsim.local
ADMIN_PASSWORD=Admin@12345
ENABLE_LOCAL_DEMO_DB=true
```

## Feature Notes

- Free users get 2 interview starts per day, basic questions, and no resume-based interview.
- Premium users get unlimited interview starts, advanced questions, resume upload, and richer feedback.
- A seeded premium admin profile is available by default: `admin@interviewsim.local` / `Admin@12345`.
- The upgrade button simulates payment success and updates `plan_type` in MongoDB.
- Logout clears the frontend token. No server-side token denylist is used in this educational simulation.
- Resume upload accepts PDFs, extracts text with PyPDF2, and generates personalized question prompts.
