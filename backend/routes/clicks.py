from flask import Blueprint, request, jsonify, redirect as flask_redirect
from extensions import db
from models import Link, Click
from datetime import datetime
import requests
import random

clicks_bp = Blueprint('clicks', __name__, url_prefix='/api/clicks')

def get_client_ip(request):
    """Get client IP from request."""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    return request.remote_addr

def get_geolocation(ip):
    """Get geolocation from IP using ip-api.com."""
    try:
        response = requests.get(f'http://ip-api.com/json/{ip}', timeout=2)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                return {
                    'country': data.get('country'),
                    'city': data.get('city'),
                    'country_code': data.get('countryCode'),
                }
    except Exception:
        pass
    return {'country': None, 'city': None, 'country_code': None}

def get_device_info(user_agent):
    """Parse user agent to get device/browser/OS info."""
    ua = user_agent or ''

    device = 'unknown'
    if 'mobile' in ua.lower() or 'android' in ua.lower():
        device = 'mobile'
    elif 'tablet' in ua.lower() or 'ipad' in ua.lower():
        device = 'tablet'
    else:
        device = 'desktop'

    browser = 'unknown'
    if 'chrome' in ua.lower():
        browser = 'chrome'
    elif 'firefox' in ua.lower():
        browser = 'firefox'
    elif 'safari' in ua.lower():
        browser = 'safari'
    elif 'edge' in ua.lower():
        browser = 'edge'

    os = 'unknown'
    if 'windows' in ua.lower():
        os = 'windows'
    elif 'mac' in ua.lower():
        os = 'macos'
    elif 'linux' in ua.lower():
        os = 'linux'
    elif 'android' in ua.lower():
        os = 'android'
    elif 'iphone' in ua.lower() or 'ipad' in ua.lower():
        os = 'ios'

    return device, browser, os

@clicks_bp.route('/r/<identifier>', methods=['GET'])
def redirect_link(identifier):
    """Redirect to original URL and track click."""
    password = request.args.get('p')

    # Find link by custom_slug or base62 short_code
    link = Link.query.filter(
        (Link.custom_slug == identifier) | (Link.short_code == identifier)
    ).first()

    if not link or link.deleted_at:
        return jsonify({'error': 'Link not found'}), 404

    # Check password
    if link.password_hash and not password:
        return jsonify({'error': 'Password required'}), 401

    if link.password_hash and not link.check_password(password):
        return jsonify({'error': 'Invalid password'}), 401

    # Get redirect URL
    redirect_url = link.get_redirect_url()

    if not redirect_url:
        return jsonify({'error': 'Link is not available'}), 410

    # Determine AB variant
    variant = None
    if link.ab_tests:
        ab_test = link.ab_tests[0]
        if random.random() < (ab_test.split_percentage / 100):
            redirect_url = ab_test.url_a
            variant = 'A'
            ab_test.clicks_a += 1
        else:
            redirect_url = ab_test.url_b
            variant = 'B'
            ab_test.clicks_b += 1

    # Get geolocation
    ip = get_client_ip(request)
    geo = get_geolocation(ip)

    # Parse device info
    user_agent = request.headers.get('User-Agent')
    device, browser, os = get_device_info(user_agent)

    # Log click
    click = Click(
        link_id=link.id,
        ip_address=ip,
        country=geo['country'],
        city=geo['city'],
        country_code=geo['country_code'],
        device_type=device,
        browser=browser,
        os=os,
        referrer=request.headers.get('Referer'),
        ab_variant=variant,
    )

    db.session.add(click)
    db.session.commit()

    return flask_redirect(redirect_url, code=302)

@clicks_bp.route('/<int:link_id>/verify-password', methods=['POST'])
def verify_link_password(link_id):
    """Verify password for a protected link."""
    link = Link.query.get(link_id)

    if not link or link.deleted_at:
        return jsonify({'error': 'Link not found'}), 404

    if not link.password_hash:
        return jsonify({'error': 'Link does not require password'}), 400

    data = request.get_json()
    password = data.get('password', '') if data else ''

    if link.check_password(password):
        return jsonify({'message': 'Password correct', 'redirect_url': link.original_url}), 200

    return jsonify({'error': 'Invalid password'}), 401

@clicks_bp.route('/api/clicks/<int:link_id>', methods=['GET'])
def get_clicks(link_id):
    """Get clicks for a link (requires ownership via JWT later)."""
    clicks = Click.query.filter_by(link_id=link_id).all()
    return jsonify([click.to_dict() for click in clicks]), 200
