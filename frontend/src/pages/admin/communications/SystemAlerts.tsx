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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTheme } from '@/context/ThemeContext';
import { communicationService, type SystemAlert } from '@/services/communicationService';
import { Bell, Calendar, Send, Trash2, Edit } from 'lucide-react';

const alertFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['info', 'warning', 'error', 'success']),
  target_users: z.enum(['all', 'customers', 'chefs', 'admins']),
  status: z.enum(['draft', 'scheduled', 'sent']),
  scheduled_at: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

type AlertFormValues = z.infer<typeof alertFormSchema>;

const SystemAlerts: React.FC = () => {
  const { theme } = useTheme();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null);

  const form = useForm<AlertFormValues>({
    resolver: zodResolver(alertFormSchema),
    defaultValues: {
      type: 'info',
      target_users: 'all',
      status: 'draft'
    }
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await communicationService.getSystemAlerts();
      setAlerts(response.results || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AlertFormValues) => {
    try {
      if (selectedAlert) {
        await communicationService.updateSystemAlert(selectedAlert.id, data);
      } else {
        // Add required fields when creating a new alert
        const newAlert: Omit<SystemAlert, 'id' | 'created_at' | 'updated_at'> = {
          title: data.title,
          message: data.message,
          type: data.type,
          target_users: data.target_users,
          status: data.status,
          created_by: 'admin', // This should come from your auth context
          metadata: data.metadata || {},
          scheduled_at: data.scheduled_at
        };
        await communicationService.createSystemAlert(newAlert);
      }
      setIsCreating(false);
      setSelectedAlert(null);
      form.reset();
      fetchAlerts();
    } catch (error) {
      console.error('Error saving alert:', error);
    }
  };

  const handleEdit = (alert: SystemAlert) => {
    setSelectedAlert(alert);
    form.reset({
      title: alert.title,
      message: alert.message,
      type: alert.type,
      target_users: alert.target_users,
      status: alert.status,
      scheduled_at: alert.scheduled_at
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await communicationService.deleteSystemAlert(id);
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const handleSend = async (id: number) => {
    try {
      await communicationService.sendSystemAlert(id);
      fetchAlerts();
    } catch (error) {
      console.error('Error sending alert:', error);
    }
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      info: {
        backgroundColor: theme === 'light' ? '#DBEAFE' : 'rgba(59, 130, 246, 0.2)',
        color: theme === 'light' ? '#1E40AF' : '#93C5FD'
      },
      warning: {
        backgroundColor: theme === 'light' ? '#FEF3C7' : 'rgba(245, 158, 11, 0.2)',
        color: theme === 'light' ? '#92400E' : '#FCD34D'
      },
      error: {
        backgroundColor: theme === 'light' ? '#FECACA' : 'rgba(239, 68, 68, 0.2)',
        color: theme === 'light' ? '#991B1B' : '#FCA5A5'
      },
      success: {
        backgroundColor: theme === 'light' ? '#D1FAE5' : 'rgba(16, 185, 129, 0.2)',
        color: theme === 'light' ? '#065F46' : '#A7F3D0'
      },
    };
    return styles[type as keyof typeof styles] || {
      backgroundColor: theme === 'light' ? '#F3F4F6' : 'rgba(107, 114, 128, 0.2)',
      color: theme === 'light' ? '#374151' : '#D1D5DB'
    };
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: {
        backgroundColor: theme === 'light' ? '#F3F4F6' : 'rgba(107, 114, 128, 0.2)',
        color: theme === 'light' ? '#374151' : '#D1D5DB'
      },
      scheduled: {
        backgroundColor: theme === 'light' ? '#EDE9FE' : 'rgba(147, 51, 234, 0.2)',
        color: theme === 'light' ? '#5B21B6' : '#C4B5FD'
      },
      sent: {
        backgroundColor: theme === 'light' ? '#D1FAE5' : 'rgba(16, 185, 129, 0.2)',
        color: theme === 'light' ? '#065F46' : '#A7F3D0'
      },
    };
    return styles[status as keyof typeof styles] || {
      backgroundColor: theme === 'light' ? '#F3F4F6' : 'rgba(107, 114, 128, 0.2)',
      color: theme === 'light' ? '#374151' : '#D1D5DB'
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{
          color: theme === 'light' ? '#111827' : '#F9FAFB'
        }}>System Alerts</h2>
        <Button onClick={() => { setIsCreating(true); setSelectedAlert(null); form.reset(); }}>
          <Bell className="h-4 w-4 mr-2" />
          Create New Alert
        </Button>
      </div>

      <div className="rounded-md border" style={{
        borderColor: theme === 'light' ? '#E5E7EB' : '#374151',
        backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937'
      }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Target Users</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>{alert.title}</TableCell>
                <TableCell>
                  <Badge style={getTypeBadge(alert.type)}>
                    {alert.type}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize" style={{
                  color: theme === 'light' ? '#111827' : '#F9FAFB'
                }}>
                  {alert.target_users}
                </TableCell>
                <TableCell>
                  <Badge style={getStatusBadge(alert.status)}>
                    {alert.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(alert.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(alert)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {alert.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSend(alert.id)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {alerts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8" style={{
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                }}>
                  {loading ? 'Loading...' : 'No alerts found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAlert ? 'Edit Alert' : 'Create New Alert'}</DialogTitle>
            <DialogDescription>
              Create a system alert to notify users about important updates or information.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Alert title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Alert message" rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select alert type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_users"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Users</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target users" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="customers">Customers Only</SelectItem>
                          <SelectItem value="chefs">Chefs Only</SelectItem>
                          <SelectItem value="admins">Admins Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Save as Draft</SelectItem>
                        <SelectItem value="scheduled">Schedule</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('status') === 'scheduled' && (
                <FormField
                  control={form.control}
                  name="scheduled_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreating(false)} type="button">
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedAlert ? 'Update Alert' : 'Create Alert'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemAlerts;