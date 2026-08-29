from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Link, Click
from datetime import datetime, timedelta
from sqlalchemy import func

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/links/<int:link_id>/summary', methods=['GET'])
@jwt_required()
def get_link_analytics_summary(link_id):
    """Get analytics summary for a link."""
    user_id = int(get_jwt_identity())
    link = Link.query.get(link_id)

    if not link:
        return jsonify({'error': 'Link not found'}), 404

    if link.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    total_clicks = Click.query.filter_by(link_id=link_id).count()

    # Clicks by day (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    clicks_by_day = db.session.query(
        func.date(Click.clicked_at).label('date'),
        func.count(Click.id).label('count')
    ).filter(
        Click.link_id == link_id,
        Click.clicked_at >= thirty_days_ago
    ).group_by(
        func.date(Click.clicked_at)
    ).all()

    return jsonify({
        'total_clicks': total_clicks,
        'clicks_by_day': [
            {'date': str(day[0]), 'count': day[1]}
            for day in clicks_by_day
        ]
    }), 200

@analytics_bp.route('/links/<int:link_id>/details', methods=['GET'])
@jwt_required()
def get_link_analytics_details(link_id):
    """Get detailed analytics for a link."""
    user_id = int(get_jwt_identity())
    link = Link.query.get(link_id)

    if not link:
        return jsonify({'error': 'Link not found'}), 404

    if link.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    clicks = Click.query.filter_by(link_id=link_id).all()

    return jsonify([click.to_dict() for click in clicks]), 200
