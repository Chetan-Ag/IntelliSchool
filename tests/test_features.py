"""
Unit tests for the feature engineering module.
"""

import unittest
import pandas as pd
import numpy as np
import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_model.features import SchoolFeatureEngineer, create_sample_data


class TestSchoolFeatureEngineer(unittest.TestCase):
    """Test cases for SchoolFeatureEngineer class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.engineer = SchoolFeatureEngineer()
        self.sample_data = create_sample_data()
    
    def test_initialization(self):
        """Test feature engineer initialization."""
        self.assertIsNotNone(self.engineer.standards)
        self.assertIsInstance(self.engineer.standards, dict)
        self.assertIn('ptr_thresholds', self.engineer.standards)
        self.assertIn('toilet_ratios', self.engineer.standards)
    
    def test_data_cleaning(self):
        """Test data cleaning functionality."""
        # Test with sample data
        cleaned_data = self.engineer._clean_data(self.sample_data.copy())
        
        # Check that numeric fields are properly converted
        self.assertIsInstance(cleaned_data['total_students'].iloc[0], (int, float))
        self.assertIsInstance(cleaned_data['total_teachers'].iloc[0], (int, float))
        
        # Check that boolean fields are properly converted
        self.assertIsInstance(cleaned_data['drinking_water_flag'].iloc[0], bool)
        self.assertIsInstance(cleaned_data['electricity_flag'].iloc[0], bool)
    
    def test_derived_features(self):
        """Test derived feature creation."""
        df = self.sample_data.copy()
        df_with_derived = self.engineer._create_derived_features(df)
        
        # Check that derived features exist
        self.assertIn('ptr', df_with_derived.columns)
        self.assertIn('computers_total', df_with_derived.columns)
        self.assertIn('toilets_total', df_with_derived.columns)
        self.assertIn('school_level', df_with_derived.columns)
        
        # Check PTR calculation
        sample_row = df_with_derived.iloc[0]
        if sample_row['total_teachers'] > 0:
            expected_ptr = sample_row['total_students'] / sample_row['total_teachers']
            self.assertAlmostEqual(sample_row['ptr'], expected_ptr, places=5)
        
        # Check computer totals
        expected_computers = sample_row['desktops'] + sample_row['laptops']
        self.assertEqual(sample_row['computers_total'], expected_computers)
    
    def test_compliance_calculation(self):
        """Test compliance score calculation."""
        df = self.sample_data.copy()
        df_with_features = self.engineer._create_derived_features(df)
        df_with_compliance = self.engineer._calculate_compliance_scores(df_with_features)
        
        # Check that compliance scores exist
        self.assertIn('overall_compliance_score', df_with_compliance.columns)
        self.assertIn('infrastructure_need_score', df_with_compliance.columns)
        
        # Check that scores are in valid range [0, 1]
        compliance_scores = df_with_compliance['overall_compliance_score']
        need_scores = df_with_compliance['infrastructure_need_score']
        
        self.assertTrue(all(0 <= score <= 1 for score in compliance_scores))
        self.assertTrue(all(0 <= score <= 1 for score in need_scores))
        
        # Check that infrastructure need score is inverse of compliance
        for i in range(len(df_with_compliance)):
            compliance = df_with_compliance.iloc[i]['overall_compliance_score']
            need = df_with_compliance.iloc[i]['infrastructure_need_score']
            self.assertAlmostEqual(need, 1 - compliance, places=5)
    
    def test_categorical_encoding(self):
        """Test categorical feature encoding."""
        df = self.sample_data.copy()
        df_with_features = self.engineer._create_derived_features(df)
        df_with_compliance = self.engineer._calculate_compliance_scores(df_with_features)
        df_with_interactions = self.engineer._create_interaction_features(df_with_compliance)
        df_encoded = self.engineer._encode_categorical_features(df_with_interactions)
        
        # Check that encoded features exist
        categorical_features = ['state', 'district', 'block', 'location_type', 'management_type', 'category']
        for feature in categorical_features:
            if feature in df_encoded.columns:
                encoded_col = f'{feature}_encoded'
                self.assertIn(encoded_col, df_encoded.columns)
                
                # Check that encoded values are numeric
                self.assertTrue(pd.api.types.is_numeric_dtype(df_encoded[encoded_col]))
    
    def test_complete_pipeline(self):
        """Test the complete feature engineering pipeline."""
        result = self.engineer.create_features(self.sample_data)
        
        # Check that the result has the expected shape
        self.assertGreater(result.shape[0], 0)
        self.assertGreater(result.shape[1], self.sample_data.shape[1])
        
        # Check that target variable exists
        self.assertIn('infrastructure_need_score', result.columns)
        
        # Check that all values are finite
        numeric_cols = result.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            self.assertTrue(result[col].notna().all())
            self.assertTrue(np.isfinite(result[col]).all())
    
    def test_feature_names(self):
        """Test feature name retrieval."""
        self.engineer.create_features(self.sample_data)
        feature_names = self.engineer.get_feature_names()
        
        self.assertIsInstance(feature_names, list)
        self.assertGreater(len(feature_names), 0)
        
        # Check that ML features exclude target variables
        ml_features = self.engineer.get_ml_features(self.engineer.create_features(self.sample_data))
        target_cols = ['infrastructure_need_score', 'overall_compliance_score']
        
        for col in target_cols:
            self.assertNotIn(col, ml_features.columns)


class TestSampleData(unittest.TestCase):
    """Test cases for sample data generation."""
    
    def test_sample_data_creation(self):
        """Test sample data creation."""
        sample_data = create_sample_data()
        
        # Check basic structure
        self.assertIsInstance(sample_data, pd.DataFrame)
        self.assertEqual(len(sample_data), 100)  # Default size
        
        # Check required columns
        required_columns = [
            'udise_code', 'school_name', 'state', 'district', 'block',
            'total_students', 'total_teachers', 'total_classrooms'
        ]
        
        for col in required_columns:
            self.assertIn(col, sample_data.columns)
        
        # Check data types
        self.assertTrue(pd.api.types.is_numeric_dtype(sample_data['total_students']))
        self.assertTrue(pd.api.types.is_numeric_dtype(sample_data['total_teachers']))
        self.assertTrue(pd.api.types.is_numeric_dtype(sample_data['total_classrooms']))
        
        # Check value ranges
        self.assertTrue(all(sample_data['total_students'] > 0))
        self.assertTrue(all(sample_data['total_teachers'] > 0))
        self.assertTrue(all(sample_data['total_classrooms'] > 0))
    
    def test_sample_data_reproducibility(self):
        """Test that sample data generation is reproducible."""
        data1 = create_sample_data()
        data2 = create_sample_data()
        
        # Check that data is identical (same seed)
        pd.testing.assert_frame_equal(data1, data2)


if __name__ == '__main__':
    unittest.main()
