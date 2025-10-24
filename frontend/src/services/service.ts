import type { Order } from "../types/orderType";
import apiClient from "./apiClient"; // your centralized axios instance

// Enhanced interfaces for delivery functionality
export interface DeliveryIssue {
  id: string;
  orderId: number;
  type:
    | "customer_unavailable"
    | "wrong_address"
    | "traffic_delay"
    | "vehicle_problem"
    | "other";
  description: string;
  timestamp: string;
  status: "reported" | "acknowledged" | "resolved";
}

export interface DeliveryLog {
  id: string;
  orderId: number;
  deliveryAgentId: string;
  startTime: string;
  endTime?: string;
  distance: number;
  totalTime: number; // in minutes
  status: "in_progress" | "completed" | "failed";
  route?: {
    startAddress: string;
    endAddress: string;
    waypoints?: string[];
  };
}

export interface ChatMessage {
  id: string;
  orderId: number;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  type: "text" | "location" | "image";
}

export interface DeliveryNotification {
  id: string;
  title: string;
  message: string;
  type:
    | "order_assigned"
    | "customer_message"
    | "route_updated"
    | "issue_reported";
  timestamp: string;
  read: boolean;
  orderId?: number;
}

// Interface for bulk orders from the backend
export interface BulkOrder {
  bulk_order_id: number;
  order_number: string;
  customer?: any;
  customer_name?: string;
  chef?: any;
  delivery_partner?: any;
  status:
    | "pending"
    | "confirmed"
    | "collaborating"
    | "preparing"
    | "completed"
    | "cancelled";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  order_type: "delivery" | "pickup";
  delivery_address?: string;
  pickup_address?: string;
  event_date: string;
  event_type?: string;
  event_time?: string;
  description?: string;
  total_quantity?: number;
  created_at: string;
  updated_at: string;
  // Additional fields for display
  customer_phone?: string;
  special_instructions?: string;
}

// Combined interface for unified handling
export interface UnifiedOrder extends Order {
  order_type_category?: "normal" | "bulk";
  bulk_order_id?: number;
  event_date?: string;
  event_type?: string;
  total_quantity?: number;
}

// 🚚 Get orders assigned to current delivery agent (both normal and bulk)
export const getMyAssignedOrders = async (): Promise<UnifiedOrder[]> => {
  try {
    // Fetch normal orders
    const normalRes = await apiClient.get("/orders/orders/");
    const normalOrders = (normalRes.data.results || normalRes.data) as Order[];

    // Fetch bulk orders
    const bulkRes = await apiClient.get("/orders/bulk/");
    const bulkOrders = (bulkRes.data.results || bulkRes.data) as BulkOrder[];

    // Filter normal orders for assigned and active delivery states
    const assignedNormalOrders = normalOrders
      .filter((order: Order) =>
        ["assigned", "out_for_delivery", "picked_up", "in_transit"].includes(
          order.status
        )
      )
      .map(
        (order: Order): UnifiedOrder => ({
          ...order,
          order_type_category: "normal",
        })
      );

    // Filter bulk orders for delivery-assigned states and convert to unified format
    const assignedBulkOrders = bulkOrders
      .filter(
        (bulkOrder: BulkOrder) =>
          bulkOrder.delivery_partner &&
          ["confirmed", "preparing", "completed"].includes(bulkOrder.status) &&
          bulkOrder.order_type === "delivery"
      )
      .map(
        (bulkOrder: BulkOrder): UnifiedOrder => ({
          id: bulkOrder.bulk_order_id,
          order_number: bulkOrder.order_number,
          customer: bulkOrder.customer,
          customer_name: bulkOrder.customer_name,
          chef: bulkOrder.chef,
          delivery_partner: bulkOrder.delivery_partner,
          status: mapBulkStatusToNormalStatus(bulkOrder.status),
          total_amount: bulkOrder.total_amount,
          created_at: bulkOrder.created_at,
          updated_at: bulkOrder.updated_at,
          delivery_address: bulkOrder.delivery_address || "",
          pickup_location: bulkOrder.pickup_address,
          order_type_category: "bulk",
          bulk_order_id: bulkOrder.bulk_order_id,
          event_date: bulkOrder.event_date,
          event_type: bulkOrder.event_type,
          total_quantity: bulkOrder.total_quantity,
          delivery_fee: bulkOrder.delivery_fee,
          special_instructions: bulkOrder.description,
        })
      );

    return [...assignedNormalOrders, ...assignedBulkOrders];
  } catch (error) {
    console.error("Error fetching assigned orders:", error);
    return [];
  }
};

