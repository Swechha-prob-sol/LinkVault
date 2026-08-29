from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
from flask_socketio import SocketIO
import redis

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()
socketio = SocketIO()

redis_client = None

def init_redis(app):
    """Initialize Redis connection."""
    global redis_client
    redis_url = app.config.get('REDIS_URL', 'redis://localhost:6379/0')
    try:
        redis_client = redis.from_url(redis_url, decode_responses=True)
        redis_client.ping()
    except Exception as e:
        app.logger.warning(f"Redis connection failed: {e}. Continuing without Redis.")
        redis_client = None

def get_redis():
    """Get Redis client."""
    return redis_client
