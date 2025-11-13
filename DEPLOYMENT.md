# 🚀 Production Deployment Checklist

## Pre-Deployment Security

### Environment Configuration

- [ ] Copy `.env.example` to `.env`
- [ ] Generate strong `JWT_SECRET` (minimum 32 characters)

  ```bash
  # Linux/Mac
  openssl rand -base64 64

  # Windows PowerShell
  [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
  ```

- [ ] Set strong `ADMIN_PIN_CODE` (minimum 12 characters)
- [ ] Configure production `MONGODB_URI`
- [ ] Set `NODE_ENV=production`
- [ ] Verify `.env` is in `.gitignore`

### Security Audit

- [ ] Run security audit script: `node scripts/security-audit.js`
- [ ] Fix all critical issues
- [ ] Review and address warnings
- [ ] Verify no hardcoded secrets in code
- [ ] Check all admin routes are protected

### Authentication & Authorization

- [ ] Test admin panel access (should require login + admin role)
- [ ] Test password change (users can only change own password)
- [ ] Test profile update (users can only update own profile)
- [ ] Verify JWT expiration is set to 24 hours
- [ ] Test password override (superadmin only with PIN)

### Password Security

- [ ] Verify minimum 8 character requirement
- [ ] Test password strength validation (uppercase, lowercase, numbers, special chars)
- [ ] Test password change requires current password
- [ ] Confirm weak passwords are rejected

### Rate Limiting & Brute Force

- [ ] Test login rate limiting (5 attempts, 15 min lockout)
- [ ] Verify account lockout mechanism
- [ ] Test rate limiting on sensitive endpoints
- [ ] Check security event logging

## Infrastructure

### Database

- [ ] Database backups configured
- [ ] Database access restricted (firewall rules)
- [ ] MongoDB authentication enabled
- [ ] Connection string uses SSL/TLS
- [ ] Database user has minimal required permissions

### SSL/TLS

- [ ] SSL certificate installed and valid
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] HSTS header configured
- [ ] Certificate auto-renewal configured

### Network Security

- [ ] Firewall configured (allow only necessary ports)
- [ ] Rate limiting at infrastructure level
- [ ] DDoS protection enabled
- [ ] CDN configured (if applicable)
- [ ] IP allowlist for admin access (optional but recommended)

## Application Configuration

### Next.js Production

- [ ] Run `npm run build` successfully
- [ ] No build warnings or errors
- [ ] Environment variables loaded correctly
- [ ] Static files optimized
- [ ] Images optimized

### Logging & Monitoring

- [ ] Error logging configured
- [ ] Security event logging enabled
- [ ] Failed login attempts logged
- [ ] Password override attempts logged
- [ ] Monitoring/alerting configured

### Security Headers

- [ ] Verify security headers in production:
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-XSS-Protection: 1; mode=block`
  - [ ] `Strict-Transport-Security: max-age=31536000`
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`

## Testing

### Functional Testing

- [ ] Test login flow
- [ ] Test registration flow
- [ ] Test admin panel access
- [ ] Test user management
- [ ] Test report submission
- [ ] Test password change
- [ ] Test profile update

### Security Testing

- [ ] Attempt admin access without authentication → Should fail
- [ ] Attempt admin access as regular user → Should fail
- [ ] Attempt to change another user's password → Should fail
- [ ] Attempt to update another user's profile → Should fail
- [ ] Test SQL injection on inputs → Should fail
- [ ] Test XSS on inputs → Should be sanitized
- [ ] Test CSRF attacks → Should be protected
- [ ] Test with expired JWT token → Should reject

### Performance Testing

- [ ] Load testing completed
- [ ] Response times acceptable
- [ ] Database queries optimized
- [ ] Rate limiting doesn't affect normal usage

## Compliance & Documentation

### Documentation

- [ ] README.md updated with deployment instructions
- [ ] SECURITY.md reviewed and up to date
- [ ] API documentation current
- [ ] Admin user guide created
- [ ] Security incident response plan documented

### Access Control

- [ ] Default admin account secured or removed
- [ ] Test accounts removed
- [ ] Admin users reviewed and authorized
- [ ] Principle of least privilege applied

### Backup & Recovery

- [ ] Backup strategy documented
- [ ] Restore procedure tested
- [ ] Backup encryption enabled
- [ ] Backup retention policy defined

## Post-Deployment

### Immediate Actions

- [ ] Verify application is accessible
- [ ] Test login with real accounts
- [ ] Check SSL certificate
- [ ] Monitor error logs for 1 hour
- [ ] Verify database connections

### Ongoing Monitoring

- [ ] Set up daily log review
- [ ] Configure uptime monitoring
- [ ] Set up security alerts
- [ ] Schedule regular security audits
- [ ] Plan for dependency updates

## Emergency Procedures

### Security Breach Response

1. **Immediate Actions**

   - [ ] Change `JWT_SECRET` in production
   - [ ] Change `ADMIN_PIN_CODE`
   - [ ] Force logout all users
   - [ ] Review security logs

2. **Investigation**

   - [ ] Identify breach vector
   - [ ] Assess impact
   - [ ] Document timeline
   - [ ] Identify affected users

3. **Recovery**
   - [ ] Patch vulnerability
   - [ ] Reset affected accounts
   - [ ] Restore from backup if needed
   - [ ] Notify affected users

### Rollback Plan

- [ ] Previous version tagged in Git
- [ ] Database backup before deployment
- [ ] Rollback procedure documented
- [ ] Rollback tested in staging

## Sign-off

- [ ] Security review completed by: ********\_******** Date: **\_\_\_**
- [ ] Technical review completed by: ********\_******** Date: **\_\_\_**
- [ ] Deployment approved by: ********\_******** Date: **\_\_\_**

---

## Quick Reference Commands

### Generate Secrets

```bash
# JWT Secret
openssl rand -base64 64

# Admin PIN (Linux/Mac)
openssl rand -base64 16

# Admin PIN (Windows PowerShell)
-join ((48..57) + (65..90) + (97..122) + (33,35,36,37,38,42,43,45,61) | Get-Random -Count 16 | ForEach-Object {[char]$_})
```

### Run Security Audit

```bash
node scripts/security-audit.js
```

### Check Environment

```bash
node -e "console.log(require('dotenv').config())"
```

### Test Build

```bash
npm run build
npm start
```

---

**Remember:** Never commit `.env` file to version control!
