# Subagent 4: AI Produce Quality & Damage Classifier

## Overview
This module integrates client-side AI image classification for produce inspections (Fresh vs. Damaged) using TensorFlow.js / Teachable Machine patterns.

## Ledger Coordination Fields
When an inspection completes, the component calculates:
- `qualityStatus`: `'Fresh' | 'Damaged'`
- `damageConfidence`: number (0.0 to 1.0)
- `discountApplied`: `0.20` if Damaged, `0` if Fresh
- `adjustedPrice`: `round(originalPrice * 0.80)` if Damaged, else `originalPrice`
- `imagePreview`: string base64 / data URI for audit trail

These map directly to Subagent 2's `POST /api/batch/:id/transfer` payload schema:
```json
{
  "stage": "PROCESSING_AND_SORTING",
  "owner": "Cold Logistics Hub",
  "location": "Fresno, CA",
  "price": 4.25,
  "adjustedPrice": 3.40,
  "qualityStatus": "Damaged",
  "damageConfidence": 0.94,
  "discountApplied": 0.20,
  "notes": "Surface bruising detected; 20% markdown automatically enforced on ledger"
}
```

## Teachable Machine Model Swap Instructions
To connect your own trained Google Teachable Machine model URL:
1. Export model from [teachablemachine.withgoogle.com](https://teachablemachine.withgoogle.com/) as "TensorFlow.js -> Upload (shareable link)".
2. In `DamageCheck.jsx`, supply your model URL: `https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/`.
3. The component handles both live model inference and bundled deterministic produce samples for hackathon and offline evaluation.
