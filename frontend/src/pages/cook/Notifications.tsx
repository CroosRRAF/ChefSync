import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Trash2, 
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Clock
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: string;
  read: boolean;
}

export default function Notifications() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "New Order Received",
      message: "You have received a new order from John Smith for Truffle Pasta.",
      type: "info",
      timestamp: "2024-01-10 10:30 AM",
      read: false
    },
    {
      id: "2",
      title: "Menu Item Approved",
      message: "Your Chocolate Soufflé has been approved by the admin and is now live.",
      type: "success",
      timestamp: "2024-01-10 09:15 AM",
      read: false
    },
    {
      id: "3",
      title: "Bulk Order Collaboration",
      message: "Chef Maria has accepted your collaboration request for the ABC Corporation event.",
      type: "success",
      timestamp: "2024-01-10 08:45 AM",
      read: true
    },
    {
      id: "4",
      title: "Low Inventory Alert",
      message: "Truffle oil is running low. Consider updating your menu availability.",
      type: "warning",
      timestamp: "2024-01-09 06:30 PM",
      read: false
    },
    {
      id: "5",
      title: "Customer Review",
      message: "You received a 5-star review from Emma Davis for your Chef's Special Burger.",
      type: "success",
      timestamp: "2024-01-09 04:20 PM",
      read: true
    },
    {
      id: "6",
      title: "Order Cancelled",
      message: "Order #ORD-045 has been cancelled by the customer.",
      type: "error",
      timestamp: "2024-01-09 02:15 PM",
      read: true
    },
    {
      id: "7",
      title: "Menu Item Rejected",
      message: "Your submitted 'Spicy Ramen' dish needs modifications. Please check admin feedback.",
      type: "error",
      timestamp: "2024-01-09 01:00 PM",
      read: false
    },
    {
      id: "8",
      title: "System Maintenance",
      message: "Scheduled system maintenance tonight from 2 AM to 4 AM.",
      type: "info",
      timestamp: "2024-01-08 05:00 PM",
      read: true
    }
  ]);

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(notification => notification.id !== notificationId));
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    ));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = notifications.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated with your kitchen activities</p>
        </div>
        
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{unreadCount}</div>
            <div className="text-sm text-muted-foreground">Unread</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">{totalCount}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>
      </div>

      <Card className="chef-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              All Notifications
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.map((notification) => (
                <TableRow 
                  key={notification.id}
                  className={!notification.read ? "bg-muted/30" : ""}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type)}
                      {!notification.read && (
                        <div className="h-2 w-2 bg-primary rounded-full" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(notification.type)}</TableCell>
                  <TableCell className="font-medium">
                    {notification.title}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {notification.message}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {notification.timestamp}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
