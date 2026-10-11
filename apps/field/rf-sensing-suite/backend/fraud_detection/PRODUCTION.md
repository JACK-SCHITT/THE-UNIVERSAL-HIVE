# Production Fraud Detection System

Complete architecture for deploying the RL-based fraud detection system at scale.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Transaction Sources                           │
│  Mobile App | Web | POS | ATM | API Partners                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────┴──────────────────────────────────────────┐
│                    API Gateway (Kong/AWS API GW)                 │
│  Rate limiting | Authentication | Request routing               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────────┐
│                      Kafka Event Stream                          │
│  Topic: transactions-raw (10M events/day)                       │
└────┬─────────────────┬──────────────────┬───────────────────────┘
     │                 │                  │
     ▼                 ▼                  ▼
┌─────────┐  ┌──────────────┐  ┌────────────────────┐
│ Feature │  │ ML Inference │  │ Fraud Rules Engine│
│Engineering│  │   Service    │  │ (Fallback/Override)│
│ (Flink) │  │ (TorchServe) │  │ (Drools/Redis)    │
└────┬────┘  └──────┬───────┘  └─────┬──────────────┘
     │              │                 │
     └──────────────┴─────────────────┘
                    │
            ┌───────┴────────┐
            │  Decision API  │
            │  (FastAPI)     │
            └───────┬────────┘
                    │
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
┌─────────┐  ┌────────────┐  ┌──────────┐
│ Approve │  │ Step-Up    │  │ Block/   │
│         │  │ (2FA/SMS)  │  │ Review   │
└─────────┘  └────────────┘  └──────────┘
```

## Core Components

### 1. Data Ingestion Pipeline

**Kafka Topics:**
```yaml
transactions-raw:
  partitions: 24
  replication: 3
  retention: 7 days
  
transactions-enriched:
  partitions: 24
  replication: 3
  retention: 30 days

decisions:
  partitions: 12
  replication: 3
  retention: 90 days
```

**Flink Job (Feature Engineering):**
```python
# Stream processing
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import StreamTableEnvironment

env = StreamExecutionEnvironment.get_execution_environment()
table_env = StreamTableEnvironment.create(env)

# Windowed aggregations (per user, last 24h)
table_env.execute_sql("""
    CREATE VIEW user_features AS
    SELECT 
        user_id,
        COUNT(*) as tx_count_24h,
        AVG(amount) as avg_amount_24h,
        STDDEV(amount) as std_amount_24h,
        COUNT(DISTINCT merchant) as unique_merchants_24h,
        MAX(amount) as max_amount_24h
    FROM transactions
    WHERE event_time > CURRENT_TIMESTAMP - INTERVAL '24' HOUR
    GROUP BY user_id, TUMBLE(event_time, INTERVAL '1' HOUR)
""")
```

### 2. User Profile Store (Redis)

**Schema:**
```python
# Redis keys
user:{user_id}:profile = {
    "avg_transaction": 125.50,
    "std_deviation": 45.30,
    "typical_merchants": ["Amazon", "Starbucks", "Shell"],
    "typical_locations": [[37.7749, -122.4194]],  # SF
    "trust_score": 0.87,
    "transaction_count": 342,
    "last_updated": 1699564800
}

user:{user_id}:recent_tx = [
    # Rolling window (last 100 transactions)
    {"amount": 50.0, "merchant": "Gas", "timestamp": ...},
    ...
]
```

### 3. RL Model Serving

**TorchServe Handler:**
```python
import torch
from ts.torch_handler.base_handler import BaseHandler

class FraudRLHandler(BaseHandler):
    def preprocess(self, data):
        # Extract features
        user_id = data["user_id"]
        profile = redis_client.get(f"user:{user_id}:profile")
        
        # Build state vector
        state = torch.tensor([
            data["amount"],
            data["amount"] - profile["avg_transaction"],
            profile["trust_score"],
            # ... more features
        ])
        return state.unsqueeze(0)
    
    def inference(self, state):
        # RL policy forward pass
        with torch.no_grad():
            q_values = self.model(state)
        return q_values
    
    def postprocess(self, q_values):
        # Map to decision
        actions = ["approve", "step_up", "review", "block"]
        action_idx = q_values.argmax().item()
        
        # Apply safety overrides
        if self.trust_score < 0.85:
            action_idx = max(action_idx, 2)  # Force review
        
        return {
            "action": actions[action_idx],
            "confidence": q_values.max().item(),
            "q_values": q_values.tolist()
        }
