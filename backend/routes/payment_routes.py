from flask import Blueprint
from utils.auth_middleware import token_required
from utils.helpers import format_response
from services.db_service import get_collection
from utils.helpers import to_object_id

payment_bp = Blueprint('payment', __name__)
users_collection = get_collection("users")

@payment_bp.route('/simulate-payment', methods=['POST'])
@payment_bp.route('/upgrade-plan', methods=['POST'])
@token_required
def simulate_payment(current_user_id):
    user_id = to_object_id(current_user_id)
    user = users_collection.find_one({"_id": user_id})
    if not user:
        return format_response(None, "User not found", 404)
    users_collection.update_one({"_id": user_id}, {"$set": {"plan_type": "premium"}})
    return format_response({
        "plan_type": "premium",
        "payment_status": "simulated_success"
    }, "Simulated payment completed")
