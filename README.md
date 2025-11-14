# IntelliSchool - AI-Powered School Infrastructure Assessment

IntelliSchool is a comprehensive web application that assesses school infrastructure needs using machine learning and rule-based compliance checking. It scrapes UDISE+ data, computes compliance scores, and provides AI-powered prioritization for infrastructure interventions.

## 🏗️ Architecture

- **Frontend**: Next.js + Tailwind CSS (responsive, mobile-first)
- **Backend**: FastAPI (inference API + training pipeline)
- **ML Pipeline**: XGBoost + LightGBM with Optuna hyperparameter tuning
- **Data Storage**: CSV-based (no external database required)
- **Explainability**: SHAP explanations for all predictions

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Chrome/Chromium for web scraping

### 1. Clone and Setup
```bash
git clone <repository-url>
cd intellischool
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Train the ML model (first time only)
python backend/train.py

# Start FastAPI server
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📁 Project Structure

```
intellischool/
├── Data/                               # CSV files (scraped/manual input)
├── frontend/                           # Next.js + Tailwind UI
├── backend/                            # FastAPI inference + training
├── ai_model/                           # ML pipeline and features
├── models/                             # Saved models and pipelines
├── reports/                            # Generated reports and metrics
└── requirements.txt                    # Python dependencies
```

## 🔧 Configuration

### Environment Variables
Create `.env.local` in frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### Scraping Configuration
The scraper uses Selenium/Playwright. For manual CAPTCHA solving:
1. Set `MANUAL_CAPTCHA=true` in environment
2. Follow prompts in terminal when CAPTCHA appears

## 🎯 Core Features

### 1. Data Collection
- **UDISE+ Scraping**: Automated data collection from official sources
- **Manual Input**: CSV upload for schools not accessible via scraping
- **Data Validation**: Automatic cleaning and enrichment

### 2. Infrastructure Assessment
- **Rule-based Compliance**: BIS/NCERT standards checking
- **ML Scoring**: XGBoost model predicting infrastructure need (0-1)
- **Priority Ranking**: AI-powered intervention prioritization

### 3. Recommendations
- **Quantified Needs**: Exact quantities for infrastructure additions
- **Cost Estimation**: Budget planning support
- **Timeline Planning**: Priority-based intervention scheduling

### 4. Reporting & Export
- **PDF Reports**: Professional school assessment reports
- **CSV Export**: Data analysis and bulk processing
- **SHAP Explanations**: Transparent AI decision-making

## 🧠 Machine Learning Pipeline

### Model Architecture
- **Primary**: XGBoost Regressor (infrastructure need score)
- **Comparison**: LightGBM Regressor
- **Ensemble**: Stacked model if performance improves
- **Tuning**: Optuna with 5-fold cross-validation

### Feature Engineering
- **Numeric**: PTR ratios, infrastructure densities
- **Categorical**: State/district encodings
- **Derived**: Per-student ratios, compliance flags
- **Interactions**: Geographic and temporal features

### Training Process
```bash
# Full training with Optuna tuning
python backend/train.py

# Quick demo training
python backend/train.py --quick

# Retrain with new data
python backend/train.py --retrain
```

## 📊 API Endpoints

### Core Endpoints
- `POST /api/scrape` - Trigger UDISE+ scraping
- `POST /api/predict` - Get infrastructure assessment
- `GET /api/report/{udise}` - Download school report
- `POST /api/train` - Retrain ML model

### Prediction Response
```json
{
  "infrastructure_need_score": 0.85,
  "compliant_flag": false,
  "deficiencies": ["insufficient_toilets", "high_ptr"],
  "recommended_quantities": {
    "toilets": 3,
    "teachers": 2,
    "computers": 5
  },
  "shap_explanation": {
    "top_features": [
      {"feature": "ptr", "contribution": 0.15, "direction": "increase"},
      {"feature": "toilets_per_100_students", "contribution": 0.12, "direction": "increase"}
    ]
  }
}
```

## 🚀 Deployment

### Local Development
```bash
# Backend
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend && npm run dev
```

### Production Deployment

#### Backend (Vercel/Heroku)
```bash
# Install production dependencies
pip install -r requirements.txt

# Set environment variables
export ENVIRONMENT=production
export MODEL_PATH=models/best_model.joblib

# Deploy
gunicorn backend.app:app -w 4 -k uvicorn.workers.UvicornWorker
```

#### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel --prod
```

### Docker Deployment
```bash
# Build and run
docker build -t intellischool .
docker run -p 8000:8000 intellischool
```

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
python -m pytest tests/

# Run specific test file
python -m pytest tests/test_features.py

# Run with coverage
python -m pytest --cov=backend tests/
```

### Integration Tests
```bash
# Test API endpoints
python -m pytest tests/test_api.py

# Test ML pipeline
python -m pytest tests/test_ml_pipeline.py
```

## 📈 Performance & Monitoring

### Model Performance
- **Cross-validation**: 5-fold CV with early stopping
- **Metrics**: RMSE, MAE, R² for regression
- **Feature Importance**: SHAP-based global and local explanations

### System Monitoring
- **API Response Time**: < 500ms for predictions
- **Model Loading**: < 2s cold start
- **Memory Usage**: < 2GB for full pipeline

## 🔒 Security & Privacy

- **Data Encryption**: All sensitive data encrypted at rest
- **API Authentication**: OAuth2 with JWT tokens
- **Input Validation**: Comprehensive data sanitization
- **Audit Logging**: All predictions and data access logged

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)

## 🙏 Acknowledgments

- UDISE+ for educational data
- BIS/NCERT for compliance standards
- SHAP community for explainability tools
- XGBoost and LightGBM teams for ML algorithms

---

**IntelliSchool** - Empowering education through intelligent infrastructure assessment.
