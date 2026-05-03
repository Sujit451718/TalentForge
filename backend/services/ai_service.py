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

    # Define a significantly better fallback that provides 10 questions and is domain-aware
    def get_fallback():
        print(f"Falling back to domain-aware quiz for topic: {full_topic}")
        
        physics_fallback = [
            {"question": "What is the SI unit of Force?", "options": ["Joule", "Newton", "Watt", "Pascal"], "answer_index": 1},
            {"question": "Which law states that for every action, there is an equal and opposite reaction?", "options": ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Law of Gravitation"], "answer_index": 2},
            {"question": "What is the acceleration due to gravity on Earth (approx)?", "options": ["5.8 m/s²", "9.8 m/s²", "12.4 m/s²", "3.2 m/s²"], "answer_index": 1},
            {"question": "Which of these is a vector quantity?", "options": ["Mass", "Temperature", "Velocity", "Time"], "answer_index": 2},
            {"question": "What is the speed of light in a vacuum?", "options": ["3 x 10⁸ m/s", "3 x 10⁶ m/s", "3 x 10¹⁰ m/s", "3 x 10⁵ m/s"], "answer_index": 0},
            {"question": "Who proposed the Theory of General Relativity?", "options": ["Isaac Newton", "Albert Einstein", "Nikola Tesla", "Marie Curie"], "answer_index": 1},
            {"question": "What is the primary particle involved in electric current in a wire?", "options": ["Proton", "Neutron", "Electron", "Positron"], "answer_index": 2},
            {"question": "What does a barometer measure?", "options": ["Temperature", "Humidity", "Atmospheric Pressure", "Wind Speed"], "answer_index": 2},
            {"question": "In thermodynamics, what is the absolute zero temperature in Celsius?", "options": ["0°C", "-100°C", "-273.15°C", "-373.15°C"], "answer_index": 2},
            {"question": "What is the unit of electrical resistance?", "options": ["Volt", "Ampere", "Ohm", "Farad"], "answer_index": 2}
        ]

        ds_fallback = [
            {"question": "What is the most common language used for Data Science?", "options": ["Java", "C++", "Python", "PHP"], "answer_index": 2},
            {"question": "Which algorithm is used for classification?", "options": ["K-Means", "Linear Regression", "Random Forest", "Apriori"], "answer_index": 2},
            {"question": "What does 'EDA' stand for in Data Science?", "options": ["Effective Data Analysis", "Exploratory Data Analysis", "Estimated Data Amount", "Extended Data Array"], "answer_index": 1},
            {"question": "Which library is primarily used for data manipulation in Python?", "options": ["NumPy", "Matplotlib", "Pandas", "Scikit-Learn"], "answer_index": 2},
            {"question": "What is 'overfitting' in Machine Learning?", "options": ["Model performs well on test data only", "Model performs well on training data only", "Model is too simple", "Model has no parameters"], "answer_index": 1},
            {"question": "What is a p-value in statistics?", "options": ["The probability of the null hypothesis being true", "The probability of observing the result by chance", "The power of the test", "The effect size"], "answer_index": 1},
            {"question": "Which of these is a supervised learning task?", "options": ["Clustering", "Regression", "Dimensionality Reduction", "Association Rule Mining"], "answer_index": 1},
            {"question": "What is the purpose of a confusion matrix?", "options": ["To visualize data", "To evaluate classification performance", "To clean data", "To train a model"], "answer_index": 1},
            {"question": "In SQL, which command is used to remove duplicates from a result set?", "options": ["UNIQUE", "DISTINCT", "ONLY", "SINGLE"], "answer_index": 1},
            {"question": "What does 'NLP' stand for?", "options": ["Natural Language Processing", "Neural Logic Programming", "Network Layer Protocol", "Normal Language Process"], "answer_index": 0}
        ]

        generic_fallback = [
            {"question": f"In {full_topic}, what is a primary consideration for quality?", "options": ["Validation", "Randomness", "Manual Labor", "Ignoring errors"], "answer_index": 0},
            {"question": f"Which tool is commonly used in {full_topic}?", "options": ["Standard Industry Tools", "Random Guessing", "Varies by project", "None"], "answer_index": 0},
            {"question": f"Why is scalability important in {full_topic}?", "options": ["To handle growth", "To look good", "To waste space", "To increase cost"], "answer_index": 0},
            {"question": f"What is a 'bottleneck' in {full_topic}?", "options": ["A constraint", "A feature", "A fast path", "A decoration"], "answer_index": 0},
            {"question": f"How do professionals in {full_topic} handle errors?", "options": ["Monitoring and fixing", "Ignoring them", "Deleting code", "Asking users to fix"], "answer_index": 0},
            {"question": f"What is the role of documentation in {full_topic}?", "options": ["Knowledge sharing", "Wasting time", "Increasing file size", "Hiding bugs"], "answer_index": 0},
            {"question": f"Which principle is core to {full_topic}?", "options": ["Efficiency", "Complexity", "Manual work", "Randomness"], "answer_index": 0},
            {"question": f"What is 'technical debt' in {full_topic}?", "options": ["Future cost of quick fixes", "Bank loans", "Salary", "Hardware cost"], "answer_index": 0},
            {"question": f"What is 'version control' for?", "options": ["Tracking changes", "Blocking access", "Deleting files", "Increasing cost"], "answer_index": 0},
            {"question": f"How is success measured in {full_topic}?", "options": ["Meeting requirements", "Number of files", "Lines of code", "Meeting count"], "answer_index": 0}
        ]

        if "physics" in full_topic.lower():
            return physics_fallback[:count]
        if "data science" in full_topic.lower() or "ds" == clean_topic:
            return ds_fallback[:count]
            
        return generic_fallback[:count]

    if not model:
        return get_fallback()

    prompt = f"""
    You are an expert technical examiner. Generate {max(10, count)} highly diverse, non-repetitive, and EXTREMELY DOMAIN-SPECIFIC multiple-choice quiz questions on the topic of '{full_topic}'.
    
    CRITICAL GUIDELINES:
    1. Questions MUST be deeply technical and STRICTLY related to the core concepts of '{full_topic}'.
    2. If the topic is 'Physics', ask about specific laws, equations, or physical phenomena. DO NOT ask general questions.
    3. If the topic is 'Data Science', ask about specific algorithms, statistical tests, or data modeling techniques.
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
        from services.llm_service import extract_json
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        items = extract_json(text)
        if not items or not isinstance(items, list):
            # Try one more time if it's a dictionary instead of list
            if isinstance(items, dict) and "questions" in items:
                items = items["questions"]
            else:
                return get_fallback()
            
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
        
        if len(cleaned) < 5:
            return get_fallback()
            
        return cleaned[:count]
    except Exception as e:
        print(f"Quiz Generation Error: {e}")
        return get_fallback()
