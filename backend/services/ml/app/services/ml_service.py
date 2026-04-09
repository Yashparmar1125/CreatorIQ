import hashlib
import numpy as np
import serpapi
from sklearn.linear_model import LinearRegression
import httpx
import shap
import lime
import lime.lime_tabular
from typing import Any
import logging
import io
import base64
import matplotlib
matplotlib.use('Agg') # Run in background without window
import matplotlib.pyplot as plt

logger = logging.getLogger(__name__)

from app.core.config import settings


def _hash_score(s: str) -> float:
    h = hashlib.sha256(s.encode("utf-8")).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


class MlService:
    def __init__(self) -> None:
        self.client = serpapi.Client(api_key=settings.serpapi_key)

    def health(self) -> dict:
        return {"data": {"service": "ml", "status": "ok"}, "meta": {"request_id": "local-dev"}}

    async def trend_forecast(self, payload: dict[str, Any]) -> dict:
        topic = str(payload.get("topic") or "")
        
        try:
            # 1. Fetch Google Trends Timeseries from SerpApi
            results = self.client.search({
                "engine": "google_trends",
                "q": topic,
                "data_type": "TIMESERIES"
            })
            
            interest_over_time = results.get("interest_over_time", {})
            timeline_data = interest_over_time.get("timeline_data", [])
            print(f"[MlService] SerpApi returned {len(timeline_data)} data points for '{topic}'")
            
            if not timeline_data:
                # Fallback to hash-based if no data
                base = float(payload.get("tvs_score") or 50.0)
                bump = _hash_score(topic) * 5.0
                return {
                    "data": {
                        "forecast_tvs": min(100.0, base + bump),
                        "confidence": 0.5 + (_hash_score(topic + "c") * 0.49),
                        "predictions": {"2_day": base + 1, "3_day": base + 2, "5_day": base + 3},
                        "metrics": {
                            "growth": bump / 100.0,
                            "acceleration": True,
                            "moving_average": base,
                            "peak_distance": 0.2,
                            "explainability": {
                                "shap_base_value": base,
                                "shap_impact_score": 12.0 + (_hash_score(topic + "s") * 15.0),
                                "lime_contributions": [{"feature": "Day", "weight": 15.0 + (_hash_score(topic + "l") * 20.0)}],
                                "model_type": "Synthetic-LBR"
                            }
                        }
                    },
                    "meta": {"request_id": "local-dev"}
                }

            # 2. Extract X and y for Linear Regression
            # y is the value, X is the index
            y = np.array([float(t["values"][0]["extracted_value"]) for t in timeline_data])
            X = np.arange(len(y)).reshape(-1, 1)
            
            # 3. Train Model
            model = LinearRegression()
            model.fit(X, y)
            
            # 4. Predict for 2, 3, 5 days
            future_days = [2, 3, 5]
            X_future = np.array([len(y) + d for d in future_days]).reshape(-1, 1)
            preds = model.predict(X_future)
            
            # 5. Explainability (SHAP & LIME)
            # Global Explanation: SHAP
            explainer_shap = shap.Explainer(model.predict, X)
            shap_values = explainer_shap(X)
            
            # Local Explanation: LIME (for the most recent point)
            explainer_lime = lime.lime_tabular.LimeTabularExplainer(
                training_data=X,
                feature_names=['Day'],
                class_names=['Interest Score'],
                mode='regression'
            )
            
            # Explain the last observed point
            instance_idx = -1 
            instance_to_explain = X[instance_idx]
            exp_lime = explainer_lime.explain_instance(
                data_row=instance_to_explain.reshape(-1),
                predict_fn=model.predict,
                num_features=1
            )
            
            # Extract numerical data for frontend rendering
            # SHAP: Average absolute impact of 'Day'
            avg_shap_impact = float(np.mean(np.abs(shap_values.values)))
            
            # LIME: Feature contribution for the current prediction
            lime_contributions = [
                {"feature": str(f), "weight": float(w)} 
                for f, w in exp_lime.as_list()
            ]

            # Generate SHAP Plot Image
            shap_plot_base64 = ""
            try:
                plt.figure(figsize=(8, 4))
                # Create a summary plot for the 'Day' feature
                # We use the shap_values object we already calculated
                shap.summary_plot(shap_values, X, feature_names=['Day'], show=False)
                
                buf = io.BytesIO()
                plt.savefig(buf, format='png', bbox_inches='tight', transparent=True, dpi=100)
                plt.close()
                shap_plot_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
            except Exception as plot_err:
                print(f"Plotting error: {plot_err}")

            # 6. Calculate Metrics (from notebook)
            n = len(y) - 1
            growth_last = (y[n] - y[n-1]) / (y[n-1] or 1)
            growth_prev = (y[n-2] - y[n-3]) / (y[n-3] or 1)
            acceleration = growth_last > growth_prev
            moving_average = np.mean(y[-3:])
            peak_distance = 1 - (y[n] / 100.0)
            
            # 6. OpenRouter Refinement
            # We use OpenRouter to validate the trend based on the calculated stats
            prompt = f"""
            Analyze this trend intelligence for the topic: '{topic}'
            Stats:
            - Current Value: {y[n]}
            - Growth (Last): {growth_last:.2%}
            - Acceleration: {'Growing' if acceleration else 'Steady/Decelerating'}
            - 3-period Moving Average: {moving_average:.2f}
            - Peak Distance: {peak_distance:.2f}
            - Predictions (2,3,5 days): {preds.tolist()}
            
            Provide a refinement score (0-100) and a brief expert analysis.
            Format: SCORE: <0-100> | ANALYSIS: <text>
            """
            
            refined_score = 50.0
            expert_analysis = "Standard prediction model applied."
            
            try:
                async with httpx.AsyncClient(timeout=10.0) as http_client:
                    response = await http_client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.openrouter_api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "google/gemini-2.0-flash-001",
                            "messages": [{"role": "user", "content": prompt}]
                        }
                    )
                    if response.status_code == 200:
                        content = response.json()["choices"][0]["message"]["content"]
                        if "SCORE:" in content and "ANALYSIS:" in content:
                            score_part = content.split("SCORE:")[1].split("|")[0].strip()
                            refined_score = float(score_part)
                            expert_analysis = content.split("ANALYSIS:")[1].strip()
                            print(f"[MlService] OpenRouter refined score for '{topic}': {refined_score}")
            except Exception as e:
                print(f"OpenRouter error: {e}")

            return {
                "data": {
                    "forecast_tvs": refined_score,
                    "confidence": 0.8 if bool(acceleration) else 0.6,
                    "predictions": {
                        "2_day": float(preds[0]),
                        "3_day": float(preds[1]),
                        "5_day": float(preds[2])
                    },
                    "metrics": {
                        "growth": float(growth_last),
                        "acceleration": bool(acceleration),
                        "moving_average": float(moving_average),
                        "peak_distance": float(peak_distance),
                        "explainability": {
                            "shap_base_value": float(explainer_shap.expected_value) if hasattr(explainer_shap, 'expected_value') else 0.0,
                            "shap_impact_score": avg_shap_impact,
                            "lime_contributions": lime_contributions,
                            "shap_plot_base64": shap_plot_base64,
                            "model_type": "LinearRegression"
                        }
                    },
                    "expert_analysis": expert_analysis
                },
                "meta": {"request_id": "local-dev"}
            }

        except Exception as e:
            print(f"ML Processing error: {e}")
            return {
                "error": str(e),
                "data": {
                    "forecast_tvs": 50.0, 
                    "confidence": 0.5,
                    "metrics": {
                        "growth": 0.0,
                        "acceleration": False,
                        "moving_average": 50.0,
                        "peak_distance": 0.5,
                        "explainability": {
                            "shap_base_value": 50.0,
                            "shap_impact_score": 0.0,
                            "lime_contributions": [],
                            "model_type": "Error-Fallback"
                        }
                    }
                },
                "meta": {"request_id": "local-dev-error"}
            }

    def score_idea(self, payload: dict[str, Any]) -> dict:
        topic = str(payload.get("topic") or "")
        perf = 50.0 + _hash_score(topic + "idea") * 50.0
        return {"data": {"performance_score": round(perf, 2)}, "meta": {"request_id": "local-dev"}}

    def score_title_ctr(self, payload: dict[str, Any]) -> dict:
        titles = payload.get("titles") or []
        key = "|".join(str(t) for t in titles) if titles else "empty"
        ctr = 0.02 + _hash_score(key) * 0.08
        return {"data": {"predicted_ctr": round(ctr, 4)}, "meta": {"request_id": "local-dev"}}

    def internal_health(self) -> dict:
        return {"data": {"service": "ml", "internal_status": "ok"}, "meta": {"request_id": "local-dev"}}
