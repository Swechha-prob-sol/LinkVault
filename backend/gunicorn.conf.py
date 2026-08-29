import os

# Server socket
bind = os.getenv('GUNICORN_BIND', '0.0.0.0:5000')
backlog = 2048

# Worker processes
workers = int(os.getenv('GUNICORN_WORKERS', '4'))
worker_class = 'eventlet'  # For Flask-SocketIO
worker_connections = 1000
timeout = 30
keepalive = 2

# Logging
accesslog = '-'
errorlog = '-'
loglevel = os.getenv('GUNICORN_LOG_LEVEL', 'info')
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'linkvault'

# Server mechanics
daemon = False
pidfile = '/tmp/gunicorn.pid'
umask = 0
user = None
group = None

# SSL
keyfile = os.getenv('GUNICORN_KEYFILE', None)
certfile = os.getenv('GUNICORN_CERTFILE', None)

# Application
raw_env = []

def post_fork(server, worker):
    """Initialize worker after fork."""
    pass

def when_ready(server):
    """Server is ready."""
    print('Gunicorn server is ready. Spawning workers')
