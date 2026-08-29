from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO
from config import config
from extensions import db, jwt, migrate, socketio, init_redis, get_redis
from routes import auth_bp, links_bp, clicks_bp, analytics_bp, stats_bp, bio_bp, settings_bp
from models import Click
from datetime import datetime
import os

def create_app(config_name=None):
    """Create and configure Flask application."""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    socketio.init_app(app, cors_allowed_origins=app.config['CORS_ORIGINS'])
    init_redis(app)

    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(links_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(bio_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(clicks_bp)

    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health():
        """Comprehensive health check."""
        redis = get_redis()

        health_data = {
            'status': 'ok',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'unknown',
            'redis': 'unknown'
        }

        # Check database
        try:
            db.session.execute(db.text('SELECT 1'))
            health_data['database'] = 'ok'
        except Exception as e:
            health_data['database'] = f'error: {str(e)}'
            health_data['status'] = 'degraded'

        # Check Redis
        if redis:
            try:
                redis.ping()
                health_data['redis'] = 'ok'
            except Exception as e:
                health_data['redis'] = f'error: {str(e)}'
                health_data['status'] = 'degraded'
        else:
            health_data['redis'] = 'unavailable'

        status_code = 200 if health_data['status'] == 'ok' else 503
        return jsonify(health_data), status_code

    @app.route('/status', methods=['GET'])
    def status():
        """Status page (public)."""
        return '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>LinkVault Status</title>
            <style>
                body { font-family: monospace; background: #0f0f0f; color: #fff; padding: 20px; }
                h1 { color: #0ea5e9; }
                .ok { color: #10b981; }
                .error { color: #ef4444; }
                .unknown { color: #6b7280; }
                pre { background: #1f1f1f; padding: 10px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>LinkVault Status</h1>
            <p>Check health endpoint for detailed status:</p>
            <pre>GET /health</pre>
            <p><small>Last updated: <span id="time"></span></small></p>
            <script>
                document.getElementById('time').textContent = new Date().toISOString();
                fetch('/health').then(r => r.json()).then(d => {
                    const pre = document.createElement('pre');
                    pre.textContent = JSON.stringify(d, null, 2);
                    document.body.appendChild(pre);
                });
            </script>
        </body>
        </html>
        '''

    # Public redirect route (catch-all for short codes)
    @app.route('/<identifier>', methods=['GET'])
    def public_redirect(identifier):
        """Public redirect to original URL via short code."""
        from flask import redirect as flask_redirect
        from models import Link
        from utils.base62 import decode as base62_decode

        password = request.args.get('p')

        # First try to find by custom slug
        link = Link.query.filter_by(custom_slug=identifier).first()

        # If not found, try to decode identifier as base62 link ID
        if not link:
            try:
                link_id = base62_decode(identifier)
                link = Link.query.get(link_id)
            except:
                pass

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

        # Log click
        from routes.clicks import get_client_ip, get_geolocation, get_device_info
        import random

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

        ip = get_client_ip(request)
        geo = get_geolocation(ip)
        user_agent = request.headers.get('User-Agent')
        device, browser, os = get_device_info(user_agent)

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

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404

    @app.errorhandler(500)
    def server_error(error):
        return jsonify({'error': 'Internal server error'}), 500

    # Create tables
    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    socketio.run(app, host='127.0.0.1', port=5000, debug=True)
