"""
Generates clearly-labeled DEMO historical market transactions for initial ML testing.
LABEL: DEMO DATA — NOT REAL MARKET DATA
"""
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

CROPS_BASE = {
    "Tomato": {"mandi": 32.0, "min": 26.0, "max": 38.0, "transport": 1.8},
    "Potato": {"mandi": 22.0, "min": 18.0, "max": 27.0, "transport": 1.2},
    "Onion": {"mandi": 28.0, "min": 22.0, "max": 35.0, "transport": 1.5},
    "Chilli": {"mandi": 85.0, "min": 70.0, "max": 105.0, "transport": 3.0},
    "Carrot": {"mandi": 40.0, "min": 32.0, "max": 48.0, "transport": 2.0},
    "Brinjal": {"mandi": 25.0, "min": 20.0, "max": 32.0, "transport": 1.4},
    "Cabbage": {"mandi": 18.0, "min": 14.0, "max": 23.0, "transport": 1.5},
    "Rice": {"mandi": 42.0, "min": 36.0, "max": 49.0, "transport": 1.0},
    "Wheat": {"mandi": 26.0, "min": 22.0, "max": 31.0, "transport": 1.0},
    "Cotton": {"mandi": 72.0, "min": 60.0, "max": 84.0, "transport": 2.5}
}

GRADES = ["Grade A", "Grade B", "Grade C"]
GRADE_WEIGHTS = [0.45, 0.40, 0.15]
GRADE_PREMIUM = {"Grade A": 1.15, "Grade B": 1.0, "Grade C": 0.82}

LEVELS = ["High", "Medium", "Low"]
SEASONS = ["Kharif", "Rabi", "Zaid"]
LOCATIONS = [
    ("Dindigul, Tamil Nadu", "Oddanchatram Vegetable Market"),
    ("Kolar, Karnataka", "Kolar APMC Mandi"),
    ("Nashik, Maharashtra", "Lasalgaon Mandi"),
    ("Erode, Tamil Nadu", "Erode Agricultural Producer Market"),
    ("Chittoor, Andhra Pradesh", "Madanapalle Tomato Market")
]

np.random.seed(42)
rows = []
base_date = datetime(2026, 1, 1)

for i in range(350):
    crop_name = np.random.choice(list(CROPS_BASE.keys()))
    crop_info = CROPS_BASE[crop_name]

    # Vary mandi price by ±12%
    mandi_price = round(float(np.random.normal(crop_info["mandi"], crop_info["mandi"] * 0.08)), 2)
    mandi_price = max(crop_info["min"] * 0.85, min(crop_info["max"] * 1.15, mandi_price))
    mandi_min = round(mandi_price * 0.85, 2)
    mandi_max = round(mandi_price * 1.15, 2)

    grade = np.random.choice(GRADES, p=GRADE_WEIGHTS)
    g_mult = GRADE_PREMIUM[grade]

    qty = round(float(np.random.uniform(50.0, 2500.0)), 1)
    loc, mandi_loc = LOCATIONS[np.random.randint(len(LOCATIONS))]
    season = np.random.choice(SEASONS)
    supply = np.random.choice(LEVELS, p=[0.25, 0.50, 0.25])
    demand = np.random.choice(LEVELS, p=[0.30, 0.45, 0.25])

    # Logistics
    t_cost = round(float(crop_info["transport"] * np.random.uniform(0.8, 1.3)), 2)
    s_cost = round(float(np.random.uniform(0.3, 0.8)), 2)
    h_cost = round(float(np.random.uniform(0.4, 0.8)), 2)
    days_stored = int(np.random.randint(1, 8))
    weather = np.random.choice(["Normal", "Rainy", "Drought"], p=[0.8, 0.15, 0.05])

    tx_date = (base_date + timedelta(days=int(np.random.randint(0, 240)))).strftime("%Y-%m-%d")

    # Demand / Supply price influence
    demand_bonus = 1.06 if demand == "High" else (0.94 if demand == "Low" else 1.0)
    supply_bonus = 0.95 if supply == "High" else (1.05 if supply == "Low" else 1.0)
    market_mult = demand_bonus * supply_bonus

    # Realistic Economic Targets:
    # 1. Farmer to Intermediary: based on mandi price * grade * market condition
    farmer_price = round(mandi_price * 0.94 * g_mult * market_mult + np.random.normal(0, mandi_price * 0.02), 2)
    farmer_price = max(mandi_min * 0.75, farmer_price)

    # 2. Intermediary to Retailer: covers farmer price + logistics + intermediary margin (8-14%)
    inter_price = round((farmer_price + t_cost + (s_cost * days_stored) + h_cost) * 1.10 + np.random.normal(0, mandi_price * 0.02), 2)
    inter_price = max(farmer_price + 1.5, inter_price)

    # 3. Retailer to Consumer: covers intermediary price + last mile handling + retail margin (14-22%)
    retail_price = round((inter_price + 1.5) * 1.18 + np.random.normal(0, mandi_price * 0.02), 2)
    retail_price = max(inter_price + 2.0, retail_price)

    rows.append({
        "crop": crop_name,
        "mandi_price": mandi_price,
        "mandi_min_price": mandi_min,
        "mandi_max_price": mandi_max,
        "quality_grade": grade,
        "quantity_kg": qty,
        "location": loc,
        "market_location": mandi_loc,
        "season": season,
        "supply_level": supply,
        "demand_level": demand,
        "transport_cost_per_kg": t_cost,
        "storage_cost_per_kg": s_cost,
        "handling_cost_per_kg": h_cost,
        "days_in_storage": days_stored,
        "weather_condition": weather,
        "transaction_date": tx_date,
        "farmer_to_intermediary_price": farmer_price,
        "intermediary_to_retailer_price": inter_price,
        "retailer_to_consumer_price": retail_price,
        "distance_km": round(float(np.random.uniform(20.0, 220.0)), 1)
    })

df = pd.DataFrame(rows)
output_path = os.path.join(os.path.dirname(__file__), "sample_market_dataset.csv")
df.to_csv(output_path, index=False)
print(f"Generated {len(df)} rows to {output_path}")
