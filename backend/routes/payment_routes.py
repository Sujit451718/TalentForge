from flask import Blueprint, request
from utils.auth_middleware import token_required
from utils.helpers import format_response
from services.db_service import get_collection
from utils.helpers import to_object_id
import datetime
import os
from werkzeug.utils import secure_filename

payment_bp = Blueprint('payment', __name__)
users_collection = get_collection("users")
payment_requests_collection = get_collection("payment_requests")

UPLOAD_FOLDER = 'uploads/payments'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@payment_bp.route('/submit-proof', methods=['POST'])
@token_required
def submit_proof(current_user_id):
    if 'proof' not in request.files:
        return format_response(None, "No proof file uploaded", 400)
    
    file = request.files['proof']
    if file.filename == '':
        return format_response(None, "No file selected", 400)
    
    user_id = to_object_id(current_user_id)
    
    # Check if there is already a pending request
    existing_request = payment_requests_collection.find_one({
        "user_id": user_id,
        "status": "pending"
    })
    if existing_request:
        return format_response(None, "You already have a pending payment request", 400)

    filename = secure_filename(f"{current_user_id}_{datetime.datetime.now().timestamp()}_{file.filename}")
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)
    
    request_id = payment_requests_collection.insert_one({
        "user_id": user_id,
        "proof_path": file_path,
        "status": "pending",
        "created_at": datetime.datetime.utcnow()
    }).inserted_id
    
    return format_response({"request_id": str(request_id)}, "Payment proof submitted successfully. Waiting for admin approval.")

@payment_bp.route('/my-request', methods=['GET'])
@token_required
def get_my_request(current_user_id):
    user_id = to_object_id(current_user_id)
    request_data = payment_requests_collection.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )
    if not request_data:
        return format_response(None, "No payment request found")
    
    request_data["_id"] = str(request_data["_id"])
    request_data["user_id"] = str(request_data["user_id"])
    return format_response(request_data)

@payment_bp.route('/admin/pending', methods=['GET'])
@token_required
def get_pending_payments(current_user_id):
    # Verify admin
    admin_id = to_object_id(current_user_id)
    admin = users_collection.find_one({"_id": admin_id})
    if not admin or admin.get("role") != "admin":
        return format_response(None, "Admin access required", 403)
    
    pending = list(payment_requests_collection.find({"status": "pending"}).sort("created_at", 1))
    for p in pending:
        p["_id"] = str(p["_id"])
        p["user_id"] = str(p["user_id"])
        user = users_collection.find_one({"_id": to_object_id(p["user_id"])})
        p["user_name"] = user.get("name") if user else "Unknown"
        p["user_email"] = user.get("email") if user else "Unknown"
        
    return format_response(pending)

@payment_bp.route('/admin/verify', methods=['POST'])
@token_required
def verify_payment(current_user_id):
    # Verify admin
    admin_id = to_object_id(current_user_id)
    admin = users_collection.find_one({"_id": admin_id})
    if not admin or admin.get("role") != "admin":
        return format_response(None, "Admin access required", 403)
    
    data = request.json
    request_id = data.get("request_id")
    status = data.get("status") # 'approved' or 'rejected'
    
    if status not in ['approved', 'rejected']:
        return format_response(None, "Invalid status", 400)
    
    payment_request = payment_requests_collection.find_one({"_id": to_object_id(request_id)})
    if not payment_request:
        return format_response(None, "Payment request not found", 404)
    
    payment_requests_collection.update_one(
        {"_id": to_object_id(request_id)},
        {"$set": {
            "status": status,
            "verified_at": datetime.datetime.utcnow(),
            "verified_by": admin_id
        }}
    )
    
    if status == 'approved':
        users_collection.update_one(
            {"_id": payment_request["user_id"]},
            {"$set": {
                "plan_type": "premium",
                "premium_since": datetime.datetime.utcnow()
            }}
        )
        return format_response(None, "Payment approved and user upgraded to Premium")
    
    return format_response(None, "Payment request rejected")

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

