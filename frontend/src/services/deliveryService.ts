import apiClient from './apiClient'; // your centralized axios instance
import type { Order } from '../types/orderType';

// Enhanced interfaces for delivery functionality
export interface DeliveryIssue {
  id: string;
  orderId: number;
  type: 'customer_unavailable' | 'wrong_address' | 'traffic_delay' | 'vehicle_problem' | 'other';
  description: string;
  timestamp: string;
  status: 'reported' | 'acknowledged' | 'resolved';
}

export interface DeliveryLog {
  id: string;
  orderId: number;
  deliveryAgentId: string;
  startTime: string;
  endTime?: string;
  distance: number;
  totalTime: number; // in minutes
  status: 'in_progress' | 'completed' | 'failed';
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
  type: 'text' | 'location' | 'image';
}

export interface DeliveryNotification {
  id: string;
  title: string;
  message: string;
  type: 'order_assigned' | 'customer_message' | 'route_updated' | 'issue_reported';
  timestamp: string;
  read: boolean;
  orderId?: number;
}

// 🚚 Get orders assigned to current delivery agent
export const getMyAssignedOrders = async (): Promise<Order[]> => {
  // Since there's no specific backend endpoint for "my assigned orders",
  // we'll use the general orders endpoint and rely on backend filtering
  // The backend should filter orders based on the authenticated user
  const res = await apiClient.get('/orders/orders/');
  const allOrders = res.data.results || res.data;
  
  // Filter for orders that are assigned and in active delivery states
  return allOrders.filter((order: Order) => 
    ['assigned', 'out_for_delivery', 'picked_up', 'in_transit'].includes(order.status)
  );
};

// 🚚 Fetch available orders
export const getAvailableOrders = async (): Promise<Order[]> => {
  const res = await apiClient.get('/orders/orders/');
  return res.data.results || res.data;
};

// 🚚 Accept an order for delivery
export const acceptOrder = async (orderId: number): Promise<Order> => {
  const res = await apiClient.post(`/orders/orders/${orderId}/accept/`);
  return res.data;
};

// 🚚 Get Cook Details
export const getCookDetails = async (cookId: number): Promise<any> => {
  const res = await apiClient.get(`/auth/cook-profile/${cookId}/`);
  return res.data;
}

// 🚚 Update order status with enhanced tracking
export const updateOrderStatus = async (
  orderId: number,
  status: 'picked_up' | 'out_for_delivery' | 'in_transit' | 'delivered',
  location?: { lat: number; lng: number; address?: string }
) => {
  const res = await apiClient.patch(`/orders/orders/${orderId}/status/`, { 
    status,
    location,
    timestamp: new Date().toISOString()
  });
  return res.data.results || res.data;
};

// 🚚 Get delivery history for the current delivery agent
export const getDeliveryHistory = async (): Promise<Order[]> => {
  const res = await apiClient.get('/orders/orders/history/');
  return res.data.results || res.data;
};

// 🚚 Get dashboard summary
export const getDashboardSummary = async (): Promise<{
  active_deliveries: number;
  completed_today: number;
  todays_earnings: number;
  avg_delivery_time_min: number;
}> => {
  const res = await apiClient.get('/orders/orders/dashboard_summary/');
  return res.data;
};

// 🚨 Report delivery issues
export const reportDeliveryIssue = async (
  orderId: number,
  issueType: DeliveryIssue['type'],
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
    status: 'reported'
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
    timestamp: new Date().toISOString()
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
  type: 'text' | 'location' = 'text'
): Promise<ChatMessage> => {
  // TODO: Backend endpoint for chat messages not yet implemented
  console.warn("Chat messaging endpoint not yet implemented in backend");
  
  // For now, return a mock response to prevent errors
  const mockMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    orderId,
    senderId: 'current_user', // This should be the actual user ID
    receiverId: 'customer',
    message,
    timestamp: new Date().toISOString(),
    type
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

export const getChatMessages = async (orderId: number): Promise<ChatMessage[]> => {
  // TODO: Backend endpoint for chat messages not yet implemented
  console.warn("Chat messages endpoint not yet implemented in backend");
  
  // For now, return empty array to prevent errors
  return [];
  
  // TODO: Uncomment when backend endpoint is ready:
  // const res = await apiClient.get(`/delivery/chat/${orderId}/`);
  // return res.data.results || res.data;
};

// 📊 Delivery logs and performance
export const submitDeliveryLog = async (log: Omit<DeliveryLog, 'id'>): Promise<DeliveryLog> => {
  // TODO: Backend endpoint for delivery logs not yet implemented
  console.warn("Submit delivery log endpoint not yet implemented in backend");
  
  // For now, return a mock response
  const mockLog: DeliveryLog = {
    id: `log_${Date.now()}`,
    ...log
  };
  
  return mockLog;
  
  // TODO: Uncomment when backend endpoint is ready:
  // const res = await apiClient.post('/delivery/logs/', log);
  // return res.data;
};

export const getDeliveryLogs = async (dateRange?: { start: string; end: string }): Promise<DeliveryLog[]> => {
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
    savings: { distance: 0, time: 0 }
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
    duration: 0
  };
  
  // TODO: Uncomment when backend endpoint is ready:
  // const res = await apiClient.get(`/delivery/route/${orderId}/directions/`);
  // return res.data;
};

// 🔔 Notifications
export const getDeliveryNotifications = async (): Promise<DeliveryNotification[]> => {
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
  console.warn("Mark notification as read endpoint not yet implemented in backend");
  
  // For now, return a mock response
  return { success: true };
  
  // TODO: Uncomment when backend endpoint is ready:
  // const res = await apiClient.patch(`/delivery/notifications/${notificationId}/`, { read: true });
  // return res.data;
};

// 📞 Emergency and support
export const requestEmergencyHelp = async (
  orderId: number,
  type: 'vehicle_breakdown' | 'safety_concern' | 'customer_issue' | 'other',
  description: string
) => {
  // TODO: Backend endpoint for emergency help not yet implemented
  console.warn("Emergency help endpoint not yet implemented in backend");
  
  // For now, return a mock response
  return {
    success: true,
    emergencyId: `emergency_${Date.now()}`,
    message: "Emergency request logged. Help is on the way."
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
export const startDeliveryTracking = async (orderId: number, startLocation: { lat: number; lng: number }) => {
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
      startLocation
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
    status: 'en_route' | 'nearby' | 'at_location';
  }
) => {
  try {
    // TODO: Uncomment when backend endpoint is ready
    // const res = await apiClient.post(`/delivery/tracking/${orderId}/update/`, {
    //   ...progress,
    //   timestamp: new Date().toISOString()
    // });
    // return res.data;
    
    console.warn("Delivery progress update endpoint not yet implemented in backend");
    return {
      success: true,
      orderId,
      ...progress,
      timestamp: new Date().toISOString()
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
      status: 'delivered'
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
  destinations: { orderId: number; address: string; lat?: number; lng?: number }[]
) => {
  try {
    // TODO: Integrate with Google Maps Directions API or backend route optimization
    console.warn("Route calculation using mock data");
    
    return {
      optimizedRoute: destinations.map((dest, index) => ({
        ...dest,
        order: index + 1,
        estimatedDuration: Math.random() * 30 + 10, // 10-40 minutes
        distance: Math.random() * 5 + 1 // 1-6 km
      })),
      totalDistance: destinations.length * 3.5,
      totalDuration: destinations.length * 20,
      savings: {
        distanceSaved: destinations.length * 0.8,
        timeSaved: destinations.length * 5
      }
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
        "Destination will be on your right"
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

// Helper function to get current location
const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
};