import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Users, 
  Award, 
  Shield, 
  ChefHat, 
  MapPin,
  Star,
  Clock,
  CheckCircle
} from 'lucide-react';

// Import hero images
import heroImage1 from '@/assets/images/hero/Gemini_Generated_Image_afvupeafvupeafvu.png';
import heroImage2 from '@/assets/images/hero/Gemini_Generated_Image_dwlbjcdwlbjcdwlb.png';
import heroImage3 from '@/assets/images/hero/Gemini_Generated_Image_k5p5g8k5p5g8k5p5.png';

const About: React.FC = () => {
  const teamMembers = [
    {
      name: 'Priya Sharma',
      role: 'Founder & CEO',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face',
      bio: 'Passionate about connecting food lovers with authentic home cooks.'
    },
    {
      name: 'Raj Kumar',
      role: 'Head of Operations',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'Ensuring smooth operations and quality control across all kitchens.'
    },
    {
      name: 'Meera Patel',
      role: 'Chef Partner Lead',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      bio: 'Building relationships with talented home cooks and chefs.'
    }
  ];

  const values = [
    {
      icon: <Heart className="h-8 w-8" />,
      title: 'Made with Love',
      description: 'Every dish is prepared with care and passion by skilled home cooks who take pride in their craft.',
      color: 'bg-red-500'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Quality Assured',
      description: 'We maintain strict hygiene standards and quality checks to ensure every meal is safe and delicious.',
      color: 'bg-green-500'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Community First',
      description: 'We support local cooks and create opportunities for home-based food entrepreneurs to thrive.',
      color: 'bg-blue-500'
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: 'Authentic Flavors',
      description: 'Traditional recipes passed down through generations, preserving the authentic taste of Tamil cuisine.',
      color: 'bg-orange-500'
    }
  ];

  const milestones = [
    { year: '2023', event: 'ChefSync Founded', description: 'Started with a vision to connect food lovers with home cooks' },
    { year: '2023', event: '50+ Cooks Onboarded', description: 'Reached our first milestone of partnering with 50 talented cooks' },
    { year: '2024', event: '1000+ Happy Customers', description: 'Crossed 1000 satisfied customers across Chennai' },
    { year: '2024', event: 'Multiple Locations', description: 'Expanded to serve 50+ locations in Chennai and suburbs' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section with Background Image */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{ backgroundImage: `url(${heroImage1})` }}
        />
        <div className="absolute inset-0 bg-black/50"></div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <Badge className="mb-6 bg-orange-100/90 text-orange-800 dark:bg-orange-900/90 dark:text-orange-200 animate-fadeIn backdrop-blur-sm">
            About ChefSync
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 animate-slideUp">
            Connecting Hearts Through
            <span className="block text-orange-400 mt-4 animate-slideUp animation-delay-200">Homemade Food</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed animate-slideUp animation-delay-400 backdrop-blur-sm bg-black/20 p-4 rounded-lg">
            ChefSync is more than just a food platform. We're a community that celebrates the art of home cooking 
            and brings authentic Tamil flavors directly to your doorstep.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Our Story */}
        <div className="mb-16">
          <Card className="overflow-hidden animate-slideUp animation-delay-600">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative h-64 md:h-auto">
                <img
                  src="https://images.unsplash.com/photo-1749359669134-289058a33c63"
                  alt="Traditional cooking"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
              </div>
              <CardContent className="p-8 flex flex-col justify-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Story</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  Born from a simple belief that the best food comes from the heart, ChefSync started as a way to 
                  bridge the gap between passionate home cooks and food enthusiasts seeking authentic, homemade meals.
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  We recognized that many talented cooks in our community had incredible skills but lacked a platform 
                  to share their culinary creations. Today, we're proud to be that platform, empowering home cooks 
                  while delivering exceptional food experiences.
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="font-semibold">4.8+ Rating</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold">200+ Cooks</span>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 animate-slideUp">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto animate-slideUp animation-delay-200">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 animate-scaleIn" style={{ animationDelay: `${index * 200}ms` }}>
                <CardContent className="p-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${value.color} text-white mb-4 animate-float`}>
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Our Journey */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 animate-slideUp">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto animate-slideUp animation-delay-200">
              Key milestones in our mission to connect communities through food
            </p>
          </div>

          <div className="relative animate-fadeIn animation-delay-400">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-orange-200 dark:bg-orange-800"></div>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} animate-slideUp`} style={{ animationDelay: `${index * 300}ms` }}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <Card className="hover:shadow-lg transition-shadow duration-300">
                      <CardContent className="p-6">
                        <Badge className="mb-2 bg-orange-100 text-orange-800">
                          {milestone.year}
                        </Badge>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {milestone.event}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {milestone.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-orange-500 rounded-full animate-scaleIn">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 animate-slideUp">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto animate-slideUp animation-delay-200">
              The passionate people behind ChefSync
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 animate-scaleIn" style={{ animationDelay: `${index * 200}ms` }}>
                <CardContent className="p-6">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover animate-float"
                  />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {member.name}
                  </h3>
                  <Badge className="mb-3 bg-orange-100 text-orange-800">
                    {member.role}
                  </Badge>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cook Partner Program */}
        <div className="mb-16">
          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white overflow-hidden animate-slideUp animation-delay-600">
            <CardContent className="p-8 md:p-12 text-center">
              <ChefHat className="h-16 w-16 mx-auto mb-6 text-white/90 animate-float" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Become a Cook Partner
              </h2>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                Join our community of talented home cooks and turn your passion for cooking into a rewarding opportunity.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-white/90 animate-float" />
                  <h3 className="font-semibold mb-1">Flexible Hours</h3>
                  <p className="text-white/80 text-sm">Cook when you want</p>
                </div>
                <div className="text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-white/90 animate-float" />
                  <h3 className="font-semibold mb-1">From Home</h3>
                  <p className="text-white/80 text-sm">Use your own kitchen</p>
                </div>
                <div className="text-center">
                  <Award className="h-8 w-8 mx-auto mb-2 text-white/90 animate-float" />
                  <h3 className="font-semibold mb-1">Recognition</h3>
                  <p className="text-white/80 text-sm">Build your reputation</p>
                </div>
              </div>
              <Button 
                size="lg"
                className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-3 transform hover:scale-105 transition-all duration-300"
              >
                Join as Cook Partner
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="text-center animate-fadeIn animation-delay-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2 animate-scaleIn">1000+</div>
              <div className="text-gray-600 dark:text-gray-400">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2 animate-scaleIn animation-delay-200">200+</div>
              <div className="text-gray-600 dark:text-gray-400">Home Cooks</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2 animate-scaleIn animation-delay-400">50+</div>
              <div className="text-gray-600 dark:text-gray-400">Locations</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2 animate-scaleIn animation-delay-600">4.8</div>
              <div className="text-gray-600 dark:text-gray-400">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;