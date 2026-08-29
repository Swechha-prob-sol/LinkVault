from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, get_redis
from models import User, BioLink
from datetime import datetime

bio_bp = Blueprint('bio', __name__, url_prefix='/api/bio')

REDIS_CACHE_TTL = 300  # 5 minutes

def invalidate_bio_cache(username):
    """Invalidate bio cache for a user."""
    redis = get_redis()
    if redis:
        try:
            redis.delete(f'bio:{username}')
        except:
            pass

@bio_bp.route('', methods=['GET'])
@jwt_required()
def get_bio():
    """Get current user's bio settings."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    links = BioLink.query.filter_by(user_id=user_id).order_by(BioLink.display_order).all()

    return jsonify({
        'bio': user.bio,
        'avatar_url': user.avatar_url,
        'page_theme': user.page_theme,
        'username': user.username,
        'links': [link.to_dict() for link in links]
    }), 200

@bio_bp.route('', methods=['PUT'])
@jwt_required()
def update_bio():
    """Update user's bio settings."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()

    if 'bio' in data:
        bio = data['bio'].strip() if data['bio'] else None
        if bio and len(bio) > 150:
            return jsonify({'error': 'Bio must be 150 characters or less'}), 400
        user.bio = bio

    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url'].strip() if data['avatar_url'] else None

    if 'page_theme' in data:
        theme = data['page_theme']
        if theme not in ['dark', 'light', 'purple', 'ocean', 'sunset', 'minimal']:
            return jsonify({'error': 'Invalid theme'}), 400
        user.page_theme = theme

    db.session.commit()
    invalidate_bio_cache(user.username)

    return jsonify({'message': 'Bio updated', 'user': {
        'bio': user.bio,
        'avatar_url': user.avatar_url,
        'page_theme': user.page_theme
    }}), 200

@bio_bp.route('/links', methods=['POST'])
@jwt_required()
def add_bio_link():
    """Add a link to bio."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    title = data.get('title', '').strip()
    url = data.get('url', '').strip()
    icon = data.get('icon', 'link')

    if not title or not url:
        return jsonify({'error': 'Title and URL required'}), 400

    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    # Get next display order
    max_order = db.session.query(db.func.max(BioLink.display_order)).filter_by(user_id=user_id).scalar() or 0

    link = BioLink(
        user_id=user_id,
        title=title,
        url=url,
        icon=icon,
        display_order=max_order + 1
    )

    db.session.add(link)
    db.session.commit()
    invalidate_bio_cache(user.username)

    return jsonify({'message': 'Link added', 'link': link.to_dict()}), 201

@bio_bp.route('/links/<int:link_id>', methods=['PATCH'])
@jwt_required()
def update_bio_link(link_id):
    """Update a bio link."""
    user_id = int(get_jwt_identity())
    link = BioLink.query.get(link_id)

    if not link or link.user_id != user_id:
        return jsonify({'error': 'Link not found'}), 404

    data = request.get_json()

    if 'title' in data:
        link.title = data['title'].strip() if data['title'] else link.title

    if 'url' in data:
        url = data['url'].strip()
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        link.url = url

    if 'icon' in data:
        link.icon = data['icon']

    if 'is_active' in data:
        link.is_active = bool(data['is_active'])

    db.session.commit()
    invalidate_bio_cache(BioLink.query.get(link_id).user.username)

    return jsonify({'message': 'Link updated', 'link': link.to_dict()}), 200

@bio_bp.route('/links/<int:link_id>', methods=['DELETE'])
@jwt_required()
def delete_bio_link(link_id):
    """Delete a bio link."""
    user_id = int(get_jwt_identity())
    link = BioLink.query.get(link_id)

    if not link or link.user_id != user_id:
        return jsonify({'error': 'Link not found'}), 404

    username = link.user.username
    db.session.delete(link)
    db.session.commit()
    invalidate_bio_cache(username)

    return jsonify({'message': 'Link deleted'}), 200

@bio_bp.route('/links/reorder', methods=['PATCH'])
@jwt_required()
def reorder_bio_links():
    """Reorder bio links."""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    link_ids = data.get('link_ids', [])

    # Update display order
    for order, link_id in enumerate(link_ids):
        link = BioLink.query.get(link_id)
        if link and link.user_id == user_id:
            link.display_order = order

    db.session.commit()
    user = User.query.get(user_id)
    invalidate_bio_cache(user.username)

    return jsonify({'message': 'Links reordered'}), 200

@bio_bp.route('/public/<username>', methods=['GET'])
def get_public_bio(username):
    """Get public bio page (no auth required)."""
    redis = get_redis()
    cache_key = f'bio:{username}'

    # Try cache
    if redis:
        try:
            cached = redis.get(cache_key)
            if cached:
                import json
                return jsonify(json.loads(cached)), 200
        except:
            pass

    # Fetch from DB
    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    links = BioLink.query.filter_by(user_id=user.id, is_active=True).order_by(BioLink.display_order).all()

    bio_data = {
        'username': user.username,
        'bio': user.bio,
        'avatar_url': user.avatar_url,
        'page_theme': user.page_theme,
        'links': [link.to_dict() for link in links]
    }

    # Cache it
    if redis:
        try:
            import json
            redis.setex(cache_key, REDIS_CACHE_TTL, json.dumps(bio_data))
        except:
            pass

    return jsonify(bio_data), 200
