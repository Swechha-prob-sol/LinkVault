"""Seed database with demo data."""
from app import create_app
from extensions import db
from models import User, Link, BioLink
from datetime import datetime, timedelta

def seed():
    """Seed database with demo user and links."""
    app = create_app()

    with app.app_context():
        # Check if demo user already exists
        demo_user = User.query.filter_by(username='demo').first()

        if demo_user:
            print('Demo user already exists. Skipping seed.')
            return

        # Create demo user
        user = User(
            username='demo',
            email='demo@linkvault.io',
            bio='Welcome to LinkVault! This is a demo account.',
            avatar_url='https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
        )
        user.set_password('password123')
        db.session.add(user)
        db.session.flush()

        # Create demo links
        links_data = [
            {
                'original_url': 'https://github.com',
                'title': 'GitHub',
                'custom_slug': 'github'
            },
            {
                'original_url': 'https://twitter.com',
                'title': 'Twitter',
                'custom_slug': 'twitter'
            },
            {
                'original_url': 'https://linkedin.com',
                'title': 'LinkedIn',
                'custom_slug': 'linkedin'
            },
        ]

        for i, link_data in enumerate(links_data):
            link = Link(
                user_id=user.id,
                original_url=link_data['original_url'],
                custom_slug=link_data['custom_slug'],
                title=link_data['title'],
                is_active=True
            )
            db.session.add(link)

        # Create bio links
        bio_links = [
            {
                'title': 'My Portfolio',
                'url': 'https://example.com',
                'icon': 'globe',
                'display_order': 0
            },
            {
                'title': 'Follow on Twitter',
                'url': 'https://twitter.com',
                'icon': 'twitter',
                'display_order': 1
            },
            {
                'title': 'Subscribe to Newsletter',
                'url': 'https://example.com/newsletter',
                'icon': 'mail',
                'display_order': 2
            },
        ]

        for bio_link_data in bio_links:
            bio_link = BioLink(
                user_id=user.id,
                **bio_link_data
            )
            db.session.add(bio_link)

        db.session.commit()
        print(f'✓ Seeded database with demo user (username: demo, password: password123)')

if __name__ == '__main__':
    seed()
