import re
import random
import json
import uuid
from collections import Counter

try:
    from services.llm_service import get_ai_evaluation, get_llm_model, generate_questions_from_resume as ai_generate_questions_from_resume, extract_json
except Exception as e:
    print(f"Error importing llm_service functions: {e}")
    get_ai_evaluation = None
    get_llm_model = None
    ai_generate_questions_from_resume = None
    extract_json = None

STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has",
    "have", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to",
    "with", "we", "will", "you", "your"
}

# Removed hardcoded EMERGENCY_QUESTIONS to ensure full AI-driven interaction.

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

    questions = []

    if not model:
        # If AI model is not available, we return a helpful message instead of generic questions
        questions.append({
            "question": "I apologize, but my AI neural network is currently offline. Please ensure the GOOGLE_API_KEY is correctly configured to start a dynamic interview.",
            "context": "System Alert",
            "expected_keywords": []
        })
        return questions

    prompt = f"""
    You are Jarvis, an elite technical interviewer. Generate {limit} highly unique, challenging, and EXTREMELY DOMAIN-SPECIFIC interview questions for a {level} level {role} position.
    
    CRITICAL GUIDELINES:
    1. Every single question MUST be deeply technical and specific to the '{role}' domain.
    2. DO NOT ask generic introductory questions like "Tell me about yourself".
    3. Start IMMEDIATELY with a technical probe or architecture scenario relevant to {role}.
    4. Provide a 'context' explaining why this specific technical concept is crucial for a {role}.
    5. Random Seed for uniqueness: {uuid.uuid4()}

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
        items = extract_json(response.text)
        
        if items and isinstance(items, list):
            for item in items[:limit]:
                questions.append({
                    "question": item.get("question"),
                    "context": item.get("context"),
                    "expected_keywords": item.get("expected_keywords", [])
                })
        return questions
    except Exception as e:
        print(f"AI Interview Generation Error: {e}")
        questions.append({
            "question": "I encountered an error while generating dynamic questions. Please check your API connectivity.",
            "context": "System Error",
            "expected_keywords": []
        })
        return questions

def evaluate_answer(question_text, user_answer, expected_keywords=None, premium=False):
    # Always prioritize AI evaluation from llm_service
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

    # If AI fails, we no longer provide a 'fake' heuristic score. 
    # We return a low score and a message indicating AI failure.
    return {
        "score": 0,
        "feedback": "AI Evaluation failed. Please check your Google AI Studio API key.",
        "strengths": [],
        "weaknesses": ["AI Service Unavailable"],
        "suggested_answer": "Unable to generate suggestion without AI.",
        "jarvis_response": "I'm having trouble analyzing your answer. Please check my API configuration.",
        "matched_keywords": [],
        "missing_keywords": []
    }

def build_suggested_answer(question_text, expected_keywords):
    concepts = ", ".join(expected_keywords[:5]) if expected_keywords else "the core concept, tradeoffs, and an example"
    return (
        f"A strong answer to '{question_text}' should explain {concepts}, then connect the idea "
        "to a concrete project scenario, mention risks or tradeoffs, and finish with how you would validate the solution."
    )

def generate_questions_from_resume(resume_text):
    model = get_llm_model()
    if not model:
        return [{
            "question": "AI Service is currently offline. Please configure your GOOGLE_API_KEY to generate personalized questions from your resume.", 
            "context": "System Alert", 
            "expected_keywords": []
        }]
    
    prompt = f"""
    You are Jarvis, an expert technical recruiter. Analyze the following resume text and generate 5 highly personalized, challenging, and domain-specific technical interview questions.
    
    CRITICAL GUIDELINES:
    1. Each question must be DIRECTLY LINKED to a specific experience, skill, or project mentioned in the resume.
    2. Provide a 'context' explaining which part of the resume triggered the question.
    
    Resume Text:
    {resume_text}
    
    Return a strict JSON list of objects:
    [
        {{
            "question": "The personalized interview question",
            "context": "Rationale based on the resume",
            "expected_keywords": ["keyword1", "keyword2"]
        }}
    ]
    """
    
    try:
        response = model.generate_content(prompt)
        items = extract_json(response.text)
        if items and isinstance(items, list):
            return items[:5]
        return []
    except Exception as e:
        print(f"Error generating resume questions: {e}")
        return []


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

    # Topic-specific styles to ensure the "format" is different for each domain
    topic_styles = {
        "Physics": "Focus on numerical problems, universal constants, experimental setups, and specific physical laws (e.g., Optics, Electromagnetism, Quantum Mechanics). Use a formal, scientific tone.",
        "Data Science": "Focus on interpreting model metrics (Precision/Recall), statistical significance, data preprocessing steps, and algorithm selection for specific business problems. Use a professional, analytical tone.",
        "Software Engineering": "Focus on design patterns, architectural tradeoffs, debugging complex system behaviors, and clean code principles. Include pseudocode logic where possible.",
        "General Science": "Focus on fundamental biological processes, chemical reactions, periodic table properties, and notable scientific history/methodology."
    }
    
    style_guide = topic_styles.get(full_topic, "Focus on deep technical concepts, practical application, and domain-specific terminology.")

    # Define a significantly better fallback that provides 10 questions and is domain-aware
    def get_fallback():
        print(f"Falling back to domain-aware quiz for topic: {full_topic}")
        
        physics_fallback = [
            {"question": "Calculate the work done (W) when a force of 10N moves an object 5m in the direction of the force.", "options": ["50 Joules", "2 Joules", "15 Joules", "0.5 Joules"], "answer_index": 0},
            {"question": "In a vacuum, if a hammer and a feather are dropped simultaneously, which reaches the ground first?", "options": ["The hammer", "The feather", "Both at the same time", "It depends on the height"], "answer_index": 2},
            {"question": "Which constant represents the speed of light in vacuum?", "options": ["g", "c", "h", "G"], "answer_index": 1},
            {"question": "What happens to the resistance of a conductor if its temperature increases?", "options": ["Increases", "Decreases", "Stays the same", "Becomes zero"], "answer_index": 0},
            {"question": "What is the primary phenomenon responsible for the 'blue' appearance of the sky?", "options": ["Refraction", "Diffraction", "Rayleigh Scattering", "Total Internal Reflection"], "answer_index": 2},
            {"question": "A 100W bulb is used for 10 hours. How much energy is consumed in kWh?", "options": ["1 kWh", "10 kWh", "0.1 kWh", "100 kWh"], "answer_index": 0},
            {"question": "Which particle is responsible for carrying the electromagnetic force?", "options": ["Gluon", "W Boson", "Photon", "Graviton"], "answer_index": 2},
            {"question": "What is the focal length of a plane mirror?", "options": ["Zero", "1 meter", "Infinity", "Depends on size"], "answer_index": 2},
            {"question": "In the equation E=mc², what does 'm' represent?", "options": ["Momentum", "Mass", "Motion", "Magnetic field"], "answer_index": 1},
            {"question": "What is the unit of magnetic flux density?", "options": ["Weber", "Tesla", "Henry", "Farad"], "answer_index": 1}
        ]

        ds_fallback = [
            {"question": "When should you prefer the F1-Score over Accuracy as a performance metric?", "options": ["When the classes are balanced", "When the classes are highly imbalanced", "When training time is limited", "When using deep learning"], "answer_index": 1},
            {"question": "Which technique is primarily used to reduce the dimensionality of a high-dimensional dataset?", "options": ["K-Means", "PCA (Principal Component Analysis)", "Linear Regression", "Cross Validation"], "answer_index": 1},
            {"question": "In a Random Forest, what is the purpose of 'Bagging'?", "options": ["To increase bias", "To reduce variance", "To speed up training", "To prune the trees"], "answer_index": 1},
            {"question": "What is the result of a 'Left Join' in SQL if the right table has no matching record?", "options": ["Error", "Zero", "NULL", "An empty string"], "answer_index": 2},
            {"question": "Which distribution is characterized by the Mean, Median, and Mode all being equal?", "options": ["Poisson", "Binomial", "Normal (Gaussian)", "Exponential"], "answer_index": 2},
            {"question": "What is the main goal of 'Regularization' in Machine Learning?", "options": ["To speed up convergence", "To prevent overfitting", "To increase model complexity", "To clean the data"], "answer_index": 1},
            {"question": "In Python, which function is used to check for missing values in a Pandas DataFrame?", "options": ["df.null()", "df.isna()", "df.empty()", "df.check()"], "answer_index": 1},
            {"question": "What is a 'p-value' threshold of 0.05 generally intended to indicate?", "options": ["95% probability the hypothesis is true", "Statistical significance", "A 5% error in measurement", "The effect size"], "answer_index": 1},
            {"question": "Which of these is NOT a supervised learning algorithm?", "options": ["SVM", "Logistic Regression", "K-Means Clustering", "Decision Tree"], "answer_index": 2},
            {"question": "What does the 'ReLU' activation function return for an input of -5?", "options": ["-5", "1", "0", "0.5"], "answer_index": 2}
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
    You are an expert technical examiner specialized in {full_topic}. 
    Generate {max(10, count)} highly diverse, non-repetitive, and EXTREMELY DOMAIN-SPECIFIC multiple-choice quiz questions.
    
    STYLE GUIDE for {full_topic}:
    {style_guide}
    
    CRITICAL GUIDELINES:
    1. NEVER use generic templates like "Which of the following is a core concept in...".
    2. Every question must be a unique technical probe. 
    3. Vary the question types: 
       - 40% Numerical or Problem-solving (requiring calculation or logic).
       - 30% Scenario-based (e.g., 'If X happens in Y condition, what is the result?').
       - 30% Conceptual/Deep-dive (testing understanding of underlying mechanisms).
    4. Options must be technical and challenging, designed to test a true expert.
    5. Random Seed: {uuid.uuid4()} - YOU MUST GENERATE A COMPLETELY FRESH BATCH OF QUESTIONS.

    Return ONLY a strict JSON array with this schema:
    [
      {{
        "question": "The specific, technical question",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer_index": 0
      }}
    ]
    
    Rules:
    - Exactly 4 options per question.
    - answer_index must be between 0 and 3.
    - Return ONLY the JSON array.
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
