// import { useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { 
//   Search, 
//   CheckCircle, 
//   XCircle, 
//   Clock,
//   User,
//   DollarSign
// } from "lucide-react";

// interface Order {
//   id: string;
//   customerName: string;
//   items: string[];
//   totalAmount: number;
//   orderTime: string;
//   status: "pending" | "accepted" | "declined" | "completed";
//   estimatedTime?: number;
// }

// export default function Orders() {
//   const [searchTerm, setSearchTerm] = useState("");
  
//   const [orders, setOrders] = useState<Order[]>([
//     {
//       id: "ORD-001",
//       customerName: "John Smith",
//       items: ["Truffle Pasta", "Caesar Salad"],
//       totalAmount: 35.50,
//       orderTime: "10:30 AM",
//       status: "pending"
//     },
//     {
//       id: "ORD-002",
//       customerName: "Emma Davis",
//       items: ["Chef's Special Burger", "Fries"],
//       totalAmount: 28.00,
//       orderTime: "10:45 AM",
//       status: "accepted",
//       estimatedTime: 25
//     },
//     {
//       id: "ORD-003",
//       customerName: "Michael Johnson",
//       items: ["Grilled Salmon", "Rice Pilaf", "Chocolate Soufflé"],
//       totalAmount: 48.00,
//       orderTime: "11:15 AM",
//       status: "pending"
//     },
//     {
//       id: "ORD-004",
//       customerName: "Sarah Wilson",
//       items: ["Pasta Carbonara"],
//       totalAmount: 22.50,
//       orderTime: "11:30 AM",
//       status: "completed"
//     }
//   ]);

//   const filteredOrders = orders.filter(order =>
//     order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     order.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
//   );

//   const handleAcceptOrder = (orderId: string) => {
//     setOrders(orders.map(order => 
//       order.id === orderId 
//         ? { ...order, status: "accepted", estimatedTime: 30 }
//         : order
//     ));
//   };

//   const handleDeclineOrder = (orderId: string) => {
//     setOrders(orders.map(order => 
//       order.id === orderId 
//         ? { ...order, status: "declined" }
//         : order
//     ));
//   };

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "pending":
//         return <Badge variant="secondary">Pending</Badge>;
//       case "accepted":
//         return <Badge className="bg-blue-100 text-blue-800">Accepted</Badge>;
//       case "declined":
//         return <Badge variant="destructive">Declined</Badge>;
//       case "completed":
//         return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
//       default:
//         return <Badge variant="secondary">{status}</Badge>;
//     }
//   };

//   const pendingCount = orders.filter(order => order.status === "pending").length;
//   const acceptedCount = orders.filter(order => order.status === "accepted").length;
//   const completedCount = orders.filter(order => order.status === "completed").length;

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-foreground">Customer Orders</h1>
//           <p className="text-muted-foreground mt-1">Manage incoming customer orders</p>
//         </div>
        
//         <div className="flex gap-4">
//           <div className="text-center">
//             <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
//             <div className="text-sm text-muted-foreground">Pending</div>
//           </div>
//           <div className="text-center">
//             <div className="text-2xl font-bold text-blue-600">{acceptedCount}</div>
//             <div className="text-sm text-muted-foreground">In Progress</div>
//           </div>
//           <div className="text-center">
//             <div className="text-2xl font-bold text-green-600">{completedCount}</div>
//             <div className="text-sm text-muted-foreground">Completed</div>
//           </div>
//         </div>
//       </div>

