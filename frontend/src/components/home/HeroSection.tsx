import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, ArrowRight, MapPin, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface HeroSectionProps {
  onStartOrder: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onStartOrder }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const heroImages = [
    'https://images.unsplash.com/photo-1736239092023-ba677fd6751c',
    'https://images.unsplash.com/photo-1723066217456-cf0b10ceda2b',
    'https://images.unsplash.com/photo-1736239092819-da2e9b4b5c6b',
    'https://images.unsplash.com/photo-1749359669134-289058a33c63'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const handleStartOrderClick = () => {
    onStartOrder();
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image Slideshow */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt={`Tamil cuisine ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center lg:text-left">
        <div className="max-w-4xl mx-auto lg:mx-0">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-6 py-2 mb-6 animate-fadeIn">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-white text-sm font-medium">Rated #1 Cloud Kitchen Platform</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-slideUp">
            Authentic Homemade Food
            <span className="block text-orange-400 mt-2">From Local Cooks</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto lg:mx-0 animate-slideUp animation-delay-200">
            Experience the rich flavors of Tamil cuisine, prepared with love by passionate home cooks in your neighborhood.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-10 animate-slideUp animation-delay-400">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <MapPin className="h-5 w-5 text-orange-400" />
              <span className="text-white font-medium">50+ Locations</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <Clock className="h-5 w-5 text-green-400" />
              <span className="text-white font-medium">30 Min Delivery</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
              <span className="text-white font-medium">4.8+ Rating</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slideUp animation-delay-600">
            <Button
              onClick={handleStartOrderClick}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 text-lg rounded-full transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-orange-500/25"
            >
              Start Order
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              className="border-2 border-white/50 text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg rounded-full backdrop-blur-sm bg-white/10 transform hover:scale-105 transition-all duration-300"
              onClick={() => navigate('/about')}
            >
              <Play className="mr-2 h-5 w-5" />
              Explore Cooks
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center lg:justify-start gap-8 opacity-80 animate-fadeIn animation-delay-800">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">1000+</div>
              <div className="text-gray-300 text-sm">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">200+</div>
              <div className="text-gray-300 text-sm">Home Cooks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">50+</div>
              <div className="text-gray-300 text-sm">Dishes Daily</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>

      {/* Image Navigation Dots */}
      <div className="absolute bottom-6 right-6 flex space-x-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentImageIndex
                ? 'bg-orange-500 w-8'
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
