import { TrendingUp, School, CheckCircle, Users } from 'lucide-react'

export default function StatsSection() {
  const stats = [
    {
      icon: <School className="w-8 h-8 text-primary-600" />,
      value: "500+",
      label: "Schools Assessed",
      description: "Comprehensive infrastructure evaluation"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-success-600" />,
      value: "95%",
      label: "Accuracy Rate",
      description: "ML model performance"
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-warning-600" />,
      value: "100%",
      label: "Compliance Coverage",
      description: "BIS/NCERT standards"
    },
    {
      icon: <Users className="w-8 h-8 text-primary-600" />,
      value: "50K+",
      label: "Students Impacted",
      description: "Better learning environments"
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            IntelliSchool by the Numbers
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform has been transforming school infrastructure assessment 
            across the country with proven results and measurable impact.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-4">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stat.value}
              </div>
              <div className="text-lg font-semibold text-gray-700 mb-2">
                {stat.label}
              </div>
              <div className="text-sm text-gray-600">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-primary-900 mb-4">
              Ready to Join the Transformation?
            </h3>
            <p className="text-primary-700 mb-6">
              Start your school's infrastructure assessment journey today and 
              discover how AI can optimize your educational resources.
            </p>
            <button className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
              Get Started Now
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
