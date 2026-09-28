"""
Reusable Preprocessing and Feature Engineering Pipeline
Handles categorical encodings, derived features, and prevents target leakage.
Can be saved and loaded alongside trained models.
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from datetime import datetime

QUALITY_MAP = {
    "Grade A": 3,
    "Grade B": 2,
    "Grade C": 1,
    "Rejected": 0
}

LEVEL_MAP = {
    "High": 3,
    "Medium": 2,
    "Low": 1
}

# The target columns to never include in X
LEAKAGE_COLUMNS = [
    "farmer_to_intermediary_price",
    "intermediary_to_retailer_price",
    "retailer_to_consumer_price",
    "farmer_price",
    "intermediary_price",
    "retailer_price"
]


class FeaturePipeline:
    def __init__(self):
        self.known_crops: List[str] = []
        self.known_locations: List[str] = []
        self.feature_names: List[str] = []
        self.is_fitted: bool = False

    def _engineer_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        # Initialize defaults for optional columns to guarantee Series behavior
        defaults = {
            "mandi_min_price": np.nan,
            "mandi_max_price": np.nan,
            "transport_cost_per_kg": 1.5,
            "storage_cost_per_kg": 0.5,
            "handling_cost_per_kg": 0.5,
            "days_in_storage": 1,
            "quantity_kg": 100.0,
            "quality_grade": "Grade B",
            "supply_level": "Medium",
            "demand_level": "Medium"
        }
        for k, v in defaults.items():
            if k not in df.columns:
                df[k] = v

        # Mandi spread and market position
        mandi = pd.to_numeric(df["mandi_price"], errors="coerce").fillna(30.0)
        
        m_min = pd.to_numeric(df["mandi_min_price"], errors="coerce")
        m_min = m_min.fillna(mandi * 0.9)

        m_max = pd.to_numeric(df["mandi_max_price"], errors="coerce")
        m_max = m_max.fillna(mandi * 1.1)

        df["mandi_price_spread"] = (m_max - m_min).clip(lower=0.5)
        spread = df["mandi_price_spread"]
        df["market_position"] = ((mandi - m_min) / spread.replace(0, 1.0)).clip(0.0, 1.0)

        # Logistics costs
        transport = pd.to_numeric(df["transport_cost_per_kg"], errors="coerce").fillna(1.5)
        storage = pd.to_numeric(df["storage_cost_per_kg"], errors="coerce").fillna(0.5)
        handling = pd.to_numeric(df["handling_cost_per_kg"], errors="coerce").fillna(0.5)
        days = pd.to_numeric(df["days_in_storage"], errors="coerce").fillna(1)

        df["total_logistics_cost"] = transport + storage + handling
        df["storage_holding_impact"] = (storage * days).clip(lower=0.0)

        # Quantity scaling
        qty = pd.to_numeric(df["quantity_kg"], errors="coerce").fillna(100.0)
        df["log_quantity"] = np.log1p(qty.clip(lower=1.0))

        # Dates / Seasonality
        if "transaction_date" in df.columns and not df["transaction_date"].isna().all():
            dates = pd.to_datetime(df["transaction_date"], errors="coerce")
            df["month"] = dates.dt.month.fillna(datetime.now().month)
            df["day_of_week"] = dates.dt.dayofweek.fillna(datetime.now().weekday())
        else:
            df["month"] = datetime.now().month
            df["day_of_week"] = datetime.now().weekday()

        # Quality & Ordinal levels
        df["quality_score"] = df["quality_grade"].map(QUALITY_MAP).fillna(2)
        df["supply_score"] = df["supply_level"].map(LEVEL_MAP).fillna(2)
        df["demand_score"] = df["demand_level"].map(LEVEL_MAP).fillna(2)
        df["demand_supply_ratio"] = (df["demand_score"] / df["supply_score"].replace(0, 1.0)).round(2)

        return df

    def fit(self, df: pd.DataFrame):
        """Fits categorical levels and determines exact feature set."""
        df_clean = df.copy()
        self.known_crops = sorted(list(df_clean["crop"].dropna().astype(str).unique()))
        
        engineered = self._engineer_derived_features(df_clean)

        # One-hot encode crop
        crop_dummies = pd.get_dummies(engineered["crop"], prefix="crop", dtype=float)
        
        # Select base numerical features
        base_num_cols = [
            "mandi_price",
            "mandi_price_spread",
            "market_position",
            "total_logistics_cost",
            "storage_holding_impact",
            "log_quantity",
            "month",
            "day_of_week",
            "quality_score",
            "supply_score",
            "demand_score",
            "demand_supply_ratio"
        ]

        feature_cols = base_num_cols + list(crop_dummies.columns)
        self.feature_names = feature_cols
        self.is_fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transforms input DataFrame to exact feature matrix X, preventing leakage."""
        if not self.is_fitted:
            raise ValueError("FeaturePipeline must be fitted before calling transform().")

        engineered = self._engineer_derived_features(df)

        # Base numericals
        base_df = pd.DataFrame(index=engineered.index)
        for col in [
            "mandi_price", "mandi_price_spread", "market_position",
            "total_logistics_cost", "storage_holding_impact", "log_quantity",
            "month", "day_of_week", "quality_score", "supply_score",
            "demand_score", "demand_supply_ratio"
        ]:
            base_df[col] = engineered[col].astype(float)

        # Align crop dummy variables
        for crop in self.known_crops:
            col_name = f"crop_{crop}"
            base_df[col_name] = (engineered["crop"].astype(str) == str(crop)).astype(float)

        # Guarantee exact column order
        for col in self.feature_names:
            if col not in base_df.columns:
                base_df[col] = 0.0

        X = base_df[self.feature_names].copy()

        # Sanity check: Ensure no leakage columns in X
        for leak in LEAKAGE_COLUMNS:
            if leak in X.columns:
                X = X.drop(columns=[leak])

        return X

    def transform_single(self, input_dict: Dict[str, Any]) -> pd.DataFrame:
        """Helper to transform a single prediction request into feature vector."""
        df = pd.DataFrame([input_dict])
        return self.transform(df)

    def to_dict(self) -> Dict[str, Any]:
        """Serializes pipeline state for joblib persistence."""
        return {
            "known_crops": self.known_crops,
            "feature_names": self.feature_names,
            "is_fitted": self.is_fitted
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "FeaturePipeline":
        pipe = cls()
        pipe.known_crops = data.get("known_crops", [])
        pipe.feature_names = data.get("feature_names", [])
        pipe.is_fitted = data.get("is_fitted", False)
        return pipe
