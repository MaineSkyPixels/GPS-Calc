# GPS Coordinate Calculator - Frontend Documentation Index

## Welcome to Frontend Documentation

This folder contains comprehensive documentation for the GPS Coordinate Calculator frontend (Static HTML/CSS/JavaScript application).

---

## Quick Start

**New to this project?** Start here:

1. **[USER_GUIDE.md](./USER_GUIDE.md)** - How to use the calculator
2. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Common tasks and testing
3. **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** - Deployment overview

---

## Documentation by Topic

### 👤 User Documentation

| Document | Purpose | Best For |
|----------|---------|----------|
| USER_GUIDE.md | How to use all features | End users |
| QUICK_REFERENCE.md | Commands and common tasks | Developers |

### 🚀 Deployment & Operations

| Document | Purpose | Best For |
|----------|---------|----------|
| DEPLOYMENT_SUMMARY.md | Deployment status and guides | DevOps/Admins |
| CLOUDFLARE_PAGES_FIX.md | Git repository setup troubleshooting | Developers |
| DEPLOYMENT.md | Original deployment documentation | Reference |

---

## File Structure

```
docs/
├── INDEX.md                    ← You are here
├── USER_GUIDE.md               (How to use the app)
├── QUICK_REFERENCE.md          (Commands and testing)
├── DEPLOYMENT_SUMMARY.md       (Deployment overview)
├── CLOUDFLARE_PAGES_FIX.md     (Git structure and setup)
└── DEPLOYMENT.md               (Original deployment docs)
```

---

## File Guide

### USER_GUIDE.md - How to Use
- Coordinate input formats supported
- Distance calculations
- Saving and sharing
- Using shared links
- Data privacy

### QUICK_REFERENCE.md - Commands & Testing
- Live endpoints
- Testing the API
- Rate limiting info
- Common tasks
- Troubleshooting

### DEPLOYMENT_SUMMARY.md - Deployment Status
- Current deployment status
- GitHub Pages
- Cloudflare Workers API
- Integration configuration
- Next steps

### CLOUDFLARE_PAGES_FIX.md - Git Repository Structure
- Issue resolution (Git submodule conflict)
- Repository structure
- How to deploy to Cloudflare Pages
- Keep GitHub Pages vs Cloudflare Pages

### DEPLOYMENT.md - Original Deployment Guide
- Original deployment documentation
- GitHub Pages setup
- Server options

---

## Common Tasks

### I want to...

**...use the GPS calculator**
→ Read [USER_GUIDE.md](./USER_GUIDE.md)

**...test the API**
→ Read [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

**...deploy the frontend**
→ Read [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)

**...understand current deployment**
→ Read [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)

**...fix Git submodule errors**
→ Read [CLOUDFLARE_PAGES_FIX.md](./CLOUDFLARE_PAGES_FIX.md)

---

## Key Features

✅ Coordinate format conversion
✅ GPS distance calculation  
✅ 2D & 3D (elevation) calculations
✅ Local storage of calculations
✅ Share calculations via links
✅ QR code generation
✅ Export reports
✅ Rate limiting (50 saves/hour)

---

## Live Deployment

| Component | URL |
|-----------|-----|
| Frontend | https://maineskypixels.github.io/GPS-Calc/ |
| API | https://gps-calc-server.maine-sky-pixels.workers.dev |
| GitHub (Frontend) | https://github.com/MaineSkyPixels/GPS-Calc |
| GitHub (Backend) | https://github.com/MaineSkyPixels/GPSCalcServer |

---

## Tech Stack

- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks)
- **Backend**: Cloudflare Workers (serverless)
- **Database**: D1 (SQLite)
- **Rate Limiting**: Cloudflare KV
- **Hosting**: GitHub Pages + Cloudflare

---

## Documentation Files

### Backend Documentation (See GPSCalcServer/docs/)

For API integration and backend information:

- **API.md** - Complete API reference
- **ARCHITECTURE.md** - Backend system design
- **DEVELOPMENT.md** - Backend development guide
- **SECURITY.md** - Security hardening details
- **RATE_LIMITING.md** - Rate limiting configuration

---

## Version & Status

| Version | Date | Status |
|---------|------|--------|
| 1.0.0 | Oct 23, 2025 | ✅ Production Ready |
| Security | Oct 23, 2025 | ✅ 11 issues fixed |
| Rate Limiting | Oct 23, 2025 | ✅ Configured (50/hr) |
| Deployment | Oct 23, 2025 | ✅ GitHub Pages Live |

---

## Need Help?

- **Using the calculator** → [USER_GUIDE.md](./USER_GUIDE.md)
- **Testing/development** → [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **Deployment issues** → [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)
- **Git/GitHub issues** → [CLOUDFLARE_PAGES_FIX.md](./CLOUDFLARE_PAGES_FIX.md)
- **API integration** → See ../GPSCalcServer/docs/API.md

---

**Last Updated**: October 23, 2025
**Files**: 5 comprehensive guides