// 🚚 Fetch available orders (both normal and bulk)
export const getAvailableOrders = async (): Promise<UnifiedOrder[]> => {
  try {
    // Fetch normal orders
    const normalRes = await apiClient.get("/orders/orders/");
    const normalOrders = (normalRes.data.results || normalRes.data) as Order[];

    // Fetch bulk orders
    const bulkRes = await apiClient.get("/orders/bulk/");
    const bulkOrders = (bulkRes.data.results || bulkRes.data) as BulkOrder[];

    // Filter normal orders for available states (ready for pickup/delivery)
    const availableNormalOrders = normalOrders
      .filter(
        (order: Order) =>
          ["ready", "confirmed"].includes(order.status) &&
          !order.delivery_partner
      )
      .map(
        (order: Order): UnifiedOrder => ({
          ...order,
          order_type_category: "normal",
        })
      );

    // Filter bulk orders for available delivery
    const availableBulkOrders = bulkOrders
      .filter(
        (bulkOrder: BulkOrder) =>
          !bulkOrder.delivery_partner &&
          ["confirmed", "preparing"].includes(bulkOrder.status) &&
          bulkOrder.order_type === "delivery"
      )
      .map(
        (bulkOrder: BulkOrder): UnifiedOrder => ({
          id: bulkOrder.bulk_order_id,
          order_number: bulkOrder.order_number,
          customer: bulkOrder.customer,
          customer_name: bulkOrder.customer_name,
          chef: bulkOrder.chef,
          delivery_partner: bulkOrder.delivery_partner,
          status: mapBulkStatusToNormalStatus(bulkOrder.status),
          total_amount: bulkOrder.total_amount,
          created_at: bulkOrder.created_at,
          updated_at: bulkOrder.updated_at,
          delivery_address: bulkOrder.delivery_address || "",
          pickup_location: bulkOrder.pickup_address,
          order_type_category: "bulk",
          bulk_order_id: bulkOrder.bulk_order_id,
          event_date: bulkOrder.event_date,
          event_type: bulkOrder.event_type,
          total_quantity: bulkOrder.total_quantity,
          delivery_fee: bulkOrder.delivery_fee,
          special_instructions: bulkOrder.description,
        })
      );

    return [...availableNormalOrders, ...availableBulkOrders];
  } catch (error) {
    console.error("Error fetching available orders:", error);
    return [];
  }
};

