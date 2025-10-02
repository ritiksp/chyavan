# Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+ 
- NPM or Yarn
- SSL certificate (HTTPS required)
- Environment variables configured

### 1. Environment Setup

Create your production environment file:
```bash
# Copy the example config
cp config.example.js config.js

# Edit with your production values
nano config.js
```

Required environment variables:
```bash
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
JWT_SECRET=your-secure-jwt-secret-here
```

### 2. Build the Library

```bash
# Install dependencies
npm ci --production=false

# Build for production
npm run build:prod

# Verify build output
ls -la dist/
# Should contain:
# - chyavan.esm.js
# - chyavan.cjs.js  
# - chyavan.umd.js
# - chyavan.umd.min.js
```

### 3. Deploy Options

#### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

#### Option B: Netlify
```bash
# Build command
npm run build:prod

# Publish directory
dist/

# Configure redirects for SPA
echo "/* /index.html 200" > dist/_redirects
```

#### Option C: Traditional Server
```bash
# Install PM2 for process management
npm install -g pm2

# Start the server
pm2 start server/server.js --name "chyavan-server"

# Configure reverse proxy (nginx)
sudo nano /etc/nginx/sites-available/chyavan
```

### 4. Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Static files
    location /dist/ {
        root /var/www/chyavan;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API endpoints
    location /track {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3000;
    }
}
```

### 5. CDN Setup (Optional)

For global distribution, use a CDN:

```javascript
// Update your API endpoint
const tracker = new Chyavan({
  apiEndpoint: 'https://cdn.yourdomain.com/track'
});
```

### 6. Monitoring Setup

#### Health Checks
```bash
# Add to your monitoring system
curl -f https://yourdomain.com/health || exit 1
```

#### Log Monitoring
```bash
# Using PM2
pm2 logs chyavan-server

# Using Docker
docker logs chyavan-server
```

### 7. SSL Certificate

#### Let's Encrypt (Free)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Commercial SSL
- Upload certificate files to your server
- Update nginx configuration
- Test SSL rating: https://www.ssllabs.com/ssltest/

### 8. Database Setup (Future)

When implementing data storage:

```bash
# PostgreSQL setup
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb chyavan_prod

# Create user
sudo -u postgres createuser --interactive

# Update config.js
DATABASE_URL=postgresql://user:password@localhost:5432/chyavan_prod
```

### 9. Backup Strategy

```bash
# Database backup (when implemented)
pg_dump chyavan_prod > backup_$(date +%Y%m%d).sql

# File backup
tar -czf chyavan_backup_$(date +%Y%m%d).tar.gz /var/www/chyavan/
```

### 10. Performance Optimization

#### Server Optimization
```javascript
// Enable compression
const compression = require('compression');
app.use(compression());

// Enable caching
app.use('/dist', express.static('dist', {
  maxAge: '1y',
  etag: true
}));
```

#### Client Optimization
```javascript
// Use minified version in production
const script = document.createElement('script');
script.src = '/dist/chyavan.umd.min.js';
document.head.appendChild(script);
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
The repository includes automated deployment:

1. **Push to main**: Runs tests and builds
2. **Create tag**: Triggers release workflow
3. **Publish to NPM**: Automatically publishes package
4. **Deploy demo**: Updates GitHub Pages

### Manual Release Process
```bash
# Update version
npm version patch

# Push with tag
git push origin main --tags

# GitHub Actions will handle the rest
```

## 🚨 Rollback Procedure

If issues occur:

1. **Immediate**: Disable tracking in client
```javascript
// Emergency disable
localStorage.setItem('trackingConsent', 'false');
```

2. **Server**: Rollback to previous version
```bash
# PM2
pm2 stop chyavan-server
pm2 start chyavan-server --update-env

# Docker
docker-compose down
docker-compose up -d
```

3. **CDN**: Purge cache if using CDN

## 📊 Monitoring & Alerts

### Key Metrics to Monitor
- Server response time
- Error rate
- Memory usage
- Disk space
- SSL certificate expiry

### Alerting Setup
```bash
# Example monitoring script
#!/bin/bash
if ! curl -f https://yourdomain.com/health; then
    echo "Server down!" | mail -s "Alert" admin@yourdomain.com
fi
```

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] SSL certificate installed and valid
- [ ] Domain DNS configured
- [ ] Server monitoring enabled
- [ ] Backup strategy implemented
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured