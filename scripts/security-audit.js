#!/usr/bin/env node

/**
 * Security Audit Script
 * Run this before deploying to production
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Running Security Audit...\n');

let issues = [];
let warnings = [];
let passed = [];

// Check 1: Environment Variables
console.log('📋 Checking Environment Variables...');
try {
    const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
    const envExists = fs.existsSync(path.join(__dirname, '..', '.env'));

    if (!envExists) {
        issues.push('❌ .env file not found. Copy .env.example to .env');
    } else {
        const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');

        // Check JWT_SECRET
        if (env.includes('your-super-secret-jwt-key-change-this-in-production')) {
            issues.push('❌ CRITICAL: JWT_SECRET still using default value');
        } else if (env.match(/JWT_SECRET=(.+)/)) {
            const secret = env.match(/JWT_SECRET=(.+)/)[1];
            if (secret.length < 32) {
                warnings.push('⚠️  JWT_SECRET should be at least 32 characters');
            } else {
                passed.push('✅ JWT_SECRET is configured properly');
            }
        } else {
            issues.push('❌ CRITICAL: JWT_SECRET not set');
        }

        // Check ADMIN_PIN_CODE
        if (env.includes('change-this-strong-pin-minimum-12-chars')) {
            issues.push('❌ CRITICAL: ADMIN_PIN_CODE still using default value');
        } else if (env.match(/ADMIN_PIN_CODE=(.+)/)) {
            const pin = env.match(/ADMIN_PIN_CODE=(.+)/)[1];
            if (pin.length < 12) {
                warnings.push('⚠️  ADMIN_PIN_CODE should be at least 12 characters');
            } else {
                passed.push('✅ ADMIN_PIN_CODE is configured properly');
            }
        } else {
            issues.push('❌ CRITICAL: ADMIN_PIN_CODE not set');
        }

        // Check MONGODB_URI
        if (!env.match(/MONGODB_URI=(.+)/) || env.includes('mongodb://localhost')) {
            warnings.push('⚠️  MONGODB_URI appears to be using localhost');
        } else {
            passed.push('✅ MONGODB_URI is configured');
        }
    }
} catch (error) {
    issues.push(`❌ Error checking environment: ${error.message}`);
}

// Check 2: Security Files
console.log('\n📋 Checking Security Files...');
const securityFiles = [
    'middleware.ts',
    'lib/middleware.ts',
    'lib/admin-middleware.ts',
    'lib/security-middleware.ts',
    'SECURITY.md'
];

securityFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        passed.push(`✅ ${file} exists`);
    } else {
        warnings.push(`⚠️  ${file} not found`);
    }
});

// Check 3: Hardcoded Secrets
console.log('\n📋 Checking for Hardcoded Secrets...');
const filesToCheck = [
    'app/api/auth/login/route.ts',
    'app/api/admin/users/[id]/route.ts',
    'lib/db.ts'
];

let foundHardcodedSecrets = false;
filesToCheck.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for fallback-secret
        if (content.includes('fallback-secret')) {
            issues.push(`❌ CRITICAL: Found 'fallback-secret' in ${file}`);
            foundHardcodedSecrets = true;
        }

        // Check for hardcoded PIN
        if (content.includes('ADMIN_PINCODE = "') && !content.includes('process.env.ADMIN_PIN_CODE')) {
            issues.push(`❌ CRITICAL: Found hardcoded PIN in ${file}`);
            foundHardcodedSecrets = true;
        }
    }
});

if (!foundHardcodedSecrets) {
    passed.push('✅ No hardcoded secrets found');
}

// Check 4: Password Requirements
console.log('\n📋 Checking Password Requirements...');
const passwordFiles = [
    { file: 'app/api/profile/change-password/route.ts', minLength: 8 },
    { file: 'app/api/register-company/route.ts', minLength: 8 }
];

passwordFiles.forEach(({ file, minLength }) => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');

        if (content.includes(`length < ${minLength}`)) {
            passed.push(`✅ ${file} requires minimum ${minLength} character passwords`);
        } else {
            warnings.push(`⚠️  ${file} may have weak password requirements`);
        }

        // Check for password strength validation
        if (content.includes('hasUpperCase') && content.includes('hasLowerCase') &&
            content.includes('hasNumbers') && content.includes('hasSpecialChar')) {
            passed.push(`✅ ${file} has password strength validation`);
        } else {
            warnings.push(`⚠️  ${file} may be missing password strength validation`);
        }
    }
});

// Check 5: Authentication Middleware
console.log('\n📋 Checking Authentication Middleware...');
const middlewareFile = path.join(__dirname, '..', 'middleware.ts');
if (fs.existsSync(middlewareFile)) {
    const content = fs.readFileSync(middlewareFile, 'utf8');

    if (content.includes('/admin') && content.includes('verifyJWT')) {
        passed.push('✅ Admin routes are protected by authentication');
    } else {
        issues.push('❌ CRITICAL: Admin routes may not be properly protected');
    }

    if (content.includes('Strict-Transport-Security')) {
        passed.push('✅ HSTS header is configured');
    } else {
        warnings.push('⚠️  HSTS header not found');
    }
}

// Check 6: Git Security
console.log('\n📋 Checking Git Security...');
const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');

    if (gitignore.includes('.env')) {
        passed.push('✅ .env is in .gitignore');
    } else {
        issues.push('❌ CRITICAL: .env is NOT in .gitignore');
    }
} else {
    warnings.push('⚠️  .gitignore not found');
}

// Print Results
console.log('\n' + '='.repeat(60));
console.log('📊 SECURITY AUDIT RESULTS');
console.log('='.repeat(60));

if (passed.length > 0) {
    console.log('\n✅ PASSED CHECKS:');
    passed.forEach(item => console.log(`  ${item}`));
}

if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(item => console.log(`  ${item}`));
}

if (issues.length > 0) {
    console.log('\n❌ CRITICAL ISSUES:');
    issues.forEach(item => console.log(`  ${item}`));
}

console.log('\n' + '='.repeat(60));
console.log(`Summary: ${passed.length} passed, ${warnings.length} warnings, ${issues.length} critical issues`);
console.log('='.repeat(60));

if (issues.length > 0) {
    console.log('\n🚨 DEPLOYMENT BLOCKED: Fix critical issues before deploying');
    process.exit(1);
} else if (warnings.length > 0) {
    console.log('\n⚠️  Review warnings before deploying to production');
    process.exit(0);
} else {
    console.log('\n✅ All security checks passed!');
    process.exit(0);
}
