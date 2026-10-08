from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Link, Click
from datetime import datetime, timedelta
from sqlalchemy import func

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_analytics_overview():
    """Get account-wide analytics overview for the current user."""
    user_id = int(get_jwt_identity())

    # User's non-deleted links base query
    user_links_filter = (Link.user_id == user_id, Link.deleted_at.is_(None))

    total_links = Link.query.filter(*user_links_filter).count()
    total_active_links = Link.query.filter(*user_links_filter, Link.is_active.is_(True)).count()

    # Total clicks across all user's non-deleted links
    total_clicks = db.session.query(func.count(Click.id)).join(
        Link, Click.link_id == Link.id
    ).filter(
        Link.user_id == user_id,
        Link.deleted_at.is_(None)
    ).scalar() or 0

    # Clicks in the last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    clicks_7d = db.session.query(func.count(Click.id)).join(
        Link, Click.link_id == Link.id
    ).filter(
        Link.user_id == user_id,
        Link.deleted_at.is_(None),
        Click.clicked_at >= seven_days_ago
    ).scalar() or 0

    # Clicks in the last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    clicks_30d = db.session.query(func.count(Click.id)).join(
        Link, Click.link_id == Link.id
    ).filter(
        Link.user_id == user_id,
        Link.deleted_at.is_(None),
        Click.clicked_at >= thirty_days_ago
    ).scalar() or 0

    # Top 5 links by clicks
    top_links_query = db.session.query(
        Link,
        func.count(Click.id).label('clicks')
    ).outerjoin(
        Click, Click.link_id == Link.id
    ).filter(
        Link.user_id == user_id,
        Link.deleted_at.is_(None)
    ).group_by(
        Link.id
    ).order_by(
        func.count(Click.id).desc()
    ).limit(5).all()

    top_links = []
    for link, click_cnt in top_links_query:
        item = link.to_dict()
        item['clicks'] = click_cnt
        top_links.append(item)

    # Clicks per day for the last 30 days
    clicks_per_day_query = db.session.query(
        func.date(Click.clicked_at).label('date'),
        func.count(Click.id).label('count')
    ).join(
        Link, Click.link_id == Link.id
    ).filter(
        Link.user_id == user_id,
        Link.deleted_at.is_(None),
        Click.clicked_at >= thirty_days_ago
    ).group_by(
        func.date(Click.clicked_at)
    ).all()

    date_counts = {str(r[0]): r[1] for r in clicks_per_day_query if r[0] is not None}
    today = datetime.utcnow().date()
    clicks_per_day = []
    for i in range(29, -1, -1):
        d_str = (today - timedelta(days=i)).isoformat()
        clicks_per_day.append({
            'date': d_str,
            'count': date_counts.get(d_str, 0)
        })

    return jsonify({
        'total_clicks': total_clicks,
        'total_links': total_links,
        'total_active_links': total_active_links,
        'clicks_7d': clicks_7d,
        'clicks_30d': clicks_30d,
        'top_links': top_links,
        'clicks_per_day': clicks_per_day,
    }), 200
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
