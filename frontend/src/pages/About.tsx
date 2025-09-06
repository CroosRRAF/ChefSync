import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Award,
  Clock,
  Users,
  ChefHat,
  Heart,
  Truck,
  CheckCircle,
  Star
} from 'lucide-react';

const About: React.FC = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: Shield,
      title: 'Safety First',
      description: 'Highest hygiene standards and food safety protocols in every kitchen',
      color: 'text-primary'
    },
    {
      icon: ChefHat,
      title: 'Quality Cuisine',
      description: 'Expert chefs creating authentic flavors with premium ingredients',
      color: 'text-secondary'
    },
    {
      icon: Clock,
      title: 'Fast Delivery',
      description: 'Lightning-fast delivery without compromising on food quality',
      color: 'text-accent'
    },
    {
      icon: Heart,
      title: 'Customer Care',
      description: 'Dedicated support team ensuring exceptional customer experience',
      color: 'text-primary'
    }
  ];

  const achievements = [
    { icon: Users, stat: '50,000+', label: 'Happy Customers' },
    { icon: Award, stat: '4.8/5', label: 'Average Rating' },
    { icon: Truck, stat: '25min', label: 'Average Delivery' },
    { icon: ChefHat, stat: '100+', label: 'Partner Restaurants' }
  ];

  const certifications = [
    'ISO 22000 Food Safety',
    'HACCP Certified',
    'Sri Lanka Health Ministry Approved',
    'Green Kitchen Initiative'
  ];

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Hero Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6">About ChefSync</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Revolutionizing Food
            <span className="block text-gradient-primary">Delivery Experience</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            ChefSync is Sri Lanka's premier cloud kitchen platform, connecting food lovers 
            with exceptional cuisine through innovative technology and uncompromising quality standards.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">Our Mission</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Making Great Food Accessible to Everyone
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                We believe exceptional food should be accessible to everyone, anywhere, anytime. 
                Our mission is to bridge the gap between talented chefs and food enthusiasts 
                through cutting-edge technology and reliable service.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                From our state-of-the-art cloud kitchens to our efficient delivery network, 
                every aspect of ChefSync is designed to deliver not just food, but experiences 
                that bring joy to your dining table.
              </p>
              <Button onClick={() => navigate('/menu')} className="button-gradient-primary">
                Explore Our Menu
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <Card key={index} className="text-center hover:shadow-card transition-all duration-300">
                  <CardContent className="p-6">
                    <achievement.icon className="h-8 w-8 mx-auto mb-4 text-primary" />
                    <div className="text-3xl font-bold mb-2 text-gradient-primary">
                      {achievement.stat}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {achievement.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">Our Values</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              What Drives Us Every Day
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our core values shape every decision we make and every service we deliver.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-card transition-all duration-300 food-card-hover">
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
                    <value.icon className={`h-8 w-8 ${value.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Safety & Certifications Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-success text-success-foreground">Safety Certified</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Hygiene & Safety Standards
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Your health and safety are our top priorities. Our kitchens maintain the 
                highest international standards for food safety, with regular audits and 
                continuous monitoring to ensure every meal meets our quality benchmarks.
              </p>
              
              <div className="space-y-4">
                {certifications.map((cert, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="font-medium">{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-success/10 p-8 rounded-xl">
              <div className="text-center">
                <Shield className="h-16 w-16 text-success mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-4">100% Safe & Hygienic</h3>
                <p className="text-muted-foreground mb-6">
                  Every meal is prepared in certified kitchens following strict hygiene protocols, 
                  ensuring your food is not just delicious but completely safe.
                </p>
                <div className="flex items-center justify-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-current text-yellow-500" />
                  ))}
                  <span className="ml-2 font-semibold">5-Star Safety Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">Our Team</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Passionate People Behind Great Food
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From our expert chefs to our dedicated delivery partners, every team member 
              is committed to bringing you the best culinary experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-card transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-4">
                  👨‍🍳
                </div>
                <h3 className="text-xl font-semibold mb-2">Expert Chefs</h3>
                <p className="text-muted-foreground">
                  Culinary masters with years of experience crafting authentic and innovative dishes.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-card transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground text-2xl font-bold mx-auto mb-4">
                  🚚
                </div>
                <h3 className="text-xl font-semibold mb-2">Delivery Heroes</h3>
                <p className="text-muted-foreground">
                  Reliable delivery partners ensuring your food reaches you fresh and on time.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-card transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center text-accent-foreground text-2xl font-bold mx-auto mb-4">
                  🎯
                </div>
                <h3 className="text-xl font-semibold mb-2">Support Team</h3>
                <p className="text-muted-foreground">
                  Dedicated customer support ensuring every interaction exceeds your expectations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Experience ChefSync?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join our community of food lovers and discover why we're Sri Lanka's 
            most trusted food delivery platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/menu')}
              className="text-lg px-8 py-6"
            >
              Order Now
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/contact')}
              className="text-lg px-8 py-6 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              Get in Touch
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;