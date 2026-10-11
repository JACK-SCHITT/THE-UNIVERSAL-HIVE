# RF & Biometric Sensing Suite

A multi-feature demonstration application that explores RF signal analysis and biometric security technologies. The project simulates three advanced sensing capabilities in a modern React UI.

## Features

### 1. WiFi DensePose — Privacy-Preserving Human Pose Estimation

Visualizes how WiFi Channel State Information (CSI) can be used to estimate human body pose without cameras. Key capabilities:

- **Simulated CSI data** — amplitude and phase arrays generated for up to 4 people
- **Skeleton overlay** — 14-keypoint pose rendered on a canvas
- **Dense body regions** — 10 UV-mapped body segments with per-region coloring
- **Antenna map** — configurable multi-antenna layout visualized in real time
- **Adjustable parameters** — number of people, dense-region display, skeleton toggle
- 10 Hz simulated update rate via `WiFiSignalSimulator` and `DensePoseEstimator`

> Based on the research paper *"DensePose from WiFi"*. Real implementation requires WiFi adapters capable of CSI extraction (e.g., Intel 5300, Atheros) and a PyTorch inference backend.

---

### 2. Multi-Band Radio Scanner

Simulates detection across 20 radio bands from AM through WiFi. Key capabilities:

| Band category | Bands included |
|---|---|
| Broadcast | AM (530–1700 kHz), FM (88–108 MHz) |
| Citizen/Consumer | CB Radio (40 ch), FRS (22 ch), GMRS (30 ch) |
| Marine / Aviation | Marine VHF (57 ch), Aviation VHF (760 ch) |
| Amateur (Ham) | 160 m, 80 m, 40 m, 20 m, 10 m, 6 m, 2 m, 70 cm |
| Public Safety | VHF (150–174 MHz), UHF (450–512 MHz) |
| Weather | NOAA Weather Radio (7 ch, 162.4–162.55 MHz) |
| Digital | WiFi 2.4 GHz (14 ch), WiFi 5 GHz (24 ch) |

- **Spectrum analyzer** — animated frequency waterfall per band
- **Signal list** — decoded mock transmissions (CB chatter, ATC calls, weather alerts, etc.)
- **Band metadata** — modulation, channel spacing, capabilities, equipment guide
- **Channel reference** — CB, Marine VHF, and NOAA channel frequency tables

> Simulation only — actual RF scanning requires SDR hardware (RTL-SDR, HackRF) or a device native FM chip.

---

### 3. Biometric Security Suite

Demonstrates three biometric modalities unified under a single tabbed interface:

| Tab | Technology | Description |
|---|---|---|
| **Facial Recognition** | 128-dim face embedding | Bounding-box detection, landmark overlay, identity matching |
| **Voice Recognition** | Voice fingerprint | Speech-to-text, speaker embedding, voice command dispatch |
| **Fraud Detection** | RL + rule-based engine | Risk scoring, step-up auth, behavioral baseline deviation |

- `FacialRecognition` component renders simulated face detections with confidence scores
- `VoiceRecognition` exposes an `onCommand` callback for controlling other modules (e.g., starting a radio scan by voice)
- `FraudDetectionDemo` models a transaction pipeline with trust-state evolution and RL override safety rules

---

## Tech Stack

| Layer | Library / Tool |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| UI components | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS 3 |
| Routing | React Router DOM 6 |
| Charts | Recharts |
| Backend / Auth | Supabase |
| State management | Zustand, Redux Toolkit |
| 3D rendering | Three.js + React Three Fiber |
| Form validation | React Hook Form + Zod |
| Payments | Stripe |

---

## Project Structure

```
src/
├── App.tsx                   # Root component with navigation and routes
├── pages/
│   ├── WiFiDensePose.tsx     # WiFi pose estimation page
│   ├── RadioScanner.tsx      # Multi-band radio scanner page
│   └── BiometricSuite.tsx    # Biometric security suite page
├── components/
│   ├── AntennaMap.tsx        # WiFi antenna configuration visualizer
│   ├── BandSelector.tsx      # Radio band selection sidebar
│   ├── FacialRecognition.tsx # Face detection and recognition UI
│   ├── FraudDetectionDemo.tsx# Transaction fraud scoring demo
│   ├── PoseVisualization.tsx # Canvas-based human pose renderer
│   ├── RadioSpectrumAnalyzer.tsx # Spectrum waterfall chart
│   ├── SignalList.tsx        # Detected radio signal list
│   ├── VoiceRecognition.tsx  # Speech recognition and speaker ID UI
│   ├── WiFiSignalGraph.tsx   # CSI amplitude / phase line chart
│   └── ui/                  # shadcn/ui component primitives
├── lib/
│   ├── face-recognition.ts  # Face detection simulation logic
│   ├── fraud-detection.ts   # RL-based fraud scoring engine
│   ├── radio-scanner.ts     # Band scanning and signal generation
│   ├── voice-recognition.ts # Voice recognition simulation logic
│   ├── wifi-pose-simulator.ts # CSI data and pose estimation simulation
│   └── utils.ts             # Shared utility helpers
├── types/
│   ├── biometric.ts         # Face, voice, fraud detection interfaces
│   ├── radio-bands.ts       # Band definitions, channel tables, helpers
│   └── wifi-pose.ts         # CSI signal, pose, and antenna interfaces
└── hooks/
    ├── use-mobile.tsx        # Responsive breakpoint hook
    └── use-toast.ts          # Toast notification hook
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18.x ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm (bundled with Node.js)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Other scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Production build to `dist/` |
| `npm run build:dev` | Development build (source maps included) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |

---

## Environment Variables

Copy `.env` and fill in your own values. All variables must be prefixed with `VITE_` to be exposed to the browser bundle.

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | URL of your Supabase project instance |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous key for your Supabase project (safe for client-side use) |

Create a `.env.local` file for local overrides (this file is git-ignored):

```sh
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## Legal & Disclaimer

This application contains **simulated data only**. No real RF signals are transmitted or received.

- Listening to radio transmissions is legal in most countries; transmitting requires the appropriate license for each band.
- Biometric features are demonstration-only and do not process or store real personal data.
- Always comply with local regulations before operating RF equipment.
