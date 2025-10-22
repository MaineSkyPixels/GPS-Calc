# GPS Calculator Deployment Guide

## Quick Start (Client-Only)

The application works entirely in the browser without any server setup:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MaineSkyPixels/GPS-Calc.git
   cd GPS-Calc
   ```

2. **Open in browser**:
   - Simply open `index.html` in any modern web browser
   - All features work except server-based sharing

## Full Deployment (With Sharing)

### Option 1: Local Development

1. **Install Node.js** (if not already installed)

2. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Access the application**:
   - Open `http://localhost:3001` in your browser
   - All features including sharing will work

### Option 2: Production Deployment

#### Using Heroku

1. **Create Heroku app**:
   ```bash
   heroku create your-gps-calc-app
   ```

2. **Add buildpack**:
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

3. **Deploy**:
   ```bash
   git push heroku main
   ```

#### Using Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

#### Using Railway

1. **Connect GitHub repository**
2. **Set environment variables** (if needed)
3. **Deploy automatically**

### Option 3: Self-Hosted

1. **Set up server**:
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Configure reverse proxy** (nginx example):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **Set up SSL** (Let's Encrypt recommended)

## Environment Variables

Create a `.env` file in the server directory:

```env
PORT=3001
NODE_ENV=production
DATABASE_URL=./calculations.db
```

## Database

The application uses SQLite by default, which is perfect for:
- Small to medium deployments
- No additional database setup required
- Automatic cleanup of expired calculations

For high-traffic deployments, consider:
- PostgreSQL
- MongoDB
- MySQL

## Features by Deployment Type

| Feature | Client-Only | With Server |
|---------|-------------|-------------|
| Coordinate Conversion | ✅ | ✅ |
| Distance Calculation | ✅ | ✅ |
| Local Storage | ✅ | ✅ |
| Sharing (Local) | ✅ | ✅ |
| Sharing (Server) | ❌ | ✅ |
| QR Code Generation | ❌ | ✅ |
| URL-based Loading | ❌ | ✅ |

## Security Considerations

1. **Rate Limiting**: Implement rate limiting for API endpoints
2. **Input Validation**: Validate all input data
3. **CORS**: Configure CORS appropriately
4. **HTTPS**: Always use HTTPS in production
5. **Data Cleanup**: Expired calculations are automatically cleaned up

## Monitoring

1. **Health Check**: `GET /api/health`
2. **Statistics**: `GET /api/stats`
3. **Logs**: Monitor server logs for errors
4. **Database**: Monitor database size and performance

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   lsof -ti:3001 | xargs kill -9
   ```

2. **Database locked**:
   - Check if another process is using the database
   - Restart the server

3. **CORS errors**:
   - Check CORS configuration in server.js
   - Ensure proper headers are set

### Performance Optimization

1. **Enable gzip compression**
2. **Set up CDN for static files**
3. **Use database indexes**
4. **Implement caching**

## Support

For issues and questions:
- GitHub Issues: https://github.com/MaineSkyPixels/GPS-Calc/issues
- Documentation: README.md
- Live Demo: https://maineskypixels.github.io/GPS-Calc/
