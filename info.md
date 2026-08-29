# LinkVault - Quick Reference

## Development Commands

### Backend
```bash
# Install
cd backend && pip install -r requirements.txt

# Database
flask db init              # Initialize migrations (one-time)
flask db migrate           # Create new migration
flask db upgrade           # Apply migrations
flask db downgrade         # Rollback

# Seed data
python seed.py             # Load demo user

# Run
python app.py              # Development server
gunicorn --config gunicorn.conf.py app:app  # Production

# Test
pytest tests/ -v           # Run tests
pytest tests/test_app.py::test_health_check -v  # Single test

# Health
curl http://localhost:5000/health
```

### Frontend
```bash
# Install
cd frontend && npm install

# Development
npm run dev                 # Start dev server on :5173

# Build
npm run build              # Production build to dist/
npm run preview            # Preview production build

# Check
npm run type-check         # Type checking (if using TS)
```

### Docker
```bash
# Build all
docker compose build

# Run all services
docker compose up

# Run in background
docker compose up -d

# Stop
docker compose down

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Execute command
docker compose exec backend flask db upgrade
docker compose exec backend python seed.py
```

## API Quick Test

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@ex.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ex.com","password":"password123"}'
```

### Create Link (requires token)
```bash
curl -X POST http://localhost:5000/api/links \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"original_url":"https://example.com","title":"Example"}'
```

## Environment Setup

### Development
```bash
# .env (backend)
FLASK_ENV=development
DATABASE_URL=sqlite:///linkvault.db
JWT_SECRET_KEY=dev-key-change-in-prod
```

```bash
# .env (frontend)
VITE_API_URL=http://localhost:5000
```

### Production
```bash
# .env (backend)
FLASK_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/linkvault
REDIS_URL=redis://host:6379/0
JWT_SECRET_KEY=<strong-random-string>
FLASK_SECRET_KEY=<strong-random-string>
CORS_ORIGINS=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

## Deployment

### To Heroku
```bash
# Login
heroku login

# Create app
heroku create linkvault-app

# Set vars
heroku config:set FLASK_ENV=production -a linkvault-app
heroku config:set DATABASE_URL=postgresql://... -a linkvault-app
# ... (set all required vars)

# Deploy
git push heroku main

# Migrate
heroku run "flask db upgrade" -a linkvault-app

# Seed
heroku run "python seed.py" -a linkvault-app
```

### To Vercel (Frontend)
```bash
# Install
npm i -g vercel

# Deploy
cd frontend
vercel

# Set env vars in Vercel dashboard
```

## Troubleshooting

### Database Issues
```bash
# Reset local database
rm backend/linkvault.db
flask db upgrade
python seed.py
```

### Port Already in Use
```bash
# Find process using port
lsof -i :5000  # Port 5000
lsof -i :5173  # Port 5173

# Kill process
kill -9 <PID>
```

### Docker Issues
```bash
# Clean everything
docker compose down -v
docker compose build --no-cache
docker compose up
```

## Useful URLs

- **Backend**: http://127.0.0.1:5000
- **Health**: http://127.0.0.1:5000/health
- **Frontend**: http://localhost:5173
- **DB Migrations**: `flask db current` (check current version)

## Documentation Files

- `README.md` — User-facing overview
- `SPEC.md` — Technical specification
- `CLAUDE.md` — Developer guide for future work
- `IMPLEMENTATION_STATUS.md` — Project status
- `explainProjectWorking.md` — Architecture explanation
