import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Award,
  CheckCircle,
  ChefHat,
  Clock,
  Heart,
  MapPin,
  Shield,
  Star,
  Target,
  TrendingUp,
  Users,
  Utensils,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Import hero images
import heroImage1 from "@/assets/images/hero/Gemini_Generated_Image_afvupeafvupeafvu.png";
import heroImage2 from "@/assets/images/hero/Gemini_Generated_Image_dwlbjcdwlbjcdwlb.png";
import heroImage3 from "@/assets/images/hero/Gemini_Generated_Image_k5p5g8k5p5g8k5p5.png";

const About: React.FC = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const heroImages = [heroImage1, heroImage2, heroImage3];

  useEffect(() => {
    setIsVisible(true);
    // Rotate hero background images
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Counter animation hook
  const useCountUp = (
    end: number,
    duration: number = 2000,
    start: number = 0
  ) => {
    const [count, setCount] = useState(start);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
      if (!hasStarted) return;

      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        setCount((prev) => {
          if (prev + increment >= end) {
            clearInterval(timer);
            return end;
          }
          return prev + increment;
        });
      }, 16);

      return () => clearInterval(timer);
    }, [hasStarted, end, duration]);

    return {
      count: Math.floor(count),
      startCounting: () => setHasStarted(true),
    };
  };

  const happyCustomers = useCountUp(1000);
  const homeCooks = useCountUp(200);
  const locations = useCountUp(50);
  const rating = useCountUp(48, 2000, 0); // For 4.8 rating
  const teamMembers = [
    {
      name: "Priya Sharma",
      role: "Founder & CEO",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face",
      bio: "Passionate about connecting food lovers with authentic home cooks.",
    },
    {
      name: "Raj Kumar",
      role: "Head of Operations",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      bio: "Ensuring smooth operations and quality control across all kitchens.",
    },
    {
      name: "Meera Patel",
      role: "Chef Partner Lead",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      bio: "Building relationships with talented home cooks and chefs.",
    },
  ];

  const values = [
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Made with Love",
      description:
        "Every dish is prepared with care and passion by skilled home cooks who take pride in their craft.",
      color: "bg-red-500",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Quality Assured",
      description:
        "We maintain strict hygiene standards and quality checks to ensure every meal is safe and delicious.",
      color: "bg-green-500",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Community First",
      description:
        "We support local cooks and create opportunities for home-based food entrepreneurs to thrive.",
      color: "bg-blue-500",
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Authentic Flavors",
      description:
        "Traditional recipes passed down through generations, preserving the authentic taste of Tamil cuisine.",
      color: "bg-orange-500",
    },
  ];

  const milestones = [
    {
      year: "2023",
      event: "ChefSync Founded",
      description:
        "Started with a vision to connect food lovers with home cooks",
    },
    {
      year: "2023",
      event: "50+ Cooks Onboarded",
      description:
        "Reached our first milestone of partnering with 50 talented cooks",
    },
    {
      year: "2024",
      event: "1000+ Happy Customers",
      description: "Crossed 1000 satisfied customers across Chennai",
    },
    {
      year: "2024",
      event: "Multiple Locations",
      description: "Expanded to serve 50+ locations in Chennai and suburbs",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section with Dynamic Background */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-2000 ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"></div>

        <div
          className={`relative z-10 text-center px-4 max-w-5xl mx-auto transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <Badge className="mb-8 bg-orange-100/90 text-orange-800 dark:bg-orange-900/90 dark:text-orange-200 animate-scaleIn backdrop-blur-sm px-6 py-2 text-lg">
            <Utensils className="w-4 h-4 mr-2" />
            About ChefSync
          </Badge>

          <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 animate-slideUp">
            Connecting Hearts
            <span className="block text-gradient-primary bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mt-2 animate-slideUp animation-delay-200">
              Through Food
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed animate-slideUp animation-delay-400 backdrop-blur-sm bg-black/30 p-6 rounded-2xl border border-white/20">
            ChefSync is more than just a food platform. We're a vibrant
            community that celebrates the artistry of home cooking and brings
            authentic Tamil flavors directly to your doorstep with love and
            care.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 animate-slideUp animation-delay-600">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 text-lg transform hover:scale-105 transition-all duration-300 shadow-2xl"
              onClick={() => navigate("/menu")}
            >
              Explore Our Menu
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg backdrop-blur-sm transform hover:scale-105 transition-all duration-300"
              onClick={() => navigate("/contact")}
            >
              Join as Cook Partner
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        {/* Our Story */}
        <div className="mb-20">
          <Card className="overflow-hidden animate-slideUp animation-delay-600 shadow-2xl border-0">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative h-80 md:h-auto group">
                <img
                  src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop"
                  alt="Traditional cooking with love"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
                <div className="absolute bottom-6 left-6">
                  <Badge className="bg-orange-500/90 text-white backdrop-blur-sm">
                    <Heart className="w-4 h-4 mr-2" />
                    Made with Love
                  </Badge>
                </div>
              </div>
              <CardContent className="p-10 flex flex-col justify-center bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-gray-800 dark:to-gray-900">
                <Badge className="w-fit mb-4 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  Our Beginning
                </Badge>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                  A Story Born from
                  <span className="block text-orange-600 dark:text-orange-400">
                    Passion & Purpose
                  </span>
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed text-lg">
                  Born from a simple belief that the best food comes from the
                  heart, ChefSync started as a way to bridge the gap between
                  passionate home cooks and food enthusiasts seeking authentic,
                  homemade meals.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed text-lg">
                  We recognized that many talented cooks in our community had
                  incredible skills but lacked a platform to share their
                  culinary creations. Today, we're proud to be that platform,
                  empowering home cooks while delivering exceptional food
                  experiences.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-sm">
                    <Star className="h-8 w-8 text-yellow-500 fill-current mx-auto mb-2 animate-float" />
                    <div className="font-bold text-2xl text-gray-900 dark:text-white">
                      4.8+
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Customer Rating
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-sm">
                    <Users className="h-8 w-8 text-blue-500 mx-auto mb-2 animate-float animation-delay-200" />
                    <div className="font-bold text-2xl text-gray-900 dark:text-white">
                      200+
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Partner Cooks
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Our Values */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Target className="w-4 h-4 mr-2" />
              What Drives Us
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 animate-slideUp">
              Our Core
              <span className="block text-blue-600 dark:text-blue-400">
                Values
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto animate-slideUp animation-delay-200 leading-relaxed">
              The fundamental principles that shape our mission and guide every
              decision we make
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className="group text-center hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:rotate-1 animate-scaleIn border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardContent className="p-8">
                  <div
                    className={`relative inline-flex items-center justify-center w-20 h-20 rounded-2xl ${value.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse"></div>
                    <div
                      className="relative animate-float"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {value.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-orange-600 transition-colors duration-300">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base">
                    {value.description}
                  </p>
                  <div className="mt-4 w-12 h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
                <div
                  key={index}
                  className={`flex items-center ${
                    index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                  } animate-slideUp`}
                  style={{ animationDelay: `${index * 300}ms` }}
                >
                  <div
                    className={`w-1/2 ${
                      index % 2 === 0 ? "pr-8 text-right" : "pl-8 text-left"
                    }`}
                  >
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
              <Card
                key={index}
                className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 animate-scaleIn"
                style={{ animationDelay: `${index * 200}ms` }}
              >
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
                Join our community of talented home cooks and turn your passion
                for cooking into a rewarding opportunity.
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

        {/* Interactive Stats Section */}
        <div className="mb-20">
          <Card className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white border-0 shadow-2xl animate-fadeIn animation-delay-800">
            <CardContent className="p-12">
              <div className="text-center mb-8">
                <Badge className="mb-4 bg-white/20 text-white border-white/30">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Our Impact in Numbers
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Growing Together, One Meal at a Time
                </h2>
              </div>

              <div
                className="grid grid-cols-2 md:grid-cols-4 gap-8"
                onMouseEnter={() => {
                  happyCustomers.startCounting();
                  homeCooks.startCounting();
                  locations.startCounting();
                  rating.startCounting();
                }}
              >
                <div className="text-center group">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Users className="relative h-12 w-12 mx-auto mb-4 animate-float" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-2 animate-scaleIn">
                    {happyCustomers.count.toLocaleString()}+
                  </div>
                  <div className="text-white/90 text-lg font-medium">
                    Happy Customers
                  </div>
                </div>

                <div className="text-center group">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <ChefHat className="relative h-12 w-12 mx-auto mb-4 animate-float animation-delay-200" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-2 animate-scaleIn animation-delay-200">
                    {homeCooks.count}+
                  </div>
                  <div className="text-white/90 text-lg font-medium">
                    Partner Cooks
                  </div>
                </div>

                <div className="text-center group">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <MapPin className="relative h-12 w-12 mx-auto mb-4 animate-float animation-delay-400" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-2 animate-scaleIn animation-delay-400">
                    {locations.count}+
                  </div>
                  <div className="text-white/90 text-lg font-medium">
                    Service Locations
                  </div>
                </div>

                <div className="text-center group">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Star className="relative h-12 w-12 mx-auto mb-4 animate-float animation-delay-600 fill-current" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-2 animate-scaleIn animation-delay-600">
                    {(rating.count / 10).toFixed(1)}
                  </div>
                  <div className="text-white/90 text-lg font-medium">
                    Average Rating
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center animate-slideUp animation-delay-800">
          <Card className="bg-gradient-to-br from-gray-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-xl">
            <CardContent className="p-12">
              <Zap className="h-16 w-16 mx-auto mb-6 text-orange-500 animate-float" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Ready to Experience
                <span className="block text-orange-600 dark:text-orange-400">
                  Authentic Flavors?
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                Join thousands of food lovers who trust ChefSync for their daily
                meals. Taste the difference that home-cooked food makes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-10 py-4 text-lg transform hover:scale-105 transition-all duration-300 shadow-xl"
                  onClick={() => navigate("/menu")}
                >
                  Order Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-10 py-4 text-lg transform hover:scale-105 transition-all duration-300"
                  onClick={() => navigate("/contact")}
                >
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default About;
