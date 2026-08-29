from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db
from models import User
from utils.rate_limit import rate_limit, get_user_key
import re

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    return True, None

@auth_bp.route('/register', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=60)
def register():
    """Register a new user."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    # Validate inputs
    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password are required'}), 400

    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400

    if len(username) > 80:
        return jsonify({'error': 'Username must be at most 80 characters'}), 400

    if not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400

    valid_password, password_error = validate_password(password)
    if not valid_password:
        return jsonify({'error': password_error}), 400

    # Check for duplicate username
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409

    # Check for duplicate email
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    # Create user
    user = User(username=username, email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=60)
def login():
    """Login user."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify(user.to_dict()), 200

@auth_bp.route('/username-check/<username>', methods=['GET'])
def check_username_available(username):
    """Check if username is available."""
    username = username.strip().lower()

    # Validate format
    if len(username) < 3 or len(username) > 20:
        return jsonify({'available': False, 'error': 'Username must be 3-20 characters'}), 400

    if not re.match(r'^[a-z0-9_]+$', username):
        return jsonify({'available': False, 'error': 'Only letters, numbers, and underscore allowed'}), 400

    # Check availability
    exists = User.query.filter_by(username=username).first()

    return jsonify({'available': not bool(exists)}), 200
