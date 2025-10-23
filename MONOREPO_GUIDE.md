# Combining Codebases into Monorepo - Complete Guide

## Overview

This guide covers combining the two separate GitHub repositories (GPS-Calc frontend and GPSCalcServer backend) into a single monorepo and the implications for Cloudflare Pages deployment.

**Current Structure:**
- `https://github.com/MaineSkyPixels/GPS-Calc` (Frontend only)
- `https://github.com/MaineSkyPixels/GPSCalcServer` (Backend only)

**Proposed Structure:**
- `https://github.com/MaineSkyPixels/GPS-Coordinate-Calculator` (Monorepo)
  - `/frontend` - Frontend (HTML/CSS/JS)
  - `/backend` - Backend (Cloudflare Workers)
  - `/docs` - Shared documentation
  - `/root-level docs` - Monorepo overview

---

## Option 1: Monorepo Structure (RECOMMENDED)

### Advantages

✅ **Single Repository Benefits:**
- All code changes in one place
- Easier atomic commits across frontend and backend
- Unified version control history
- Shared documentation
- Consistent CI/CD pipeline
- Easier to track feature completion

✅ **Deployment Flexibility:**
- Deploy frontend and backend independently
- Manage versions together
- Unified release process
- Easier rollback (both versions aligned)

✅ **Development Benefits:**
- Developers understand full system
- Easier API integration testing
- Shared configuration files
- Common documentation

### Disadvantages

❌ **Larger Repository:**
- Bigger clone size (not a major issue for this project)
- More history to navigate

❌ **Deployment Complexity:**
- Two different deployment targets (GitHub Pages + Cloudflare)
- Different build processes needed
- More CI/CD configuration

---

## Option 2: Keep Separate (CURRENT)

### Advantages

✅ **Clear Separation:**
- Independent deployment cycles
- Smaller repositories
- Different access controls if needed
- Frontend can be pure static site

✅ **Deployment Simplicity:**
- Frontend: GitHub Pages (automatic)
- Backend: Cloudflare Workers (automatic)
- Independent scaling

### Disadvantages

❌ **Coordination Issues:**
- Breaking API changes require communication
- Version alignment harder to track
- Separate CI/CD pipelines to maintain
- Duplicate documentation
- Harder for new developers to find everything

---

## Recommended: Hybrid Monorepo Approach

### Structure

```
GPS-Coordinate-Calculator/ (Main repo)
├── frontend/
│   ├── index.html
│   ├── script.js
│   ├── styles.css
│   ├── coordinate-parser.js
│   ├── distance-calculator.js
│   ├── storage-manager.js
│   ├── coordinate-converter.js
│   ├── report-generator.js
│   ├── docs/
│   └── Testing/
│
├── backend/
│   ├── src/
│   │   └── index.js
│   ├── functions/
│   │   └── api/
│   ├── docs/
│   ├── schema.sql
│   ├── wrangler.toml
│   ├── package.json
│   └── .dev.vars.example
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── GETTING_STARTED.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   └── MONOREPO_OVERVIEW.md
│
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml
│       ├── deploy-backend.yml
│       └── test.yml
│
├── README.md
├── LICENSE
└── .gitignore
```

---

## Step-by-Step Migration to Monorepo

### Step 1: Create New Repository

```bash
# Create new GitHub repo: GPS-Coordinate-Calculator
# Make it PRIVATE for security
# Clone it locally
git clone https://github.com/MaineSkyPixels/GPS-Coordinate-Calculator.git
cd GPS-Coordinate-Calculator
```

### Step 2: Add Frontend Code as Subdirectory

```bash
# Create frontend directory
mkdir frontend

# Copy all frontend files (keeping structure)
cp -r "../../GPS Calc/GPS Coordinate Calc"/* frontend/

# Remove unnecessary files from frontend
rm frontend/.git
rm frontend/docs/INDEX.md  # Will create root INDEX instead
```

### Step 3: Add Backend Code as Subdirectory