// Helper function to map bulk order status to normal order status
const mapBulkStatusToNormalStatus = (bulkStatus: string): Order["status"] => {
  switch (bulkStatus) {
    case "pending":
      return "pending";
    case "confirmed":
      return "confirmed";
    case "collaborating":
      return "confirmed";
    case "preparing":
      return "preparing";
    case "completed":
      return "delivered";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
};

// 🚚 Accept an order for delivery with distance checking (supports both normal and bulk orders)
export const acceptOrder = async (
  orderId: number,
  agentLocation?: { lat: number; lng: number },
  chefLocation?: { lat: number; lng: number },
  orderType: "normal" | "bulk" = "normal"
): Promise<
  | UnifiedOrder
  | {
      warning: string;
      distance: number;
      message: string;
      allow_accept: boolean;
    }
> => {
  const requestData: any = {};

  if (agentLocation) {
    requestData.agent_latitude = agentLocation.lat;
    requestData.agent_longitude = agentLocation.lng;
  }

  if (chefLocation) {
    requestData.chef_latitude = chefLocation.lat;
    requestData.chef_longitude = chefLocation.lng;
  }

  let res;
  if (orderType === "bulk") {
    // For bulk orders, use the bulk management endpoint
    res = await apiClient.post(
      `/orders/bulk/${orderId}/assign_delivery/`,
      requestData
    );
  } else {
    // For normal orders, use the existing endpoint
    res = await apiClient.post(
      `/orders/orders/${orderId}/accept/`,
      requestData
    );
  }

  return res.data;
};

// 🚚 Get Cook Details with kitchen location
export const getCookDetails = async (cookId: number): Promise<any> => {
  const res = await apiClient.get(`/auth/cook-profile/${cookId}/`);
  return res.data;
};

// 🚚 Get pickup location from order (NEW FEATURE - supports both normal and bulk orders)
export const getPickupLocation = (order: UnifiedOrder): string | null => {
  // Try to get pickup location from multiple sources
  return order.pickup_location || order.chef?.kitchen_location || null;
};

// 🚚 Navigate to pickup location (NEW FEATURE - supports both normal and bulk orders)
export const navigateToPickupLocation = (order: UnifiedOrder): boolean => {
  const pickupLocation = getPickupLocation(order);
  if (pickupLocation) {
    const encodedLocation = encodeURIComponent(pickupLocation);
    const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;
    window.open(navigationUrl, "_blank");
    return true;
  }
  return false;
};

// 🚚 Navigate to delivery location (supports both normal and bulk orders)
export const navigateToDeliveryLocation = (order: UnifiedOrder): boolean => {
  if (order.delivery_address) {
    const encodedAddress = encodeURIComponent(order.delivery_address);
    const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(navigationUrl, "_blank");
    return true;
  }
  return false;
};

// 🚚 Update order status with enhanced tracking (supports both normal and bulk orders)
export const updateOrderStatus = async (
  orderId: number,
  status: "picked_up" | "out_for_delivery" | "in_transit" | "delivered",
  location?: { lat: number; lng: number; address?: string },
  orderType: "normal" | "bulk" = "normal"
) => {
  const requestData = {
    status,
    location,
    timestamp: new Date().toISOString(),
  };

  try {
    let res;
    if (orderType === "bulk") {
      // Map delivery status to bulk order status
      const bulkStatus = mapDeliveryStatusToBulkStatus(status);
      res = await apiClient.patch(`/orders/bulk/${orderId}/`, {
        status: bulkStatus,
        ...requestData,
      });
    } else {
      res = await apiClient.patch(
        `/orders/orders/${orderId}/status/`,
        requestData
      );
    }

    return res.data.results || res.data;
  } catch (error: any) {
    console.error("Error updating order status:", error);

    // Provide more specific error information
    if (error.response?.status === 400) {
      const errorMessage =
        error.response?.data?.error || "Invalid status update request";
      throw new Error(`Status update failed: ${errorMessage}`);
    } else if (error.response?.status === 403) {
      throw new Error("You are not authorized to update this order status");
    } else if (error.response?.status === 404) {
      throw new Error("Order not found");
    } else {
      throw new Error("Failed to update order status. Please try again.");
    }
  }
};

// Helper function to map delivery status to bulk order status
const mapDeliveryStatusToBulkStatus = (deliveryStatus: string): string => {
  switch (deliveryStatus) {
    case "picked_up":
      return "preparing";
    case "out_for_delivery":
    case "in_transit":
      return "preparing"; // Keep as preparing until delivered
    case "delivered":
      return "completed";
    default:
      return "preparing";
  }
};

// 🚚 Get delivery history for the current delivery agent (includes both normal and bulk orders)
export const getDeliveryHistory = async (): Promise<UnifiedOrder[]> => {
  try {
    // Fetch normal order history
    const normalRes = await apiClient.get("/orders/orders/history/");
    const normalHistory = (normalRes.data.results || normalRes.data) as Order[];

    // Fetch bulk order history
    const bulkRes = await apiClient.get("/orders/bulk/");
    const allBulkOrders = (bulkRes.data.results || bulkRes.data) as BulkOrder[];

    // Filter bulk orders for delivered/completed ones assigned to current agent
    const bulkHistory = allBulkOrders
      .filter(
        (bulkOrder: BulkOrder) =>
          bulkOrder.delivery_partner &&
          ["completed", "cancelled"].includes(bulkOrder.status)
      )
      .map(
        (bulkOrder: BulkOrder): UnifiedOrder => ({
          id: bulkOrder.bulk_order_id,
          order_number: bulkOrder.order_number,
          customer: bulkOrder.customer,
          customer_name: bulkOrder.customer_name,
          chef: bulkOrder.chef,
          delivery_partner: bulkOrder.delivery_partner,
          status: mapBulkStatusToNormalStatus(bulkOrder.status),
          total_amount: bulkOrder.total_amount,
          created_at: bulkOrder.created_at,
          updated_at: bulkOrder.updated_at,
          delivery_address: bulkOrder.delivery_address || "",
          pickup_location: bulkOrder.pickup_address,
          order_type_category: "bulk",
          bulk_order_id: bulkOrder.bulk_order_id,
          event_date: bulkOrder.event_date,
          event_type: bulkOrder.event_type,
          total_quantity: bulkOrder.total_quantity,
          delivery_fee: bulkOrder.delivery_fee,
          special_instructions: bulkOrder.description,
        })
      );

    // Convert normal orders to unified format
    const normalHistoryUnified = normalHistory.map(
      (order: Order): UnifiedOrder => ({
        ...order,
        order_type_category: "normal",
      })
    );

    // Combine and sort by created date (newest first)
    const combinedHistory = [...normalHistoryUnified, ...bulkHistory];
    return combinedHistory.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error("Error fetching delivery history:", error);
    return [];
  }
};

// 🚚 Get dashboard summary
export const getDashboardSummary = async (): Promise<{
  active_deliveries: number;
  completed_today: number;
  todays_earnings: number;
  avg_delivery_time_min: number;
}> => {
  const res = await apiClient.get("/orders/orders/dashboard_summary/");
  return res.data;
};

// 🚨 Report delivery issues
export const reportDeliveryIssue = async (
  orderId: number,
  issueType: DeliveryIssue["type"],
  description: string
): Promise<DeliveryIssue> => {
  // TODO: Backend endpoint for issue reporting not yet implemented
  console.warn("Issue reporting endpoint not yet implemented in backend");

  // For now, return a mock response to prevent errors
  const mockIssue: DeliveryIssue = {
    id: `issue_${Date.now()}`,
    orderId,
    type: issueType,
    description,
    timestamp: new Date().toISOString(),
    status: "reported",
  };

  // TODO: Uncomment when backend endpoint is ready:
  // const res = await apiClient.post('/delivery/issues/', {
  //   orderId,
  //   type: issueType,
  //   description,
  //   timestamp: new Date().toISOString()
  // });
  // return res.data;

  return mockIssue;
};

// 📍 Update delivery agent location
export const updateDeliveryLocation = async (
  latitude: number,
  longitude: number,
  address?: string
) => {
  // TODO: Backend endpoint for location updates not yet implemented
  console.warn("Location update endpoint not yet implemented in backend");

  // For now, return a mock response to prevent errors
  return {
    success: true,
    location: { latitude, longitude, address },
    timestamp: new Date().toISOString(),
  };

  // TODO: Uncomment when backend endpoint is ready:
  // const res = await apiClient.patch('/delivery/location/', {
  //   latitude,
  //   longitude,
  //   address,
  //   timestamp: new Date().toISOString()
  // });
  // return res.data;
};

// 📱 Communication functions
export const sendCustomerMessage = async (
  orderId: number,
  message: string,
  type: "text" | "location" = "text"
): Promise<ChatMessage> => {
  // TODO: Backend endpoint for chat messages not yet implemented
  console.warn("Chat messaging endpoint not yet implemented in backend");

  // For now, return a mock response to prevent errors
  const mockMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    orderId,
    senderId: "current_user", // This should be the actual user ID
    receiverId: "customer",
    message,
    timestamp: new Date().toISOString(),
    type,
  };

  // TODO: Uncomment when backend endpoint is ready:
  // const res = await apiClient.post(`/delivery/chat/${orderId}/`, {
  //   message,
  //   type,
  //   timestamp: new Date().toISOString()
  // });
  // return res.data;

  return mockMessage;
};

