from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, Link, Click, BioLink
from models.ab_test import ABTest
from datetime import datetime
import re

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'username': user.username,
        'email': user.email,
        'avatar_url': user.avatar_url,
        'bio': user.bio,
    }), 200

@settings_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()

    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url'].strip() if data['avatar_url'] else None

    if 'bio' in data:
        bio = data['bio'].strip() if data['bio'] else None
        if bio and len(bio) > 150:
            return jsonify({'error': 'Bio must be 150 chars or less'}), 400
        user.bio = bio

    db.session.commit()
    return jsonify({'message': 'Profile updated', 'user': {
        'username': user.username,
        'email': user.email,
        'avatar_url': user.avatar_url,
        'bio': user.bio,
    }}), 200

@settings_bp.route('/password', methods=['POST'])
@jwt_required()
def change_password():
    """Change password."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')

    # Verify old password
    if not user.check_password(old_password):
        return jsonify({'error': 'Current password is incorrect'}), 401

    # Validate new password
    if len(new_password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    # Set new password
    user.set_password(new_password)
    db.session.commit()

    return jsonify({'message': 'Password changed successfully'}), 200

@settings_bp.route('/delete', methods=['POST'])
@jwt_required()
def delete_account():
    """Delete user account and all related data."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    password = data.get('password', '')
    email_confirmation = data.get('email', '')

    # Verify password
    if not user.check_password(password):
        return jsonify({'error': 'Password is incorrect'}), 401

    # Verify email confirmation
    if email_confirmation != user.email:
        return jsonify({'error': 'Email does not match'}), 400

    try:
        # Get all user's links
        links = Link.query.filter_by(user_id=user_id).all()

        # Delete all clicks for user's links
        for link in links:
            Click.query.filter_by(link_id=link.id).delete()
            ABTest.query.filter_by(link_id=link.id).delete()

        # Delete links (cascade will handle clicks)
        Link.query.filter_by(user_id=user_id).delete()

        # Delete bio links
        BioLink.query.filter_by(user_id=user_id).delete()

        # Delete user
        db.session.delete(user)
        db.session.commit()

        return jsonify({'message': 'Account deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error deleting account'}), 500
