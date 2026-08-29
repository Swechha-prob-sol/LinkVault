# LinkVault Development Guide

## Project Structure

```
/linkvault
  /backend
    /models          # SQLAlchemy ORM models (User, Link, Click, ABTest, BioLink)
    /routes          # Flask blueprints (auth, links, clicks, analytics)
    /tests           # Pytest suite
    app.py           # Flask app factory
    config.py        # Config per environment
    extensions.py    # Flask extensions (db, jwt, migrate, socketio, redis)
    requirements.txt # Python dependencies

  /frontend
    /src
      /pages         # React pages (Login, Register, Dashboard)
      /components    # Reusable components (AuthLayout, ProtectedRoute)
      /layouts       # AppShell (sidebar + header)
      /context       # AuthContext (user state, login, register, logout)
      /hooks         # useAuth hook
      /api           # Axios client + auth API calls
      /utils         # Helpers
      App.jsx        # Router setup
      main.jsx       # React entry
      index.css      # Tailwind + custom styles
    package.json
    vite.config.js

  README.md          # User-facing docs
  SPEC.md            # Feature specification
  CLAUDE.md          # This file
```

## Development Workflow

### Starting Services
```bash
# Terminal 1: Backend
cd backend
python app.py
# http://127.0.0.1:5000

# Terminal 2: Frontend
cd frontend
npm run dev
# http://localhost:5173
```

### Making Changes
- **Backend:** Edit `/backend/routes/`, `/backend/models/`. Flask auto-reloads.
- **Frontend:** Edit `/frontend/src/`. Vite HMR reloads instantly.

### Testing Backend
```bash
cd backend
python -m pytest tests/ -v
```

### Building Frontend
```bash
cd frontend
npm run build  # dist/ folder ready for deployment
```

## Key Decisions

### Database
- **Local dev:** SQLite (fast, no server setup)
- **Staging/Prod:** Set `DATABASE_URL=postgresql://...`
- Code is fully portable via environment variables.

### Frontend Auth
- **Storage:** JWT token in localStorage
- **Refresh:** Token persists across page reloads via `useEffect` in AuthContext
- **Invalid token:** Auto-redirects to `/login`

### Styling
- **Tailwind CSS v4** with custom theme colors (brand-500, surface-900, etc.)
- **Components:** Reusable `.btn-primary`, `.input-field`, `.glass-card` classes
- **Responsive:** Mobile-first, sidebar hidden <md breakpoint

### Protected Routes
- `<ProtectedRoute />` wraps `/dashboard` and other authenticated pages
- Checks `useAuth().isAuthenticated` before rendering
- Redirects unauthenticated users to `/login`

## Common Tasks

### Add a new API endpoint
1. Create route handler in `/backend/routes/` blueprint
2. Register blueprint in `app.py`
3. Add Axios call in `/frontend/src/api/`
4. Use in component via `useAuth()` or direct call

### Add a new database model
1. Create model file in `/backend/models/`
2. Import in `models/__init__.py`
3. Run `flask db migrate` (once migrations are set up)
4. Run `flask db upgrade`

### Add a new protected page
1. Create component in `/frontend/src/pages/PageName.jsx`
2. Add route in `App.jsx` inside `<ProtectedRoute>`
3. Add nav item in `/frontend/src/layouts/AppShell.jsx`

## Debugging

### Backend
- Check `backend.log` for errors
- Add `print()` or `app.logger.info()` for debugging
- Flask debugger: http://127.0.0.1:5000/__debugger__

### Frontend
- Browser console: F12 → Console tab
- Network: Check API requests (should see `/api/auth/*` calls)
- React DevTools: Inspect component state

## Deployment Notes

### Environment Variables
Before deploying, ensure:
- `DATABASE_URL` points to production Postgres
- `JWT_SECRET_KEY` is a strong random string (not 'dev-secret-key')
- `FRONTEND_URL` matches your domain
- `CORS_ORIGINS` includes your frontend domain

### Database Migrations
```bash
cd backend
flask db upgrade  # Run on deployment
```

### Building Frontend
```bash
cd frontend
npm run build     # Creates optimized dist/
```

## Future Enhancements

- [ ] Link creation UI & API
- [ ] Click analytics dashboard
- [ ] Link-in-Bio page builder
- [ ] Real-time click notifications (WebSocket)
- [ ] A/B testing dashboard
- [ ] Advanced analytics & exports
- [ ] Dark/light theme toggle
- [ ] Mobile app (React Native)