export const getChatMessages = async (
  orderId: number
): Promise<ChatMessage[]> => {
  // TODO: Backend endpoint for chat messages not yet implemented
  console.warn("Chat messages endpoint not yet implemented in backend");

  // For now, return empty array to prevent errors
  return [];

  // TODO: Uncomment when backend endpoint is ready:
  // const res = await apiClient.get(`/delivery/chat/${orderId}/`);
  // return res.data.results || res.data;
};

// 📊 Delivery logs and performance
export const submitDeliveryLog = async (
  log: Omit<DeliveryLog, "id">
): Promise<DeliveryLog> => {
  // TODO: Backend endpoint for delivery logs not yet implemented
  console.warn("Submit delivery log endpoint not yet implemented in backend");

  // For now, return a mock response
  const mockLog: DeliveryLog = {
    id: `log_${Date.now()}`,
    ...log,
  };

  return mockLog;

  // TODO: Uncomment when backend endpoint is ready:
  // const res = await apiClient.post('/delivery/logs/', log);
  // return res.data;
};

export const getDeliveryLogs = async (dateRange?: {
  start: string;
  end: string;
}): Promise<DeliveryLog[]> => {
  // TODO: Backend endpoint for delivery logs not yet implemented
  // For now, return empty array to prevent errors
  console.warn("Delivery logs endpoint not yet implemented in backend");
  return [];

  // Uncomment below when backend endpoint is ready:
  // const params = dateRange ? `?start=${dateRange.start}&end=${dateRange.end}` : '';
  // const res = await apiClient.get(`/orders/order-history/${params}`);
  // return res.data.results || res.data;
};

