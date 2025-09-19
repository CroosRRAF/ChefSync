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
import { Input } from '@/components/ui/input';
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
import { Star, MessageCircle } from 'lucide-react';

const FeedbackManagement: React.FC = () => {
  const { theme } = useTheme();
  const [feedbacks, setFeedbacks] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Communication | null>(null);
  const [response, setResponse] = useState('');
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
  });

  useEffect(() => {
    fetchFeedbacks();
  }, [filter]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (filter.status !== 'all') params.status = filter.status;
      if (filter.priority !== 'all') params.priority = filter.priority;
      
      const response = await communicationService.getFeedbacks(params);
      if (response?.results) {
        setFeedbacks(response.results);
      } else {
        setFeedbacks([]);
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching feedbacks:', error);
      setError('Failed to load feedbacks. Please try again later.');
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedFeedback || !response) return;

    try {
      await communicationService.addResponse(selectedFeedback.id, { response });
      setSelectedFeedback(null);
      setResponse('');
      fetchFeedbacks();
    } catch (error) {
      console.error('Error responding to feedback:', error);
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
    };
    return styles[status as keyof typeof styles] || {
      backgroundColor: theme === 'light' ? '#F3F4F6' : 'rgba(107, 114, 128, 0.2)',
      color: theme === 'light' ? '#374151' : '#D1D5DB'
    };
  };

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${index < rating ? 'fill-current' : ''}`}
        style={{
          color: index < rating 
            ? (theme === 'light' ? '#F59E0B' : '#FBBF24')
            : (theme === 'light' ? '#D1D5DB' : '#6B7280')
        }}
      />
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{
          color: theme === 'light' ? '#111827' : '#F9FAFB'
        }}>Customer Feedback</h2>
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
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedbacks.map((feedback) => (
              <TableRow key={feedback.id}>
                <TableCell>
                  <div>
                    <div className="font-medium" style={{
                      color: theme === 'light' ? '#111827' : '#F9FAFB'
                    }}>{feedback.user.name}</div>
                    <div className="text-sm" style={{
                      color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                    }}>{feedback.user.email}</div>
                  </div>
                </TableCell>
                <TableCell>{feedback.subject}</TableCell>
                <TableCell>
                  <div className="flex">{renderStars(feedback.rating)}</div>
                </TableCell>
                <TableCell>
                  <Badge style={getStatusBadge(feedback.status)}>
                    {feedback.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(feedback.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFeedback(feedback)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Respond
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {feedbacks.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{
                        borderColor: theme === 'light' ? '#2563EB' : '#3B82F6'
                      }}></div>
                    </div>
                  ) : error ? (
                    <div style={{
                      color: theme === 'light' ? '#EF4444' : '#F87171'
                    }}>{error}</div>
                  ) : (
                    <div style={{
                      color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                    }}>No feedbacks found</div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Feedback</DialogTitle>
            <DialogDescription>
              Respond to the customer's feedback. Your response will be sent via email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium" style={{
                color: theme === 'light' ? '#111827' : '#F9FAFB'
              }}>Customer Feedback</h4>
              <p className="text-sm" style={{
                color: theme === 'light' ? '#6B7280' : '#9CA3AF'
              }}>{selectedFeedback?.message}</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="response" className="text-sm font-medium" style={{
                color: theme === 'light' ? '#111827' : '#F9FAFB'
              }}>
                Your Response
              </label>
              <Textarea
                id="response"
                placeholder="Type your response here..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
              Cancel
            </Button>
            <Button onClick={handleRespond} disabled={!response}>
              Send Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedbackManagement;