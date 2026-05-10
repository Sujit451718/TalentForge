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

<<<<<<< HEAD
BASIC_QUESTIONS = {
    "frontend": [
        {
            "question": "How do you manage state in a React application?",
            "context": "Basic React fundamentals",
            "expected_keywords": ["state", "props", "context", "hooks", "useState", "useReducer"]
        },
        {
            "question": "What happens when a component re-renders in React?",
            "context": "Rendering model",
            "expected_keywords": ["render", "props", "state", "virtual dom", "diff", "memo"]
        },
        {
            "question": "How would you handle loading and error states when calling an API?",
            "context": "Frontend reliability",
            "expected_keywords": ["loading", "error", "try", "catch", "axios", "fallback"]
        }
    ],
    "backend": [
        {
            "question": "What makes a REST API well designed?",
            "context": "API design basics",
            "expected_keywords": ["resources", "methods", "status codes", "validation", "pagination"]
        },
        {
            "question": "How do you securely store user passwords?",
            "context": "Authentication fundamentals",
            "expected_keywords": ["hash", "salt", "bcrypt", "never plaintext", "compare"]
        },
        {
            "question": "Why are database indexes useful?",
            "context": "Database performance",
            "expected_keywords": ["query", "performance", "lookup", "unique", "tradeoff"]
        }
    ],
    "fullstack": [
        {
            "question": "How would you design authentication between a React app and Flask API?",
            "context": "Full-stack architecture",
            "expected_keywords": ["jwt", "authorization", "token", "bcrypt", "protected route"]
        },
        {
            "question": "How do you keep frontend and backend validation consistent?",
            "context": "Data integrity",
            "expected_keywords": ["schema", "validation", "server", "client", "errors"]
        },
        {
            "question": "What would you monitor after deploying a full-stack application?",
            "context": "Production readiness",
            "expected_keywords": ["logs", "latency", "errors", "database", "uptime"]
        }
    ],
    "data science": [
        {
            "question": "Explain the difference between L1 and L2 regularization.",
            "context": "Machine Learning fundamentals",
            "expected_keywords": ["lasso", "ridge", "sparsity", "penalty", "overfitting"]
        },
        {
            "question": "How do you handle missing values in a dataset?",
            "context": "Data preprocessing",
            "expected_keywords": ["imputation", "mean", "median", "dropping", "categorical"]
        },
        {
            "question": "What is the bias-variance tradeoff?",
            "context": "Model evaluation",
            "expected_keywords": ["overfitting", "underfitting", "complexity", "error"]
        }
    ],
    "general": [
        {
            "question": "Tell me about a technical problem you solved and the tradeoffs you considered.",
            "context": "Problem solving",
            "expected_keywords": ["problem", "tradeoff", "impact", "decision", "result"]
        },
        {
            "question": "How do you debug a production issue?",
            "context": "Engineering process",
            "expected_keywords": ["logs", "reproduce", "metrics", "rollback", "fix"]
        },
        {
            "question": "How do you write maintainable code?",
            "context": "Software quality",
            "expected_keywords": ["readable", "tests", "modular", "naming", "review"]
        }
    ]
}

