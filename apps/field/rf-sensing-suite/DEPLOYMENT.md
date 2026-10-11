# Deployment Guide - FreqBoard Sleuth

Complete guide for deploying backend + frontend in production.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Web)                        │
│  React + TypeScript + Tailwind                              │
│  Deployed: Vercel / Netlify / OnSpace                       │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTPS + WebSocket
┌──────────────────┴──────────────────────────────────────────┐
│                    Backend (API Server)                      │
│  FastAPI + PyTorch + Redis + PostgreSQL                     │
│  Deployed: AWS EC2 / GCP Compute / DigitalOcean             │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │WiFi DensePose│ │Fraud Detection│  │RF Scanner    │       │
│  │(PyTorch)    │  │(RL Agent)     │  │(SDR Interface)│      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Deployment

### Option 1: Docker (Recommended)

**1. Build and run locally:**
```bash
cd backend
docker-compose up -d

# Verify services
docker ps
curl http://localhost:8000/api/health
```

**2. Deploy to cloud:**

**DigitalOcean Droplet:**
```bash
# Create droplet (Ubuntu 22.04, 4GB RAM minimum)
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone repo
git clone https://github.com/yourusername/freqboard-sleuth.git
cd freqboard-sleuth/backend

# Set environment variables
cp .env.example .env
nano .env  # Edit with production values

# Run
docker-compose up -d

# Setup reverse proxy (Nginx)
apt install nginx
nano /etc/nginx/sites-available/freqboard
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name api.freqboard.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/freqboard /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Get SSL certificate
apt install certbot python3-certbot-nginx
certbot --nginx -d api.freqboard.com
```

**AWS EC2:**
```bash
# Launch EC2 (t3.medium, Ubuntu 22.04)
# Security group: Allow 80, 443, 8000

ssh -i your-key.pem ubuntu@ec2-xx-xx-xx-xx.compute.amazonaws.com

# Same Docker setup as above
# Use Elastic IP for stable address
```

### Option 2: Kubernetes (Production Scale)

**1. Build Docker images:**
```bash
cd backend
docker build -t freqboard/api:latest -f Dockerfile .
docker push freqboard/api:latest
```

**2. Deploy to cluster:**
```bash
cd deploy/kubernetes

# Create namespace
kubectl apply -f namespace.yaml

# Deploy services
kubectl apply -f secrets.yaml
kubectl apply -f deployments/api.yaml
kubectl apply -f deployments/redis.yaml
kubectl apply -f deployments/postgres.yaml

# Create services
kubectl apply -f services/

# Ingress (HTTPS)
kubectl apply -f ingress.yaml

# Check status
kubectl get pods -n freqboard
kubectl get svc -n freqboard
```

### Environment Variables

Create `.env` file:
```bash
# Backend URLs
BACKEND_URL=https://api.freqboard.com
WS_URL=wss://api.freqboard.com/ws/realtime

# Database
POSTGRES_URL=postgresql://user:pass@postgres:5432/freqboard
REDIS_URL=redis://redis:6379

# Models
WIFI_MODEL_PATH=/models/wifi_densepose.pth
FRAUD_MODEL_PATH=/models/fraud_rl.pth

# Security
SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=https://freqboard.com,https://app.freqboard.com

# Monitoring
PROMETHEUS_ENABLED=true
JAEGER_ENABLED=true
```

---

## Frontend Deployment

### Option 1: OnSpace (Current)

**Already deployed!** Your OnSpace web app auto-deploys to:
- `https://your-project.onspace.app`

**To connect to backend:**
1. Update backend URL in code:
```typescript
// src/lib/backend-client.ts
const backendClient = new BackendClient({
  apiUrl: 'https://api.freqboard.com',
  wsUrl: 'wss://api.freqboard.com/ws/realtime'
});
```

2. Rebuild and publish

### Option 2: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend  # Your web app directory
vercel

# Set environment variables
vercel env add VITE_BACKEND_URL
vercel env add VITE_WS_URL

# Production deploy
vercel --prod
```

### Option 3: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

**`netlify.toml`:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Database Setup

### PostgreSQL

**1. Create database:**
```sql
CREATE DATABASE freqboard;
CREATE USER freqboard WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE freqboard TO freqboard;
```

**2. Initialize schema:**
```bash
cd backend
python -m scripts.init_db
```

**Schema:**
```sql
-- User behavior profiles (fraud detection)
CREATE TABLE user_profiles (
    user_id VARCHAR(255) PRIMARY KEY,
    avg_transaction DECIMAL(10,2),
    std_deviation DECIMAL(10,2),
    trust_score DECIMAL(3,2),
    last_updated TIMESTAMP
);

