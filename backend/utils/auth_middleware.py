import jwt
import datetime
from functools import wraps
from flask import request, current_app
from utils.helpers import format_response, to_object_id
from services.db_service import get_collection

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return format_response(None, "Token is missing", 401)

        if not token:
            return format_response(None, "Token is missing", 401)

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user_id = data['sub']
            
            # Check for plan expiration
            users_collection = get_collection("users")
            user_id = to_object_id(current_user_id)
            if not user_id:
                 return format_response(None, "Invalid User ID in token", 401)
            
            user = users_collection.find_one({"_id": user_id})
            
            if user and user.get("plan_type") == "premium":
                premium_since = user.get("premium_since")
                if premium_since:
                    # Ensure premium_since is a datetime object
                    if isinstance(premium_since, str):
                        try:
                            premium_since = datetime.datetime.fromisoformat(premium_since.replace('Z', '+00:00'))
                        except:
                            premium_since = None
                    
                    if premium_since and datetime.datetime.utcnow() > premium_since + datetime.timedelta(days=30):
                        users_collection.update_one(
                            {"_id": user_id},
                            {"$set": {"plan_type": "free"}}
                        )
            
            if not user:
                return format_response(None, "User associated with token not found", 401)
            
        except jwt.ExpiredSignatureError:
            return format_response(None, "Token has expired", 401)
        except jwt.InvalidTokenError:
            return format_response(None, "Token is invalid", 401)
        except Exception as e:
            return format_response(None, f"Session error: {str(e)}", 401)

        return f(current_user_id, *args, **kwargs)

    return decorated
