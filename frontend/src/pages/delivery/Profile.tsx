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
} from "lucide-react";

const DeliveryProfile: React.FC = () => {
  const { user } = useAuth();
  const { updateUser } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
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
        <div className="flex justify-end">
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
      </div>
    </DeliveryLayout>
  );
};

export default DeliveryProfile;
