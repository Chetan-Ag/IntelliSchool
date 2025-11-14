import os
import sys
import argparse
import logging
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime
import json

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from predictor_service import IntelliSchoolPredictor
from ai_model.features import SchoolFeatureEngineer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('reports/batch_processing.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class IntelliSchoolBatchProcessor:
    """
    Batch processor for multiple school infrastructure assessments.
    
    Handles:
    - Loading multiple CSV files
    - Batch predictions
    - Prioritization and ranking
    - Report generation
    - Export functionality
    """
    
    def __init__(self, data_dir: str = "Data", reports_dir: str = "reports"):
        """Initialize the batch processor."""
        self.data_dir = data_dir
        self.reports_dir = reports_dir
        self.predictor = IntelliSchoolPredictor()
        self.feature_engineer = SchoolFeatureEngineer()
        
        # Create directories if they don't exist
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.reports_dir, exist_ok=True)
        
        logger.info("Batch processor initialized successfully")
    
    def load_all_schools(self) -> pd.DataFrame:
        """Load and combine all school data from CSV files."""
        logger.info("Loading all school data from CSV files")
        
        csv_files = [f for f in os.listdir(self.data_dir) if f.endswith('.csv')]
        
        if not csv_files:
            logger.warning("No CSV files found in Data directory")
            return pd.DataFrame()
        
        all_schools = []
        
        for csv_file in csv_files:
            try:
                file_path = os.path.join(self.data_dir, csv_file)
                df = pd.read_csv(file_path)
                df['source_file'] = csv_file
                all_schools.append(df)
                logger.info(f"Loaded {csv_file}: {df.shape}")
            except Exception as e:
                logger.error(f"Error loading {csv_file}: {e}")
        
        if not all_schools:
            logger.error("No valid CSV files could be loaded")
            return pd.DataFrame()
        
        # Combine all dataframes
        combined_df = pd.concat(all_schools, ignore_index=True)
        logger.info(f"Combined dataset: {combined_df.shape}")
        
        return combined_df
    
    def process_schools_batch(self, schools_df: pd.DataFrame) -> pd.DataFrame:
        """Process all schools and generate infrastructure assessments."""
        logger.info(f"Processing {len(schools_df)} schools in batch")
        
        results = []
        
        for idx, school in schools_df.iterrows():
            try:
                # Convert to dict for prediction
                school_dict = school.to_dict()
                
                # Make prediction
                prediction = self.predictor.predict_school(school_dict)
                
                # Add prediction results to school data
                school_with_prediction = school_dict.copy()
                school_with_prediction.update(prediction)
                
                results.append(school_with_prediction)
                
                if (idx + 1) % 10 == 0:
                    logger.info(f"Processed {idx + 1}/{len(schools_df)} schools")
                    
            except Exception as e:
                logger.error(f"Error processing school {idx}: {e}")
                # Add error information
                school_dict['error'] = str(e)
                school_dict['infrastructure_need_score'] = None
                school_dict['compliant_flag'] = None
                results.append(school_dict)
        
        # Convert to DataFrame
        results_df = pd.DataFrame(results)
        logger.info(f"Batch processing complete. Results shape: {results_df.shape}")
        
        return results_df
    
    def prioritize_schools(self, results_df: pd.DataFrame) -> pd.DataFrame:
        """Prioritize schools based on infrastructure need score and other factors."""
        logger.info("Prioritizing schools based on infrastructure needs")
        
        # Filter out schools with errors
        valid_results = results_df[results_df['error'].isna()].copy()
        
        if len(valid_results) == 0:
            logger.warning("No valid results to prioritize")
            return results_df
        
        # Calculate priority score (weighted combination of factors)
        valid_results['priority_score'] = (
            valid_results['infrastructure_need_score'] * 0.6 +  # Main factor
            (1 - valid_results['overall_compliance_score']) * 0.3 +  # Compliance factor
            valid_results['total_students'] / 1000 * 0.1  # Student count factor
        )
        
        # Sort by priority score (descending)
        valid_results = valid_results.sort_values('priority_score', ascending=False)
        
        # Add priority rank
        valid_results['priority_rank'] = range(1, len(valid_results) + 1)
        
        # Recombine with error schools
        error_schools = results_df[results_df['error'].notna()].copy()
        error_schools['priority_score'] = None
        error_schools['priority_rank'] = None
        
        prioritized_df = pd.concat([valid_results, error_schools], ignore_index=True)
        
        logger.info(f"Prioritization complete. Top priority school: {prioritized_df.iloc[0]['school_name']}")
        
        return prioritized_df
    
    def generate_summary_report(self, results_df: pd.DataFrame) -> Dict[str, Any]:
        """Generate summary statistics and insights."""
        logger.info("Generating summary report")
        
        # Filter valid results
        valid_results = results_df[results_df['error'].isna()]
        
        if len(valid_results) == 0:
            return {"error": "No valid results to analyze"}
        
        summary = {
            "total_schools": len(results_df),
            "valid_schools": len(valid_results),
            "error_schools": len(results_df) - len(valid_results),
            "timestamp": datetime.now().isoformat(),
            "statistics": {
                "infrastructure_need_score": {
                    "mean": float(valid_results['infrastructure_need_score'].mean()),
                    "median": float(valid_results['infrastructure_need_score'].median()),
                    "std": float(valid_results['infrastructure_need_score'].std()),
                    "min": float(valid_results['infrastructure_need_score'].min()),
                    "max": float(valid_results['infrastructure_need_score'].max())
                },
                "compliance_rate": float(valid_results['compliant_flag'].mean() * 100),
                "total_students": int(valid_results['total_students'].sum()),
                "total_teachers": int(valid_results['total_teachers'].sum())
            },
            "top_priorities": []
        }
        
        # Get top 10 priority schools
        top_schools = valid_results.head(10)
        for _, school in top_schools.iterrows():
            summary["top_priorities"].append({
                "rank": int(school['priority_rank']),
                "school_name": school['school_name'],
                "udise_code": school['udise_code'],
                "state": school['state'],
                "district": school['district'],
                "infrastructure_need_score": float(school['infrastructure_need_score']),
                "priority_score": float(school['priority_score']),
                "deficiencies": school['deficiencies'],
                "total_students": int(school['total_students'])
            })
        
        # Deficiency analysis
        all_deficiencies = []
        for deficiencies in valid_results['deficiencies']:
            if isinstance(deficiencies, list):
                all_deficiencies.extend(deficiencies)
        
        deficiency_counts = pd.Series(all_deficiencies).value_counts()
        summary["deficiency_analysis"] = deficiency_counts.to_dict()
        
        # State-wise analysis
        state_analysis = valid_results.groupby('state').agg({
            'infrastructure_need_score': ['mean', 'count'],
            'total_students': 'sum'
        }).round(4)
        
        summary["state_analysis"] = state_analysis.to_dict()
        
        logger.info("Summary report generated successfully")
        return summary
    
    def export_results(self, results_df: pd.DataFrame, summary: Dict[str, Any]) -> List[str]:
        """Export results to various formats."""
        logger.info("Exporting results to files")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        exported_files = []
        
        try:
            # Export full results to CSV
            csv_filename = f"batch_results_{timestamp}.csv"
            csv_path = os.path.join(self.reports_dir, csv_filename)
            results_df.to_csv(csv_path, index=False)
            exported_files.append(csv_path)
            logger.info(f"Full results exported to {csv_filename}")
            
            # Export top priority schools to CSV
            top_schools = results_df[results_df['priority_rank'].notna()].head(50)
            top_csv_filename = f"top_priorities_{timestamp}.csv"
            top_csv_path = os.path.join(self.reports_dir, top_csv_filename)
            top_schools.to_csv(top_csv_path, index=False)
            exported_files.append(top_csv_path)
            logger.info(f"Top priorities exported to {top_csv_filename}")
            
            # Export summary report to JSON
            summary_filename = f"summary_report_{timestamp}.json"
            summary_path = os.path.join(self.reports_dir, summary_filename)
            with open(summary_path, 'w') as f:
                json.dump(summary, f, indent=2, default=str)
            exported_files.append(summary_path)
            logger.info(f"Summary report exported to {summary_filename}")
            
            # Export summary report to CSV (flattened)
            summary_csv_filename = f"summary_report_{timestamp}.csv"
            summary_csv_path = os.path.join(self.reports_dir, summary_csv_filename)
            
            # Create flattened summary for CSV
            summary_rows = []
            for key, value in summary.items():
                if isinstance(value, dict):
                    for subkey, subvalue in value.items():
                        if isinstance(subvalue, dict):
                            for subsubkey, subsubvalue in subvalue.items():
                                summary_rows.append({
                                    'category': key,
                                    'subcategory': subkey,
                                    'metric': subsubkey,
                                    'value': subsubvalue
                                })
                        else:
                            summary_rows.append({
                                'category': key,
                                'subcategory': subkey,
                                'metric': 'value',
                                'value': subvalue
                            })
                else:
                    summary_rows.append({
                        'category': key,
                        'subcategory': 'main',
                        'metric': 'value',
                        'value': value
                    })
            
            summary_df = pd.DataFrame(summary_rows)
            summary_df.to_csv(summary_csv_path, index=False)
            exported_files.append(summary_csv_path)
            logger.info(f"Summary report CSV exported to {summary_filename}")
            
        except Exception as e:
            logger.error(f"Error exporting results: {e}")
        
        return exported_files
    
    def run_batch_processing(self) -> Dict[str, Any]:
        """Run the complete batch processing pipeline."""
        logger.info("Starting batch processing pipeline")
        
        try:
            # Step 1: Load all schools
            schools_df = self.load_all_schools()
            if schools_df.empty:
                return {"error": "No school data found"}
            
            # Step 2: Process schools in batch
            results_df = self.process_schools_batch(schools_df)
            
            # Step 3: Prioritize schools
            prioritized_df = self.prioritize_schools(results_df)
            
            # Step 4: Generate summary report
            summary = self.generate_summary_report(prioritized_df)
            
            # Step 5: Export results
            exported_files = self.export_results(prioritized_df, summary)
            
            # Step 6: Return results
            return {
                "success": True,
                "total_schools": len(schools_df),
                "processed_schools": len(results_df),
                "valid_results": len(results_df[results_df['error'].isna()]),
                "exported_files": exported_files,
                "summary": summary
            }
            
        except Exception as e:
            logger.error(f"Batch processing failed: {e}")
            return {"error": str(e)}