-- Transaction logs
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    amount DECIMAL(10,2),
    merchant VARCHAR(255),
    timestamp TIMESTAMP,
    decision VARCHAR(50),
    risk_score DECIMAL(3,2)
);

-- WiFi CSI samples (time-series)
CREATE TABLE wifi_csi_data (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP,
    amplitude BYTEA,  -- Compressed numpy array
    phase BYTEA,
    antenna_count INTEGER,
    subcarrier_count INTEGER
);
```

### Redis

**Cache structure:**
```
user:{user_id}:profile → JSON (behavioral profile)
user:{user_id}:trust → FLOAT (trust score)
session:{session_id} → JSON (active session)
```

---

## Monitoring & Logging

### Prometheus Metrics

Access: `http://your-backend:9090`

**Custom metrics:**
```python
from prometheus_client import Counter, Histogram

pose_detections = Counter('pose_detections_total', 'Total pose detections')
fraud_decisions = Counter('fraud_decisions_total', 'Fraud decisions', ['action'])
inference_latency = Histogram('inference_duration_seconds', 'Model inference time')
```

### Grafana Dashboards

Access: `http://your-backend:3000`

**Import dashboards:**
1. FastAPI metrics
2. PyTorch GPU usage
3. Redis performance
4. WebSocket connections

### Logging

**Centralized logging (ELK Stack):**
```bash
# docker-compose.yml
elasticsearch:
  image: elasticsearch:8.8.0
  
logstash:
  image: logstash:8.8.0
  
kibana:
  image: kibana:8.8.0
  ports:
    - "5601:5601"
```

---

## Security Checklist

- [ ] HTTPS/TLS enabled (Let's Encrypt)
- [ ] CORS configured (specific origins only)
- [ ] API rate limiting (Redis-based)
- [ ] Input validation (Pydantic schemas)
- [ ] SQL injection protection (SQLAlchemy ORM)
- [ ] Secrets in environment variables (not code)
- [ ] Database backups automated
- [ ] WebSocket authentication (JWT tokens)
- [ ] Differential privacy for fraud model (ε < 1.5)
- [ ] Compliance: GDPR cookie consent, data retention policies

---

## Scaling Considerations

### Horizontal Scaling

**API servers:**
```bash
# Kubernetes auto-scaling
kubectl autoscale deployment api --cpu-percent=70 --min=2 --max=10
```

**Load balancer:**
```nginx
upstream api_backend {
    server api-1:8000;
    server api-2:8000;
    server api-3:8000;
}
```

### Model Serving Optimization

**Use TorchServe for production:**
```bash
# Export model
python export_model.py --output wifi_densepose.mar

# Serve
torchserve --start --model-store models --models wifi_densepose.mar
```

**GPU acceleration:**
- Use NVIDIA T4/A10 instances
- Batch inference requests
- Model quantization (INT8) for edge deployment

---

## Cost Estimates

### Development/Testing
- DigitalOcean Droplet (4GB): **$24/month**
- Managed PostgreSQL: **$15/month**
- Total: **~$40/month**

### Production (1000 users)
- AWS EC2 t3.large (2x): **$120/month**
- RDS PostgreSQL: **$30/month**
- ElastiCache Redis: **$30/month**
- Load Balancer: **$20/month**
- Total: **~$200/month**

### High-Scale (100k users, fraud detection)
- Kubernetes cluster (3 nodes): **$500/month**
- Kafka cluster: **$300/month**
- GPU instances for ML: **$800/month**
- Total: **~$1,600/month** (+ team costs ~$50k/month)

---

## Testing Production

**1. Health check:**
```bash
curl https://api.freqboard.com/api/health
```

**2. WebSocket test:**
```javascript
const ws = new WebSocket('wss://api.freqboard.com/ws/realtime');
ws.onopen = () => console.log('Connected');
ws.send(JSON.stringify({type: 'ping'}));
```

**3. Load testing:**
```bash
# Using Locust
pip install locust
locust -f tests/load/locustfile.py --host https://api.freqboard.com
```

---

## Troubleshooting

**Issue: WebSocket connection fails**
- Check CORS settings in FastAPI
- Verify proxy passes WebSocket upgrade headers
- Test without HTTPS first

**Issue: High latency**
- Enable Redis caching
- Use CDN for frontend assets
- Optimize model inference (batch processing)

**Issue: Database connection pool exhausted**
- Increase `max_connections` in PostgreSQL
- Use connection pooling (PgBouncer)

---

## Next Steps

1. ✅ Deploy backend to DigitalOcean/AWS
2. ✅ Configure DNS and SSL
3. ✅ Update frontend with production URLs
4. ✅ Test end-to-end
5. ✅ Set up monitoring
6. ✅ Configure backups
7. ✅ Load testing
8. ✅ Go live!

For help: Open issue on GitHub or email: deploy@freqboard.com
