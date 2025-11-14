import os
import sys
import logging
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import pandas as pd

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
import uvicorn

from predictor_service import IntelliSchoolPredictor
from scraper import UDISEScraper
from ai_model.features import SchoolFeatureEngineer, create_sample_data

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="IntelliSchool API",
    description="AI-powered school infrastructure assessment API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
predictor = None
scraper = None
feature_engineer = None

# Pydantic models for request/response
class ScrapingRequest(BaseModel):
    state: str = Field(..., description="State name")
    district: str = Field(..., description="District name")
    school_name: Optional[str] = Field(None, description="Optional school name")

class SchoolData(BaseModel):
    udise_code: str = Field(..., description="UDISE code")
    school_name: str = Field(..., description="School name")
    state: str = Field(..., description="State")
    district: str = Field(..., description="District")
    block: Optional[str] = Field(None, description="Block")
    location_type: Optional[str] = Field(None, description="Location type (Urban/Rural)")
    management_type: Optional[str] = Field(None, description="Management type")
    category: Optional[str] = Field(None, description="School category")
    total_students: Optional[int] = Field(None, description="Total students")
    total_teachers: Optional[int] = Field(None, description="Total teachers")
    total_classrooms: Optional[int] = Field(None, description="Total classrooms")
    boys_toilets: Optional[int] = Field(0, description="Boys toilets")
    girls_toilets: Optional[int] = Field(0, description="Girls toilets")
    drinking_water_flag: Optional[bool] = Field(False, description="Drinking water available")
    electricity_flag: Optional[bool] = Field(False, description="Electricity available")
    internet_flag: Optional[bool] = Field(False, description="Internet available")
    library_flag: Optional[bool] = Field(False, description="Library available")
    desktops: Optional[int] = Field(0, description="Number of desktops")
    laptops: Optional[int] = Field(0, description="Number of laptops")
    playground_flag: Optional[bool] = Field(False, description="Playground available")
    furniture_flag: Optional[bool] = Field(False, description="Furniture available")
    ramps_flag: Optional[bool] = Field(False, description="Ramps available")
    solar_panel_flag: Optional[bool] = Field(False, description="Solar panels available")
    rainwater_flag: Optional[bool] = Field(False, description="Rainwater harvesting")
    classes_from: Optional[int] = Field(None, description="Classes from")
    classes_to: Optional[int] = Field(None, description="Classes to")

class PredictionResponse(BaseModel):
    infrastructure_need_score: float = Field(..., description="Infrastructure need score (0-1)")
    compliant_flag: bool = Field(..., description="Overall compliance flag")
    deficiencies: List[str] = Field(..., description="List of deficiencies")
    recommended_quantities: Dict[str, Any] = Field(..., description="Recommended quantities")
    shap_explanation: Dict[str, Any] = Field(..., description="SHAP explanation")
    compliance_details: Dict[str, Any] = Field(..., description="Detailed compliance information")
    priority_rank: str = Field(..., description="Priority rank")

class TrainingRequest(BaseModel):
    quick_mode: bool = Field(False, description="Quick training mode")
    n_trials: int = Field(100, description="Number of Optuna trials")

class TrainingResponse(BaseModel):
    success: bool = Field(..., description="Training success status")
    message: str = Field(..., description="Training message")
    models_trained: List[str] = Field(..., description="List of trained models")

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    global predictor, scraper, feature_engineer
    
    try:
        logger.info("Initializing IntelliSchool services...")
        
        # Initialize predictor service
        predictor = IntelliSchoolPredictor()
        logger.info("Predictor service initialized")
        
        # Initialize scraper service
        scraper = UDISEScraper()
        logger.info("Scraper service initialized")
        
        # Initialize feature engineer
        feature_engineer = SchoolFeatureEngineer()
        logger.info("Feature engineer initialized")
        
        logger.info("All services initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing services: {e}")
        logger.warning("Some services may not be available")

# Health check endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "IntelliSchool API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": [
            "/api/scrape",
            "/api/predict",
            "/api/report/{udise}",
            "/api/train",
            "/api/health"
        ]
    }

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Check if services are available
        services_status = {
            "predictor": predictor is not None,
            "scraper": scraper is not None,
            "feature_engineer": feature_engineer is not None
        }
        
        overall_status = all(services_status.values())
        
        return {
            "status": "healthy" if overall_status else "degraded",
            "timestamp": datetime.now().isoformat(),
            "services": services_status
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

# Scraping endpoint
@app.post("/api/scrape", response_model=Dict[str, Any])
async def scrape_schools(request: ScrapingRequest):
    """Trigger UDISE+ scraping for schools."""
    try:
        if scraper is None:
            raise HTTPException(status_code=503, detail="Scraper service not available")
        
        logger.info(f"Scraping request: {request.state}, {request.district}")
        
        # Perform scraping
        result = scraper.scrape_school_data(
            state=request.state,
            district=request.district,
            school_name=request.school_name
        )
        
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Scraping error: {e}")
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")

# Prediction endpoint
@app.post("/api/predict", response_model=PredictionResponse)
async def predict_infrastructure(school_data: SchoolData):
    """Get infrastructure assessment prediction for a school."""
    try:
        if predictor is None:
            raise HTTPException(status_code=503, detail="Predictor service not available")
        
        logger.info(f"Prediction request for school: {school_data.udise_code}")
        
        # Convert Pydantic model to dict
        school_dict = school_data.dict()
        
        # Make prediction
        result = predictor.predict_school(school_dict)
        
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        
        return PredictionResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# Batch prediction endpoint
@app.post("/api/predict/batch")
async def predict_batch(schools_data: List[SchoolData]):
    """Get infrastructure assessment predictions for multiple schools."""
    try:
        if predictor is None:
            raise HTTPException(status_code=503, detail="Predictor service not available")
        
        logger.info(f"Batch prediction request for {len(schools_data)} schools")
        
        # Convert Pydantic models to dicts
        schools_dicts = [school.dict() for school in schools_data]
        
        # Make batch predictions
        results = predictor.predict_batch(schools_dicts)
        
        return {
            "total_schools": len(schools_data),
            "predictions": results
        }
        
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")

# CSV upload and prediction endpoint
@app.post("/api/predict/csv")
async def predict_from_csv(file: UploadFile = File(...)):
    """Upload CSV file and get predictions for all schools."""
    try:
        if predictor is None:
            raise HTTPException(status_code=503, detail="Predictor service not available")
        
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be a CSV")
        
        logger.info(f"CSV prediction request: {file.filename}")
        
        # Read CSV file
        df = pd.read_csv(file.file)
        
        # Validate required columns
        required_columns = ['udise_code', 'school_name', 'state', 'district']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {missing_columns}"
            )
        
        # Convert DataFrame to list of dicts
        schools_data = df.to_dict('records')
        
        # Make predictions
        results = predictor.predict_batch(schools_data)
        
        # Add predictions to original data
        for i, result in enumerate(results):
            if 'error' not in result:
                schools_data[i].update(result)
        
        # Save enriched data to CSV
        enriched_df = pd.DataFrame(schools_data)
        output_filename = f"enriched_{file.filename}"
        output_path = os.path.join("Data", output_filename)
        enriched_df.to_csv(output_path, index=False)
        
        return {
            "message": "Predictions completed successfully",
            "total_schools": len(schools_data),
            "enriched_csv": output_filename,
            "predictions": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CSV prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"CSV prediction failed: {str(e)}")