// 🗺️ Route optimization
export const optimizeDeliveryRoute = async (orderIds: number[]) => {
  // TODO: Backend endpoint for route optimization not yet implemented
  console.warn("Route optimization endpoint not yet implemented in backend");

  // For now, return a mock response
  return {
    optimizedOrder: [],
    totalDistance: 0,
    estimatedTime: 0,
    savings: { distance: 0, time: 0 },
  };

  // TODO: Uncomment when backend endpoint is ready:
  // const res = await apiClient.post('/delivery/route/optimize/', { order_ids: orderIds });
  // return res.data;
};

export const getRouteDirections = async (orderId: number) => {
  // TODO: Backend endpoint for route directions not yet implemented
  console.warn("Route directions endpoint not yet implemented in backend");

  // For now, return a mock response
  return {
    route: [],
    distance: 0,
    duration: 0,
  };

  // TODO: Uncomment when backend endpoint is ready:
  // const res = await apiClient.get(`/delivery/route/${orderId}/directions/`);
  // return res.data;
};

// 🔔 Notifications
export const getDeliveryNotifications = async (): Promise<
  DeliveryNotification[]
> => {
  // TODO: Backend endpoint for notifications not yet implemented
  console.warn("Notifications endpoint not yet implemented in backend");

  // For now, return empty array to prevent errors
  return [];

  // TODO: Uncomment when backend endpoint is ready:
  // const res = await apiClient.get('/delivery/notifications/');
  // return res.data.results || res.data;
};

export const markNotificationAsRead = async (notificationId: string) => {
  // TODO: Backend endpoint for notifications not yet implemented
  console.warn(
    "Mark notification as read endpoint not yet implemented in backend"
  );

  // For now, return a mock response
  return { success: true };

  // TODO: Uncomment when backend endpoint is ready:
  // const res = await apiClient.patch(`/delivery/notifications/${notificationId}/`, { read: true });
  // return res.data;
};

// 📞 Emergency and support
export const requestEmergencyHelp = async (
  orderId: number,
  type: "vehicle_breakdown" | "safety_concern" | "customer_issue" | "other",
  description: string
) => {
  // TODO: Backend endpoint for emergency help not yet implemented
  console.warn("Emergency help endpoint not yet implemented in backend");

  // For now, return a mock response
  return {
    success: true,
    emergencyId: `emergency_${Date.now()}`,
    message: "Emergency request logged. Help is on the way.",
  };

  // TODO: Uncomment when backend endpoint is ready:
  // const res = await apiClient.post('/delivery/emergency/', {
  //   orderId,
  //   type,
  //   description,
  //   timestamp: new Date().toISOString(),
  //   location: await getCurrentLocation()
  // });
  // return res.data;
};

