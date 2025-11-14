import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, AreaChart, Area
} from 'recharts';
import { 
  Building2, Users, GraduationCap, Monitor, Wifi, Zap, Droplets, 
  BookOpen, Play, Accessibility, Sun, CloudRain, AlertTriangle, CheckCircle
} from 'lucide-react';

interface SchoolInsightsProps {
  schoolData: any;
  analysisResults: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function SchoolInsights({ schoolData, analysisResults }: SchoolInsightsProps) {
  if (!analysisResults) return null;

  // Prepare data for charts
  const complianceData = [
    { name: 'PTR', value: analysisResults?.compliance_details?.ptr?.compliant ? 100 : 0, color: '#0088FE' },
    { name: 'Toilets', value: analysisResults?.compliance_details?.toilets?.compliant ? 100 : 0, color: '#00C49F' },
    { name: 'Computers', value: analysisResults?.compliance_details?.computers?.compliant ? 100 : 0, color: '#FFBB28' },
    { name: 'Water', value: analysisResults?.compliance_details?.water?.compliant ? 100 : 0, color: '#FF8042' },
    { name: 'Electricity', value: analysisResults?.compliance_details?.electricity?.compliant ? 100 : 0, color: '#8884D8' },
    { name: 'Internet', value: analysisResults?.compliance_details?.internet?.compliant ? 100 : 0, color: '#82CA9D' }
  ];

  const infrastructureComparison = [
    { 
      name: 'Current', 
      students: schoolData?.total_students || 0, 
      teachers: schoolData?.total_teachers || 0, 
      classrooms: schoolData?.total_classrooms || 0,
      computers: schoolData?.total_computers || 0,
      boys_toilets: schoolData?.boys_toilets || 0,
      girls_toilets: schoolData?.girls_toilets || 0
    },
    { 
      name: 'Required', 
      students: schoolData?.total_students || 0, 
      teachers: Math.ceil((schoolData?.total_students || 0) / 30), 
      classrooms: Math.ceil((schoolData?.total_students || 0) / 40),
      computers: Math.ceil((schoolData?.total_students || 0) / 40),
      boys_toilets: Math.max(1, Math.ceil((schoolData?.boys_count || 0) / 40)),
      girls_toilets: Math.max(1, Math.ceil((schoolData?.girls_count || 0) / 40))
    }
  ];

  const facilityStatus = [
    { name: 'Available', value: schoolData ? Object.values(schoolData).filter(val => val === true).length : 0, fill: '#10B981' },
    { name: 'Missing', value: schoolData ? Object.values(schoolData).filter(val => val === false).length : 0, fill: '#EF4444' }
  ];

  const priorityAreas = analysisResults?.deficiencies?.map((deficiency: string, index: number) => ({
    name: deficiency.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: 100 - (index * 20),
    fill: COLORS[index % COLORS.length]
  })) || [];

  const getCompliancePercentage = () => {
    if (!analysisResults?.compliance_details) return 0;
    const details = analysisResults.compliance_details;
    const checks = ['ptr', 'toilets', 'computers', 'water', 'electricity', 'internet'];
    const compliant = checks.filter(check => details[check]?.compliant).length;
    return Math.round((compliant / checks.length) * 100);
  };

  const getInfrastructureScore = () => {
    if (!analysisResults?.infrastructure_need_score) return 0;
    return Math.round((1 - analysisResults.infrastructure_need_score) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Header Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{getInfrastructureScore()}%</div>
            <div className="text-sm text-blue-700">Infrastructure Score</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{getCompliancePercentage()}%</div>
            <div className="text-sm text-green-700">Compliance Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{analysisResults?.priority_rank || 'N/A'}</div>
            <div className="text-sm text-orange-700">Priority Rank</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{analysisResults?.deficiencies?.length || 0}</div>
            <div className="text-sm text-purple-700">Areas of Concern</div>
          </div>
        </div>
      </div>

      {/* School Information */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Building2 className="w-5 h-5 mr-2 text-blue-600" />
          School Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">School Name</div>
            <div className="font-medium text-gray-900">{schoolData?.school_name || 'N/A'}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">UDISE Code</div>
            <div className="font-medium text-gray-900">{schoolData?.udise_code || 'N/A'}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Location</div>
            <div className="font-medium text-gray-900">{schoolData?.district || 'N/A'}, {schoolData?.state || 'N/A'}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">School Type</div>
            <div className="font-medium text-gray-900">{schoolData?.category || 'N/A'} ({schoolData?.location_type || 'N/A'})</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Total Students</div>
            <div className="font-medium text-gray-900">{schoolData?.total_students || 0}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Boys Count</div>
            <div className="font-medium text-blue-600">{schoolData?.boys_count || 0}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Girls Count</div>
            <div className="font-medium text-pink-600">{schoolData?.girls_count || 0}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Total Teachers</div>
            <div className="font-medium text-gray-900">{schoolData?.total_teachers || 0}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Total Classrooms</div>
            <div className="font-medium text-gray-900">{schoolData?.total_classrooms || 0}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Total Computers</div>
            <div className="font-medium text-gray-900">{schoolData?.total_computers || 0}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Boys Toilets</div>
            <div className="font-medium text-blue-600">{schoolData?.boys_toilets || 0}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Girls Toilets</div>
            <div className="font-medium text-pink-600">{schoolData?.girls_toilets || 0}</div>
          </div>
        </div>
      </div>

      {/* Compliance Overview Chart */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
          Compliance Overview
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={complianceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'Compliance']} />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Infrastructure Comparison */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
          Infrastructure Comparison
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={infrastructureComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="students" fill="#8884d8" name="Students" />
              <Bar dataKey="teachers" fill="#82ca9d" name="Teachers" />
              <Bar dataKey="classrooms" fill="#ffc658" name="Classrooms" />
              <Bar dataKey="computers" fill="#ff7300" name="Computers" />
              <Bar dataKey="boys_toilets" fill="#00bcd4" name="Boys Toilets" />
              <Bar dataKey="girls_toilets" fill="#e91e63" name="Girls Toilets" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Facility Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
            Facility Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={facilityStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {facilityStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
            Priority Areas
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={priorityAreas}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis />
                <Radar name="Priority" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Compliance Analysis */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
          Detailed Compliance Analysis
        </h3>
        <div className="space-y-4">
          {analysisResults?.compliance_details && Object.entries(analysisResults.compliance_details).map(([key, details]: [string, any]) => (
            <div key={key} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 capitalize">{key.replace(/_/g, ' ')}</h4>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  details.compliant 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {details.compliant ? 'Compliant' : 'Non-Compliant'}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {key === 'ptr' && (
                  <span>Current PTR: {details.value?.toFixed(1) || 'N/A'}, Required: ≤{details.threshold}</span>
                )}
                {key === 'toilets' && (
                  <span>Boys: {details.boys}, Girls: {details.girls}, Total: {details.total}, Per 100 students: {details.per_100_students?.toFixed(2) || 'N/A'}</span>
                )}
                {key === 'computers' && (
                  <span>Available: {details.total}, Required: {details.required?.toFixed(0) || 'N/A'}, Students per computer: {details.students_per_computer}</span>
                )}
                {key === 'water' && (
                  <span>Drinking water: {details.available ? 'Available' : 'Not Available'}</span>
                )}
                {key === 'electricity' && (
                  <span>Electricity: {details.available ? 'Available' : 'Not Available'}</span>
                )}
                {key === 'internet' && (
                  <span>Internet: {details.available ? 'Available' : 'Not Available'} {details.required ? '(Required)' : '(Not Required)'}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {analysisResults?.recommended_quantities && Object.keys(analysisResults.recommended_quantities).length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
            Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(analysisResults.recommended_quantities).map(([key, value]: [string, any]) => (
              <div key={key} className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-900 capitalize mb-2">{key.replace(/_/g, ' ')}</h4>
                <div className="text-sm text-orange-800">
                  {typeof value === 'number' ? `Required: ${value}` : `Action: ${value}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHAP Explanation */}
      {analysisResults?.shap_explanation && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-600" />
            AI Model Explanation
          </h3>
          <div className="text-sm text-gray-600">
            <p>This analysis is based on machine learning models that consider multiple factors including:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {analysisResults.shap_explanation.feature_importance?.map((feature: any, index: number) => (
                <li key={index}>
                  <span className="font-medium">{feature.name}</span>: {feature.importance?.toFixed(3) || 'N/A'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
