import React, { useState } from 'react';

interface ComplianceData {
  overall_compliance: number;
  standards: Array<{
    category: string;
    compliance: number;
    status: 'compliant' | 'non_compliant' | 'partially_compliant';
    details: string;
    requirements: string;
    current_value: string;
    gap: string;
  }>;
  critical_violations: number;
  improvement_areas: string[];
}

interface ComplianceMetricsProps {
  schoolData?: any;
  analysisResults?: any;
}

export default function ComplianceMetrics({ schoolData, analysisResults }: ComplianceMetricsProps) {
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-generate compliance data when analysis results are available
  React.useEffect(() => {
    if (schoolData && analysisResults) {
      handleGenerateCompliance();
    }
  }, [schoolData, analysisResults]);

  // Mock data for demonstration
  const mockData: ComplianceData = {
    overall_compliance: 67,
    standards: [
      {
        category: 'Pupil-Teacher Ratio (PTR)',
        compliance: 45,
        status: 'non_compliant',
        details: 'Current PTR exceeds recommended limits',
        requirements: 'Primary: 30:1, Secondary: 35:1',
        current_value: '42:1',
        gap: '12 students above limit'
      },
      {
        category: 'Computer Infrastructure',
        compliance: 78,
        status: 'partially_compliant',
        details: 'Adequate computers but needs maintenance',
        requirements: '1 computer per 40 students',
        current_value: '1 computer per 35 students',
        gap: '5 computers short'
      },
      {
        category: 'Sanitation Facilities',
        compliance: 92,
        status: 'compliant',
        details: 'Meets all sanitation requirements',
        requirements: '1 toilet per 80 students',
        current_value: '1 toilet per 75 students',
        gap: 'Exceeds requirements'
      },
      {
        category: 'Drinking Water',
        compliance: 100,
        status: 'compliant',
        details: 'Clean drinking water available',
        requirements: 'Safe drinking water facility',
        current_value: 'RO water system installed',
        gap: 'Fully compliant'
      },
      {
        category: 'Electricity',
        compliance: 85,
        status: 'partially_compliant',
        details: 'Basic electricity available, needs backup',
        requirements: '24/7 electricity with backup',
        current_value: 'Grid electricity, no backup',
        gap: 'Backup power system needed'
      },
      {
        category: 'Internet Connectivity',
        compliance: 60,
        status: 'non_compliant',
        details: 'Limited internet access for students',
        requirements: 'High-speed internet in computer lab',
        current_value: 'Basic internet in admin office',
        gap: 'Student internet access needed'
      }
    ],
    critical_violations: 2,
    improvement_areas: ['PTR Compliance', 'Internet Access', 'Backup Power']
  };

  const handleGenerateCompliance = async () => {
    setIsLoading(true);
    
    if (analysisResults && schoolData) {
      // Use real data from analysis results
      const realData: ComplianceData = {
        overall_compliance: Math.round((1 - analysisResults.infrastructure_need_score) * 100),
        standards: [
          {
            category: 'Pupil-Teacher Ratio (PTR)',
            compliance: analysisResults.compliance_details?.ptr?.compliant ? 100 : 0,
            status: analysisResults.compliance_details?.ptr?.compliant ? 'compliant' : 'non_compliant',
            details: analysisResults.compliance_details?.ptr?.compliant ? 'PTR meets requirements' : 'Current PTR exceeds recommended limits',
            requirements: 'Primary: 30:1, Secondary: 35:1',
            current_value: `${analysisResults.compliance_details?.ptr?.value?.toFixed(1) || 'N/A'}:1`,
            gap: analysisResults.compliance_details?.ptr?.compliant ? 'Meets requirements' : `${(analysisResults.compliance_details?.ptr?.value - analysisResults.compliance_details?.ptr?.threshold).toFixed(0)} students above limit`
          },
          {
            category: 'Computer Infrastructure',
            compliance: analysisResults.compliance_details?.computers?.compliant ? 100 : Math.round((analysisResults.compliance_details?.computers?.total / analysisResults.compliance_details?.computers?.required) * 100),
            status: analysisResults.compliance_details?.computers?.compliant ? 'compliant' : 'non_compliant',
            details: analysisResults.compliance_details?.computers?.compliant ? 'Adequate computers available' : 'Insufficient computer infrastructure',
            requirements: `1 computer per ${analysisResults.compliance_details?.computers?.students_per_computer || 40} students`,
            current_value: `${analysisResults.compliance_details?.computers?.total || 0} computers`,
            gap: analysisResults.compliance_details?.computers?.compliant ? 'Meets requirements' : `${Math.ceil(analysisResults.compliance_details?.computers?.required - analysisResults.compliance_details?.computers?.total)} computers short`
          },
          {
            category: 'Sanitation Facilities',
            compliance: analysisResults.compliance_details?.toilets?.compliant ? 100 : Math.round((analysisResults.compliance_details?.toilets?.per_100_students / 1.25) * 100),
            status: analysisResults.compliance_details?.toilets?.compliant ? 'compliant' : 'non_compliant',
            details: analysisResults.compliance_details?.toilets?.compliant ? 'Meets all sanitation requirements' : 'Insufficient toilet facilities',
            requirements: '1 toilet per 80 students (1.25 per 100)',
            current_value: `Boys: ${analysisResults.compliance_details?.toilets?.boys}, Girls: ${analysisResults.compliance_details?.toilets?.girls}, Total: ${analysisResults.compliance_details?.toilets?.total}`,
            gap: analysisResults.compliance_details?.toilets?.compliant ? 'Meets requirements' : 'Additional toilets needed'
          },
          {
            category: 'Drinking Water',
            compliance: analysisResults.compliance_details?.water?.compliant ? 100 : 0,
            status: analysisResults.compliance_details?.water?.compliant ? 'compliant' : 'non_compliant',
            details: analysisResults.compliance_details?.water?.compliant ? 'Clean drinking water available' : 'Drinking water facility not available',
            requirements: 'Safe drinking water facility',
            current_value: analysisResults.compliance_details?.water?.compliant ? 'Available' : 'Not Available',
            gap: analysisResults.compliance_details?.water?.compliant ? 'Fully compliant' : 'Water facility needed'
          },
          {
            category: 'Electricity',
            compliance: analysisResults.compliance_details?.electricity?.compliant ? 100 : 0,
            status: analysisResults.compliance_details?.electricity?.compliant ? 'compliant' : 'non_compliant',
            details: analysisResults.compliance_details?.electricity?.compliant ? 'Electricity available' : 'Electricity not available',
            requirements: '24/7 electricity with backup',
            current_value: analysisResults.compliance_details?.electricity?.compliant ? 'Available' : 'Not Available',
            gap: analysisResults.compliance_details?.electricity?.compliant ? 'Fully compliant' : 'Electricity connection needed'
          },
          {
            category: 'Internet Connectivity',
            compliance: analysisResults.compliance_details?.internet?.compliant ? 100 : 0,
            status: analysisResults.compliance_details?.internet?.compliant ? 'compliant' : 'non_compliant',
            details: analysisResults.compliance_details?.internet?.compliant ? 'Internet connectivity available' : 'Internet connectivity not available',
            requirements: analysisResults.compliance_details?.internet?.required ? 'High-speed internet in computer lab' : 'Not required for this school level',
            current_value: analysisResults.compliance_details?.internet?.compliant ? 'Available' : 'Not Available',
            gap: analysisResults.compliance_details?.internet?.required ? 'Internet access needed' : 'Not required'
          }
        ],
        critical_violations: analysisResults.deficiencies?.length || 0,
        improvement_areas: analysisResults.deficiencies?.map((d: string) => 
          d.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        ) || ['PTR Compliance', 'Computer Infrastructure', 'Sanitation Facilities']
      };
      
      setTimeout(() => {
        setComplianceData(realData);
        setIsLoading(false);
      }, 1000);
    } else {
      // Use mock data if no real data available
      setTimeout(() => {
        setComplianceData(mockData);
        setIsLoading(false);
      }, 2000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800 border-green-200';
      case 'partially_compliant': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'non_compliant': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      case 'partially_compliant': return (
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
      case 'non_compliant': return (
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
      default: return null;
    }
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 90) return 'text-green-600';
    if (compliance >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Generate Compliance Button */}
      <div className="text-center">
        <button
          onClick={handleGenerateCompliance}
          disabled={isLoading}
          className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Analyzing Compliance...' : 'Analyze Compliance Standards'}
        </button>
      </div>

      {complianceData && (
        <div className="space-y-6">
          {/* Overall Compliance Score */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8 rounded-xl text-center">
            <h3 className="text-2xl font-semibold mb-2">Overall Compliance Score</h3>
            <div className="text-6xl font-bold mb-2">{complianceData.overall_compliance}%</div>
            <p className="text-green-100 text-lg">
              {complianceData.overall_compliance >= 90 ? 'Excellent' : 
               complianceData.overall_compliance >= 70 ? 'Good' : 
               complianceData.overall_compliance >= 50 ? 'Fair' : 'Needs Improvement'}
            </p>
          </div>

          {/* Critical Violations Alert */}
          {complianceData.critical_violations > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-red-800">
                    {complianceData.critical_violations} Critical Compliance Violation{complianceData.critical_violations > 1 ? 's' : ''}
                  </h4>
                  <p className="text-red-700">
                    Immediate attention required for these areas to meet minimum standards
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Standards Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Standards Compliance Breakdown</h4>
            </div>
            <div className="divide-y divide-gray-200">
              {complianceData.standards.map((standard, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(standard.status)}`}>
                          {standard.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="ml-3 text-sm text-gray-500">
                          {standard.compliance}% compliant
                        </span>
                      </div>
                      <h5 className="font-semibold text-gray-900 mb-1">{standard.category}</h5>
                      <p className="text-gray-600 text-sm mb-3">{standard.details}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Requirements:</p>
                          <p className="text-gray-600">{standard.requirements}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Current Value:</p>
                          <p className="text-gray-600">{standard.current_value}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Gap:</p>
                          <p className="text-gray-600">{standard.gap}</p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {getStatusIcon(standard.status)}
                    </div>
                  </div>
                  
                  {/* Compliance Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className={`h-2 rounded-full ${getComplianceColor(standard.compliance).replace('text-', 'bg-')}`}
                      style={{ width: `${standard.compliance}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Improvement Areas */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Priority Improvement Areas</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {complianceData.improvement_areas.map((area, index) => (
                <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                    <span className="text-orange-800 font-medium">{area}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-3">Compliance Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {complianceData.standards.filter(s => s.status === 'compliant').length}
                </p>
                <p className="text-blue-700">Fully Compliant</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {complianceData.standards.filter(s => s.status === 'partially_compliant').length}
                </p>
                <p className="text-yellow-700">Partially Compliant</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {complianceData.standards.filter(s => s.status === 'non_compliant').length}
                </p>
                <p className="text-red-700">Non-Compliant</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!complianceData && !isLoading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Compliance Data Available</h3>
          <p className="text-gray-500">
            Click the button above to analyze your school's compliance with BIS/NCERT standards
          </p>
        </div>
      )}
    </div>
  );
}
