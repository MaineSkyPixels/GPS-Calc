# Monorepo Migration - Implementation Guide

## Phase 1: Preparation (Complete These First)

### Prerequisites
- [ ] GitHub account with ability to create repositories
- [ ] Cloudflare account with Workers enabled
- [ ] Git installed locally
- [ ] Node.js 18+ installed
- [ ] Wrangler CLI installed (`npm install -g wrangler`)

---

## Phase 2: Create New Repository Structure

### Option A: Automated (Recommended - 5 minutes)

```bash
# 1. Create the monorepo directory locally
mkdir GPS-Coordinate-Calculator
cd GPS-Coordinate-Calculator

# 2. Initialize git
git init
git branch -M main

# 3. Copy the setup script
cp /path/to/MONOREPO_SETUP.sh .

# 4. Run it
bash MONOREPO_SETUP.sh
```

### Option B: Manual Setup (Follow MONOREPO_GUIDE.md)

If the automated script doesn't work, follow the manual 8-step process in MONOREPO_GUIDE.md

---

## Phase 3: Create Repository on GitHub

### Steps:
1. Go to https://github.com/new
2. Name: `GPS-Coordinate-Calculator`
3. Description: "Full-stack GPS coordinate calculator - monorepo"
4. Set to Public
5. Click "Create repository"
6. Copy the repository URL

### Add Remote:
```bash
cd GPS-Coordinate-Calculator
git remote add origin https://github.com/MaineSkyPixels/GPS-Coordinate-Calculator.git
git branch -M main
git push -u origin main
```

---

## Phase 4: Verify Local Structure

After setup, verify this structure exists:

```
GPS-Coordinate-Calculator/
├── frontend/
│   ├── index.html
│   ├── script.js
│   ├── styles.css
│   ├── storage-manager.js
│   ├── docs/
│   └── README.md
├── backend/
│   ├── src/index.js
│   ├── functions/api/
│   ├── wrangler.toml
│   ├── package.json
│   ├── schema.sql
│   ├── docs/
│   └── .dev.vars.example
├── docs/
│   ├── MONOREPO_OVERVIEW.md
│   ├── DEPLOYMENT.md
│   └── GETTING_STARTED.md
├── .github/workflows/
│   ├── deploy-frontend.yml
│   └── deploy-backend.yml
├── README.md
├── LICENSE
└── .gitignore
```

**Verify**:
```bash
# Check structure
find . -maxdepth 2 -type d -name backend -o -name frontend -o -name docs

# Check frontend files
ls frontend/ | head -5

# Check backend files  
ls backend/ | head -5
```

---

## Phase 5: Configure Backend Environment

```bash
cd backend

# Copy example environment variables
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your credentials
# Need these values from Cloudflare:
# - DATABASE_ID (from D1)
# - RATE_LIMIT_KV_ID (from KV namespace)
# - CORS_ORIGINS (your frontend domain)
```

---

## Phase 6: Test Locally

### Terminal 1 - Frontend:
```bash
cd GPS-Coordinate-Calculator/frontend
python -m http.server 8000
# Visit: http://localhost:8000
```

### Terminal 2 - Backend:
```bash
cd GPS-Coordinate-Calculator/backend
npm install
wrangler dev
# API at: http://localhost:8787
```

### Test:
- [ ] Frontend loads at localhost:8000
- [ ] Can input coordinates
- [ ] Backend API responds at localhost:8787
- [ ] Can save calculation
- [ ] Can retrieve calculation

---

## Phase 7: Configure Cloudflare Pages

### Steps:
1. Go to https://dash.cloudflare.com
2. Navigate to **Pages**
3. Click **Create a project** → **Connect to Git**
4. Select **GPS-Coordinate-Calculator** repository
5. Configure build settings:
   - **Framework preset**: None
   - **Build command**: (leave empty)
   - **Build output directory**: `frontend`
6. Add environment variables:
   - `API_BASE_URL`: `https://gps-calc-server.maine-sky-pixels.workers.dev`
7. Click **Save and Deploy**

### Verify:
- [ ] Build succeeds
- [ ] Frontend deployed
- [ ] URL accessible

---

## Phase 8: Set GitHub Actions Secrets

### Steps:
1. Go to GitHub repository Settings
2. **Secrets and variables** → **Actions**
3. Add new secret:
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: Your Cloudflare API token
4. Add another secret:
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: Your Cloudflare account ID

### How to get credentials:
- **API Token**: https://dash.cloudflare.com/profile/api-tokens
- **Account ID**: https://dash.cloudflare.com (shown in sidebar)

---

## Phase 9: Initial Deployment

```bash
cd GPS-Coordinate-Calculator

# Add all files
git add -A

# Commit
git commit -m "Initial: Monorepo setup from separate repos"

# Push
git push origin main
```

### GitHub Actions will automatically:
- [ ] Deploy frontend to Cloudflare Pages
- [ ] Deploy backend to Cloudflare Workers (if secret is configured)

---

## Phase 10: Verify Deployments

### Check Frontend:
```bash
# Get your Cloudflare Pages URL from the dashboard
curl https://your-domain-cf-pages.pages.dev/
```

### Check Backend:
```bash
# Should respond with API info
curl https://gps-calc-server.maine-sky-pixels.workers.dev/
```

### Test Integrated System:
1. Go to frontend URL
2. Try coordinate conversion
3. Try saving calculation
4. Try sharing link
5. Verify data persists

---

## Phase 11: Archive Old Repositories

**DO NOT DELETE**, just archive:

1. Go to GPS-Calc repository Settings
2. Note: Keep as archive (don't delete)
3. Go to GPSCalcServer repository Settings
4. Note: Keep as archive (don't delete)

This allows reverting if needed.

---

## Phase 12: Update Team

Notify team with:
- New repository URL: `https://github.com/MaineSkyPixels/GPS-Coordinate-Calculator`
- Update workflow: Single repo now
- Share documentation

---

## Troubleshooting

### Frontend not deploying
- Check: `.github/workflows/deploy-frontend.yml` exists
- Check: `frontend/` directory has content
- Check: No build errors in GitHub Actions

### Backend not deploying
- Check: GitHub Actions secrets are set
- Check: `.github/workflows/deploy-backend.yml` exists
- Check: `backend/` directory has package.json
- Check: GitHub Actions logs for errors

### API connection issues
- Check: `API_BASE_URL` in Cloudflare Pages environment
- Check: CORS headers enabled on backend
- Check: Database and KV namespace exist

### Rate limiting not working
- Check: `RATE_LIMIT_KV_ID` is correct
- Check: KV namespace has content
- Check: Wrangler has KV binding configured

---

## Support Resources

- **MONOREPO_GUIDE.md** - Detailed procedures
- **MONOREPO_DECISION.md** - Decision rationale
- **Backend/docs/API.md** - API reference
- **Backend/docs/DEVELOPMENT.md** - Dev guide

---

## Timeline

- Preparation: 30 min
- Setup: 15 min
- Testing: 30 min
- Configuration: 30 min
- Deployment: 15 min
- **Total: ~2 hours**

---

**Status**: Ready to implement
**Date**: October 23, 2025
