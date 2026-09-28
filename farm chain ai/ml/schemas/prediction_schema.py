"""
Pydantic schemas for FarmChain AI Price Recommendation Engine
"""
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class DatasetValidationError(BaseModel):
    row_index: int
    column: str
    value: Any
    reason: str


class DatasetValidationResult(BaseModel):
    dataset_name: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    duplicate_rows: int
    missing_value_summary: Dict[str, int]
    column_status: Dict[str, str]
    quality_score: float
    validation_status: str  # "VALID", "INVALID", "NEEDS_REVIEW"
    errors: List[DatasetValidationError] = []
    warnings: List[str] = []
    preview_rows: List[Dict[str, Any]] = []


class DatasetMetadata(BaseModel):
    id: str
    name: str
    description: str
    uploaded_at: str
    file_path: str
    total_rows: int
    valid_rows: int
    columns_count: int
    status: str  # "UPLOADED", "APPROVED", "REJECTED"
    quality_score: float
    is_demo: bool = False
    validation_summary: Optional[Dict[str, Any]] = None


class TrainRequest(BaseModel):
    dataset_id: str
    algorithm: Optional[str] = "auto"  # "auto", "random_forest", "gradient_boosting", "linear_regression"
    test_size: Optional[float] = 0.2


class StageMetrics(BaseModel):
    mae: float
    rmse: float
    r2: float
    mape: Optional[float] = None
    sample_count: int


class StageModelReport(BaseModel):
    stage: str  # "farmer_to_intermediary", "intermediary_to_retailer", "retailer_to_consumer"
    model_type: str
    metrics: StageMetrics
    top_factors: List[Dict[str, Any]] = []


class ModelVersion(BaseModel):
    version_id: str
    dataset_id: str
    dataset_name: str
    trained_at: str
    model_type: str
    is_active: bool = False
    metrics: Dict[str, StageMetrics]
    features_used: List[str]
    training_rows: int
    validation_rows: int
    test_rows: int
    training_status: str = "COMPLETED"


class TrainingStatusResponse(BaseModel):
    is_training: bool
    current_step: str
    progress_percentage: int
    latest_version: Optional[str] = None
    error: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class PricePredictionInput(BaseModel):
    crop: str
    mandi_price: float = Field(..., gt=0, description="Current Mandi Market Reference Price in INR/kg")
    mandi_min_price: Optional[float] = None
    mandi_max_price: Optional[float] = None
    quality_grade: str = Field(default="Grade A", description="Grade A, Grade B, Grade C, or Rejected")
    quantity_kg: float = Field(default=100.0, gt=0)
    location: Optional[str] = "Tamil Nadu"
    market_location: Optional[str] = "Koyambedu Wholesale Market, Chennai"
    season: Optional[str] = "Rabi"
    supply_level: Optional[str] = "Medium"  # High, Medium, Low
    demand_level: Optional[str] = "Medium"  # High, Medium, Low
    transport_cost_per_kg: Optional[float] = 1.5
    storage_cost_per_kg: Optional[float] = 0.5
    handling_cost_per_kg: Optional[float] = 0.5
    days_in_storage: Optional[int] = 1
    weather_condition: Optional[str] = "Normal"
    distance_km: Optional[float] = 50.0
    transaction_date: Optional[str] = None


class StagePriceRange(BaseModel):
    lower: float
    expected: float
    upper: float


class FactorExplanation(BaseModel):
    factor: str
    influence: str  # "High influence", "Medium influence", "Low influence"
    weight: float


class ModelInfo(BaseModel):
    version: str
    trainedAt: str
    modelType: str
    datasetName: str
    isFallback: bool = False


class PriceRecommendationResponse(BaseModel):
    crop: str
    qualityGrade: str
    marketReferencePrice: float
    currency: str = "INR"
    unit: str = "kg"
    recommendations: Dict[str, StagePriceRange]
    model: ModelInfo
    explanation: Dict[str, Any]
    status: str = "success"
    disclaimer: str = (
        "AI recommendations are statistical estimates based on approved historical datasets "
        "and active market indicators. They are non-binding reference guides for free negotiation."
    )
