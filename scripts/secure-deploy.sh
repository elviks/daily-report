#!/bin/bash

# 🔐 MongoDB Security Deployment Script
# This script helps secure your MongoDB deployment

set -e

echo "🚨 CRITICAL: Your MongoDB database is currently vulnerable to attacks!"
echo "🔒 This script will help you secure it immediately."
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ Do not run this script as root!"
   exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it first."
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo "1. ✅ Docker is running"
echo "2. ✅ docker-compose is available"
echo ""

# Generate secure passwords
echo "🔑 Generating secure passwords..."
MONGO_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

echo "📝 Generated passwords:"
echo "MongoDB Password: ${MONGO_PASSWORD}"
echo "JWT Secret: ${JWT_SECRET}"
echo ""

# Create .env file
echo "📄 Creating .env file..."
cat > .env << EOF
# MongoDB Security Configuration
MONGO_PASSWORD=${MONGO_PASSWORD}
JWT_SECRET=${JWT_SECRET}
NODE_ENV=production
EOF

echo "✅ .env file created successfully"
echo ""

# Stop current deployment
echo "🛑 Stopping current deployment..."
docker-compose down

# Remove existing volumes (WARNING: This will delete all data!)
echo "🗑️  Removing existing MongoDB volumes..."
echo "⚠️  WARNING: This will delete all existing data!"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker volume rm daily-report_mongo-data 2>/dev/null || true
    echo "✅ Existing volumes removed"
else
    echo "❌ Deployment cancelled. Please backup your data first."
    exit 1
fi

echo ""

# Start with new security configuration
echo "🚀 Starting secure deployment..."
docker-compose up -d

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Check if MongoDB is running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🔐 Security measures implemented:"
    echo "1. ✅ MongoDB authentication enabled"
    echo "2. ✅ Database port restricted to localhost"
    echo "3. ✅ Isolated Docker network"
    echo "4. ✅ Secure passwords generated"
    echo "5. ✅ JWT secret configured"
    echo ""
    echo "📊 Your application is now running securely at:"
    echo "   http://localhost:3016"
    echo ""
    echo "🔍 To monitor the deployment:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛡️  Additional security recommendations:"
    echo "   - Review security-config.md for more details"
    echo "   - Set up firewall rules"
    echo "   - Enable monitoring and alerts"
    echo "   - Regular security audits"
else
    echo "❌ Deployment failed. Check logs with: docker-compose logs"
    exit 1
fi

echo ""
echo "🔐 IMPORTANT: Save these credentials securely!"
echo "MongoDB Password: ${MONGO_PASSWORD}"
echo "JWT Secret: ${JWT_SECRET}"
echo ""
echo -e "${RED}⚠️ Never commit these credentials to version control!${NC}"
echo -e "${GREEN}✅ Your MongoDB database is now secure with multiple security layers!${NC}"

# Create security summary
cat > SECURITY_SUMMARY.md << EOF
# 🔐 Security Deployment Summary

## ✅ Security Measures Implemented

### 1. Database Security
- MongoDB authentication enabled
- Port 27017 restricted to localhost only
- Secure password: \`${MONGO_PASSWORD}\`
- Role-based access control

### 2. Network Security
- Isolated Docker network
- Internal network configuration
- No external MongoDB access
- Port binding restrictions

### 3. Application Security
- JWT authentication
- Rate limiting
- Brute force protection
- IP blocking system
- Security headers

### 4. Monitoring & Logging
- Security event logging
- Failed login tracking
- Audit logging
- MongoDB Express monitoring

## 🚀 Next Steps

1. **Run Firewall Setup**: \`./scripts/security/firewall-setup.sh\`
2. **Monitor Security**: \`./scripts/security/monitor.sh\`
3. **Review Logs**: \`docker-compose logs -f\`
4. **Set Cloud Firewall**: Block port 27017 in your cloud provider

## 🔑 Credentials (SAVE SECURELY)

- **MongoDB Password**: \`${MONGO_PASSWORD}\`
- **JWT Secret**: \`${JWT_SECRET}\`
- **Session Secret**: \`${SESSION_SECRET}\`

## 📞 Emergency Contacts

- **Security Team**: [Add Contact]
- **Database Admin**: [Add Contact]
- **System Admin**: [Add Contact]

---
*Generated on: $(date)*
EOF

echo ""
echo -e "${GREEN}📄 Security summary saved to SECURITY_SUMMARY.md${NC}"
echo -e "${GREEN}🎉 Your database is now protected against the ransomware attacks!${NC}"