# Report generation endpoint
@app.get("/api/report/{udise_code}")
async def generate_report(udise_code: str):
    """Generate and download report for a specific school."""
    try:
        # This would implement report generation
        # For now, return a placeholder response
        
        return {
            "message": "Report generation endpoint",
            "udise_code": udise_code,
            "status": "not_implemented",
            "note": "Report generation will be implemented in future versions"
        }
        
    except Exception as e:
        logger.error(f"Report generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

# Training endpoint
@app.post("/api/train", response_model=TrainingResponse)
async def train_models(request: TrainingRequest):
    """Trigger ML model training."""
    try:
        logger.info("Training request received")
        
        # Import training module
        from train import IntelliSchoolTrainer
        
        # Initialize trainer
        trainer = IntelliSchoolTrainer()
        
        # Run training pipeline
        trainer.run_training_pipeline(
            n_trials=request.n_trials,
            quick_mode=request.quick_mode
        )
        
        # Get trained models
        models_trained = list(trainer.best_models.keys())
        models_trained = [m for m in models_trained if m not in ['xgboost_params', 'lightgbm_params']]
        
        return TrainingResponse(
            success=True,
            message="Training completed successfully",
            models_trained=models_trained
        )
        
    except Exception as e:
        logger.error(f"Training error: {e}")
        return TrainingResponse(
            success=False,
            message=f"Training failed: {str(e)}",
            models_trained=[]
        )

# Model information endpoint
@app.get("/api/model/info")
async def get_model_info():
    """Get information about the loaded ML model."""
    try:
        if predictor is None:
            raise HTTPException(status_code=503, detail="Predictor service not available")
        
        model_info = predictor.get_model_info()
        feature_importance = predictor.get_feature_importance()
        
        return {
            "model_info": model_info,
            "feature_importance": feature_importance,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Model info error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")

# Data statistics endpoint
@app.get("/api/data/stats")
async def get_data_statistics():
    """Get statistics about available data."""
    try:
        data_dir = "Data"
        csv_files = [f for f in os.listdir(data_dir) if f.endswith('.csv')]
        
        stats = {
            "total_files": len(csv_files),
            "files": []
        }
        
        for csv_file in csv_files:
            file_path = os.path.join(data_dir, csv_file)
            try:
                df = pd.read_csv(file_path)
                file_stats = {
                    "filename": csv_file,
                    "rows": len(df),
                    "columns": len(df.columns),
                    "size_mb": round(os.path.getsize(file_path) / (1024 * 1024), 2)
                }
                stats["files"].append(file_stats)
            except Exception as e:
                logger.warning(f"Could not read {csv_file}: {e}")
        
        return stats
        
    except Exception as e:
        logger.error(f"Data stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get data statistics: {str(e)}")

# Create sample data endpoint
@app.post("/api/data/sample")
async def create_sample_data_endpoint():
    """Create sample school data for testing."""
    try:
        logger.info("Creating sample data")
        
        # Generate sample data
        sample_df = create_sample_data()
        
        # Save to CSV
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"sample_schools_{timestamp}.csv"
        file_path = os.path.join("Data", filename)
        
        sample_df.to_csv(file_path, index=False)
        
        return {
            "message": "Sample data created successfully",
            "filename": filename,
            "rows": len(sample_df),
            "columns": len(sample_df.columns)
        }
        
    except Exception as e:
        logger.error(f"Sample data creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create sample data: {str(e)}")

# Scraping status endpoint
@app.get("/api/scrape/status")
async def get_scraping_status():
    """Get current scraping status and statistics."""
    try:
        if scraper is None:
            raise HTTPException(status_code=503, detail="Scraper service not available")
        
        status = scraper.get_scraping_status()
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Scraping status error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get scraping status: {str(e)}")

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Handle 404 errors."""
    return JSONResponse(
        status_code=404,
        content={"error": "Endpoint not found", "detail": str(exc)}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handle 500 errors."""
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

# Main function for running the app
if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