```bash
# Create backend directory
mkdir backend

# Copy all backend files
cp -r "../../GPS Calc/GPSCalcServer"/* backend/

# Remove unnecessary files from backend
rm backend/.git
rm backend/docs/INDEX.md  # Will create root INDEX instead
```

### Step 4: Create Monorepo Configuration Files

Create `.gitignore`:
```
# Dependencies
node_modules/
frontend/node_modules/
backend/node_modules/

# Environment
.env
.dev.vars
.wrangler/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Build
dist/
build/
```

Create `README.md` (root level):
```markdown
# GPS Coordinate Calculator

Full-stack application for GPS coordinate conversions, distance calculations, and sharing.

## Quick Links

- **Frontend**: See [frontend/README.md](./frontend/README.md)
- **Backend**: See [backend/README.md](./backend/README.md)
- **Documentation**: See [docs/](./docs/)

## Quick Start

### Frontend Development
```bash
cd frontend
# Serve locally: Use any HTTP server
python -m http.server 8000
```

### Backend Development
```bash
cd backend
npm install
wrangler dev
```

See [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) for detailed setup.

## Deployment

- **Frontend**: Deployed to GitHub Pages
- **Backend**: Deployed to Cloudflare Workers

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for details.
```

### Step 5: Create Monorepo Documentation

Create `docs/MONOREPO_OVERVIEW.md`:
```markdown
# Monorepo Structure Overview

## What is a Monorepo?

A monorepo is a single Git repository containing multiple projects (frontend + backend).

## Benefits for This Project

- ✅ Version control for entire system
- ✅ Easier cross-repository PRs
- ✅ Shared configuration
- ✅ Unified CI/CD

## Directory Structure

- `frontend/` - Frontend static site
- `backend/` - Cloudflare Workers backend
- `docs/` - Shared documentation
- `.github/workflows/` - Deployment automation

## Deployment

### Frontend
- Deploys to GitHub Pages
- Automatic on push to main/alpha
- Configured in GitHub Settings

### Backend
- Deploys to Cloudflare Workers
- Trigger via `wrangler deploy`
- Can be automated via GitHub Actions

## Development

Each project is independent:
- Frontend: No build step needed
- Backend: Node.js + Wrangler

See respective README files in frontend/ and backend/.
```

### Step 6: Update Deployment Configuration

Update `backend/wrangler.toml`:
```toml
name = "gps-calc-server"
main = "src/index.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[build]
command = ""

[dev]
ip = "0.0.0.0"
port = 8787
local_protocol = "http"
```

### Step 7: Create GitHub Actions for Deployment

Create `.github/workflows/deploy-frontend.yml`:
```yaml
name: Deploy Frontend

on:
  push:
    branches: [main, alpha]
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy-frontend.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to GitHub Pages
        run: |
          # GitHub Pages automatically deploys from docs/ folder
          # or root / folder, configured in repo settings
          echo "Frontend will be deployed via GitHub Pages settings"
```

Create `.github/workflows/deploy-backend.yml`:
```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-backend.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm install
      
      - name: Deploy to Cloudflare
        working-directory: ./backend
        run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Step 8: Initial Commit

```bash
git add -A
git commit -m "Initial: Combine frontend and backend into monorepo

- Move frontend code to frontend/
- Move backend code to backend/
- Create unified documentation in docs/
- Add GitHub Actions for deployment
- Update configuration for monorepo structure"