def main():
    """Main function for command-line execution."""
    parser = argparse.ArgumentParser(description='IntelliSchool Batch Processing')
    parser.add_argument('--data-dir', default='Data', help='Directory containing CSV files')
    parser.add_argument('--reports-dir', default='reports', help='Directory for output reports')
    parser.add_argument('--export-only', action='store_true', help='Only export existing results')
    
    args = parser.parse_args()
    
    # Initialize processor
    processor = IntelliSchoolBatchProcessor(
        data_dir=args.data_dir,
        reports_dir=args.reports_dir
    )
    
    if args.export_only:
        # Load existing results and export only
        logger.info("Export-only mode: loading existing results")
        # This would need to be implemented based on how results are stored
        pass
    else:
        # Run full batch processing
        logger.info("Running full batch processing pipeline")
        results = processor.run_batch_processing()
        
        if results.get('success'):
            print(f"\n✅ Batch processing completed successfully!")
            print(f"📊 Processed {results['total_schools']} schools")
            print(f"📈 Valid results: {results['valid_results']}")
            print(f"📁 Exported files: {len(results['exported_files'])}")
            
            if 'summary' in results:
                summary = results['summary']
                print(f"\n🏆 Top Priority School: {summary['top_priorities'][0]['school_name']}")
                print(f"📍 Location: {summary['top_priorities'][0]['state']}, {summary['top_priorities'][0]['district']}")
                print(f"📊 Need Score: {summary['top_priorities'][0]['infrastructure_need_score']:.3f}")
                print(f"👥 Students: {summary['top_priorities'][0]['total_students']}")
        else:
            print(f"\n❌ Batch processing failed: {results.get('error', 'Unknown error')}")


if __name__ == "__main__":
    main()
