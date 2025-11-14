import React, { useState } from 'react';

interface InfrastructureData {
  overall_score: number;
  categories: Array<{
    name: string;
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    details: string;
    current_capacity: string;
    required_capacity: string;
    gap_analysis: string;
    improvement_priority: 'critical' | 'high' | 'medium' | 'low';
    estimated_investment: number;
    timeline: string;
  }>;
  total_investment: number;
  timeline_breakdown: Array<{
    phase: string;
    duration: string;
    investment: number;
    focus_areas: string[];
  }>;
}

interface InfrastructureAnalysisProps {
  schoolData?: any;
  analysisResults?: any;
}

export default function InfrastructureAnalysis({ schoolData, analysisResults }: InfrastructureAnalysisProps) {
  const [analysisData, setAnalysisData] = useState<InfrastructureData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-generate analysis when data is available
  React.useEffect(() => {
    if (schoolData && analysisResults) {
      handleGenerateAnalysis();
    }
  }, [schoolData, analysisResults]);

  // Mock data for demonstration
  const mockData: InfrastructureData = {
    overall_score: 0.73,
    categories: [
      {
        name: 'Academic Infrastructure',
        score: 0.65,
        status: 'fair',
        details: 'Classrooms are adequate but need modernization',
        current_capacity: '25 classrooms, basic furniture',
        required_capacity: '30 classrooms, modern furniture, smart boards',
        gap_analysis: '5 classrooms short, outdated furniture, no smart technology',
        improvement_priority: 'high',
        estimated_investment: 4500000,
        timeline: '6-8 months'
      },
      {
        name: 'Technology Infrastructure',
        score: 0.45,
        status: 'poor',
        details: 'Severely lacking in computer and internet facilities',
        current_capacity: '5 computers, basic internet',
        required_capacity: '25 computers, high-speed internet, digital learning tools',
        gap_analysis: '20 computers short, no computer lab, limited internet access',
        improvement_priority: 'critical',
        estimated_investment: 1200000,
        timeline: '3-4 months'
      },
      {
        name: 'Sanitation & Hygiene',
        score: 0.82,
        status: 'good',
        details: 'Well-maintained sanitation facilities',
        current_capacity: '12 toilets, clean water, hand wash',
        required_capacity: '15 toilets, clean water, hand wash, maintenance',
        gap_analysis: '3 toilets short, regular maintenance needed',
        improvement_priority: 'medium',
        estimated_investment: 600000,
        timeline: '2-3 months'
      },
      {
        name: 'Safety & Security',
        score: 0.58,
        status: 'fair',
        details: 'Basic safety measures in place',
        current_capacity: 'Fire extinguishers, first aid',
        required_capacity: 'Fire safety system, CCTV, security personnel',
        gap_analysis: 'No fire alarm, limited CCTV coverage, no security staff',
        improvement_priority: 'high',
        estimated_investment: 1800000,
        timeline: '4-5 months'
      },
      {
        name: 'Sports & Recreation',
        score: 0.71,
        status: 'good',
        details: 'Basic sports facilities available',
        current_capacity: 'Playground, basic sports equipment',
        required_capacity: 'Multi-purpose ground, indoor sports, equipment',
        gap_analysis: 'No indoor facilities, limited equipment variety',
        improvement_priority: 'medium',
        estimated_investment: 900000,
        timeline: '3-4 months'
      },
      {
        name: 'Administrative Infrastructure',
        score: 0.89,
        status: 'excellent',
        details: 'Well-equipped administrative facilities',
        current_capacity: 'Office space, computers, printers',
        required_capacity: 'Office space, computers, printers, software',
        gap_analysis: 'Minor software upgrades needed',
        improvement_priority: 'low',
        estimated_investment: 150000,
        timeline: '1 month'
      }
    ],
    total_investment: 9150000,
    timeline_breakdown: [
      {
        phase: 'Phase 1 - Critical',
        duration: '3-4 months',
        investment: 3000000,
        focus_areas: ['Technology Infrastructure', 'Safety Systems']
      },
      {
        phase: 'Phase 2 - High Priority',
        duration: '6-8 months',
        investment: 4500000,
        focus_areas: ['Academic Infrastructure', 'Security Enhancement']
      },
      {
        phase: 'Phase 3 - Medium Priority',
        duration: '3-4 months',
        investment: 1500000,
        focus_areas: ['Sanitation Enhancement', 'Sports Facilities']
      },
      {
        phase: 'Phase 4 - Low Priority',
        duration: '1 month',
        investment: 150000,
        focus_areas: ['Administrative Upgrades']
      }
    ]
  };

  const handleGenerateAnalysis = async () => {
    setIsLoading(true);
    
    if (analysisResults && schoolData) {
      // Use real data from analysis results
      const realData: InfrastructureData = {
        overall_score: analysisResults.infrastructure_need_score || 0.73,
        categories: [
          {
            name: 'Academic Infrastructure',
            score: schoolData.total_classrooms > 0 ? Math.min(1, (schoolData.total_classrooms / Math.ceil(schoolData.total_students / 40))) : 0,
            status: schoolData.total_classrooms >= Math.ceil(schoolData.total_students / 40) ? 'excellent' : schoolData.total_classrooms >= Math.ceil(schoolData.total_students / 50) ? 'good' : 'fair',
            details: schoolData.total_classrooms >= Math.ceil(schoolData.total_students / 40) ? 'Classrooms meet requirements' : 'Additional classrooms needed',
            current_capacity: `${schoolData.total_classrooms} classrooms`,
            required_capacity: `${Math.ceil(schoolData.total_students / 40)} classrooms`,
            gap_analysis: schoolData.total_classrooms >= Math.ceil(schoolData.total_students / 40) ? 'Meets requirements' : `${Math.ceil(schoolData.total_students / 40) - schoolData.total_classrooms} classrooms short`,
            improvement_priority: schoolData.total_classrooms < Math.ceil(schoolData.total_students / 50) ? 'critical' : 'high',
            estimated_investment: Math.max(0, Math.ceil(schoolData.total_students / 40) - schoolData.total_classrooms) * 500000,
            timeline: '6-8 months'
          },
          {
            name: 'Technology Infrastructure',
            score: schoolData.total_computers > 0 ? Math.min(1, (schoolData.total_computers / Math.ceil(schoolData.total_students / 40))) : 0,
            status: schoolData.total_computers >= Math.ceil(schoolData.total_students / 40) ? 'excellent' : schoolData.total_computers >= Math.ceil(schoolData.total_students / 60) ? 'good' : 'poor',
            details: schoolData.total_computers >= Math.ceil(schoolData.total_students / 40) ? 'Adequate computer infrastructure' : 'Severely lacking in computer facilities',
            current_capacity: `${schoolData.total_computers} computers`,
            required_capacity: `${Math.ceil(schoolData.total_students / 40)} computers`,
            gap_analysis: schoolData.total_computers >= Math.ceil(schoolData.total_students / 40) ? 'Meets requirements' : `${Math.ceil(schoolData.total_students / 40) - schoolData.total_computers} computers short`,
            improvement_priority: schoolData.total_computers < Math.ceil(schoolData.total_students / 60) ? 'critical' : 'high',
            estimated_investment: Math.max(0, Math.ceil(schoolData.total_students / 40) - schoolData.total_computers) * 35000,
            timeline: '3-4 months'
          },
          {
            name: 'Sanitation & Hygiene',
            score: (schoolData.boys_toilets + schoolData.girls_toilets) > 0 ? Math.min(1, ((schoolData.boys_toilets + schoolData.girls_toilets) / (Math.ceil(schoolData.boys_count / 40) + Math.ceil(schoolData.girls_count / 40)))) : 0,
            status: (schoolData.boys_toilets + schoolData.girls_toilets) >= (Math.ceil(schoolData.boys_count / 40) + Math.ceil(schoolData.girls_count / 40)) ? 'excellent' : 'good',
            details: (schoolData.boys_toilets + schoolData.girls_toilets) >= (Math.ceil(schoolData.boys_count / 40) + Math.ceil(schoolData.girls_count / 40)) ? 'Well-maintained sanitation facilities' : 'Basic sanitation facilities available',
            current_capacity: `Boys: ${schoolData.boys_toilets}, Girls: ${schoolData.girls_toilets}, Total: ${schoolData.boys_toilets + schoolData.girls_toilets}`,
            required_capacity: `Boys: ${Math.ceil(schoolData.boys_count / 40)}, Girls: ${Math.ceil(schoolData.girls_count / 40)}, Total: ${Math.ceil(schoolData.boys_count / 40) + Math.ceil(schoolData.girls_count / 40)}`,
            gap_analysis: (schoolData.boys_toilets + schoolData.girls_toilets) >= (Math.ceil(schoolData.boys_count / 40) + Math.ceil(schoolData.girls_count / 40)) ? 'Meets requirements' : `${(Math.ceil(schoolData.boys_count / 40) + Math.ceil(schoolData.girls_count / 40)) - (schoolData.boys_toilets + schoolData.girls_toilets)} toilets short`,
            improvement_priority: (schoolData.boys_toilets + schoolData.girls_toilets) < (Math.ceil(schoolData.boys_count / 40) + Math.ceil(schoolData.girls_count / 40)) ? 'high' : 'medium',
            estimated_investment: Math.max(0, (Math.ceil(schoolData.boys_count / 40) + Math.ceil(schoolData.girls_count / 40)) - (schoolData.boys_toilets + schoolData.girls_toilets)) * 150000,
            timeline: '2-3 months'
          },
          {
            name: 'Safety & Security',
            score: 0.6, // Default moderate score
            status: 'fair',
            details: 'Basic safety measures in place',
            current_capacity: 'Basic safety equipment',
            required_capacity: 'Fire safety system, CCTV, security personnel',
            gap_analysis: 'Enhanced safety systems needed',
            improvement_priority: 'high',
            estimated_investment: 1800000,
            timeline: '4-5 months'
          },
          {
            name: 'Sports & Recreation',
            score: schoolData.has_playground ? 0.8 : 0.3,
            status: schoolData.has_playground ? 'good' : 'poor',
            details: schoolData.has_playground ? 'Basic sports facilities available' : 'No sports facilities',
            current_capacity: schoolData.has_playground ? 'Playground available' : 'No playground',
            required_capacity: 'Multi-purpose ground, sports equipment',
            gap_analysis: schoolData.has_playground ? 'Basic facilities available' : 'Sports facilities needed',
            improvement_priority: schoolData.has_playground ? 'medium' : 'high',
            estimated_investment: schoolData.has_playground ? 500000 : 1500000,
            timeline: '3-4 months'
          },
          {
            name: 'Administrative Infrastructure',
            score: 0.9, // High score for admin
            status: 'excellent',
            details: 'Well-equipped administrative facilities',
            current_capacity: 'Office space, basic equipment',
            required_capacity: 'Office space, computers, software',
            gap_analysis: 'Minor upgrades needed',
            improvement_priority: 'low',
            estimated_investment: 150000,
            timeline: '1 month'
          }
        ],
        total_investment: 0, // Will be calculated
        timeline_breakdown: [
          {
            phase: 'Phase 1 - Critical',
            duration: '3-4 months',
            investment: 0, // Will be calculated
            focus_areas: ['Technology Infrastructure', 'Safety Systems']
          },
          {
            phase: 'Phase 2 - High Priority',
            duration: '6-8 months',
            investment: 0, // Will be calculated
            focus_areas: ['Academic Infrastructure', 'Sanitation Enhancement']
          },
          {
            phase: 'Phase 3 - Medium Priority',
            duration: '3-4 months',
            investment: 0, // Will be calculated
            focus_areas: ['Sports Facilities', 'Administrative Upgrades']
          }
        ]
      };
      
      // Calculate total investment
      realData.total_investment = realData.categories.reduce((sum, cat) => sum + cat.estimated_investment, 0);
      
      // Update timeline breakdown with calculated investments
      realData.timeline_breakdown[0].investment = realData.categories.filter(cat => cat.improvement_priority === 'critical').reduce((sum, cat) => sum + cat.estimated_investment, 0);
      realData.timeline_breakdown[1].investment = realData.categories.filter(cat => cat.improvement_priority === 'high').reduce((sum, cat) => sum + cat.estimated_investment, 0);
      realData.timeline_breakdown[2].investment = realData.categories.filter(cat => ['medium', 'low'].includes(cat.improvement_priority)).reduce((sum, cat) => sum + cat.estimated_investment, 0);
      
      setTimeout(() => {
        setAnalysisData(realData);
        setIsLoading(false);
      }, 1000);
    } else {
      // Use mock data if no real data available
      setTimeout(() => {
        setAnalysisData(mockData);
        setIsLoading(false);
      }, 2000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Generate Analysis Button */}
      <div className="text-center">
        <button
          onClick={handleGenerateAnalysis}
          disabled={isLoading}
          className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Analyzing Infrastructure...' : 'Generate Infrastructure Analysis'}
        </button>
      </div>

      {analysisData && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 rounded-xl text-center">
            <h3 className="text-2xl font-semibold mb-2">Overall Infrastructure Score</h3>
            <div className="text-6xl font-bold mb-2">{(analysisData.overall_score * 100).toFixed(0)}%</div>
            <p className="text-purple-100 text-lg">
              {analysisData.overall_score >= 0.8 ? 'Excellent' : 
               analysisData.overall_score >= 0.6 ? 'Good' : 
               analysisData.overall_score >= 0.4 ? 'Fair' : 'Needs Significant Improvement'}
            </p>
          </div>

          {/* Investment Summary */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Investment Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-600">Total Investment Required</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(analysisData.total_investment)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-600">Implementation Timeline</p>
                <p className="text-2xl font-bold text-green-900">8-12 months</p>
              </div>
            </div>
          </div>

          {/* Category Analysis */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Infrastructure Category Analysis</h4>
            </div>
            <div className="divide-y divide-gray-200">
              {analysisData.categories.map((category, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(category.status)}`}>
                          {category.status.toUpperCase()}
                        </span>
                        <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(category.improvement_priority)}`}>
                          {category.improvement_priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <h5 className="font-semibold text-gray-900 mb-2">{category.name}</h5>
                      <p className="text-gray-600 text-sm mb-3">{category.details}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="font-medium text-gray-700">Current Capacity:</p>
                          <p className="text-gray-600">{category.current_capacity}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Required Capacity:</p>
                          <p className="text-gray-600">{category.required_capacity}</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <p className="font-medium text-gray-700 mb-1">Gap Analysis:</p>
                        <p className="text-gray-600 text-sm">{category.gap_analysis}</p>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Estimated Investment:</p>
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(category.estimated_investment)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Timeline:</p>
                          <p className="text-gray-600">{category.timeline}</p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className={`text-3xl font-bold ${getScoreColor(category.score)}`}>
                        {(category.score * 100).toFixed(0)}%
                      </div>
                      <p className="text-sm text-gray-500">Score</p>
                    </div>
                  </div>
                  
                  {/* Score Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getScoreColor(category.score).replace('text-', 'bg-')}`}
                      style={{ width: `${category.score * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Breakdown */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Implementation Timeline</h4>
            <div className="space-y-4">
              {analysisData.timeline_breakdown.map((phase, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-semibold text-gray-900">{phase.phase}</h5>
                      <p className="text-sm text-gray-600">Duration: {phase.duration}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(phase.investment)}</p>
                      <p className="text-sm text-gray-500">Investment</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-2">Focus Areas:</p>
                    <div className="flex flex-wrap gap-2">
                      {phase.focus_areas.map((area, areaIndex) => (
                        <span key={areaIndex} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Plan */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl">
            <h4 className="text-lg font-semibold mb-3">Recommended Action Plan</h4>
            <div className="space-y-2 text-blue-100">
              <p>• Start with critical infrastructure needs (Technology & Safety)</p>
              <p>• Phase implementation to manage budget and resources effectively</p>
              <p>• Focus on high-impact improvements for maximum ROI</p>
              <p>• Regular monitoring and progress tracking throughout implementation</p>
            </div>
          </div>
        </div>
      )}

      {!analysisData && !isLoading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Available</h3>
          <p className="text-gray-500">
            Click the button above to generate comprehensive infrastructure analysis and gap assessment
          </p>
        </div>
      )}
    </div>
  );
}
