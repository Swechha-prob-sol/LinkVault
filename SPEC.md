# LinkVault Specification

## Overview

LinkVault is a full-stack link management and analytics platform. Users can create shortened URLs, customize slugs, password-protect links, and track click analytics in real-time.

## Core Features

### 1. User Authentication
- **Registration:** Email, username, password validation
- **Login:** Email + password → JWT token
- **Session:** JWT persists in localStorage, auto-refreshes on page load
- **Logout:** Clear token + redirect to login

### 2. Link Management (Planned)
- **Create:** Original URL → auto-generated 6-char code + optional custom slug
- **Customize:** Title, password protection, activation date, expiration date, click limit
- **Edit:** Update title, active status, expiration, limits
- **Delete:** Soft delete (mark deleted_at timestamp)
- **List:** User's links with click counts

### 3. Redirect & Tracking
- **Redirect:** GET `/api/clicks/r/<slug>` → Track click + 302 redirect
- **Password-protected:** Require `?p=password` param to redirect
- **Click limits:** Refuse redirect if click_limit reached
- **Activation window:** Refuse redirect if not yet activated or expired

### 4. Analytics (Planned)
- **Dashboard:** Total links, total clicks, active links (stat cards)
- **Click history:** IP, country, city, device, browser, OS, referrer, timestamp
- **Trends:** Click count by day (last 30 days chart)
- **Real-time:** WebSocket notifications for new clicks

### 5. A/B Testing (Planned)
- **Create test:** Original link → split between URL-A and URL-B
- **Split control:** Custom percentage (default 50/50)
- **Track:** Record which variant user clicked
- **Results:** Dashboard showing clicks per variant

### 6. Link-in-Bio (Planned)
- **Custom page:** Personalized landing at `/u/<username>`
- **Links list:** Drag-drop reordering, custom titles + icons
- **Theming:** Dark/light, custom colors, background image
- **Preview:** Live preview while editing

## API Structure

### Authentication
```
POST   /api/auth/register              → Create user
POST   /api/auth/login                 → Get token
GET    /api/auth/me                    → Current user (JWT required)
```

### Links
```
POST   /api/links                      → Create link
GET    /api/links                      → List my links
GET    /api/links/<id>                 → Get link
PUT    /api/links/<id>                 → Update link
DELETE /api/links/<id>                 → Delete link
```

### Clicks & Redirects
```
GET    /api/clicks/r/<slug>            → Redirect + track
GET    /api/clicks/<link_id>           → Get clicks (admin only)
```

### Analytics
```
GET    /api/analytics/links/<id>/summary    → Clicks overview + trends
GET    /api/analytics/links/<id>/details    → Full click data
```

## Database Schema

### Users
| Field        | Type       | Notes                     |
|--------------|-----------|--------------------------|
| id           | Integer   | Primary key               |
| username     | String    | Unique, 3-80 chars        |
| email        | String    | Unique, validated         |
| password_hash| String    | bcrypt, never exposed     |
| created_at   | DateTime  | UTC timestamp             |
| bio          | Text      | Optional bio              |
| avatar_url   | String    | Profile image URL         |
| page_theme   | String    | 'dark' or 'light'         |

### Links
| Field        | Type       | Notes                     |
|--------------|-----------|--------------------------|
| id           | Integer   | Primary key               |
| user_id      | ForeignKey| Link to User              |
| original_url | String    | Full URL to redirect to   |
| short_code   | String    | 6 chars, unique           |
| custom_slug  | String    | Optional custom slug, unique |
| title        | String    | Display name              |
| is_active    | Boolean   | Active/inactive flag      |
| activated_at | DateTime  | When link becomes active  |
| expires_at   | DateTime  | When link expires (optional) |
| click_limit  | Integer   | Max clicks (optional)     |
| password_hash| String    | Optional password         |
| created_at   | DateTime  | Creation timestamp        |
| deleted_at   | DateTime  | Soft delete (NULL if active) |

