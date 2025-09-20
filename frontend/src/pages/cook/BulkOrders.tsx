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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Users,
  Package,
  DollarSign,
  Calendar
} from "lucide-react";

interface BulkOrder {
  id: string;
  customerName: string;
  eventType: string;
  items: string[];
  quantity: number;
  totalAmount: number;
  eventDate: string;
  status: "pending" | "accepted" | "declined" | "collaborating";
  collaborators?: string[];
}

export default function BulkOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCollaborateDialogOpen, setIsCollaborateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([
    {
      id: "BULK-001",
      customerName: "ABC Corporation",
      eventType: "Corporate Lunch",
      items: ["Grilled Chicken", "Caesar Salad", "Garlic Bread"],
      quantity: 50,
      totalAmount: 1250.00,
      eventDate: "2024-01-15",
      status: "pending"
    },
    {
      id: "BULK-002",
      customerName: "Smith Wedding",
      eventType: "Wedding Reception",
      items: ["Prime Rib", "Salmon Fillet", "Vegetarian Pasta", "Wedding Cake"],
      quantity: 120,
      totalAmount: 4800.00,
      eventDate: "2024-01-20",
      status: "collaborating",
      collaborators: ["Chef Maria", "Chef David"]
    },
    {
      id: "BULK-003",
      customerName: "Tech Startup",
      eventType: "Launch Party",
      items: ["Assorted Appetizers", "Mini Burgers", "Dessert Platter"],
      quantity: 80,
      totalAmount: 2400.00,
      eventDate: "2024-01-18",
      status: "accepted"
    }
  ]);

  const filteredOrders = bulkOrders.filter(order =>
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.eventType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAcceptOrder = (orderId: string) => {
    setBulkOrders(orders => orders.map(order => 
      order.id === orderId 
        ? { ...order, status: "accepted" }
        : order
    ));
  };

  const handleDeclineOrder = (orderId: string) => {
    setBulkOrders(orders => orders.map(order => 
      order.id === orderId 
        ? { ...order, status: "declined" }
        : order
    ));
  };

  const handleCollaborate = (orderId: string) => {
    setSelectedOrder(orderId);
    setIsCollaborateDialogOpen(true);
  };

  const handleSubmitCollaboration = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedOrder) {
      setBulkOrders(orders => orders.map(order => 
        order.id === selectedOrder 
          ? { ...order, status: "collaborating", collaborators: ["Chef Maria"] }
          : order
      ));
    }
    setIsCollaborateDialogOpen(false);
    setSelectedOrder(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case "declined":
        return <Badge variant="destructive">Declined</Badge>;
      case "collaborating":
        return <Badge className="bg-purple-100 text-purple-800">Collaborating</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = bulkOrders.filter(order => order.status === "pending").length;
  const acceptedCount = bulkOrders.filter(order => order.status === "accepted").length;
  const collaboratingCount = bulkOrders.filter(order => order.status === "collaborating").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bulk Orders</h1>
          <p className="text-muted-foreground mt-1">Manage large catering and event orders</p>
        </div>
        
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{acceptedCount}</div>
            <div className="text-sm text-muted-foreground">Accepted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{collaboratingCount}</div>
            <div className="text-sm text-muted-foreground">Collaborating</div>
          </div>
        </div>
      </div>

      <Card className="chef-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Bulk Order Queue
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search bulk orders..."
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
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Event Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Collaborators</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.eventType}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {order.items.slice(0, 2).map((item, index) => (
                        <span key={index} className="block text-sm">
                          {item}
                        </span>
                      ))}
                      {order.items.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{order.items.length - 2} more
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.quantity} servings</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {order.totalAmount.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(order.eventDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {order.collaborators ? (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="text-sm">{order.collaborators.join(", ")}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === "pending" && (
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCollaborate(order.id)}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Collaborate
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAcceptOrder(order.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeclineOrder(order.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Collaboration Dialog */}
      <Dialog open={isCollaborateDialogOpen} onOpenChange={setIsCollaborateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Collaborate on Bulk Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCollaboration} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collaborator">Select Chef to Collaborate With</Label>
              <Input id="collaborator" placeholder="Search chefs..." required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Collaboration Message</Label>
              <Textarea 
                id="message" 
                placeholder="Describe how you'd like to collaborate on this order..." 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="workSplit">Work Distribution</Label>
              <Textarea 
                id="workSplit" 
                placeholder="Describe how the work will be split..." 
                required 
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCollaborateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Send Collaboration Request</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
