import re
import random
from collections import Counter

try:
    from services.llm_service import get_ai_evaluation, get_llm_model, generate_questions_from_resume as ai_generate_questions_from_resume
except Exception as e:
    print(f"Error importing llm_service functions: {e}")
    get_ai_evaluation = None
    get_llm_model = None
    ai_generate_questions_from_resume = None

STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has",
    "have", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to",
    "with", "we", "will", "you", "your"
}

# Keep small fallback for absolute emergencies only
EMERGENCY_QUESTIONS = {
    "general": [
        {
            "question": "Tell me about a technical problem you solved and the tradeoffs you considered.",
            "context": "Problem solving",
            "expected_keywords": ["problem", "tradeoff", "impact", "decision", "result"]
        }
    ]
}

def _role_key(role):
    value = (role or "").lower()
    if "front" in value or "react" in value:
        return "frontend"
    if "back" in value or "api" in value or "python" in value or "flask" in value:
        return "backend"
    if "full" in value:
        return "fullstack"
    if "data" in value or "machine" in value or "science" in value or "learning" in value:
        return "data science"
    return "general"

def _tokens(text):
    words = re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]*", (text or "").lower())
    return [word for word in words if word not in STOP_WORDS]

def _contains_keyword(answer, keyword):
    pattern = r"\b" + re.escape(keyword.lower()) + r"\b"
    return bool(re.search(pattern, answer.lower()))

def generate_interview_questions(role, experience_level, plan_type="free", resume_questions=None, use_resume=False):
    model = get_llm_model() if get_llm_model else None
    limit = 4 if plan_type == "premium" else 2
    level = experience_level or "Mid"

    if use_resume and resume_questions:
        return [
            {
                "question": item.get("question") or item.get("text"),
                "context": item.get("context", "Resume-based question"),
                "expected_keywords": item.get("expected_keywords", [])
            }
            for item in resume_questions
        ]

    questions = [
        {
            "question": "To start, please tell me about yourself and your background.",
            "context": "Introductory icebreaker",
            "expected_keywords": ["experience", "background", "skills", "projects", "role"]
        }
    ]

    if model:
        import uuid
        import json
        prompt = f"""
        You are an elite technical interviewer. Generate {limit} highly unique, challenging, and STRICTLY DOMAIN-SPECIFIC interview questions for a {level} level {role} position.
        
        CRITICAL GUIDELINES:
        1. The questions MUST be deeply technical and specific to the '{role}' domain.
        2. DO NOT ask generic behavioral or general software engineering questions if '{role}' is a specialized field.
        3. Start with a solid fundamental technical question and progressively advance to high-level architecture or complex problem-solving.
        4. Each question should be completely different from typical common questions.
        5. Provide a 'context' explaining why this specific technical concept is crucial for a {role}.
        6. Random Seed for uniqueness: {uuid.uuid4()}

        Return a strict JSON array with this schema:
        [
          {{
            "question": "Deeply technical question text",
            "context": "Technical rationale for this question",
            "expected_keywords": ["specific_tech_term1", "specific_tech_term2"]
          }}
        ]
        """
        try:
            response = model.generate_content(prompt)
            text = response.text.strip()
            
            if "```" in text:
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.split("```")[0]

            start_idx = text.find('[')
            end_idx = text.rfind(']')
            if start_idx != -1 and end_idx != -1:
                clean_text = text[start_idx:end_idx+1]
            else:
                clean_text = text
                
            items = json.loads(clean_text)
            for item in items[:limit]:
                questions.append({
                    "question": item.get("question"),
                    "context": item.get("context"),
                    "expected_keywords": item.get("expected_keywords", [])
                })
            return questions
        except Exception as e:
            print(f"AI Interview Generation Error: {e}")

    # Fallback only if AI fails
    for item in EMERGENCY_QUESTIONS["general"][:limit]:
        questions.append({
            "question": item["question"],
            "context": f"{item.get('context', 'Interview question')} - {level} level",
            "expected_keywords": item.get("expected_keywords", [])
        })
    return questions

