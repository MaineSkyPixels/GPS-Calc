# Privacy Configuration - All Repositories

## Summary

All GitHub repositories for the GPS Coordinate Calculator project will be configured as PRIVATE for security.

---

## Repository Privacy Status

### 1. GPS-Coordinate-Calculator (New Monorepo)
- **Status**: Create as PRIVATE immediately
- **Timing**: When you create the new repository
- **How**: https://github.com/new → Set visibility to PRIVATE

### 2. GPS-Calc (Current Frontend)
- **Status**: Make PRIVATE after verification
- **Timing**: After ~1 hour of using new monorepo
- **How**: GitHub Settings → Danger Zone → Change visibility to PRIVATE
- **Description**: "ARCHIVED - See GPS-Coordinate-Calculator monorepo"

### 3. GPSCalcServer (Current Backend)
- **Status**: Make PRIVATE after verification
- **Timing**: After ~1 hour of using new monorepo
- **How**: GitHub Settings → Danger Zone → Change visibility to PRIVATE
- **Description**: "ARCHIVED - See GPS-Coordinate-Calculator monorepo"

---

## Why Private?

✅ Protects sensitive configuration files (.dev.vars, API tokens)
✅ Prevents accidental use of deprecated repositories
✅ Maintains security of archived code
✅ Keeps repositories for rollback capability
✅ Reduces confusion about which repo to use

---

## Step-by-Step: Create New Repo as Private

1. Go to https://github.com/new
2. Enter name: `GPS-Coordinate-Calculator`
3. Enter description: "Full-stack GPS coordinate calculator - monorepo"
4. Select: **PRIVATE** ← Important!
5. Click "Create repository"
6. Done!

---

## Step-by-Step: Make Existing Repos Private

### For GPS-Calc:

1. Go to https://github.com/MaineSkyPixels/GPS-Calc/settings
2. Scroll down to "Danger Zone"
3. Click "Change repository visibility"
4. Select "Private"
5. Confirm by typing repository name
6. Update description: "ARCHIVED - See GPS-Coordinate-Calculator monorepo"

### For GPSCalcServer:

1. Go to https://github.com/MaineSkyPixels/GPSCalcServer/settings
2. Scroll down to "Danger Zone"
3. Click "Change repository visibility"
4. Select "Private"
5. Confirm by typing repository name
6. Update description: "ARCHIVED - See GPS-Coordinate-Calculator monorepo"

---

## Timeline

**Immediate (When Creating)**:
- ✅ Create GPS-Coordinate-Calculator as PRIVATE

**After 1 Hour (After Verifying New Monorepo Works)**:
- [ ] Make GPS-Calc PRIVATE
- [ ] Make GPSCalcServer PRIVATE

---

## Important Notes

1. **Don't delete old repos**
   - Keep them for rollback
   - Just make them private and archive

2. **Update descriptions**
   - Help developers find the new monorepo
   - Prevent accidental confusion

3. **Access control**
   - Private repos only visible to collaborators
   - Team members added to team can still access
   - Better security for sensitive code

4. **CI/CD implications**
   - GitHub Actions workflows continue to work
   - Deployments unaffected by privacy setting
   - SSH keys/tokens remain valid

---

## Verification

After making repositories private, verify:

1. **New monorepo is working**
   - Frontend accessible at Cloudflare Pages URL
   - Backend responding at Cloudflare Workers URL
   - Can save and share calculations
   - Rate limiting active

2. **Old repositories properly archived**
   - Marked as PRIVATE
   - Descriptions updated
   - Not being used for deployments

3. **Team access maintained**
   - Collaborators can still access private repos
   - GitHub Actions still working
   - No deployment interruptions

---

## Security Best Practices

✅ All repositories PRIVATE
✅ Sensitive config in .dev.vars (not committed)
✅ GitHub Actions secrets configured
✅ Cloudflare API tokens in GitHub secrets
✅ Database credentials not in code
✅ Old repos kept for rollback capability

---

**Status**: All privacy instructions documented and ready
**Date**: October 23, 2025