ADVANCED_QUESTIONS = {
    "frontend": [
        {
            "question": "How would you optimize a React dashboard that becomes slow with large datasets?",
            "context": "Premium advanced frontend question",
            "expected_keywords": ["memoization", "virtualization", "profiling", "pagination", "debounce", "cache"]
        },
        {
            "question": "Explain how you would design a reusable component system for a SaaS dashboard.",
            "context": "Premium design-system question",
            "expected_keywords": ["tokens", "accessibility", "variants", "composition", "documentation"]
        }
    ],
    "backend": [
        {
            "question": "How would you scale a Flask API backed by MongoDB for heavy interview traffic?",
            "context": "Premium backend scaling question",
            "expected_keywords": ["indexes", "caching", "workers", "connection pooling", "queue", "rate limit"]
        },
        {
            "question": "How would you design secure JWT refresh and logout behavior?",
            "context": "Premium authentication architecture",
            "expected_keywords": ["refresh token", "expiry", "revocation", "httpOnly", "rotation"]
        }
    ],
    "fullstack": [
        {
            "question": "Design a real-time AI interview system with streaming feedback and persisted analytics.",
            "context": "Premium architecture question",
            "expected_keywords": ["websocket", "queue", "streaming", "analytics", "persistence", "latency"]
        },
        {
            "question": "How would you prevent abuse in a subscription-based AI product?",
            "context": "Premium product engineering question",
            "expected_keywords": ["rate limit", "quota", "billing", "audit", "monitoring", "authorization"]
        }
    ],
    "data science": [
        {
            "question": "How would you design an A/B test for a new recommendation algorithm?",
            "context": "Premium experimental design",
            "expected_keywords": ["sample size", "p-value", "significance", "control group", "metrics"]
        },
        {
            "question": "Explain the architecture of a Transformer model and its attention mechanism.",
            "context": "Premium Deep Learning question",
            "expected_keywords": ["self-attention", "encoder", "decoder", "embeddings", "multi-head"]
        }
    ],
    "general": [
        {
            "question": "How would you refactor a legacy module while keeping production risk low?",
            "context": "Premium senior engineering question",
            "expected_keywords": ["tests", "incremental", "feature flags", "observability", "rollback"]
        },
        {
            "question": "Describe how you evaluate technical tradeoffs for a new architecture.",
            "context": "Premium system design question",
            "expected_keywords": ["requirements", "constraints", "scalability", "cost", "risk", "maintainability"]
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
=======
# Removed hardcoded EMERGENCY_QUESTIONS to ensure full AI-driven interaction.
>>>>>>> c385e3efb5d1489561570b519429f833559c8ece

def generate_interview_questions(role, experience_level, plan_type="free", resume_questions=None, use_resume=False):
    role_key = _role_key(role)
    selected = list(BASIC_QUESTIONS.get(role_key, BASIC_QUESTIONS["general"]))

    if plan_type == "premium":
        if use_resume and resume_questions:
            selected = [
                {
                    "question": item.get("question") or item.get("text"),
                    "context": item.get("context", "Resume-based question"),
                    "expected_keywords": item.get("expected_keywords", [])
                }
                for item in resume_questions
            ]
        else:
            selected += ADVANCED_QUESTIONS.get(role_key, ADVANCED_QUESTIONS["general"])

    limit = 4 if plan_type == "premium" else 2
    level = experience_level or "Mid"
<<<<<<< HEAD
    questions = [
        {
            "question": "To start, please tell me about yourself and your background.",
            "context": "Introductory icebreaker",
            "expected_keywords": ["experience", "background", "skills", "projects", "role"]
        }
    ]

    model = get_llm_model() if get_llm_model else None

    if model and not (use_resume and resume_questions):
        import uuid
        prompt = f"""
        You are an elite technical interviewer. Generate {limit} highly unique, challenging, and STICKLY DOMAIN-SPECIFIC interview questions for a {level} level {role} position.
        
        CRITICAL GUIDELINES:
        1. The questions MUST be deeply technical and specific to the '{role}' domain.
        2. DO NOT ask generic behavioral or general software engineering questions if '{role}' is a specialized field (like Data Science or Frontend).
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
            import json
            
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
        except Exception:
            pass # fallback to hardcoded if LLM fails

    for item in selected[:limit]:
        questions.append({
            "question": item["question"],
            "context": f"{item.get('context', 'Interview question')} - {level} level",
            "expected_keywords": item.get("expected_keywords", [])
        })
    return questions
=======

    # Define high-quality manual fallback questions for interviews
    manual_interview_questions = [
        {"question": f"Explain the core architectural principles you follow when building a {role} system.", "context": "System Architecture", "expected_keywords": ["scalability", "maintainability", "security"]},
        {"question": f"Walk me through a complex technical challenge you faced while working as a {role} and how you resolved it.", "context": "Problem Solving", "expected_keywords": ["approach", "solution", "outcome"]},
        {"question": f"How do you handle performance optimization and bottleneck identification in a {role} environment?", "context": "Optimization", "expected_keywords": ["profiling", "latency", "throughput"]},
        {"question": f"Describe your testing strategy for ensuring the reliability of a {role} project.", "context": "Quality Assurance", "expected_keywords": ["unit test", "integration", "coverage"]}
    ]

    # Mandatory introductory question
    questions = [
        {
            "question": "To start, please provide a brief self-introduction focusing on your technical background and key achievements.",
            "context": "Professional Introduction",
            "expected_keywords": ["experience", "projects", "skills", "role", "background"]
        }
    ]

    if use_resume and resume_questions:
        questions.extend([
            {
                "question": item.get("question") or item.get("text"),
                "context": item.get("context", "Resume-based question"),
                "expected_keywords": item.get("expected_keywords", [])
            }
            for item in resume_questions
        ])
        return questions

    if not model:
        print(f"!!! API Key not working. Switching to Manual Interview Mode for {role} !!!")
        questions.extend(manual_interview_questions[:limit-1])
        return questions

    prompt = f"""
    You are Jarvis, an elite technical interviewer. Generate {limit} highly unique, challenging, and EXTREMELY DOMAIN-SPECIFIC interview questions for a {level} level {role} position.
    
    CRITICAL GUIDELINES:
    1. Every single question MUST be deeply technical and specific to the '{role}' domain.
    2. Start IMMEDIATELY with a technical probe or architecture scenario relevant to {role}.
    3. Random Seed: {uuid.uuid4()}

    Return a strict JSON array with this schema:
    [
      {{
        "question": "Technical question text",
        "context": "Rationale",
        "expected_keywords": ["term1", "term2"]
      }}
    ]
    """
    try:
        response = model.generate_content(prompt)
        items = extract_json(response.text)
        
        if items and isinstance(items, list):
            return items[:limit]
        return manual_interview_questions[:limit]
    except Exception as e:
        print(f"AI Interview Error: {e}. Switching to Manual Mode.")
        return manual_interview_questions[:limit]
>>>>>>> c385e3efb5d1489561570b519429f833559c8ece

def evaluate_answer(question_text, user_answer, expected_keywords=None, premium=False):
    # Always try AI evaluation first
    if get_ai_evaluation:
        try:
            llm_result = get_ai_evaluation(question_text, user_answer)
            if llm_result and "score" in llm_result:
                return {
                    "score": int(llm_result.get("score", 0)),
                    "feedback": llm_result.get("feedback", "AI evaluation completed."),
                    "strengths": llm_result.get("strengths", ["Good attempt."]),
                    "weaknesses": llm_result.get("weaknesses", ["Add more details."]),
                    "suggested_answer": llm_result.get("suggested_answer", ""),
                    "jarvis_response": llm_result.get("jarvis_response", "Interesting perspective."),
                    "matched_keywords": [],
                    "missing_keywords": []
                }
        except:
            pass

    # Manual Fallback Evaluation Logic
    print("!!! API Evaluation failing. Switching to Manual Evaluation Mode !!!")
    expected_keywords = expected_keywords or ["technical", "process", "implementation"]
    matched = [k for keyword in expected_keywords if (k := keyword.lower()) in user_answer.lower()]
    score = 40 + (len(matched) * 10)
    score = min(score, 85) # Cap manual score
    
    return {
        "score": score,
        "feedback": "Manual mode evaluation based on keyword coverage. Re-configure API key for detailed AI feedback.",
        "strengths": ["Answered technical components."],
        "weaknesses": ["Detailed AI analysis unavailable."],
        "suggested_answer": "Focus on Star method: Situation, Task, Action, Result.",
        "jarvis_response": "I've analyzed your answer using my manual protocols. Well done.",
        "matched_keywords": matched,
        "missing_keywords": []
    }

def build_suggested_answer(question_text, expected_keywords):
    concepts = ", ".join(expected_keywords[:5]) if expected_keywords else "the core concept, tradeoffs, and an example"
    return (
        f"A strong answer to '{question_text}' should explain {concepts}, then connect the idea "
        "to a concrete project scenario, mention risks or tradeoffs, and finish with how you would validate the solution."
    )

def generate_questions_from_resume(resume_text):
<<<<<<< HEAD
    skill_terms = [
        "react", "angular", "python", "flask", "django", "mongodb", "mysql", "aws",
        "docker", "kubernetes", "node", "typescript", "machine learning", "nlp",
        "rest", "graphql", "ci/cd"
    ]
    lower_resume = resume_text.lower()
    detected = [term for term in skill_terms if term in lower_resume]
    detected = detected[:5] or ["your recent project", "your strongest technical skill", "a system you designed"]

    questions = []
    for term in detected:
        questions.append({
            "question": f"Your resume mentions {term}. Can you describe a project where you used it and the hardest technical decision you made?",
            "context": f"Generated from resume keyword: {term}",
            "expected_keywords": [term, "project", "decision", "tradeoff", "result"]
        })

    while len(questions) < 5:
        questions.append({
            "question": "Walk me through one resume project from requirements to deployment.",
            "context": "Generated from resume project history",
            "expected_keywords": ["requirements", "implementation", "testing", "deployment", "impact"]
        })

    return questions[:5]
=======
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
>>>>>>> c385e3efb5d1489561570b519429f833559c8ece


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
<<<<<<< HEAD
    fallback_bank = [
        {
            "question": "Which React hook is used to manage local component state?",
            "options": ["useEffect", "useState", "useMemo", "useRef"],
            "answer_index": 1,
        },
        {
            "question": "What is the purpose of JWT in web applications?",
            "options": ["Image compression", "Authentication token", "Database backup", "Code linting"],
            "answer_index": 1,
        },
        {
            "question": "Which HTTP status code means resource not found?",
            "options": ["200", "201", "404", "500"],
            "answer_index": 2,
        },
        {
            "question": "Why is password hashing used?",
            "options": ["To speed up login", "To store plaintext safely", "To protect credentials if DB leaks", "To avoid encryption"],
            "answer_index": 2,
        },
        {
            "question": "Which database index improves query speed?",
            "options": ["Unique index", "Slow index", "Write-only index", "Virtual index"],
            "answer_index": 0,
        },
        {
            "question": "What does CORS primarily control?",
            "options": ["Cross-origin API access", "CPU usage", "Code coverage", "Schema migration"],
            "answer_index": 0,
        },
        {
            "question": "Which is best for handling async API calls in JS?",
            "options": ["while loop", "setTimeout only", "async/await", "switch case"],
            "answer_index": 2,
        },
        {
            "question": "What is a benefit of unit testing?",
            "options": ["Larger bundles", "Faster bug detection", "No need for reviews", "Removes CI"],
            "answer_index": 1,
        },
        {
            "question": "Which practice helps production reliability?",
            "options": ["No logs", "No alerts", "Monitoring and alerting", "Skipping health checks"],
            "answer_index": 2,
        },
        {
            "question": "What does ATS mean in hiring context?",
            "options": ["Application Tracking System", "Applicant Tracking System", "App Testing Suite", "Automated Talent Score"],
            "answer_index": 1,
        },
    ]
    random.shuffle(fallback_bank)
    fallback = fallback_bank[: max(10, count)]

=======
>>>>>>> c385e3efb5d1489561570b519429f833559c8ece
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
<<<<<<< HEAD
        return fallback
=======
        return get_fallback()
>>>>>>> c385e3efb5d1489561570b519429f833559c8ece

    prompt = f"""
    You are an expert technical examiner specialized in {full_topic}. 
    Generate {max(10, count)} highly diverse, non-repetitive, and EXTREMELY DOMAIN-SPECIFIC multiple-choice quiz questions.
    
    STYLE GUIDE for {full_topic}:
    {style_guide}
    
    CRITICAL GUIDELINES:
<<<<<<< HEAD
    1. Questions MUST be deeply technical and strictly related to '{topic}'.
    2. Start with easy fundamental questions and progressively increase difficulty to advanced/expert levels. 
    3. Ensure options are plausible but only one is clearly correct.
    4. Avoid generic "What is X?" questions; prefer scenario-based or deep conceptual probes.
    5. Random Seed for uniqueness: {random.randint(10000, 99999)}.
=======
    1. NEVER use generic templates like "Which of the following is a core concept in...".
    2. Every question must be a unique technical probe. 
    3. Vary the question types: 
       - 40% Numerical or Problem-solving (requiring calculation or logic).
       - 30% Scenario-based (e.g., 'If X happens in Y condition, what is the result?').
       - 30% Conceptual/Deep-dive (testing understanding of underlying mechanisms).
    4. Options must be technical and challenging, designed to test a true expert.
    5. Random Seed: {uuid.uuid4()} - YOU MUST GENERATE A COMPLETELY FRESH BATCH OF QUESTIONS.
>>>>>>> c385e3efb5d1489561570b519429f833559c8ece

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
        
<<<<<<< HEAD
        # More robust JSON cleaning
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
=======
        items = extract_json(text)
        if not items or not isinstance(items, list):
            # Try one more time if it's a dictionary instead of list
            if isinstance(items, dict) and "questions" in items:
                items = items["questions"]
            else:
                return get_fallback()
>>>>>>> c385e3efb5d1489561570b519429f833559c8ece
            
        cleaned = []
        for item in items:
            options = item.get("options", [])[:4]
            if len(options) < 2: # At least 2 options required
                continue
            
            # Ensure 4 options if possible
            while len(options) < 4:
                options.append("N/A")

            try:
                answer_index = int(item.get("answer_index", 0))
            except (ValueError, TypeError):
                answer_index = 0
<<<<<<< HEAD

            if answer_index < 0 or answer_index >= len(options):
                answer_index = 0
                
            cleaned.append(
                {
                    "question": (item.get("question") or "Quiz question").strip(),
                    "options": options,
                    "answer_index": answer_index,
                }
            )
        return cleaned[:count] if len(cleaned) >= 5 else fallback
    except Exception as e:
        print(f"Quiz Generation Error: {e}")
        return fallback

=======
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
>>>>>>> c385e3efb5d1489561570b519429f833559c8ece
