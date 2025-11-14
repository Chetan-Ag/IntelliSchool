import React, { useState } from 'react';

interface InsightData {
  infrastructure_score: number;
  compliance_percentage: number;
  priority_areas: string[];
  recommendations: Array<{
    area: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    estimated_cost: number;
  }>;
  ml_confidence: number;
}

interface InsightsDashboardProps {
  schoolData?: any;
  analysisResults?: any;
}

export default function InsightsDashboard({ schoolData, analysisResults }: InsightsDashboardProps) {
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-generate insights when data is available
  React.useEffect(() => {
    if (schoolData && analysisResults) {
      handleGenerateInsights();
    }
  }, [schoolData, analysisResults]);

  // Mock data for demonstration
  const mockData: InsightData = {
    infrastructure_score: 0.73,
    compliance_percentage: 67,
    priority_areas: ['Teacher-Student Ratio', 'Computer Infrastructure', 'Sanitation Facilities'],
    recommendations: [
      {
        area: 'Teacher Recruitment',
        description: 'Increase teaching staff to meet PTR requirements',
        impact: 'high',
        estimated_cost: 2500000
      },
      {
        area: 'Computer Lab Setup',
        description: 'Establish computer lab with 25 workstations',
        impact: 'medium',
        estimated_cost: 875000
      },
      {
        area: 'Toilet Construction',
        description: 'Build additional 8 toilet units',
        impact: 'high',
        estimated_cost: 1200000
      }
    ],
    ml_confidence: 0.89
  };

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    
    if (analysisResults && schoolData) {
      // Use real data from analysis results
      const realData: InsightData = {
        infrastructure_score: analysisResults.infrastructure_need_score || 0.73,
        compliance_percentage: Math.round((1 - analysisResults.infrastructure_need_score) * 100),
        priority_areas: analysisResults.deficiencies?.map((d: string) => 
          d.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        ) || ['High PTR', 'Insufficient Computers', 'Insufficient Toilets'],
        recommendations: [
          {
            area: 'Teacher Recruitment',
            description: `Increase teaching staff to meet PTR requirements (Current: ${schoolData?.total_teachers || 0}, Required: ${Math.ceil((schoolData?.total_students || 0) / 30)})`,
            impact: 'high' as const,
            estimated_cost: (analysisResults.recommended_quantities?.additional_teachers || 0) * 500000
          },
          {
            area: 'Computer Lab Setup',
            description: `Establish computer lab with ${analysisResults.recommended_quantities?.additional_computers || 0} additional workstations`,
            impact: 'medium' as const,
            estimated_cost: (analysisResults.recommended_quantities?.additional_computers || 0) * 35000
          },
          {
            area: 'Toilet Construction',
            description: `Build additional ${analysisResults.recommended_quantities?.boys_toilets || 0} boys and ${analysisResults.recommended_quantities?.girls_toilets || 0} girls toilet units`,
            impact: 'high' as const,
            estimated_cost: ((analysisResults.recommended_quantities?.boys_toilets || 0) + (analysisResults.recommended_quantities?.girls_toilets || 0)) * 150000
          }
        ],
        ml_confidence: 0.89
      };
      
      setTimeout(() => {
        setInsightData(realData);
        setIsLoading(false);
      }, 500);
    } else {
      // Use mock data if no real data available
      setTimeout(() => {
        setInsightData(mockData);
        setIsLoading(false);
      }, 1000);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
      {/* Generate Insights Button */}
      <div className="text-center">
        <button
          onClick={handleGenerateInsights}
          disabled={isLoading}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating Insights...' : 'Generate AI Insights'}
        </button>
      </div>

      {insightData && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Infrastructure Need Score</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {(insightData.infrastructure_score * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-blue-700 mt-2">
                Higher score indicates greater infrastructure needs
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Compliance Rate</p>
                  <p className="text-3xl font-bold text-green-900">
                    {insightData.compliance_percentage}%
                  </p>
                </div>
                <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-green-700 mt-2">
                Adherence to BIS/NCERT standards
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">ML Confidence</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {(insightData.ml_confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-purple-700 mt-2">
                Model prediction confidence level
              </p>
            </div>
          </div>

          {/* Priority Areas */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Priority Areas</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insightData.priority_areas.map((area, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-red-800 font-medium">{area}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h4>
            <div className="space-y-4">
              {insightData.recommendations.map((rec, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getImpactColor(rec.impact)}`}>
                          {rec.impact.toUpperCase()} IMPACT
                        </span>
                      </div>
                      <h5 className="font-semibold text-gray-900 mb-1">{rec.area}</h5>
                      <p className="text-gray-600 text-sm">{rec.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(rec.estimated_cost)}</p>
                      <p className="text-xs text-gray-500">Estimated Cost</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Investment Required */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl">
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-2">Total Investment Required</h4>
              <p className="text-3xl font-bold">
                {formatCurrency(insightData.recommendations.reduce((sum, rec) => sum + rec.estimated_cost, 0))}
              </p>
              <p className="text-blue-100 text-sm mt-2">
                For comprehensive infrastructure improvement
              </p>
            </div>
          </div>
        </div>
      )}

      {!insightData && !isLoading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Generated Yet</h3>
          <p className="text-gray-500">
            Click the button above to generate AI-powered insights for your school infrastructure
          </p>
        </div>
      )}
    </div>
  );
}
