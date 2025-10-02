# Security Guide

## 🔒 Security Features

Chyavan implements privacy-first design with multiple security layers:

### Client-Side Security
- **Sensitive Field Detection**: Automatically excludes password, credit card, and other sensitive fields
- **Data Sanitization**: All text input is sanitized before transmission
- **Consent-Based Tracking**: Only tracks with explicit user consent
- **Local Storage**: Consent preferences stored locally, not transmitted

### Server-Side Security
- **Rate Limiting**: Prevents DoS attacks (100 requests per 15 minutes per IP)
- **Input Validation**: Strict validation of all incoming data
- **CORS Protection**: Configurable allowed origins
- **Helmet.js**: Security headers for XSS protection
- **Request Size Limits**: 10MB limit on request bodies

## 🚨 Critical Security Requirements

### Before Production Deployment:

1. **Environment Variables**:
   ```bash
   # Required
   NODE_ENV=production
   ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
   
   # Optional but recommended
   JWT_SECRET=your-secure-jwt-secret-here
   API_KEY=your-api-key-here
   ```

2. **HTTPS Only**: Never run in production without SSL/TLS
3. **Database Security**: Use encrypted connections and proper access controls
4. **NPM Token**: Store in GitHub Secrets as `NPM_TOKEN`, never in code

### GitHub Secrets Setup:
```bash
# Add these to your GitHub repository secrets:
NPM_TOKEN=your_npm_token_here
```

## 🛡️ Privacy Compliance

### GDPR Compliance
- ✅ Consent-based tracking
- ✅ Data minimization (only necessary data collected)
- ✅ User can disable tracking
- ✅ No personal identifiers stored

### CCPA Compliance
- ✅ Opt-out mechanism available
- ✅ Clear privacy notice
- ✅ No sale of personal data

## 🔧 Security Configuration

### Server Configuration
```javascript
// Production server setup
const config = {
  NODE_ENV: 'production',
  PORT: process.env.PORT || 3000,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || [],
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RATE_LIMIT_MAX: 100
};
```

### Client Configuration
```javascript
// Production client setup
const tracker = new Chyavan({
  apiEndpoint: 'https://yourdomain.com/track',
  debug: false, // Always false in production
  bufferSize: 20,
  consentCheck: () => localStorage.getItem('trackingConsent') === 'true'
});
```

## 📋 Security Checklist

- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] Rate limiting active
- [ ] CORS properly configured
- [ ] Input validation enabled
- [ ] Error handling implemented
- [ ] Logging configured (no sensitive data)
- [ ] Database connections encrypted
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting setup

## 🚨 Incident Response

### If Security Breach Suspected:
1. Immediately disable tracking
2. Review server logs
3. Check for unusual traffic patterns
4. Rotate any compromised secrets
5. Notify affected users if necessary

### Contact Information:
- Security Issues: security@yourdomain.com
- Privacy Concerns: privacy@yourdomain.com
