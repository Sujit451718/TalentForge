from flask import Blueprint, request
from utils.auth_middleware import token_required
from utils.helpers import format_response, to_object_id
from services.db_service import get_collection
from services.ai_service import chatbot_reply, generate_questions_from_resume
from config import Config
import PyPDF2
import datetime
import io

user_bp = Blueprint('user', __name__)
users_collection = get_collection("users")
interviews_collection = get_collection("interviews")
quiz_attempts_collection = get_collection("quiz_attempts")

def _today_start():
    return datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

def _daily_interview_count(user_id):
    return interviews_collection.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": _today_start()}
    })

@user_bp.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard_stats(current_user_id):
    user_id = to_object_id(current_user_id)
    user = users_collection.find_one({"_id": user_id})
    if not user:
        return format_response(None, "User not found", 404)

    total_interviews = interviews_collection.count_documents({"user_id": user_id})
    interviews = list(interviews_collection.find({"user_id": user_id, "status": "completed"}))
    avg_score = sum(i.get('score', 0) for i in interviews) / len(interviews) if interviews else 0
    attempts_used_today = _daily_interview_count(user_id)
    remaining_attempts = max(Config.FREE_DAILY_LIMIT - attempts_used_today, 0)

    stats = {
        "name": user.get('name'),
        "email": user.get('email'),
        "plan_type": user.get('plan_type', 'free'),
        "total_interviews": total_interviews,
        "average_score": round(avg_score, 2),
        "remaining_free_attempts": remaining_attempts if user.get('plan_type', 'free') == 'free' else None,
        "daily_limit": Config.FREE_DAILY_LIMIT,
        "resume_questions_count": len(user.get("resume_questions", [])),
        "recent_interviews": [
            {
                "id": str(item["_id"]),
                "role": item.get("role"),
                "score": item.get("score", 0),
                "status": item.get("status"),
                "created_at": item.get("created_at")
            }
            for item in interviews_collection.find({"user_id": user_id}).sort("created_at", -1).limit(5)
        ]
    }
    return format_response(stats)

@user_bp.route('/upgrade-plan', methods=['POST'])
@token_required
def upgrade_plan(current_user_id):
    user_id = to_object_id(current_user_id)
    users_collection.update_one(
        {"_id": user_id},
        {"$set": {
            "plan_type": "premium",
            "premium_since": datetime.datetime.utcnow()
        }}
    )
    return format_response(
        {"plan_type": "premium", "payment_status": "simulated_success"},
        "Payment simulated and plan upgraded to Premium"
    )

@user_bp.route('/update-profile', methods=['POST'])
@token_required
def update_profile(current_user_id):
    user_id = to_object_id(current_user_id)
    data = request.get_json(silent=True) or {}
    name = data.get("name")
    email = data.get("email")
    
    if not name or not email:
        return format_response(None, "Name and Email are required", 400)
        
    users_collection.update_one(
        {"_id": user_id},
        {"$set": {
            "name": name,
            "email": email
        }}
    )
    
    user = users_collection.find_one({"_id": user_id})
    return format_response({
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "plan_type": user.get("plan_type", "free")
    }, "Profile updated successfully")

@user_bp.route('/upload-resume', methods=['POST'])
@token_required
def upload_resume(current_user_id):
    user_id = to_object_id(current_user_id)
    user = users_collection.find_one({"_id": user_id})
    if not user:
        return format_response(None, "User not found", 404)

    if user.get('plan_type') != 'premium':
        return format_response(None, "Resume upload is a Premium feature.", 403)

    if 'resume' not in request.files:
        return format_response(None, "No file uploaded", 400)

    file = request.files['resume']
    if file.filename == '':
        return format_response(None, "No file selected", 400)
    if not file.filename.lower().endswith(".pdf"):
        return format_response(None, "Only PDF resumes are supported", 400)

    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
        text_parts = []
        for page in reader.pages:
            text_parts.append(page.extract_text() or "")
        text = "\n".join(text_parts).strip()
        if not text:
            return format_response(None, "No extractable text found in the PDF", 400)

        questions = generate_questions_from_resume(text)
        users_collection.update_one(
            {"_id": user_id},
            {"$set": {
                "resume_questions": questions,
                "resume_text_preview": text[:1000],
                "resume_uploaded_at": datetime.datetime.utcnow()
            }}
        )

        return format_response({
            "questions": questions,
            "characters_extracted": len(text)
        }, "Resume processed and personalized questions generated")
    except Exception as e:
        return format_response(None, f"Error processing PDF: {str(e)}", 500)


@user_bp.route('/chatbot', methods=['POST'])
@token_required
def chatbot(current_user_id):
    data = request.get_json(silent=True) or {}
    message = data.get("message", "")
    return format_response({"reply": chatbot_reply(message)})


