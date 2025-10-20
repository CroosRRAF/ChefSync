import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  FileText,
  ShoppingCart,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  UserCheck,
  UserX,
  CreditCard,
  Package,
  Star,
  Shield,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminService } from "@/services/adminService";

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number | null;
  onApprove?: (userId: number) => void;
  onReject?: (userId: number) => void;
}

interface UserDetails {
  user: {
    id: number;
    name: string;
    email: string;
    phone_no: string;
    role: string;
    is_active: boolean;
    approval_status: string;
    approval_notes: string;
    approved_by: string | null;
    approved_at: string | null;
    date_joined: string;
    last_login: string | null;
    address: string;
    gender: string;
    email_verified: boolean;
    failed_login_attempts: number;
    account_locked: boolean;
    referral_code: string | null;
    total_referrals: number;
  };
  documents: Array<{
    id: number;
    file_name: string;
    document_type: string;
    uploaded_at: string;
    file_url: string;
    status: string;
    admin_notes: string;
    reviewed_by: string | null;
    reviewed_at: string | null;
  }>;
  orders: Array<{
    id: number;
    order_number: string;
    status: string;
    total_amount: number;
    payment_status: string;
    created_at: string;
    delivery_address: string;
    items_count: number;
  }>;
  complaints: Array<{
    id: number;
    reference_number: string;
    communication_type: string;
    subject: string;
    message: string;
    status: string;
    priority: string;
    created_at: string;
    admin_response: string;
    resolved_at: string | null;
  }>;
  addresses: Array<{
    id: number;
    address_type: string;
    label: string;
    full_address: string;
    is_default: boolean;
    created_at: string;
  }>;
  stats: {
    total_orders: number;
    total_spent: number;
    total_complaints: number;
    pending_complaints: number;
    total_documents: number;
    approved_documents: number;
    pending_documents: number;
  };
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  userId,
  onApprove,
  onReject,
}) => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserDetails();
    }
  }, [isOpen, userId]);

  const loadUserDetails = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const details = await adminService.getUserDetailsComprehensive(userId);
      setUserDetails(details);
    } catch (err) {
      setError("Failed to load user details");
      console.error("Error loading user details:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
      approved: { color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
      rejected: { color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
      active: { color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
      inactive: { color: "bg-gray-50 text-gray-700 border-gray-200", icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: "bg-red-50 text-red-700 border-red-200",
      medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
      low: "bg-green-50 text-green-700 border-green-200",
    };

    const colorClass = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low;

    return (
      <Badge variant="outline" className={colorClass}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      admin: "bg-purple-50 text-purple-700 border-purple-200",
      customer: "bg-blue-50 text-blue-700 border-blue-200",
      cook: "bg-orange-50 text-orange-700 border-orange-200",
      delivery_agent: "bg-green-50 text-green-700 border-green-200",
    };
    
    const colorClass = roleColors[role as keyof typeof roleColors] || "bg-gray-50 text-gray-700 border-gray-200";
    
    return (
      <Badge variant="outline" className={colorClass}>
        {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>User Details</span>
            {userDetails?.user?.name && (
              <span className="text-sm font-normal text-gray-500">
                - {userDetails.user.name}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            View comprehensive user information including profile details, documents, orders, and activity history.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading user details...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{error}</p>
              <Button onClick={loadUserDetails} className="mt-2">
                Retry
              </Button>
            </div>
          </div>
        )}

        {userDetails?.user && (
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6">
              {/* User Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>User Overview</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {getRoleBadge(userDetails.user.role)}
                      {getStatusBadge(userDetails.user.approval_status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Name</span>
                      </div>
                      <p className="text-sm text-gray-600">{userDetails.user.name}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Email</span>
                      </div>
                      <p className="text-sm text-gray-600">{userDetails.user.email}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Phone</span>
                      </div>
                      <p className="text-sm text-gray-600">{userDetails.user.phone_no || "Not provided"}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Joined</span>
                      </div>
                      <p className="text-sm text-gray-600">{formatDate(userDetails.user.date_joined)}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Last Login</span>
                      </div>
                      <p className="text-sm text-gray-600">{formatDate(userDetails.user.last_login)}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Email Verified</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {userDetails.user.email_verified ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{userDetails.stats?.total_orders || 0}</div>
                      <div className="text-sm text-gray-500">Total Orders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(userDetails.stats?.total_spent || 0)}</div>
                      <div className="text-sm text-gray-500">Total Spent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{userDetails.stats?.total_complaints || 0}</div>
                      <div className="text-sm text-gray-500">Complaints</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{userDetails.stats?.total_documents || 0}</div>
                      <div className="text-sm text-gray-500">Documents</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Approval Actions */}
              {userDetails.user.approval_status === "pending" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <UserCheck className="h-5 w-5" />
                      <span>Approval Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => onApprove?.(userDetails.user.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Approve User
                      </Button>
                      <Button
                        onClick={() => onReject?.(userDetails.user.id)}
                        variant="destructive"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Reject User
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabs for detailed information */}
              <Tabs defaultValue="documents" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="complaints">Complaints</TabsTrigger>
                  <TabsTrigger value="addresses">Addresses</TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Documents ({userDetails.documents?.length || 0})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userDetails.documents && userDetails.documents.length > 0 ? (
                        <div className="space-y-4">
                          {userDetails.documents.map((doc) => (
                            <div key={doc.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">{doc.file_name}</span>
                                    {getStatusBadge(doc.status)}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {doc.document_type} • Uploaded {formatDate(doc.uploaded_at)}
                                  </p>
                                  {doc.admin_notes && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      Admin Notes: {doc.admin_notes}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No documents uploaded</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="orders" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <ShoppingCart className="h-5 w-5" />
                        <span>Recent Orders ({userDetails.orders?.length || 0})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userDetails.orders && userDetails.orders.length > 0 ? (
                        <div className="space-y-4">
                          {userDetails.orders.map((order) => (
                            <div key={order.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <Package className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">{order.order_number}</span>
                                    {getStatusBadge(order.status)}
                                    {getStatusBadge(order.payment_status)}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {formatCurrency(order.total_amount)} • {order.items_count} items • {formatDate(order.created_at)}
                                  </p>
                                  {order.delivery_address && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      {order.delivery_address}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No orders found</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="complaints" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MessageSquare className="h-5 w-5" />
                        <span>Complaints & Feedback ({userDetails.complaints?.length || 0})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userDetails.complaints && userDetails.complaints.length > 0 ? (
                        <div className="space-y-4">
                          {userDetails.complaints.map((complaint) => (
                            <div key={complaint.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <MessageSquare className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">{complaint.subject}</span>
                                    {getStatusBadge(complaint.status)}
                                    {getPriorityBadge(complaint.priority)}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {complaint.reference_number} • {formatDate(complaint.created_at)}
                                  </p>
                                  <p className="text-sm text-gray-700 mt-2">{complaint.message}</p>
                                  {complaint.admin_response && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded">
                                      <p className="text-sm font-medium">Admin Response:</p>
                                      <p className="text-sm text-gray-600">{complaint.admin_response}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No complaints or feedback</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="addresses" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5" />
                        <span>Addresses ({userDetails.addresses?.length || 0})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userDetails.addresses && userDetails.addresses.length > 0 ? (
                        <div className="space-y-4">
                          {userDetails.addresses.map((address) => (
                            <div key={address.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <MapPin className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">{address.label}</span>
                                    {address.is_default && (
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        Default
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {address.address_type.charAt(0).toUpperCase() + address.address_type.slice(1).replace('_', ' ')}
                                  </p>
                                  <p className="text-sm text-gray-700 mt-1">{address.full_address}</p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Added {formatDate(address.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No addresses found</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;

