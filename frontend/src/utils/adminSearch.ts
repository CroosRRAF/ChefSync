import { adminService } from '@/services/adminService';

export interface SearchResult {
  id: string | number;
  title: string;
  description: string;
  type: 'user' | 'order' | 'food' | 'chef' | 'setting';
  icon: string;
  link: string;
}

export async function performAdminSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  try {
    // Search in parallel across different entities
    const [users, orders, foods] = await Promise.all([
      adminService.getUsers({ search: query, limit: 5 }).catch(() => ({ users: [] })),
      adminService.getOrders({ search: query, limit: 5 }).catch(() => ({ orders: [] })),
      // Add more search endpoints as needed
    ]);

    const results: SearchResult[] = [
      // Map user results
      ...users.users.map(user => ({
        id: user.id,
        title: user.name,
        description: `${user.email} - ${user.role}`,
        type: 'user' as const,
        icon: 'user',
        link: `/admin/users/${user.id}`
      })),

      // Map order results
      ...orders.orders.map(order => ({
        id: order.id,
        title: `Order #${order.order_number}`,
        description: `${order.customer_name} - ${order.status} - $${order.total_amount}`,
        type: 'order' as const,
        icon: 'shopping-cart',
        link: `/admin/orders/${order.id}`
      })),
    ];

    // Sort results by relevance (you can implement your own sorting logic)
    return results.slice(0, 10); // Limit to top 10 results
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}