### Clicks
| Field        | Type       | Notes                     |
|--------------|-----------|--------------------------|
| id           | Integer   | Primary key               |
| link_id      | ForeignKey| Link to Link              |
| clicked_at   | DateTime  | Click timestamp (indexed) |
| ip_address   | String    | Client IP                 |
| country      | String    | Derived from IP           |
| city         | String    | Derived from IP           |
| country_code | String    | ISO-2 country code        |
| device_type  | String    | 'mobile', 'tablet', 'desktop' |
| browser      | String    | Derived from User-Agent   |
| referrer     | String    | HTTP referer              |
| os           | String    | Operating system          |
| ab_variant   | String    | 'A' or 'B' if A/B test    |

### ABTests
| Field            | Type       | Notes                     |
|------------------|-----------|--------------------------|
| id               | Integer   | Primary key               |
| link_id          | ForeignKey| Link to Link              |
| url_a            | String    | Variant A URL             |
| url_b            | String    | Variant B URL             |
| split_percentage | Integer   | % to send to A (0-100)    |
| clicks_a         | Integer   | Clicks to A               |
| clicks_b         | Integer   | Clicks to B               |
| created_at       | DateTime  | Test start time           |

### BioLinks
| Field         | Type       | Notes                     |
|---------------|-----------|--------------------------|
| id            | Integer   | Primary key               |
| user_id       | ForeignKey| Link to User              |
| title         | String    | Link text                 |
| url           | String    | Destination URL           |
| display_order | Integer   | Sort order                |
| icon          | String    | Icon class name           |
| is_active     | Boolean   | Visible on bio page       |
| created_at    | DateTime  | Creation time             |

## Frontend Pages

### Public Pages
- `/login` — Login form
- `/register` — Registration form
- `/u/<username>` — Link-in-Bio page (future)

### Protected Pages
- `/dashboard` — Overview (links, clicks, trends)
- `/links` — Manage links (create, edit, delete)
- `/links/<id>` — Link detail + analytics
- `/links/<id>/edit` — Edit link settings
- `/analytics` — Advanced analytics (future)
- `/bio-builder` — Link-in-Bio editor (future)
- `/settings` — Account settings (future)

## Security

### Authentication
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens signed with HS256, 30-day expiry
- Token stored in localStorage, validated on API calls

### Authorization
- All protected endpoints verify JWT
- All resource endpoints verify ownership (user_id)
- Soft deletes prevent accidental permanent loss

### Input Validation
- Email format validation (regex)
- Password length (min 8 chars)
- URL validation (starts with http/https)
- Rate limiting (planned)

### Data Protection
- Password hashes never exposed in API responses
- User email not visible to other users
- Click data not accessible without ownership

## Performance

### Caching (Planned)
- Redis: Cache hot links, user's link list
- 5-minute TTL on click analytics
- Invalidate on write

### Indexing
- `users.email`, `users.username` — Unique indexes
- `links.user_id`, `links.custom_slug`, `links.short_code` — Lookup indexes
- `clicks.link_id`, `clicks.clicked_at` — Time-series queries

### Query Optimization
- Avoid N+1: Use SQLAlchemy relationships
- Pagination on click lists (future)
- Aggregate clicks by day for trends (not per-click)

## Deployment

### Database Migration
```bash
flask db upgrade
```

### Environment Variables
```
FLASK_ENV=production
DATABASE_URL=postgresql://user:pass@host/linkvault
JWT_SECRET_KEY=<strong-random-string>
CORS_ORIGINS=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
REDIS_URL=redis://localhost:6379/0  # Optional
```

### Hosting
- **Backend:** Gunicorn + Flask, any Python-capable host
- **Frontend:** Static files to CDN/bucket
- **Database:** PostgreSQL 12+
- **Cache:** Redis (optional)

## Success Metrics

- Register + login in < 2 seconds
- Link creation + redirect in < 100ms
- Click tracking < 50ms latency
- Dashboard loads in < 1 second
- 99.9% uptime (platform target)

## Roadmap

**Phase 1 (Current):** Foundation ✅
- User auth (register, login, JWT)
- Database schema
- Backend API scaffold
- Frontend pages (login, register, dashboard)

**Phase 2:** Link Management
- Link CRUD UI
- Custom slug input
- Basic analytics
- Real-time click notifications

**Phase 3:** Advanced Features
- A/B testing builder
- Link-in-Bio page
- Click export (CSV)
- Advanced analytics dashboard

**Phase 4:** Polish
- Rate limiting
- Multi-language support
- Mobile app (optional)
