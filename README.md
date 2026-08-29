# LinkVault

A modern, production-ready link management and analytics platform. Create, track, and optimize shortened URLs with advanced features like A/B testing, scheduling, and Link-in-Bio pages.

## ✨ Features

- **URL Shortening** — Custom slugs, auto-generated short codes, password protection
- **Analytics** — Track clicks by country, device, browser, referrer, time
- **A/B Testing** — Split traffic between two URLs, track performance
- **Scheduling** — Activate and expire links on a schedule
- **Link-in-Bio** — Create a custom landing page with multiple links
- **QR Codes** — Generate and download QR codes for your links
- **Click Tracking** — Detailed geolocation, device, and referrer data
- **Authentication** — Secure JWT-based user authentication
- **Rate Limiting** — Protect against brute force and abuse
- **Dark Mode** — Premium dark theme by default

## 🏗️ Architecture

```
Frontend (React/Vite)
    ↓ (Axios)
API (Flask/Python)
    ↓
PostgreSQL + Redis
    ↓
Click tracking, A/B routing, Analytics aggregation
```

### Tech Stack

**Backend:**
- Python 3.11 + Flask
- SQLAlchemy ORM
- Flask-JWT-Extended (JWT auth)
- Flask-SocketIO (real-time updates)
- PostgreSQL / SQLite
- Redis (caching, rate limiting)

**Frontend:**
- React 19
- Vite 8.2.1
- React Router
- Tailwind CSS v4
- Axios
- TanStack Query

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL (production) or SQLite (dev)
- Redis (optional, graceful fallback)
- Docker & Docker Compose (optional)

### Local Development

**Clone & Setup:**
```bash
git clone https://github.com/yourusername/linkvault.git
cd linkvault
```

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Run migrations
flask db upgrade

# Seed demo data (optional)
python seed.py

# Start server
python app.py
# http://127.0.0.1:5000/health
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

### Docker

```bash
# Build
docker compose build

# Run all services
docker compose up

# Access:
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

## 📝 Environment Variables

### Backend (`backend/.env`)
```
FLASK_ENV=development
DATABASE_URL=sqlite:///linkvault.db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-secret-key
FLASK_SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

## 🧪 Testing

**Backend:**
```bash
cd backend
python -m pytest tests/ -v
```

**Frontend:**
```bash
cd frontend
npm run build  # Verify build succeeds
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` — Create user
- `POST /api/auth/login` — Get JWT token
- `GET /api/auth/me` — Get current user (requires JWT)

### Links
- `POST /api/links` — Create short link
- `GET /api/links` — List user's links
- `GET /api/links/<id>` — Get link details
- `PATCH /api/links/<id>` — Update link
- `DELETE /api/links/<id>` — Delete link

### Redirects (Public)
- `GET /<short_code>` — Redirect to original URL, track click

### A/B Testing
- `POST /api/links/<id>/abtest` — Create A/B test
- `GET /api/links/<id>/abtest` — Get A/B test details

### Analytics
- `GET /api/stats/links/<id>` — Get click statistics

### Bio
- `GET /api/bio` — Get user's bio (requires JWT)
- `PUT /api/bio` — Update bio settings (requires JWT)
- `GET /api/bio/public/<username>` — Get public bio page

### Settings
- `GET /api/settings/profile` — Get profile (requires JWT)
- `PUT /api/settings/profile` — Update profile (requires JWT)
- `POST /api/settings/password` — Change password (requires JWT)
- `POST /api/settings/delete` — Delete account (requires JWT)

### Health
- `GET /health` — Detailed health check (database, Redis, status)
- `GET /status` — Status page (HTML, public)

## 🔒 Security

- JWT authentication with 30-day expiry
- bcrypt password hashing (12 rounds)
- CORS protection
- Rate limiting on authentication and API endpoints
- SQL injection prevention (SQLAlchemy ORM)
- XSS prevention (React auto-escaping)
- HTTPS-ready (use reverse proxy)
- Secure session cookies (httponly, secure, samesite)

## 📦 Deployment

### Heroku / Similar PaaS

1. **Set Environment Variables:**
   ```bash
   heroku config:set FLASK_ENV=production
   heroku config:set DATABASE_URL=postgresql://...
   heroku config:set REDIS_URL=redis://...
   heroku config:set JWT_SECRET_KEY=<random-string>
   heroku config:set FLASK_SECRET_KEY=<random-string>
   ```

2. **Deploy Backend:**
   ```bash
   git push heroku main  # if using Procfile
   ```

3. **Deploy Frontend:**
   - Push to Vercel/Netlify, or
   - Build and host static files on S3/CDN

### Docker Production

```bash
# Build images
docker compose -f docker-compose.yml build

# Run with production settings
docker compose up -d
```

## 📖 Documentation

- `SPEC.md` — Feature specifications and technical details
- `CLAUDE.md` — Development guide for future work
- `explainProjectWorking.md` — Architecture explanation
- `IMPLEMENTATION_STATUS.md` — Current status and roadmap

## 🛣️ Roadmap

- [x] Core link shortening
- [x] Click analytics
- [x] A/B testing
- [x] Link-in-Bio
- [x] User authentication
- [x] Admin settings
- [ ] Advanced analytics dashboard
- [ ] Bulk operations
- [ ] Team collaboration
- [ ] Webhook integrations
- [ ] Mobile app

## 📄 License

MIT License - see LICENSE file

## 👤 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 💬 Support

- GitHub Issues for bug reports
- Email: support@linkvault.io

---

**Made with ❤️ for link management**
