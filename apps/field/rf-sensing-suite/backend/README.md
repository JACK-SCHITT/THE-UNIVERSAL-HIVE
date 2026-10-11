# Backend Service - FreqBoard Sleuth

Production-grade backend for WiFi DensePose detection, fraud detection RL, and RF signal processing.

## Architecture

```
backend/
├── wifi_densepose/          # WiFi CSI to DensePose model
│   ├── model.py            # Neural network architecture
│   ├── train.py            # Training script
│   ├── inference.py        # Real-time inference
│   └── data_loader.py      # CSI data processing
├── fraud_detection/         # RL-based fraud detection
│   ├── rl_agent.py         # PPO/SAC agent
│   ├── environment.py      # Transaction environment
│   ├── training.py         # Offline RL training
│   └── serving.py          # Model serving API
├── api_server/              # REST + WebSocket server
│   ├── app.py              # FastAPI application
│   ├── websocket.py        # Real-time streaming
│   └── routes/             # API endpoints
├── hardware/                # Hardware interface layers
│   ├── wifi_csi.py         # WiFi CSI capture (Intel 5300, etc.)
│   ├── sdr_interface.py    # RTL-SDR integration
│   └── sensors.py          # Magnetometer, GPS, etc.
├── requirements.txt
├── docker-compose.yml
└── deploy/
    ├── kubernetes/
    └── terraform/
```

## Tech Stack

- **ML Framework**: PyTorch 2.0+ (for WiFi DensePose + RL)
- **API Server**: FastAPI (async, WebSocket support)
- **Streaming**: Kafka + Redis (for fraud detection pipeline)
- **Database**: PostgreSQL (user profiles) + TimescaleDB (time-series CSI data)
- **Model Serving**: TorchServe or FastAPI direct
- **Orchestration**: Kubernetes + Docker
- **Monitoring**: Prometheus + Grafana + Jaeger

## System Requirements

### Development
- Python 3.10+
- CUDA 11.8+ (for GPU training)
- 16GB RAM minimum
- Ubuntu 20.04+ / macOS

### Production (Fraud Detection MVP)
- 6-8 person team (see fraud_detection/PRODUCTION.md)
- $3-7M budget over 18 months
- Kafka cluster, Redis cluster, K8s infrastructure
- Compliance: PCI-DSS, GLBA, GDPR/CCPA

### Hardware (for Real WiFi CSI)
- **Intel 5300 NIC** with CSI Tool firmware (most common for research)
- **Atheros AR9580** with modified driver
- OR **ESP32** with custom CSI firmware (low-cost option)

## Quick Start

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. WiFi DensePose (Simulated Demo)

```bash
# Generate synthetic CSI data for testing
python wifi_densepose/generate_synthetic_data.py --samples 1000 --output data/synthetic

# Train model (requires real data for production)
python wifi_densepose/train.py --data data/synthetic --epochs 200 --gpu 0

# Run inference server
python wifi_densepose/inference.py --model checkpoints/best_model.pth --port 8001
```

### 3. Fraud Detection (Educational Demo)

```bash
# Run offline RL training simulation
python fraud_detection/training.py --episodes 10000 --output models/fraud_rl

# Start fraud detection API
python fraud_detection/serving.py --model models/fraud_rl --port 8002
```

### 4. Unified API Server

```bash
# Start FastAPI server (combines all services)
uvicorn api_server.app:app --host 0.0.0.0 --port 8000 --reload

# Access API docs: http://localhost:8000/docs
# WebSocket endpoint: ws://localhost:8000/ws/realtime
```

### 5. Docker Deployment

```bash
docker-compose up -d

# Services:
# - api: http://localhost:8000
# - wifi_densepose: http://localhost:8001
# - fraud_detection: http://localhost:8002
# - redis: localhost:6379
# - postgres: localhost:5432
```

## API Endpoints

### REST API

