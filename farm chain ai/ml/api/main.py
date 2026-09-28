"""
FarmChain AI — FastAPI ML Recommendation Engine
Production service for dataset management, model training, versioning, and price prediction.
"""
import os
import shutil
import uuid
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware

from ml.schemas.prediction_schema import (
    PricePredictionInput,
    PriceRecommendationResponse,
    StagePriceRange,
    ModelInfo,
    TrainRequest,
    TrainingStatusResponse
)
from ml.training.validation import validate_dataset, clean_and_filter_valid_data
from ml.training.train import (
    train_models_pipeline,
    get_training_status,
    get_model_registry,
    save_model_registry,
    MODELS_DIR
)

app = FastAPI(
    title="FarmChain AI Fair Price Recommendation Engine",
    description="ML-powered price range recommendation service across Farmer, Intermediary, and Retailer stages.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
DATASETS_REGISTRY_PATH = os.path.join(DATA_DIR, "datasets_registry.json")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# Model cache in memory
_model_cache: Dict[str, Any] = {
    "version": None,
    "pipeline": None,
    "farmer_model": None,
    "intermediary_model": None,
    "retailer_model": None,
    "quantiles": None,
    "factors": None
}


def load_datasets_registry() -> Dict[str, Any]:
    if not os.path.exists(DATASETS_REGISTRY_PATH):
        init = {"datasets": []}
        save_datasets_registry(init)
        return init
    try:
        with open(DATASETS_REGISTRY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"datasets": []}


def save_datasets_registry(data: Dict[str, Any]):
    with open(DATASETS_REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def get_active_model_artifacts() -> Optional[Dict[str, Any]]:
    global _model_cache
    registry = get_model_registry()
    active_version = registry.get("active_version")

    if not active_version:
        return None

    if _model_cache["version"] == active_version and _model_cache["pipeline"] is not None:
        return _model_cache

    version_dir = os.path.join(MODELS_DIR, active_version)
    if not os.path.exists(version_dir):
        return None

    try:
        pipeline = joblib.load(os.path.join(version_dir, "pipeline.joblib"))
        f_model = joblib.load(os.path.join(version_dir, "farmerToIntermediary_model.joblib"))
        i_model = joblib.load(os.path.join(version_dir, "intermediaryToRetailer_model.joblib"))
        r_model = joblib.load(os.path.join(version_dir, "retailerToConsumer_model.joblib"))

        with open(os.path.join(version_dir, "quantiles.json"), "r", encoding="utf-8") as f:
            quantiles = json.load(f)

        with open(os.path.join(version_dir, "factors.json"), "r", encoding="utf-8") as f:
            factors = json.load(f)

        # Find model metadata from registry
        meta = next((m for m in registry.get("models", []) if m["version_id"] == active_version), {})

        _model_cache = {
            "version": active_version,
            "pipeline": pipeline,
            "farmer_model": f_model,
            "intermediary_model": i_model,
            "retailer_model": r_model,
            "quantiles": quantiles,
            "factors": factors,
            "meta": meta
        }
        return _model_cache
    except Exception as e:
        print(f"Error loading model artifacts for {active_version}: {e}")
        return None


# -------------------------------------------------------------
# 1. Health Endpoint
# -------------------------------------------------------------
@app.get("/health")
def health():
    registry = get_model_registry()
    d_registry = load_datasets_registry()
    return {
        "status": "healthy",
        "service": "FarmChain AI ML Recommendation Engine",
        "active_model": registry.get("active_version"),
        "total_model_versions": len(registry.get("models", [])),
        "total_datasets": len(d_registry.get("datasets", [])),
        "timestamp": datetime.now().isoformat()
    }


# -------------------------------------------------------------
# 2. Dataset Management Endpoints
# -------------------------------------------------------------
@app.get("/datasets")
def list_datasets():
    return load_datasets_registry()


@app.post("/datasets/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form("")
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV datasets are currently supported.")

    dataset_id = f"ds-{uuid.uuid4().hex[:8]}"
    file_path = os.path.join(UPLOADS_DIR, f"{dataset_id}_{file.filename}")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    # Run comprehensive validation
    val_result = validate_dataset(df, name)

    # Register dataset metadata
    d_registry = load_datasets_registry()
    dataset_entry = {
        "id": dataset_id,
        "name": name,
        "description": description or "Historical Mandi Dataset uploaded by Admin",
        "uploaded_at": datetime.now().isoformat(),
        "file_path": file_path,
        "total_rows": val_result["total_rows"],
        "valid_rows": val_result["valid_rows"],
        "invalid_rows": val_result["invalid_rows"],
        "columns_count": len(df.columns),
        "status": "PENDING_APPROVAL" if val_result["validation_status"] != "INVALID" else "REJECTED",
        "quality_score": val_result["quality_score"],
        "is_demo": False,
        "validation_summary": val_result
    }

    d_registry["datasets"].insert(0, dataset_entry)
    save_datasets_registry(d_registry)

    return {
        "message": "Dataset uploaded and analyzed successfully.",
        "dataset": dataset_entry,
        "validation": val_result
    }


@app.get("/datasets/{dataset_id}/preview")
def get_dataset_preview(dataset_id: str):
    d_registry = load_datasets_registry()
    dataset = next((d for d in d_registry["datasets"] if d["id"] == dataset_id), None)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    file_path = dataset["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Dataset file missing on disk")

    try:
        df = pd.read_csv(file_path)
        val_result = validate_dataset(df, dataset["name"])
        return {
            "dataset": dataset,
            "validation": val_result,
            "preview_rows": df.head(20).fillna("").to_dict(orient="records"),
            "columns": list(df.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading dataset preview: {str(e)}")


@app.post("/datasets/{dataset_id}/approve")
def approve_dataset(dataset_id: str):
    d_registry = load_datasets_registry()
    for d in d_registry["datasets"]:
        if d["id"] == dataset_id:
            if d.get("validation_summary", {}).get("validation_status") == "INVALID":
                raise HTTPException(status_code=400, detail="Cannot approve an INVALID dataset. Review validation errors.")
            d["status"] = "APPROVED"
            save_datasets_registry(d_registry)
            return {"message": f"Dataset '{d['name']}' approved for model training.", "dataset": d}

    raise HTTPException(status_code=404, detail="Dataset not found")


@app.post("/datasets/{dataset_id}/reject")
def reject_dataset(dataset_id: str):
    d_registry = load_datasets_registry()
    for d in d_registry["datasets"]:
        if d["id"] == dataset_id:
            d["status"] = "REJECTED"
            save_datasets_registry(d_registry)
            return {"message": f"Dataset '{d['name']}' marked as rejected.", "dataset": d}

    raise HTTPException(status_code=404, detail="Dataset not found")


@app.delete("/datasets/{dataset_id}")
def delete_dataset(dataset_id: str):
    d_registry = load_datasets_registry()
    dataset = next((d for d in d_registry["datasets"] if d["id"] == dataset_id), None)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if dataset.get("is_demo"):
        raise HTTPException(status_code=400, detail="Cannot delete default demo baseline dataset.")

    # Remove file
    if os.path.exists(dataset["file_path"]):
        try:
            os.remove(dataset["file_path"])
        except Exception:
            pass

    d_registry["datasets"] = [d for d in d_registry["datasets"] if d["id"] != dataset_id]
    save_datasets_registry(d_registry)
    return {"message": f"Dataset '{dataset['name']}' deleted successfully."}


# -------------------------------------------------------------
# 3. Model Training Endpoints
# -------------------------------------------------------------
@app.post("/train")
def train_model(request: TrainRequest, background_tasks: BackgroundTasks):
    current_status = get_training_status()
    if current_status["is_training"]:
        raise HTTPException(status_code=409, detail="A training session is already in progress.")

    d_registry = load_datasets_registry()
    dataset = next((d for d in d_registry["datasets"] if d["id"] == request.dataset_id), None)
    if not dataset:
        raise HTTPException(status_code=404, detail="Selected dataset not found.")

    if dataset["status"] != "APPROVED":
        raise HTTPException(status_code=400, detail="Only APPROVED datasets can be used for model training.")

    file_path = dataset["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Dataset file missing on disk.")

    background_tasks.add_task(
        train_models_pipeline,
        file_path,
        dataset["id"],
        dataset["name"],
        request.algorithm or "auto"
    )

    return {
        "message": f"Model training initiated for dataset '{dataset['name']}'.",
        "status": "PROCESSING",
        "algorithm": request.algorithm or "auto"
    }


@app.get("/training-status", response_model=TrainingStatusResponse)
def training_status():
    return get_training_status()


# -------------------------------------------------------------
# 4. Model Versioning & Activation Endpoints
# -------------------------------------------------------------
@app.get("/models")
def list_models():
    return get_model_registry()


@app.post("/models/{version_id}/activate")
def activate_model(version_id: str):
    global _model_cache
    registry = get_model_registry()
    found = False

    for m in registry.get("models", []):
        if m["version_id"] == version_id:
            m["is_active"] = True
            found = True
        else:
            m["is_active"] = False

    if not found:
        raise HTTPException(status_code=404, detail=f"Model version '{version_id}' not found.")

    registry["active_version"] = version_id
    save_model_registry(registry)

    # Invalidate cache so active model is reloaded
    _model_cache["version"] = None

    return {
        "message": f"Model version {version_id} is now ACTIVE for production recommendations.",
        "active_version": version_id
    }


# -------------------------------------------------------------
# 5. Price Prediction Endpoint
# -------------------------------------------------------------
@app.post("/predict", response_model=PriceRecommendationResponse)
def predict_fair_price(input_data: PricePredictionInput):
    artifacts = get_active_model_artifacts()

    # Safety Guard: Check if active model exists
    if not artifacts:
        # Fallback Mode: Clean, transparently-labeled statistical APMC baseline
        m_price = input_data.mandi_price
        g_mult = {"Grade A": 1.15, "Grade B": 1.0, "Grade C": 0.80, "Rejected": 0.50}.get(input_data.quality_grade, 1.0)
        
        f_exp = round(m_price * 0.94 * g_mult, 1)
        f_low = round(f_exp * 0.94, 1)
        f_upp = round(f_exp * 1.06, 1)

        i_exp = round((f_exp + input_data.transport_cost_per_kg + input_data.storage_cost_per_kg) * 1.10, 1)
        i_low = round(i_exp * 0.94, 1)
        i_upp = round(i_exp * 1.07, 1)

        r_exp = round((i_exp + 1.5) * 1.16, 1)
        r_low = round(r_exp * 0.93, 1)
        r_upp = round(r_exp * 1.08, 1)

        return PriceRecommendationResponse(
            crop=input_data.crop,
            qualityGrade=input_data.quality_grade,
            marketReferencePrice=m_price,
            currency="INR",
            unit="kg",
            recommendations={
                "farmerToIntermediary": StagePriceRange(lower=f_low, expected=f_exp, upper=f_upp),
                "intermediaryToRetailer": StagePriceRange(lower=i_low, expected=i_exp, upper=i_upp),
                "retailerToConsumer": StagePriceRange(lower=r_low, expected=r_exp, upper=r_upp)
            },
            model=ModelInfo(
                version="APMC_REFERENCE_FALLBACK",
                trainedAt=datetime.now().isoformat(),
                modelType="Baseline APMC Spread (No active ML model activated by Admin)",
                datasetName="APMC Mandi Default Benchmark",
                isFallback=True
            ),
            explanation={
                "topFactors": [
                    {"factor": "Current Mandi Reference", "impact": "High influence", "weight_pct": 55.0},
                    {"factor": "Produce Quality Grade", "impact": "High influence", "weight_pct": 30.0},
                    {"factor": "Logistics & Transport", "impact": "Low influence", "weight_pct": 15.0}
                ],
                "note": "Recommendation is operating in baseline APMC mode. Admin has not yet activated a trained ML model."
            },
            status="fallback_apmc",
            disclaimer="NOTICE: Baseline estimate based on current APMC market benchmark. Train and activate an ML model in the Admin Dashboard for statistical machine-learned recommendations."
        )

    # ML Inference with active trained model
    pipeline = artifacts["pipeline"]
    f_model = artifacts["farmer_model"]
    i_model = artifacts["intermediary_model"]
    r_model = artifacts["retailer_model"]
    quantiles = artifacts["quantiles"]
    factors = artifacts["factors"]
    meta = artifacts.get("meta", {})

    input_dict = input_data.model_dump()
    X = pipeline.transform_single(input_dict)

    # 1. Farmer to Intermediary prediction
    f_raw = float(f_model.predict(X)[0])
    f_q = quantiles.get("farmerToIntermediary", {"p10_delta": -1.5, "p90_delta": 1.5})
    f_low = max(round(0.1 * input_data.mandi_price, 1), round(f_raw + f_q["p10_delta"], 1))
    f_exp = round(f_raw, 1)
    f_upp = max(f_exp + 0.5, round(f_raw + f_q["p90_delta"], 1))

    # 2. Intermediary to Retailer prediction
    i_raw = float(i_model.predict(X)[0])
    i_q = quantiles.get("intermediaryToRetailer", {"p10_delta": -2.0, "p90_delta": 2.0})
    i_exp = round(max(f_exp + 1.0, i_raw), 1)
    i_low = max(round(f_low + 0.5, 1), round(i_exp + i_q["p10_delta"], 1))
    i_upp = max(round(i_exp + 0.5, 1), round(i_exp + i_q["p90_delta"], 1))

    # 3. Retailer to Consumer prediction
    r_raw = float(r_model.predict(X)[0])
    r_q = quantiles.get("retailerToConsumer", {"p10_delta": -2.5, "p90_delta": 2.5})
    r_exp = round(max(i_exp + 1.5, r_raw), 1)
    r_low = max(round(i_low + 1.0, 1), round(r_exp + r_q["p10_delta"], 1))
    r_upp = max(round(r_exp + 0.5, 1), round(r_exp + r_q["p90_delta"], 1))

    # Explanations from the trained model
    top_factors = factors.get("farmerToIntermediary", [
        {"factor": "Current APMC Mandi Price", "impact": "High influence", "weight_pct": 45.0},
        {"factor": "Produce Quality Grade", "impact": "High influence", "weight_pct": 30.0}
    ])

    return PriceRecommendationResponse(
        crop=input_data.crop,
        qualityGrade=input_data.quality_grade,
        marketReferencePrice=input_data.mandi_price,
        currency="INR",
        unit="kg",
        recommendations={
            "farmerToIntermediary": StagePriceRange(lower=f_low, expected=f_exp, upper=f_upp),
            "intermediaryToRetailer": StagePriceRange(lower=i_low, expected=i_exp, upper=i_upp),
            "retailerToConsumer": StagePriceRange(lower=r_low, expected=r_exp, upper=r_upp)
        },
        model=ModelInfo(
            version=meta.get("version_id", "v1.0"),
            trainedAt=meta.get("trained_at", datetime.now().isoformat()),
            modelType=meta.get("model_type", "RandomForest"),
            datasetName=meta.get("dataset_name", "Approved Mandi Dataset"),
            isFallback=False
        ),
        explanation={
            "topFactors": top_factors,
            "sampleCount": meta.get("total_rows", 0),
            "r2Score": meta.get("metrics", {}).get("farmerToIntermediary", {}).get("r2", 0.0),
            "mae": meta.get("metrics", {}).get("farmerToIntermediary", {}).get("mae", 0.0)
        },
        status="success",
        disclaimer=(
            "AI price recommendations are statistical estimates computed by the trained "
            f"model ({meta.get('version_id', 'v1.0')}) using approved historical market transactions "
            "and active APMC reference data. Actual transaction prices are subject to free negotiation."
        )
    )
