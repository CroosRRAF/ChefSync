import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import AdminSettings from '../Settings';
import { adminService } from '@/services/adminService';
import { useUserStore } from '@/store/userStore';

// Mock the admin service
jest.mock('@/services/adminService', () => ({
  adminService: {
    getSystemSettings: jest.fn(),
    updateSystemSetting: jest.fn(),
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

const mockSettings = [
  {
    id: 1,
    key: 'PLATFORM_NAME',
    value: 'ChefSync',
    typed_value: 'ChefSync',
    setting_type: 'string',
    category: 'general',
    description: 'Platform name',
    is_public: true,
    is_encrypted: false,
    default_value: 'ChefSync',
    validation_rules: {},
    updated_by: null,
    updated_at: '2025-09-20T14:30:00Z',
    created_at: '2025-09-15T10:00:00Z',
  },
  {
    id: 2,
    key: 'REQUIRE_2FA',
    value: 'false',
    typed_value: false,
    setting_type: 'boolean',
    category: 'security',
    description: 'Require 2FA',
    is_public: false,
    is_encrypted: false,
    default_value: 'false',
    validation_rules: {},
    updated_by: null,
    updated_at: '2025-09-20T14:30:00Z',
    created_at: '2025-09-15T10:00:00Z',
  },
  {
    id: 3,
    key: 'CONTACT_EMAIL',
    value: 'admin@chefsync.com',
    typed_value: 'admin@chefsync.com',
    setting_type: 'string',
    category: 'general',
    description: 'Contact email',
    is_public: true,
    is_encrypted: false,
    default_value: 'admin@chefsync.com',
    validation_rules: {},
    updated_by: null,
    updated_at: '2025-09-20T14:30:00Z',
    created_at: '2025-09-15T10:00:00Z',
  },
];

describe('AdminSettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock user store
    (useUserStore as jest.MockedFunction<typeof useUserStore>).mockReturnValue({
      user: mockUser,
    });

    // Mock admin service
    (adminService.getSystemSettings as jest.MockedFunction<typeof adminService.getSystemSettings>).mockResolvedValue(mockSettings);
    (adminService.updateSystemSetting as jest.MockedFunction<typeof adminService.updateSystemSetting>).mockResolvedValue(mockSettings[0]);
  });

  it('renders loading state initially', async () => {
    render(<AdminSettings />);

    // Initially shows loading state - check for skeleton classes
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(8); // 2 header skeletons + 6 card skeletons

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Admin Settings')).toBeInTheDocument();
    });
  });

  it('loads and displays settings correctly', async () => {
    render(<AdminSettings />);

    await waitFor(() => {
      expect(adminService.getSystemSettings).toHaveBeenCalled();
    });

    expect(screen.getByDisplayValue('ChefSync')).toBeInTheDocument();
    expect(screen.getByText('Platform Settings')).toBeInTheDocument();
    expect(screen.getByText('Security Settings')).toBeInTheDocument();
  });

  it('shows login prompt when user is not authenticated', () => {
    (useUserStore as jest.MockedFunction<typeof useUserStore>).mockReturnValue({
      user: null,
    });

    render(<AdminSettings />);

    expect(screen.getByText('Please log in to access settings')).toBeInTheDocument();
    expect(document.querySelector('svg.lucide-circle-alert')).toBeInTheDocument(); // AlertCircle icon
  });

  it('handles input changes and marks as having changes', async () => {
    render(<AdminSettings />);

    await waitFor(() => {
      expect(adminService.getSystemSettings).toHaveBeenCalled();
    });

    const platformNameInput = screen.getByDisplayValue('ChefSync');
    fireEvent.change(platformNameInput, { target: { value: 'New Platform Name' } });

    expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
  });

  it('saves settings successfully', async () => {
    render(<AdminSettings />);

    await waitFor(() => {
      expect(adminService.getSystemSettings).toHaveBeenCalled();
    });

    // Make a change
    const platformNameInput = screen.getByDisplayValue('ChefSync');
    fireEvent.change(platformNameInput, { target: { value: 'New Platform Name' } });

    // Click save
    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(adminService.updateSystemSetting).toHaveBeenCalledWith('PLATFORM_NAME', 'New Platform Name');
    });

    // Check that success toast was called
    expect(require('sonner').toast.success).toHaveBeenCalledWith('Successfully saved 3 settings');
  });

  it('handles save errors gracefully', async () => {
    (adminService.updateSystemSetting as jest.MockedFunction<typeof adminService.updateSystemSetting>).mockRejectedValue(new Error('Save failed'));

    render(<AdminSettings />);

    await waitFor(() => {
      expect(adminService.getSystemSettings).toHaveBeenCalled();
    });

    // Make a change and save
    const platformNameInput = screen.getByDisplayValue('ChefSync');
    fireEvent.change(platformNameInput, { target: { value: 'New Platform Name' } });

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalledWith('Save failed');
    });
  });

  it('resets changes correctly', async () => {
    render(<AdminSettings />);

    await waitFor(() => {
      expect(adminService.getSystemSettings).toHaveBeenCalled();
    });

    // Make a change
    const platformNameInput = screen.getByDisplayValue('ChefSync');
    fireEvent.change(platformNameInput, { target: { value: 'New Platform Name' } });

    // Reset changes
    const resetButton = screen.getByRole('button', { name: /reset changes/i });
    fireEvent.click(resetButton);

    expect(screen.getByDisplayValue('ChefSync')).toBeInTheDocument();
    expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument();
  });

  it('handles loading settings error', async () => {
    (adminService.getSystemSettings as jest.MockedFunction<typeof adminService.getSystemSettings>).mockRejectedValue(new Error('Load failed'));

    render(<AdminSettings />);

    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalledWith('Failed to load settings');
    });
  });

  it('refreshes settings on button click', async () => {
    render(<AdminSettings />);

    await waitFor(() => {
      expect(adminService.getSystemSettings).toHaveBeenCalledTimes(1);
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(adminService.getSystemSettings).toHaveBeenCalledTimes(2);
    });
  });

  it('handles boolean switch changes', async () => {
    render(<AdminSettings />);

    await waitFor(() => {
      expect(adminService.getSystemSettings).toHaveBeenCalled();
    });

    // Find and click the 2FA switch
    const switches = screen.getAllByRole('switch');
    const twoFactorSwitch = switches.find((switchEl) =>
      switchEl.closest('[id="two-factor"]')
    );

    if (twoFactorSwitch) {
      fireEvent.click(twoFactorSwitch);
      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    }
  });

  it('disables save button when no changes', async () => {
    render(<AdminSettings />);

    await waitFor(() => {
      expect(adminService.getSystemSettings).toHaveBeenCalled();
    });

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when changes exist', async () => {
    render(<AdminSettings />);

    await waitFor(() => {
      expect(adminService.getSystemSettings).toHaveBeenCalled();
    });

    // Make a change
    const platformNameInput = screen.getByDisplayValue('ChefSync');
    fireEvent.change(platformNameInput, { target: { value: 'Changed' } });

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    expect(saveButton).not.toBeDisabled();
  });

  it('shows saving state during save operation', async () => {
    // Delay the save operation
    (adminService.updateSystemSetting as jest.MockedFunction<typeof adminService.updateSystemSetting>).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockSettings[0]), 100))
    );

    render(<AdminSettings />);

    await waitFor(() => {
      expect(adminService.getSystemSettings).toHaveBeenCalled();
    });

    // Make a change and save
    const platformNameInput = screen.getByDisplayValue('ChefSync');
    fireEvent.change(platformNameInput, { target: { value: 'New Name' } });

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });
});