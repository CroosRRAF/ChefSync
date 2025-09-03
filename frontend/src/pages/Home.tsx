import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import heroImage from '@/assets/hero-food-banner.jpg';
import {
  Clock,
  Shield,
  Truck,
  Star,
  ChefHat,
  Users,
  Package,
  ArrowRight,
  Play,
  CheckCircle
} from 'lucide-react';

const Home: React.FC = () => {
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleOrderTypeSelect = (type: 'normal' | 'bulk') => {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { redirectTo: `/menu?mode=${type}` } });
      return;
    }
    navigate(`/menu?mode=${type}`);
    setOrderModalOpen(false);
  };

  const features = [
    {
      icon: Clock,
      title: 'Fast Delivery',
      description: 'Get your food delivered in 30 minutes or less',
      color: 'text-primary'
    },
    {
      icon: Shield,
      title: 'Fresh & Hygienic',
      description: 'All meals prepared with highest hygiene standards',
      color: 'text-secondary'
    },
    {
      icon: ChefHat,
      title: 'Expert Chefs',
      description: 'Prepared by professional chefs with years of experience',
      color: 'text-accent'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Happy Customers', icon: Users },
    { number: '500+', label: 'Daily Orders', icon: Package },
    { number: '4.8', label: 'Average Rating', icon: Star },
    { number: '25min', label: 'Avg Delivery', icon: Clock }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Food Enthusiast',
      content: 'ChefSync has completely changed how I order food. The quality is consistently amazing and delivery is always on time!',
      rating: 5,
      avatar: '👩‍💼'
    },
    {
      name: 'Mike Chen',
      role: 'Busy Professional',
      content: 'Perfect for our office bulk orders. The variety is great and the bulk ordering feature saves us so much time.',
      rating: 5,
      avatar: '👨‍💻'
    },
    {
      name: 'Priya Sharma',
      role: 'Home Cook',
      content: 'Love the fresh ingredients and authentic flavors. It feels like home-cooked meals delivered to my door.',
      rating: 5,
      avatar: '👩‍🍳'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Delicious food spread" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 hero-gradient" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <div className="animate-fade-up">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Rated #1 Food Delivery Platform
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Delicious Food
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                Delivered Fast
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
              Experience the finest cuisine from top chefs, delivered fresh to your doorstep in minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-glow">
                    Start Order
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center text-2xl">Choose Order Type</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Button
                      onClick={() => handleOrderTypeSelect('normal')}
                      variant="outline"
                      className="w-full h-20 flex-col space-y-2 hover:bg-primary hover:text-primary-foreground"
                    >
                      <Package className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-semibold">Normal Order</div>
                        <div className="text-sm text-muted-foreground">Individual meals & small portions</div>
                      </div>
                    </Button>
                    
                    <Button
                      onClick={() => handleOrderTypeSelect('bulk')}
                      variant="outline"
                      className="w-full h-20 flex-col space-y-2 hover:bg-secondary hover:text-secondary-foreground"
                    >
                      <Users className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-semibold">Bulk Order</div>
                        <div className="text-sm text-muted-foreground">10+ items for events & offices</div>
                      </div>
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                onClick={() => navigate('/about')}
              >
                <Play className="mr-2 h-5 w-5" />
                Learn More
              </Button>
            </div>
          </div>

          {/* Floating Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 animate-fade-up animation-delay-400">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-4 text-center text-white">
                  <stat.icon className="h-6 w-6 mx-auto mb-2 text-accent" />
                  <div className="text-2xl font-bold">{stat.number}</div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce-gentle">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">Why Choose ChefSync</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Excellence in Every Bite
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're committed to delivering not just food, but an exceptional culinary experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-card transition-all duration-300 food-card-hover">
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">Customer Reviews</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              What Our Customers Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="group hover:shadow-card transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{testimonial.avatar}</div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Experience Amazing Food?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of satisfied customers and discover your new favorite meals today.
          </p>
          <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
            <DialogTrigger asChild>
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Order Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </section>
    </div>
  );
};

export default Home;