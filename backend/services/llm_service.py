import google.generativeai as genai
import os
import json
from flask import current_app

def get_llm_model():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        print("Warning: GOOGLE_API_KEY is missing or placeholder. LLM features will be disabled.")
        return None
    
    try:
        genai.configure(api_key=api_key)
        # Use gemini-1.5-flash for better performance and reliability
        model = genai.GenerativeModel('gemini-1.5-flash')
        return model
    except Exception as e:
        print(f"Error initializing Gemini Model: {e}")
        return None

def get_ai_evaluation(question, answer):
    model = get_llm_model()
    if not model:
        return None 
    
    prompt = f"""
    You are an expert technical interviewer. Evaluate the following interview answer:
    
    Question: {question}
    User Answer: {answer}
    
    Provide your evaluation in the following strict JSON format:
    {{
        "score": (integer between 0 and 100),
        "feedback": "A concise assessment of the answer",
        "strengths": ["list", "of", "strengths", "in", "the", "answer"],
        "weaknesses": ["list", "of", "weaknesses", "or", "missing", "points"],
        "suggested_answer": "An ideal suggested answer incorporating the missing points",
        "jarvis_response": "A short, conversational and encouraging reply addressing the user directly (1-2 sentences)"
    }}
    
    Rules:
    - Return ONLY the JSON object.
    - No markdown formatting.
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
            
        start_idx = text.find('{')
        end_idx = text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            clean_text = text[start_idx:end_idx+1]
        else:
            clean_text = text
            
        return json.loads(clean_text.strip())
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
        return items[:5]
    except Exception as e:
        print(f"Error generating resume questions: {e}")
        return [{"question": "Could you tell me about your most recent project?", "context": "Fallback question", "expected_keywords": ["project", "result", "experience"]}]

def get_ats_score_evaluation(resume_text, target_role="Software Engineer"):
    model = get_llm_model()
    if not model:
        return {"error": "Google API Key missing or Gemini model failed to initialize."}
    
    prompt = f"""
    You are an expert ATS (Applicant Tracking System) analyzer and technical recruiter.
    Analyze the following resume text against the target role/domain: "{target_role}".
    
    Resume Text:
    {resume_text}
    
    First, dynamically determine a list of 15-20 crucial keywords, skills, and technologies that are highly relevant specifically to the "{target_role}" domain.
    CRITICAL INSTRUCTION: DO NOT use generic or unrelated web technologies (e.g., do not look for "React.js" or "Frontend" if the domain is Data Science or Backend). Only identify keywords that natively belong to the '{target_role}' domain.
    Then, check the Resume Text for the presence of these strictly domain-specific keywords.
    Calculate the score based strictly on the percentage of these domain-specific keywords found in the resume.
    
    Provide your evaluation in the following strict JSON format:
    {{
        "score": 85,
        "found_keywords": ["keyword1", "keyword2"],
        "missing_keywords": ["keyword1", "keyword2"],
        "verdict": "Strong",
        "suggestions": ["suggestion1", "suggestion2"]
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        import json
        
        # Robust JSON cleaning
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.split("```")[0]
            
        start_idx = text.find('{')
        end_idx = text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            clean_text = text[start_idx:end_idx+1]
        else:
            clean_text = text
            
        return json.loads(clean_text)
    except Exception as e:
        error_msg = f"{str(e)} | Raw output: {text[:200]}..." if 'text' in locals() else str(e)
        print(f"Error generating ATS evaluation: {error_msg}")
        return {"error": error_msg}