```
POST   /api/wifi/detect-pose       # Upload CSI data, get pose estimation
POST   /api/fraud/evaluate          # Evaluate transaction for fraud
GET    /api/radio/scan              # Start RF spectrum scan (if SDR connected)
GET    /api/health                  # Health check
```

### WebSocket

```
ws://localhost:8000/ws/realtime     # Real-time streaming
  - Send: {"type": "wifi_csi", "data": [...]}
  - Receive: {"type": "pose", "persons": [...]}
```

## Data Requirements

### WiFi DensePose

Research dataset format (from paper):
- **Input**: CSI amplitude + phase, shape `[N, T_MAX, 6, 121, 1]`
  - N: number of samples
  - T_MAX: time steps (downsampled)
  - 6: WiFi antennas
  - 121: OFDM subcarriers
  - 1: channel (amplitude/phase combined)

- **Output**: UV coordinates for 24 body regions (DensePose format)

**Where to get data:**
1. **Collect your own**: Intel 5300 NIC + Linux CSI Tool
2. **Research datasets**: Email paper authors (academic use)
3. **Synthetic**: Our generator (for demo only)

### Fraud Detection

Requires:
- Historical transaction logs (CSV: user_id, amount, merchant, timestamp, fraud_label)
- User behavior profiles (updated online)
- Biometric scores (optional, from face/voice modules)

## Production Deployment

### WiFi DensePose Production

```bash
# Train on real CSI data
python wifi_densepose/train.py \
  --data /path/to/real_csi_data \
  --epochs 200 \
  --batch-size 32 \
  --gpu 0,1 \
  --checkpoint checkpoints/

# Export to ONNX for faster inference
python wifi_densepose/export_onnx.py \
  --model checkpoints/best_model.pth \
  --output models/densepose.onnx

# Deploy with TorchServe
torch-model-archiver --model-name wifi_densepose \
  --version 1.0 \
  --model-file wifi_densepose/model.py \
  --serialized-file checkpoints/best_model.pth \
  --handler wifi_densepose/handler.py

torchserve --start --model-store models --models wifi_densepose.mar
```

### Fraud Detection Production

See `fraud_detection/PRODUCTION.md` for complete production architecture:
- Kafka ingestion pipeline
- Redis behavioral cache
- Federated learning setup
- Circuit breakers
- Compliance layers

### Kubernetes

```bash
cd deploy/kubernetes
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml
kubectl apply -f deployments/
kubectl apply -f services/

# Check status
kubectl get pods -n freqboard
```

## Security & Privacy

### WiFi DensePose
- ✅ Privacy-preserving: No cameras, no visual data
- ⚠️ Still tracks human presence - requires consent
- 🔒 Encrypt CSI data in transit (TLS)
- 🔒 Anonymize stored data (no PII linkage)

### Fraud Detection
- 🔐 Local Differential Privacy (LDP): ε=0.8-1.5
- 🔐 Federated learning across institutions
- 🔐 No raw biometric storage (embeddings only, hashed)
- 📋 Compliance: GLBA, PCI-DSS, GDPR, CCPA
- 🛡️ Model cards + quarterly audits

## Testing

```bash
# Unit tests
pytest tests/ -v

# Integration tests (requires services running)
pytest tests/integration/ --integration

# Load testing
locust -f tests/load/locustfile.py --host http://localhost:8000
```

## Monitoring

```bash
# Prometheus metrics: http://localhost:8000/metrics
# Grafana dashboards: http://localhost:3000
# Jaeger tracing: http://localhost:16686
```

## Research Papers

1. **WiFi DensePose**: "Dense Human Pose Estimation from WiFi" (see references)
2. **Fraud Detection RL**: Custom implementation based on:
   - Sutton & Barto - Reinforcement Learning
   - Conservative Q-Learning (CQL)
   - Amplified welfare penalties (our contribution)

## Support & Contributing

- Issues: GitHub Issues
- Discussions: GitHub Discussions
- Academic collaboration: contact@freqboard.ai

## License

MIT License (for demo/research)
Production use requires additional compliance review.
