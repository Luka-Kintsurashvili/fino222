"""Export the trained logistic regression as plain JSON (coefficients + standardization
params), so the Deno edge function can run it as pure arithmetic — no ML runtime needed
in production. See train.py for how this model was fit.

Run: python export_model.py (after train.py)
"""

import json

import joblib

saved = joblib.load("artifacts_models.joblib")
logit = saved["logit"]
columns = saved["X_columns"]

scaler = logit[0]
lr = logit[-1]

model = {
    "features": columns,
    "mean": scaler.mean_.tolist(),
    "scale": scaler.scale_.tolist(),
    "coef": lr.coef_[0].tolist(),
    "intercept": float(lr.intercept_[0]),
    "trained_on": "credit_applicants.csv (Mtsvane Bank course kit), n=6000",
}

with open("artifacts/credit_risk_lr.json", "w") as f:
    json.dump(model, f, indent=2)

print(f"Exported {len(columns)} features to artifacts/credit_risk_lr.json")
