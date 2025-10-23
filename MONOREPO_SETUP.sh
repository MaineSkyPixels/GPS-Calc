#!/bin/bash

# GPS Coordinate Calculator - Monorepo Migration Script
# This script combines the frontend and backend into a single monorepo

set -e  # Exit on error

echo "🚀 GPS Coordinate Calculator - Monorepo Migration"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_NAME="GPS-Coordinate-Calculator"
REPO_URL="https://github.com/MaineSkyPixels/${REPO_NAME}.git"
FRONTEND_SOURCE="../GPS\ Coordinate\ Calc"
BACKEND_SOURCE="../GPSCalcServer"

echo -e "${BLUE}Prerequisites Check${NC}"
echo "-------------------"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed"
    exit 1
fi
echo "✅ Git installed"

# Check if directories exist
if [ ! -d "$FRONTEND_SOURCE" ]; then
    echo "❌ Frontend source directory not found: $FRONTEND_SOURCE"
    exit 1
fi
echo "✅ Frontend source found"

if [ ! -d "$BACKEND_SOURCE" ]; then
    echo "❌ Backend source directory not found: $BACKEND_SOURCE"
    exit 1
fi
echo "✅ Backend source found"

echo ""
echo -e "${BLUE}Step 1: Clone New Repository${NC}"
echo "-----------------------------"

if [ -d "$REPO_NAME" ]; then
    echo "⚠️  Directory $REPO_NAME already exists"
    read -p "Remove it? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$REPO_NAME"
        echo "✅ Removed existing directory"
    else
        echo "Aborting..."
        exit 1
    fi
fi

echo "Cloning repository..."
git clone "$REPO_URL" "$REPO_NAME"
cd "$REPO_NAME"
echo "✅ Repository cloned"

echo ""
echo -e "${BLUE}Step 2: Create Directory Structure${NC}"
echo "-----------------------------------"

mkdir -p frontend backend docs
echo "✅ Created directories"

echo ""
echo -e "${BLUE}Step 3: Copy Frontend Code${NC}"
echo "---------------------------"

