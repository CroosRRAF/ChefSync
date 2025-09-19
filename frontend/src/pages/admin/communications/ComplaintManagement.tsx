import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from '@/context/ThemeContext';
import { communicationService, type Communication } from '@/services/communicationService';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const ComplaintManagement: React.FC = () => {
  const { theme } = useTheme();
  const [complaints, setComplaints] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Communication | null>(null);
  const [resolution, setResolution] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
  });

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter.status !== 'all') params.status = filter.status;
      if (filter.priority !== 'all') params.priority = filter.priority;
      
      const response = await communicationService.getComplaints(params);
      setComplaints(response.results || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedComplaint || !resolution || !newStatus) return;

    try {
      await communicationService.addResponse(selectedComplaint.id, {
        response: resolution,
        is_resolution: true
      });
      await communicationService.updateStatus(selectedComplaint.id, newStatus);
      setSelectedComplaint(null);
      setResolution('');
      setNewStatus('');
      fetchComplaints();
    } catch (error) {
      console.error('Error resolving complaint:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: {
        backgroundColor: theme === 'light' ? '#FEF3C7' : 'rgba(245, 158, 11, 0.2)',
        color: theme === 'light' ? '#92400E' : '#FCD34D'
      },
      in_progress: {
        backgroundColor: theme === 'light' ? '#DBEAFE' : 'rgba(59, 130, 246, 0.2)',
        color: theme === 'light' ? '#1E40AF' : '#93C5FD'
      },
      resolved: {
        backgroundColor: theme === 'light' ? '#D1FAE5' : 'rgba(16, 185, 129, 0.2)',
        color: theme === 'light' ? '#065F46' : '#A7F3D0'
      },
      closed: {
        backgroundColor: theme === 'light' ? '#F3F4F6' : 'rgba(107, 114, 128, 0.2)',
        color: theme === 'light' ? '#374151' : '#D1D5DB'
      },
    };
    return styles[status as keyof typeof styles] || {
      backgroundColor: theme === 'light' ? '#F3F4F6' : 'rgba(107, 114, 128, 0.2)',
      color: theme === 'light' ? '#374151' : '#D1D5DB'
    };
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: {
        backgroundColor: theme === 'light' ? '#D1FAE5' : 'rgba(16, 185, 129, 0.2)',
        color: theme === 'light' ? '#065F46' : '#A7F3D0'
      },
      medium: {
        backgroundColor: theme === 'light' ? '#FEF3C7' : 'rgba(245, 158, 11, 0.2)',
        color: theme === 'light' ? '#92400E' : '#FCD34D'
      },
      high: {
        backgroundColor: theme === 'light' ? '#FECACA' : 'rgba(239, 68, 68, 0.2)',
        color: theme === 'light' ? '#991B1B' : '#FCA5A5'
      },
    };
    return styles[priority as keyof typeof styles] || {
      backgroundColor: theme === 'light' ? '#F3F4F6' : 'rgba(107, 114, 128, 0.2)',
      color: theme === 'light' ? '#374151' : '#D1D5DB'
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{
          color: theme === 'light' ? '#111827' : '#F9FAFB'
        }}>Complaints</h2>
        <div className="flex gap-4">
          <Select
            value={filter.status}
            onValueChange={(value) => setFilter({ ...filter, status: value })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filter.priority}
            onValueChange={(value) => setFilter({ ...filter, priority: value })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border" style={{
        borderColor: theme === 'light' ? '#E5E7EB' : '#374151',
        backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937'
      }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints.map((complaint) => (
              <TableRow key={complaint.id}>
                <TableCell>
                  <div>
                    <div className="font-medium" style={{
                      color: theme === 'light' ? '#111827' : '#F9FAFB'
                    }}>{complaint.user.name}</div>
                    <div className="text-sm" style={{
                      color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                    }}>{complaint.user.email}</div>
                    {complaint.order_id && (
                      <div className="text-xs" style={{
                        color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                      }}>Order #{complaint.order_id}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{complaint.subject}</TableCell>
                <TableCell>
                  <Badge style={getPriorityBadge(complaint.priority)}>
                    {complaint.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge style={getStatusBadge(complaint.status)}>
                    {complaint.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(complaint.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedComplaint(complaint)}
                    disabled={complaint.status === 'resolved' || complaint.status === 'closed'}
                  >
                    {complaint.status === 'resolved' || complaint.status === 'closed' ? (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-1" />
                    )}
                    {(complaint.status === 'resolved' || complaint.status === 'closed') ? 'Resolved' : 'Resolve'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {complaints.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8" style={{
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                }}>
                  {loading ? 'Loading...' : 'No complaints found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resolve Complaint</DialogTitle>
            <DialogDescription>
              Review the complaint details and provide a resolution.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium" style={{
                color: theme === 'light' ? '#111827' : '#F9FAFB'
              }}>Complaint Details</h4>
              <div className="p-4 rounded-lg space-y-2" style={{
                backgroundColor: theme === 'light' ? '#F9FAFB' : '#111827'
              }}>
                <p className="text-sm font-medium" style={{
                  color: theme === 'light' ? '#111827' : '#F9FAFB'
                }}>{selectedComplaint?.subject}</p>
                <p className="text-sm" style={{
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                }}>{selectedComplaint?.message}</p>
                {selectedComplaint?.attachments && selectedComplaint.attachments.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {selectedComplaint.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        Attachment {index + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Resolution Status
              </label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="investigating">Mark as Investigating</SelectItem>
                  <SelectItem value="resolved">Resolve Complaint</SelectItem>
                  <SelectItem value="rejected">Reject Complaint</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="resolution" className="text-sm font-medium">
                Resolution Details
              </label>
              <Textarea
                id="resolution"
                placeholder="Provide details about how the complaint was resolved..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedComplaint(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleResolve} 
              disabled={!resolution || !newStatus}
              variant={newStatus === 'rejected' ? 'destructive' : 'default'}
            >
              {newStatus === 'investigating' && 'Mark as Investigating'}
              {newStatus === 'resolved' && 'Resolve Complaint'}
              {newStatus === 'rejected' && 'Reject Complaint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComplaintManagement;