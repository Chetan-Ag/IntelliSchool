import { ReactNode } from 'react'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4 mx-auto">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">
        {title}
      </h3>
      <p className="text-gray-600 text-center leading-relaxed">
        {description}
      </p>
    </div>
  )
}
