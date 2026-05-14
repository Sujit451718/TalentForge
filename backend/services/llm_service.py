import os
import json
import warnings
from pathlib import Path

from dotenv import load_dotenv

try:
    from google import genai as google_genai
except Exception:
    google_genai = None

legacy_genai = None

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


class GoogleGenAIModel:
    def __init__(self, api_key, model_name):
        self.client = google_genai.Client(api_key=api_key)
        self.model_name = model_name

    def generate_content(self, prompt):
        return self.client.models.generate_content(model=self.model_name, contents=prompt)


def _load_legacy_genai():
    global legacy_genai
    if legacy_genai is not None:
        return legacy_genai
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", category=FutureWarning)
        import google.generativeai as loaded_genai
    legacy_genai = loaded_genai
    return legacy_genai


def _normalise_list(value, fallback=None):
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return fallback or []


def _clamp_score(value, default=0):
    try:
        return max(0, min(100, int(round(float(value)))))
    except (TypeError, ValueError):
        return default


def get_llm_model():
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        print("GOOGLE_API_KEY is not configured; using local fallback AI behavior.")
        return None
        
    if api_key == "your_gemini_api_key_here":
        print("GOOGLE_API_KEY still uses the placeholder value; using local fallback AI behavior.")
        return None

    try:
        model_name = os.getenv("GOOGLE_MODEL_NAME", "gemini-1.5-flash")
        if google_genai:
            return GoogleGenAIModel(api_key, model_name)

        genai = _load_legacy_genai()
        genai.configure(api_key=api_key)
        return genai.GenerativeModel(model_name)
    except Exception as e:
        print(f"Failed to initialize Google AI Studio API: {e}")
        return None

def extract_json(text):
    """Robustly extract JSON from AI response text."""
    if not text:
        return None
        
    clean_text = text.strip()
    
    # 1. Try direct parsing
    try:
        return json.loads(clean_text)
    except:
        pass

    # 2. Try cleaning markdown code blocks
    try:
        if "```" in clean_text:
            parts = clean_text.split("```")
            for part in parts:
                inner = part.strip()
                if inner.startswith("json"): inner = inner[4:].strip()
                if inner.startswith("[") or inner.startswith("{"):
                    try:
                        return json.loads(inner)
                    except:
                        continue
    except:
        pass

    # 3. Find first [ or { and last ] or }
    try:
        start_idx = -1
        for i, c in enumerate(clean_text):
            if c in "[{":
                start_idx = i
                break
        
        end_idx = -1
        for i in range(len(clean_text)-1, -1, -1):
            if clean_text[i] in "]}":
                end_idx = i
                break
                
        if start_idx != -1 and end_idx != -1:
            return json.loads(clean_text[start_idx:end_idx+1])
    except:
        pass
            
    return None

def get_ai_evaluation(
    question,
    answer,
    role="Software Engineer",
    experience_level="Mid",
    question_context=None,
    is_intro=False,
):
    model = get_llm_model()
    if not model:
        return None 

    interview_phase = (
        "This is the mandatory first self-introduction question. Evaluate confidence, clarity, role fit, "
        "communication structure, and whether the candidate connected their background to the target role."
        if is_intro
        else "This is a role/domain interview question. Evaluate technical accuracy, practical depth, tradeoffs, and examples."
    )
    
    prompt = f"""
    You are Jarvis, a senior MNC-style interviewer for a {experience_level} {role} interview.
    Your feedback should feel like a real interview panel: specific, professional, honest, and encouraging.
    
    Interview phase:
    {interview_phase}
    
    Question: {question}
    Question context: {question_context or "No extra context"}
    User Answer: {answer}
    
    Provide your evaluation in the following strict JSON format:
    {{
        "score": (integer between 0 and 100),
        "feedback": "A concise assessment of the answer for the target role",
        "strengths": ["Identify 2-3 specific strengths found in the answer"],
        "weaknesses": ["Identify 2-3 specific gaps or areas needing more detail"],
        "suggested_answer": "An ideal suggested answer incorporating the missing points",
        "jarvis_response": "A short conversational interviewer reply addressing the user directly (1-2 sentences)",
        "follow_up_question": "One realistic MNC interviewer follow-up question based on the answer",
        "hiring_signal": "weak | mixed | strong"
    }}
    
    Rules:
    - Be domain-specific for {role}; do not give generic coaching when role-specific detail is possible.
    - For the first self-introduction answer, mention the candidate's strongest positioning and weakest positioning.
    - Be critical but fair; do not overpraise thin answers.
    - Return ONLY the JSON object.
    - No markdown formatting.
    """
    
    try:
        response = model.generate_content(prompt)
        result = extract_json(response.text)
        if not isinstance(result, dict):
            return None
        return {
            "score": _clamp_score(result.get("score")),
            "feedback": str(result.get("feedback") or "AI evaluation completed.").strip(),
            "strengths": _normalise_list(result.get("strengths"), ["Clear attempt to answer the question."])[:3],
            "weaknesses": _normalise_list(result.get("weaknesses"), ["Add more role-specific depth and examples."])[:3],
            "suggested_answer": str(result.get("suggested_answer") or "").strip(),
            "jarvis_response": str(result.get("jarvis_response") or "Thank you. I have noted your response.").strip(),
            "follow_up_question": str(result.get("follow_up_question") or "").strip(),
            "hiring_signal": str(result.get("hiring_signal") or "mixed").strip().lower(),
        }
    except Exception as e:
        print(f"Error calling Gemini API for evaluation: {e}")
        return None

