from flask import Blueprint, request
from utils.auth_middleware import token_required
from utils.helpers import format_response, to_object_id
from services.db_service import get_collection
from services.ai_service import evaluate_answer, generate_interview_questions, generate_quiz_questions
from config import Config
import datetime
try:
    from services.llm_service import get_ai_evaluation
except Exception:
    get_ai_evaluation = None

interview_bp = Blueprint('interview', __name__)
interviews_collection = get_collection("interviews")
questions_collection = get_collection("questions")
users_collection = get_collection("users")
quiz_attempts_collection = get_collection("quiz_attempts")

def _today_start():
    return datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

def _remaining_attempts(user_id):
    used = interviews_collection.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": _today_start()}
    })
    return max(Config.FREE_DAILY_LIMIT - used, 0)

def _question_payload(question_doc):
    return {
        "id": str(question_doc["_id"]),
        "question": question_doc["question"],
        "context": question_doc.get("context"),
        "score": question_doc.get("score"),
        "answer": question_doc.get("answer", ""),
        "feedback": question_doc.get("feedback"),
        "strengths": question_doc.get("strengths", []),
        "weaknesses": question_doc.get("weaknesses", []),
        "suggested_answer": question_doc.get("suggested_answer", ""),
        "jarvis_response": question_doc.get("jarvis_response")
    }

def _build_feedback(interview):
    question_docs = list(questions_collection.find({"interview_id": interview["_id"]}))
    return {
        "interview_id": str(interview["_id"]),
        "role": interview.get("role"),
        "experience_level": interview.get("experience_level"),
        "total_score": interview.get("score", 0),
        "status": interview.get("status", "completed"),
        "date": interview.get("created_at"),
        "completed_at": interview.get("completed_at"),
        "questions": [_question_payload(item) for item in question_docs],
        "analytics": {
            "best_question_score": max([item.get("score", 0) or 0 for item in question_docs], default=0),
            "questions_answered": len([item for item in question_docs if item.get("answer")]),
            "focus_area": "Add more examples and measurable outcomes" if interview.get("score", 0) < 75 else "Practice concise delivery under time pressure"
        },
        "summary": interview.get("summary")
    }

@interview_bp.route('/start-interview', methods=['POST'])
@interview_bp.route('/start', methods=['POST'])
@token_required
def start_interview(current_user_id):
    user_id = to_object_id(current_user_id)
    user = users_collection.find_one({"_id": user_id})
    if not user:
        return format_response(None, "User not found", 404)

    plan_type = user.get("plan_type", "free")
    if plan_type == 'free':
        remaining = _remaining_attempts(user_id)
        if remaining <= 0:
            return format_response(
                {"limit_reached": True, "remaining_free_attempts": 0},
                "Daily limit reached for Free plan. Please upgrade to Premium for unlimited access.",
                403
            )

    data = request.get_json(silent=True) or {}
    role = data.get('role', 'General Software Engineer')
    experience_level = data.get("experience_level", "Mid")
    use_resume = bool(data.get("use_resume"))

    if use_resume and plan_type != "premium":
        return format_response(None, "Resume-based interviews are Premium only", 403)

    generated_questions = generate_interview_questions(
        role,
        experience_level,
        plan_type=plan_type,
        resume_questions=user.get("resume_questions", []),
        use_resume=use_resume
    )

    interview_data = {
        "user_id": user_id,
        "role": role,
        "experience_level": experience_level,
        "plan_type": plan_type,
        "score": 0,
        "status": "in-progress",
        "created_at": datetime.datetime.utcnow()
    }
    interview_id = interviews_collection.insert_one(interview_data).inserted_id
    question_docs = []
    for index, item in enumerate(generated_questions, start=1):
        question_docs.append({
            "interview_id": interview_id,
            "question_number": index,
            "question": item["question"],
            "context": item.get("context"),
            "expected_keywords": item.get("expected_keywords", []),
            "answer": "",
            "score": None,
            "feedback": None,
            "strengths": [],
            "weaknesses": [],
            "suggested_answer": "",
            "created_at": datetime.datetime.utcnow()
        })

    inserted = questions_collection.insert_many(question_docs)
    users_collection.update_one({"_id": user_id}, {"$inc": {"interview_count": 1}})
    saved_questions = list(questions_collection.find({"_id": {"$in": inserted.inserted_ids}}))

    return format_response({
        "interview_id": str(interview_id),
        "questions": [_question_payload(item) for item in saved_questions],
        "time_limit_seconds": 600 if plan_type == "premium" else 360,
        "remaining_free_attempts": _remaining_attempts(user_id) if plan_type == "free" else None
    }, "Interview started")

