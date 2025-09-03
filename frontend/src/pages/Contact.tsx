import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  Send,
  ExternalLink
} from 'lucide-react';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const Contact: React.FC = () => {
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    try {
      // TODO: Implement actual form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you within 24 hours.",
      });
      
      reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: "Please try again or contact us directly.",
      });
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Our Location',
      details: ['123 Galle Road', 'Colombo 03, Sri Lanka'],
      action: 'Get Directions',
      link: 'https://maps.google.com'
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: ['+94 11 234 5678', '+94 77 123 4567'],
      action: 'Call Now',
      link: 'tel:+94112345678'
    },
    {
      icon: Mail,
      title: 'Email Us',
      details: ['hello@chefsync.lk', 'support@chefsync.lk'],
      action: 'Send Email',
      link: 'mailto:hello@chefsync.lk'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: ['Mon - Sun: 9:00 AM - 11:00 PM', 'Customer Support: 24/7'],
      action: 'View Schedule',
      link: '#'
    }
  ];

  const socialLinks = [
    { name: 'WhatsApp', link: 'https://wa.me/94771234567', color: 'bg-green-500' },
    { name: 'Facebook', link: 'https://facebook.com/chefsync', color: 'bg-blue-600' },
    { name: 'Instagram', link: 'https://instagram.com/chefsync', color: 'bg-pink-500' },
    { name: 'Twitter', link: 'https://twitter.com/chefsync', color: 'bg-blue-400' }
  ];

  const validateSriLankanPhone = (phone: string) => {
    const phoneRegex = /^(\+94|0)?[1-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, '')) || 'Please enter a valid Sri Lankan phone number';
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Hero Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6">Get in Touch</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            We'd Love to
            <span className="block text-gradient-primary">Hear From You</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have a question, suggestion, or need support? Our friendly team is here to help 
            you have the best possible experience with ChefSync.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card className="shadow-food">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <MessageSquare className="h-6 w-6 mr-2 text-primary" />
                  Send Us a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        {...register('name', {
                          required: 'Name is required',
                          minLength: {
                            value: 2,
                            message: 'Name must be at least 2 characters'
                          },
                          maxLength: {
                            value: 100,
                            message: 'Name must be less than 100 characters'
                          }
                        })}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+94 77 123 4567"
                        {...register('phone', {
                          required: 'Phone number is required',
                          validate: validateSriLankanPhone
                        })}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Please enter a valid email address'
                        }
                      })}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help you..."
                      className="min-h-[120px]"
                      {...register('message', {
                        required: 'Message is required',
                        minLength: {
                          value: 10,
                          message: 'Message must be at least 10 characters'
                        },
                        maxLength: {
                          value: 1000,
                          message: 'Message must be less than 1000 characters'
                        }
                      })}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full button-gradient-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              <p className="text-muted-foreground mb-8">
                Whether you're a customer with a question or a restaurant partner looking to join us, 
                we're always here to help. Reach out through any of these channels.
              </p>
            </div>

            <div className="grid gap-6">
              {contactInfo.map((info, index) => (
                <Card key={index} className="hover:shadow-card transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <info.icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{info.title}</h3>
                        {info.details.map((detail, idx) => (
                          <p key={idx} className="text-muted-foreground text-sm">
                            {detail}
                          </p>
                        ))}
                        {info.link && info.link !== '#' && (
                          <Button
                            variant="link"
                            className="p-0 h-auto mt-2 text-primary"
                            onClick={() => window.open(info.link, '_blank')}
                          >
                            {info.action}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Social Media Links */}
            <div>
              <h3 className="font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-3">
                {socialLinks.map((social, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className={`${social.color} text-white border-0 hover:opacity-80`}
                    onClick={() => window.open(social.link, '_blank')}
                  >
                    {social.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* FAQ Link */}
            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Frequently Asked Questions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Looking for quick answers? Check out our FAQ section for common questions 
                  about orders, delivery, and our services.
                </p>
                <Button variant="outline" size="sm">
                  View FAQ
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Map Section (Placeholder) */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Find Us</h2>
            <p className="text-muted-foreground">
              Visit our main office or any of our cloud kitchen locations across Colombo.
            </p>
          </div>
          
          <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Interactive map coming soon</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.open('https://maps.google.com', '_blank')}
              >
                View on Google Maps
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;