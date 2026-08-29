import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from extensions import db
from models import User

@pytest.fixture
def app():
    """Create application for testing."""
    app = create_app('testing')

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

@pytest.fixture
def app_context(app):
    """Create app context."""
    with app.app_context():
        yield app

def test_health_check(client):
    """Test health check endpoint."""
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json['status'] == 'ok'

def test_database_connection(app_context):
    """Test database connection."""
    user = User(username='testuser', email='test@example.com')
    user.set_password('password123')
    db.session.add(user)
    db.session.commit()

    assert User.query.count() == 1
    assert User.query.first().email == 'test@example.com'

def test_user_registration(client):
    """Test user registration."""
    response = client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 201
    assert response.json['user']['username'] == 'testuser'
    assert response.json['user']['email'] == 'test@example.com'
    assert 'password_hash' not in response.json['user']

def test_duplicate_email_registration(client):
    """Test duplicate email rejection."""
    client.post('/api/auth/register', json={
        'username': 'user1',
        'email': 'test@example.com',
        'password': 'password123'
    })

    response = client.post('/api/auth/register', json={
        'username': 'user2',
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 409
    assert 'Email already registered' in response.json['error']

def test_duplicate_username_registration(client):
    """Test duplicate username rejection."""
    client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test1@example.com',
        'password': 'password123'
    })

    response = client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test2@example.com',
        'password': 'password123'
    })
    assert response.status_code == 409
    assert 'Username already taken' in response.json['error']

def test_user_login(client):
    """Test user login."""
    client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123'
    })

    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 200
    assert 'access_token' in response.json
    assert response.json['user']['email'] == 'test@example.com'

def test_invalid_login(client):
    """Test invalid login."""
    client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123'
    })

    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'wrongpassword'
    })
    assert response.status_code == 401
    assert 'Invalid email or password' in response.json['error']

def test_get_current_user(client):
    """Test getting current user with JWT."""
    # Register user
    register_response = client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123'
    })

    # Login
    login_response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    access_token = login_response.json['access_token']

    # Get current user
    response = client.get(
        '/api/auth/me',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    assert response.status_code == 200
    assert response.json['username'] == 'testuser'

def test_unauthorized_access(client):
    """Test unauthorized access to protected endpoint."""
    response = client.get('/api/auth/me')
    assert response.status_code == 401
