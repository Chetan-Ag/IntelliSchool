import os
import sys
import logging
import json
import math
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
import joblib
import shap

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_model.features import SchoolFeatureEngineer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IntelliSchoolPredictor:
    """
    Main predictor class for IntelliSchool infrastructure assessment.
    
    Handles:
    - Model loading and inference
    - SHAP explanations
    - Rule-based compliance checking
    - Recommendation generation
    """
    
    def __init__(self, models_dir: str = "models"):
        """Initialize the predictor with trained models."""
        self.models_dir = models_dir
        self.model = None
        self.shap_explainer = None
        self.feature_engineer = None
        self.standards = None
        self.feature_names = []
        
        # Load models and preprocessing pipeline
        self._load_models()
    
    def _load_models(self):
        """Load trained models and preprocessing pipeline."""
        try:
            # Load preprocessing pipeline
            pipeline_path = os.path.join(self.models_dir, 'preprocessing_pipeline.joblib')
            if os.path.exists(pipeline_path):
                pipeline = joblib.load(pipeline_path)
                self.feature_engineer = SchoolFeatureEngineer()
                self.feature_engineer.load_preprocessing_pipeline(pipeline_path)
                self.standards = pipeline.get('standards', self.feature_engineer.standards)
                self.feature_names = pipeline.get('feature_names', [])
                logger.info("Preprocessing pipeline loaded successfully")
            else:
                logger.warning("Preprocessing pipeline not found, using default standards")
                self.feature_engineer = SchoolFeatureEngineer()
                self.standards = self.feature_engineer.standards
            
            # Load best model
            model_path = os.path.join(self.models_dir, 'best_model.joblib')
            if os.path.exists(model_path):
                self.model = joblib.load(model_path)
                logger.info("Best model loaded successfully")
            else:
                logger.warning("Best model not found, using RandomForest")
                from sklearn.ensemble import RandomForestRegressor
                self.model = RandomForestRegressor(
                    n_estimators=100,
                    max_depth=10,
                    min_samples_split=5,
                    min_samples_leaf=2,
                    random_state=42,
                    n_jobs=-1
                )
            
            # Load SHAP explainer
            explainer_path = os.path.join(self.models_dir, 'shap_explainer.joblib')
            if os.path.exists(explainer_path):
                self.shap_explainer = joblib.load(explainer_path)
                logger.info("SHAP explainer loaded successfully")
            else:
                logger.warning("SHAP explainer not found, will create new one")
                
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise
    
    def predict_school(self, school_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make infrastructure assessment prediction for a school.
        
        Args:
            school_data: Dictionary containing school information
            
        Returns:
            Dictionary with prediction results and explanations
        """
        try:
            # Convert to DataFrame
            df = pd.DataFrame([school_data])
            
            # Engineer features
            engineered_df = self.feature_engineer.create_features(df)
            
            # Get ML features
            X = self.feature_engineer.get_ml_features(engineered_df)
            
            # Make prediction
            infrastructure_need_score = float(self.model.predict(X)[0])
            
            # Calculate compliance scores
            compliance_results = self._calculate_compliance(school_data)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(school_data, compliance_results)
            
            # Generate SHAP explanation
            shap_explanation = self._generate_shap_explanation(X)
            
            # Create response
            response = {
                'infrastructure_need_score': infrastructure_need_score,
                'compliant_flag': compliance_results['overall_compliant'],
                'deficiencies': compliance_results['deficiencies'],
                'recommended_quantities': recommendations,
                'shap_explanation': shap_explanation,
                'compliance_details': compliance_results['details'],
                'priority_rank': self._calculate_priority_rank(infrastructure_need_score, compliance_results)
            }
            
            return response
            
        except Exception as e:
            logger.error(f"Error making prediction: {e}")
            raise
    
    def _calculate_compliance(self, school_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate compliance scores based on BIS/NCERT standards."""
        details = {}
        deficiencies = []
        
        # PTR compliance
        total_students = school_data.get('total_students', 0)
        total_teachers = school_data.get('total_teachers', 0)
        
        if total_teachers > 0:
            ptr = total_students / total_teachers
            school_level = self._classify_school_level(school_data)
            ptr_threshold = self.standards.get('compliance_standards', {}).get('ptr_thresholds', {}).get(school_level, 30)
            ptr_compliant = ptr <= ptr_threshold
            details['ptr'] = {
                'value': ptr,
                'threshold': ptr_threshold,
                'compliant': ptr_compliant
            }
            if not ptr_compliant:
                deficiencies.append('high_ptr')
        else:
            ptr_compliant = False
            details['ptr'] = {'value': float('inf'), 'threshold': 30, 'compliant': False}
            deficiencies.append('no_teachers')
        
        # Toilet compliance - using separate boys and girls counts
        boys_toilets = school_data.get('boys_toilets', 0)
        girls_toilets = school_data.get('girls_toilets', 0)
        boys_count = school_data.get('boys_count', 0)
        girls_count = school_data.get('girls_count', 0)
        toilets_total = boys_toilets + girls_toilets
        
        if total_students > 0:
            # BIS Standard: 1 toilet per 40 students (minimum 1 each for boys and girls)
            boys_required = max(1, math.ceil(boys_count / 40)) if boys_count > 0 else 0
            girls_required = max(1, math.ceil(girls_count / 40)) if girls_count > 0 else 0
            total_required = boys_required + girls_required
            
            toilets_per_100 = (toilets_total / total_students) * 100
            toilets_compliant = (
                boys_toilets >= boys_required and 
                girls_toilets >= girls_required and
                boys_toilets > 0 and 
                girls_toilets > 0
            )
            details['toilets'] = {
                'boys': boys_toilets,
                'girls': girls_toilets,
                'total': toilets_total,
                'boys_required': boys_required,
                'girls_required': girls_required,
                'total_required': total_required,
                'per_100_students': toilets_per_100,
                'compliant': toilets_compliant
            }
            if not toilets_compliant:
                deficiencies.append('insufficient_toilets')
        else:
            toilets_compliant = False
            details['toilets'] = {'boys': 0, 'girls': 0, 'total': 0, 'boys_required': 0, 'girls_required': 0, 'total_required': 0, 'per_100_students': 0, 'compliant': False}
            deficiencies.append('no_students')
        
        # Computer compliance
        desktops = school_data.get('desktops', 0)
        laptops = school_data.get('laptops', 0)
        computers_total = desktops + laptops
        
        if total_students > 0:
            school_level = self._classify_school_level(school_data)
            computer_ratio = self.standards.get('compliance_standards', {}).get('computer_ratios', {}).get(school_level, 40)
            required_computers = max(1, total_students / computer_ratio)
            computers_compliant = computers_total >= required_computers
            details['computers'] = {
                'desktops': desktops,
                'laptops': laptops,
                'total': computers_total,
                'required': required_computers,
                'students_per_computer': computer_ratio,
                'compliant': computers_compliant
            }
            if not computers_compliant:
                deficiencies.append('insufficient_computers')
        else:
            computers_compliant = False
            details['computers'] = {'desktops': 0, 'laptops': 0, 'total': 0, 'required': 0, 'students_per_computer': 40, 'compliant': False}
        
        # Basic infrastructure compliance
        water_compliant = school_data.get('drinking_water_flag', False)
        electricity_compliant = school_data.get('electricity_flag', False)
        internet_compliant = school_data.get('internet_flag', False)
        
        details['water'] = {'available': water_compliant, 'compliant': water_compliant}
        details['electricity'] = {'available': electricity_compliant, 'compliant': electricity_compliant}
        
        # Internet compliance (only required for secondary+)
        school_level = self._classify_school_level(school_data)
        if school_level in ['secondary', 'higher_secondary']:
            internet_required = True
            if not internet_compliant:
                deficiencies.append('no_internet')
        else:
            internet_required = False
            internet_compliant = True  # Not required for primary
        
        details['internet'] = {
            'available': school_data.get('internet_flag', False),
            'required': internet_required,
            'compliant': internet_compliant
        }
        
        # Calculate overall compliance
        compliance_scores = [
            ptr_compliant,
            toilets_compliant,
            computers_compliant,
            water_compliant,
            electricity_compliant,
            internet_compliant
        ]
        
        overall_compliant = all(compliance_scores)
        overall_score = sum(compliance_scores) / len(compliance_scores)
        
        return {
            'overall_compliant': overall_compliant,
            'overall_score': overall_score,
            'deficiencies': deficiencies,
            'details': details
        }
    
    def _classify_school_level(self, school_data: Dict[str, Any]) -> str:
        """Classify school level based on classes offered."""
        classes_from = school_data.get('classes_from')
        classes_to = school_data.get('classes_to')
        
        if pd.isna(classes_from) or pd.isna(classes_to):
            return 'primary'
        
        try:
            from_class = int(classes_from)
            to_class = int(classes_to)
            
            if from_class <= 5 and to_class <= 5:
                return 'primary'
            elif from_class <= 8 and to_class <= 8:
                return 'upper_primary'
            elif from_class <= 10 and to_class <= 10:
                return 'secondary'
            elif from_class <= 12 and to_class <= 12:
                return 'higher_secondary'
            else:
                return 'other'
        except:
            return 'primary'
    
    def _generate_recommendations(self, school_data: Dict[str, Any], 
                                compliance_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate specific recommendations for infrastructure improvements."""
        recommendations = {}
        
        # Teacher recommendations
        if not compliance_results['details']['ptr']['compliant']:
            current_ptr = compliance_results['details']['ptr']['value']
            target_ptr = compliance_results['details']['ptr']['threshold']
            total_students = school_data.get('total_students', 0)
            
            if current_ptr > target_ptr:
                required_teachers = max(1, int(total_students / target_ptr))
                current_teachers = school_data.get('total_teachers', 0)
                additional_teachers = max(0, required_teachers - current_teachers)
                if additional_teachers > 0:
                    recommendations['teachers'] = additional_teachers
        
        # Toilet recommendations - using separate boys and girls counts
        if not compliance_results['details']['toilets']['compliant']:
            boys_count = school_data.get('boys_count', 0)
            girls_count = school_data.get('girls_count', 0)
            boys_toilets = school_data.get('boys_toilets', 0)
            girls_toilets = school_data.get('girls_toilets', 0)
            
            # Calculate required toilets based on BIS standards (1 per 40 students)
            boys_required = max(1, math.ceil(boys_count / 40)) if boys_count > 0 else 0
            girls_required = max(1, math.ceil(girls_count / 40)) if girls_count > 0 else 0
            
            # Calculate additional toilets needed
            additional_boys = max(0, boys_required - boys_toilets)
            additional_girls = max(0, girls_required - girls_toilets)
            
            if additional_boys > 0:
                recommendations['boys_toilets'] = additional_boys
            if additional_girls > 0:
                recommendations['girls_toilets'] = additional_girls
        
        # Computer recommendations
        if not compliance_results['details']['computers']['compliant']:
            current_computers = compliance_results['details']['computers']['total']
            required_computers = compliance_results['details']['computers']['required']
            additional_computers = max(0, int(required_computers - current_computers))
            
            if additional_computers > 0:
                recommendations['computers'] = additional_computers
        
        # Basic infrastructure recommendations
        if not compliance_results['details']['water']['compliant']:
            recommendations['water_source'] = 1
        
        if not compliance_results['details']['electricity']['compliant']:
            recommendations['electricity_connection'] = 1
        
        if not compliance_results['details']['internet']['compliant'] and compliance_results['details']['internet']['required']:
            recommendations['internet_installation'] = True
        
        # Library recommendations
        if not school_data.get('library_flag', False):
            recommendations['library_setup'] = True
        
        # Playground recommendations
        if not school_data.get('playground_flag', False):
            recommendations['playground_setup'] = True
        
        # Ramp recommendations
        if not school_data.get('ramps_flag', False):
            recommendations['ramp_construction'] = True
        
        return recommendations
    
    def _generate_shap_explanation(self, X: pd.DataFrame) -> Dict[str, Any]:
        """Generate SHAP explanation for the prediction."""
        try:
            if self.shap_explainer is None:
                # Create new explainer if not loaded
                self.shap_explainer = shap.TreeExplainer(self.model)
            
            # Calculate SHAP values
            shap_values = self.shap_explainer.shap_values(X)
            
            # Get feature names
            feature_names = X.columns.tolist()
            
            # Create feature contribution summary
            feature_contributions = []
            for i, feature in enumerate(feature_names):
                contribution = float(shap_values[0, i])
                direction = 'increase' if contribution > 0 else 'decrease'
                
                feature_contributions.append({
                    'feature': feature,
                    'contribution': abs(contribution),
                    'direction': direction,
                    'impact': 'positive' if contribution > 0 else 'negative'
                })
            
            # Sort by absolute contribution
            feature_contributions.sort(key=lambda x: x['contribution'], reverse=True)
            
            # Get top 8 features
            top_features = feature_contributions[:8]
            
            return {
                'top_features': top_features,
                'total_features': len(feature_names),
                'explanation_available': True
            }
            
        except Exception as e:
            logger.warning(f"Could not generate SHAP explanation: {e}")
            return {
                'top_features': [],
                'total_features': 0,
                'explanation_available': False,
                'error': str(e)
            }
    
    def _calculate_priority_rank(self, infrastructure_need_score: float, 
                                compliance_results: Dict[str, Any]) -> str:
        """Calculate priority rank based on score and compliance."""
        if infrastructure_need_score >= 0.8:
            return 'critical'
        elif infrastructure_need_score >= 0.6:
            return 'high'
        elif infrastructure_need_score >= 0.4:
            return 'medium'
        elif infrastructure_need_score >= 0.2:
            return 'low'
        else:
            return 'minimal'
    
    def predict_batch(self, schools_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Make predictions for multiple schools."""
        results = []
        
        for school_data in schools_data:
            try:
                result = self.predict_school(school_data)
                results.append(result)
            except Exception as e:
                logger.error(f"Error predicting for school {school_data.get('udise_code', 'unknown')}: {e}")
                results.append({
                    'error': str(e),
                    'udise_code': school_data.get('udise_code', 'unknown')
                })
        
        return results
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from the trained model."""
        try:
            if hasattr(self.model, 'feature_importances_'):
                feature_names = self.feature_names if self.feature_names else [f'feature_{i}' for i in range(len(self.model.feature_importances_))]
                
                importance_dict = dict(zip(feature_names, self.model.feature_importances_))
                return dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))
            else:
                logger.warning("Model does not have feature_importances_ attribute")
                return {}
        except Exception as e:
            logger.error(f"Error getting feature importance: {e}")
            return {}
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model."""
        try:
            model_info = {
                'model_type': type(self.model).__name__,
                'feature_count': len(self.feature_names) if self.feature_names else 0,
                'shap_explainer_loaded': self.shap_explainer is not None,
                'standards_loaded': self.standards is not None
            }
            
            if hasattr(self.model, 'n_estimators'):
                model_info['n_estimators'] = self.model.n_estimators
            
            if hasattr(self.model, 'max_depth'):
                model_info['max_depth'] = self.model.max_depth
            
            return model_info
            
        except Exception as e:
            logger.error(f"Error getting model info: {e}")
            return {'error': str(e)}


def create_sample_prediction():
    """Create a sample prediction for testing."""
    # Initialize predictor
    predictor = IntelliSchoolPredictor()
    
    # Sample school data
    sample_school = {
        'udise_code': 'UDISE001234',
        'school_name': 'Sample School',
        'state': 'Delhi',
        'district': 'Central',
        'block': 'Block A',
        'location_type': 'Urban',
        'management_type': 'Government',
        'category': 'Secondary',
        'total_students': 500,
        'total_teachers': 15,
        'total_classrooms': 20,
        'boys_toilets': 2,
        'girls_toilets': 2,
        'drinking_water_flag': True,
        'electricity_flag': True,
        'internet_flag': False,
        'library_flag': True,
        'desktops': 5,
        'laptops': 3,
        'playground_flag': True,
        'furniture_flag': True,
        'ramps_flag': False,
        'solar_panel_flag': False,
        'rainwater_flag': False,
        'classes_from': 6,
        'classes_to': 10
    }
    
    # Make prediction
    result = predictor.predict_school(sample_school)
    
    print("Sample Prediction Result:")
    print(json.dumps(result, indent=2, default=str))
    
    return result


if __name__ == "__main__":
    # Test the predictor service
    print("Testing IntelliSchool Predictor Service...")
    
    try:
        result = create_sample_prediction()
        print("\nTest completed successfully!")
    except Exception as e:
        print(f"Test failed: {e}")
        print("This is expected if models haven't been trained yet.")
        print("Run 'python backend/train.py' first to train the models.")
