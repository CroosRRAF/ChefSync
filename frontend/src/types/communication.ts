import { User } from '@/types/auth';

export interface Communication {
  id: number;
  reference_number: string;
  user: User;
  communication_type: 'feedback' | 'complaint' | 'suggestion' | 'inquiry' | 'other';
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  read_at: string | null;
  is_archived: boolean;
  assigned_to: User | null;
  resolution_notes: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  attachments: CommunicationAttachment[];
  responses: CommunicationResponse[];
  tags: CommunicationTag[];
  categories: CommunicationCategory[];
}

export interface CommunicationAttachment {
  id: number;
  file: string;
  filename: string;
  file_type: string;
  file_size: number;
  uploaded_by: User;
  created_at: string;
}

export interface CommunicationResponse {
  id: number;
  communication: number; // Communication ID
  responder: User;
  message: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunicationTag {
  id: number;
  name: string;
  description: string;
  color: string;
  created_by: User;
  created_at: string;
}

export interface CommunicationCategory {
  id: number;
  name: string;
  description: string;
  parent: number | null; // Parent category ID
  is_active: boolean;
  subcategories: CommunicationCategory[];
  created_at: string;
  updated_at: string;
}

export interface CommunicationTemplate {
  id: number;
  name: string;
  template_type: 'feedback' | 'complaint' | 'inquiry' | 'general' | 'resolution' | 'acknowledgment';
  subject: string;
  content: string;
  variables: Record<string, string>;
  is_active: boolean;
  created_by: User;
  created_at: string;
  updated_at: string;
}

export interface CommunicationFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  communication_type?: string;
  is_read?: boolean;
  assigned_to?: number | 'unassigned';
  category?: number;
  tag?: number;
  start_date?: string;
  end_date?: string;
}

export interface CommunicationStats {
  total: number;
  unread: number;
  unassigned: number;
  resolved: number;
  by_type: Array<{
    communication_type: string;
    count: number;
  }>;
  by_priority: Array<{
    priority: string;
    count: number;
  }>;
  by_status: Array<{
    status: string;
    count: number;
  }>;
}

export interface PaginatedCommunicationResponse {
  results: Communication[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}