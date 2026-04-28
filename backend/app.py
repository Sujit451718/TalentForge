from flask import Flask
from flask_cors import CORS
from pymongo.errors import PyMongoError
from config import Config
from services.db_service import init_db
from utils.helpers import format_response

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/*": {"origins": "*"}})

    init_db()

    from routes.auth_routes import auth_bp
    from routes.user_routes import user_bp
    from routes.interview_routes import interview_bp
    from routes.payment_routes import payment_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(auth_bp, url_prefix='/api', name='auth_api_alias')
    app.register_blueprint(auth_bp, url_prefix='', name='auth_root_alias')

    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(user_bp, url_prefix='/api', name='user_api_alias')
    app.register_blueprint(user_bp, url_prefix='', name='user_root_alias')

    app.register_blueprint(interview_bp, url_prefix='/api/interview')
    app.register_blueprint(interview_bp, url_prefix='/api', name='interview_api_alias')
    app.register_blueprint(interview_bp, url_prefix='', name='interview_root_alias')

    app.register_blueprint(payment_bp, url_prefix='/api/payment')
    app.register_blueprint(payment_bp, url_prefix='/api', name='payment_api_alias')
    app.register_blueprint(payment_bp, url_prefix='', name='payment_root_alias')

    @app.route('/')
    def index():
        return {
            "message": "AI Interview Simulator API",
            "status": "running",
            "database": Config.DB_NAME,
            "endpoints": ["/register", "/login", "/dashboard", "/start-interview", "/submit-answer", "/feedback"]
        }

    @app.errorhandler(PyMongoError)
    def database_error(error):
        return format_response(
            None,
            "Database connection failed. Start MongoDB or keep ENABLE_LOCAL_DEMO_DB=true for local demo mode.",
            503
        )

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