@interview_bp.route('/submit-answer', methods=['POST'])
@token_required
def submit_answer(current_user_id):
    data = request.get_json(silent=True) or {}
    interview_id = data.get('interview_id')
    interview_object_id = to_object_id(interview_id)
    user_id = to_object_id(current_user_id)

    if not interview_object_id:
        return format_response(None, "Invalid interview id", 400)

    interview = interviews_collection.find_one({"_id": interview_object_id, "user_id": user_id})
    if not interview:
        return format_response(None, "Interview not found", 404)

    answers = data.get("answers")
    if not answers:
        answers = [{
            "question_id": data.get("question_id"),
            "question": data.get("question"),
            "answer": data.get("answer")
        }]

    evaluated_questions = []
    for item in answers:
        answer = (item.get("answer") or "").strip()
        if not answer:
            continue

        question_doc = None
        question_id = to_object_id(item.get("question_id"))
        if question_id:
            question_doc = questions_collection.find_one({
                "_id": question_id,
                "interview_id": interview_object_id
            })
        if not question_doc and item.get("question"):
            question_doc = questions_collection.find_one({
                "interview_id": interview_object_id,
                "question": item.get("question")
            })
        if not question_doc:
            continue

        evaluation = evaluate_answer(
            question_doc.get("question"),
            answer,
            expected_keywords=question_doc.get("expected_keywords", []),
            premium=interview.get("plan_type") == "premium"
        )
        update_doc = {
            "answer": answer,
            "score": evaluation["score"],
            "feedback": evaluation["feedback"],
            "strengths": evaluation["strengths"],
            "weaknesses": evaluation["weaknesses"],
            "suggested_answer": evaluation["suggested_answer"],
            "jarvis_response": evaluation.get("jarvis_response"),
            "matched_keywords": evaluation["matched_keywords"],
            "missing_keywords": evaluation["missing_keywords"],
            "answered_at": datetime.datetime.utcnow()
        }
        questions_collection.update_one({"_id": question_doc["_id"]}, {"$set": update_doc})
        question_doc.update(update_doc)
        evaluated_questions.append(_question_payload(question_doc))

    if not evaluated_questions:
        return format_response(None, "No valid answers submitted", 400)

    all_questions = list(questions_collection.find({"interview_id": interview_object_id}))
    answered_scores = [item.get("score") for item in all_questions if item.get("score") is not None]
    total_score = round(sum(answered_scores) / len(answered_scores), 2) if answered_scores else 0
    status = "completed" if len(answered_scores) == len(all_questions) else "in-progress"

    update_fields = {
        "score": total_score,
        "status": status,
        "completed_at": datetime.datetime.utcnow() if status == "completed" else None
    }
    
    all_strengths = []
    all_weaknesses = []
    for q in all_questions:
        if q.get("strengths"):
            all_strengths.extend(q["strengths"])
        if q.get("weaknesses"):
            all_weaknesses.extend(q["weaknesses"])
    
    # Deduplicate
    all_strengths = list(set(all_strengths))[:3]
    all_weaknesses = list(set(all_weaknesses))[:3]
    
    is_selected = total_score >= 70
    update_fields["summary"] = {
        "is_selected": is_selected,
        "strengths": all_strengths,
        "weaknesses": all_weaknesses,
        "future_improvements": all_weaknesses if all_weaknesses else ["Focus on structured thinking and concrete examples."]
    }

    interviews_collection.update_one(
        {"_id": interview_object_id},
        {"$set": update_fields}
    )

    return format_response({
        "interview_id": interview_id,
        "total_score": total_score,
        "status": status,
        "questions": evaluated_questions
    }, "Answer evaluated successfully")

@interview_bp.route('/feedback/<interview_id>', methods=['GET'])
@interview_bp.route('/feedback', methods=['GET'])
@token_required
def get_feedback(current_user_id, interview_id=None):
    user_id = to_object_id(current_user_id)
    interview_object_id = to_object_id(interview_id or request.args.get("interview_id"))

    query = {"user_id": user_id}
    if interview_object_id:
        query["_id"] = interview_object_id

    interview = interviews_collection.find_one(query, sort=[("created_at", -1)])
    if not interview:
        return format_response(None, "Interview not found", 404)

    return format_response(_build_feedback(interview))


