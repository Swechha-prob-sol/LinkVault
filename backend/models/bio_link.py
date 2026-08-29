from extensions import db
from datetime import datetime

class BioLink(db.Model):
    __tablename__ = 'bio_links'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    url = db.Column(db.String(2048), nullable=False)
    display_order = db.Column(db.Integer, default=0)
    icon = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        """Convert to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'url': self.url,
            'display_order': self.display_order,
            'icon': self.icon,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
        }
