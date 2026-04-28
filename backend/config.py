import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    DB_NAME = os.getenv("DB_NAME", "ai_interview_simulator")
    SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-key")
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
    FREE_DAILY_LIMIT = int(os.getenv("FREE_DAILY_LIMIT", "2"))
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024
    ADMIN_NAME = os.getenv("ADMIN_NAME", "Admin Profile")
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@interviewsim.local")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Sujit@45")
    ENABLE_LOCAL_DEMO_DB = os.getenv("ENABLE_LOCAL_DEMO_DB", "false").lower() == "true"
    ATS_KEYWORDS = [
        "React", "Node.js", "Python", "Docker", "Kubernetes", "AWS", "SQL", "NoSQL",
        "Git", "CI/CD", "Agile", "Scrum", "REST API", "GraphQL", "TypeScript",
        "Machine Learning", "System Design", "Microservices", "Testing", "Security"
    ]
