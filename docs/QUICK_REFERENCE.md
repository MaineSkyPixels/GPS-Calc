# GPS Calculator - Quick Reference Card

## 🚀 Live Endpoints

| Component | URL | Status |
|-----------|-----|--------|
| **Frontend** | https://maineskypixels.github.io/GPS-Calc/ | ✅ Live |
| **Backend API** | https://gps-calc-server.maine-sky-pixels.workers.dev | ✅ Live |
| **GitHub (Frontend)** | https://github.com/MaineSkyPixels/GPS-Calc | ✅ alpha branch |
| **GitHub (Backend)** | https://github.com/MaineSkyPixels/GPSCalcServer | ✅ main branch |

---

## 🔒 Security Overview

| Feature | Status | Details |
|---------|--------|---------|
| XSS Prevention | ✅ | Safe DOM manipulation only |
| Input Validation | ✅ | Comprehensive for coordinates/elevation |
| Rate Limiting | ✅ | 50/100/10 requests/hour |
| CORS Security | ✅ | Configurable origins |
| Request Limits | ✅ | 10MB max, 5MB payload |
| Share ID Collision | ✅ | Detection + exponential backoff |
| Security Headers | ✅ | Cache-Control, X-Content-Type-Options |
| Secrets in Code | ✅ | None - all in .dev.vars |

---

## 🧪 Testing Commands

### Check Backend Status
```bash
curl https://gps-calc-server.maine-sky-pixels.workers.dev/
```

### Save a Calculation
```bash
curl -X POST https://gps-calc-server.maine-sky-pixels.workers.dev/api/share \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "coordinates": [{"lat": 45.5, "lon": -70.3}],
      "name": "Test Location"
    },
    "expirationPeriod": "24hr"
  }'
```

### Test Rate Limiting
```bash
for i in {1..5}; do
  curl -X POST https://gps-calc-server.maine-sky-pixels.workers.dev/api/share \
    -H "Content-Type: application/json" \
    -d '{"data":{"coordinates":[{"lat":45,"lon":-70}]},"expirationPeriod":"24hr"}' -v 2>&1 | grep "x-ratelimit"
done
```

---

## 📋 Rate Limiting Config

```
POST /api/share      → 50/hour  (save calculations)
GET /api/share/{id}  → 100/hour (retrieve calculations)
POST /api/cleanup    → 10/hour  (cleanup operations)
```

*Designed for niche website - anything more is suspicious*

---

## 📁 Repository Structure

```
GitHub: MaineSkyPixels/GPS-Calc (Frontend)
├─ Branch: alpha (current - with security updates)
├─ Deployment: GitHub Pages
└─ Optional: Cloudflare Pages

GitHub: MaineSkyPixels/GPSCalcServer (Backend)
├─ Branch: main (current - with security updates)
├─ Deployment: Cloudflare Workers ✅
└─ Rate Limiting: Cloudflare KV
```

---

## 🔧 Common Tasks

### Deploy Frontend to Cloudflare Pages (Optional)
1. Go to https://dash.cloudflare.com
2. Pages → Create project → Connect to Git
3. Select: GPS-Calc repository
4. Build command: (leave empty)
5. Output directory: /
6. Deploy

### Enable Rate Limiting KV
1. Verify KV namespace: `wrangler kv:namespace list`
2. Add to `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "RATE_LIMIT_KV"
   id = "a7ab97ae98d74e75985d35302e833f13"
   ```
3. Redeploy: `wrangler deploy`

### Monitor Logs
```bash
cd GPSCalcServer
wrangler tail
```

### Update Code
```bash
# Frontend
cd "GPS Coordinate Calc"
git add .
git commit -m "Description"
git push origin alpha

# Backend
cd GPSCalcServer
git add .
git commit -m "Description"
git push origin main
wrangler deploy  # Deploy to Cloudflare
```

---

## 🐛 Troubleshooting

### Issue: Cloudflare Pages Build Failed
**Solution**: Removed embedded Git repos from parent (already done ✅)

### Issue: Rate Limiting Not Working
**Solution**: 
1. Verify `RATE_LIMIT_KV_ID` in `.dev.vars`
2. Check `[[kv_namespaces]]` binding in `wrangler.toml`
3. Redeploy: `wrangler deploy`

### Issue: CORS Errors
**Solution**: Check that frontend domain is in `CORS_ORIGINS` environment variable

### Issue: Data Not Saving to Backend
**Solution**: 
1. Verify backend is live: `curl https://gps-calc-server.maine-sky-pixels.workers.dev/`
2. Check browser console for errors
3. Check rate limiting hasn't been exceeded

### Issue: Share Link Not Working
**Solution**:
1. Verify share ID format: `YYYY-NNNN-XXXX` (year-sequence-random)
2. Check if calculation has expired (24hr default)
3. Verify database connectivity

---

## 📞 Contact & Monitoring

### Backend Monitoring
```bash
# View live logs
wrangler tail

# View deployments
wrangler deployments list

# Check database
wrangler d1 execute gps-calculations --command "SELECT COUNT(*) FROM calculations;"
```

### Frontend Status
- Live on: https://maineskypixels.github.io/GPS-Calc/
- Auto-deploys on push to `alpha` or `main`
- Check GitHub Actions for build status

---

## 🚨 Emergency Commands

### Rollback Frontend
```bash
cd "GPS Coordinate Calc"
git revert HEAD
git push origin alpha
# GitHub Pages will auto-redeploy
```

### Rollback Backend
```bash
cd GPSCalcServer
git log --oneline  # Find commit
git revert <commit-hash>
git push origin main
wrangler deploy
```

### Clear All Rate Limiting Data
```bash
wrangler kv:key delete "*" --namespace-id "a7ab97ae98d74e75985d35302e833f13"
```

---

## 📚 Documentation Files

| File | Location | Purpose |
|------|----------|---------|
| SECURITY.md | GPSCalcServer/ | Comprehensive security guide |
| SECURITY_AUDIT_REPORT.md | GPSCalcServer/ | Vulnerability findings |
| RATE_LIMITING.md | GPSCalcServer/ | Rate limiting setup |
| DEPLOYMENT_SUMMARY.md | GPS Coordinate Calc/ | Deployment overview |
| CLOUDFLARE_PAGES_FIX.md | GPS Coordinate Calc/ | Build error resolution |

---

## ✅ Pre-Deployment Checklist

- [x] Backend deployed to Cloudflare Workers
- [x] Frontend deployed to GitHub Pages
- [x] Security hardening complete (11 fixes)
- [x] Rate limiting configured
- [x] Git repositories separated
- [x] Documentation comprehensive
- [x] API endpoints tested
- [x] Frontend-backend integration verified

---

## 🎯 Next Steps (Optional)

1. Deploy frontend to Cloudflare Pages (recommended for unified platform)
2. Configure custom domain in Cloudflare DNS
3. Set up uptime monitoring/alerting
4. Enable analytics for usage tracking
5. Implement error tracking (Sentry, etc.)

---

**Status**: ✅ Production Ready
**Last Updated**: October 23, 2025
