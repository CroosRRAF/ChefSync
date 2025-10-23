import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell } from 'lucide-react';

const NotificationBadge: React.FC = () => {
  const [notifications] = useState([
    {
      id: 1,
      title: 'New order received',
      message: 'Order #1234 has been placed',
      time: '2 minutes ago',
      unread: true,
    },
    {
      id: 2,
      title: 'System update',
      message: 'ChefSync has been updated to v2.1',
      time: '1 hour ago',
      unread: true,
    },
    {
      id: 3,
      title: 'Payment processed',
      message: 'Payment for order #1230 completed',
      time: '3 hours ago',
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2">
          <h4 className="font-semibold text-sm">Notifications</h4>
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} className="p-3">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${notification.unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {notification.title}
                  </p>
                  {notification.unread && (
                    <div className="h-2 w-2 bg-primary rounded-full" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {notification.time}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBadge;
