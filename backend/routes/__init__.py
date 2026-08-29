from flask import Blueprint
from .auth import auth_bp
from .links import links_bp
from .clicks import clicks_bp
from .analytics import analytics_bp
from .stats import stats_bp
from .bio import bio_bp
from .settings import settings_bp

__all__ = ['auth_bp', 'links_bp', 'clicks_bp', 'analytics_bp', 'stats_bp', 'bio_bp', 'settings_bp']
