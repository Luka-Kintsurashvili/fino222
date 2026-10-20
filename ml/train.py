"""AI1 credit risk — baseline, logistic regression, gradient boosting.

Mirrors the official Mtsvane Bank course notebook (NB1_credit_scoring.ipynb)
methodology: same excluded columns, same split, same GBM hyperparameters —
so our numbers are directly comparable to the reference notebook's.

Run: python train.py
"""

import json
import warnings

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")

TARGET = "default_12m"
NOT_ALLOWED = [
    "applicant_id",                # identifier, not a signal
    "collection_calls_after_loan", # leakage: only known after the loan is already issued
    "gender",                      # protected attribute — held out for the fairness check only
]


def load_data():
    loans = pd.read_csv("data/credit_applicants.csv")
    features = [c for c in loans.columns if c not in NOT_ALLOWED + [TARGET]]
    X = pd.get_dummies(loans[features], drop_first=True).astype(float)
    X = X.fillna(X.median())
    y = loans[TARGET]
    return loans, X, y, features


def train_all(X_train, y_train):
    baseline_rate = y_train.mean()

    logit = make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000))
    logit.fit(X_train, y_train)

    gbm = HistGradientBoostingClassifier(
        max_depth=3, learning_rate=0.05, max_iter=200, min_samples_leaf=40, random_state=0
    )
    gbm.fit(X_train, y_train)

    return baseline_rate, logit, gbm


def evaluate(name, y_test, p):
    auc = roc_auc_score(y_test, p)
    gini = 2 * auc - 1
    flag = "  <-- suspiciously high, check for leakage" if auc > 0.95 else ""
    print(f"{name:28s} AUC={auc:.3f}  Gini={gini:.3f}{flag}")
    return auc, gini


def fairness_check(loans, test_index, approved):
    people = loans.loc[test_index]
    report = pd.DataFrame({
        "approval_rate_pct": approved.groupby(people.gender).mean() * 100,
        "real_default_rate_pct": people.groupby("gender")[TARGET].mean() * 100,
    }).round(1)
    print("\nFairness check (gender was never a model feature, used only to group here):")
    print(report.to_string())
    return report


def main():
    loans, X, y, features = load_data()
    print(f"Loaded {len(loans)} applicants, {len(features)} features, "
          f"default rate {y.mean():.3%}\n")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=1, stratify=y
    )
    print(f"train={X_train.shape[0]}  test={X_test.shape[0]}\n")

    baseline_rate, logit, gbm = train_all(X_train, y_train)

    print("--- Model comparison (held-out test set) ---")
    baseline_p = np.full(len(y_test), baseline_rate)
    evaluate("baseline (predict base rate)", y_test, baseline_p)
    logit_p = logit.predict_proba(X_test)[:, 1]
    evaluate("logistic regression (production)", y_test, logit_p)
    gbm_p = gbm.predict_proba(X_test)[:, 1]
    evaluate("gradient boosting (offline only)", y_test, gbm_p)

    # Cut-off from the loan policy: PD < 6% auto-approve, 6-12% review, > 12% decline.
    approved = pd.Series(logit_p < 0.12, index=X_test.index)
    print(f"\nApproval rate at the 12% PD policy cut-off: {approved.mean():.1%}")

    fairness_check(loans, X_test.index, approved)

    results = {
        "n_applicants": len(loans),
        "default_rate": round(float(y.mean()), 4),
        "n_features": len(features),
        "baseline_auc": round(roc_auc_score(y_test, baseline_p), 4),
        "logistic_regression_auc": round(roc_auc_score(y_test, logit_p), 4),
        "gradient_boosting_auc": round(roc_auc_score(y_test, gbm_p), 4),
        "approval_rate_at_12pct_cutoff": round(float(approved.mean()), 4),
    }
    with open("artifacts_metrics.json", "w") as f:
        json.dump(results, f, indent=2)
    print("\nSaved metrics to artifacts_metrics.json")

    # Hand off the fitted objects to export_model.py without retraining.
    import joblib
    joblib.dump({"logit": logit, "gbm": gbm, "X_columns": list(X.columns)}, "artifacts_models.joblib")


if __name__ == "__main__":
    main()
