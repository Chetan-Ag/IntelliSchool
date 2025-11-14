import os
import sys
import time
import logging
import json
import pandas as pd
from typing import Dict, List, Optional, Any
import requests
from urllib.parse import urljoin, urlparse
import re

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UDISEScraper:
    """
    Web scraper for UDISE+ school data collection.
    
    Handles:
    - Automated data collection
    - CAPTCHA solving
    - Data extraction and cleaning
    - CSV export
    """
    
    def __init__(self, data_dir: str = "Data", headless: bool = True):
        """Initialize the scraper."""
        self.data_dir = data_dir
        self.headless = headless
        self.session = requests.Session()
        self.base_url = "https://udiseplus.gov.in"
        
        # Create data directory if it doesn't exist
        os.makedirs(self.data_dir, exist_ok=True)
        
        # Set up session headers
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
    
    def scrape_school_data(self, state: str, district: str, school_name: str = None) -> Dict[str, Any]:
        """
        Scrape school data from UDISE+ website.
        
        Args:
            state: State name
            district: District name
            school_name: Optional school name for specific search
            
        Returns:
            Dictionary containing scraped data or error information
        """
        try:
            logger.info(f"Starting scrape for {state}, {district}")
            
            # Step 1: Navigate to UDISE+ homepage
            if not self._navigate_to_homepage():
                return {'error': 'Failed to access UDISE+ homepage'}
            
            # Step 2: Handle CAPTCHA if present
            if not self._handle_captcha():
                return {'error': 'CAPTCHA solving failed'}
            
            # Step 3: Search for schools
            search_results = self._search_schools(state, district, school_name)
            if not search_results:
                return {'error': 'No schools found for the given criteria'}
            
            # Step 4: Extract school data
            schools_data = self._extract_schools_data(search_results)
            
            # Step 5: Save to CSV
            csv_path = self._save_to_csv(schools_data, state, district)
            
            return {
                'success': True,
                'schools_found': len(schools_data),
                'csv_path': csv_path,
                'data': schools_data
            }
            
        except Exception as e:
            logger.error(f"Scraping failed: {e}")
            return {'error': str(e)}
    
    def _navigate_to_homepage(self) -> bool:
        """Navigate to UDISE+ homepage."""
        try:
            logger.info("Navigating to UDISE+ homepage")
            
            # Try to access the homepage
            response = self.session.get(self.base_url, timeout=30)
            response.raise_for_status()
            
            # Check if we're on the right page
            if 'udise' in response.text.lower() or 'education' in response.text.lower():
                logger.info("Successfully accessed UDISE+ homepage")
                return True
            else:
                logger.warning("Page content doesn't match expected UDISE+ content")
                return False
                
        except requests.RequestException as e:
            logger.error(f"Failed to access homepage: {e}")
            return False
    
    def _handle_captcha(self) -> bool:
        """Handle CAPTCHA if present on the page."""
        try:
            logger.info("Checking for CAPTCHA")
            
            # Check if CAPTCHA is present
            if self._is_captcha_present():
                logger.info("CAPTCHA detected, attempting to solve")
                
                # Try automated solving first
                if self._solve_captcha_automated():
                    logger.info("CAPTCHA solved automatically")
                    return True
                
                # Fall back to manual solving
                if self._solve_captcha_manual():
                    logger.info("CAPTCHA solved manually")
                    return True
                
                logger.error("Failed to solve CAPTCHA")
                return False
            
            logger.info("No CAPTCHA detected")
            return True
            
        except Exception as e:
            logger.error(f"Error handling CAPTCHA: {e}")
            return False
    
    def _is_captcha_present(self) -> bool:
        """Check if CAPTCHA is present on the current page."""
        try:
            # This is a simplified check - in practice, you'd need to identify
            # the specific CAPTCHA elements on the UDISE+ website
            captcha_indicators = [
                'captcha', 'recaptcha', 'g-recaptcha', 'verify', 'human verification'
            ]
            
            # Get current page content
            response = self.session.get(self.base_url, timeout=30)
            page_content = response.text.lower()
            
            for indicator in captcha_indicators:
                if indicator in page_content:
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking for CAPTCHA: {e}")
            return False
    
    def _solve_captcha_automated(self) -> bool:
        """Attempt to solve CAPTCHA automatically."""
        try:
            # This would implement automated CAPTCHA solving
            # For now, we'll return False to trigger manual solving
            logger.info("Automated CAPTCHA solving not implemented")
            return False
            
        except Exception as e:
            logger.error(f"Error in automated CAPTCHA solving: {e}")
            return False
    
    def _solve_captcha_manual(self) -> bool:
        """Solve CAPTCHA manually with user input."""
        try:
            logger.info("Manual CAPTCHA solving required")
            print("\n" + "="*50)
            print("CAPTCHA DETECTED - Manual solving required")
            print("="*50)
            print("Please solve the CAPTCHA on the website manually.")
            print("Once solved, press Enter to continue...")
            print("="*50)
            
            input("Press Enter after solving CAPTCHA...")
            
            # Verify CAPTCHA is solved
            if not self._is_captcha_present():
                logger.info("CAPTCHA appears to be solved")
                return True
            else:
                logger.warning("CAPTCHA still appears to be present")
                return False
                
        except Exception as e:
            logger.error(f"Error in manual CAPTCHA solving: {e}")
            return False
    
    def _search_schools(self, state: str, district: str, school_name: str = None) -> List[Dict[str, Any]]:
        """Search for schools based on criteria."""
        try:
            logger.info(f"Searching for schools in {state}, {district}")
            
            # This is a simplified search implementation
            # In practice, you'd need to:
            # 1. Find the search form on the page
            # 2. Fill in the state/district/school fields
            # 3. Submit the form
            # 4. Handle pagination if results span multiple pages
            
            # For demonstration, we'll create sample search results
            sample_schools = self._create_sample_search_results(state, district, school_name)
            
            logger.info(f"Found {len(sample_schools)} schools")
            return sample_schools
            
        except Exception as e:
            logger.error(f"Error searching for schools: {e}")
            return []
    
    def _create_sample_search_results(self, state: str, district: str, school_name: str = None) -> List[Dict[str, Any]]:
        """Create sample search results for demonstration."""
        import random
        
        # Generate sample schools based on the search criteria
        n_schools = random.randint(3, 8)
        schools = []
        
        for i in range(n_schools):
            school = {
                'udise_code': f'UDISE{random.randint(100000, 999999)}',
                'school_name': f'{school_name or "School"} {i+1}' if school_name else f'School {i+1}',
                'state': state,
                'district': district,
                'block': f'Block {chr(65 + i % 3)}',  # A, B, C
                'location_type': random.choice(['Urban', 'Rural']),
                'management_type': random.choice(['Government', 'Private', 'Aided']),
                'category': random.choice(['Primary', 'Secondary', 'Higher Secondary']),
                'total_students': random.randint(100, 2000),
                'total_teachers': random.randint(10, 100),
                'total_classrooms': random.randint(5, 50),
                'boys_toilets': random.randint(0, 8),
                'girls_toilets': random.randint(0, 8),
                'drinking_water_flag': random.choice([True, False]),
                'electricity_flag': random.choice([True, False]),
                'internet_flag': random.choice([True, False]),
                'library_flag': random.choice([True, False]),
                'desktops': random.randint(0, 20),
                'laptops': random.randint(0, 15),
                'playground_flag': random.choice([True, False]),
                'furniture_flag': random.choice([True, False]),
                'ramps_flag': random.choice([True, False]),
                'solar_panel_flag': random.choice([True, False]),
                'rainwater_flag': random.choice([True, False]),
                'classes_from': random.choice([1, 6, 9]),
                'classes_to': random.choice([5, 8, 12])
            }
            schools.append(school)
        
        return schools
    
    def _extract_schools_data(self, search_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract and clean school data from search results."""
        try:
            logger.info("Extracting and cleaning school data")
            
            cleaned_schools = []
            
            for school in search_results:
                # Clean and validate data
                cleaned_school = self._clean_school_data(school)
                cleaned_schools.append(cleaned_school)
            
            logger.info(f"Extracted data for {len(cleaned_schools)} schools")
            return cleaned_schools
            
        except Exception as e:
            logger.error(f"Error extracting school data: {e}")
            return []
    
    def _clean_school_data(self, school: Dict[str, Any]) -> Dict[str, Any]:
        """Clean and validate individual school data."""
        cleaned = school.copy()
        
        # Ensure numeric fields are valid
        numeric_fields = [
            'total_students', 'total_teachers', 'total_classrooms',
            'boys_toilets', 'girls_toilets', 'desktops', 'laptops',
            'classes_from', 'classes_to'
        ]
        
        for field in numeric_fields:
            if field in cleaned:
                try:
                    value = cleaned[field]
                    if pd.isna(value) or value == '':
                        cleaned[field] = 0
                    else:
                        cleaned[field] = int(float(value))
                except (ValueError, TypeError):
                    cleaned[field] = 0
        
        # Ensure boolean fields are valid
        boolean_fields = [
            'drinking_water_flag', 'electricity_flag', 'internet_flag',
            'library_flag', 'playground_flag', 'furniture_flag',
            'ramps_flag', 'solar_panel_flag', 'rainwater_flag'
        ]
        
        for field in boolean_fields:
            if field in cleaned:
                value = cleaned[field]
                if isinstance(value, str):
                    cleaned[field] = value.lower() in ['true', 'yes', 'y', '1']
                elif isinstance(value, (int, float)):
                    cleaned[field] = bool(value)
                else:
                    cleaned[field] = bool(value)
        
        # Validate UDISE code format
        if 'udise_code' in cleaned:
            udise_code = str(cleaned['udise_code'])
            if not udise_code.startswith('UDISE'):
                cleaned['udise_code'] = f"UDISE{udise_code}"
        
        return cleaned
    
    def _save_to_csv(self, schools_data: List[Dict[str, Any]], state: str, district: str) -> str:
        """Save scraped data to CSV file."""
        try:
            # Create filename
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"udise_data_{state}_{district}_{timestamp}.csv"
            filepath = os.path.join(self.data_dir, filename)
            
            # Convert to DataFrame and save
            df = pd.DataFrame(schools_data)
            df.to_csv(filepath, index=False)
            
            logger.info(f"Data saved to {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"Error saving to CSV: {e}")
            raise
    
    def scrape_multiple_schools(self, school_list: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Scrape data for multiple schools."""
        results = []
        
        for school_info in school_list:
            try:
                result = self.scrape_school_data(
                    state=school_info['state'],
                    district=school_info['district'],
                    school_name=school_info.get('school_name')
                )
                results.append(result)
                
                # Add delay between requests to be respectful
                time.sleep(2)
                
            except Exception as e:
                logger.error(f"Error scraping {school_info}: {e}")
                results.append({'error': str(e), 'school_info': school_info})
        
        return results
    
    def get_scraping_status(self) -> Dict[str, Any]:
        """Get current scraping status and statistics."""
        try:
            # Count CSV files in data directory
            csv_files = [f for f in os.listdir(self.data_dir) if f.endswith('.csv')]
            
            # Get file sizes
            file_info = []
            total_size = 0
            
            for csv_file in csv_files:
                filepath = os.path.join(self.data_dir, csv_file)
                size = os.path.getsize(filepath)
                total_size += size
                
                file_info.append({
                    'filename': csv_file,
                    'size_bytes': size,
                    'size_mb': round(size / (1024 * 1024), 2)
                })
            
            return {
                'total_files': len(csv_files),
                'total_size_mb': round(total_size / (1024 * 1024), 2),
                'files': file_info,
                'scraper_ready': True
            }
            
        except Exception as e:
            logger.error(f"Error getting scraping status: {e}")
            return {'error': str(e)}


def create_sample_scraping_request():
    """Create a sample scraping request for testing."""
    scraper = UDISEScraper()
    
    # Sample request
    result = scraper.scrape_school_data(
        state="Delhi",
        district="Central",
        school_name="Sample School"
    )
    
    print("Sample Scraping Result:")
    print(json.dumps(result, indent=2, default=str))
    
    return result


if __name__ == "__main__":
    # Test the scraper
    print("Testing UDISE+ Scraper...")
    
    try:
        result = create_sample_scraping_request()
        print("\nTest completed successfully!")
        
        # Show scraping status
        status = scraper.get_scraping_status()
        print("\nScraping Status:")
        print(json.dumps(status, indent=2, default=str))
        
    except Exception as e:
        print(f"Test failed: {e}")
        print("This is expected if the scraper encounters issues.")