// 🎯 Enhanced location and tracking services
export const startDeliveryTracking = async (
  orderId: number,
  startLocation: { lat: number; lng: number }
) => {
  try {
    // TODO: Uncomment when backend endpoint is ready
    // const res = await apiClient.post(`/delivery/tracking/${orderId}/start/`, {
    //   start_location: startLocation,
    //   timestamp: new Date().toISOString()
    // });
    // return res.data;

    console.warn("Delivery tracking endpoint not yet implemented in backend");
    return {
      success: true,
      trackingId: `tracking_${orderId}_${Date.now()}`,
      startTime: new Date().toISOString(),
      startLocation,
    };
  } catch (error) {
    console.error("Failed to start delivery tracking:", error);
    throw error;
  }
};

export const updateDeliveryProgress = async (
  orderId: number,
  progress: {
    currentLocation: { lat: number; lng: number };
    estimatedArrival?: string;
    distanceRemaining?: number;
    status: "en_route" | "nearby" | "at_location";
  }
) => {
  try {
    // TODO: Uncomment when backend endpoint is ready
    // const res = await apiClient.post(`/delivery/tracking/${orderId}/update/`, {
    //   ...progress,
    //   timestamp: new Date().toISOString()
    // });
    // return res.data;

    console.warn(
      "Delivery progress update endpoint not yet implemented in backend"
    );
    return {
      success: true,
      orderId,
      ...progress,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to update delivery progress:", error);
    throw error;
  }
};

export const completeDelivery = async (
  orderId: number,
  completionData: {
    location: { lat: number; lng: number };
    completionTime: string;
    deliveryPhoto?: string;
    customerSignature?: string;
    deliveryNotes?: string;
  }
) => {
  try {
    const res = await apiClient.post(`/orders/orders/${orderId}/complete/`, {
      ...completionData,
      status: "delivered",
    });
    return res.data;
  } catch (error) {
    console.error("Failed to complete delivery:", error);
    throw error;
  }
};

// 🚗 Navigation and routing helpers
export const calculateOptimalRoute = async (
  currentLocation: { lat: number; lng: number },
  destinations: {
    orderId: number;
    address: string;
    lat?: number;
    lng?: number;
  }[]
) => {
  try {
    // TODO: Integrate with Google Maps Directions API or backend route optimization
    console.warn("Route calculation using mock data");

    return {
      optimizedRoute: destinations.map((dest, index) => ({
        ...dest,
        order: index + 1,
        estimatedDuration: Math.random() * 30 + 10, // 10-40 minutes
        distance: Math.random() * 5 + 1, // 1-6 km
      })),
      totalDistance: destinations.length * 3.5,
      totalDuration: destinations.length * 20,
      savings: {
        distanceSaved: destinations.length * 0.8,
        timeSaved: destinations.length * 5,
      },
    };
  } catch (error) {
    console.error("Failed to calculate optimal route:", error);
    throw error;
  }
};

export const getNavigationInstructions = async (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
) => {
  try {
    // This would integrate with Google Maps Directions API
    console.warn("Using mock navigation instructions");

    return {
      instructions: [
        "Head north on Main St",
        "Turn right onto Oak Ave",
        "Turn left onto Pine St",
        "Destination will be on your right",
      ],
      distance: "2.3 km",
      duration: "8 minutes",
      polyline: "", // Would contain encoded polyline for map display
    };
  } catch (error) {
    console.error("Failed to get navigation instructions:", error);
    throw error;
  }
};

// 🚚 Get chef location for navigation
export const getChefLocation = async (
  orderId: number
): Promise<{
  chef: {
    id: number;
    name: string;
    phone?: string;
    email: string;
    location: any;
  };
  order_id: number;
  pickup_address: string;
}> => {
  const res = await apiClient.get(`/orders/orders/${orderId}/chef_location/`);
  return res.data;
};

// 🚚 Mark order as picked up (supports both normal and bulk orders)
export const markOrderPickedUp = async (
  orderId: number,
  notes?: string,
  pickupLocation?: { lat: number; lng: number; address?: string },
  orderType: "normal" | "bulk" = "normal"
): Promise<any> => {
  try {
    let res;
    if (orderType === "bulk") {
      // For bulk orders, we'll use the status update endpoint since mark_picked_up might not exist
      // This updates the bulk order status to 'preparing' which indicates pickup
      res = await apiClient.patch(`/orders/bulk/${orderId}/`, {
        status: "preparing",
        notes: notes || "Bulk order picked up from chef",
        pickup_location: pickupLocation,
      });
    } else {
      res = await apiClient.post(`/orders/orders/${orderId}/mark_picked_up/`, {
        notes: notes || "Order picked up from chef",
        pickup_location: pickupLocation,
      });
    }
    return res.data;
  } catch (error: any) {
    console.error("Error marking order as picked up:", error);

    // Provide specific error information
    if (error.response?.status === 400) {
      const errorMessage =
        error.response?.data?.error || "Invalid pickup request";
      throw new Error(`Pickup failed: ${errorMessage}`);
    } else if (error.response?.status === 403) {
      throw new Error("You are not authorized to mark this order as picked up");
    } else if (error.response?.status === 404) {
      throw new Error("Order not found");
    } else {
      throw new Error("Failed to mark order as picked up. Please try again.");
    }
  }
};

// 📧 Contact Form Submission
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  contact_id: number;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: string;
  user?: number;
  user_name?: string;
  created_at: string;
  updated_at: string;
}