@user_bp.route('/analytics', methods=['GET'])
@token_required
def analytics(current_user_id):
    user_id = to_object_id(current_user_id)
    user = users_collection.find_one({"_id": user_id})
    if not user:
        return format_response(None, "User not found", 404)

    quiz_attempts = list(quiz_attempts_collection.find({"user_id": user_id}).sort("created_at", -1))
    interviews = list(interviews_collection.find({"user_id": user_id, "status": "completed"}).sort("created_at", -1))
    total_quiz = len(quiz_attempts)
    avg_quiz_score = round(sum(item.get("score", 0) for item in quiz_attempts) / total_quiz, 2) if total_quiz else 0
    avg_ai_score = round(sum(item.get("ai_avg_score", 0) for item in quiz_attempts) / total_quiz, 2) if total_quiz else 0
    avg_interview_score = round(sum(item.get("score", 0) for item in interviews) / len(interviews), 2) if interviews else 0
    latest_answers = quiz_attempts[0].get("answers", []) if quiz_attempts else []
    latest_correct = len([item for item in latest_answers if item.get("is_correct")])
    latest_wrong = max(len(latest_answers) - latest_correct, 0)
    best_quiz_score = max([item.get("score", 0) for item in quiz_attempts], default=0)
    best_interview_score = max([item.get("score", 0) for item in interviews], default=0)
    role_totals = {}
    for interview in interviews:
        role = interview.get("role", "General")
        role_totals.setdefault(role, []).append(interview.get("score", 0))

    data = {
        "user_metrics": {
            "total_quiz_attempts": total_quiz,
            "average_quiz_score": avg_quiz_score,
            "average_ai_score": avg_ai_score,
            "total_interviews": len(interviews),
            "average_interview_score": avg_interview_score,
            "best_quiz_score": best_quiz_score,
            "best_interview_score": best_interview_score,
            "latest_correct": latest_correct,
            "latest_wrong": latest_wrong,
        },
        "saved_progress": user.get("progress", {}),
        "quiz_history": [
            {
                "quiz_id": item.get("quiz_id"),
                "score": item.get("score", 0),
                "ai_avg_score": item.get("ai_avg_score", 0),
                "correct_answers": item.get("correct_answers", 0),
                "total_questions": item.get("total_questions", 0),
                "topic": item.get("topic", "software engineering"),
                "created_at": item.get("created_at"),
            }
            for item in reversed(quiz_attempts[:12])
        ],
        "interview_history": [
            {
                "id": str(item.get("_id")),
                "score": item.get("score", 0),
                "role": item.get("role", "Interview"),
                "created_at": item.get("created_at"),
                "summary": item.get("summary")
            }
            for item in reversed(interviews[:12])
        ],
        "role_performance": [
            {
                "role": role,
                "score": round(sum(scores) / len(scores), 2),
                "attempts": len(scores),
            }
            for role, scores in role_totals.items()
        ],
    }

    if user.get("role") == "admin":
        all_users = list(users_collection.find({}))
        all_attempts = list(quiz_attempts_collection.find({}))
        score_buckets = {"0-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
        for item in all_attempts:
            score = item.get("score", 0)
            if score <= 40:
                score_buckets["0-40"] += 1
            elif score <= 60:
                score_buckets["41-60"] += 1
            elif score <= 80:
                score_buckets["61-80"] += 1
            else:
                score_buckets["81-100"] += 1
        data["admin_metrics"] = {
            "total_users": len(all_users),
            "total_quiz_attempts": len(all_attempts),
            "score_buckets": score_buckets,
        }

    return format_response(data)

@user_bp.route('/admin/stats', methods=['GET'])
@token_required
def get_admin_stats(current_user_id):
    user_id = to_object_id(current_user_id)
    admin = users_collection.find_one({"_id": user_id})
    
    if not admin or admin.get("role") != "admin":
        return format_response(None, "Unauthorized: Admin access required", 403)

    all_users = list(users_collection.find({}))
    all_interviews = list(interviews_collection.find({}))
    all_quizzes = list(quiz_attempts_collection.find({}))
    
    # Calculate revenue (simulated based on premium users)
    premium_users = [u for u in all_users if u.get("plan_type") == "premium"]
    simulated_revenue = len(premium_users) * 749 # Assuming ₹749/mo
    
    # User growth trends (simple count for demo)
    stats = {
        "metrics": [
            { "label": 'Total Users', "value": len(all_users), "subValue": f"{len([u for u in all_users if u.get('created_at', datetime.datetime.min) > _today_start()])} new today", "trend": 12.5, "icon": "Users", "color": 'cyan' },
            { "label": 'Interviews Held', "value": len(all_interviews), "subValue": f"{len([i for i in all_interviews if i.get('status') == 'in-progress'])} in progress", "trend": 8.2, "icon": "BrainCircuit", "color": 'violet' },
            { "label": 'Platform Revenue', "value": f"₹{simulated_revenue}", "subValue": f"{len(premium_users)} premium members", "trend": 15.4, "icon": "CreditCard", "color": 'pink' },
            { "label": 'Quiz Attempts', "value": len(all_quizzes), "subValue": "Knowledge checks", "trend": 5.2, "icon": "Activity", "color": 'emerald' },
        ],
        "users": [
            {
                "name": u.get("name", "Unknown"),
                "email": u.get("email"),
                "status": "Active", # Simplified
                "plan": u.get("plan_type", "free").capitalize(),
                "count": interviews_collection.count_documents({"user_id": u["_id"]}),
                "score": round(sum(i.get("score", 0) for i in interviews_collection.find({"user_id": u["_id"], "status": "completed"})) / 
                         max(interviews_collection.count_documents({"user_id": u["_id"], "status": "completed"}), 1), 1)
            }
            for u in all_users[:10] # Last 10 users for performance
        ]
    }
    
    return format_response(stats)

@user_bp.route('/platform-feedback', methods=['POST'])
def submit_platform_feedback():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "Anonymous")
    email = data.get("email", "")
    rating = data.get("rating", 5)
    comment = data.get("comment", "")
    
    feedback_col = get_collection("platform_feedback")
    feedback_col.insert_one({
        "name": name,
        "email": email,
        "rating": rating,
        "comment": comment,
        "created_at": datetime.datetime.utcnow()
    })
    
    return format_response(None, "Thank you for your feedback! It helps us build a better TalentForge.")

