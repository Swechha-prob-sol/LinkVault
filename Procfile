web: cd backend && gunicorn --config gunicorn.conf.py app:app
worker: cd backend && python -c "from app import create_app; app = create_app(); print('Worker ready')"
release: cd backend && flask db upgrade