//       <Card className="chef-card">
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <CardTitle className="flex items-center gap-2">
//               <Clock className="h-5 w-5 text-primary" />
//               Order Queue
//             </CardTitle>
//             <div className="relative w-64">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
//               <Input
//                 placeholder="Search orders..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Order ID</TableHead>
//                 <TableHead>Customer</TableHead>
//                 <TableHead>Items</TableHead>
//                 <TableHead>Total</TableHead>
//                 <TableHead>Order Time</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Est. Time</TableHead>
//                 <TableHead className="text-right">Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filteredOrders.map((order) => (
//                 <TableRow key={order.id}>
//                   <TableCell className="font-medium">{order.id}</TableCell>
//                   <TableCell>
//                     <div className="flex items-center gap-2">
//                       <User className="h-4 w-4 text-muted-foreground" />
//                       {order.customerName}
//                     </div>
//                   </TableCell>
//                   <TableCell>
//                     <div className="max-w-xs">
//                       {order.items.map((item, index) => (
//                         <span key={index} className="block text-sm">
//                           {item}{index < order.items.length - 1 && ","}
//                         </span>
//                       ))}
//                     </div>
//                   </TableCell>
//                   <TableCell>
//                     <div className="flex items-center gap-1">
//                       <DollarSign className="h-3 w-3" />
//                       {order.totalAmount.toFixed(2)}
//                     </div>
//                   </TableCell>
//                   <TableCell>{order.orderTime}</TableCell>
//                   <TableCell>{getStatusBadge(order.status)}</TableCell>
//                   <TableCell>
//                     {order.estimatedTime ? (
//                       <div className="flex items-center gap-1">
//                         <Clock className="h-3 w-3" />
//                         {order.estimatedTime} min
//                       </div>
//                     ) : (
//                       "-"
//                     )}
//                   </TableCell>
//                   <TableCell className="text-right">
//                     {order.status === "pending" && (
//                       <div className="flex items-center justify-end gap-2">
//                         <Button 
//                           variant="outline" 
//                           size="sm"
//                           onClick={() => handleAcceptOrder(order.id)}
//                           className="text-green-600 hover:text-green-700 hover:bg-green-50"
//                         >
//                           <CheckCircle className="h-4 w-4 mr-1" />
//                           Accept
//                         </Button>
//                         <Button 
//                           variant="outline" 
//                           size="sm"
//                           onClick={() => handleDeclineOrder(order.id)}
//                           className="text-red-600 hover:text-red-700 hover:bg-red-50"
//                         >
//                           <XCircle className="h-4 w-4 mr-1" />
//                           Decline
//                         </Button>
//                       </div>
//                     )}
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
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
  CheckCircle,
  XCircle,
  Clock,
  User,
  DollarSign,
} from "lucide-react";
// Import the API client from the utils directory
import apiClient, { orderAPI } from "../../utils/fetcher";

interface OrderItem {
  food: { id: number; name: string };
  quantity: number;
}

interface Customer {
  id: number;
  username: string;
}

interface Order {
  id: number;
  customer: Customer;
  items: OrderItem[];
  total_price: number;
  created_at: string;
  status: "pending" | "in_progress" | "declined" | "completed";
  estimated_time?: number;
}

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);

  // ✅ Fetch orders from backend
  useEffect(() => {
    orderAPI.getAllOrders()
      .then((response) => {
        // Handle both array response and object with results property
        const ordersData = Array.isArray(response) ? response : response?.results || response?.orders || [];
        setOrders(ordersData);
      })
      .catch((err) => {
        console.error("Failed to fetch orders", err);
        setOrders([]); // Ensure orders is always an array
      });
  }, []);

  // ✅ Accept / Decline order
  const handleAcceptOrder = (orderId: number) => {
    orderAPI.updateOrderStatus(orderId.toString(), "in_progress")
      .then((updatedOrder) =>
        setOrders((prev) =>
          Array.isArray(prev) ? prev.map((o) => (o.id === orderId ? updatedOrder : o)) : []
        )
      )
      .catch((err) => console.error("Failed to accept order", err));
  };

  const handleDeclineOrder = (orderId: number) => {
    orderAPI.updateOrderStatus(orderId.toString(), "declined")
      .then((updatedOrder) =>
        setOrders((prev) =>
          Array.isArray(prev) ? prev.map((o) => (o.id === orderId ? updatedOrder : o)) : []
        )
      )
      .catch((err) => console.error("Failed to decline order", err));
  };

  // ✅ Search filter
  const filteredOrders = (Array.isArray(orders) ? orders : []).filter(
    (order) =>
      order.customer.username
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      `ORD-${order.id}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.food.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // ✅ Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "declined":
        return <Badge variant="destructive">Declined</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // ✅ Counters from backend data
  const pendingCount = (Array.isArray(orders) ? orders : []).filter((o) => o.status === "pending").length;
  const inProgressCount = (Array.isArray(orders) ? orders : []).filter((o) => o.status === "in_progress").length;
  const completedCount = (Array.isArray(orders) ? orders : []).filter((o) => o.status === "completed").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header + counters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage incoming customer orders
          </p>
        </div>

        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <Card className="chef-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Order Queue
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search orders..."
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
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Order Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">ORD-{order.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {order.customer.username}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {order.items.map((item, index) => (
                        <span key={index} className="block text-sm">
                          {item.food.name} × {item.quantity}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {order.total_price.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    {order.status === "pending" && (
                      <div className="flex items-center justify-end gap-2">
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
    </div>
  );
}

