import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useUserStore } from "@/store/userStore";
import DeliveryLayout from "@/components/delivery/DeliveryLayout";
import {
  Truck,
  Save,
  Camera,
  Star,
  Award,
  Clock,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Edit,
  CheckCircle,
  Navigation,
  Route,
  Zap,
  Shield,
  Car,
  Download,
  FileText,
  TrendingUp,
  Eye,
  X,
} from "lucide-react";

const DeliveryProfile: React.FC = () => {
  const { user } = useAuth();
  const { updateUser } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportType, setReportType] = useState("performance");
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    bio: "Professional delivery driver with 5+ years of experience. Committed to providing fast, safe, and reliable delivery services with excellent customer satisfaction.",
    vehicleType: "Car",
    vehicleModel: "Honda Civic",
    licensePlate: "ABC123",
    vehicleCapacity: 5,
    deliveryAreas: ["Downtown", "West Side", "University District", "East End"],
    experience: "5 years",
    rating: 4.9,
    totalDeliveries: 2847,
    certifications: [
      "Valid Driver License",
      "Food Safety Certified",
      "Defensive Driving Course",
    ],
    workingHours: {
      start: "08:00",
      end: "18:00",
      days: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
    },
    insuranceInfo: {
      provider: "State Farm",
      policyNumber: "SF-123456789",
      expiryDate: "2024-12-31",
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedInputChange = (
    parent: string,
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      const parentObj = prev[parent as keyof typeof prev] as any;
      return {
        ...prev,
        [parent]: {
          ...parentObj,
          [field]: value,
        },
      };
    });
  };

  const handleSave = async () => {
    try {
      // Here you would typically call an API to update the user profile
      await updateUser(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  // Report generation functions
  const generatePerformanceReport = () => {
    const reportData = {
      driverInfo: {
        name: user?.name,
        id: user?.id,
        email: formData.email,
        phone: formData.phone,
        vehicleInfo: `${formData.vehicleType} - ${formData.vehicleModel} (${formData.licensePlate})`,
      },
      performanceMetrics: {
        totalDeliveries: formData.totalDeliveries,
        rating: formData.rating,
        onTimeDeliveryRate: "96.5%",
        customerSatisfaction: "98.2%",
        averageDeliveryTime: "24 minutes",
        fuelEfficiency: "28 MPG",
        ordersPerHour: 3.2,
      },
      deliveryAreas: formData.deliveryAreas,
      workingHours: formData.workingHours,
      dateRange: dateRange,
    };
    return reportData;
  };

  // Currency formatting utility
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const generateEarningsReport = () => {
    const reportData = {
      driverInfo: {
        name: user?.name,
        id: user?.id,
        email: formData.email,
      },
      earningsData: {
        totalEarnings: formatCurrency(4285.5),
        basePayment: formatCurrency(3200.0),
        tips: formatCurrency(785.5),
        bonuses: formatCurrency(300.0),
        deliveryFees: formatCurrency(2856.0),
        mileageReimbursement: formatCurrency(429.5),
        averageEarningsPerDelivery: formatCurrency(15.65),
        averageEarningsPerHour: formatCurrency(18.75),
      },
      dailyBreakdown: [
        { date: "2024-10-20", deliveries: 25, earnings: formatCurrency(387.5) },
        { date: "2024-10-19", deliveries: 22, earnings: formatCurrency(346.5) },
        { date: "2024-10-18", deliveries: 28, earnings: formatCurrency(442.0) },
        { date: "2024-10-17", deliveries: 20, earnings: formatCurrency(315.0) },
        { date: "2024-10-16", deliveries: 24, earnings: formatCurrency(378.0) },
      ],
      dateRange: dateRange,
    };
    return reportData;
  };

  const generateDeliveryReport = () => {
    const reportData = {
      driverInfo: {
        name: user?.name,
        id: user?.id,
        vehicleInfo: `${formData.vehicleType} - ${formData.vehicleModel}`,
      },
      deliveryStats: {
        totalDeliveries: formData.totalDeliveries,
        completedDeliveries: 2847,
        cancelledDeliveries: 23,
        returnedDeliveries: 8,
        averageDistance: "5.2 miles",
        totalDistance: "14,824 miles",
        fuelConsumption: "529 gallons",
        carbonFootprint: "5.2 tons CO2",
      },
      deliveryBreakdown: {
        breakfast: 486,
        lunch: 1247,
        dinner: 958,
        lateNight: 156,
      },
      topDeliveryAreas: formData.deliveryAreas.map((area, index) => ({
        area,
        deliveries: Math.floor(Math.random() * 200) + 100,
        avgTime: Math.floor(Math.random() * 10) + 15 + " min",
      })),
      dateRange: dateRange,
    };
    return reportData;
  };

  const generateReportPDF = async (reportData: any, type: string) => {
    // Create CSV content based on report type
    let csvContent = "";
    let filename = "";

    switch (type) {
      case "performance":
        filename = `performance_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
        csvContent = [
          "Performance Report",
          `Driver: ${reportData.driverInfo.name}`,
          `Period: ${dateRange.startDate} to ${dateRange.endDate}`,
          "",
          "Performance Metrics:",
          `Total Deliveries,${reportData.performanceMetrics.totalDeliveries}`,
          `Rating,${reportData.performanceMetrics.rating}`,
          `On-time Delivery Rate,${reportData.performanceMetrics.onTimeDeliveryRate}`,
          `Customer Satisfaction,${reportData.performanceMetrics.customerSatisfaction}`,
          `Average Delivery Time,${reportData.performanceMetrics.averageDeliveryTime}`,
          `Fuel Efficiency,${reportData.performanceMetrics.fuelEfficiency}`,
          `Orders Per Hour,${reportData.performanceMetrics.ordersPerHour}`,
          "",
          "Delivery Areas:",
          ...reportData.deliveryAreas.map((area: string) => area),
          "",
          "Working Hours:",
          `Start Time,${reportData.workingHours.start}`,
          `End Time,${reportData.workingHours.end}`,
          `Working Days,${reportData.workingHours.days.join(" | ")}`,
        ].join("\n");
        break;

      case "earnings":
        filename = `earnings_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
        csvContent = [
          "Earnings Report",
          `Driver: ${reportData.driverInfo.name}`,
          `Period: ${dateRange.startDate} to ${dateRange.endDate}`,
          "",
          "Earnings Summary:",
          `Total Earnings,${reportData.earningsData.totalEarnings}`,
          `Base Payment,${reportData.earningsData.basePayment}`,
          `Tips,${reportData.earningsData.tips}`,
          `Bonuses,${reportData.earningsData.bonuses}`,
          `Delivery Fees,${reportData.earningsData.deliveryFees}`,
          `Mileage Reimbursement,${reportData.earningsData.mileageReimbursement}`,
          `Average Per Delivery,${reportData.earningsData.averageEarningsPerDelivery}`,
          `Average Per Hour,${reportData.earningsData.averageEarningsPerHour}`,
          "",
          "Daily Breakdown:",
          "Date,Deliveries,Earnings",
          ...reportData.dailyBreakdown.map(
            (day: any) => `${day.date},${day.deliveries},${day.earnings}`
          ),
        ].join("\n");
        break;

      case "delivery":
        filename = `delivery_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
        csvContent = [
          "Delivery Report",
          `Driver: ${reportData.driverInfo.name}`,
          `Period: ${dateRange.startDate} to ${dateRange.endDate}`,
          "",
          "Delivery Statistics:",
          `Total Deliveries,${reportData.deliveryStats.totalDeliveries}`,
          `Completed Deliveries,${reportData.deliveryStats.completedDeliveries}`,
          `Cancelled Deliveries,${reportData.deliveryStats.cancelledDeliveries}`,
          `Returned Deliveries,${reportData.deliveryStats.returnedDeliveries}`,
          `Average Distance,${reportData.deliveryStats.averageDistance}`,
          `Total Distance,${reportData.deliveryStats.totalDistance}`,
          `Fuel Consumption,${reportData.deliveryStats.fuelConsumption}`,
          `Carbon Footprint,${reportData.deliveryStats.carbonFootprint}`,
          "",
          "Delivery by Time:",
          `Breakfast,${reportData.deliveryBreakdown.breakfast}`,
          `Lunch,${reportData.deliveryBreakdown.lunch}`,
          `Dinner,${reportData.deliveryBreakdown.dinner}`,
          `Late Night,${reportData.deliveryBreakdown.lateNight}`,
          "",
          "Top Delivery Areas:",
          "Area,Deliveries,Average Time",
          ...reportData.topDeliveryAreas.map(
            (area: any) => `${area.area},${area.deliveries},${area.avgTime}`
          ),
        ].join("\n");
        break;
    }

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreviewReport = () => {
    let reportData;
    switch (reportType) {
      case "performance":
        reportData = generatePerformanceReport();
        break;
      case "earnings":
        reportData = generateEarningsReport();
        break;
      case "delivery":
        reportData = generateDeliveryReport();
        break;
      default:
        reportData = generatePerformanceReport();
    }
    setPreviewData(reportData);
    setShowPreview(true);
  };

  const handleDownloadReport = async () => {
    setReportLoading(true);
    try {
      let reportData;
      switch (reportType) {
        case "performance":
          reportData = generatePerformanceReport();
          break;
        case "earnings":
          reportData = generateEarningsReport();
          break;
        case "delivery":
          reportData = generateDeliveryReport();
          break;
        default:
          reportData = generatePerformanceReport();
      }

      await generateReportPDF(reportData, reportType);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setReportLoading(false);
    }
  };

  if (!user) {
    return (
      <DeliveryLayout>
        <div className="text-center py-12 theme-animate-scale-in">
          <div
            className="rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center"
            style={{
              background: "rgba(46, 204, 113, 0.1)",
              border: "2px solid rgba(46, 204, 113, 0.2)",
            }}
          >
            <div
              className="animate-spin rounded-full h-10 w-10 border-b-2"
              style={{ borderColor: "var(--primary-emerald)" }}
            ></div>
          </div>
          <h3
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Loading your profile...
          </h3>
          <p style={{ color: "var(--text-cool-grey)" }}>
            Please wait while we fetch your information
          </p>
        </div>
      </DeliveryLayout>
    );
  }

  return (
    <DeliveryLayout
      title="Driver Profile"
      description="Manage your professional delivery profile and preferences"
    >
      <div className="space-y-8">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Report Download Section */}
          <Card className="border border-gray-200 shadow-lg bg-white w-full sm:w-auto">
            <CardHeader className="pb-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 text-lg font-semibold">
                <FileText className="h-5 w-5 text-white" />
                <span>Generate Reports</span>
              </CardTitle>
              <CardDescription className="text-green-50">
                Download detailed performance and earnings reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label
                    htmlFor="report-type"
                    className="text-sm font-medium text-gray-700"
                  >
                    Report Type
                  </Label>
                  <select
                    id="report-type"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full mt-1 p-3 border border-gray-300 rounded-md bg-white text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="performance">📊 Performance</option>
                    <option value="earnings">� Earnings</option>
                    <option value="delivery">🚚 Delivery Stats</option>
                  </select>
                </div>
                <div>
                  <Label
                    htmlFor="start-date"
                    className="text-sm font-medium text-gray-700"
                  >
                    From Date
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="mt-1 text-base font-medium border-2 border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white px-3 py-2 rounded-md shadow-sm"
                    style={{
                      colorScheme: "light",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="end-date"
                    className="text-sm font-medium text-gray-700"
                  >
                    To Date
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="mt-1 text-base font-medium border-2 border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white px-3 py-2 rounded-md shadow-sm"
                    style={{
                      colorScheme: "light",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium">
                    {reportType === "performance" &&
                      "Performance metrics & ratings"}
                    {reportType === "earnings" &&
                      "Earnings breakdown & payments"}
                    {reportType === "delivery" &&
                      "Delivery statistics & analytics"}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handlePreviewReport}
                    disabled={reportLoading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 font-medium shadow-md"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    onClick={handleDownloadReport}
                    disabled={reportLoading}
                    className="bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white px-4 py-2 font-medium shadow-md"
                    size="sm"
                  >
                    {reportLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-1" />
                        Download CSV
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outline" : "default"}
            className="theme-button-primary"
            size="lg"
          >
            <Edit className="h-5 w-5 mr-2" />
            {isEditing ? "Cancel Edit" : "Edit Profile"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="group hover:shadow-card transition-all duration-300 border-none shadow-lg bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="text-center pb-6">
                <div className="relative inline-block">
                  <Avatar className="h-36 w-36 mx-auto ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300 shadow-xl">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-bold text-4xl">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-2 rounded-full h-10 w-10 p-0 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transform hover:scale-110 transition-all duration-300"
                    >
                      <Camera className="h-5 w-5" />
                    </Button>
                  )}
                </div>
                <CardTitle className="text-2xl mt-6 text-gray-900">
                  {user.name}
                </CardTitle>
                <CardDescription className="text-primary font-semibold text-lg bg-primary/10 px-4 py-2 rounded-full inline-block mt-2">
                  🚚 Delivery Expert
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="font-semibold">{formData.rating}</span>
                  <span className="text-gray-500">(4.9/5.0)</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {formData.totalDeliveries}
                    </p>
                    <p className="text-sm text-gray-600">Deliveries</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {formData.experience}
                    </p>
                    <p className="text-sm text-gray-600">Experience</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {formData.phone || "Not provided"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{formData.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      Joined{" "}
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Info */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Car className="h-5 w-5 text-blue-600" />
                  <span>Vehicle Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Type</span>
                    <span className="text-sm font-medium">
                      {formData.vehicleType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Model</span>
                    <span className="text-sm font-medium">
                      {formData.vehicleModel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">License Plate</span>
                    <span className="text-sm font-medium">
                      {formData.licensePlate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Capacity</span>
                    <span className="text-sm font-medium">
                      {formData.vehicleCapacity} orders
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  <span>Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {formData.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">{cert}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      On-time Delivery
                    </span>
                    <span className="text-sm font-bold text-blue-600">96%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: "96%" }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Basic Information</span>
                </CardTitle>
                <CardDescription>
                  Your personal and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      value={formData.experience}
                      onChange={(e) =>
                        handleInputChange("experience", e.target.value)
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Home Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Details */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <span>Vehicle Details</span>
                </CardTitle>
                <CardDescription>
                  Information about your delivery vehicle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vehicle-type">Vehicle Type</Label>
                    <select
                      id="vehicle-type"
                      value={formData.vehicleType}
                      onChange={(e) =>
                        handleInputChange("vehicleType", e.target.value)
                      }
                      disabled={!isEditing}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="Car">Car</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Bicycle">Bicycle</option>
                      <option value="Scooter">Scooter</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="vehicle-model">Vehicle Model</Label>
                    <Input
                      id="vehicle-model"
                      value={formData.vehicleModel}
                      onChange={(e) =>
                        handleInputChange("vehicleModel", e.target.value)
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="license-plate">License Plate</Label>
                    <Input
                      id="license-plate"
                      value={formData.licensePlate}
                      onChange={(e) =>
                        handleInputChange("licensePlate", e.target.value)
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicle-capacity">Vehicle Capacity</Label>
                    <Input
                      id="vehicle-capacity"
                      type="number"
                      value={formData.vehicleCapacity}
                      onChange={(e) =>
                        handleInputChange("vehicleCapacity", e.target.value)
                      }
                      disabled={!isEditing}
                      className="mt-1"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Areas */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span>Delivery Areas</span>
                </CardTitle>
                <CardDescription>
                  Areas where you provide delivery services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {formData.deliveryAreas.map((area, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <div className="mt-4">
                    <Label htmlFor="new-area">Add Delivery Area</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        id="new-area"
                        placeholder="e.g., North Side"
                        className="flex-1"
                      />
                      <Button size="sm">Add</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insurance Information */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span>Insurance Information</span>
                </CardTitle>
                <CardDescription>Vehicle insurance details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="insurance-provider">
                      Insurance Provider
                    </Label>
                    <Input
                      id="insurance-provider"
                      value={formData.insuranceInfo.provider}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "insuranceInfo",
                          "provider",
                          e.target.value
                        )
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="policy-number">Policy Number</Label>
                    <Input
                      id="policy-number"
                      value={formData.insuranceInfo.policyNumber}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "insuranceInfo",
                          "policyNumber",
                          e.target.value
                        )
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="expiry-date">Expiry Date</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={formData.insuranceInfo.expiryDate}
                    onChange={(e) =>
                      handleNestedInputChange(
                        "insuranceInfo",
                        "expiryDate",
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Working Schedule */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span>Working Schedule</span>
                </CardTitle>
                <CardDescription>
                  Your preferred working hours and availability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={formData.workingHours.start}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={formData.workingHours.end}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Working Days</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={day.toLowerCase()}
                          checked={formData.workingHours.days.includes(day)}
                          disabled={!isEditing}
                          className="rounded"
                        />
                        <Label htmlFor={day.toLowerCase()} className="text-sm">
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            {isEditing && (
              <Card className="border-none shadow-md bg-gradient-to-r from-blue-50 to-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Save Changes
                      </h3>
                      <p className="text-sm text-gray-600">
                        Update your profile information
                      </p>
                    </div>
                    <Button
                      onClick={handleSave}
                      className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Report Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-b p-6 flex items-center justify-between rounded-t-lg">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Report Preview
                  </h2>
                  <p className="text-sm text-green-50 mt-1 font-medium">
                    {reportType === "performance" && "📊 Performance Report"}
                    {reportType === "earnings" && "� Earnings Report"}
                    {reportType === "delivery" &&
                      "🚚 Delivery Statistics Report"}
                    {" • "}
                    <span className="font-semibold">
                      {dateRange.startDate} to {dateRange.endDate}
                    </span>
                  </p>
                </div>
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="ghost"
                  size="sm"
                  className="text-green-100 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6">
                {previewData && (
                  <div className="space-y-4">
                    {reportType === "performance" && (
                      <>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <div className="bg-blue-500 text-white rounded-full p-2 mr-3">
                              📊
                            </div>
                            Performance Report
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                              <Label className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                                Driver Name
                              </Label>
                              <p className="mt-2 text-lg font-medium text-gray-900">
                                {previewData.driverInfo.name}
                              </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                              <Label className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                                Email
                              </Label>
                              <p className="mt-2 text-lg font-medium text-gray-900">
                                {previewData.driverInfo.email}
                              </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                              <Label className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                                Phone
                              </Label>
                              <p className="mt-2 text-lg font-medium text-gray-900">
                                {previewData.driverInfo.phone}
                              </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                              <Label className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                                Vehicle Info
                              </Label>
                              <p className="mt-2 text-lg font-medium text-gray-900">
                                {previewData.driverInfo.vehicleInfo}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-8">
                          <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center border-b-2 border-blue-200 pb-3">
                            <div className="bg-blue-500 text-white rounded-full p-2 mr-3 text-sm">
                              📈
                            </div>
                            Performance Metrics
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-blue-700 mb-2">
                                {previewData.performanceMetrics.totalDeliveries.toLocaleString()}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Total Deliveries
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-yellow-700 mb-2 flex items-center">
                                ⭐ {previewData.performanceMetrics.rating}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Driver Rating
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-green-700 mb-2">
                                {
                                  previewData.performanceMetrics
                                    .onTimeDeliveryRate
                                }
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                On-time Delivery Rate
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-purple-700 mb-2">
                                {
                                  previewData.performanceMetrics
                                    .customerSatisfaction
                                }
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Customer Satisfaction
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-indigo-700 mb-2">
                                {
                                  previewData.performanceMetrics
                                    .averageDeliveryTime
                                }
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Average Delivery Time
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-teal-700 mb-2">
                                {previewData.performanceMetrics.fuelEfficiency}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Fuel Efficiency
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-rose-50 to-rose-100 border-2 border-rose-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-rose-700 mb-2">
                                {previewData.performanceMetrics.ordersPerHour}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Orders Per Hour
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                              📍 Delivery Areas
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              {previewData.deliveryAreas.map((area, index) => (
                                <Badge
                                  key={index}
                                  className="bg-blue-500 text-white px-3 py-1 text-sm font-medium shadow-sm hover:bg-blue-600 transition-colors"
                                >
                                  {area}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                              🕒 Working Schedule
                            </h4>
                            <div className="space-y-2">
                              <p className="text-gray-800 font-medium">
                                <span className="font-semibold text-green-700">
                                  Hours:
                                </span>{" "}
                                {previewData.workingHours.start} -{" "}
                                {previewData.workingHours.end}
                              </p>
                              <p className="text-gray-800 font-medium">
                                <span className="font-semibold text-green-700">
                                  Days:
                                </span>{" "}
                                {previewData.workingHours.days.join(", ")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {reportType === "earnings" && (
                      <>
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-6">
                          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <div className="bg-green-500 text-white rounded-full p-2 mr-3">
                              �
                            </div>
                            Earnings Report
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                              <Label className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                                Driver Name
                              </Label>
                              <p className="mt-2 text-lg font-medium text-gray-900">
                                {previewData.driverInfo.name}
                              </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                              <Label className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                                Email
                              </Label>
                              <p className="mt-2 text-lg font-medium text-gray-900">
                                {previewData.driverInfo.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-8">
                          <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center border-b-2 border-green-200 pb-3">
                            <div className="bg-green-500 text-white rounded-full p-2 mr-3 text-sm">
                              �
                            </div>
                            Earnings Summary
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-300 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                              <p className="text-3xl font-bold text-green-800 mb-2">
                                {previewData.earningsData.totalEarnings}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Total Earnings
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-blue-700 mb-2">
                                {previewData.earningsData.basePayment}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Base Payment
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-yellow-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-amber-700 mb-2">
                                {previewData.earningsData.tips}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Tips
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-purple-700 mb-2">
                                {previewData.earningsData.bonuses}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Bonuses
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-teal-700 mb-2">
                                {previewData.earningsData.deliveryFees}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Delivery Fees
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-indigo-700 mb-2">
                                {previewData.earningsData.mileageReimbursement}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Mileage Reimbursement
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-rose-50 to-pink-100 border-2 border-rose-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-rose-700 mb-2">
                                {
                                  previewData.earningsData
                                    .averageEarningsPerDelivery
                                }
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Average Per Delivery
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-orange-700 mb-2">
                                {
                                  previewData.earningsData
                                    .averageEarningsPerHour
                                }
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Average Per Hour
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg border border-gray-200">
                          <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center border-b-2 border-blue-200 pb-3">
                            <div className="bg-blue-500 text-white rounded-full p-2 mr-3 text-sm">
                              📊
                            </div>
                            Daily Earnings Breakdown
                          </h4>
                          <div className="space-y-4">
                            {previewData.dailyBreakdown.map((day, index) => (
                              <div
                                key={index}
                                className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 flex justify-between items-center hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="bg-blue-100 text-blue-700 rounded-full p-2 text-sm font-bold">
                                    {new Date(day.date).toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                      }
                                    )}
                                  </div>
                                  <span className="text-gray-700 font-medium">
                                    {day.deliveries} deliveries
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-2xl font-bold text-green-600">
                                    {day.earnings}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {reportType === "delivery" && (
                      <>
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 mb-6">
                          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <div className="bg-orange-500 text-white rounded-full p-2 mr-3">
                              🚚
                            </div>
                            Delivery Statistics Report
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
                              <Label className="text-sm font-semibold text-orange-700 uppercase tracking-wide">
                                Driver Name
                              </Label>
                              <p className="mt-2 text-lg font-medium text-gray-900">
                                {previewData.driverInfo.name}
                              </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
                              <Label className="text-sm font-semibold text-orange-700 uppercase tracking-wide">
                                Vehicle Info
                              </Label>
                              <p className="mt-2 text-lg font-medium text-gray-900">
                                {previewData.driverInfo.vehicleInfo}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-8">
                          <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center border-b-2 border-orange-200 pb-3">
                            <div className="bg-orange-500 text-white rounded-full p-2 mr-3 text-sm">
                              �
                            </div>
                            Delivery Performance Metrics
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-blue-700 mb-2">
                                {previewData.deliveryStats.totalDeliveries.toLocaleString()}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                📦 Total Deliveries
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-green-700 mb-2">
                                {previewData.deliveryStats.completedDeliveries.toLocaleString()}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                ✅ Completed Deliveries
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-red-700 mb-2">
                                {previewData.deliveryStats.cancelledDeliveries}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                ❌ Cancelled Deliveries
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-yellow-700 mb-2">
                                {previewData.deliveryStats.returnedDeliveries}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                🔄 Returned Deliveries
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-purple-700 mb-2">
                                {previewData.deliveryStats.averageDistance}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                📏 Average Distance
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-indigo-700 mb-2">
                                {previewData.deliveryStats.totalDistance}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                🛣️ Total Distance
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-teal-700 mb-2">
                                {previewData.deliveryStats.fuelConsumption}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                ⛽ Fuel Consumption
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                              <p className="text-3xl font-bold text-emerald-700 mb-2">
                                {previewData.deliveryStats.carbonFootprint}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                🌱 Carbon Footprint
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-8">
                          <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center border-b-2 border-amber-200 pb-3">
                            <div className="bg-amber-500 text-white rounded-full p-2 mr-3 text-sm">
                              🕐
                            </div>
                            Delivery Distribution by Time
                          </h4>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
                              <div className="text-4xl mb-3">🌅</div>
                              <p className="text-3xl font-bold text-orange-700 mb-2">
                                {previewData.deliveryBreakdown.breakfast.toLocaleString()}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Breakfast (6AM-11AM)
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
                              <div className="text-4xl mb-3">☀️</div>
                              <p className="text-3xl font-bold text-blue-700 mb-2">
                                {previewData.deliveryBreakdown.lunch.toLocaleString()}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Lunch (11AM-4PM)
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
                              <div className="text-4xl mb-3">🌆</div>
                              <p className="text-3xl font-bold text-purple-700 mb-2">
                                {previewData.deliveryBreakdown.dinner.toLocaleString()}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Dinner (4PM-10PM)
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
                              <div className="text-4xl mb-3">🌙</div>
                              <p className="text-3xl font-bold text-indigo-700 mb-2">
                                {previewData.deliveryBreakdown.lateNight.toLocaleString()}
                              </p>
                              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Late Night (10PM-6AM)
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-green-50 p-6 rounded-lg border border-gray-200">
                          <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center border-b-2 border-green-200 pb-3">
                            <div className="bg-green-500 text-white rounded-full p-2 mr-3 text-sm">
                              🏆
                            </div>
                            Top Performing Delivery Areas
                          </h4>
                          <div className="space-y-4">
                            {previewData.topDeliveryAreas.map((area, index) => (
                              <div
                                key={index}
                                className="bg-white p-6 rounded-lg shadow-sm border border-green-100 hover:shadow-md transition-shadow"
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center space-x-4">
                                    <div className="bg-green-100 text-green-700 rounded-full p-3 font-bold text-lg">
                                      #{index + 1}
                                    </div>
                                    <div>
                                      <h5 className="text-lg font-bold text-gray-900">
                                        {area.area}
                                      </h5>
                                      <p className="text-sm text-gray-600">
                                        Service Area
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-green-600 mb-1">
                                      {area.deliveries.toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Avg:{" "}
                                      <span className="font-semibold text-blue-600">
                                        {area.avgTime}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-green-50 border-t border-green-200 p-6 flex justify-end space-x-3 rounded-b-lg">
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="outline"
                  className="px-6 border-gray-300 text-white hover:bg-gray-100 font-medium"
                >
                  Close Preview
                </Button>
                <Button
                  onClick={handleDownloadReport}
                  disabled={reportLoading}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 font-medium shadow-md"
                >
                  {reportLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DeliveryLayout>
  );
};

export default DeliveryProfile;
