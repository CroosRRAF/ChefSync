import AddressModal from "@/components/home/AddressModal";
import FeaturesSection from "@/components/home/FeaturesSection";
import HeroSection from "@/components/home/HeroSection";
import OrderTypeModal from "@/components/home/OrderTypeModal";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowRight,
  ChefHat,
  Clock,
  Package,
  Shield,
  Star,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [orderTypeModalOpen, setOrderTypeModalOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<any>(null);
  const [orderType, setOrderType] = useState<"normal" | "bulk" | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleStartOrder = () => {
    if (!isAuthenticated) {
      navigate("/auth/login", { state: { redirectTo: "/menu" } });
      return;
    }
    setAddressModalOpen(true);
  };

  const handleAddressContinue = (address: any) => {
    setDeliveryAddress(address);
    setOrderTypeModalOpen(true);
  };

  const handleOrderTypeContinue = (type: "normal" | "bulk") => {
    setOrderType(type);
    navigate(`/menu?mode=${type}`);
  };

  const features = [
    {
      icon: Clock,
      title: "Fast Delivery",
      description: "Get your food delivered in 30 minutes or less",
      color: "text-primary",
    },
    {
      icon: Shield,
      title: "Fresh & Hygienic",
      description: "All meals prepared with highest hygiene standards",
      color: "text-secondary",
    },
    {
      icon: ChefHat,
      title: "Expert Chefs",
      description: "Prepared by professional chefs with years of experience",
      color: "text-accent",
    },
  ];

  const stats = [
    { number: "10K+", label: "Happy Customers", icon: Users },
    { number: "500+", label: "Daily Orders", icon: Package },
    { number: "4.8", label: "Average Rating", icon: Star },
    { number: "25min", label: "Avg Delivery", icon: Clock },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Food Enthusiast",
      content:
        "ChefSync has completely changed how I order food. The quality is consistently amazing and delivery is always on time!",
      rating: 5,
      avatar: "👩‍💼",
    },
    {
      name: "Mike Chen",
      role: "Busy Professional",
      content:
        "Perfect for our office bulk orders. The variety is great and the bulk ordering feature saves us so much time.",
      rating: 5,
      avatar: "👨‍💻",
    },
    {
      name: "Priya Sharma",
      role: "Home Cook",
      content:
        "Love the fresh ingredients and authentic flavors. It feels like home-cooked meals delivered to my door.",
      rating: 5,
      avatar: "👩‍🍳",
    },
  ];

  return (
    <div className="min-h-screen" style={{ cursor: "default" }}>
      {/* Hero Section */}
      <HeroSection onStartOrder={handleStartOrder} />

      {/* Features Section */}
      <FeaturesSection />

      {/* Modals */}
      <AddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onContinue={handleAddressContinue}
      />

      <OrderTypeModal
        isOpen={orderTypeModalOpen}
        onClose={() => setOrderTypeModalOpen(false)}
        onContinue={handleOrderTypeContinue}
      />

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
              <Card
                key={index}
                className="group hover:shadow-card transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-current text-yellow-500"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{testimonial.avatar}</div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </div>
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
            Join thousands of satisfied customers and discover your new favorite
            meals today.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-6"
            onClick={handleStartOrder}
          >
            Order Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
