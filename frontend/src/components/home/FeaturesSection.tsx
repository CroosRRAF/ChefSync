import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChefHat, Clock, MapPin, Star, Shield, Utensils } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <ChefHat className="h-8 w-8" />,
      title: 'Multiple Home Cooks',
      description: 'Choose from 200+ passionate home cooks in your area, each with their unique specialties and authentic recipes.',
      color: 'bg-orange-500'
    },
    {
      icon: <Utensils className="h-8 w-8" />,
      title: 'Fresh Homemade Food',
      description: 'Every dish is prepared fresh to order using traditional methods and authentic ingredients for the best taste.',
      color: 'bg-green-500'
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: 'Local Flavors',
      description: 'Experience authentic Tamil cuisine and regional specialties from cooks who know the traditional recipes by heart.',
      color: 'bg-blue-500'
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: 'Quick Delivery',
      description: 'Fast delivery within 30-45 minutes with real-time tracking, ensuring your food arrives hot and fresh.',
      color: 'bg-purple-500'
    },
    {
      icon: <Star className="h-8 w-8" />,
      title: 'Rated Cooks',
      description: 'All cooks are verified and rated by customers, ensuring consistent quality and authentic taste in every order.',
      color: 'bg-yellow-500'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Quality Assured',
      description: 'Strict hygiene standards and quality checks ensure every meal meets our high standards for safety and taste.',
      color: 'bg-red-500'
    }
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose ChefSync?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Experience the perfect blend of tradition and convenience with our unique cloud kitchen platform
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg"
            >
              <CardContent className="p-8 text-center">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-orange-500 transition-colors duration-300">
                  {feature.title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-full px-8 py-4 shadow-lg">
            <div className="flex -space-x-2">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face"
                alt="Cook 1"
                className="w-10 h-10 rounded-full border-2 border-white"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
                alt="Cook 2"
                className="w-10 h-10 rounded-full border-2 border-white"
              />
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                alt="Cook 3"
                className="w-10 h-10 rounded-full border-2 border-white"
              />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Join 1000+ Happy Customers</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Experience authentic homemade food today</div>
            </div>
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
              ))}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">4.8</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
