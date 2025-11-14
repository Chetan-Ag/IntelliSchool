import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
import json
import os
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestRegressor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SchoolFeatureEngineer:
    """
    Feature engineering class for school infrastructure data.
    
    Handles:
    - Data cleaning and validation
    - Feature creation and transformation
    - Categorical encoding
    - Missing value imputation
    - Compliance rule calculations
    """
    
    def __init__(self, standards_path: str = "ai_model/standards.json"):
        """Initialize the feature engineer with compliance standards."""
        self.standards = self._load_standards(standards_path)
        self.label_encoders = {}
        self.imputers = {}
        self.scalers = {}
        self.feature_names = []
        
    def _load_standards(self, standards_path: str) -> Dict:
        """Load compliance standards from JSON file."""
        try:
            with open(standards_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"Standards file not found at {standards_path}, using defaults")
            return self._get_default_standards()
    
    def _get_default_standards(self) -> Dict:
        """Return default compliance standards if file not found."""
        return {
            "compliance_standards": {
                "ptr_thresholds": {"primary": 30, "upper_primary": 35, "secondary": 35, "higher_secondary": 40},
                "toilet_ratios": {"boys": 80, "girls": 80, "teachers": 20},
                "computer_ratios": {"primary": 40, "upper_primary": 30, "secondary": 20, "higher_secondary": 15}
            }
        }
    
    def create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Main feature engineering pipeline.
        
        Args:
            df: Raw school data DataFrame
            
        Returns:
            DataFrame with engineered features
        """
        logger.info("Starting feature engineering pipeline")
        
        # Create a copy to avoid modifying original
        df_eng = df.copy()
        
        # Basic data cleaning
        df_eng = self._clean_data(df_eng)
        
        # Create derived features
        df_eng = self._create_derived_features(df_eng)
        
        # Calculate compliance scores
        df_eng = self._calculate_compliance_scores(df_eng)
        
        # Create interaction features
        df_eng = self._create_interaction_features(df_eng)
        
        # Handle categorical variables
        df_eng = self._encode_categorical_features(df_eng)
        
        # Final cleaning and validation
        df_eng = self._final_validation(df_eng)
        
        logger.info(f"Feature engineering complete. Final shape: {df_eng.shape}")
        return df_eng
    
    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate raw data."""
        logger.info("Cleaning raw data")
        
        # Handle missing values in critical fields
        critical_fields = ['total_students', 'total_teachers', 'total_classrooms']
        for field in critical_fields:
            if field in df.columns:
                df[field] = pd.to_numeric(df[field], errors='coerce')
                df[field] = df[field].fillna(0)
        
        # Convert boolean flags
        boolean_fields = [
            'drinking_water_flag', 'electricity_flag', 'internet_flag',
            'library_flag', 'playground_flag', 'furniture_flag', 
            'ramps_flag', 'solar_panel_flag', 'rainwater_flag'
        ]
        
        for field in boolean_fields:
            if field in df.columns:
                df[field] = df[field].map({'Y': True, 'N': False, True: True, False: False})
                df[field] = df[field].fillna(False)
        
        # Convert numeric fields
        numeric_fields = [
            'boys_toilets', 'girls_toilets', 'desktops', 'laptops',
            'classes_from', 'classes_to'
        ]
        
        for field in numeric_fields:
            if field in df.columns:
                df[field] = pd.to_numeric(df[field].astype(str).str.strip(), errors='coerce')
                df[field] = df[field].fillna(0)
        
        return df
    
    def _create_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create derived features from raw data."""
        logger.info("Creating derived features")
        
        # PTR (Pupil-Teacher Ratio)
        df['ptr'] = np.where(
            df['total_teachers'] > 0,
            df['total_students'] / df['total_teachers'],
            df['total_students']  # High PTR if no teachers
        )
        
        # Computer totals
        df['computers_total'] = df['desktops'].fillna(0) + df['laptops'].fillna(0)
        
        # Toilet totals
        df['toilets_total'] = df['boys_toilets'].fillna(0) + df['girls_toilets'].fillna(0)
        
        # Students per class
        df['students_per_class'] = np.where(
            df['total_classrooms'] > 0,
            df['total_students'] / df['total_classrooms'],
            df['total_students']
        )
        
        # Toilets per 100 students
        df['toilets_per_100_students'] = np.where(
            df['total_students'] > 0,
            (df['toilets_total'] / df['total_students']) * 100,
            0
        )
        
        # Computers per 100 students
        df['computers_per_100_students'] = np.where(
            df['total_students'] > 0,
            (df['computers_total'] / df['total_students']) * 100,
            0
        )
        
        # School level classification
        df['school_level'] = self._classify_school_level(df)
        
        # Geographic features (if available)
        if 'location_type' in df.columns:
            df['is_urban'] = df['location_type'].isin(['Urban', 'urban', 'URBAN'])
            df['is_rural'] = df['location_type'].isin(['Rural', 'rural', 'RURAL'])
        
        return df
    
    def _classify_school_level(self, df: pd.DataFrame) -> pd.Series:
        """Classify school level based on classes offered."""
        def classify_level(row):
            if pd.isna(row['classes_from']) or pd.isna(row['classes_to']):
                return 'unknown'
            
            from_class = int(row['classes_from'])
            to_class = int(row['classes_to'])
            
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
        
        return df.apply(classify_level, axis=1)
    
    def _calculate_compliance_scores(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate rule-based compliance scores."""
        logger.info("Calculating compliance scores")
        
        # Initialize compliance flags
        df['ptr_compliant'] = False
        df['toilets_compliant'] = False
        df['computers_compliant'] = False
        df['water_compliant'] = False
        df['electricity_compliant'] = False
        df['internet_compliant'] = False
        
        # PTR compliance
        for idx, row in df.iterrows():
            level = row.get('school_level', 'primary')
            ptr_threshold = self.standards['compliance_standards']['ptr_thresholds'].get(level, 30)
            df.at[idx, 'ptr_compliant'] = row['ptr'] <= ptr_threshold
        
        # Toilet compliance - BIS Standard: 1 toilet per 40 students (2.5 per 100)
        df['toilets_compliant'] = (
            (df['toilets_per_100_students'] >= 2.5) &  # 1 toilet per 40 students = 2.5 per 100
            (df['boys_toilets'] > 0) & 
            (df['girls_toilets'] > 0)
        )
        
        # Computer compliance
        for idx, row in df.iterrows():
            level = row.get('school_level', 'primary')
            if not level or level == 'unknown':
                level = 'secondary'  # or choose based on your domain rules
            computer_ratio = self.standards['compliance_standards']['computer_ratios'].get(level, 40)
            required_computers = max(1, row['total_students'] / computer_ratio)
            df.at[idx, 'computers_compliant'] = row['computers_total'] >= required_computers
        
        # Basic infrastructure compliance
        df['water_compliant'] = df['drinking_water_flag'].fillna(False)
        df['electricity_compliant'] = df['electricity_flag'].fillna(False)
        
        # Internet compliance (only required for secondary+)
        df['internet_compliant'] = np.where(
            df['school_level'].isin(['secondary', 'higher_secondary']),
            df['internet_flag'].fillna(False),
            True  # Not required for primary
        )
        
        # Calculate overall compliance score
        compliance_columns = [
            'ptr_compliant', 'toilets_compliant', 'computers_compliant',
            'water_compliant', 'electricity_compliant', 'internet_compliant'
        ]
        
        df['overall_compliance_score'] = df[compliance_columns].mean(axis=1)
        
        # Create infrastructure need score (inverse of compliance)
        df['infrastructure_need_score'] = 1 - df['overall_compliance_score']
        
        return df
    
    def _create_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create interaction features for ML models."""
        logger.info("Creating interaction features")
        
        # PTR interactions
        df['ptr_squared'] = df['ptr'] ** 2
        df['ptr_log'] = np.log1p(df['ptr'])
        
        # Student density features
        df['student_density'] = df['total_students'] / (df['total_classrooms'] + 1)
        
        # Infrastructure density
        df['infrastructure_density'] = (
            df['toilets_total'] + df['computers_total'] + 
            df['total_classrooms']
        ) / (df['total_students'] + 1)
        
        # Compliance interaction
        df['ptr_toilet_interaction'] = df['ptr'] * (1 - df['toilets_compliant'].astype(int))
        df['ptr_computer_interaction'] = df['ptr'] * (1 - df['computers_compliant'].astype(int))
        
        return df
    
    def _encode_categorical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Encode categorical features for ML models."""
        logger.info("Encoding categorical features")
        
        categorical_features = [
            'state', 'district', 'block', 'location_type', 
            'management_type', 'category', 'school_level'
        ]
        
        for feature in categorical_features:
            if feature in df.columns:
                # Handle missing values
                df[feature] = df[feature].fillna('unknown')
                
                # Create label encoder
                le = LabelEncoder()
                df[f'{feature}_encoded'] = le.fit_transform(df[feature].astype(str))
                
                # Store encoder for later use
                self.label_encoders[feature] = le
        
        return df
    
    def _final_validation(self, df: pd.DataFrame) -> pd.DataFrame:
        """Final validation and cleaning of engineered features."""
        logger.info("Final validation")
        
        # Replace infinite values
        df = df.replace([np.inf, -np.inf], np.nan)
        
        # Fill remaining NaN values
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        df[numeric_columns] = df[numeric_columns].fillna(0)
        
        # Ensure target variable is in valid range
        if 'infrastructure_need_score' in df.columns:
            df['infrastructure_need_score'] = df['infrastructure_need_score'].clip(0, 1)
        
        # Store feature names for later use
        self.feature_names = [col for col in df.columns if col not in [
            'udise_code', 'school_name', 'state', 'district', 'block',
            'location_type', 'management_type', 'category', 'school_level'
        ]]
        
        return df
    
    def get_feature_names(self) -> List[str]:
        """Get list of engineered feature names."""
        return self.feature_names
    
    def get_ml_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Get only the features needed for ML models."""
        ml_features = [col for col in self.feature_names if col not in [
            'infrastructure_need_score', 'overall_compliance_score'
        ]]
        return df[ml_features]
    
    def save_preprocessing_pipeline(self, filepath: str):
        """Save the preprocessing pipeline for later use."""
        import joblib
        
        pipeline = {
            'label_encoders': self.label_encoders,
            'feature_names': self.feature_names,
            'standards': self.standards
        }
        
        joblib.dump(pipeline, filepath)
        logger.info(f"Preprocessing pipeline saved to {filepath}")
    
    def load_preprocessing_pipeline(self, filepath: str):
        """Load a saved preprocessing pipeline."""
        import joblib
        
        pipeline = joblib.load(filepath)
        self.label_encoders = pipeline['label_encoders']
        self.feature_names = pipeline['feature_names']
        self.standards = pipeline['standards']
        
        logger.info(f"Preprocessing pipeline loaded from {filepath}")


def create_sample_data() -> pd.DataFrame:
    """Create sample school data for testing and development."""
    np.random.seed(42)
    
    n_schools = 100
    
    data = {
        'udise_code': [f'UDISE{i:06d}' for i in range(1, n_schools + 1)],
        'school_name': [f'School {i}' for i in range(1, n_schools + 1)],
        'state': np.random.choice(['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu'], n_schools),
        'district': np.random.choice(['Central', 'North', 'South', 'East', 'West'], n_schools),
        'block': np.random.choice(['Block A', 'Block B', 'Block C'], n_schools),
        'location_type': np.random.choice(['Urban', 'Rural'], n_schools, p=[0.6, 0.4]),
        'management_type': np.random.choice(['Government', 'Private', 'Aided'], n_schools),
        'category': np.random.choice(['Primary', 'Secondary', 'Higher Secondary'], n_schools),
        'total_students': np.random.randint(50, 2000, n_schools),
        'total_teachers': np.random.randint(5, 100, n_schools),
        'total_classrooms': np.random.randint(3, 50, n_schools),
        'boys_toilets': np.random.randint(0, 10, n_schools),
        'girls_toilets': np.random.randint(0, 10, n_schools),
        'drinking_water_flag': np.random.choice([True, False], n_schools, p=[0.8, 0.2]),
        'electricity_flag': np.random.choice([True, False], n_schools, p=[0.9, 0.1]),
        'internet_flag': np.random.choice([True, False], n_schools, p=[0.6, 0.4]),
        'library_flag': np.random.choice([True, False], n_schools, p=[0.7, 0.3]),
        'desktops': np.random.randint(0, 20, n_schools),
        'laptops': np.random.randint(0, 15, n_schools),
        'playground_flag': np.random.choice([True, False], n_schools, p=[0.8, 0.2]),
        'furniture_flag': np.random.choice([True, False], n_schools, p=[0.6, 0.4]),
        'ramps_flag': np.random.choice([True, False], n_schools, p=[0.5, 0.5]),
        'solar_panel_flag': np.random.choice([True, False], n_schools, p=[0.3, 0.7]),
        'rainwater_flag': np.random.choice([True, False], n_schools, p=[0.2, 0.8]),
        'classes_from': np.random.choice([1, 6, 9], n_schools),
        'classes_to': np.random.choice([5, 8, 12], n_schools)
    }
    
    return pd.DataFrame(data)


if __name__ == "__main__":
    # Test the feature engineering pipeline
    print("Testing SchoolFeatureEngineer...")
    
    # Create sample data
    sample_df = create_sample_data()
    print(f"Sample data shape: {sample_df.shape}")
    
    # Initialize feature engineer
    engineer = SchoolFeatureEngineer()
    
    # Create features
    engineered_df = engineer.create_features(sample_df)
    print(f"Engineered data shape: {engineered_df.shape}")
    
    # Show some key features
    key_features = [
        'ptr', 'computers_total', 'toilets_total', 'infrastructure_need_score',
        'overall_compliance_score', 'ptr_compliant', 'toilets_compliant'
    ]
    
    print("\nKey engineered features:")
    print(engineered_df[key_features].head())
    
    # Save pipeline
    os.makedirs('models', exist_ok=True)
    engineer.save_preprocessing_pipeline('models/preprocessing_pipeline.joblib')
    
    print("\nFeature engineering test completed successfully!")
