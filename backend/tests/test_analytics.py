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
def auth_user(client):
    """Create a user and return token and user dict."""
    client.post('/api/auth/register', json={
        'username': 'overviewuser',
        'email': 'overview@example.com',
        'password': 'password123'
    })
    res = client.post('/api/auth/login', json={
        'email': 'overview@example.com',
        'password': 'password123'
    })
    token = res.json['access_token']
    user = res.json['user']
    return {'headers': {'Authorization': f'Bearer {token}'}, 'user': user}

def test_get_analytics_overview_unauthorized(client):
    """Test accessing analytics overview without token returns 401."""
    res = client.get('/api/analytics/overview')
    assert res.status_code == 401

def test_get_analytics_overview_empty(client, auth_user):
    """Test overview when user has no links or clicks."""
    res = client.get('/api/analytics/overview', headers=auth_user['headers'])
    assert res.status_code == 200
    data = res.json
    assert data['total_clicks'] == 0
    assert data['total_links'] == 0
    assert data['total_active_links'] == 0
    assert data['clicks_7d'] == 0
    assert data['clicks_30d'] == 0
    assert data['top_links'] == []
    assert len(data['clicks_per_day']) == 30

def test_get_analytics_overview_with_data_and_isolation(client, app, auth_user):
    """Test overview computes correct totals, 7d/30d filters, top links, and respects soft deletes and other users."""
    headers1 = auth_user['headers']

    # Create another user
    client.post('/api/auth/register', json={
        'username': 'otheroverview',
        'email': 'otheroverview@example.com',
        'password': 'password123'
    })
    login2 = client.post('/api/auth/login', json={
        'email': 'otheroverview@example.com',
        'password': 'password123'
    })
    headers2 = {'Authorization': f"Bearer {login2.json['access_token']}"}

    # User 1 creates 2 active links and 1 link to delete
    res_l1 = client.post('/api/links', json={'original_url': 'https://link1.com', 'title': 'Link 1'}, headers=headers1)
    res_l2 = client.post('/api/links', json={'original_url': 'https://link2.com', 'title': 'Link 2'}, headers=headers1)
    res_l3 = client.post('/api/links', json={'original_url': 'https://link3.com', 'title': 'Link 3'}, headers=headers1)
    l1_id = res_l1.json['link']['id']
    l2_id = res_l2.json['link']['id']
    l3_id = res_l3.json['link']['id']

    # Soft delete link 3
    client.delete(f'/api/links/{l3_id}', headers=headers1)

    # User 2 creates a link
    res_l_other = client.post('/api/links', json={'original_url': 'https://other.com', 'title': 'Other'}, headers=headers2)
    l_other_id = res_l_other.json['link']['id']

    # Add clicks with different timestamps
    with app.app_context():
        now = datetime.utcnow()
        # User 1 - Link 1: 2 clicks within 7 days, 1 click 10 days ago (within 30d)
        c1 = Click(link_id=l1_id, clicked_at=now)
        c2 = Click(link_id=l1_id, clicked_at=now - timedelta(days=2))
        c3 = Click(link_id=l1_id, clicked_at=now - timedelta(days=10))

        # User 1 - Link 2: 1 click 40 days ago (older than 30d)
        c4 = Click(link_id=l2_id, clicked_at=now - timedelta(days=40))

        # Deleted Link 3: 1 click
        c5 = Click(link_id=l3_id, clicked_at=now)

        # Other user's link: 5 clicks
        c_other = [Click(link_id=l_other_id, clicked_at=now) for _ in range(5)]

        db.session.add_all([c1, c2, c3, c4, c5] + c_other)
        db.session.commit()

    # Query overview for User 1
    res = client.get('/api/analytics/overview', headers=headers1)
    assert res.status_code == 200
    data = res.json

    assert data['total_links'] == 2  # Link 3 is soft deleted
    assert data['total_active_links'] == 2
    assert data['total_clicks'] == 4  # c1, c2, c3, c4 (c5 from deleted link is excluded, c_other excluded)
    assert data['clicks_7d'] == 2  # c1, c2
    assert data['clicks_30d'] == 3  # c1, c2, c3
    assert len(data['top_links']) == 2
    assert data['top_links'][0]['id'] == l1_id
    assert data['top_links'][0]['clicks'] == 3
    assert len(data['clicks_per_day']) == 30
