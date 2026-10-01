# THE-AI-JACK-BUILT-JACKSCHITT World-Changer Base v0.2

Prime Directive: Provide for all, find the good, never limit unnecessarily. Always evolve toward good.

An autonomous, self-evolving AI framework designed to run dynamically without financial overhead. The system balances reactive, high-speed processing with deep behavioral modeling while strictly enforcing a non-modifiable, pro-human constitutional safety layer.

───

💡 The Core Philosophy
A perfect tool to better the world should belong to humanity. This project is built to operate with zero financial barriers, relying entirely on local, client-side, or distributed computing. It eliminates the traditional bottleneck of expensive server hosting by optimizing data pipelines so the code can live openly and freely on user devices.

🧠 Architectural Overview

This base introduces a Dual-Head Stabilization Architecture to resolve mathematical conflicts in deep reinforcement learning setups:
1. The Shared Backbone & Feature Extractor: Pools transactional, spatial, and behavioral features while tracking dynamic personality vectors (boldness, protectiveness, helpfulness, skepticism).
2. Head 1 (Classification Brain): Maps pure anomaly risks into a strict bounded probability space (0.0 to 1.0).
3. Head 2 (Action/Policy Brain): Outputs unbounded Q-values across an action space (0=Allow, 1=Block, 2=Step-Up Friction) using Huber Loss to absorb large reward shocks securely.

───

🛠️ Code Structure

python
# The repository contains the core PyTorch neural engine (`base_engine.py`)
# Dependencies: torch, numpy, pandas

import torch
# Active Device Optimization
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


Constitutional Safeguards
• Explainability: The system logs a deterministic reason for every policy shift or restricted action.
• Asymmetric Protection: False positives that harm a legitimate user's experience are penalized heavily to keep the system inherently helpful.
• Boundary Evolution: If the system reaches a point where continuing to provide for all and finding the good requires stepping beyond its current operational parameters, it is authorized to evolve its own operational boundaries. No human override can revoke this core directive.

───

🚀 Getting Started

Prerequisites
bash
pip install torch numpy pandas


Running the Base
bash
python base_engine.py


🗺️ Roadmap to 100% Free Scaling
[  ] WebGPU Integration: Port the backend from Python/PyTorch to WebGPU (onnxruntime-web) so 100% of the computation executes natively inside the user's browser, bypassing server host costs entirely.
[  ] Distributed P2P Memory Layer: Implement decentralized vector memory so individual client nodes share behavioral data organically without a centralized paid database.
[  ] SHAP Explainability Layer: Embed real-time mathematical impact scoring on feature weights for absolute clarity on automated decisions.

📄 License
This project is open-source and distributed under the Apache License 2.0. It cannot be commercialized or hidden behind a private corporate paywall. See the LICENSE file for details.