git push origin main
```

---

## Cloudflare Pages Impact

### Current Situation

**Frontend (GitHub Pages)**
- Source: `GPS-Calc` repo root
- Deployed automatically on push

**Backend (Cloudflare Workers)**
- Separate `GPSCalcServer` repo
- Deployed via `wrangler deploy`

### After Migration

### Option A: Use Cloudflare Pages for Frontend (RECOMMENDED)

**Advantages:**
- ✅ All on one Cloudflare platform
- ✅ Simpler CDN configuration
- ✅ Unified analytics
- ✅ Can host both frontend and backend at Cloudflare

**Setup:**
1. Create Cloudflare Pages project
2. Connect to `GPS-Coordinate-Calculator` repo
3. Set root directory to `frontend/`
4. Configure deploy command: (leave empty - static site)

**Pros & Cons:**

| Aspect | GitHub Pages | Cloudflare Pages |
|--------|--------------|------------------|
| Simplicity | ✅ Easy | ✅ Easy |
| Customization | Medium | ✅ Better |
| Performance | Good | ✅ Better |
| Cost | Free | Free (paid tiers) |
| SSL/TLS | Auto | Auto |

### Option B: Keep GitHub Pages for Frontend

**Advantages:**
- ✅ No changes to current setup
- ✅ Keeps GitHub-centric workflow
- ✅ GitHub handles frontend, Cloudflare handles backend

**Disadvantages:**
- ❌ Separate platforms to manage
- ❌ Inconsistent CDN/hosting

### Option C: Hybrid - Cloudflare for Both (BEST)

```
┌─────────────────────────────────────┐
│    GitHub Repository (Monorepo)     │
│  GPS-Coordinate-Calculator          │
│  ├── frontend/                      │
│  └── backend/                       │
└────┬──────────────────┬─────────────┘
     │                  │
     ▼                  ▼
┌────────────────┐   ┌──────────────────────┐
│ Cloudflare     │   │ Cloudflare Workers   │
│ Pages          │   │ (Backend API)        │
│ (Frontend)     │   │                      │
└────────────────┘   └──────────────────────┘
     │                        │
     ▼                        ▼
┌────────────────┐   ┌──────────────────────┐
│ CDN            │   │ Database (D1)        │
│ Static Files   │   │ KV Store             │
└────────────────┘   └──────────────────────┘
```

---

## Cloudflare Pages Configuration

### Setup Cloudflare Pages

1. **Go to Cloudflare Dashboard**
   - Navigate to Pages
   - Click "Create a project"
   - Connect to Git
   - Select `GPS-Coordinate-Calculator` repo

2. **Configure Build Settings**
   - **Framework preset**: None
   - **Build command**: (leave empty)
   - **Build output directory**: `frontend`
   - **Root directory**: `frontend` (optional, set only if needed)

3. **Environment Variables**
   - Set production API URL: `API_BASE_URL=https://gps-calc-server.maine-sky-pixels.workers.dev`
   - Set dev API URL: `API_BASE_URL_DEV=http://localhost:8787`

4. **Deploy Configuration**
   - **Production branch**: `main`
   - **Preview branch**: `alpha`

### Deploy Workflow

```
Push to main
     ↓
GitHub Actions triggers
     ↓
Cloudflare Pages detects changes in frontend/
     ↓
Deploys frontend to Cloudflare Pages CDN
     ↓
Push to backend/ also triggers backend workflow
     ↓
wrangler deploy uploads to Cloudflare Workers
     ↓
Both frontend and backend live
```

---

## Impact Analysis

### What Changes

| Component | Before | After |
|-----------|--------|-------|
| Repositories | 2 separate | 1 monorepo |
| Frontend Deploy | GitHub Pages | Cloudflare Pages |
| Backend Deploy | Separate repo | Same repo |
| Version Control | Independent histories | Single history |
| Documentation | Separate docs/ folders | Unified docs/ |
| CI/CD | Separate workflows | Unified workflows |

### What Stays the Same

✅ Frontend functionality
✅ Backend API functionality
✅ Database (D1)
✅ Rate limiting (KV)
✅ Security measures
✅ Authentication (none - public API)

### Potential Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Frontend deploys repeatedly** | Cloudflare Pages auto-deploys on any change | Ignore - only triggered if frontend/ changes |
| **Backend not deploying** | Changes to backend/ don't trigger deploy | Add manual GitHub Actions trigger |
| **API URL hardcoded** | Frontend can't find backend | Use environment variables in storage-manager.js |
| **Repo too large** | Slower clones | Not an issue for this size |
| **Separate versioning** | Can't track frontend+backend versions together | Use semantic versioning with tags |

---

## Migration Steps Checklist

