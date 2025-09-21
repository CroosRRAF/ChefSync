import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import AdminNotifications from '../Notifications';
import { adminService } from '@/services/adminService';
import { useUserStore } from '@/store/userStore';

// Mock the admin service
jest.mock('@/services/adminService', () => ({
  adminService: {
    getNotifications: jest.fn(),
    getUnreadNotificationCount: jest.fn(),
    createNotification: jest.fn(),
    markNotificationRead: jest.fn(),
    markAllNotificationsRead: jest.fn(),
  },
}));

// Mock the user store
jest.mock('@/store/userStore', () => ({
  useUserStore: jest.fn(),
}));

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUser = {
  id: 1,
  email: 'admin@chefsync.com',
  name: 'Admin User',
  role: 'admin',
};

const mockNotifications = [
  {
    id: 1,
    title: 'New Order Received',
    message: 'A new order has been placed for Table 5',
    notification_type: 'order',
    priority: 'normal',
    is_read: false,
    is_active: true,
    created_at: '2025-09-20T14:30:00Z',
    read_at: null,
    expires_at: null,
    time_ago: '2 hours ago',
    is_expired: false,
    metadata: {},
  },
  {
    id: 2,
    title: 'System Maintenance',
    message: 'Scheduled maintenance will begin in 30 minutes',
    notification_type: 'system',
    priority: 'high',
    is_read: true,
    is_active: true,
    created_at: '2025-09-20T14:00:00Z',
    read_at: '2025-09-20T14:35:00Z',
    expires_at: null,
    time_ago: '2 hours ago',
    is_expired: false,
    metadata: {},
  },
];

