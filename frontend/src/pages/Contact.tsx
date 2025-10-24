import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ContactFormData, submitContactForm } from "@/services/service";
import {
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Twitter,
} from "lucide-react";
import React, { useState } from "react";

// Import hero images
import heroImage4 from "@/assets/images/hero/Gemini_Generated_Image_v86hq4v86hq4v86h.png";

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof typeof formData]);
  };

  const validateField = (field: string, value: string) => {
    let error = "";

    switch (field) {
      case "name":
        if (!value.trim()) {
          error = "Name is required";
        } else if (value.trim().length < 2) {
          error = "Name must be at least 2 characters";
        }
        break;
      case "email":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "subject":
        if (!value.trim()) {
          error = "Subject is required";
        } else if (value.trim().length < 3) {
          error = "Subject must be at least 3 characters";
        }
        break;
      case "message":
        if (!value.trim()) {
          error = "Message is required";
        } else if (value.trim().length < 10) {
          error = "Message must be at least 10 characters";
        }
        break;
      case "phone":
        if (value && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(value)) {
          error = "Please enter a valid phone number";
        }
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return error === "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = {
      name: true,
      email: true,
      phone: true,
      subject: true,
      message: true,
    };
    setTouched(allTouched);

    // Validate all fields
    const isNameValid = validateField("name", formData.name);
    const isEmailValid = validateField("email", formData.email);
    const isSubjectValid = validateField("subject", formData.subject);
    const isMessageValid = validateField("message", formData.message);
    const isPhoneValid = !formData.phone || validateField("phone", formData.phone);

    if (!isNameValid || !isEmailValid || !isSubjectValid || !isMessageValid || !isPhoneValid) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const contactData: ContactFormData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      };

      await submitContactForm(contactData);

      toast({
        title: "Message Sent Successfully!",
        description:
          "Thank you for contacting us. We'll get back to you within 24 hours.",
      });

      // Reset form
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      setErrors({});
      setTouched({});
    } catch (error) {
      console.error("Contact form submission error:", error);
      toast({
        variant: "destructive",
        title: "Failed to Send Message",
        description:
          "There was an error sending your message. Please try again or contact us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <Phone className="h-6 w-6" />,
      title: "Phone",
      details: ["+94 76 803 5092"],
      description: "Call us for immediate assistance",
      action: () => window.open("tel:+94768035092", "_self"),
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email",
      details: ["chefsync7@gmail.com"],
      description: "Send us an email anytime",
      action: () => window.open("mailto:chefsync7@gmail.com", "_self"),
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Office",
      details: ["Near 412-196 Nallur-Oddumadam Rd", "Jaffna, Sri Lanka"],
      description: "Visit our office",
      action: () =>
        window.open(
          "https://maps.google.com/?q=412-196+Nallur-Oddumadam+Rd,+Jaffna",
          "_blank"
        ),
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Business Hours",
      details: ["Mon - Fri: 8:00 AM - 9:00 PM", "Sat - Sun: 9:00 AM - 7:00 PM"],
      description: "We are here to help",
    },
  ];

  const socialMedia = [
    {
      name: "Twitter",
      icon: <Twitter className="h-5 w-5" />,
      url: "https://x.com/srilanka?s=21",
      color: "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600",
    },
    {
      name: "Instagram",
      icon: <Instagram className="h-5 w-5" />,
      url: "https://www.instagram.com/aajunek?igsh=dmhhazVtaHFsMDJ2",
      color: "hover:bg-pink-50 hover:border-pink-300 hover:text-pink-600",
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="h-5 w-5" />,
      url: "https://www.linkedin.com/in/arunnadarajah2024?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app",
      color: "hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700",
    },
    {
      name: "Facebook",
      icon: <Facebook className="h-5 w-5" />,
      url: "https://www.facebook.com/share/1KUqDabNZB/?mibextid=wwXIfr",
      color: "hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section with Background Image */}
      <div className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{ backgroundImage: `url(${heroImage4})` }}
        />
        <div className="absolute inset-0 bg-black/50"></div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <Badge className="mb-3 bg-orange-100/90 text-orange-800 dark:bg-orange-900/90 dark:text-orange-200 animate-fadeIn backdrop-blur-sm">
            Contact Us
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-4 animate-slideUp leading-tight">
            Get in Touch
            <span className="block text-orange-400 mt-1 md:mt-2 animate-slideUp animation-delay-200">
              We're Here to Help
            </span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed animate-slideUp animation-delay-400 backdrop-blur-sm bg-black/20 p-3 md:p-4 rounded-lg">
            Have questions about our platform, want to become a cook partner, or
            need support? We'd love to hear from you.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid lg:grid-cols-3 gap-5 mb-6 md:mb-8">
          {/* Contact Form */}
          <div className="lg:col-span-2" id="contact-form">
            <Card className="animate-slideUp animation-delay-600 shadow-xl border-0 hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                      Send us a Message
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Fill out the form below and we'll get back to you soon
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        onBlur={() => handleBlur("name")}
                        className={`transition-all duration-200 ${
                          touched.name && errors.name
                            ? "border-red-500 focus:ring-red-500"
                            : touched.name && !errors.name
                            ? "border-green-500 focus:ring-green-500"
                            : ""
                        }`}
                        aria-invalid={touched.name && !!errors.name}
                        aria-describedby={errors.name ? "name-error" : undefined}
                      />
                      {touched.name && errors.name && (
                        <p
                          id="name-error"
                          className="text-sm text-red-500 flex items-center gap-1 animate-slideDown"
                        >
                          <span className="text-xs">⚠</span> {errors.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        onBlur={() => handleBlur("email")}
                        className={`transition-all duration-200 ${
                          touched.email && errors.email
                            ? "border-red-500 focus:ring-red-500"
                            : touched.email && !errors.email
                            ? "border-green-500 focus:ring-green-500"
                            : ""
                        }`}
                        aria-invalid={touched.email && !!errors.email}
                        aria-describedby={errors.email ? "email-error" : undefined}
                      />
                      {touched.email && errors.email && (
                        <p
                          id="email-error"
                          className="text-sm text-red-500 flex items-center gap-1 animate-slideDown"
                        >
                          <span className="text-xs">⚠</span> {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+94 76 803 5092"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        onBlur={() => handleBlur("phone")}
                        className={`transition-all duration-200 ${
                          touched.phone && errors.phone
                            ? "border-red-500 focus:ring-red-500"
                            : touched.phone && formData.phone && !errors.phone
                            ? "border-green-500 focus:ring-green-500"
                            : ""
                        }`}
                        aria-invalid={touched.phone && !!errors.phone}
                        aria-describedby={errors.phone ? "phone-error" : undefined}
                      />
                      {touched.phone && errors.phone && (
                        <p
                          id="phone-error"
                          className="text-sm text-red-500 flex items-center gap-1 animate-slideDown"
                        >
                          <span className="text-xs">⚠</span> {errors.phone}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="subject" className="text-sm font-medium">
                        Subject <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="subject"
                        placeholder="What is this about?"
                        value={formData.subject}
                        onChange={(e) =>
                          handleInputChange("subject", e.target.value)
                        }
                        onBlur={() => handleBlur("subject")}
                        className={`transition-all duration-200 ${
                          touched.subject && errors.subject
                            ? "border-red-500 focus:ring-red-500"
                            : touched.subject && !errors.subject
                            ? "border-green-500 focus:ring-green-500"
                            : ""
                        }`}
                        aria-invalid={touched.subject && !!errors.subject}
                        aria-describedby={errors.subject ? "subject-error" : undefined}
                      />
                      {touched.subject && errors.subject && (
                        <p
                          id="subject-error"
                          className="text-sm text-red-500 flex items-center gap-1 animate-slideDown"
                        >
                          <span className="text-xs">⚠</span> {errors.subject}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="message" className="text-sm font-medium">
                        Message <span className="text-red-500">*</span>
                      </Label>
                      <span className="text-xs text-gray-500">
                        {formData.message.length}/500 characters
                      </span>
                    </div>
                    <Textarea
                      id="message"
                      placeholder="Tell us more about your inquiry... (minimum 10 characters)"
                      rows={6}
                      maxLength={500}
                      value={formData.message}
                      onChange={(e) =>
                        handleInputChange("message", e.target.value)
                      }
                      onBlur={() => handleBlur("message")}
                      className={`transition-all duration-200 resize-none ${
                        touched.message && errors.message
                          ? "border-red-500 focus:ring-red-500"
                          : touched.message && !errors.message
                          ? "border-green-500 focus:ring-green-500"
                          : ""
                      }`}
                      aria-invalid={touched.message && !!errors.message}
                      aria-describedby={errors.message ? "message-error" : undefined}
                    />
                    {touched.message && errors.message && (
                      <p
                        id="message-error"
                        className="text-sm text-red-500 flex items-center gap-1 animate-slideDown"
                      >
                        <span className="text-xs">⚠</span> {errors.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-6 text-lg font-semibold transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Sending your message...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Send className="h-5 w-5" />
                        <span>Send Message</span>
                      </span>
                    )}
                  </Button>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                    We typically respond within 24 hours
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            {contactInfo.map((info, index) => (
              <Card
                key={index}
                className={`hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-scaleIn border-0 ${
                  info.action ? "cursor-pointer hover:scale-[1.02] hover:border-orange-200 dark:hover:border-orange-800" : ""
                }`}
                style={{ animationDelay: `${index * 200}ms` }}
                onClick={info.action}
                role={info.action ? "button" : undefined}
                tabIndex={info.action ? 0 : undefined}
                onKeyDown={(e) => {
                  if (info.action && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    info.action();
                  }
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 p-3 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl shadow-inner">
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
                        <p
                          key={i}
                          className="text-gray-700 dark:text-gray-300 text-sm font-medium"
                        >
                          {detail}
                        </p>
                      ))}
                      {info.action && (
                        <p className="text-xs text-orange-500 mt-2 opacity-75">
                          Click to{" "}
                          {info.title === "Phone"
                            ? "call"
                            : info.title === "Email"
                            ? "email"
                            : "view on map"}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Social Media */}
            <Card className="animate-scaleIn animation-delay-800 bg-gradient-to-br from-gray-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-5">
                <div className="text-center mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                    Connect With Us
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Follow us on social media for updates
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {socialMedia.map((social, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      className={`p-3 transition-all duration-300 transform hover:scale-105 ${social.color} group`}
                      onClick={() => window.open(social.url, "_blank")}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="group-hover:animate-bounce">
                          {social.icon}
                        </span>
                        <span className="text-xs font-medium">
                          {social.name}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Interactive Map Section */}
        <div className="mb-6 md:mb-8">
          <div className="text-center mb-4 md:mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 animate-slideUp">
              Find Us Here
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto animate-slideUp animation-delay-200 px-4">
              Located in the heart of Jaffna, we're easy to reach and ready to
              serve you
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden animate-slideUp animation-delay-400 shadow-2xl border-0 hover:shadow-3xl transition-shadow duration-300">
                <div className="relative h-72 md:h-80 lg:h-[400px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3926.8234567890123!2d80.0123456789!3d9.6612345678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMzknNDAuNCJOIDgwwrAwMCc0NC40IkU!5e0!3m2!1sen!2slk!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-lg"
                    title="ChefSync Office Location"
                  ></iframe>
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-orange-500" />
                      <span className="font-semibold text-gray-800 text-sm">
                        ChefSync Office
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Location Details */}
            <div className="space-y-4">
              <Card className="animate-slideUp animation-delay-600 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-5">
                  <div className="text-center mb-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-2">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      Our Location
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          Address
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          Near 412-196 Nallur-Oddumadam Rd
                          <br />
                          Jaffna, Sri Lanka
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          Accessibility
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          Easy parking available
                          <br />
                          Public transport accessible
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Button
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white transform hover:scale-105 transition-all duration-300"
                      onClick={() =>
                        window.open(
                          "https://maps.google.com/?q=412-196+Nallur-Oddumadam+Rd,+Jaffna",
                          "_blank"
                        )
                      }
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Get Directions
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transform hover:scale-105 transition-all duration-300"
                      onClick={() => window.open("tel:+94768035092", "_self")}
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Call Now
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Contact */}
              <Card className="animate-slideUp animation-delay-800 border-0 shadow-xl bg-gradient-to-br from-gray-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-5">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-center">
                    Quick Contact
                  </h4>
                  <div className="space-y-3">
                    <Button
                      variant="ghost"
                      className="w-full justify-start hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-all duration-300"
                      onClick={() => window.open("tel:+94768035092", "_self")}
                    >
                      <Phone className="mr-3 h-4 w-4 text-orange-500" />
                      <span className="text-sm">+94 76 803 5092</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-all duration-300"
                      onClick={() =>
                        window.open("mailto:chefsync7@gmail.com", "_self")
                      }
                    >
                      <Mail className="mr-3 h-4 w-4 text-orange-500" />
                      <span className="text-sm">chefsync7@gmail.com</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Enhanced CTA Section */}
        <Card className="overflow-hidden animate-fadeIn animation-delay-1000 border-0 shadow-2xl">
          <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 relative">
            <div className="absolute inset-0 bg-black/20"></div>
            <CardContent className="relative p-6 md:p-8 text-center text-white">
              <div className="max-w-3xl mx-auto">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full mb-3">
                  <MessageSquare className="h-7 w-7 text-white animate-float" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-2">
                  Ready to Experience Amazing Food?
                </h3>
                <p className="text-base md:text-lg text-white/90 mb-4 leading-relaxed">
                  Whether you want to order delicious meals or become a cook
                  partner, we're here to make it happen. Get in touch with us
                  today!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-white text-orange-600 hover:bg-gray-100 px-10 py-4 text-lg transform hover:scale-105 transition-all duration-300 shadow-xl"
                    onClick={() =>
                      document
                        .getElementById("contact-form")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Send Message
                    <Send className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-orange-600 px-10 py-4 text-lg transform hover:scale-105 transition-all duration-300"
                    onClick={() => window.open("tel:+94768035092", "_self")}
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Call Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Contact;
