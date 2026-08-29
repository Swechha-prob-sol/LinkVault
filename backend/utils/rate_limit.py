from functools import wraps
from flask import request, jsonify
from extensions import get_redis
from datetime import datetime, timedelta
import time

def rate_limit(max_requests, window_seconds, key_func=None):
    """Rate limit decorator using Redis."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            redis = get_redis()

            # If no Redis, skip rate limiting
            if not redis:
                return f(*args, **kwargs)

            # Determine the key
            if key_func:
                key = key_func()
            else:
                # Default: use IP address
                key = request.remote_addr

            rate_key = f'rate_limit:{f.__name__}:{key}'

            try:
                current = redis.incr(rate_key)

                if current == 1:
                    redis.expire(rate_key, window_seconds)

                if current > max_requests:
                    reset_time = redis.ttl(rate_key)
                    return jsonify({
                        'error': 'Rate limit exceeded',
                        'retry_after': reset_time
                    }), 429

                # Set headers
                remaining = max_requests - current
                reset = time.time() + redis.ttl(rate_key)

            except Exception as e:
                # Log but don't fail
                print(f'Rate limit error: {e}')
                return f(*args, **kwargs)

            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_user_key():
    """Get key for authenticated user."""
    from flask_jwt_extended import get_jwt_identity
    try:
        return f'user:{get_jwt_identity()}'
    except:
        return request.remote_addr