```

**Deploy:**
```bash
torch-model-archiver --model-name fraud_rl \
  --version 1.0 \
  --model-file model.py \
  --serialized-file checkpoint.pth \
  --handler handler.py

torchserve --start --model-store /models \
  --models fraud_rl.mar \
  --ts-config config.properties
```

### 4. Conservative Override Logic

**Rules Engine (Drools):**
```java
// Prime Directive Rules
rule "Low Trust Override"
when
    $tx : Transaction(userTrust < 0.85)
then
    $tx.forceReview();
end

rule "High Amount Override"
when
    $tx : Transaction(amount > 1000, policyConfidence < 0.9)
then
    $tx.requireStepUp();
end

rule "Amplified Welfare Penalty"
when
    $tx : Transaction(isFraud == true, action == "approve")
then
    penaltyMultiplier = 10.0;  // 10x for false approvals
end
```

### 5. Privacy Layer (Differential Privacy)

**Local DP on Client:**
```python
# Mobile SDK (before sending)
def add_local_noise(transaction, epsilon=1.0):
    sensitivity = 100  # Max transaction amount delta
    scale = sensitivity / epsilon
    
    # Laplace noise
    noise = np.random.laplace(0, scale)
    transaction["amount"] += noise
    
    # Round to preserve utility
    transaction["amount"] = round(transaction["amount"], 2)
    return transaction
```

**Federated Learning Setup:**
```python
# Flower (federated learning framework)
import flwr as fl

class FraudClient(fl.client.NumPyClient):
    def get_parameters(self):
        return self.model.get_weights()
    
    def fit(self, parameters, config):
        # Train on local institution data
        self.model.set_weights(parameters)
        history = self.model.fit(self.X_train, self.y_train, epochs=1)
        return self.model.get_weights(), len(self.X_train), {}
    
# Aggregate across institutions (banks, fintechs)
fl.server.start_server(
    server_address="[::]:8080",
    config={"num_rounds": 10}
)
```

## Deployment Infrastructure

### Kubernetes Manifests

**`fraud-detection-deployment.yaml`:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fraud-detection-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fraud-api
  template:
    metadata:
      labels:
        app: fraud-api
    spec:
      containers:
      - name: api
        image: freqboard/fraud-api:1.0
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        env:
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: fraud-secrets
              key: redis-url
        - name: MODEL_URL
          value: "http://torchserve:8080"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fraud-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fraud-detection-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Circuit Breakers

**Hystrix-style:**
```python
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=60)
def call_ml_model(state):
    response = requests.post("http://torchserve:8080/predictions/fraud_rl",
                            json={"data": state.tolist()})
    if response.status_code != 200:
        raise Exception("Model inference failed")
    return response.json()

# Fallback to rules
def fallback_decision(transaction):
    if transaction["amount"] > 500:
        return "review"
    return "approve"
```

## Monitoring & Observability

### Metrics (Prometheus)

```python
from prometheus_client import Counter, Histogram, Gauge

# Business metrics
fraud_catch_rate = Gauge('fraud_catch_rate', 'Fraud detection rate')
false_positive_rate = Gauge('false_positive_rate', 'False decline rate')
decisions = Counter('decisions_total', 'Decisions by action', ['action'])

# Technical metrics
model_latency = Histogram('model_inference_seconds', 'Inference time')
trust_score_dist = Histogram('user_trust_score', 'Trust distribution')

# Alerts
from prometheus_client import push_to_gateway

if false_positive_rate.get() > 0.02:  # 2% threshold
    push_to_gateway('pushgateway:9091', job='fraud_detection',
                   registry=registry)
