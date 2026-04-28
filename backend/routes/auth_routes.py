from flask import Blueprint, request
from services.auth_service import get_user_by_id, login_user, public_user, register_user
from utils.auth_middleware import token_required
from utils.helpers import format_response

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return format_response(None, "Missing required fields", 400)

    user_id, message = register_user(data)
    if not user_id:
        return format_response(None, message, 400)

    return format_response({"user_id": user_id}, message, 201)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    if not data or not data.get('email') or not data.get('password'):
        return format_response(None, "Missing email or password", 400)

    result, message = login_user(data.get('email'), data.get('password'))
    if not result:
        return format_response(None, message, 401)

    return format_response(result, message)

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user_id):
    return format_response({"logged_out": True}, "Logged out successfully")

@auth_bp.route('/me', methods=['GET'])
@token_required
def me(current_user_id):
    user = get_user_by_id(current_user_id)
    if not user:
        return format_response(None, "User not found", 404)
    return format_response(public_user(user))