def generate_questions_from_resume(resume_text):
    model = get_llm_model()
    if not model:
        return [{"question": "Could you tell me about your most recent project?", "context": "General opening question", "expected_keywords": ["project", "impact", "challenges"]}]
    
    prompt = f"""
    You are an expert technical recruiter and interviewer. Analyze the following resume text and generate 5 highly personalized, challenging, and domain-specific technical interview questions.
    
    CRITICAL GUIDELINES:
    1. Each question must be DIRECTLY LINKED to a specific experience, skill, or project mentioned in the resume.
    2. The questions should test the depth of their technical knowledge in the areas they claim expertise.
    3. Provide a "context" for each question explaining which part of the resume triggered it.
    4. Provide "expected_keywords" that a strong answer should contain.
    
    Resume Text:
    {resume_text}
    
    Return the result as a strict JSON list of objects:
    [
        {{
            "question": "The personalized interview question",
            "context": "Why this is being asked based on their resume (e.g., 'Triggered by your work on the X project...')",
            "expected_keywords": ["keyword1", "keyword2", "keyword3"]
        }},
        ...
    ]
    """
    
    try:
        response = model.generate_content(prompt)
        items = extract_json(response.text)
        if isinstance(items, list) and items:
            return items[:5]
        return [{"question": "Could you tell me about your most recent project?", "context": "Fallback question", "expected_keywords": ["project", "result", "experience"]}]
    except Exception as e:
        print(f"Error generating resume questions: {e}")
        return [{"question": "Could you tell me about your most recent project?", "context": "Fallback question", "expected_keywords": ["project", "result", "experience"]}]