```

### Dashboards (Grafana)

**Key Panels:**
1. **Decision Breakdown**: Pie chart (approve/step_up/review/block)
2. **Trust Evolution**: Line graph over time
3. **Fraud Catch Rate**: Gauge (target: >95%)
4. **False Positive Rate**: Gauge (target: <0.5%)
5. **Model Performance**: Latency P50/P95/P99
6. **Circuit Breaker Status**: Open/Closed/Half-Open

## Compliance & Auditing

### Model Cards

**`fraud_rl_model_card.md`:**
```markdown
# Fraud Detection RL Model Card

## Model Details
- **Version:** 1.0.3
- **Training Date:** 2024-03-15
- **Architecture:** Actor-Critic (PPO)
- **Parameters:** 2.3M
- **Training Data:** 10M transactions (Jan 2023 - Feb 2024)

## Performance
- **Fraud Catch Rate:** 96.2%
- **False Positive Rate:** 0.4%
- **AUC-ROC:** 0.98

## Bias Analysis
- **Gender:** No significant bias (ΔFP < 0.1%)
- **Age:** Slightly higher FP for 18-25 (0.6% vs 0.4%)
- **Geography:** Uniform across regions

## Limitations
- Requires >5 prior transactions for accuracy
- Performance degrades on novel attack patterns (solved via online learning)
```

### Differential Auditing

```python
# Quarterly bias audit
def audit_bias(decisions, protected_attributes):
    for attr in ["gender", "age_group", "ethnicity"]:
        group_fps = decisions.groupby(attr).apply(
            lambda x: (x["predicted_fraud"] & ~x["actual_fraud"]).mean()
        )
        
        if group_fps.max() - group_fps.min() > 0.02:  # 2% disparity
            alert("Bias detected in attribute: " + attr)
```

## Cost Estimate (100k Active Users)

| Component | Cost/Month |
|-----------|------------|
| Kafka (3 brokers) | $300 |
| Redis Cluster | $150 |
| PostgreSQL (RDS) | $200 |
| K8s Cluster (5 nodes) | $800 |
| TorchServe (GPU instances) | $600 |
| Monitoring (Prometheus/Grafana) | $50 |
| **Total Infrastructure** | **$2,100** |
| **Team (6-8 people)** | **$50,000** |
| **Grand Total** | **$52,100/month** |

## Timeline (from Zero to Production)

### Phase 1: Offline Training (Months 1-3)
- [ ] Collect historical transaction data
- [ ] Train supervised baseline (XGBoost)
- [ ] Implement RL environment
- [ ] Offline RL training (behavior cloning → PPO)
- [ ] Simulate on holdout set

### Phase 2: Shadow Mode (Months 4-6)
- [ ] Deploy in shadow (log decisions, no action)
- [ ] Compare RL vs baseline vs current rules
- [ ] Tune hyperparameters (trust thresholds, penalties)
- [ ] Build monitoring dashboards

### Phase 3: A/B Testing (Months 7-9)
- [ ] Route 1% traffic to RL system
- [ ] Monitor false positives closely
- [ ] Gradually increase to 10%, 25%, 50%
- [ ] Human-in-loop for review queue

### Phase 4: Full Rollout (Months 10-12)
- [ ] 100% traffic to RL
- [ ] Online learning enabled (cautious updates)
- [ ] Circuit breakers tested
- [ ] Compliance audit passed

### Phase 5: Optimization (Months 13-18)
- [ ] Federated learning across institutions
- [ ] Edge deployment (on-device inference)
- [ ] Model compression (quantization)
- [ ] Continuous improvement

## Success Metrics

**Must Achieve:**
- Fraud catch rate >95%
- False positive rate <0.5%
- P95 latency <100ms
- 99.9% uptime
- Zero bias incidents

**Nice to Have:**
- Trust score accuracy >90%
- Explainability score >80% (user surveys)
- Ops overhead <2 hours/week

---

**Contact:** fraud-ml-team@freqboard.com
