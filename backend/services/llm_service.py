import google.generativeai as genai
import os
import json
from flask import current_app

def get_llm_model():
    api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
        print("!!! ERROR: GOOGLE_API_KEY environment variable is NOT SET !!!")
        return None
        
    if api_key == "your_gemini_api_key_here":
        print("!!! ERROR: GOOGLE_API_KEY is still using the placeholder value !!!")
        return None
    
    # Log first/last chars for safety verification without exposing the full key
    key_preview = f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) > 10 else "INVALID_LENGTH"
    print(f"--- Initializing Gemini Model with key: {key_preview} ---")
    
    try:
        genai.configure(api_key=api_key)
        # Use gemini-pro as it is the most stable and widely supported model name
        model = genai.GenerativeModel('gemini-pro')
        return model
    except Exception as e:
        print(f"!!! CRITICAL: Failed to initialize Google AI Studio API: {e} !!!")
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
        result = extract_json(response.text)
        return result
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
    - Provide actionable career, interview, or technical advice.
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
        "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
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
