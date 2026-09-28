"""
Robust Dataset Validation for FarmChain AI Historical Datasets
Checks schema, data types, value boundaries, nulls, duplicates, and outliers.
Provides transparent rejection reports without silent drops.
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple

REQUIRED_COLUMNS = [
    "crop",
    "mandi_price",
    "quality_grade",
    "quantity_kg",
    "farmer_to_intermediary_price",
    "intermediary_to_retailer_price",
    "retailer_to_consumer_price"
]

OPTIONAL_COLUMNS = [
    "mandi_min_price",
    "mandi_max_price",
    "location",
    "market_location",
    "season",
    "supply_level",
    "demand_level",
    "transport_cost_per_kg",
    "storage_cost_per_kg",
    "handling_cost_per_kg",
    "days_in_storage",
    "weather_condition",
    "transaction_date",
    "distance_km",
    "arrival_quantity",
    "market_arrival_volume"
]

VALID_QUALITY_GRADES = {"GRADE A", "GRADE B", "GRADE C", "REJECTED", "A", "B", "C"}
VALID_LEVELS = {"HIGH", "MEDIUM", "LOW"}
MINIMUM_TRAINING_ROWS = 25


def validate_dataset(df: pd.DataFrame, dataset_name: str = "Uploaded Dataset") -> Dict[str, Any]:
    """
    Validates a pandas DataFrame against FarmChain AI schema and quality rules.
    Returns a comprehensive validation report dictionary.
    """
    total_rows = len(df)
    errors: List[Dict[str, Any]] = []
    warnings: List[str] = []

    if total_rows == 0:
        return {
            "dataset_name": dataset_name,
            "total_rows": 0,
            "valid_rows": 0,
            "invalid_rows": 0,
            "duplicate_rows": 0,
            "missing_value_summary": {},
            "column_status": {},
            "quality_score": 0.0,
            "validation_status": "INVALID",
            "errors": [{"row_index": 0, "column": "FILE", "value": None, "reason": "The uploaded dataset is empty."}],
            "warnings": ["File contains 0 records."],
            "preview_rows": []
        }

    # Normalize column names to lowercase and strip whitespace
    df.columns = [str(c).strip().lower() for c in df.columns]

    # 1. Required Columns Check
    missing_required_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    column_status = {}
    for col in REQUIRED_COLUMNS:
        column_status[col] = "PRESENT" if col in df.columns else "MISSING_REQUIRED"
    for col in OPTIONAL_COLUMNS:
        column_status[col] = "PRESENT" if col in df.columns else "OPTIONAL_ABSENT"

    if missing_required_cols:
        return {
            "dataset_name": dataset_name,
            "total_rows": total_rows,
            "valid_rows": 0,
            "invalid_rows": total_rows,
            "duplicate_rows": 0,
            "missing_value_summary": {c: int(df[c].isna().sum()) for c in df.columns},
            "column_status": column_status,
            "quality_score": 0.0,
            "validation_status": "INVALID",
            "errors": [{
                "row_index": 0,
                "column": "SCHEMA",
                "value": str(missing_required_cols),
                "reason": f"Required columns missing: {', '.join(missing_required_cols)}"
            }],
            "warnings": [f"Missing required columns: {', '.join(missing_required_cols)}"],
            "preview_rows": df.head(10).to_dict(orient="records")
        }

    # 2. Check dataset size
    if total_rows < MINIMUM_TRAINING_ROWS:
        warnings.append(
            f"Dataset has only {total_rows} rows. Minimum {MINIMUM_TRAINING_ROWS} rows recommended for robust ML training."
        )

    # 3. Duplicate check
    duplicate_mask = df.duplicated(keep="first")
    duplicate_count = int(duplicate_mask.sum())
    if duplicate_count > 0:
        warnings.append(f"Found {duplicate_count} duplicate row(s). Duplicates will be deduplicated during preprocessing.")

    # 4. Missing values summary
    missing_summary = {c: int(df[c].isna().sum()) for c in df.columns}
    total_missing_in_required = sum(missing_summary.get(c, 0) for c in REQUIRED_COLUMNS)
    if total_missing_in_required > 0:
        warnings.append(f"Found {total_missing_in_required} missing values across required columns.")

    # 5. Row-by-Row Quality Validation
    invalid_row_indices = set()

    for idx, row in df.iterrows():
        # Check required fields non-null
        for col in REQUIRED_COLUMNS:
            val = row[col]
            if pd.isna(val) or str(val).strip() == "":
                invalid_row_indices.add(idx)
                if len(errors) < 50:
                    errors.append({
                        "row_index": int(idx) + 1,
                        "column": col,
                        "value": str(val),
                        "reason": f"Required field '{col}' is empty"
                    })

        # Numeric validations
        numeric_positive_checks = [
            ("mandi_price", "Market price must be positive (> 0)"),
            ("quantity_kg", "Quantity must be positive (> 0)"),
            ("farmer_to_intermediary_price", "Farmer price must be positive (> 0)"),
            ("intermediary_to_retailer_price", "Intermediary price must be positive (> 0)"),
            ("retailer_to_consumer_price", "Retailer price must be positive (> 0)")
        ]
        for col, err_msg in numeric_positive_checks:
            val = row[col]
            try:
                num = float(val)
                if num <= 0 or np.isnan(num):
                    invalid_row_indices.add(idx)
                    if len(errors) < 50:
                        errors.append({
                            "row_index": int(idx) + 1,
                            "column": col,
                            "value": val,
                            "reason": err_msg
                        })
            except (ValueError, TypeError):
                invalid_row_indices.add(idx)
                if len(errors) < 50:
                    errors.append({
                        "row_index": int(idx) + 1,
                        "column": col,
                        "value": val,
                        "reason": f"Non-numeric value in column '{col}'"
                    })

        # Non-negative logistics checks
        for col in ["transport_cost_per_kg", "storage_cost_per_kg", "handling_cost_per_kg", "days_in_storage"]:
            if col in row and not pd.isna(row[col]):
                try:
                    num = float(row[col])
                    if num < 0:
                        invalid_row_indices.add(idx)
                        if len(errors) < 50:
                            errors.append({
                                "row_index": int(idx) + 1,
                                "column": col,
                                "value": row[col],
                                "reason": f"'{col}' cannot be negative"
                            })
                except (ValueError, TypeError):
                    invalid_row_indices.add(idx)
                    if len(errors) < 50:
                        errors.append({
                            "row_index": int(idx) + 1,
                            "column": col,
                            "value": row[col],
                            "reason": f"Non-numeric value in '{col}'"
                        })

        # Quality Grade Check
        grade = str(row["quality_grade"]).strip().upper()
        if grade not in VALID_QUALITY_GRADES:
            invalid_row_indices.add(idx)
            if len(errors) < 50:
                errors.append({
                    "row_index": int(idx) + 1,
                    "column": "quality_grade",
                    "value": row["quality_grade"],
                    "reason": f"Invalid quality grade '{row['quality_grade']}'. Must be Grade A, Grade B, Grade C, or Rejected."
                })

        # Economic sanity outlier check (stage prices should not be 10x higher or 10x lower than mandi)
        try:
            m_price = float(row["mandi_price"])
            f_price = float(row["farmer_to_intermediary_price"])
            r_price = float(row["retailer_to_consumer_price"])
            if f_price < (0.1 * m_price) or f_price > (5.0 * m_price):
                warnings.append(f"Row {int(idx)+1}: Extreme price variance detected (Farmer: ₹{f_price}, Mandi: ₹{m_price}).")
            if r_price < f_price:
                invalid_row_indices.add(idx)
                if len(errors) < 50:
                    errors.append({
                        "row_index": int(idx) + 1,
                        "column": "retailer_to_consumer_price",
                        "value": r_price,
                        "reason": f"Retailer price (₹{r_price}) cannot be lower than Farmer acquisition price (₹{f_price})."
                    })
        except Exception:
            pass

    invalid_rows_count = len(invalid_row_indices)
    valid_rows_count = total_rows - invalid_rows_count
    quality_score = round(max(0.0, (valid_rows_count / total_rows) * 100.0), 1)

    if invalid_rows_count == 0:
        validation_status = "VALID"
    elif quality_score >= 80.0:
        validation_status = "NEEDS_REVIEW"
        warnings.insert(0, f"{invalid_rows_count} row(s) contain validation errors and will be excluded from training.")
    else:
        validation_status = "INVALID"
        warnings.insert(0, f"Excessive invalid rows ({invalid_rows_count}/{total_rows}). Dataset cannot be approved in current state.")

    # Generate preview of first 20 rows
    preview = df.head(20).fillna("").to_dict(orient="records")

    return {
        "dataset_name": dataset_name,
        "total_rows": total_rows,
        "valid_rows": valid_rows_count,
        "invalid_rows": invalid_rows_count,
        "duplicate_rows": duplicate_count,
        "missing_value_summary": missing_summary,
        "column_status": column_status,
        "quality_score": quality_score,
        "validation_status": validation_status,
        "errors": errors[:50],  # cap at 50 errors for UX clarity
        "warnings": warnings[:15],
        "preview_rows": preview
    }


def clean_and_filter_valid_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
    """
    Cleans DataFrame, removes duplicates, drops rows violating essential rules,
    and returns sanitized DataFrame along with dropped row count.
    """
    df = df.copy()
    df.columns = [str(c).strip().lower() for c in df.columns]
    initial_count = len(df)

    # Deduplicate
    df = df.drop_duplicates()

    # Drop missing required columns
    df = df.dropna(subset=REQUIRED_COLUMNS)

    # Numeric positive filters
    for col in ["mandi_price", "quantity_kg", "farmer_to_intermediary_price", "intermediary_to_retailer_price", "retailer_to_consumer_price"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
        df = df[df[col] > 0]

    # Non-negative logistics filters
    for col in ["transport_cost_per_kg", "storage_cost_per_kg", "handling_cost_per_kg", "days_in_storage"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
            df = df[df[col] >= 0]

    # Standardize quality grade
    df["quality_grade"] = df["quality_grade"].astype(str).str.strip().str.upper()
    grade_map = {
        "GRADE A": "Grade A", "A": "Grade A",
        "GRADE B": "Grade B", "B": "Grade B",
        "GRADE C": "Grade C", "C": "Grade C",
        "REJECTED": "Rejected"
    }
    df["quality_grade"] = df["quality_grade"].map(grade_map).fillna("Grade B")

    # Economic sanity: retailer price >= farmer price
    df = df[df["retailer_to_consumer_price"] >= df["farmer_to_intermediary_price"]]

    dropped_count = initial_count - len(df)
    return df, dropped_count
