import re
import random
import json
import uuid
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
    try:
        from services.llm_service import chatbot_reply_ai
        return chatbot_reply_ai(message)
    except Exception:
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
    
    # Handle abbreviations and specific domains
    topic_mapping = {
        "gs": "General Science",
        "ds": "Data Science",
        "ml": "Machine Learning",
        "ai": "Artificial Intelligence",
        "se": "Software Engineering",
        "qa": "Quality Assurance",
        "dsa": "Data Structures and Algorithms",
        "react": "React.js and Frontend Development",
        "node": "Node.js and Backend Development",
        "sql": "Database Management and SQL",
        "py": "Python Programming",
        "cpp": "C++ Programming",
        "js": "JavaScript",
        "cloud": "Cloud Computing (AWS/Azure/GCP)",
        "physics": "Physics (Mechanics, Thermodynamics, Electromagnetism)"
    }
    
    clean_topic = topic.lower().strip()
    full_topic = topic_mapping.get(clean_topic, topic)

    # Define a significantly better fallback that provides 10 questions
    def get_fallback():
        print(f"Falling back to template quiz for topic: {full_topic}")
        # Template-based questions that adapt slightly better to the topic
        templates = [
            {
                "question": f"In the context of {full_topic}, what is a primary consideration for ensuring high-quality outcomes?",
                "options": ["Rigorous validation and testing", "Increasing manual complexity", "Avoiding documentation", "Randomized implementation"],
                "answer_index": 0
            },
            {
                "question": f"Which of the following best describes a 'bottleneck' within a {full_topic} workflow?",
                "options": ["A resource or stage that limits overall throughput", "A decorative architectural element", "A highly efficient pathway", "A type of data variable"],
                "answer_index": 0
            },
            {
                "question": f"How is 'scalability' typically addressed when working in {full_topic}?",
                "options": ["Designing systems to handle increased load efficiently", "Decreasing the number of users", "Hardcoding all configurations", "Focusing solely on visual aesthetics"],
                "answer_index": 0
            },
            {
                "question": f"Why is 'modular design' often preferred in {full_topic} projects?",
                "options": ["It improves maintainability and reusability", "It makes the system harder to understand", "It increases total development time", "It is only used for small projects"],
                "answer_index": 0
            },
            {
                "question": f"What does the term 'latency' usually refer to in {full_topic} systems?",
                "options": ["The time delay before a transfer of data begins", "The total storage capacity", "The number of lines of code", "The cost of the hardware"],
                "answer_index": 0
            },
            {
                "question": f"In {full_topic}, what is the purpose of 'version control'?",
                "options": ["Tracking and managing changes to project assets", "Limiting access to the internet", "Speeding up hardware performance", "Automatically fixing all bugs"],
                "answer_index": 0
            },
            {
                "question": f"Which principle is most associated with 'efficiency' in {full_topic}?",
                "options": ["Optimizing resource usage for maximum output", "Using the most expensive tools", "Working without a plan", "Increasing the number of steps"],
                "answer_index": 0
            },
            {
                "question": f"What is a common 'trade-off' encountered in {full_topic} decision making?",
                "options": ["Speed vs. Accuracy", "Day vs. Night", "Left vs. Right", "Yes vs. No"],
                "answer_index": 0
            },
            {
                "question": f"How does 'automation' benefit a {full_topic} environment?",
                "options": ["By reducing repetitive manual tasks and errors", "By requiring more manual labor", "By slowing down the production line", "By making processes unpredictable"],
                "answer_index": 0
            },
            {
                "question": f"What is the ultimate goal of a professional working in {full_topic}?",
                "options": ["Delivering value through effective problem solving", "Writing the longest possible reports", "Avoiding all team collaboration", "Maximizing system downtime"],
                "answer_index": 0
            }
        ]
        return templates[:count]

    if not model:
        return get_fallback()

    prompt = f"""
    You are an expert technical examiner. Generate {max(10, count)} highly diverse, non-repetitive, and EXTREMELY DOMAIN-SPECIFIC multiple-choice quiz questions on the topic of '{full_topic}'.
    
    CRITICAL GUIDELINES:
    1. Questions MUST be deeply technical and STRICTLY related to the core concepts of '{full_topic}'.
    2. If the topic is 'Physics', ask about specific laws (Newtonian, Thermodynamics, Electromagnetism), quantum mechanics, or relativity. DO NOT ask general questions.
    3. If the topic is 'Data Science', ask about specific algorithms (Random Forest, SVM), statistical tests (p-values, chi-square), or data engineering patterns.
    4. Start with fundamental questions and progressively increase difficulty to advanced/expert levels. 
    5. Ensure options are plausible but only one is clearly correct.
    6. Random Seed for uniqueness: {uuid.uuid4()} - YOU MUST GENERATE A COMPLETELY UNIQUE AND NEW SET OF QUESTIONS EVERY TIME.

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
    - Return ONLY the JSON array, no markdown or commentary.
    """
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Robust JSON extraction
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
            
        items = json.loads(clean_text.strip())
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
        
        if not cleaned:
            return get_fallback()
            
        return cleaned[:count]
    except Exception as e:
        print(f"Quiz Generation Error: {e}")
        return get_fallback()