def generate_interview_summary(role, experience_level, total_score, question_results, previous_context=None):
    model = get_llm_model()
    if not model:
        return None

    compact_questions = [
        {
            "question": item.get("question"),
            "score": item.get("score"),
            "answer": (item.get("answer") or "")[:900],
            "strengths": item.get("strengths", []),
            "weaknesses": item.get("weaknesses", []),
        }
        for item in question_results
        if item.get("answer")
    ]

    prompt = f"""
    You are Jarvis, an MNC interview panel lead creating the final interview report.
    Target role/domain: {role}
    Experience level: {experience_level}
    Overall score: {total_score}
    Previous interview context: {json.dumps(previous_context or {}, default=str)}
    Current evaluated answers: {json.dumps(compact_questions, default=str)}

    Return ONLY this strict JSON object:
    {{
      "is_selected": true,
      "overall_feedback": "4-6 sentence final interviewer feedback, specific to the target role",
      "strengths": ["top 3 candidate strengths"],
      "weaknesses": ["top 3 candidate weaknesses"],
      "future_improvements": ["top 3 concrete practice actions"],
      "improvement_from_last_interview": "Compare against previous interview if available; otherwise say this is the baseline interview.",
      "hiring_recommendation": "reject | hold | proceed | strong_proceed"
    }}

    Rules:
    - Make the strengths and weaknesses specific, not generic.
    - Mention improvement from the previous interview using the previous score/context when available.
    - is_selected should be true only when the candidate looks likely to pass an MNC technical screen.
    - No markdown.
    """

    try:
        response = model.generate_content(prompt)
        result = extract_json(response.text)
        if not isinstance(result, dict):
            return None
        return {
            "is_selected": bool(result.get("is_selected", total_score >= 70)),
            "overall_feedback": str(result.get("overall_feedback") or "").strip(),
            "strengths": _normalise_list(result.get("strengths"), ["Clear communication foundation."])[:3],
            "weaknesses": _normalise_list(result.get("weaknesses"), ["Needs more role-specific evidence."])[:3],
            "future_improvements": _normalise_list(result.get("future_improvements"), ["Practice structured answers with concrete outcomes."])[:3],
            "improvement_from_last_interview": str(result.get("improvement_from_last_interview") or "").strip(),
            "hiring_recommendation": str(result.get("hiring_recommendation") or "hold").strip().lower(),
        }
    except Exception as e:
        print(f"Error calling Gemini API for interview summary: {e}")
        return None


def chatbot_reply_ai(message, context="general"):
    model = get_llm_model()
    if not model:
        return "I'm Jarvis, your AI career assistant. Please configure my API key to enable full interactive capabilities."
    
    prompt = f"""
    You are Jarvis, a highly intelligent, witty, and helpful AI career assistant. 
    A user is asking you a question in the context of: {context}.
    
    User message: {message}
    
    Guidelines:
    - Be conversational, professional, but slightly witty/charming.
    - Provide actionable career, interview, resume, ATS, or technical advice.
    - Keep responses relatively concise (2-4 sentences).
    - If asked about ATS, explain how it works and how to optimize for it.
    - If asked about interviews, give tips on the STAR method or technical depth.
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Jarvis AI Error: {e}")
        return "I apologize, but I'm having trouble connecting to my neural network right now. How else can I assist you with your career today?"

def get_ats_score_evaluation(resume_text, target_role="Software Engineer"):
    model = get_llm_model()
    if not model:
        return {"error": "Google API Key missing or Gemini model failed to initialize."}
    
    prompt = f"""
    You are an expert ATS (Applicant Tracking System) analyzer and technical recruiter.
    Analyze the following resume text against the target role/domain: "{target_role}".
    
    Resume Text:
    {resume_text}
    
    Task:
    1. Dynamically determine a list of 15-20 CRUCIAL, high-impact technical keywords, skills, and industry-standard technologies that are specifically relevant to "{target_role}".
    2. Check the Resume Text for the presence of these keywords.
    3. Calculate an ATS score (0-100) based on keyword matching, formatting quality, and experience relevance.
    4. Provide a verdict (e.g., "Critical", "Poor", "Good", "Strong", "Excellent").
    5. List found keywords and missing keywords.
    6. Provide 3-5 high-impact, actionable suggestions to improve the resume for this specific role.

    Return the result in this STRICT JSON format:
    {{
        "score": (integer),
        "found_keywords": ["list", "of", "found"],
        "missing_keywords": ["list", "of", "missing"],
        "verdict": "Verdict string",
        "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
        "role_fit_summary": "brief domain-specific summary of resume fit",
        "priority_keywords": ["top keywords to add first"]
    }}
    
    Rule: Return ONLY the JSON object. No markdown.
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        result = extract_json(text)
        if result:
            return result
        return {
            "score": 0,
            "found_keywords": [],
            "missing_keywords": [],
            "verdict": "Parsing Error",
            "suggestions": ["The AI returned an invalid format. Please try again."]
        }
    except Exception as e:
        error_msg = f"{str(e)} | Raw output: {text[:200]}..." if 'text' in locals() else str(e)
        print(f"Error generating ATS evaluation: {error_msg}")
        return {
            "score": 0,
            "found_keywords": [],
            "missing_keywords": [],
            "verdict": "Error",
            "suggestions": ["Check your API key or internet connection."]
        }
