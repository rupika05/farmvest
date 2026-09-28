"""
Model Evaluation and Metrics Utilities
Calculates MAE, RMSE, R², MAPE, and extracts feature importances with transparent explanations.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

FEATURE_DISPLAY_MAP = {
    "mandi_price": "Current APMC Mandi Price",
    "mandi_price_spread": "Mandi Price Range Spread",
    "market_position": "Wholesale Market Position",
    "quality_score": "Produce Quality Grade",
    "demand_score": "Current Market Demand",
    "supply_score": "Regional Produce Supply",
    "demand_supply_ratio": "Demand-to-Supply Ratio",
    "log_quantity": "Produce Batch Quantity",
    "total_logistics_cost": "Transport & Handling Costs",
    "storage_holding_impact": "Cold Storage Duration",
    "month": "Seasonal Harvest Month",
    "day_of_week": "Mandi Trading Day"
}


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Computes comprehensive regression metrics."""
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))

    # Safe MAPE calculation
    non_zero = y_true != 0
    if np.any(non_zero):
        mape = float(np.mean(np.abs((y_true[non_zero] - y_pred[non_zero]) / y_true[non_zero])) * 100.0)
    else:
        mape = 0.0

    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "r2": round(max(-1.0, min(1.0, r2)), 4),
        "mape": round(mape, 2),
        "sample_count": int(len(y_true))
    }


def extract_feature_importance(model: Any, feature_names: List[str], top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Extracts top influencing factors from trained model (tree-based or linear).
    Assigns human-readable names and categorical influence levels.
    """
    importances = np.zeros(len(feature_names))

    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    elif hasattr(model, "coef_"):
        # Absolute linear regression coefficients
        coef = np.abs(model.coef_)
        total = np.sum(coef)
        importances = coef / (total if total > 0 else 1.0)
    else:
        importances = np.ones(len(feature_names)) / len(feature_names)

    # Aggregate crop one-hot dummies into general 'Commodity Type' factor
    aggregated: Dict[str, float] = {}
    for feat, imp in zip(feature_names, importances):
        if feat.startswith("crop_"):
            aggregated["Commodity Type"] = aggregated.get("Commodity Type", 0.0) + float(imp)
        else:
            display_name = FEATURE_DISPLAY_MAP.get(feat, feat.replace("_", " ").title())
            aggregated[display_name] = aggregated.get(display_name, 0.0) + float(imp)

    # Sort descending
    sorted_factors = sorted(aggregated.items(), key=lambda x: x[1], reverse=True)

    result = []
    for name, weight in sorted_factors[:top_n]:
        pct = round(weight * 100.0, 1)
        if pct >= 20.0:
            influence = "High influence"
        elif pct >= 8.0:
            influence = "Medium influence"
        else:
            influence = "Low influence"

        result.append({
            "factor": name,
            "impact": influence,
            "weight_pct": pct
        })

    return result
