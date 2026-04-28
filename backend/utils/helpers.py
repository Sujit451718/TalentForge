from flask import jsonify
from bson import ObjectId
from datetime import datetime

def serialize(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat() + "Z"
    if isinstance(value, list):
        return [serialize(item) for item in value]
    if isinstance(value, dict):
        return {key: serialize(item) for key, item in value.items()}
    return value

def to_object_id(value):
    try:
        return ObjectId(value)
    except Exception:
        return None

def format_response(data, message="Success", status=200):
    return jsonify({
        "status": status,
        "message": message,
        "data": serialize(data)
    }), status
