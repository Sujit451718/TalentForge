import jwt
import datetime
import bcrypt
from flask import current_app
from pymongo.errors import DuplicateKeyError
from services.db_service import get_collection
from utils.helpers import to_object_id

users_collection = get_collection("users")

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed_password):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def generate_token(user_id):
    now = datetime.datetime.utcnow()
    payload = {
        'exp': now + datetime.timedelta(hours=current_app.config['JWT_EXPIRATION_HOURS']),
        'iat': now,
        'sub': str(user_id)
    }
    return jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )

def public_user(user):
    if not user:
        return None
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "user"),
        "plan_type": user.get("plan_type", "free"),
        "interview_count": user.get("interview_count", 0),
        "created_at": user.get("created_at")
    }

def register_user(data):
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password')

    if len(password or "") < 6:
        return None, "Password must be at least 6 characters"

    if users_collection.find_one({"email": email}):
        return None, "User already exists"

    hashed_pw = hash_password(password)
    user_data = {
        "name": name,
        "email": email,
        "password": hashed_pw,
        "role": "user",
        "plan_type": "free",
        "interview_count": 0,
        "created_at": datetime.datetime.utcnow()
    }

    try:
        result = users_collection.insert_one(user_data)
    except DuplicateKeyError:
        return None, "User already exists"

    return str(result.inserted_id), "User registered successfully"

def login_user(email, password):
    user = users_collection.find_one({"email": email.strip().lower()})
    if user and check_password(password, user['password']):
        token = generate_token(user['_id'])
        return {
            "token": token,
            "user": public_user(user)
        }, "Login successful"
    return None, "Invalid email or password"

def get_user_by_id(user_id):
    object_id = to_object_id(user_id)
    if not object_id:
        return None
    return users_collection.find_one({"_id": object_id})
