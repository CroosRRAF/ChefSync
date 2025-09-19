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
import { communicationService, type Complaint } from '@/services/communicationService';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const ComplaintManagement: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
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
      await communicationService.resolveComplaint(selectedComplaint.id, {
        resolution,
        status: newStatus
      });
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
      pending: 'bg-yellow-100 text-yellow-800',
      investigating: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    return styles[priority as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Complaints</h2>
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
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
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

      <div className="rounded-md border">
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
                    <div className="font-medium">{complaint.user_name}</div>
                    <div className="text-sm text-gray-500">{complaint.user_email}</div>
                    {complaint.order_id && (
                      <div className="text-xs text-gray-500">Order #{complaint.order_id}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{complaint.subject}</TableCell>
                <TableCell>
                  <Badge className={getPriorityBadge(complaint.priority)}>
                    {complaint.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadge(complaint.status)}>
                    {complaint.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(complaint.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedComplaint(complaint)}
                    disabled={complaint.status === 'resolved' || complaint.status === 'rejected'}
                  >
                    {complaint.status === 'resolved' ? (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-1" />
                    )}
                    {complaint.status === 'resolved' ? 'Resolved' : 'Resolve'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {complaints.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
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
              <h4 className="font-medium">Complaint Details</h4>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">{selectedComplaint?.subject}</p>
                <p className="text-sm">{selectedComplaint?.description}</p>
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