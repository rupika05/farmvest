"""
Model Training Engine for FarmChain AI
Trains 3 specialized models (Farmer, Intermediary, Retailer),
evaluates Linear, Random Forest, and Gradient Boosting candidates,
computes statistically sound quantile bounds (P10, P50, P90),
and registers versioned model packages.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any, Optional, Callable

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor

from ml.training.validation import clean_and_filter_valid_data, validate_dataset
from ml.training.preprocessing import FeaturePipeline
from ml.training.evaluation import calculate_metrics, extract_feature_importance

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
REGISTRY_PATH = os.path.join(MODELS_DIR, "model_registry.json")

# In-memory training status tracker
training_state = {
    "is_training": False,
    "current_step": "Idle",
    "progress_percentage": 0,
    "latest_version": None,
    "error": None,
    "details": None
}


def update_status(step: str, pct: int, details: Optional[Dict[str, Any]] = None, error: Optional[str] = None):
    global training_state
    training_state["current_step"] = step
    training_state["progress_percentage"] = pct
    if details:
        training_state["details"] = details
    if error:
        training_state["error"] = error
        training_state["is_training"] = False


def get_training_status() -> Dict[str, Any]:
    return training_state


def get_model_registry() -> Dict[str, Any]:
    os.makedirs(MODELS_DIR, exist_ok=True)
    if not os.path.exists(REGISTRY_PATH):
        initial = {"active_version": None, "models": []}
        with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
            json.dump(initial, f, indent=2)
        return initial
    try:
        with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"active_version": None, "models": []}


def save_model_registry(registry: Dict[str, Any]):
    os.makedirs(MODELS_DIR, exist_ok=True)
    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2)


def generate_next_version(registry: Dict[str, Any]) -> str:
    models = registry.get("models", [])
    if not models:
        return "v1.0"
    versions = [m["version_id"] for m in models if "version_id" in m]
    nums = []
    for v in versions:
        try:
            val = float(v.replace("v", ""))
            nums.append(val)
        except Exception:
            pass
    if nums:
        next_val = round(max(nums) + 0.1, 1)
        return f"v{next_val:.1f}"
    return f"v{len(models) + 1}.0"


def train_models_pipeline(
    dataset_path: str,
    dataset_id: str,
    dataset_name: str,
    algorithm_choice: str = "auto"
) -> Dict[str, Any]:
    """
    Executes the full ML training workflow:
    Validation -> Preprocessing -> 3 Stage Model Training -> Evaluation -> Versioning.
    """
    global training_state
    training_state["is_training"] = True
    training_state["error"] = None

    try:
        update_status("Preparing data...", 5)
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset file not found at: {dataset_path}")

        df = pd.read_csv(dataset_path)
        update_status("Validating dataset...", 15)

        val_report = validate_dataset(df, dataset_name)
        if val_report["valid_rows"] < 15:
            raise ValueError(
                f"Insufficient valid data ({val_report['valid_rows']} valid rows). "
                "Minimum 15 valid rows required for ML model training."
            )

        clean_df, dropped = clean_and_filter_valid_data(df)
        total_samples = len(clean_df)

        update_status("Preprocessing & Feature Engineering...", 25)
        pipeline = FeaturePipeline()
        pipeline.fit(clean_df)
        X = pipeline.transform(clean_df)

        targets = {
            "farmerToIntermediary": clean_df["farmer_to_intermediary_price"].values,
            "intermediaryToRetailer": clean_df["intermediary_to_retailer_price"].values,
            "retailerToConsumer": clean_df["retailer_to_consumer_price"].values
        }

        # Train / Validation / Test split (70% train, 15% val, 15% test)
        indices = np.arange(total_samples)
        train_idx, temp_idx = train_test_split(indices, test_size=0.30, random_state=42)
        val_idx, test_idx = train_test_split(temp_idx, test_size=0.50, random_state=42)

        X_train, y_train_dict = X.iloc[train_idx], {k: v[train_idx] for k, v in targets.items()}
        X_val, y_val_dict = X.iloc[val_idx], {k: v[val_idx] for k, v in targets.items()}
        X_test, y_test_dict = X.iloc[test_idx], {k: v[test_idx] for k, v in targets.items()}

        stage_models: Dict[str, Any] = {}
        stage_metrics: Dict[str, Any] = {}
        stage_factors: Dict[str, Any] = {}
        stage_quantiles: Dict[str, Any] = {}
        stage_names_chosen: Dict[str, str] = {}

        stages_config = [
            ("farmerToIntermediary", "Farmer → Intermediary model", 40),
            ("intermediaryToRetailer", "Intermediary → Retailer model", 60),
            ("retailerToConsumer", "Retailer → Consumer model", 80)
        ]

        for stage_key, stage_label, pct in stages_config:
            update_status(f"Training {stage_label}...", pct)

            y_tr = y_train_dict[stage_key]
            y_v = y_val_dict[stage_key]
            y_te = y_test_dict[stage_key]

            # Candidate models
            candidates = {
                "GradientBoosting": GradientBoostingRegressor(n_estimators=120, learning_rate=0.08, max_depth=4, random_state=42),
                "RandomForest": RandomForestRegressor(n_estimators=100, max_depth=10, min_samples_split=2, random_state=42),
                "LinearRegression": Ridge(alpha=10.0, random_state=42)
            }

            best_name = None
            best_model = None
            best_val_rmse = float("inf")

            if algorithm_choice != "auto":
                # User specified exact model
                mapping = {
                    "random_forest": "RandomForest",
                    "gradient_boosting": "GradientBoosting",
                    "linear_regression": "LinearRegression"
                }
                selected = mapping.get(algorithm_choice.lower(), "GradientBoosting")
                cand = candidates[selected]
                cand.fit(X_train, y_tr)
                best_name = selected
                best_model = cand
            else:
                # Compare candidates and pick model with lowest validation RMSE
                for c_name, c_model in candidates.items():
                    c_model.fit(X_train, y_tr)
                    val_pred = c_model.predict(X_val)
                    m = calculate_metrics(y_v, val_pred)
                    val_rmse = m["rmse"]
                    if val_rmse < best_val_rmse:
                        best_val_rmse = val_rmse
                        best_name = c_name
                        best_model = c_model

            # Evaluate on test set
            test_pred = best_model.predict(X_test)
            metrics = calculate_metrics(y_te, test_pred)

            # Compute residual quantiles for statistically robust Lower (P10) & Upper (P90) bounds
            val_pred = best_model.predict(X_val)
            residuals = y_v - val_pred  # actual - predicted
            # Empirical 10th and 90th percentiles of error
            p10_delta = float(np.percentile(residuals, 10))
            p90_delta = float(np.percentile(residuals, 90))

            # Ensure bounds provide meaningful span (at least 5% of mean price)
            mean_p = float(np.mean(y_tr))
            min_spread = max(1.0, mean_p * 0.04)
            if (p90_delta - p10_delta) < min_spread:
                p10_delta = -min_spread / 2
                p90_delta = min_spread / 2

            stage_quantiles[stage_key] = {
                "p10_delta": round(p10_delta, 2),
                "p90_delta": round(p90_delta, 2)
            }

            # Top feature importances
            factors = extract_feature_importance(best_model, pipeline.feature_names, top_n=5)

            stage_models[stage_key] = best_model
            stage_metrics[stage_key] = metrics
            stage_factors[stage_key] = factors
            stage_names_chosen[stage_key] = best_name

        update_status("Evaluating & Finalizing Model Package...", 90)

        # Versioning
        registry = get_model_registry()
        version_id = generate_next_version(registry)
        version_dir = os.path.join(MODELS_DIR, version_id)
        os.makedirs(version_dir, exist_ok=True)

        # Save artifacts
        joblib.dump(pipeline, os.path.join(version_dir, "pipeline.joblib"))
        for s_key, m_obj in stage_models.items():
            joblib.dump(m_obj, os.path.join(version_dir, f"{s_key}_model.joblib"))

        with open(os.path.join(version_dir, "quantiles.json"), "w", encoding="utf-8") as f:
            json.dump(stage_quantiles, f, indent=2)

        with open(os.path.join(version_dir, "factors.json"), "w", encoding="utf-8") as f:
            json.dump(stage_factors, f, indent=2)

        # Build Version Metadata
        model_version_entry = {
            "version_id": version_id,
            "dataset_id": dataset_id,
            "dataset_name": dataset_name,
            "trained_at": datetime.now().isoformat(),
            "model_type": stage_names_chosen.get("farmerToIntermediary", "RandomForest"),
            "models_by_stage": stage_names_chosen,
            "is_active": False,  # Safety: Only activated upon admin explicit action
            "metrics": stage_metrics,
            "top_factors": stage_factors,
            "features_used": pipeline.feature_names,
            "training_rows": len(train_idx),
            "validation_rows": len(val_idx),
            "test_rows": len(test_idx),
            "total_rows": total_samples,
            "training_status": "COMPLETED"
        }

        registry["models"].insert(0, model_version_entry)
        save_model_registry(registry)

        update_status("Completed", 100, details=model_version_entry)
        training_state["is_training"] = False
        training_state["latest_version"] = version_id

        return model_version_entry

    except Exception as e:
        update_status("Failed", 0, error=str(e))
        training_state["is_training"] = False
        raise e
