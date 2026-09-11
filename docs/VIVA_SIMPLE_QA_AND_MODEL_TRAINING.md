# CreatorIQ: Simple Viva Q&A and Model Training Guide

**Target Audience:** Viva Examiners, College Project Evaluators, and Fast Technical Interview Preparation  
**Focus Areas:** High-level project understanding, simple explanations of Prophet and Vector Embeddings, and an honest breakdown of Model Training, Datasets, and Optimization.

---

## Table of Contents
1. [Project Overview (Basic & Direct)](#1-project-overview-basic--direct)
2. [Prophet & Forecasting (Simple & Conversational)](#2-prophet--forecasting-simple--conversational)
3. [Vector Embeddings & Qdrant (Simple & Conversational)](#3-vector-embeddings--qdrant-simple--conversational)
4. [Data Collection & Scoring (Simple & Conversational)](#4-data-collection--scoring-simple--conversational)
5. [Quick 1-Minute Rapid Fire Cheatsheet](#5-quick-1-minute-rapid-fire-cheatsheet)
6. [Deep Dive on Model Training in CreatorIQ](#6-deep-dive-on-model-training-in-creatoriq)
   - [The Big Picture: How Models Learn in CreatorIQ](#61-the-big-picture-how-models-learn-in-creatoriq)
   - [How Prophet Is "Trained" / Fitted](#62-how-prophet-is-trained--fitted)
   - [The Dataset Used for Training](#63-the-dataset-used-for-training)
   - [Hyperparameters & Tuning](#64-hyperparameters--tuning)
   - [Training (Write Path) vs. Inference (Read Path)](#65-training-write-path-vs-inference-read-path)
   - [Embedding Model: Pre-trained vs. Fine-Tuned](#66-embedding-model-pre-trained-vs-fine-tuned)
   - [Viva Questions Specifically on Training & Optimization](#67-viva-questions-specifically-on-training--optimization)

---

# 1. Project Overview (Basic & Direct)

### Q1: What is CreatorIQ in simple words?
**Answer:**
> "CreatorIQ is an AI platform for YouTube creators. Instead of just showing past view counts, it predicts which topics will trend over the next 1 to 3 months using machine learning, and it uses AI (LLMs) to generate video titles, hooks, and content strategies personalized to a creator’s niche and audience."

### Q2: What is your tech stack?
**Answer:**
> - **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, and Recharts (for trend graphs).
> - **Backend:** Python 3.12 with FastAPI microservices (Auth, Trends, ML, Strategy, Channel).
> - **Databases:** PostgreSQL (core data), Redis (caching and rate limits), and Qdrant (vector database).
> - **AI & ML:** Meta Prophet (time-series forecasting), Sentence-Transformers `all-MiniLM-L6-v2` (vector embeddings), and OpenRouter / GPT-4o-mini / DeepSeek (LLM content strategy).

### Q3: Why did you divide the backend into microservices?
**Answer:**
> "Because the ML and time-series forecasting requires heavy libraries like Prophet, Pandas, and C++ compilers that take a lot of CPU and memory. By putting ML in its own microservice (`ciq-ml`), it doesn't slow down the main API or user login services."

---

# 2. Prophet & Forecasting (Simple & Conversational)

### Q4: What is Facebook/Meta Prophet, and what role does it play in this project?
**Answer:**
> "Prophet is an open-source library built by Meta for time-series forecasting. In our project, Prophet takes daily trend momentum scores from the past and projects where the trend will go over the next **7 days, 30 days, and 90 days** (1 week, 1 month, 3 months)."

### Q5: How does Prophet actually work inside?
**Answer:**
> "Prophet breaks down a time-series into three main pieces:
> 1. **Trend:** The overall direction (is it growing or dying?).
> 2. **Seasonality:** Recurring patterns (like weekly spikes on weekends when people watch more YouTube).
> 3. **Holidays/Events:** Sudden spikes from specific dates.
> 
> It adds these together ($y = \text{trend} + \text{seasonality} + \text{noise}$) to predict future points."

### Q6: What are the shaded bands around the prediction line in the chart?
**Answer:**
> "Those are the **95% Bayesian Credible Intervals** (`yhat_lower` and `yhat_upper`). They represent uncertainty. If the band is narrow, the model is confident. If the band is wide, it means the trend is volatile or unpredictable."

### Q7: What is the "Cold Start" problem, and what if a trend only has 2 or 3 days of data?
**Answer:**
> "Prophet needs at least 7 distinct days to make a proper prediction. If a new trend only has 2 or 3 days of data, our system generates a **calibrated synthetic prior trajectory** (a realistic 30-day baseline curve based on its current growth rate). This allows Prophet to fit properly without throwing an error."

### Q8: What happens if Prophet crashes or fails?
**Answer:**
> "We built a **fallback hierarchy**:
> - If Prophet fails $\to$ it automatically falls back to **Holt-Winters Exponential Smoothing**.
> - If that also fails $\to$ it falls back to a simple mathematical slope calculation.  
> This ensures the website never shows a broken screen or error to the user."

### Q9: How do you measure if the forecast was accurate?
**Answer:**
> "We measure it using standard metrics:
> - **MAE (Mean Absolute Error):** The average difference between predicted and actual scores.
> - **RMSE (Root Mean Squared Error):** Penalizes big mistakes more heavily.
> - **$R^2$ Score:** Measures how well the model fits the data (1.0 is a perfect fit).
> - **CI Coverage:** What percentage of actual points fell inside our predicted shaded band."

---

# 3. Vector Embeddings & Qdrant (Simple & Conversational)

### Q10: What are vector embeddings, and why do you need them?
**Answer:**
> "Vector embeddings turn text into a list of numbers (a vector) that capture the **meaning** of the words, not just exact keywords.
> 
> For example, a simple keyword search won't match 'Coding Assistant' with 'Cursor AI'. But vector embeddings place them close together in mathematical space because they mean the same thing."

### Q11: Which embedding model did you use, and why?
**Answer:**
> "We used **`all-MiniLM-L6-v2`** from the Sentence-Transformers library.
> - It converts any text into a **384-dimensional vector**.
> - It is very small (~90MB) and runs locally in just 15 milliseconds on a normal CPU, so it is fast and 100% free."

### Q12: What is Qdrant, and why not just use PostgreSQL?
**Answer:**
> "Qdrant is a specialized **Vector Database**. When a user logs in with their niche (e.g., 'Gaming & Tech'), we convert that into a vector and ask Qdrant to find the most similar trends using **Cosine Similarity**. 
> 
> We used Qdrant instead of PostgreSQL because vector searches on thousands of items require specialized search algorithms (HNSW graphs). Putting that in Qdrant keeps PostgreSQL fast and free for user data."

### Q13: How does vector similarity change the trend ranking?
**Answer:**
> "If a trend has a cosine similarity $\ge 0.5$ with the creator's profile, it gets a bonus boost added to its Opportunity Score:
> $$\text{Score Boost} = \text{Similarity} \times 15.0\text{ points}$$
> This ensures trends that closely match the creator's style rank higher in their Top 5 feed."

---

# 4. Data Collection & Scoring (Simple & Conversational)

### Q14: Where does the trend data come from?
**Answer:**
> "From two sources:
> 1. **YouTube Data API v3 (Primary):** Searches recently published videos (last 3 days) and collects view counts, velocity, and channel stats.
> 2. **SerpApi / Google Trends (Secondary):** Provides search interest growth as a backup."

### Q15: How do you filter out spam and clickbait news?
**Answer:**
> "We apply 4 strict filters:
> 1. **View count floor:** Video must have $> 50$ views.
> 2. **Subscriber floor:** Channel must have $> 100$ subscribers.
> 3. **Language filter:** Non-English videos are rejected using `langdetect`.
> 4. **Keyword blocklist:** Words like *arrested*, *murder*, *scandal*, and *court trial* are blocked so creators only get actionable video ideas, not crime news."

### Q16: How do you calculate the Opportunity Score (TVS)?
**Answer:**
> "The Opportunity Score is calculated on a 0 to 100 scale using 4 weighted factors:
> - **50% Raw Momentum:** How fast views and search volume are growing.
> - **25% Niche Fit:** How well the topic matches the creator's categories.
> - **20% Geo Relevance:** How well the trend matches the country where the creator's audience lives (e.g., India vs. US).
> - **5% Format Fit:** Whether the topic works for Shorts or Long-form videos."

### Q17: What does the LLM (OpenRouter/GPT) do?
**Answer:**
> "The ML model gives us numbers (e.g., *'Cursor AI will peak in 12 days with +38% growth'*).  
> The LLM takes those numbers and translates them into creator actions:
> 1. An **optimal upload window** (e.g., *'Publish within 72 hours before the trend saturates'*).
> 2. **High-CTR title ideas**.
> 3. A **video script outline** (Hook, Retention points, and Call-To-Action)."

---

# 5. Quick 1-Minute Rapid Fire Cheatsheet

| Examiner Question | Your 1-Sentence Answer |
| :--- | :--- |
| **"What is the model type of Prophet?"** | *"It is a Generalized Additive Model (GAM) combining linear trend, Fourier-based weekly seasonality, and noise."* |
| **"What embedding dimension did you use?"** | *"384 dimensions using the `all-MiniLM-L6-v2` Sentence-Transformer model."* |
| **"What distance metric is used in Qdrant?"** | *"Cosine Distance."* |
| **"How do you prevent big YouTubers like MrBeast from dominating every trend?"** | *"We limit each channel to a maximum of 2 videos per snapshot and enforce diversity quotas across Small, Medium, and Big creators."* |
| **"Does Prophet run live every time a user refreshes the page?"** | *"No, forecasts are computed in the background and stored in PostgreSQL, so user page loads are instant."* |
| **"Why not use LSTM for forecasting?"** | *"LSTMs need tens of thousands of data points and GPU compute; Prophet works with just 10–30 daily points and fits in milliseconds on CPU."* |

---

# 6. Deep Dive on Model Training in CreatorIQ

### 6.1 The Big Picture: How Models Learn in CreatorIQ

In CreatorIQ, there are **three AI/ML layers**, each with its own training approach:

| Component | Model Name | Trained From Scratch? | How It Learns / Fits |
| :--- | :--- | :--- | :--- |
| **Time-Series Forecaster** | **Meta Prophet** | **Yes (Fitted on dataset)** | Mathematical optimization (**L-BFGS / MAP**) on historical trend points $(ds, y)$. |
| **Vector Embeddings** | **all-MiniLM-L6-v2** | **Pre-trained (Zero-Shot)** | 22M-parameter Transformer pre-trained on 1B+ sentence pairs. |
| **Strategy Briefs** | **DeepSeek / GPT-4o-mini** | **Pre-trained (Prompt-Tuned)**| Large Language Model guided by structured system prompts. |

---

### 6.2 How Prophet Is "Trained" / Fitted

#### "Did you use Gradient Descent or Epochs?"
> **Common Examiner Question:** *"How many epochs did you train Prophet for, and what learning rate did you use?"*
> 
> **Your Answer:**  
> *"Prophet is **not a deep neural network**, so it does not use epochs or backpropagation! Instead, it uses **L-BFGS (a Quasi-Newton numerical optimization algorithm)** in Stan to find the **Maximum A Posteriori (MAP)** estimates for the trend slope, changepoint adjustments, and Fourier seasonality coefficients."*

#### The Fitting Process:
When `model.fit(df)` runs:
1. **Input Format:** A two-column Pandas DataFrame:
   - `ds`: The date/timestamp (e.g., `2024-01-01`).
   - `y`: The numeric momentum score (0 to 100).
2. **Changepoints:** Prophet automatically places 25 potential changepoint candidates along the first 80% of the historical time series.
3. **Regularization:** It applies a **Laplace prior** on slope changes ($\delta_j$). Most $\delta_j$ values shrink to zero, leaving only genuine inflection points where momentum shifted.
4. **Fitting Speed:** Takes only **50 to 120 milliseconds** per trend on standard CPU.

---

### 6.3 The Dataset Used for Training

1. **The Benchmark Dataset (`Prophet/sample-dataset-creatoriq.csv`):**
   - **730 daily time-series observations** (covering a full 2-year cycle).
   - Features: `video_date`, `trend_score`, `reach_ratio_median`, `population_size`, `interaction_density`, and creator tier counts (`small_channel_count`, `big_channel_count`).
   - Used for offline benchmarking, tuning changepoint scales, and evaluating in-sample metrics (MAE, RMSE, $R^2$).
2. **The Live Ingestion Dataset (Online Data):**
   - Harvested daily at midnight from YouTube Data API v3 and SerpApi Google Trends.
   - Saved to PostgreSQL (`concept_signals` table) to build an empirical time series for each tracked trend topic.

---

### 6.4 Hyperparameters & Tuning

Configured in `backend/services/ml/app/services/forecast_engine.py`:

```python
model = Prophet(
    growth="linear",
    seasonality_mode="additive",
    changepoint_prior_scale=0.05,
    interval_width=0.95,
    daily_seasonality=False,
    weekly_seasonality=True,
    yearly_seasonality=False,
)
```

- **`changepoint_prior_scale = 0.05`:** Regularization strength. A higher value ($0.5$) overfits to daily noise; a lower value ($0.001$) underfits into a rigid line. $0.05$ is optimal for social media spikes.
- **`seasonality_mode = "additive"`:** Social media weekly cycles have roughly constant swings regardless of baseline score magnitude.
- **`weekly_seasonality = True` (Fourier Order $N=3$):** Accurately models creator publishing cycles and weekend YouTube viewership surges.
- **`interval_width = 0.95`:** Produces standard 95% Bayesian credible interval uncertainty bands.

---

### 6.5 Training (Write Path) vs. Inference (Read Path)

```
[Write Path / Training (Asynchronous)]
Nightly Cron (12:00 AM)
   │
   ├─► Ingests YouTube & Google Trends signals
   ├─► Writes (ds, y) observations to PostgreSQL
   └─► Fits Prophet in background -> Precomputes 7d, 30d, 90d forecasts
       └─► Saves snapshots to database

[Read Path / Inference (User Request)]
User opens Dashboard: GET /trends/detail/:id
   │
   └─► Instant read from Redis Cache / PostgreSQL (< 10ms latency)
       (Prophet is NOT re-trained on every page view!)
```

---

### 6.6 Embedding Model: Pre-trained vs. Fine-Tuned

- **Model:** `sentence-transformers/all-MiniLM-L6-v2` (22M parameters, 384 dimensions).
- **Why Pre-trained (Zero-Shot)?** Fine-tuning requires hundreds of thousands of human-labeled YouTube topic pairs. MiniLM is already pre-trained on 1B+ sentence pairs and achieves $> 0.85$ cosine similarity on synonymous creator topics straight out of the box.
- **Efficiency:** Loaded once as a singleton in memory (~90MB RAM footprint, $< 15\text{ms}$ CPU encoding time).

---

### 6.7 Viva Questions Specifically on Training & Optimization

### Q: "What loss function is used when fitting Prophet?"
**Answer:**
> "Prophet minimizes the negative log-posterior likelihood of the data:
> $$\mathcal{L} = -\log p(y \mid \theta) - \log p(\theta)$$
> Where $p(y \mid \theta)$ assumes Gaussian noise $\mathcal{N}(0, \sigma^2)$, and $p(\theta)$ includes the Laplace prior on changepoints $\delta_j \sim \text{Laplace}(0, \tau)$ and Gaussian priors on Fourier seasonality coefficients."

### Q: "How do you evaluate if the trained model is good?"
**Answer:**
> "We compute four in-sample metrics against historical observations:
> 1. **MAE:** Mean Absolute Error ($\le 5.0$ is considered high accuracy).
> 2. **RMSE:** Root Mean Squared Error.
> 3. **$R^2$ Score:** Coefficient of determination ($\ge 0.85$ indicates a strong fit).
> 4. **CI Coverage:** We verify that at least $85\%$ of actual historical data points fall inside the predicted 95% uncertainty corridor."