@interview_bp.route('/quiz/generate', methods=['POST'])
@token_required
def generate_quiz(current_user_id):
    user_id = to_object_id(current_user_id)
    if not users_collection.find_one({"_id": user_id}):
        return format_response(None, "User not found", 404)

    data = request.get_json(silent=True) or {}
    topic = data.get("topic", "software engineering")
    count = int(data.get("count", 10) or 10)
    count = max(10, min(count, 20))
    questions = generate_quiz_questions(topic, count)
    quiz_id = str(datetime.datetime.utcnow().timestamp()).replace(".", "")
    payload = []
    for index, item in enumerate(questions, start=1):
        try:
            ans_idx = int(item.get("answer_index", 0))
        except (ValueError, TypeError):
            ans_idx = 0
            
        payload.append(
            {
                "id": f"q-{index}", # Simpler stable ID
                "question": item.get("question"),
                "options": item.get("options", [])[:4],
                "answer_index": ans_idx,
            }
        )
    return format_response({"quiz_id": quiz_id, "topic": topic, "questions": payload}, "Quiz generated")


@interview_bp.route('/quiz/submit', methods=['POST'])
@token_required
def submit_quiz(current_user_id):
    user_id = to_object_id(current_user_id)
    user = users_collection.find_one({"_id": user_id})
    if not user:
        return format_response(None, "User not found", 404)

    data = request.get_json(silent=True) or {}
    quiz_id = data.get("quiz_id")
    questions = data.get("questions", [])
    answers = data.get("answers", {})
    if not quiz_id or not questions:
        return format_response(None, "Quiz payload is incomplete", 400)

    total = len(questions)
    correct = 0
    evaluated = []
    for question in questions:
        qid = question.get("id")
        answer_index = answers.get(qid)
        expected_index = question.get("answer_index")
        is_correct = answer_index == expected_index
        selected_option = ""
        correct_option = ""
        options = question.get("options", [])
        if isinstance(answer_index, int) and 0 <= answer_index < len(options):
            selected_option = options[answer_index]
        if isinstance(expected_index, int) and 0 <= expected_index < len(options):
            correct_option = options[expected_index]

        ai_feedback = "Correct answer selected." if is_correct else "Incorrect option selected."
        ai_score = 100 if is_correct else 25
        if get_ai_evaluation and selected_option:
            ai_eval = get_ai_evaluation(
                f"MCQ: {question.get('question')} | Correct option: {correct_option}",
                f"Selected option: {selected_option}",
            )
            if ai_eval and isinstance(ai_eval, dict):
                ai_score = int(ai_eval.get("score", ai_score))
                ai_feedback = ai_eval.get("feedback", ai_feedback)

        correct += 1 if is_correct else 0
        evaluated.append(
            {
                "id": qid,
                "question": question.get("question"),
                "selected_index": answer_index,
                "answer_index": expected_index,
                "is_correct": is_correct,
                "ai_score": ai_score,
                "ai_feedback": ai_feedback,
            }
        )
    score = round((correct / total) * 100, 2) if total else 0
    ai_avg_score = round(sum(item.get("ai_score", 0) for item in evaluated) / total, 2) if total else 0
    attempt_doc = {
        "user_id": user_id,
        "quiz_id": quiz_id,
        "score": score,
        "correct_answers": correct,
        "total_questions": total,
        "ai_avg_score": ai_avg_score,
        "topic": data.get("topic", "software engineering"),
        "answers": evaluated,
        "created_at": datetime.datetime.utcnow(),
    }
    quiz_attempts_collection.insert_one(attempt_doc)
    users_collection.update_one(
        {"_id": user_id},
        {"$set": {
            "progress": {
                "last_quiz_score": score,
                "last_quiz_topic": data.get("topic", "software engineering"),
                "last_quiz_at": attempt_doc["created_at"],
                "last_ai_avg_score": ai_avg_score,
            }
        }}
    )

    return format_response(
        {
            "quiz_id": quiz_id,
            "score": score,
            "correct_answers": correct,
            "total_questions": total,
            "ai_avg_score": ai_avg_score,
            "message": "Quiz answers submitted successfully.",
        },
        "Quiz submitted",
    )


@interview_bp.route('/quiz/history', methods=['GET'])
@token_required
def quiz_history(current_user_id):
    user_id = to_object_id(current_user_id)
    attempts = list(quiz_attempts_collection.find({"user_id": user_id}).sort("created_at", -1).limit(10))
    payload = [
        {
            "quiz_id": item.get("quiz_id"),
            "score": item.get("score", 0),
            "correct_answers": item.get("correct_answers", 0),
            "total_questions": item.get("total_questions", 0),
            "topic": item.get("topic", "software engineering"),
            "created_at": item.get("created_at"),
        }
        for item in attempts
    ]
    return format_response({"attempts": payload})
