import os
import sys
import argparse
import logging
import json
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any
import warnings
warnings.filterwarnings('ignore')

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_model.features import SchoolFeatureEngineer, create_sample_data
import joblib
from sklearn.model_selection import KFold, train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.ensemble import StackingRegressor
import optuna
import xgboost as xgb
import lightgbm as lgb
import shap
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('reports/training.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class IntelliSchoolTrainer:
    """
    Main training class for IntelliSchool ML models.
    
    Handles:
    - Data loading and preprocessing
    - Feature engineering
    - Model training and tuning
    - Cross-validation
    - Model persistence
    - Performance reporting
    """
    
    def __init__(self, data_dir: str = "Data", models_dir: str = "models", reports_dir: str = "reports"):
        """Initialize the trainer with directory paths."""
        self.data_dir = data_dir
        self.models_dir = models_dir
        self.reports_dir = reports_dir
        self.feature_engineer = None
        self.best_models = {}
        self.cv_results = {}
        self.feature_importance = {}
        
        # Create directories if they don't exist
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.models_dir, exist_ok=True)
        os.makedirs(self.reports_dir, exist_ok=True)
        
        # Set random seeds for reproducibility
        np.random.seed(42)
        optuna.logging.set_verbosity(optuna.logging.WARNING)
        
    def load_data(self) -> pd.DataFrame:
        """Load and combine all CSV files from Data directory."""
        logger.info("Loading data from CSV files")
        
        csv_files = [f for f in os.listdir(self.data_dir) if f.endswith('.csv')]
        
        if not csv_files:
            logger.warning("No CSV files found in Data directory. Creating sample data.")
            sample_df = create_sample_data()
            sample_df.to_csv(os.path.join(self.data_dir, 'sample_schools.csv'), index=False)
            csv_files = ['sample_schools.csv']
        
        dataframes = []
        for csv_file in csv_files:
            try:
                file_path = os.path.join(self.data_dir, csv_file)
                df = pd.read_csv(file_path)
                logger.info(f"Loaded {csv_file}: {df.shape}")
                dataframes.append(df)
            except Exception as e:
                logger.error(f"Error loading {csv_file}: {e}")
        
        if not dataframes:
            raise ValueError("No valid CSV files could be loaded")
        
        # Combine all dataframes
        combined_df = pd.concat(dataframes, ignore_index=True)
        logger.info(f"Combined dataset shape: {combined_df.shape}")
        
        return combined_df
    
    def prepare_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Prepare data for training by engineering features and splitting."""
        logger.info("Preparing data for training")
        
        # Initialize feature engineer
        self.feature_engineer = SchoolFeatureEngineer()
        
        # Create features
        engineered_df = self.feature_engineer.create_features(df)
        
        # Split into train and test sets
        train_df, test_df = train_test_split(
            engineered_df, 
            test_size=0.2, 
            random_state=42,
            stratify=engineered_df['school_level'] if 'school_level' in engineered_df.columns else None
        )
        
        logger.info(f"Train set: {train_df.shape}, Test set: {test_df.shape}")
        
        # Save split datasets
        train_df.to_csv(os.path.join(self.data_dir, 'train.csv'), index=False)
        test_df.to_csv(os.path.join(self.data_dir, 'test.csv'), index=False)
        
        return train_df, test_df
    
    def objective_xgboost(self, trial: optuna.Trial, X: pd.DataFrame, y: pd.Series, cv_folds: int = 5) -> float:
        """Optuna objective function for XGBoost hyperparameter tuning."""
        
        # Define hyperparameter search space
        params = {
            'n_estimators': trial.suggest_int('n_estimators', 100, 1000),
            'max_depth': trial.suggest_int('max_depth', 3, 10),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
            'subsample': trial.suggest_float('subsample', 0.6, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
            'min_child_weight': trial.suggest_int('min_child_weight', 1, 7),
            'gamma': trial.suggest_float('gamma', 0, 5),
            'reg_alpha': trial.suggest_float('reg_alpha', 0, 10),
            'reg_lambda': trial.suggest_float('reg_lambda', 0, 10),
            'random_state': 42,
            'n_jobs': -1
        }
        
        # Cross-validation
        kf = KFold(n_splits=cv_folds, shuffle=True, random_state=42)
        cv_scores = []
        
        for train_idx, val_idx in kf.split(X):
            X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
            y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
            
            model = xgb.XGBRegressor(**params)
            model.fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                verbose=False
            )
            
            y_pred = model.predict(X_val)
            rmse = np.sqrt(mean_squared_error(y_val, y_pred))
            cv_scores.append(rmse)
        
        return np.mean(cv_scores)
    
    def objective_lightgbm(self, trial: optuna.Trial, X: pd.DataFrame, y: pd.Series, cv_folds: int = 5) -> float:
        """Optuna objective function for LightGBM hyperparameter tuning."""
        
        # Define hyperparameter search space
        params = {
            'n_estimators': trial.suggest_int('n_estimators', 100, 1000),
            'max_depth': trial.suggest_int('max_depth', 3, 10),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
            'subsample': trial.suggest_float('subsample', 0.6, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
            'min_child_samples': trial.suggest_int('min_child_samples', 5, 100),
            'reg_alpha': trial.suggest_float('reg_alpha', 0, 10),
            'reg_lambda': trial.suggest_float('reg_lambda', 0, 10),
            'random_state': 42,
            'n_jobs': -1,
            'verbose': -1
        }
        
        # Cross-validation
        kf = KFold(n_splits=cv_folds, shuffle=True, random_state=42)
        cv_scores = []
        
        for train_idx, val_idx in kf.split(X):
            X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
            y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
            
            model = lgb.LGBMRegressor(**params)
            model.fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                callbacks=[lgb.early_stopping(50), lgb.log_evaluation(0)]
            )
            
            y_pred = model.predict(X_val)
            rmse = np.sqrt(mean_squared_error(y_val, y_pred))
            cv_scores.append(rmse)
        
        return np.mean(cv_scores)
    
    def train_xgboost(self, X: pd.DataFrame, y: pd.Series, n_trials: int = 100) -> xgb.XGBRegressor:
        """Train XGBoost model with Optuna hyperparameter tuning."""
        logger.info("Training XGBoost model with Optuna tuning")
        
        study = optuna.create_study(direction='minimize')
        study.optimize(
            lambda trial: self.objective_xgboost(trial, X, y),
            n_trials=n_trials,
            show_progress_bar=True
        )
        
        # Get best parameters and train final model
        best_params = study.best_params
        best_params.update({'random_state': 42, 'n_jobs': -1})
        
        logger.info(f"Best XGBoost parameters: {best_params}")
        
        # Train final model with best parameters
        final_model = xgb.XGBRegressor(**best_params)
        final_model.fit(X, y)
        
        self.best_models['xgboost'] = final_model
        self.best_models['xgboost_params'] = best_params
        
        return final_model
    
    def train_lightgbm(self, X: pd.DataFrame, y: pd.Series, n_trials: int = 100) -> lgb.LGBMRegressor:
        """Train LightGBM model with Optuna hyperparameter tuning."""
        logger.info("Training LightGBM model with Optuna tuning")
        
        study = optuna.create_study(direction='minimize')
        study.optimize(
            lambda trial: self.objective_lightgbm(trial, X, y),
            n_trials=n_trials,
            show_progress_bar=True
        )
        
        # Get best parameters and train final model
        best_params = study.best_params
        best_params.update({'random_state': 42, 'n_jobs': -1, 'verbose': -1})
        
        logger.info(f"Best LightGBM parameters: {best_params}")
        
        # Train final model with best parameters
        final_model = lgb.LGBMRegressor(**best_params)
        final_model.fit(X, y)
        
        self.best_models['lightgbm'] = final_model
        self.best_models['lightgbm_params'] = best_params
        
        return final_model
    
    def create_stacked_ensemble(self, X: pd.DataFrame, y: pd.DataFrame, 
                               base_models: Dict[str, Any]) -> StackingRegressor:
        """Create a stacked ensemble of the best models."""
        logger.info("Creating stacked ensemble")
        
        # Prepare base models for stacking
        base_models_list = [
            ('xgboost', base_models['xgboost']),
            ('lightgbm', base_models['lightgbm'])
        ]
        
        # Create meta-model (small XGBoost)
        meta_model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=3,
            learning_rate=0.1,
            random_state=42,
            n_jobs=-1
        )
        
        # Create stacking regressor
        stacked_model = StackingRegressor(
            estimators=base_models_list,
            final_estimator=meta_model,
            cv=5,
            n_jobs=-1
        )
        
        # Train stacked model
        stacked_model.fit(X, y)
        
        self.best_models['stacked'] = stacked_model
        
        return stacked_model
    
    def evaluate_models(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, Dict[str, float]]:
        """Evaluate all trained models on the test set."""
        logger.info("Evaluating models on test set")
        
        results = {}
        
        for model_name, model in self.best_models.items():
            if model_name in ['xgboost_params', 'lightgbm_params']:
                continue
                
            y_pred = model.predict(X)
            
            results[model_name] = {
                'rmse': np.sqrt(mean_squared_error(y, y_pred)),
                'mae': mean_absolute_error(y, y_pred),
                'r2': r2_score(y, y_pred)
            }
            
            logger.info(f"{model_name} - RMSE: {results[model_name]['rmse']:.4f}, "
                       f"MAE: {results[model_name]['mae']:.4f}, "
                       f"R²: {results[model_name]['r2']:.4f}")
        
        self.cv_results = results
        return results
    
    def create_shap_explainer(self, X: pd.DataFrame) -> shap.TreeExplainer:
        """Create SHAP explainer for the best model."""
        logger.info("Creating SHAP explainer")
        
        # Use XGBoost as primary model for SHAP
        best_model = self.best_models.get('xgboost')
        if best_model is None:
            raise ValueError("No XGBoost model found for SHAP explanation")
        
        # Create TreeExplainer
        explainer = shap.TreeExplainer(best_model)
        
        # Calculate SHAP values for feature importance
        shap_values = explainer.shap_values(X)
        
        # Store feature importance
        feature_names = X.columns.tolist()
        importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': np.abs(shap_values).mean(0)
        }).sort_values('importance', ascending=False)
        
        self.feature_importance = importance_df
        
        return explainer
    
    def generate_reports(self, X: pd.DataFrame, y: pd.Series):
        """Generate comprehensive training reports."""
        logger.info("Generating training reports")
        
        # Save model selection report
        self._save_model_selection_report()
        
        # Save feature importance plot
        self._save_feature_importance_plot()
        
        # Save SHAP summary plot
        self._save_shap_summary_plot(X)
        
        # Save environment versions
        self._save_environment_versions()
        
        # Save cross-validation results
        self._save_cv_results()
    
    def _save_model_selection_report(self):
        """Save model selection report."""
        report = {
            'timestamp': datetime.now().isoformat(),
            'models_trained': list(self.best_models.keys()),
            'best_parameters': {
                'xgboost': self.best_models.get('xgboost_params', {}),
                'lightgbm': self.best_models.get('lightgbm_params', {})
            },
            'cross_validation_results': self.cv_results
        }
        
        report_path = os.path.join(self.reports_dir, 'model_selection_report.json')
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"Model selection report saved to {report_path}")
    
    def _save_feature_importance_plot(self):
        """Save feature importance plot."""
        if not self.feature_importance.empty:
            plt.figure(figsize=(12, 8))
            top_features = self.feature_importance.head(20)
            
            sns.barplot(data=top_features, x='importance', y='feature')
            plt.title('Top 20 Feature Importance (SHAP)')
            plt.xlabel('SHAP Importance')
            plt.tight_layout()
            
            plot_path = os.path.join(self.reports_dir, 'feature_importance.png')
            plt.savefig(plot_path, dpi=300, bbox_inches='tight')
            plt.close()
            
            logger.info(f"Feature importance plot saved to {plot_path}")
    
    def _save_shap_summary_plot(self, X: pd.DataFrame):
        """Save SHAP summary plot."""
        try:
            best_model = self.best_models.get('xgboost')
            if best_model is not None:
                explainer = shap.TreeExplainer(best_model)
                shap_values = explainer.shap_values(X)
                
                plt.figure(figsize=(12, 8))
                shap.summary_plot(shap_values, X, show=False)
                plt.tight_layout()
                
                plot_path = os.path.join(self.reports_dir, 'shap_summary.png')
                plt.savefig(plot_path, dpi=300, bbox_inches='tight')
                plt.close()
                
                logger.info(f"SHAP summary plot saved to {plot_path}")
        except Exception as e:
            logger.warning(f"Could not generate SHAP summary plot: {e}")
    
    def _save_environment_versions(self):
        """Save environment and dependency versions."""
        versions = {
            'timestamp': datetime.now().isoformat(),
            'python_version': sys.version,
            'packages': {}
        }
        
        # Get package versions
        packages = [
            'numpy', 'pandas', 'scikit-learn', 'xgboost', 'lightgbm',
            'optuna', 'shap', 'matplotlib', 'seaborn'
        ]
        
        for package in packages:
            try:
                import importlib.metadata
                version = importlib.metadata.version(package)
                versions['packages'][package] = version
            except:
                versions['packages'][package] = 'unknown'
        
        versions_path = os.path.join(self.reports_dir, 'env_versions.txt')
        with open(versions_path, 'w') as f:
            for key, value in versions.items():
                if key == 'packages':
                    f.write(f"\n{key}:\n")
                    for pkg, ver in value.items():
                        f.write(f"  {pkg}: {ver}\n")
                else:
                    f.write(f"{key}: {value}\n")
        
        logger.info(f"Environment versions saved to {versions_path}")
    
    def _save_cv_results(self):
        """Save cross-validation results."""
        if self.cv_results:
            results_path = os.path.join(self.reports_dir, 'cv_results.csv')
            
            results_list = []
            for model_name, metrics in self.cv_results.items():
                metrics['model'] = model_name
                results_list.append(metrics)
            
            results_df = pd.DataFrame(results_list)
            results_df.to_csv(results_path, index=False)
            
            logger.info(f"Cross-validation results saved to {results_path}")
    
    def save_models(self):
        """Save all trained models and preprocessing pipeline."""
        logger.info("Saving models and preprocessing pipeline")
        
        # Save preprocessing pipeline
        if self.feature_engineer:
            pipeline_path = os.path.join(self.models_dir, 'preprocessing_pipeline.joblib')
            self.feature_engineer.save_preprocessing_pipeline(pipeline_path)
        
        # Save best model (XGBoost)
        if 'xgboost' in self.best_models:
            model_path = os.path.join(self.models_dir, 'best_model.joblib')
            joblib.dump(self.best_models['xgboost'], model_path)
            logger.info(f"Best model saved to {model_path}")
        
        # Save SHAP explainer
        if 'xgboost' in self.best_models:
            try:
                explainer = shap.TreeExplainer(self.best_models['xgboost'])
                explainer_path = os.path.join(self.models_dir, 'shap_explainer.joblib')
                joblib.dump(explainer, explainer_path)
                logger.info(f"SHAP explainer saved to {explainer_path}")
            except Exception as e:
                logger.warning(f"Could not save SHAP explainer: {e}")
        
        # Save all models for comparison
        all_models_path = os.path.join(self.models_dir, 'all_models.joblib')
        joblib.dump(self.best_models, all_models_path)
        logger.info(f"All models saved to {all_models_path}")
    
    def run_training_pipeline(self, n_trials: int = 100, quick_mode: bool = False):
        """Run the complete training pipeline."""
        logger.info("Starting IntelliSchool training pipeline")
        
        try:
            # Load data
            df = self.load_data()
            
            # Prepare data
            train_df, test_df = self.prepare_data(df)
            
            # Get ML features
            X_train = self.feature_engineer.get_ml_features(train_df)
            y_train = train_df['infrastructure_need_score']
            X_test = self.feature_engineer.get_ml_features(test_df)
            y_test = test_df['infrastructure_need_score']
            
            # Adjust trials for quick mode
            if quick_mode:
                n_trials = min(20, n_trials)
                logger.info(f"Quick mode: using {n_trials} trials")
            
            # Train XGBoost
            self.train_xgboost(X_train, y_train, n_trials)
            
            # Train LightGBM
            self.train_lightgbm(X_train, y_train, n_trials)
            
            # Create stacked ensemble
            self.create_stacked_ensemble(X_train, y_train, self.best_models)
            
            # Evaluate models
            self.evaluate_models(X_test, y_test)
            
            # Create SHAP explainer
            self.create_shap_explainer(X_test)
            
            # Generate reports
            self.generate_reports(X_test, y_test)
            
            # Save models
            self.save_models()
            
            logger.info("Training pipeline completed successfully!")
            
        except Exception as e:
            logger.error(f"Training pipeline failed: {e}")
            raise


def main():
    """Main function to run the training pipeline."""
    parser = argparse.ArgumentParser(description='IntelliSchool ML Training Pipeline')
    parser.add_argument('--trials', type=int, default=100, help='Number of Optuna trials')
    parser.add_argument('--quick', action='store_true', help='Quick mode with fewer trials')
    parser.add_argument('--retrain', action='store_true', help='Retrain existing models')
    
    args = parser.parse_args()
    
    # Initialize trainer
    trainer = IntelliSchoolTrainer()
    
    # Run training pipeline
    trainer.run_training_pipeline(
        n_trials=args.trials,
        quick_mode=args.quick
    )


if __name__ == "__main__":
    main()