cp -r "$FRONTEND_SOURCE"/* frontend/ 2>/dev/null || true
rm -rf frontend/.git 2>/dev/null || true
rm -f frontend/docs/INDEX.md 2>/dev/null || true
echo "✅ Frontend code copied"

echo ""
echo -e "${BLUE}Step 4: Copy Backend Code${NC}"
echo "--------------------------"

cp -r "$BACKEND_SOURCE"/* backend/ 2>/dev/null || true
rm -rf backend/.git 2>/dev/null || true
rm -f backend/docs/INDEX.md 2>/dev/null || true
echo "✅ Backend code copied"

echo ""
echo -e "${BLUE}Step 5: Create Configuration Files${NC}"
echo "----------------------------------"

# Create .gitignore
cat > .gitignore << 'EOF'
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

# Logs
*.log
EOF
echo "✅ Created .gitignore"

# Create root README
cat > README.md << 'EOF'
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
# Visit http://localhost:8000
```

### Backend Development
```bash
cd backend
npm install
wrangler dev
# API available at http://localhost:8787
```

See [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) for detailed setup.

## Deployment

- **Frontend**: Deployed to Cloudflare Pages
- **Backend**: Deployed to Cloudflare Workers

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for details.

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript (pure)
- **Backend**: Cloudflare Workers, D1 Database, KV Store
- **Deployment**: GitHub, Cloudflare, GitHub Pages

## Features

✅ GPS Coordinate Conversion (DMS, Decimal Degrees)
✅ Distance Calculation (2D & 3D with elevation)
✅ Coordinate Sharing with QR Codes
✅ Rate Limiting (50 saves/hour)
✅ Security Hardening (11 critical fixes)
✅ Comprehensive Documentation

## License

See [LICENSE](./LICENSE) file.
EOF
echo "✅ Created root README.md"

echo ""
echo -e "${BLUE}Step 6: Create Monorepo Documentation${NC}"
echo "--------------------------------------"

# Create docs/MONOREPO_OVERVIEW.md
mkdir -p docs
cat > docs/MONOREPO_OVERVIEW.md << 'EOF'
# Monorepo Structure

## What is a Monorepo?

A monorepo is a single Git repository containing multiple projects. In this case:
- Frontend (HTML/CSS/JavaScript)
- Backend (Cloudflare Workers)

## Directory Structure

```
├── frontend/          Frontend application
├── backend/           Backend API
├── docs/              Shared documentation
└── .github/workflows/ Deployment automation
```

## Development

Each project is independent:

### Frontend
- No build step required
- Pure JavaScript, HTML, CSS
- Serves locally with any HTTP server

### Backend
- Node.js + Wrangler
- Cloudflare Workers
- D1 Database, KV Store

See respective README files for setup.

## Deployment

### Frontend
- Auto-deploys to Cloudflare Pages on push to main/alpha
- Connected via GitHub Actions

### Backend  
- Auto-deploys to Cloudflare Workers on push to main
- Requires Cloudflare API token (via GitHub Secrets)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for details.

## Benefits of Monorepo

✅ Single repository to clone
✅ Atomic commits across projects
✅ Unified version control
✅ Easier team coordination
✅ Shared documentation
✅ Consistent CI/CD
EOF
echo "✅ Created MONOREPO_OVERVIEW.md"

echo ""
echo -e "${BLUE}Step 7: Create GitHub Actions Workflows${NC}"
echo "---------------------------------------"

mkdir -p .github/workflows

# Create deploy-frontend.yml
cat > .github/workflows/deploy-frontend.yml << 'EOF'
name: Deploy Frontend

on:
  push:
    branches: [main, alpha]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Frontend deployed to Cloudflare Pages
        run: echo "Frontend deployment handled by Cloudflare Pages Git integration"
EOF
echo "✅ Created deploy-frontend.yml"

# Create deploy-backend.yml
cat > .github/workflows/deploy-backend.yml << 'EOF'
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

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
EOF
echo "✅ Created deploy-backend.yml"

echo ""
echo -e "${BLUE}Step 8: Create Deployment Documentation${NC}"
echo "---------------------------------------"

# Create docs/DEPLOYMENT.md
cat > docs/DEPLOYMENT.md << 'EOF'
# Deployment Guide

## Frontend Deployment (Cloudflare Pages)

### Initial Setup
1. Go to Cloudflare Dashboard
2. Navigate to Pages
3. Click "Create a project"
4. Connect to Git repository
5. Select: GPS-Coordinate-Calculator
6. Build settings:
   - Framework: None
   - Build command: (leave empty)
   - Build output directory: frontend

### Automatic Deployment
- Pushes to `main` deploy to production
- Pushes to `alpha` deploy to preview

## Backend Deployment (Cloudflare Workers)

### Prerequisites
1. Cloudflare account
2. D1 database created
3. KV namespace created
4. Wrangler CLI installed

### Setup GitHub Secrets
1. Go to GitHub repository Settings
2. Add Secrets:
   - `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

### Automatic Deployment
- Pushes to `main` with changes in `backend/` auto-deploy
- GitHub Actions runs `wrangler deploy`

### Manual Deployment
```bash
cd backend
npm install
wrangler deploy
```

## Environment Variables

### Frontend (.env or storage-manager.js)
```javascript
const API_BASE_URL = "https://gps-calc-server.maine-sky-pixels.workers.dev"
```

### Backend (.dev.vars)
```
DATABASE_ID=your-d1-db-id
RATE_LIMIT_KV_ID=your-kv-namespace-id
CORS_ORIGINS=https://your-frontend-domain.com
```

## Monitoring

### Frontend
- GitHub Pages deployment status
- Cloudflare Pages analytics

### Backend
```bash
wrangler tail  # View live logs
```

## Troubleshooting

See docs/TROUBLESHOOTING.md for common issues.
EOF
echo "✅ Created DEPLOYMENT.md"

# Create docs/GETTING_STARTED.md
cat > docs/GETTING_STARTED.md << 'EOF'
# Getting Started

## Prerequisites

- Git
- Node.js 18+ (for backend only)
- Python or any HTTP server (for frontend testing)

## Setup

### Clone Repository
```bash
git clone https://github.com/MaineSkyPixels/GPS-Coordinate-Calculator.git
cd GPS-Coordinate-Calculator
```

### Frontend Setup
```bash
cd frontend

# Option 1: Using Python
python -m http.server 8000

# Option 2: Using Node (npx)
npx http-server

# Option 3: Using Live Server
# Install globally: npm install -g live-server
live-server

# Visit http://localhost:8000
```

### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Install wrangler globally (optional)
npm install -g wrangler

# Copy environment variables
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your credentials

# Start development server
wrangler dev

# API available at http://localhost:8787
```

## Development Workflow

1. Create a branch: `git checkout -b feature/my-feature`
2. Make changes in `frontend/` or `backend/`
3. Test locally
4. Commit: `git add . && git commit -m "feat: description"`
5. Push: `git push origin feature/my-feature`
6. Create Pull Request on GitHub

## Testing Locally

### Frontend
1. Open http://localhost:8000 in browser
2. Test coordinate conversion
3. Test distance calculation
4. Test sharing functionality

### Backend
```bash
# Test save endpoint
curl -X POST http://localhost:8787/api/share \
  -H "Content-Type: application/json" \
  -d '{"data":{"coordinates":[{"lat":45,"lon":-70}]},"expirationPeriod":"24hr"}'

# Test retrieve endpoint
curl http://localhost:8787/api/share/SHARE_ID
```

## Next Steps

- Read [docs/](./docs/) for more information
- Check [MONOREPO_OVERVIEW.md](./docs/MONOREPO_OVERVIEW.md) for architecture
- See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for deploying changes

## Need Help?

Check the documentation in `docs/` folder for:
- API reference (API.md)
- Architecture (ARCHITECTURE.md)
- Security (SECURITY.md)
- Troubleshooting
EOF
echo "✅ Created GETTING_STARTED.md"

echo ""
echo -e "${BLUE}Step 9: Initial Commit${NC}"
echo "----------------------"

git add -A
git commit -m "Initial: Combine frontend and backend into monorepo

- Move frontend code to frontend/
- Move backend code to backend/
- Create unified documentation in docs/
- Add GitHub Actions for deployment
- Update configuration for monorepo structure"

echo "✅ Initial commit created"

echo ""
echo -e "${GREEN}✨ Monorepo Setup Complete!${NC}"
echo "============================="
echo ""
echo "Next steps:"
echo "1. Review the structure: ls -la"
echo "2. Read the documentation: cat docs/MONOREPO_OVERVIEW.md"
echo "3. Test frontend: cd frontend && python -m http.server 8000"
echo "4. Test backend: cd backend && npm install && wrangler dev"
echo "5. Push to GitHub: git push origin main"
echo ""
echo "For more info, see: docs/DEPLOYMENT.md"
echo ""