def evaluate_answer(question_text, user_answer, expected_keywords=None, premium=False):
    if get_ai_evaluation:
        llm_result = get_ai_evaluation(question_text, user_answer)
        if llm_result and "score" in llm_result:
            return {
                "score": int(llm_result.get("score", 0)),
                "feedback": llm_result.get("feedback", "AI evaluation completed."),
                "strengths": llm_result.get("strengths", ["Good attempt with relevant coverage."]),
                "weaknesses": llm_result.get("weaknesses", [llm_result.get("suggestions", "Add more specifics.")]),
                "suggested_answer": llm_result.get("suggested_answer", llm_result.get("suggestions", "")),
                "jarvis_response": llm_result.get("jarvis_response", "Thank you for your answer."),
                "matched_keywords": [],
                "missing_keywords": []
            }

    expected_keywords = expected_keywords or []
    answer_tokens = _tokens(user_answer)
    answer_counter = Counter(answer_tokens)
    matched = [keyword for keyword in expected_keywords if _contains_keyword(user_answer, keyword)]
    missing = [keyword for keyword in expected_keywords if keyword not in matched]

    keyword_score = (len(matched) / len(expected_keywords)) * 65 if expected_keywords else 30
    length_score = min(len(answer_tokens) / 90, 1) * 20
    specificity_terms = {"because", "example", "tradeoff", "measure", "test", "monitor", "risk", "impact"}
    specificity_score = min(sum(answer_counter.get(term, 0) for term in specificity_terms), 3) * 5
    score = max(0, min(100, round(keyword_score + length_score + specificity_score)))

    strengths = []
    if matched:
        strengths.append(f"Covered important concepts: {', '.join(matched[:4])}.")
    if len(answer_tokens) >= 45:
        strengths.append("Provided enough detail to show reasoning.")
    if any(term in answer_counter for term in ["example", "tradeoff", "impact"]):
        strengths.append("Included practical context instead of only definitions.")
    if not strengths:
        strengths.append("Answered the question and established a starting point.")

    weaknesses = []
    if missing:
        weaknesses.append(f"Could strengthen coverage of: {', '.join(missing[:4])}.")
    if len(answer_tokens) < 35:
        weaknesses.append("The answer is brief; add implementation details and a concrete example.")
    if not any(term in answer_counter for term in ["test", "monitor", "risk", "tradeoff"]):
        weaknesses.append("Mention validation, tradeoffs, or operational concerns for a stronger response.")

    suggested_answer = build_suggested_answer(question_text, expected_keywords)
    feedback = "Strong answer." if score >= 80 else "Good foundation; add depth." if score >= 55 else "Needs more technical detail and examples."

    return {
        "score": score,
        "feedback": feedback,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggested_answer": suggested_answer,
        "matched_keywords": matched,
        "missing_keywords": missing
    }

def build_suggested_answer(question_text, expected_keywords):
    concepts = ", ".join(expected_keywords[:5]) if expected_keywords else "the core concept, tradeoffs, and an example"
    return (
        f"A strong answer to '{question_text}' should explain {concepts}, then connect the idea "
        "to a concrete project scenario, mention risks or tradeoffs, and finish with how you would validate the solution."
    )

def generate_questions_from_resume(resume_text):
    if ai_generate_questions_from_resume:
        return ai_generate_questions_from_resume(resume_text)
    
    # Very basic fallback
    return [{"question": "Walk me through one resume project from requirements to deployment.", "context": "Resume project history", "expected_keywords": ["requirements", "implementation", "testing", "deployment", "impact"]}]


def chatbot_reply(message):
    text = (message or "").strip().lower()
    if not text:
        return "Share your question and I will help with interview prep, resume tips, or ATS guidance."
    if "ats" in text or "resume" in text:
        return "For better ATS score: use role keywords, add measurable outcomes, and keep sections clear (Summary, Skills, Experience, Projects)."
    if "premium" in text:
        return "Premium gives unlimited interviews, resume-based questions, and ATS scoring after upload."
    if "quiz" in text:
        return "Try the quiz page to practice fast MCQs. Correct and wrong answers include audio feedback."
    if "admin" in text:
        return "Admin powers are available under the Profile page while account type still appears as User."
    return "Focus on structure: answer with approach, implementation details, tradeoffs, and a measurable outcome."


def generate_quiz_questions(topic="software engineering", count=10):
    model = get_llm_model() if get_llm_model else None
    if not model:
        # Emergency hardcoded fallback
        return [
            {
                "question": "Which React hook is used to manage local component state?",
                "options": ["useEffect", "useState", "useMemo", "useRef"],
                "answer_index": 1,
            },
            {
                "question": "What is the purpose of JWT in web applications?",
                "options": ["Image compression", "Authentication token", "Database backup", "Code linting"],
                "answer_index": 1,
            }
        ]

    prompt = f"""
    You are an expert technical examiner. Generate {max(10, count)} highly diverse, non-repetitive, and EXTREMELY DOMAIN-SPECIFIC multiple-choice quiz questions on the topic of '{topic}'.
    
    CRITICAL GUIDELINES:
    1. Questions MUST be deeply technical and STRICTLY related to the domain of '{topic}'.
    2. Start with easy fundamental questions and progressively increase difficulty to advanced/expert levels. 
    3. Ensure options are plausible but only one is clearly correct.
    4. Avoid generic "What is X?" questions; prefer scenario-based or deep conceptual probes.
    5. Random Seed for uniqueness: {random.randint(10000, 99999)}.

    Return ONLY a strict JSON array with this schema:
    [
      {{
        "question": "Deeply technical question text",
        "options": ["Plausible Option 1", "Plausible Option 2", "Plausible Option 3", "Plausible Option 4"],
        "answer_index": 0
      }}
    ]
    
    Rules:
    - Exactly 4 options per question
    - answer_index must be between 0 and 3
    - No markdown formatting like ```json, no extra commentary
    """
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        import json
        
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.split("```")[0]
        
        start_idx = text.find('[')
        end_idx = text.rfind(']')
        if start_idx != -1 and end_idx != -1:
            clean_text = text[start_idx:end_idx+1]
        else:
            clean_text = text
            
        items = json.loads(clean_text)
        cleaned = []
        for item in items:
            options = item.get("options", [])[:4]
            if len(options) < 2: continue
            while len(options) < 4: options.append("N/A")
            try:
                answer_index = int(item.get("answer_index", 0))
            except:
                answer_index = 0
            if answer_index < 0 or answer_index >= len(options): answer_index = 0
            cleaned.append({
                "question": (item.get("question") or "Quiz question").strip(),
                "options": options,
                "answer_index": answer_index,
            })
        return cleaned[:count]
    except Exception as e:
        print(f"Quiz Generation Error: {e}")
        return []