@user_bp.route('/check-ats', methods=['POST'])
@token_required
def check_ats_score(current_user_id):
    user_id = to_object_id(current_user_id)
    user = users_collection.find_one({"_id": user_id})
    if not user or user.get("plan_type") != "premium":
        return format_response(None, "ATS Score is a Premium feature.", 403)

    data = request.get_json(silent=True) or {}
    resume_text = data.get("resume_text")
    
    if not resume_text and request.form.get("resume_text"):
        resume_text = request.form.get("resume_text")
        
    if 'resume' in request.files:
        file = request.files['resume']
        if file and file.filename.lower().endswith(".pdf"):
            try:
                reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
                text_parts = []
                for page in reader.pages:
                    text_parts.append(page.extract_text() or "")
                resume_text = "\n".join(text_parts).strip()
            except Exception as e:
                return format_response(None, f"Error processing PDF: {str(e)}", 500)

    if not resume_text:
        # Fallback to saved resume if available
        resume_text = user.get("resume_text_preview", "")
    
    if not resume_text:
        return format_response(None, "No resume text provided or found in profile.", 400)

    try:
        from services.llm_service import get_ats_score_evaluation
    except Exception as e:
        print(f"Error importing get_ats_score_evaluation: {e}")
        get_ats_score_evaluation = None

    target_role = data.get("target_role") or request.form.get("target_role") or "Software Engineer"
    analysis = get_ats_score_evaluation(resume_text, target_role) if get_ats_score_evaluation else None

    if not analysis:
        return format_response(None, "Failed to analyze resume using AI. Please try again.", 500)
        
    if "error" in analysis:
        return format_response(None, f"AI Error: {analysis['error']}", 500)
    
    return format_response(analysis)

@user_bp.route('/leaderboard', methods=['GET'])
@token_required
def get_leaderboard(current_user_id):
    # Get top users based on total quiz score
    pipeline = [
        {
            "$group": {
                "_id": "$user_id",
                "total_score": {"$sum": {"$multiply": ["$correct_answers", 100]}} # 100 base pts per correct
            }
        },
        {
            "$sort": {"total_score": -1}
        },
        {
            "$limit": 10
        }
    ]
    
    try:
        leaderboard_data = list(quiz_attempts_collection.aggregate(pipeline))
        results = []
        for rank, item in enumerate(leaderboard_data, start=1):
            user = users_collection.find_one({"_id": item["_id"]})
            if user:
                name = user.get("name", "Unknown Player")
                score = item.get("total_score", 0)
                rank_name = "Diamond" if rank <= 2 else "Gold" if rank <= 5 else "Silver"
                results.append({
                    "id": str(user["_id"]),
                    "name": name,
                    "score": score,
                    "rank": rank_name,
                    "avatar": name[0].upper() if name else "U"
                })
                
        # Fill with fallback data if empty so UI looks good
        if not results:
            results = [
                { "id": "1", "name": "AlexTheDev", "score": 12450, "rank": "Diamond", "avatar": "A" },
                { "id": "2", "name": "CodeNinja99", "score": 11200, "rank": "Diamond", "avatar": "C" },
                { "id": "3", "name": "ByteMe", "score": 9800, "rank": "Gold", "avatar": "B" },
                { "id": "4", "name": "ReactMaster", "score": 8750, "rank": "Gold", "avatar": "R" },
                { "id": "5", "name": "BugSquasher", "score": 7200, "rank": "Silver", "avatar": "S" }
            ]
            
        return format_response({"leaderboard": results})
    except Exception as e:
        return format_response(None, f"Error generating leaderboard: {str(e)}", 500)
