from extensions import db
from datetime import datetime
import bcrypt
from utils.base62 import encode as base62_encode

# Avoid circular import by doing lazy import in method
Click = None

class Link(db.Model):
    __tablename__ = 'links'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    original_url = db.Column(db.String(2048), nullable=False)
    custom_slug = db.Column(db.String(100), unique=True, index=True)
    title = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    activated_at = db.Column(db.DateTime)
    expires_at = db.Column(db.DateTime)
    click_limit = db.Column(db.Integer)
    password_hash = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    deleted_at = db.Column(db.DateTime)

    # Relationships
    clicks = db.relationship('Click', backref='link', lazy=True, cascade='all, delete-orphan')
    ab_tests = db.relationship('ABTest', backref='link', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        """Hash and set password."""
        salt = bcrypt.gensalt(rounds=12)
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password):
        """Verify password against hash."""
        if not self.password_hash:
            return True
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def get_redirect_url(self):
        """Get the URL to redirect to."""
        # Check if expired
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return None

        # Check if click limit reached
        if self.click_limit:
            click_count = Click.query.filter_by(link_id=self.id).count()
            if click_count >= self.click_limit:
                return None

        # Check if active
        if not self.is_active:
            return None

        # Check if activated
        if self.activated_at and datetime.utcnow() < self.activated_at:
            return None

        return self.original_url

    def get_short_code(self):
        """Get the effective short code (prefer custom_slug, fallback to base62 of ID)."""
        if self.custom_slug:
            return self.custom_slug
        if self.id:
            return base62_encode(self.id)
        return None

    def to_dict(self):
        """Convert to dictionary."""
        # Lazy import to avoid circular dependencies
        from models.click import Click

        return {
            'id': self.id,
            'user_id': self.user_id,
            'original_url': self.original_url,
            'short_code': self.get_short_code(),
            'custom_slug': self.custom_slug,
            'title': self.title,
            'is_active': self.is_active,
            'activated_at': self.activated_at.isoformat() if self.activated_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'click_limit': self.click_limit,
            'created_at': self.created_at.isoformat(),
            'has_password': bool(self.password_hash),
            'click_count': Click.query.filter_by(link_id=self.id).count(),
        }