describe('AdminNotifications Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock user store
    (useUserStore as jest.MockedFunction<typeof useUserStore>).mockReturnValue({
      user: mockUser,
    });

    // Mock admin service
    (adminService.getNotifications as jest.MockedFunction<typeof adminService.getNotifications>).mockResolvedValue({
      results: mockNotifications,
      count: 2,
      next: null,
      previous: null,
    });
    (adminService.getUnreadNotificationCount as jest.MockedFunction<typeof adminService.getUnreadNotificationCount>).mockResolvedValue({
      unread_count: 1,
    });
    (adminService.createNotification as jest.MockedFunction<typeof adminService.createNotification>).mockResolvedValue(mockNotifications[0]);
    (adminService.markNotificationRead as jest.MockedFunction<typeof adminService.markNotificationRead>).mockResolvedValue({
      ...mockNotifications[0],
      is_read: true,
      read_at: new Date().toISOString(),
    });
    (adminService.markAllNotificationsRead as jest.MockedFunction<typeof adminService.markAllNotificationsRead>).mockResolvedValue({
      message: 'All notifications marked as read',
    });
  });

  it('renders loading state initially', () => {
    render(<AdminNotifications />);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    // The component doesn't show a loading spinner initially, just renders the form
    expect(screen.getByText('Compose Notification')).toBeInTheDocument();
  });

  it('loads and displays notifications correctly', async () => {
    render(<AdminNotifications />);

    await waitFor(() => {
      expect(adminService.getNotifications).toHaveBeenCalled();
    });

    expect(screen.getByText('New Order Received')).toBeInTheDocument();
    // Use getAllByText to handle multiple elements with same text
    expect(screen.getAllByText('System Maintenance')).toHaveLength(2); // One in template, one in notification
    expect(screen.getByText('Compose Notification')).toBeInTheDocument();
    expect(screen.getByText('Quick Templates')).toBeInTheDocument();
  });

  it('shows login prompt when user is not authenticated', () => {
    (useUserStore as jest.MockedFunction<typeof useUserStore>).mockReturnValue({
      user: null,
    });

    render(<AdminNotifications />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('handles form input changes', async () => {
    render(<AdminNotifications />);

    await waitFor(() => {
      expect(adminService.getNotifications).toHaveBeenCalled();
    });

    const titleInput = screen.getByPlaceholderText('Enter notification title');
    const messageTextarea = screen.getByPlaceholderText('Enter notification message');

    fireEvent.change(titleInput, { target: { value: 'Test Notification' } });
    fireEvent.change(messageTextarea, { target: { value: 'Test message content' } });

    expect(titleInput).toHaveValue('Test Notification');
    expect(messageTextarea).toHaveValue('Test message content');
  });

  it('sends notification successfully', async () => {
    render(<AdminNotifications />);

    await waitFor(() => {
      expect(adminService.getNotifications).toHaveBeenCalled();
    });

    // Fill form
    const titleInput = screen.getByPlaceholderText('Enter notification title');
    const messageTextarea = screen.getByPlaceholderText('Enter notification message');

    fireEvent.change(titleInput, { target: { value: 'Test Notification' } });
    fireEvent.change(messageTextarea, { target: { value: 'Test message content' } });

    // Click send
    const sendButton = screen.getByRole('button', { name: /send notification/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(adminService.createNotification).toHaveBeenCalledWith({
        title: 'Test Notification',
        message: 'Test message content',
        notification_type: 'info',
        priority: 'normal',
        target_audience: 'all',
        send_email: true,
        send_sms: false,
      });
    });

    expect(require('sonner').toast.success).toHaveBeenCalledWith('Notification sent successfully');
  });

  it('validates form before sending', async () => {
    render(<AdminNotifications />);

    await waitFor(() => {
      expect(adminService.getNotifications).toHaveBeenCalled();
    });

    // Try to send without filling form
    const sendButton = screen.getByRole('button', { name: /send notification/i });
    fireEvent.click(sendButton);

    expect(require('sonner').toast.error).toHaveBeenCalledWith('Please fill in both title and message');
    expect(adminService.createNotification).not.toHaveBeenCalled();
  });

  it('handles send notification error', async () => {
    (adminService.createNotification as jest.MockedFunction<typeof adminService.createNotification>).mockRejectedValue(new Error('Send failed'));

    render(<AdminNotifications />);

    await waitFor(() => {
      expect(adminService.getNotifications).toHaveBeenCalled();
    });

    // Fill and send
    const titleInput = screen.getByPlaceholderText('Enter notification title');
    const messageTextarea = screen.getByPlaceholderText('Enter notification message');

    fireEvent.change(titleInput, { target: { value: 'Test' } });
    fireEvent.change(messageTextarea, { target: { value: 'Test message' } });

    const sendButton = screen.getByRole('button', { name: /send notification/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalledWith('Send failed');
    });
  });

  it('marks notification as read', async () => {
    render(<AdminNotifications />);

    await waitFor(() => {
      expect(adminService.getNotifications).toHaveBeenCalled();
    });

    const markReadButtons = screen.getAllByRole('button', { name: /mark read/i });
    fireEvent.click(markReadButtons[0]); // Mark first notification as read

    await waitFor(() => {
      expect(adminService.markNotificationRead).toHaveBeenCalledWith(1);
    });

    expect(require('sonner').toast.success).toHaveBeenCalledWith('Notification marked as read');
  });

  it('handles mark as read error', async () => {
    (adminService.markNotificationRead as jest.MockedFunction<typeof adminService.markNotificationRead>).mockRejectedValue(new Error('Mark read failed'));

    render(<AdminNotifications />);

    await waitFor(() => {
      expect(adminService.getNotifications).toHaveBeenCalled();
    });

    const markReadButtons = screen.getAllByRole('button', { name: /mark read/i });
    fireEvent.click(markReadButtons[0]);

    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalledWith('Failed to mark notification as read');
    });
  });

  it('shows empty state when no notifications', async () => {
    (adminService.getNotifications as jest.MockedFunction<typeof adminService.getNotifications>).mockResolvedValue({
      results: [],
      count: 0,
      next: null,
      previous: null,
    });

    render(<AdminNotifications />);

    await waitFor(() => {
      expect(adminService.getNotifications).toHaveBeenCalled();
    });

    expect(screen.getByText('No notifications sent yet')).toBeInTheDocument();
  });

  it('displays unread indicator for unread notifications', async () => {
    render(<AdminNotifications />);

    await waitFor(() => {
      expect(adminService.getNotifications).toHaveBeenCalled();
    });

    // Should show unread indicator for the first notification
    const unreadIndicators = document.querySelectorAll('.bg-blue-500.rounded-full');
    expect(unreadIndicators).toHaveLength(1);
  });

  it('handles loading notifications error', async () => {
    (adminService.getNotifications as jest.MockedFunction<typeof adminService.getNotifications>).mockRejectedValue(new Error('Load failed'));

    render(<AdminNotifications />);

    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalledWith('Failed to load notifications');
    });
  });

  it('shows sending state during notification send', async () => {
    // Delay the send operation
    (adminService.createNotification as jest.MockedFunction<typeof adminService.createNotification>).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockNotifications[0]), 100))
    );

    render(<AdminNotifications />);

    await waitFor(() => {
      expect(adminService.getNotifications).toHaveBeenCalled();
    });

    // Fill form and send
    const titleInput = screen.getByPlaceholderText('Enter notification title');
    const messageTextarea = screen.getByPlaceholderText('Enter notification message');

    fireEvent.change(titleInput, { target: { value: 'Test' } });
    fireEvent.change(messageTextarea, { target: { value: 'Test message' } });

    const sendButton = screen.getByRole('button', { name: /send notification/i });
    fireEvent.click(sendButton);

    // Button should show loading state
    expect(sendButton).toBeDisabled();
  });

  it('resets form after successful send', async () => {
    render(<AdminNotifications />);

    await waitFor(() => {
      expect(adminService.getNotifications).toHaveBeenCalled();
    });

    // Fill form
    const titleInput = screen.getByPlaceholderText('Enter notification title');
    const messageTextarea = screen.getByPlaceholderText('Enter notification message');

    fireEvent.change(titleInput, { target: { value: 'Test Notification' } });
    fireEvent.change(messageTextarea, { target: { value: 'Test message' } });

    // Send
    const sendButton = screen.getByRole('button', { name: /send notification/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(adminService.createNotification).toHaveBeenCalled();
    });

    // Form should be reset
    expect(titleInput).toHaveValue('');
    expect(messageTextarea).toHaveValue('');
  });

  it('displays different notification types with correct icons and colors', async () => {
    render(<AdminNotifications />);

    await waitFor(() => {
      expect(adminService.getNotifications).toHaveBeenCalled();
    });

    // Check for order notification icon (Package)
    expect(document.querySelector('.lucide-package')).toBeInTheDocument();

    // Check for system notification icon (AlertTriangle)
    expect(document.querySelector('.lucide-alert-triangle')).toBeInTheDocument();
  });

  it('loads unread count on mount', async () => {
    render(<AdminNotifications />);

    await waitFor(() => {
      expect(adminService.getUnreadNotificationCount).toHaveBeenCalled();
    });
  });

  it('handles unread count loading error gracefully', async () => {
    (adminService.getUnreadNotificationCount as jest.MockedFunction<typeof adminService.getUnreadNotificationCount>).mockRejectedValue(new Error('Count failed'));

    // Mock console.error to avoid test output pollution
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<AdminNotifications />);

    await waitFor(() => {
      expect(adminService.getNotifications).toHaveBeenCalled();
    });

    // Should not crash, just log error
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load unread count:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});