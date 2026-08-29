from extensions import db
from datetime import datetime

class Click(db.Model):
    __tablename__ = 'clicks'

    id = db.Column(db.Integer, primary_key=True)
    link_id = db.Column(db.Integer, db.ForeignKey('links.id', ondelete='CASCADE'), nullable=False, index=True)
    clicked_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    ip_address = db.Column(db.String(45))
    country = db.Column(db.String(100))
    city = db.Column(db.String(100))
    country_code = db.Column(db.String(2))
    device_type = db.Column(db.String(50))
    browser = db.Column(db.String(100))
    referrer = db.Column(db.String(2048))
    os = db.Column(db.String(100))
    ab_variant = db.Column(db.String(10))

    def to_dict(self):
        """Convert to dictionary."""
        return {
            'id': self.id,
            'link_id': self.link_id,
            'clicked_at': self.clicked_at.isoformat(),
            'ip_address': self.ip_address,
            'country': self.country,
            'city': self.city,
            'country_code': self.country_code,
            'device_type': self.device_type,
            'browser': self.browser,
            'referrer': self.referrer,
            'os': self.os,
            'ab_variant': self.ab_variant,
        }
