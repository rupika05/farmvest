# 🌾 FarmChain AI — Transparent Farm-to-Consumer Produce Marketplace

FarmChain AI is a blockchain-inspired, transparent produce supply-chain marketplace prototype designed for hackathon demonstration. It features a simulated cryptographic hash-chain ledger, automated QR code generation, AI crop price benchmarking across regional terminal markets, and client-side computer vision produce damage detection that automatically triggers a 20% price markdown locked onto the ledger.

---

## 🏛️ Architecture & Subagent Decomposition

The MVP was engineered across four independent subagent workstreams with clean separation of concerns and zero file collisions:

```
farm chain ai/
├── backend/                              # Subagent 2 (Ledger & API) & Subagent 3 (Price AI)
│   ├── data/
│   │   ├── cropMarketPrices.json         # Subagent 3: 14-crop seed dataset with regional prices
│   │   └── batches.json                  # Subagent 2: JSON ledger block persistence
│   ├── ledger/
│   │   └── hashChain.js                  # Subagent 2: SHA-256 hash-chain engine & verifyChain()
│   ├── routes/
│   │   └── batchRoutes.js                # Subagent 2: POST /batch, POST /batch/:id/transfer, GET /batch/:id
│   ├── services/
│   │   └── priceSuggestion/
│   │       ├── priceService.js           # Subagent 3: Statistical average and benchmark calculator
│   │       └── routes.js                 # Subagent 3: GET /price-suggestion/:crop
│   ├── tests/
│   │   ├── ledger.test.js                # Subagent 2: 16-assertion hash-chain & tamper detection tests
│   │   └── e2e_demo_flow.test.js         # Integration: 8-step end-to-end full demo flow test
│   └── server.js                         # Subagent 2: Express HTTP API server (Port 5001)
│
└── frontend/                             # Subagent 1 (UI) & Subagent 4 (Damage Detection AI)
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx                # Subagent 1: Portal switcher & global batch selector
    │   │   └── DamageCheck/              # Subagent 4: Teachable Machine / TF.js Produce Classifier
    │   │       ├── DamageCheck.jsx       # Subagent 4: Computer vision inference & auto 20% discount
    │   │       ├── DamageCheck.css       # Subagent 4: Futuristic neural scanner & preview styling
    │   │       └── README.md             # Subagent 4: TM model swap & payload contract documentation
    │   ├── pages/
    │   │   ├── FarmerPortal.jsx          # Subagent 1: Batch creation, AI price query, QR display
    │   │   ├── TransferPortal.jsx        # Subagent 1: Ownership handoff & quality inspection
    │   │   ├── ConsumerTracker.jsx       # Subagent 1: Public /track/:batchId provenance timeline & tamper demo
    │   │   └── LedgerInspector.jsx       # Subagent 1: Cryptographic hash explorer & tamper simulator
    │   ├── services/
    │   │   └── api.js                    # Subagent 1: Frontend API client
    │   ├── App.jsx                       # Subagent 1: Deep linking & tab coordination
    │   ├── index.css                     # Subagent 1: Glassmorphism design system & emerald palette
    │   └── main.jsx                      # Subagent 1: React entry point
    └── vite.config.js                    # Vite dev server with proxy to backend (Port 5173)
```

---

## 🚀 Quickstart & Running the App

### 1. Start the Backend API & Ledger (Port 5001)
```powershell
cd backend
node server.js
```
The server will run at `http://localhost:5001`.
- Health check: `http://localhost:5001/api/health`
- Price Suggestion: `http://localhost:5001/api/price-suggestion/strawberries`
- Batches API: `http://localhost:5001/api/batches`

### 2. Start the Frontend React UI (Port 5173)
```powershell
cd frontend
npm.cmd run dev
```
The interface will be live at `http://localhost:5173`.

---

## 🧪 Verification & Automated Tests

### Hash-chain Tamper Detection Unit Tests
Runs 16 cryptographic assertions validating genesis block creation, sequential block linking, SHA-256 recalculation, and automatic tamper detection on altered fields or broken hashes:
```powershell
cd backend
node tests/ledger.test.js
```

### Full End-to-End Primary Demo Flow Test
Exercises the complete lifecycle from health check to batch minting, AI price benchmarking, transfer, AI damage classification with 20% discount, consumer provenance verification, and simulated cyber-tamper attack:
```powershell
cd backend
node tests/e2e_demo_flow.test.js
```

---

## 🎯 Primary Demo Flow Walkthrough

1. **Farmer Portal (`/`)**:
   - Select a crop (e.g. *Strawberries*).
   - Click **"Re-check AI"** ➔ The statistical price engine analyzes market transactions and suggests `$4.25/kg`.
   - Click **"Apply $4.25"** and submit the form with **"Mint Genesis Block & Generate QR"**.
   - The ledger creates **Block #0** with `previousHash: "0000...0000"`, stores it, and renders a high-resolution QR code encoding the batch URL.

2. **Custody Transfer & Quality Check**:
   - Switch to the **Transfer Custody** tab.
   - Under the **AI Quality & Damage Classifier**, click the one-click sample **"Bruised / Damaged Strawberries"** (or upload any produce photo).
   - The neural network scanner activates, detecting tissue damage with 94% confidence.
   - The **-20% automated price adjustment** is calculated: `$4.25 ➔ $3.40/kg`.
   - Click **"Sign & Append Transfer Block to Ledger"**.
   - The backend cryptographically seals **Block #1** containing the damage flag and new adjusted price.

3. **Public Consumer Provenance Tracker (`/track/:batchId`)**:
   - Consumers scanning the QR code or visiting this view see the **Verified Consumer Passport**.
   - The timeline shows the entire journey: from harvest farm to cold logistics and supermarket shelf, displaying the exact timestamp, custodian, and recorded price.
   - A green badge affirms: **"CRYPTOGRAPHICALLY VERIFIED PROVENANCE CHAIN"**.

4. **Tamper Attack Demonstration**:
   - Click **"Simulate Tamper Attack"** on the consumer page or in the **Ledger Inspector**.
   - The system modifies historical block data without recomputing the SHA-256 hash.
   - The integrity engine instantly triggers an alarm: **"🚨 SECURITY ALERT: LEDGER DATA INTEGRITY COMPROMISED!"** pinpointing the exact tampered block.
   - Click **"Restore Ledger Integrity"** to return the chain to a verified state.
