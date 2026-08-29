from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, Link
from models.ab_test import ABTest
from datetime import datetime
from utils.base62 import encode as base62_encode
import re

links_bp = Blueprint('links', __name__, url_prefix='/api/links')

def validate_url(url):
    """Validate and normalize URL."""
    url = url.strip()
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    # Basic URL validation
    if len(url) < 10 or len(url) > 2048:
        return None
    return url

def validate_slug(slug):
    """Validate custom slug format."""
    if not slug:
        return True
    slug = slug.strip()
    if len(slug) < 2 or len(slug) > 50:
        return False
    if not re.match(r'^[a-z0-9-]+$', slug):
        return False
    return True

@links_bp.route('', methods=['POST'])
@jwt_required()
def create_link():
    """Create a new short link."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    original_url = data.get('original_url', '').strip()
    custom_slug = data.get('custom_slug', '').strip() if data.get('custom_slug') else None
    title = data.get('title', '').strip() if data.get('title') else None
    password = data.get('password', '').strip() if data.get('password') else None
    activated_at = data.get('activated_at')
    expires_at = data.get('expires_at')
    click_limit = data.get('click_limit')
    ab_test_data = data.get('ab_test')

    # Validate original URL
    original_url = validate_url(original_url)
    if not original_url:
        return jsonify({'error': 'Invalid URL format'}), 400

    # Validate custom slug
    if custom_slug:
        if not validate_slug(custom_slug):
            return jsonify({'error': 'Invalid slug format (alphanumeric and hyphens, 2-50 chars)'}), 400
        if Link.query.filter_by(custom_slug=custom_slug).first():
            return jsonify({'error': 'Slug already taken'}), 409

    # Validate dates
    try:
        if activated_at:
            activated_at = datetime.fromisoformat(activated_at)
        if expires_at:
            expires_at = datetime.fromisoformat(expires_at)
            if activated_at and expires_at <= activated_at:
                return jsonify({'error': 'Expiration must be after activation'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400

    # Validate click limit
    if click_limit:
        try:
            click_limit = int(click_limit)
            if click_limit < 1:
                return jsonify({'error': 'Click limit must be at least 1'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid click limit'}), 400

    # Create link
    link = Link(
        user_id=user_id,
        original_url=original_url,
        custom_slug=custom_slug,
        title=title or None,
        activated_at=activated_at,
        expires_at=expires_at,
        click_limit=click_limit,
    )

    if password:
        link.set_password(password)

    db.session.add(link)
    db.session.flush()  # Get the link ID

    # Create A/B test if provided
    if ab_test_data:
        url_b = ab_test_data.get('url_b', '').strip()
        split = ab_test_data.get('split_percentage', 50)

        if url_b:
            if not url_b.startswith(('http://', 'https://')):
                url_b = 'https://' + url_b

            try:
                split = int(split)
                if 1 <= split <= 99:
                    ab_test = ABTest(
                        link_id=link.id,
                        url_a=original_url,
                        url_b=url_b,
                        split_percentage=split
                    )
                    db.session.add(ab_test)
            except:
                pass

    db.session.commit()

    return jsonify({
        'message': 'Link created successfully',
        'link': link.to_dict()
    }), 201

@links_bp.route('', methods=['GET'])
@jwt_required()
def get_links():
    """Get all links for the current user."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    links = Link.query.filter_by(user_id=user_id, deleted_at=None).order_by(Link.created_at.desc()).all()
    return jsonify([link.to_dict() for link in links]), 200

@links_bp.route('/<int:link_id>', methods=['GET'])
@jwt_required()
def get_link(link_id):
    """Get a specific link."""
    user_id = int(get_jwt_identity())
    link = Link.query.get(link_id)

    if not link:
        return jsonify({'error': 'Link not found'}), 404

    if link.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify(link.to_dict()), 200

@links_bp.route('/<int:link_id>', methods=['PATCH', 'PUT'])
@jwt_required()
def update_link(link_id):
    """Update a link."""
    user_id = int(get_jwt_identity())
    link = Link.query.get(link_id)

    if not link:
        return jsonify({'error': 'Link not found'}), 404

    if link.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # Update fields
    if 'title' in data:
        link.title = data['title'].strip() if data['title'] else None

    if 'is_active' in data:
        link.is_active = bool(data['is_active'])

    if 'activated_at' in data:
        try:
            link.activated_at = datetime.fromisoformat(data['activated_at']) if data['activated_at'] else None
        except ValueError:
            return jsonify({'error': 'Invalid activated_at format'}), 400

    if 'expires_at' in data:
        try:
            link.expires_at = datetime.fromisoformat(data['expires_at']) if data['expires_at'] else None
        except ValueError:
            return jsonify({'error': 'Invalid expires_at format'}), 400

    if 'click_limit' in data:
        try:
            link.click_limit = int(data['click_limit']) if data['click_limit'] else None
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid click_limit'}), 400

    db.session.commit()

    return jsonify({
        'message': 'Link updated successfully',
        'link': link.to_dict()
    }), 200

@links_bp.route('/<int:link_id>', methods=['DELETE'])
@jwt_required()
def delete_link(link_id):
    """Soft delete a link."""
    user_id = int(get_jwt_identity())
    link = Link.query.get(link_id)

    if not link:
        return jsonify({'error': 'Link not found'}), 404

    if link.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    link.deleted_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Link deleted successfully'}), 200

@links_bp.route('/<int:link_id>/abtest', methods=['GET'])
@jwt_required()
def get_abtest(link_id):
    """Get A/B test for a link."""
    user_id = int(get_jwt_identity())
    link = Link.query.get(link_id)

    if not link or link.user_id != user_id:
        return jsonify({'error': 'Link not found'}), 404

    if link.ab_tests:
        return jsonify(link.ab_tests[0].to_dict()), 200

    return jsonify({'error': 'No A/B test configured'}), 404

@links_bp.route('/<int:link_id>/abtest', methods=['POST', 'PUT'])
@jwt_required()
def create_or_update_abtest(link_id):
    """Create or update A/B test for a link."""
    user_id = int(get_jwt_identity())
    link = Link.query.get(link_id)

    if not link or link.user_id != user_id:
        return jsonify({'error': 'Link not found'}), 404

    data = request.get_json()
    url_b = data.get('url_b', '').strip()
    split = data.get('split_percentage', 50)

    if not url_b:
        return jsonify({'error': 'url_b required'}), 400

    if not url_b.startswith(('http://', 'https://')):
        url_b = 'https://' + url_b

    try:
        split = int(split)
        if split < 1 or split > 99:
            return jsonify({'error': 'split_percentage must be 1-99'}), 400
    except:
        return jsonify({'error': 'Invalid split_percentage'}), 400

    # Delete existing A/B test
    ABTest.query.filter_by(link_id=link_id).delete()

    # Create new one
    ab_test = ABTest(
        link_id=link_id,
        url_a=link.original_url,
        url_b=url_b,
        split_percentage=split
    )

    db.session.add(ab_test)
    db.session.commit()

    return jsonify({'message': 'A/B test created', 'abtest': ab_test.to_dict()}), 201

@links_bp.route('/<int:link_id>/abtest', methods=['DELETE'])
@jwt_required()
def delete_abtest(link_id):
    """Delete A/B test."""
    user_id = int(get_jwt_identity())
    link = Link.query.get(link_id)

    if not link or link.user_id != user_id:
        return jsonify({'error': 'Link not found'}), 404

    ABTest.query.filter_by(link_id=link_id).delete()
    db.session.commit()

    return jsonify({'message': 'A/B test deleted'}), 200
