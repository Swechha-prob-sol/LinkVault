from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Link, Click
from datetime import datetime, timedelta
from sqlalchemy import func

stats_bp = Blueprint('stats', __name__, url_prefix='/api/stats')

@stats_bp.route('/links/<int:link_id>', methods=['GET'])
@jwt_required()
def get_link_stats(link_id):
    """Get comprehensive stats for a link."""
    user_id = int(get_jwt_identity())
    link = Link.query.get(link_id)

    if not link:
        return jsonify({'error': 'Link not found'}), 404

    if link.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    # Parse date range (support 'range' and 'days')
    range_param = request.args.get('range', type=int)
    days_param = request.args.get('days', type=int)
    days = range_param or days_param or 30
    if days > 365:
        days = 365
    elif days < 1:
        days = 1

    start_date = datetime.utcnow() - timedelta(days=days)

    # Total clicks
    total_clicks = Click.query.filter(
        Click.link_id == link_id,
        Click.clicked_at >= start_date
    ).count()

    # Clicks by day query
    clicks_by_day_query = db.session.query(
        func.date(Click.clicked_at).label('date'),
        func.count(Click.id).label('count')
    ).filter(
        Click.link_id == link_id,
        Click.clicked_at >= start_date
    ).group_by(
        func.date(Click.clicked_at)
    ).all()

    # Create mapping of date -> count
    date_counts = {str(day[0]): day[1] for day in clicks_by_day_query if day[0] is not None}

    # Generate continuous sequence of dates for the range
    clicks_over_time = []
    today = datetime.utcnow().date()
    for i in range(days - 1, -1, -1):
        d_str = (today - timedelta(days=i)).isoformat()
        clicks_over_time.append({
            'date': d_str,
            'count': date_counts.get(d_str, 0)
        })

    # Clicks by hour (last 24 hours)
    clicks_by_hour = db.session.query(
        func.extract('hour', Click.clicked_at).label('hour'),
        func.count(Click.id).label('count')
    ).filter(
        Click.link_id == link_id,
        Click.clicked_at >= datetime.utcnow() - timedelta(hours=24)
    ).group_by(
        func.extract('hour', Click.clicked_at)
    ).all()

    # Clicks by country
    clicks_by_country = db.session.query(
        Click.country,
        func.count(Click.id).label('count')
    ).filter(
        Click.link_id == link_id,
        Click.clicked_at >= start_date
    ).group_by(
        Click.country
    ).order_by(
        func.count(Click.id).desc()
    ).limit(10).all()

    # Clicks by device
    clicks_by_device = db.session.query(
        Click.device_type,
        func.count(Click.id).label('count')
    ).filter(
        Click.link_id == link_id,
        Click.clicked_at >= start_date
    ).group_by(
        Click.device_type
    ).order_by(
        func.count(Click.id).desc()
    ).all()

    # Clicks by browser
    clicks_by_browser = db.session.query(
        Click.browser,
        func.count(Click.id).label('count')
    ).filter(
        Click.link_id == link_id,
        Click.clicked_at >= start_date
    ).group_by(
        Click.browser
    ).order_by(
        func.count(Click.id).desc()
    ).all()

    # Clicks by referrer
    clicks_by_referrer = db.session.query(
        Click.referrer,
        func.count(Click.id).label('count')
    ).filter(
        Click.link_id == link_id,
        Click.clicked_at >= start_date,
        Click.referrer != None
    ).group_by(
        Click.referrer
    ).order_by(
        func.count(Click.id).desc()
    ).limit(10).all()

    # Unique countries
    unique_countries = db.session.query(
        func.count(func.distinct(Click.country))
    ).filter(
        Click.link_id == link_id,
        Click.clicked_at >= start_date
    ).scalar() or 0

    # Peak hour
    peak_hour_result = db.session.query(
        func.extract('hour', Click.clicked_at).label('hour'),
        func.count(Click.id).label('count')
    ).filter(
        Click.link_id == link_id,
        Click.clicked_at >= datetime.utcnow() - timedelta(hours=24)
    ).group_by(
        func.extract('hour', Click.clicked_at)
    ).order_by(
        func.count(Click.id).desc()
    ).first()

    peak_hour = int(peak_hour_result[0]) if peak_hour_result and peak_hour_result[0] is not None else None

    return jsonify({
        'link_id': link_id,
        'range': days,
        'total_clicks': total_clicks,
        'unique_countries': unique_countries,
        'peak_hour': peak_hour,
        'clicks_over_time': clicks_over_time,
        'clicks_by_day': clicks_over_time,
        'clicks_by_hour': [
            {'hour': int(hour[0]) if hour[0] is not None else 0, 'count': hour[1]}
            for hour in clicks_by_hour
        ],
        'clicks_by_country': [
            {'country': c[0] or 'Unknown', 'count': c[1]}
            for c in clicks_by_country
        ],
        'clicks_by_device': [
            {'device': d[0] or 'Unknown', 'count': d[1]}
            for d in clicks_by_device
        ],
        'clicks_by_browser': [
            {'browser': b[0] or 'Unknown', 'count': b[1]}
            for b in clicks_by_browser
        ],
        'clicks_by_referrer': [
            {'referrer': r[0] or 'Direct', 'count': r[1]}
            for r in clicks_by_referrer
        ],
    }), 200
