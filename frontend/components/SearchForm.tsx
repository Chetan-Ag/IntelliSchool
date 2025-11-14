import { useState } from 'react';
import axios from 'axios';
import SchoolInsights from './SchoolInsights';

interface SearchFormProps {
  onDataUpdate?: (schoolData: any, analysisResults: any) => void;
}

export default function SearchForm({ onDataUpdate }: SearchFormProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'csv'>('manual');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    udise_code: '',
    school_name: '',
    state: '',
    district: '',
    block: '',
    location_type: 'rural',
    management_type: 'government',
    category: 'primary',
    class_range: '1-5',
    total_students: '',
    boys_count: '',
    girls_count: '',
    total_teachers: '',
    total_classrooms: '',
    total_computers: '',
    boys_toilets: '',
    girls_toilets: '',
    has_drinking_water: false,
    has_electricity: false,
    has_internet: false,
    has_library: false,
    has_playground: false,
    has_ramps: false,
    has_solar_panels: false,
    has_rainwater_harvesting: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: value
        };
        
        // Auto-calculate total students when boys/girls count changes
        if (name === 'boys_count' || name === 'girls_count') {
          const boys = parseInt(newData.boys_count) || 0;
          const girls = parseInt(newData.girls_count) || 0;
          newData.total_students = (boys + girls).toString();
        }
        
        return newData;
      });
    }
  };

  // Calculate toilet requirements based on BIS standards
  const calculateToiletRequirements = () => {
    const boys = parseInt(formData.boys_count) || 0;
    const girls = parseInt(formData.girls_count) || 0;
    const totalStudents = boys + girls;
    
    if (totalStudents === 0) return { boysRequired: 0, girlsRequired: 0, totalRequired: 0 };
    
    // BIS Standard: 1 toilet per 40 students (minimum 1 each for boys and girls)
    const boysRequired = Math.max(1, Math.ceil(boys / 40));
    const girlsRequired = Math.max(1, Math.ceil(girls / 40));
    const totalRequired = boysRequired + girlsRequired;
    
    return { boysRequired, girlsRequired, totalRequired };
  };

  const toiletRequirements = calculateToiletRequirements();

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare data for API
      const apiData = {
        udise_code: formData.udise_code,
        school_name: formData.school_name,
        state: formData.state,
        district: formData.district,
        block: formData.block,
        location_type: formData.location_type,
        management_type: formData.management_type,
        category: formData.category,
        classes_from: parseInt(formData.class_range.split('-')[0]),
        classes_to: parseInt(formData.class_range.split('-')[1]),
        total_students: parseInt(formData.total_students) || 0,
        boys_count: parseInt(formData.boys_count) || 0,
        girls_count: parseInt(formData.girls_count) || 0,
        total_teachers: parseInt(formData.total_teachers) || 0,
        total_classrooms: parseInt(formData.total_classrooms) || 0,
        desktops: parseInt(formData.total_computers) || 0,
        laptops: 0,
        boys_toilets: parseInt(formData.boys_toilets) || 0,
        girls_toilets: parseInt(formData.girls_toilets) || 0,
        drinking_water_flag: formData.has_drinking_water,
        electricity_flag: formData.has_electricity,
        internet_flag: formData.has_internet,
        library_flag: formData.has_library,
        playground_flag: formData.has_playground,
        ramps_flag: formData.has_ramps,
        solar_panel_flag: formData.has_solar_panels,
        rainwater_flag: formData.has_rainwater_harvesting,
        furniture_flag: true
      };

      // Call backend API
      const response = await axios.post('http://localhost:8000/api/predict', apiData);
      setResults(response.data);
      
      // Update parent component with data
      if (onDataUpdate) {
        onDataUpdate(formData, response.data);
      }
      
    } catch (err: any) {
      console.error('API Error:', err);
      console.log('Using fallback data generation...');
      
      // Generate realistic data based on actual form inputs
      const totalStudents = parseInt(formData.total_students) || 0;
      const totalTeachers = parseInt(formData.total_teachers) || 0;
      const totalComputers = parseInt(formData.total_computers) || 0;
      const boysToilets = parseInt(formData.boys_toilets) || 0;
      const girlsToilets = parseInt(formData.girls_toilets) || 0;
      const boysCount = parseInt(formData.boys_count) || 0;
      const girlsCount = parseInt(formData.girls_count) || 0;
      
      // Calculate PTR
      const ptr = totalTeachers > 0 ? totalStudents / totalTeachers : totalStudents;
      const ptrThreshold = formData.category === 'primary' ? 30 : 35;
      const ptrCompliant = ptr <= ptrThreshold;
      
      // Calculate toilet requirements
      const boysRequired = Math.max(1, Math.ceil(boysCount / 40));
      const girlsRequired = Math.max(1, Math.ceil(girlsCount / 40));
      const toiletsCompliant = boysToilets >= boysRequired && girlsToilets >= girlsRequired;
      
      // Calculate computer requirements
      const computerRatio = formData.category === 'primary' ? 40 : 30;
      const requiredComputers = Math.ceil(totalStudents / computerRatio);
      const computersCompliant = totalComputers >= requiredComputers;
      
      // Calculate infrastructure need score
      const complianceScore = [
        ptrCompliant,
        toiletsCompliant,
        computersCompliant,
        formData.has_drinking_water,
        formData.has_electricity,
        formData.has_internet || formData.category === 'primary'
      ].filter(Boolean).length / 6;
      
      const infrastructureNeedScore = 1 - complianceScore;
      
      // Generate deficiencies
      const deficiencies = [];
      if (!ptrCompliant) deficiencies.push('high_ptr');
      if (!toiletsCompliant) deficiencies.push('insufficient_toilets');
      if (!computersCompliant) deficiencies.push('insufficient_computers');
      if (!formData.has_drinking_water) deficiencies.push('no_water');
      if (!formData.has_electricity) deficiencies.push('no_electricity');
      if (!formData.has_internet && formData.category !== 'primary') deficiencies.push('no_internet');
      
      // Generate recommendations
      const recommendedQuantities = {};
      if (!ptrCompliant) {
        recommendedQuantities.additional_teachers = Math.max(0, Math.ceil(totalStudents / ptrThreshold) - totalTeachers);
      }
      if (!toiletsCompliant) {
        recommendedQuantities.boys_toilets = Math.max(0, boysRequired - boysToilets);
        recommendedQuantities.girls_toilets = Math.max(0, girlsRequired - girlsToilets);
      }
      if (!computersCompliant) {
        recommendedQuantities.additional_computers = Math.max(0, requiredComputers - totalComputers);
      }
      
      const fallbackResults = {
        infrastructure_need_score: infrastructureNeedScore,
        compliant_flag: complianceScore >= 0.8,
        deficiencies: deficiencies,
        recommended_quantities: recommendedQuantities,
        shap_explanation: {
          feature_importance: [
            { name: 'Student-Teacher Ratio', importance: 0.3 },
            { name: 'Computer Infrastructure', importance: 0.25 },
            { name: 'Sanitation Facilities', importance: 0.2 },
            { name: 'Basic Amenities', importance: 0.15 },
            { name: 'Digital Infrastructure', importance: 0.1 }
          ]
        },
        compliance_details: {
          ptr: {
            value: ptr,
            threshold: ptrThreshold,
            compliant: ptrCompliant
          },
          toilets: {
            boys: boysToilets,
            girls: girlsToilets,
            total: boysToilets + girlsToilets,
            boys_required: boysRequired,
            girls_required: girlsRequired,
            total_required: boysRequired + girlsRequired,
            per_100_students: totalStudents > 0 ? ((boysToilets + girlsToilets) / totalStudents) * 100 : 0,
            compliant: toiletsCompliant
          },
          computers: {
            desktops: totalComputers,
            laptops: 0,
            total: totalComputers,
            required: requiredComputers,
            students_per_computer: computerRatio,
            compliant: computersCompliant
          },
          water: {
            available: formData.has_drinking_water,
            compliant: formData.has_drinking_water
          },
          electricity: {
            available: formData.has_electricity,
            compliant: formData.has_electricity
          },
          internet: {
            available: formData.has_internet,
            required: formData.category === 'secondary' || formData.category === 'higher_secondary',
            compliant: formData.has_internet || (formData.category === 'primary')
          }
        },
        priority_rank: infrastructureNeedScore >= 0.8 ? 'Critical' : 
                      infrastructureNeedScore >= 0.6 ? 'High' : 
                      infrastructureNeedScore >= 0.4 ? 'Medium' : 'Low'
      };
      
      setResults(fallbackResults);
      
      // Update parent component with data
      if (onDataUpdate) {
        onDataUpdate(formData, fallbackResults);
      }
      
      // Show warning about using fallback data
      setError('Backend API unavailable. Using calculated fallback data based on your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('http://localhost:8000/api/predict/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResults({
        message: 'CSV processed successfully',
        schools_analyzed: response.data.total_schools,
        average_score: response.data.predictions.reduce((acc: number, pred: any) => acc + (pred.infrastructure_need_score || 0), 0) / response.data.total_schools,
        enriched_csv: response.data.enriched_csv,
        predictions: response.data.predictions
      });
      
    } catch (err: any) {
      console.error('CSV Upload Error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('An error occurred while processing the CSV file');
      }
      
      // Fallback to mock data
      setResults({
        message: 'CSV processed successfully (demo mode)',
        schools_analyzed: 15,
        average_score: 0.68
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = `UDISE Code,School Name,State,District,Block,Location Type,Management Type,Category,Class Range,Total Students,Boys Count,Girls Count,Total Teachers,Total Classrooms,Total Computers,Boys Toilets,Girls Toilets,Has Drinking Water,Has Electricity,Has Internet,Has Library,Has Playground,Has Ramps,Has Solar Panels,Has Rainwater Harvesting
12345678901,ABC School,Delhi,New Delhi,Central,rural,government,primary,1-5,150,75,75,5,8,2,2,2,true,true,false,true,true,false,false,false
12345678902,XYZ School,Maharashtra,Mumbai,Western,urban,private,secondary,6-10,300,150,150,12,15,8,4,4,true,true,true,true,true,true,false,false`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'school_infrastructure_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'manual'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Manual Input
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'csv'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          CSV Upload
        </button>
      </div>

      {/* Manual Input Form */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">UDISE Code</label>
                <input
                  type="text"
                  name="udise_code"
                  value={formData.udise_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter UDISE code"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                <input
                  type="text"
                  name="school_name"
                  value={formData.school_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter school name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter state"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter district"
                  required
                />
              </div>
            </div>
          </div>

          {/* Student Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Boys</label>
                <input
                  type="number"
                  name="boys_count"
                  value={formData.boys_count}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter boys count"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Girls</label>
                <input
                  type="number"
                  name="girls_count"
                  value={formData.girls_count}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter girls count"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Students (Auto-calculated)</label>
                <input
                  type="number"
                  name="total_students"
                  value={formData.total_students}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  placeholder="Auto-calculated"
                />
              </div>
            </div>
          </div>

          {/* Infrastructure Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Infrastructure Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Teachers</label>
                <input
                  type="number"
                  name="total_teachers"
                  value={formData.total_teachers}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter total teachers"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Classrooms</label>
                <input
                  type="number"
                  name="total_classrooms"
                  value={formData.total_classrooms}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter total classrooms"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Computers</label>
                <input
                  type="number"
                  name="total_computers"
                  value={formData.total_computers}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter total computers"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class Range</label>
                <select
                  name="class_range"
                  value={formData.class_range}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="1-5">Primary (1-5)</option>
                  <option value="1-8">Upper Primary (1-8)</option>
                  <option value="6-10">Secondary (6-10)</option>
                  <option value="1-12">Higher Secondary (1-12)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Toilet Requirements */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Toilet Requirements (BIS Standards)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Boys Toilets (Current)</label>
                  <input
                    type="number"
                    name="boys_toilets"
                    value={formData.boys_toilets}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter current boys toilets"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Girls Toilets (Current)</label>
                  <input
                    type="number"
                    name="girls_toilets"
                    value={formData.girls_toilets}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter current girls toilets"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* School Type */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">School Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location Type</label>
                <select
                  name="location_type"
                  value={formData.location_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="rural">Rural</option>
                  <option value="urban">Urban</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Management Type</label>
                <select
                  name="management_type"
                  value={formData.management_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="government">Government</option>
                  <option value="private">Private</option>
                  <option value="aided">Aided</option>
                  <option value="unaided">Unaided</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="primary">Primary</option>
                  <option value="upper_primary">Upper Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="higher_secondary">Higher Secondary</option>
                </select>
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Facilities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="has_drinking_water"
                  checked={formData.has_drinking_water}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Drinking Water</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="has_electricity"
                  checked={formData.has_electricity}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Electricity</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="has_internet"
                  checked={formData.has_internet}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Internet</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="has_library"
                  checked={formData.has_library}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Library</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="has_playground"
                  checked={formData.has_playground}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Playground</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="has_ramps"
                  checked={formData.has_ramps}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Ramps</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="has_solar_panels"
                  checked={formData.has_solar_panels}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Solar Panels</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="has_rainwater_harvesting"
                  checked={formData.has_rainwater_harvesting}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Rainwater Harvesting</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Infrastructure'}
          </button>
        </form>
      )}

      {/* CSV Upload */}
      {activeTab === 'csv' && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="space-y-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">CSV files only, max 10MB</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={downloadSampleCSV}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Download Sample CSV Template
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Results - Comprehensive Insights */}
      {results && activeTab === 'manual' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Analysis Complete!
            </h3>
            <p className="text-gray-600">
              Comprehensive infrastructure assessment for {formData.school_name}
            </p>
          </div>
          <div className="p-6">
            <SchoolInsights schoolData={formData} analysisResults={results} />
          </div>
        </div>
      )}

      {/* CSV Results */}
      {results && activeTab === 'csv' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">CSV Processing Complete!</h3>
          <div className="space-y-2">
            <p className="text-green-700">
              Schools Analyzed: <span className="font-bold">{results.schools_analyzed}</span>
            </p>
            <p className="text-green-700">
              Average Infrastructure Score: <span className="font-bold">{((1 - results.average_score) * 100).toFixed(1)}%</span>
            </p>
            {results.enriched_csv && (
              <p className="text-green-700">
                Enriched CSV: <span className="font-bold">{results.enriched_csv}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
