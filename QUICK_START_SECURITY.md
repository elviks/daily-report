# 🔒 Quick Security Setup Guide

## ⚡ For Immediate Use (Development)

### Step 1: Create Environment File

```bash
cp .env.example .env
```

### Step 2: Generate Secrets

**Windows PowerShell:**

```powershell
# Generate JWT Secret
$jwtSecret = [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
Write-Host "JWT_SECRET=$jwtSecret"

# Generate Admin PIN
$pin = -join ((48..57) + (65..90) + (97..122) + (33,35,36,37,38,42) | Get-Random -Count 16 | ForEach-Object {[char]$_})
Write-Host "ADMIN_PIN_CODE=$pin"
```

**Linux/Mac:**

```bash
# Generate JWT Secret
echo "JWT_SECRET=$(openssl rand -base64 64)"

# Generate Admin PIN
echo "ADMIN_PIN_CODE=$(openssl rand -base64 16)"
```

### Step 3: Update .env File

Open `.env` and replace:

```env
JWT_SECRET=<paste-generated-jwt-secret>
ADMIN_PIN_CODE=<paste-generated-admin-pin>
MONGODB_URI=mongodb://localhost:27017/daily-report
NODE_ENV=development
```

### Step 4: Verify Security

```bash
npm run security-audit
```

### Step 5: Start Application

```bash
npm install
npm run dev
```

---

## 🎯 Test Security Features

### Test 1: Admin Access Protection

1. Open browser to `http://localhost:3000`
2. Try accessing `http://localhost:3000/admin` → Should redirect to login
3. Login as regular user
4. Try accessing `http://localhost:3000/admin` → Should redirect to dashboard
5. Login as admin user → Should show admin panel

### Test 2: Password Change Security

1. Login as User A
2. Open browser console
3. Try changing User B's password:
   ```javascript
   // This should FAIL
   fetch("/api/profile/change-password", {
     method: "PUT",
     headers: {
       "Content-Type": "application/json",
       Authorization: "Bearer " + localStorage.getItem("token"),
     },
     body: JSON.stringify({
       id: "other-user-id",
       currentPassword: "wrong",
       newPassword: "Test123!@#",
     }),
   });
   ```
4. Should fail - users can only change their own password

### Test 3: Brute Force Protection

1. Try logging in with wrong password 6 times
2. Account should be locked for 15 minutes
3. Check console for lockout message

---

## 📋 Security Checklist

- [ ] `.env` file created and configured
- [ ] JWT_SECRET is NOT the default value
- [ ] ADMIN_PIN_CODE is NOT the default value
- [ ] ADMIN_PIN_CODE is at least 12 characters
- [ ] `.env` is listed in `.gitignore`
- [ ] Security audit passes: `npm run security-audit`
- [ ] Application starts without errors

---

## 🚨 Emergency: If You Suspect a Breach

1. **Immediately:**

   ```bash
   # Generate new secrets
   openssl rand -base64 64  # New JWT_SECRET
   openssl rand -base64 16  # New ADMIN_PIN_CODE
   ```

2. **Update .env file** with new secrets

3. **Restart application** (this invalidates all existing sessions)

4. **Check logs** for suspicious activity:

   - Failed login attempts
   - Password override attempts
   - Unusual admin access

5. **Reset affected user passwords**

---

## 📖 Complete Documentation

- **SECURITY_FIXES_SUMMARY.md** - What was fixed and why
- **SECURITY.md** - Complete security documentation
- **DEPLOYMENT.md** - Production deployment checklist

---

## 💡 Common Issues

### Issue: "JWT_SECRET environment variable must be set"

**Solution:** Make sure .env file exists and JWT_SECRET is set

### Issue: "Account temporarily locked"

**Solution:** Wait 15 minutes or clear login attempts (restart app in dev)

### Issue: Security audit fails

**Solution:** Check all items in the audit output and fix critical issues

### Issue: Can't access admin panel

**Solution:** Make sure user has `isAdmin: true` or `role: 'admin'/'superadmin'`

---

## ✅ You're Secure When:

✅ Security audit passes  
✅ Environment variables are set  
✅ Admin panel requires authentication  
✅ Users can only change own password  
✅ Strong passwords are enforced  
✅ Failed logins trigger lockout  
✅ No hardcoded secrets in code

---

**Need Help?** Read the full documentation in SECURITY.md

**Ready to Deploy?** Follow DEPLOYMENT.md checklist
