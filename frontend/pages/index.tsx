import { useState } from 'react';
import Head from 'next/head';
import SearchForm from '../components/SearchForm';
import InsightsDashboard from '../components/InsightsDashboard';
import ComplianceMetrics from '../components/ComplianceMetrics';
import InfrastructureAnalysis from '../components/InfrastructureAnalysis';

export default function Home() {
  const [activeTab, setActiveTab] = useState('assessment');
  const [schoolData, setSchoolData] = useState<any>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Head>
        <title>IntelliSchool - AI-Powered Infrastructure Assessment</title>
        <meta name="description" content="Professional school infrastructure assessment using AI and machine learning" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center group">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">IntelliSchool</h1>
                <p className="text-sm text-gray-600 font-medium">AI-Powered Infrastructure Assessment</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-2">
              <button
                onClick={() => setActiveTab('assessment')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'assessment'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                📊 Assessment
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'insights'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                🔍 Insights
              </button>
              <button
                onClick={() => setActiveTab('compliance')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'compliance'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                ✅ Compliance
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'analysis'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                📈 Analysis
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
            Transform School Infrastructure Assessment
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Leverage AI and machine learning to evaluate, analyze, and optimize educational infrastructure 
            with data-driven insights and compliance monitoring.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Real-time Analysis
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              BIS Standards Compliance
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
              AI-Powered Insights
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300 hover:shadow-3xl">
          {/* Tab Navigation for Mobile */}
          <div className="md:hidden border-b border-gray-200">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border-0 focus:ring-2 focus:ring-blue-500"
            >
              <option value="assessment">Assessment</option>
              <option value="insights">Insights</option>
              <option value="compliance">Compliance</option>
              <option value="analysis">Analysis</option>
            </select>
          </div>

          {/* Tab Panels */}
          <div className="p-6">
            {activeTab === 'assessment' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    Infrastructure Assessment
                  </h3>
                  <p className="text-gray-600">
                    Input school data or upload CSV files to get comprehensive infrastructure analysis
                  </p>
                </div>
                <SearchForm 
                  onDataUpdate={(data, results) => {
                    setSchoolData(data);
                    setAnalysisResults(results);
                  }}
                />
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    AI-Powered Insights
                  </h3>
                  <p className="text-gray-600">
                    Detailed analysis and recommendations based on machine learning models
                  </p>
                </div>
                <InsightsDashboard schoolData={schoolData} analysisResults={analysisResults} />
              </div>
            )}

            {activeTab === 'compliance' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    Compliance Monitoring
                  </h3>
                  <p className="text-gray-600">
                    Track adherence to BIS/NCERT standards and regulatory requirements
                  </p>
                </div>
                <ComplianceMetrics schoolData={schoolData} analysisResults={analysisResults} />
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    Infrastructure Analysis
                  </h3>
                  <p className="text-gray-600">
                    Comprehensive breakdown of infrastructure gaps and improvement opportunities
                  </p>
                </div>
                <InfrastructureAnalysis schoolData={schoolData} analysisResults={analysisResults} />
              </div>
            )}
          </div>
        </div>

        {/* Key Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
            <p className="text-gray-600 text-sm">
              Advanced machine learning models provide accurate infrastructure need scores and detailed insights.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Compliance Monitoring</h3>
            <p className="text-gray-600 text-sm">
              Automated checking against BIS/NCERT standards with detailed compliance reports.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Actionable Insights</h3>
            <p className="text-gray-600 text-sm">
              Quantified recommendations with cost estimates for infrastructure improvements.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">IntelliSchool</h3>
            <p className="text-gray-400 text-sm">
              Revolutionizing educational infrastructure assessment through AI and data science
            </p>
            <div className="mt-6 text-gray-400 text-xs">
              © 2025 IntelliSchool. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
