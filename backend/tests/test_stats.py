import pytest
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from extensions import db
from models import User, Link, Click

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
def auth_setup(client):
    """Create user and return auth headers and user_id."""
    client.post('/api/auth/register', json={
        'username': 'statsuser',
        'email': 'stats@example.com',
        'password': 'password123'
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'stats@example.com',
        'password': 'password123'
    })
    token = login_res.json['access_token']
    user_id = login_res.json['user']['id']
    return {'headers': {'Authorization': f'Bearer {token}'}, 'user_id': user_id}

def test_get_link_stats_unauthorized(client):
    """Test accessing stats without JWT returns 401."""
    response = client.get('/api/stats/links/1')
    assert response.status_code == 401

def test_get_link_stats_not_found(client, auth_setup):
    """Test non-existent link returns 404."""
    response = client.get('/api/stats/links/999', headers=auth_setup['headers'])
    assert response.status_code == 404
    assert 'Link not found' in response.json['error']

def test_get_link_stats_other_user_forbidden(client, auth_setup):
    """Test user cannot access stats of another user's link."""
    # Create user 2
    client.post('/api/auth/register', json={
        'username': 'otheruser',
        'email': 'other@example.com',
        'password': 'password123'
    })
    login2 = client.post('/api/auth/login', json={
        'email': 'other@example.com',
        'password': 'password123'
    })
    token2 = login2.json['access_token']

    # User 1 creates link
    link_res = client.post('/api/links', json={
        'original_url': 'https://google.com',
        'title': 'Google'
    }, headers=auth_setup['headers'])
    link_id = link_res.json['link']['id']

    # User 2 tries to access User 1's link stats
    response = client.get(f'/api/stats/links/{link_id}', headers={'Authorization': f'Bearer {token2}'})
    assert response.status_code == 403
    assert 'Unauthorized' in response.json['error']

def test_get_link_stats_success_and_range(client, app, auth_setup):
    """Test stats response with clicks over time, range query param, and browser breakdown."""
    # Create link
    link_res = client.post('/api/links', json={
        'original_url': 'https://example.com/target',
        'title': 'Example'
    }, headers=auth_setup['headers'])
    link_id = link_res.json['link']['id']

    # Seed some clicks with different dates, browsers, devices, countries
    with app.app_context():
        c1 = Click(
            link_id=link_id,
            clicked_at=datetime.utcnow(),
            country='United States',
            city='New York',
            device_type='Desktop',
            browser='Chrome',
            referrer='https://twitter.com'
        )
        c2 = Click(
            link_id=link_id,
            clicked_at=datetime.utcnow() - timedelta(days=2),
            country='Germany',
            city='Berlin',
            device_type='Mobile',
            browser='Safari',
            referrer='https://linkedin.com'
        )
        c3 = Click(
            link_id=link_id,
            clicked_at=datetime.utcnow() - timedelta(days=15),
            country='United States',
            city='San Francisco',
            device_type='Tablet',
            browser='Firefox',
            referrer=None
        )
        db.session.add_all([c1, c2, c3])
        db.session.commit()

    # Test range=7 (should only include clicks within last 7 days: c1, c2)
    res_7 = client.get(f'/api/stats/links/{link_id}?range=7', headers=auth_setup['headers'])
    assert res_7.status_code == 200
    data_7 = res_7.json
    assert data_7['total_clicks'] == 2
    assert len(data_7['clicks_over_time']) == 7
    assert data_7['range'] == 7
    assert any(b['browser'] == 'Chrome' for b in data_7['clicks_by_browser'])

    # Test range=30 (should include all 3 clicks)
    res_30 = client.get(f'/api/stats/links/{link_id}?range=30', headers=auth_setup['headers'])
    assert res_30.status_code == 200
    data_30 = res_30.json
    assert data_30['total_clicks'] == 3
    assert len(data_30['clicks_over_time']) == 30
    assert data_30['range'] == 30
    assert len(data_30['clicks_by_device']) >= 3
    assert len(data_30['clicks_by_country']) >= 2
