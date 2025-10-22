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

// 🚚 Get orders assigned to current delivery agent
export const getMyAssignedOrders = async (): Promise<Order[]> => {
  // Since there's no specific backend endpoint for "my assigned orders",
  // we'll use the general orders endpoint and rely on backend filtering
  // The backend should filter orders based on the authenticated user
  const res = await apiClient.get("/orders/orders/");
  const allOrders = res.data.results || res.data;

  // Filter for orders that are assigned and in active delivery states
  return allOrders.filter((order: Order) =>
    ["assigned", "out_for_delivery", "picked_up", "in_transit"].includes(
      order.status
    )
  );
};

// 🚚 Fetch available orders
export const getAvailableOrders = async (): Promise<Order[]> => {
  const res = await apiClient.get("/orders/orders/");
  return res.data.results || res.data;
};

// 🚚 Accept an order for delivery with distance checking
export const acceptOrder = async (
  orderId: number,
  agentLocation?: { lat: number; lng: number },
  chefLocation?: { lat: number; lng: number }
): Promise<
  | Order
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

  const res = await apiClient.post(
    `/orders/orders/${orderId}/accept/`,
    requestData
  );
  return res.data;
};

// 🚚 Get Cook Details with kitchen location
export const getCookDetails = async (cookId: number): Promise<any> => {
  const res = await apiClient.get(`/auth/cook-profile/${cookId}/`);
  return res.data;
};

// 🚚 Get pickup location from order (NEW FEATURE)
export const getPickupLocation = (order: Order): string | null => {
  // Try to get pickup location from multiple sources
  return order.pickup_location || order.chef?.kitchen_location || null;
};

// 🚚 Navigate to pickup location (NEW FEATURE)
export const navigateToPickupLocation = (order: Order): boolean => {
  const pickupLocation = getPickupLocation(order);
  if (pickupLocation) {
    const encodedLocation = encodeURIComponent(pickupLocation);
    const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;
    window.open(navigationUrl, "_blank");
    return true;
  }
  return false;
};

// 🚚 Navigate to delivery location
export const navigateToDeliveryLocation = (order: Order): boolean => {
  if (order.delivery_address) {
    const encodedAddress = encodeURIComponent(order.delivery_address);
    const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(navigationUrl, "_blank");
    return true;
  }
  return false;
};

// 🚚 Update order status with enhanced tracking
export const updateOrderStatus = async (
  orderId: number,
  status: "picked_up" | "out_for_delivery" | "in_transit" | "delivered",
  location?: { lat: number; lng: number; address?: string }
) => {
  const res = await apiClient.patch(`/orders/orders/${orderId}/status/`, {
    status,
    location,
    timestamp: new Date().toISOString(),
  });
  return res.data.results || res.data;
};

// 🚚 Get delivery history for the current delivery agent
export const getDeliveryHistory = async (): Promise<Order[]> => {
  const res = await apiClient.get("/orders/orders/history/");
  return res.data.results || res.data;
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
  try {
    const res = await apiClient.post(
      `/orders/delivery/${orderId}/report_issue/`,
      {
        issue_type: issueType,
        description,
      }
    );

    return {
      id: res.data.issue.issue_id,
      orderId,
      type: issueType,
      description,
      timestamp: res.data.issue.created_at,
      status: res.data.issue.status,
    };
  } catch (error) {
    console.error("Failed to report issue:", error);
    throw error;
  }
};

// 📍 Update delivery agent location
export const updateDeliveryLocation = async (
  orderId: number,
  latitude: number,
  longitude: number,
  address?: string
) => {
  try {
    const res = await apiClient.post(
      `/orders/delivery/${orderId}/update_location/`,
      {
        latitude,
        longitude,
        address,
      }
    );
    return res.data;
  } catch (error) {
    console.error("Failed to update location:", error);
    throw error;
  }
};

// 📱 Communication functions
export const sendCustomerMessage = async (
  orderId: number,
  message: string,
  type: "text" | "location" = "text"
): Promise<ChatMessage> => {
  try {
    const res = await apiClient.post(`/orders/delivery/${orderId}/chat/`, {
      message,
      message_type: type,
    });

    return {
      id: res.data.chat_message.message_id,
      orderId,
      senderId: "current_user",
      receiverId: "customer",
      message: res.data.chat_message.message,
      timestamp: res.data.chat_message.created_at,
      type: res.data.chat_message.message_type,
    };
  } catch (error) {
    console.error("Failed to send message:", error);
    // Fallback to mock response on error
    return {
      id: `msg_${Date.now()}`,
      orderId,
      senderId: "current_user",
      receiverId: "customer",
      message,
      timestamp: new Date().toISOString(),
      type,
    };
  }
};

