import copy
import datetime
import json
from pathlib import Path
from types import SimpleNamespace

import bcrypt
from bson import ObjectId
from pymongo import ASCENDING, MongoClient
from pymongo.errors import PyMongoError

from config import Config

# Defer client initialization to init_db
client = None
db = None

_USE_LOCAL_DB = False
_DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "local_demo_db.json"
_COLLECTIONS = ("users", "interviews", "questions", "quiz_attempts", "platform_feedback")


def _encode_value(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime.datetime):
        return value.isoformat()
    if isinstance(value, list):
        return [_encode_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _encode_value(item) for key, item in value.items()}
    return value


def _decode_document(document):
    decoded = copy.deepcopy(document)
    for key, value in list(decoded.items()):
        if key in {"_id", "user_id", "interview_id"} and isinstance(value, str):
            decoded[key] = ObjectId(value)
        elif key.endswith("_at") and isinstance(value, str):
            try:
                decoded[key] = datetime.datetime.fromisoformat(value)
            except ValueError:
                decoded[key] = value
        elif isinstance(value, list):
            decoded[key] = [_decode_document(item) if isinstance(item, dict) else item for item in value]
        elif isinstance(value, dict):
            decoded[key] = _decode_document(value)
    return decoded


def _ensure_local_file():
    _DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not _DATA_FILE.exists():
        _DATA_FILE.write_text(json.dumps({name: [] for name in _COLLECTIONS}, indent=2), encoding="utf-8")


def _load_local_data():
    _ensure_local_file()
    return json.loads(_DATA_FILE.read_text(encoding="utf-8"))


def _save_local_data(data):
    _ensure_local_file()
    _DATA_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _values_equal(left, right):
    if isinstance(left, ObjectId):
        left = str(left)
    if isinstance(right, ObjectId):
        right = str(right)
    return left == right


def _match_operator(value, operator, expected):
    if operator == "$gte":
        return value >= expected
    if operator == "$in":
        expected_values = {str(item) if isinstance(item, ObjectId) else item for item in expected}
        value = str(value) if isinstance(value, ObjectId) else value
        return value in expected_values
    return False


def _matches_query(document, query):
    if not query:
        return True
    for key, expected in query.items():
        value = document.get(key)
        if isinstance(expected, dict):
            for operator, operator_value in expected.items():
                if not _match_operator(value, operator, operator_value):
                    return False
        elif not _values_equal(value, expected):
            return False
    return True


class LocalCursor:
    def __init__(self, documents):
        self.documents = documents

    def sort(self, key, direction=ASCENDING):
        reverse = direction == -1
        self.documents.sort(key=lambda item: item.get(key) or datetime.datetime.min, reverse=reverse)
        return self

    def limit(self, count):
        self.documents = self.documents[:count]
        return self

    def __iter__(self):
        return iter(self.documents)


class LocalCollection:
    def __init__(self, name):
        self.name = name

    def create_index(self, *args, **kwargs):
        return None

    def _documents(self, data):
        return [_decode_document(item) for item in data.setdefault(self.name, [])]

    def find_one(self, query=None, sort=None):
        documents = self._documents(_load_local_data())
        if sort:
            for key, direction in reversed(sort):
                documents.sort(key=lambda item: item.get(key) or datetime.datetime.min, reverse=direction == -1)
        return next((item for item in documents if _matches_query(item, query)), None)

    def find(self, query=None):
        documents = [item for item in self._documents(_load_local_data()) if _matches_query(item, query)]
        return LocalCursor(documents)

    def count_documents(self, query=None):
        return len(list(self.find(query)))

    def insert_one(self, document):
        data = _load_local_data()
        document = copy.deepcopy(document)
        document.setdefault("_id", ObjectId())
        data.setdefault(self.name, []).append(_encode_value(document))
        _save_local_data(data)
        return SimpleNamespace(inserted_id=document["_id"])

    def insert_many(self, documents):
        inserted_ids = []
        data = _load_local_data()
        for document in documents:
            document = copy.deepcopy(document)
            document.setdefault("_id", ObjectId())
            inserted_ids.append(document["_id"])
            data.setdefault(self.name, []).append(_encode_value(document))
        _save_local_data(data)
        return SimpleNamespace(inserted_ids=inserted_ids)

    def update_one(self, query, update):
        data = _load_local_data()
        documents = data.setdefault(self.name, [])
        for index, raw_document in enumerate(documents):
            document = _decode_document(raw_document)
            if not _matches_query(document, query):
                continue
            for key, value in update.get("$set", {}).items():
                document[key] = value
            for key, value in update.get("$inc", {}).items():
                document[key] = document.get(key, 0) + value
            documents[index] = _encode_value(document)
            _save_local_data(data)
            return SimpleNamespace(matched_count=1, modified_count=1)
        return SimpleNamespace(matched_count=0, modified_count=0)


def get_collection(collection_name):
    """Return a MongoDB collection, or a local demo collection if MongoDB is offline."""
    if _USE_LOCAL_DB:
        return LocalCollection(collection_name)
    return db[collection_name]


def _seed_admin(collection):
    # Seed admin from Config
    email = Config.ADMIN_EMAIL
    password = Config.ADMIN_PASSWORD
    name = Config.ADMIN_NAME
    
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    existing = collection.find_one({"email": email})
    
    admin_data = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "role": "admin",
        "plan_type": "premium",
        "interview_count": 0,
        "created_at": datetime.datetime.utcnow()
    }

    if existing:
        collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "name": name,
                "role": "admin",
                "plan_type": "premium",
                "password": hashed_password
            }}
        )
        print(f"Updated admin profile: {email}")
    else:
        collection.insert_one(admin_data)
        print(f"Seeded admin profile: {email}")


def init_db():
    """Initialize MongoDB indexes and seed data."""
    global client, db, _USE_LOCAL_DB

    try:
        client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=3000)
        db = client[Config.DB_NAME]
        client.admin.command("ping")
        _USE_LOCAL_DB = False
        db.users.create_index([("email", ASCENDING)], unique=True)
        db.interviews.create_index([("user_id", ASCENDING), ("created_at", ASCENDING)])
        db.questions.create_index([("interview_id", ASCENDING)])
        _seed_admin(db.users)
        print(f"Connected to MongoDB database: {Config.DB_NAME}")
    except Exception as exc:
        if Config.ENABLE_LOCAL_DEMO_DB:
            _USE_LOCAL_DB = True
            _ensure_local_file()
            _seed_admin(LocalCollection("users"))
            print(f"MongoDB offline, using local demo database: {_DATA_FILE}")
        else:
            print(f"CRITICAL: MongoDB is not reachable and Local Demo is disabled: {exc}")
            # Still set to false to allow the app to error out naturally on DB calls
            _USE_LOCAL_DB = False
