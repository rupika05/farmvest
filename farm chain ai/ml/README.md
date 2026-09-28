# FarmChain AI — ML Fair Price Recommendation Engine

This module implements a production-grade, statistical **AI Fair Price Recommendation Engine** for the **FarmChain AI** ecosystem. It provides non-binding, data-driven fair price ranges across three supply-chain stages:

1. **Farmer → Intermediary** (Farm gate harvest handoff)
2. **Intermediary → Retailer** (APMC wholesale mandi distribution)
3. **Retailer → Consumer** (Retail store / Kirana purchase)

---

## 🏗️ Architecture

```
                  ┌────────────────────────────────────────┐
                  │       React Admin & Farmer UI          │
                  │        (Vite - localhost:5173)         │
                  └──────────────────┬─────────────────────┘
                                     │ (HTTP / JSON)
                                     ▼
                  ┌────────────────────────────────────────┐
                  │          Node.js Express API           │
                  │            (localhost:5001)            │
                  │   Routes: /api/ml/* & /api/batches/*   │
                  └──────────────────┬─────────────────────┘
                                     │ (Internal Microservice Proxy)
                                     ▼
                  ┌────────────────────────────────────────┐
                  │          Python FastAPI ML             │
                  │            (localhost:8000)            │
                  │  scikit-learn Models & Quantile Ranges │
                  └────────────────────────────────────────┘
```

---

## 📄 Dataset Schema & Feature Definition

### Required Input Features
* `crop`: Standardized commodity name (e.g., `Tomato`, `Potato`, `Onion`, `Rice`, etc.)
* `mandi_price`: Official APMC wholesale market reference price (₹/kg)
* `quality_grade`: Produce quality inspection status (`Grade A`, `Grade B`, `Grade C`, or `Rejected`)
* `quantity_kg`: Batch volume in kilograms

### Prediction Targets (No Data Leakage)
* `farmer_to_intermediary_price`: Fair transaction price between producer and trader (₹/kg)
* `intermediary_to_retailer_price`: Fair wholesale price between distributor and retailer (₹/kg)
* `retailer_to_consumer_price`: Fair consumer shelf price (₹/kg)

### Optional / Environmental Inputs
* `mandi_min_price`, `mandi_max_price`: Regional mandi spread bounds
* `transport_cost_per_kg`: Freight transit cost (₹/kg)
* `storage_cost_per_kg`: Cold storage holding cost per day (₹/kg)
* `handling_cost_per_kg`: Mandi loading/unloading cess (₹/kg)
* `days_in_storage`: Transit holding duration (days)
* `demand_level`: Market demand indicator (`High`, `Medium`, `Low`)
* `supply_level`: Regional arrival inflow indicator (`High`, `Medium`, `Low`)
* `location`, `market_location`: Geographic mandi locations
* `transaction_date`: Historical date (`YYYY-MM-DD`)

---

## 🧪 Data Validation & Quality Audit

The validation pipeline ([`ml/training/validation.py`](file:///ml/training/validation.py)) executes row-by-row checks:
1. **Schema Check**: Verifies all required columns are present.
2. **Numeric Boundaries**: Confirms prices and quantities are strictly positive ($> 0$).
3. **Logistics Bounds**: Confirms transport and handling costs are non-negative ($\ge 0$).
4. **Economic Logic**: Enforces that retailer prices exceed farmer acquisition prices.
5. **Quality Grades**: Maps and standardizes grades to `Grade A`, `Grade B`, `Grade C`, or `Rejected`.
6. **Deduplication**: Automatically detects and flags duplicate rows.
7. **Transparent Audit**: Generates an itemized rejection report detailing row index, column, value, and rejection reason without silent drops.

---

## 🤖 Model Training & Comparison Workflow

Models are trained via [`ml/training/train.py`](file:///ml/training/train.py):
1. **Train / Validation / Test Split**: 70% training, 15% validation, 15% out-of-sample test.
2. **Candidate Algorithm Evaluation**:
   * **Gradient Boosting Regressor** (`GradientBoostingRegressor`)
   * **Random Forest Regressor** (`RandomForestRegressor`)
   * **Regularized Linear Regression** (`Ridge(alpha=10.0)`)
3. **Evaluation Metrics**:
   * Mean Absolute Error (**MAE** in ₹/kg)
   * Root Mean Squared Error (**RMSE** in ₹/kg)
   * Coefficient of Determination (**$R^2$**)
   * Mean Absolute Percentage Error (**MAPE**)
4. **Model Selection**: The pipeline automatically selects the algorithm with the lowest validation RMSE.

---

## 📈 Price Range Methodology (Statistical Quantile Bounds)

Unlike simplistic $\pm 5\%$ hardcoded margins, the engine computes genuine empirical error distributions:
* **Expected Price ($P_{50}$)**: Model point prediction $\hat{y}$
* **Lower Bound ($P_{10}$)**: $\max(0.1 \times \text{mandi}, \hat{y} + q_{10}(\text{residuals}))$
* **Upper Bound ($P_{90}$)**: $\hat{y} + q_{90}(\text{residuals})$

This guarantees that:
1. The price range reflects actual historical variance and market noise.
2. The range is sensitive to quality grades and market demand.
3. $\text{Lower Bound} \le \text{Expected} \le \text{Upper Bound}$ holds under all conditions.

---

## 🔐 Model Versioning & Production Activation

* Every training cycle generates an immutable version directory (`ml/models/v1.0/`, `v1.1/`, etc.) containing:
  * `pipeline.joblib`: Fitted feature pipeline and encoders
  * `farmerToIntermediary_model.joblib`: Specialized farmer model
  * `intermediaryToRetailer_model.joblib`: Specialized wholesale model
  * `retailerToConsumer_model.joblib`: Specialized retail model
  * `quantiles.json`: Empirical residual bounds
  * `factors.json`: Top influencing factors
* **Explicit Admin Activation**: A newly trained model **never** replaces production automatically. The administrator must explicitly review test metrics and click **"Activate Version for Production"**.

---

## 🚀 Running the Services Locally

### 1. Python ML Microservice (Port 8000)
```powershell
# From project root:
py -m pip install -r ml/requirements.txt
py -m uvicorn ml.api.main:app --host 0.0.0.0 --port 8000
```

### 2. Node.js Express Gateway (Port 5001)
```powershell
cd backend
npm test
node server.js
```

### 3. React Frontend (Port 5173)
```powershell
cd frontend
npm run dev
```

---

## ⚖️ Limitations & Disclaimers

* **Statistical Estimate Only**: AI recommendations are computational estimates based on historical datasets and active APMC benchmarks.
* **No Price Guarantee**: The system never claims that AI guarantees a profit or mandates a transaction price.
* **Free Negotiation**: Farmers, intermediaries, and retailers retain complete autonomy to negotiate and finalize prices freely.
