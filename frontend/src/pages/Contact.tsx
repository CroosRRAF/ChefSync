import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageSquare,
  Send,
  CheckCircle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 2000);
  };

  const contactInfo = [
    {
      icon: <Phone className="h-6 w-6" />,
      title: 'Phone',
      details: ['+91 98765 43210', '+91 87654 32109'],
      description: 'Call us for immediate assistance'
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: 'Email',
      details: ['hello@chefsync.com', 'support@chefsync.com'],
      description: 'Send us an email anytime'
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: 'Office',
      details: ['123 Anna Salai, T. Nagar', 'Chennai, Tamil Nadu 600017'],
      description: 'Visit our office'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Business Hours',
      details: ['Mon - Fri: 9:00 AM - 8:00 PM', 'Sat - Sun: 10:00 AM - 6:00 PM'],
      description: 'We are here to help'
    }
  ];

  const faqs = [
    {
      question: 'How do I place an order?',
      answer: 'Simply click "Start Order", enter your delivery address, choose your order type, and browse our menu to select your favorite dishes.'
    },
    {
      question: 'What are your delivery areas?',
      answer: 'We currently deliver to 50+ locations across Chennai and surrounding areas. Enter your address to check if we deliver to your location.'
    },
    {
      question: 'How can I become a cook partner?',
      answer: 'You can join our cook partner program by contacting us through this form or calling our support number. We provide training and support to get you started.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major payment methods including UPI, credit/debit cards, net banking, and cash on delivery in select areas.'
    },
    {
      question: 'How do you ensure food quality?',
      answer: 'All our cook partners follow strict hygiene standards. We conduct regular quality checks and maintain cold chain delivery to ensure fresh, safe food.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 animate-fadeIn">
            Contact Us
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 animate-slideUp">
            Get in Touch
            <span className="block text-orange-500 mt-2 animate-slideUp animation-delay-200">We're Here to Help</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed animate-slideUp animation-delay-400">
            Have questions about our platform, want to become a cook partner, or need support? 
            We'd love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="animate-slideUp animation-delay-600">
              <CardContent className="p-8">
                <div className="flex items-center space-x-2 mb-6">
                  <MessageSquare className="h-6 w-6 text-orange-500" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Send us a Message
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        placeholder="What is this about?"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 transform hover:scale-105 transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Send Message
                        <Send className="ml-2 h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            {contactInfo.map((info, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-scaleIn" style={{ animationDelay: `${index * 200}ms` }}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-orange-500 animate-float">
                        {info.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {info.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {info.description}
                      </p>
                      {info.details.map((detail, i) => (
                        <p key={i} className="text-gray-600 dark:text-gray-300 text-sm">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Social Media */}
            <Card className="animate-scaleIn animation-delay-800">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Follow Us
                </h3>
                <div className="flex space-x-4">
                  <Button size="sm" variant="outline" className="p-2 hover:bg-orange-50 hover:border-orange-300 transition-all duration-300">
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="p-2 hover:bg-orange-50 hover:border-orange-300 transition-all duration-300">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="p-2 hover:bg-orange-50 hover:border-orange-300 transition-all duration-300">
                    <Instagram className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="p-2 hover:bg-orange-50 hover:border-orange-300 transition-all duration-300">
                    <Linkedin className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 animate-slideUp">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto animate-slideUp animation-delay-200">
              Quick answers to common questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-scaleIn" style={{ animationDelay: `${index * 200}ms` }}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0 animate-float" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Map Section (Placeholder) */}
        <Card className="overflow-hidden animate-fadeIn animation-delay-800">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-8 text-center text-white">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-white/90 animate-float" />
            <h3 className="text-2xl font-bold mb-2">Visit Our Office</h3>
            <p className="text-white/90 mb-4">
              123 Anna Salai, T. Nagar, Chennai, Tamil Nadu 600017
            </p>
            <Button className="bg-white text-orange-500 hover:bg-gray-100 transform hover:scale-105 transition-all duration-300">
              Get Directions
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Contact;