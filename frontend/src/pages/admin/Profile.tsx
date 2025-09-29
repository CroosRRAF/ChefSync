import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  AlertCircle,
  Camera,
  CheckCircle,
  Clock,
  Download,
  Eye,
  EyeOff,
  Globe,
  Lock,
  MapPin,
  Monitor,
  Moon,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Smartphone,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import React, { useState } from "react";

// Types
interface AdminProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  bio: string;
  location: string;
  timezone: string;
  language: string;
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLogin: string;
  loginCount: number;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  ipAddress: string;
  device: string;
  location: string;
  status: "success" | "warning" | "error";
}

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  current: boolean;
}

/**
 * Profile Page
 *
 * Features:
 * - Comprehensive admin profile management
 * - Password change with security validation
 * - Two-factor authentication setup
 * - Activity log and audit trail viewer
 * - Profile preferences and customization
 * - Session management and security
 * - Personal dashboard settings
 * - Advanced security features
 */
const Profile: React.FC = () => {
  // State management
  const [profile, setProfile] = useState<AdminProfile>({
    id: "admin-001",
    firstName: "John",
    lastName: "Administrator",
    email: "admin@fooddelivery.com",
    phone: "+1 (555) 123-4567",
    role: "Super Admin",
    avatar: "",
    bio: "Experienced system administrator with 5+ years in food delivery operations.",
    location: "New York, NY",
    timezone: "America/New_York",
    language: "en",
    theme: "system",
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    twoFactorEnabled: true,
    createdAt: "2023-01-15T10:00:00Z",
    lastLogin: "2024-09-29T08:30:00Z",
    loginCount: 1247,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Mock data
  const activityLogs: ActivityLog[] = [
    {
      id: "1",
      action: "Login",
      description: "Successful login to admin dashboard",
      timestamp: "2024-09-29T08:30:00Z",
      ipAddress: "192.168.1.100",
      device: "Chrome on Windows",
      location: "New York, NY",
      status: "success",
    },
    {
      id: "2",
      action: "Settings Update",
      description: "Updated notification preferences",
      timestamp: "2024-09-28T15:45:00Z",
      ipAddress: "192.168.1.100",
      device: "Chrome on Windows",
      location: "New York, NY",
      status: "success",
    },
    {
      id: "3",
      action: "Password Change",
      description: "Password changed successfully",
      timestamp: "2024-09-27T09:15:00Z",
      ipAddress: "192.168.1.100",
      device: "Chrome on Windows",
      location: "New York, NY",
      status: "success",
    },
    {
      id: "4",
      action: "Failed Login",
      description: "Failed login attempt detected",
      timestamp: "2024-09-26T14:22:00Z",
      ipAddress: "10.0.0.50",
      device: "Unknown",
      location: "Unknown",
      status: "error",
    },
  ];

  const sessions: Session[] = [
    {
      id: "1",
      device: "Chrome on Windows",
      browser: "Chrome 118.0.0.0",
      location: "New York, NY",
      ipAddress: "192.168.1.100",
      lastActive: "2024-09-29T08:30:00Z",
      current: true,
    },
    {
      id: "2",
      device: "Safari on iPhone",
      browser: "Safari 17.0",
      location: "New York, NY",
      ipAddress: "192.168.1.101",
      lastActive: "2024-09-28T22:15:00Z",
      current: false,
    },
  ];

  // Handlers
  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Profile updated:", profile);
    } catch (error) {
      console.error("Profile update failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      console.log("Password changed successfully");
    } catch (error) {
      console.error("Password change failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProfile((prev) => ({
        ...prev,
        twoFactorEnabled: !prev.twoFactorEnabled,
      }));
    } catch (error) {
      console.error("2FA toggle failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionRevoke = async (sessionId: string) => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log("Session revoked:", sessionId);
    } catch (error) {
      console.error("Session revoke failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your profile, security settings, and preferences
        </p>
      </div>

      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={profile.avatar}
                  alt={`${profile.firstName} ${profile.lastName}`}
                />
                <AvatarFallback className="text-lg">
                  {profile.firstName[0]}
                  {profile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {profile.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{profile.role}</Badge>
                {profile.twoFactorEnabled && (
                  <Badge variant="outline" className="text-green-600">
                    <Shield className="h-3 w-3 mr-1" />
                    2FA Enabled
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Last login: {formatDate(profile.lastLogin)}</p>
              <p>Total logins: {profile.loginCount.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Monitor className="h-4 w-4 mr-2" />
            Sessions
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profile.timezone}
                    onValueChange={(value) =>
                      setProfile((prev) => ({ ...prev, timezone: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">
                        Eastern Time
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time
                      </SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  rows={3}
                />
              </div>
              <Button onClick={handleProfileUpdate} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        current: !prev.current,
                      }))
                    }
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() =>
                      setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                    }
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        confirm: !prev.confirm,
                      }))
                    }
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button onClick={handlePasswordChange} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={profile.twoFactorEnabled}
                  onCheckedChange={handleTwoFactorToggle}
                  disabled={isLoading}
                />
              </div>
              {profile.twoFactorEnabled && (
                <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">
                      Two-factor authentication is enabled
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your account is protected with two-factor authentication
                    using an authenticator app.
                  </p>
                  <Button variant="outline" size="sm">
                    <Smartphone className="h-4 w-4 mr-2" />
                    Reconfigure Device
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={profile.theme}
                  onValueChange={(value: "light" | "dark" | "system") =>
                    setProfile((prev) => ({ ...prev, theme: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center">
                        <Sun className="h-4 w-4 mr-2" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center">
                        <Moon className="h-4 w-4 mr-2" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center">
                        <Monitor className="h-4 w-4 mr-2" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={profile.language}
                  onValueChange={(value) =>
                    setProfile((prev) => ({ ...prev, language: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={profile.emailNotifications}
                  onCheckedChange={(checked) =>
                    setProfile((prev) => ({
                      ...prev,
                      emailNotifications: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive push notifications in browser
                  </p>
                </div>
                <Switch
                  checked={profile.pushNotifications}
                  onCheckedChange={(checked) =>
                    setProfile((prev) => ({
                      ...prev,
                      pushNotifications: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive notifications via SMS
                  </p>
                </div>
                <Switch
                  checked={profile.smsNotifications}
                  onCheckedChange={(checked) =>
                    setProfile((prev) => ({
                      ...prev,
                      smsNotifications: checked,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Activity Log
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-4 p-4 border rounded-lg"
                  >
                    <div className="mt-1">{getStatusIcon(log.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{log.action}</h4>
                        <time className="text-sm text-gray-500">
                          {formatDate(log.timestamp)}
                        </time>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {log.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Globe className="h-3 w-3 mr-1" />
                          {log.ipAddress}
                        </span>
                        <span className="flex items-center">
                          <Monitor className="h-3 w-3 mr-1" />
                          {log.device}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {log.location}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your active sessions across different devices
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-start space-x-4">
                      <Monitor className="h-5 w-5 mt-1 text-gray-500" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{session.device}</h4>
                          {session.current && (
                            <Badge variant="secondary" className="text-xs">
                              Current Session
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {session.browser}
                        </p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {session.location}
                          </span>
                          <span className="flex items-center">
                            <Globe className="h-3 w-3 mr-1" />
                            {session.ipAddress}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(session.lastActive)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!session.current && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Revoke
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Session</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to revoke this session? The
                              user will be logged out from this device.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleSessionRevoke(session.id)}
                            >
                              Revoke Session
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
