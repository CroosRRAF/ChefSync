// ChefSync Service Worker
// Version 2.0.0 - Cross-Device Compatibility & Offline Support

const APP_VERSION = '2.0.0';
const CACHE_NAME = `chefsync-v${APP_VERSION}`;
const STATIC_CACHE_NAME = `chefsync-static-v${APP_VERSION}`;
const DYNAMIC_CACHE_NAME = `chefsync-dynamic-v${APP_VERSION}`;

// Update this when deploying new version to force cache refresh
const BUILD_TIMESTAMP = new Date().toISOString();

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/admin/dashboard',
  '/admin/users',
  '/admin/orders',
  '/admin/analytics',
  '/manifest.json',
  // Add critical CSS and JS files
  '/assets/index.css',
  '/assets/index.js',
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/admin-management\/dashboard\/stats\//,
  /\/api\/admin-management\/users\/list_users\//,
  /\/api\/analytics\/orders/,
  /\/api\/analytics\/customers/,
];

// Network-first strategy for API calls
const NETWORK_FIRST_PATTERNS = [
  /\/api\/admin-management\//,
  /\/api\/analytics\//,
  /\/api\/communications\//,
];

// Cache-first strategy for static assets
const CACHE_FIRST_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\.(?:css|js)$/,
  /\/assets\//,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing service worker v${APP_VERSION}...`);
  console.log(`[SW] Build timestamp: ${BUILD_TIMESTAMP}`);
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        // Try to cache, but don't fail if some assets aren't available yet
        return cache.addAll(STATIC_ASSETS).catch(err => {
          console.warn('[SW] Some assets failed to cache during install:', err);
        });
      }),
      // Skip waiting to activate immediately (important for updates)
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating service worker v${APP_VERSION}...`);
  
  event.waitUntil(
    Promise.all([
      // Clean up ALL old caches (important for cross-device updates)
      caches.keys().then((cacheNames) => {
        console.log('[SW] Existing caches:', cacheNames);
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete any cache that doesn't match current version
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== CACHE_NAME
            ) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately (important for updates)
      self.clients.claim().then(() => {
        console.log('[SW] Service worker has claimed all clients');
        // Notify all clients about the update
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_UPDATED',
              version: APP_VERSION,
              timestamp: BUILD_TIMESTAMP
            });
          });
        });
      })
    ])
  );
});

// Fetch event - handle requests with different strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation(request));
  } else {
    event.respondWith(handleOtherRequests(request));
  }
});

// Check if request is for API
function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

// Check if request is for static asset
function isStaticAsset(url) {
  return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Check if request is navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', url.pathname);
    
    // Fall back to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for critical API endpoints
    if (isCriticalApiEndpoint(url)) {
      return new Response(
        JSON.stringify({
          error: 'Offline',
          message: 'This data is not available offline',
          offline: true
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Handle navigation requests
async function handleNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation failed, serving offline page');
    
    // Try to serve cached version of the requested page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fall back to dashboard if available
    const dashboardCache = await caches.match('/admin/dashboard');
    if (dashboardCache) {
      return dashboardCache;
    }
    
    // Return offline page
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ChefSync Admin - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
            }
            .container { max-width: 400px; padding: 2rem; }
            h1 { font-size: 2rem; margin-bottom: 1rem; }
            p { font-size: 1.1rem; line-height: 1.5; margin-bottom: 2rem; }
            button { 
              background: rgba(255,255,255,0.2); 
              border: 2px solid rgba(255,255,255,0.3);
              color: white; 
              padding: 0.75rem 1.5rem; 
              border-radius: 0.5rem; 
              cursor: pointer;
              font-size: 1rem;
              transition: all 0.3s ease;
            }
            button:hover { 
              background: rgba(255,255,255,0.3); 
              transform: translateY(-2px);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔌 You're Offline</h1>
            <p>ChefSync Admin is currently unavailable. Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Handle other requests
async function handleOtherRequests(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Check if API endpoint is critical
function isCriticalApiEndpoint(url) {
  const criticalEndpoints = [
    '/api/admin-management/dashboard/stats/',
    '/api/admin-management/users/list_users/',
    '/api/analytics/orders',
    '/api/analytics/customers'
  ];
  
  return criticalEndpoints.some(endpoint => url.pathname.includes(endpoint));
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Perform background sync
async function doBackgroundSync() {
  console.log('[SW] Performing background sync...');
  
  // Retry failed requests stored in IndexedDB
  // This would be implemented based on your specific needs
  
  // For now, just clear old cache entries
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const requests = await cache.keys();
  
  // Remove cache entries older than 24 hours
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const dateHeader = response.headers.get('date');
      if (dateHeader && new Date(dateHeader).getTime() < oneDayAgo) {
        await cache.delete(request);
      }
    }
  }
}

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'You have new admin notifications',
    icon: '/favicon-delivery.ico',
    badge: '/favicon-delivery.ico',
    tag: 'admin-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Dashboard'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('ChefSync Admin', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/admin/dashboard')
    );
  }
});

// Message handler for commands from the app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('[SW] Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: APP_VERSION,
      timestamp: BUILD_TIMESTAMP
    });
  }
});

console.log(`[SW] Service worker v${APP_VERSION} loaded successfully`);
console.log('[SW] For cross-device compatibility, old caches will be cleared on activation');