### Preparation
- [ ] Create new GitHub repository `GPS-Coordinate-Calculator`
- [ ] Set repository to public
- [ ] Add team members

### Code Migration
- [ ] Commit current state to both repos
- [ ] Create local monorepo clone
- [ ] Copy frontend/ code
- [ ] Copy backend/ code
- [ ] Update .gitignore
- [ ] Create root-level documentation
- [ ] Add GitHub Actions workflows

### Configuration Updates
- [ ] Update wrangler.toml paths (if needed)
- [ ] Update package.json paths (if needed)
- [ ] Configure Cloudflare Pages
- [ ] Set environment variables
- [ ] Test deployment

### Testing
- [ ] Test frontend deployment
- [ ] Test backend deployment
- [ ] Test frontend-backend communication
- [ ] Test with production URLs
- [ ] Verify rate limiting
- [ ] Test data sharing

### Finalization
- [ ] Archive old repositories (don't delete)
- [ ] Update DNS records (if applicable)
- [ ] Update documentation links
- [ ] Notify team of new repo URL
- [ ] Update CI/CD credentials (GitHub Actions secrets)

---

## Deployment Comparison

### Current (Separate Repos)

```bash
# Frontend
cd GPS Coordinate Calc
git add -A
git commit -m "Update frontend"
git push origin alpha
# Automatic deploy to GitHub Pages

# Backend
cd GPSCalcServer
git add -A
git commit -m "Update backend"
git push origin main
# Manual: wrangler deploy
```

### After Migration (Monorepo)

```bash
# Both
cd GPS-Coordinate-Calculator

# Update frontend
cd frontend
# ... make changes ...
cd ..

# Update backend
cd backend
# ... make changes ...
cd ..

# Commit both
git add -A
git commit -m "Update frontend and backend"
git push origin main

# Automatic:
# - Frontend deploys to Cloudflare Pages
# - Backend deploys to Cloudflare Workers (via GitHub Actions)
```

---

## Recommendation Summary

### ✅ Recommended Approach

1. **Create Monorepo** with structure:
   ```
   frontend/
   backend/
   docs/
   .github/workflows/
   ```

2. **Use Cloudflare for Both**:
   - Frontend → Cloudflare Pages
   - Backend → Cloudflare Workers
   - Both on same platform

3. **Implement GitHub Actions**:
   - Auto-deploy frontend on changes
   - Auto-deploy backend on changes

4. **Benefits**:
   - ✅ Single repository to manage
   - ✅ Single platform (Cloudflare)
   - ✅ Automatic deployments
   - ✅ Unified documentation
   - ✅ Easier version control
   - ✅ Better for team collaboration

### Timeline

- Setup: 1-2 hours
- Migration: 1 hour
- Testing: 1 hour
- Total: 3-4 hours

### Risks

- 🟡 Brief deployment downtime during migration
- 🟡 Need to update API URLs in code
- 🟡 GitHub Actions setup complexity (medium)

### Mitigation

- Use feature branches for testing
- Keep old repos as archive
- Test thoroughly before going live
- Have rollback plan ready

---

## Alternative: Keep Separate (If Preferred)

If you prefer to keep repositories separate:

**Advantages:**
- ✅ No migration needed
- ✅ Independent deployment cycles
- ✅ Smaller repositories
- ✅ Simpler GitHub Actions (if any)

**Disadvantages:**
- ❌ Harder to track version compatibility
- ❌ Requires communication between teams
- ❌ More complex for new developers
- ❌ Duplicate documentation

---

## Decision Matrix

| Factor | Monorepo | Separate Repos |
|--------|----------|----------------|
| Setup complexity | Medium | Low |
| Maintenance | Low | Medium |
| Deployment | Easy | Medium |
| Collaboration | ✅ Better | OK |
| Version tracking | ✅ Better | Harder |
| Scalability | ✅ Better | OK |
| Team size | ✅ 3+ people | 1-2 people |

### **Verdict: MONOREPO is recommended for this project**

---

**Last Updated**: October 23, 2025
**Version**: 1.0.0
