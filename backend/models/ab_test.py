from extensions import db
from datetime import datetime

class ABTest(db.Model):
    __tablename__ = 'ab_tests'

    id = db.Column(db.Integer, primary_key=True)
    link_id = db.Column(db.Integer, db.ForeignKey('links.id', ondelete='CASCADE'), nullable=False, index=True)
    url_a = db.Column(db.String(2048), nullable=False)
    url_b = db.Column(db.String(2048), nullable=False)
    split_percentage = db.Column(db.Integer, default=50, nullable=False)
    clicks_a = db.Column(db.Integer, default=0)
    clicks_b = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        """Convert to dictionary."""
        return {
            'id': self.id,
            'link_id': self.link_id,
            'url_a': self.url_a,
            'url_b': self.url_b,
            'split_percentage': self.split_percentage,
            'clicks_a': self.clicks_a,
            'clicks_b': self.clicks_b,
            'created_at': self.created_at.isoformat(),
        }