export const getChatMessages = async (
  orderId: number
): Promise<ChatMessage[]> => {
  try {
    const res = await apiClient.get(`/orders/delivery/${orderId}/chat/`);

    if (res.data.messages) {
      return res.data.messages.map((msg: any) => ({
        id: msg.message_id,
        orderId,
        senderId: msg.sender.id,
        receiverId: "", // Not provided in response
        message: msg.message,
        timestamp: msg.created_at,
        type: msg.message_type,
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to get chat messages:", error);
    return [];
  }
};

// 📊 Delivery logs and performance
export const submitDeliveryLog = async (
  log: Omit<DeliveryLog, "id">
): Promise<DeliveryLog> => {
  const res = await apiClient.post('/delivery/logs/', log);
  return res.data;
};

export const getDeliveryLogs = async (dateRange?: {
  start: string;
  end: string;
}): Promise<DeliveryLog[]> => {
  const params = dateRange ? `?start=${dateRange.start}&end=${dateRange.end}` : '';
  const res = await apiClient.get(`/delivery/logs/${params}`);
  return res.data.results || res.data;
};

// 🗺️ Route optimization
export const optimizeDeliveryRoute = async (orderIds: number[]) => {
  const res = await apiClient.post('/delivery/route/optimize/', { order_ids: orderIds });
  return res.data;
};

export const getRouteDirections = async (orderId: number) => {
  const res = await apiClient.get(`/delivery/route/${orderId}/directions/`);
  return res.data;
};

// 🔔 Notifications
export const getDeliveryNotifications = async (): Promise<
  DeliveryNotification[]
> => {
  const res = await apiClient.get('/delivery/notifications/');
  return res.data.results || res.data;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const res = await apiClient.patch(`/delivery/notifications/${notificationId}/`, { read: true });
  return res.data;
};

// 📞 Emergency and support
export const requestEmergencyHelp = async (
  orderId: number,
  type: "vehicle_breakdown" | "safety_concern" | "customer_issue" | "other",
  description: string
) => {
  const res = await apiClient.post('/delivery/emergency/', {
    orderId,
    type,
    description,
    timestamp: new Date().toISOString(),
    // Optionally include current location via getCurrentLocation()
  });
  return res.data;
};

// 🎯 Enhanced location and tracking services
export const startDeliveryTracking = async (
  orderId: number,
  startLocation: { lat: number; lng: number }
) => {
  try {
    const res = await apiClient.post(`/delivery/tracking/${orderId}/start/`, {
      start_location: startLocation,
      timestamp: new Date().toISOString()
    });
    return res.data;
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
    const res = await apiClient.post(`/delivery/tracking/${orderId}/update/`, {
      ...progress,
      timestamp: new Date().toISOString()
    });
    return res.data;
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
    const response = await apiClient.post('/delivery/optimize-route', {
      destinations
    });
    return response.data;
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

// 🚚 Mark order as picked up
export const markOrderPickedUp = async (
  orderId: number,
  notes?: string,
  pickupLocation?: { lat: number; lng: number; address?: string }
): Promise<any> => {
  const res = await apiClient.post(
    `/orders/orders/${orderId}/mark_picked_up/`,
    {
      notes: notes || "Order picked up from chef",
      pickup_location: pickupLocation,
    }
  );
  return res.data;
};

// 📊 Get active deliveries (Admin)
export const getActiveDeliveries = async () => {
  try {
    const res = await apiClient.get("/orders/delivery/active_deliveries/");
    return res.data;
  } catch (error) {
    console.error("Failed to get active deliveries:", error);
    return {
      success: false,
      count: 0,
      active_deliveries: [],
    };
  }
};

// 📈 Get delivery statistics (Admin)
export const getDeliveryStats = async (days: number = 7) => {
  try {
    const res = await apiClient.get(
      `/orders/delivery/delivery_stats/?days=${days}`
    );
    return res.data;
  } catch (error) {
    console.error("Failed to get delivery stats:", error);
    return {
      success: false,
      stats: {
        active_deliveries: 0,
        completed_deliveries: 0,
        avg_delivery_time_minutes: 0,
        on_time_delivery_rate: 0,
        total_issues: 0,
        open_issues: 0,
        total_revenue: 0,
        delivery_fee_revenue: 0,
      },
      top_delivery_partners: [],
    };
  }
};

// 📍 Track order in real-time
export const trackOrder = async (orderId: number) => {
  try {
    const res = await apiClient.get(`/orders/delivery/${orderId}/track/`);
    return res.data;
  } catch (error) {
    console.error("Failed to track order:", error);
    return null;
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