export const submitContactForm = async (
  formData: ContactFormData
): Promise<ContactResponse> => {
  try {
    const res = await apiClient.post("/communications/contacts/", {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || "",
      subject: formData.subject,
      message: formData.message,
    });
    return res.data;
  } catch (error) {
    console.error("Failed to submit contact form:", error);
    throw error;
  }
};

// 📧 Contact Management Functions (Admin)
export const getContacts = async (): Promise<{
  results: ContactResponse[];
  count: number;
  stats?: any;
}> => {
  try {
    const res = await apiClient.get("/communications/contacts/");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
    throw error;
  }
};

export const getContact = async (
  contactId: number
): Promise<ContactResponse> => {
  try {
    const res = await apiClient.get(`/communications/contacts/${contactId}/`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch contact:", error);
    throw error;
  }
};

export const getContactStats = async (): Promise<any> => {
  try {
    const res = await apiClient.get("/communications/contacts/stats/");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch contact stats:", error);
    throw error;
  }
};

export const sendContactReply = async (
  contactId: number,
  replyData: { reply_subject?: string; reply_message: string }
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await apiClient.post("/communications/contacts/send_reply/", {
      contact_id: contactId,
      reply_subject: replyData.reply_subject,
      reply_message: replyData.reply_message,
    });
    return res.data;
  } catch (error) {
    console.error("Failed to send contact reply:", error);
    throw error;
  }
};

// 🚚 Get active deliveries for admin dashboard
export const getActiveDeliveries = async (): Promise<UnifiedOrder[]> => {
  try {
    // Get all assigned orders that are currently being delivered
    const assignedOrders = await getMyAssignedOrders();
    return assignedOrders.filter((order) =>
      ["assigned", "out_for_delivery", "picked_up", "in_transit"].includes(
        order.status
      )
    );
  } catch (error) {
    console.error("Failed to fetch active deliveries:", error);
    return [];
  }
};

// 📊 Get delivery statistics for admin dashboard
export const getDeliveryStats = async (): Promise<{
  total_deliveries: number;
  completed_today: number;
  in_progress: number;
  average_delivery_time: number;
  success_rate: number;
}> => {
  try {
    // This would ideally be a dedicated backend endpoint
    // For now, we'll aggregate from existing data
    const history = await getDeliveryHistory();
    const active = await getActiveDeliveries();

    const today = new Date().toDateString();
    const completedToday = history.filter(
      (order) =>
        order.status === "delivered" &&
        new Date(order.updated_at).toDateString() === today
    ).length;

    return {
      total_deliveries: history.length,
      completed_today: completedToday,
      in_progress: active.length,
      average_delivery_time: 25, // Mock value - would be calculated from actual delivery times
      success_rate: 0.95, // Mock value - would be calculated from delivery success/failure ratio
    };
  } catch (error) {
    console.error("Failed to fetch delivery stats:", error);
    return {
      total_deliveries: 0,
      completed_today: 0,
      in_progress: 0,
      average_delivery_time: 0,
      success_rate: 0,
    };
  }
};

// Helper function to get current location
const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
};
