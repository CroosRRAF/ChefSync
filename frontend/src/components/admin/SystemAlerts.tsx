import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/context/ThemeContext";
import {
  communicationService,
  type SystemAlert,
} from "@/services/communicationService";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Edit, Loader2, Plus, Send, Trash2 } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const alertFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.enum(["info", "warning", "error", "success"]),
  target_users: z.enum(["all", "customers", "chefs", "admins"]),
  status: z.enum(["draft", "scheduled", "sent"]),
  scheduled_at: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

type AlertFormValues = z.infer<typeof alertFormSchema>;

interface SystemAlertsProps {
  className?: string;
}

const SystemAlerts: React.FC<SystemAlertsProps> = ({ className }) => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<SystemAlert | null>(null);

  const form = useForm<AlertFormValues>({
    resolver: zodResolver(alertFormSchema),
    defaultValues: {
      type: "info",
      target_users: "all",
      status: "draft",
    },
  });

  // React Query for fetching alerts
  const {
    data: alerts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["systemAlerts"],
    queryFn: () => communicationService.getSystemAlerts(),
    select: (response) => response.results || [],
  });

  // Mutation for creating alerts
  const createMutation = useMutation({
    mutationFn: (data: Omit<SystemAlert, "id" | "created_at" | "updated_at">) =>
      communicationService.createSystemAlert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systemAlerts"] });
      toast.success("Alert created successfully");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Failed to create alert");
      console.error("Create alert error:", error);
    },
  });

  // Mutation for updating alerts
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SystemAlert> }) =>
      communicationService.updateSystemAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systemAlerts"] });
      toast.success("Alert updated successfully");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Failed to update alert");
      console.error("Update alert error:", error);
    },
  });

  // Mutation for deleting alerts
  const deleteMutation = useMutation({
    mutationFn: (id: number) => communicationService.deleteSystemAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systemAlerts"] });
      toast.success("Alert deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete alert");
      console.error("Delete alert error:", error);
    },
  });

  // Mutation for sending alerts
  const sendMutation = useMutation({
    mutationFn: (id: number) => communicationService.sendSystemAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systemAlerts"] });
      toast.success("Alert sent successfully");
    },
    onError: (error) => {
      toast.error("Failed to send alert");
      console.error("Send alert error:", error);
    },
  });

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingAlert(null);
    form.reset();
  }, [form]);

  const handleOpenCreateDialog = useCallback(() => {
    setEditingAlert(null);
    form.reset({
      type: "info",
      target_users: "all",
      status: "draft",
    });
    setIsDialogOpen(true);
  }, [form]);

  const handleEdit = useCallback(
    (alert: SystemAlert) => {
      setEditingAlert(alert);
      form.reset({
        title: alert.title,
        message: alert.message,
        type: alert.type,
        target_users: alert.target_users,
        status: alert.status,
        scheduled_at: alert.scheduled_at,
      });
      setIsDialogOpen(true);
    },
    [form]
  );

  const handleDelete = useCallback(
    (id: number) => {
      if (window.confirm("Are you sure you want to delete this alert?")) {
        deleteMutation.mutate(id);
      }
    },
    [deleteMutation]
  );

  const handleSend = useCallback(
    (id: number) => {
      sendMutation.mutate(id);
    },
    [sendMutation]
  );

  const onSubmit = useCallback(
    (data: AlertFormValues) => {
      if (editingAlert) {
        updateMutation.mutate({ id: editingAlert.id, data });
      } else {
        const newAlert: Omit<SystemAlert, "id" | "created_at" | "updated_at"> =
          {
            title: data.title,
            message: data.message,
            type: data.type,
            target_users: data.target_users,
            status: data.status,
            created_by: "admin", // This should come from your auth context
            metadata: data.metadata || {},
            scheduled_at: data.scheduled_at,
          };
        createMutation.mutate(newAlert);
      }
    },
    [editingAlert, updateMutation, createMutation]
  );

  const getTypeBadge = (type: string) => {
    const styles = {
      info: {
        backgroundColor:
          theme === "light" ? "#DBEAFE" : "rgba(59, 130, 246, 0.2)",
        color: theme === "light" ? "#1E40AF" : "#93C5FD",
      },
      warning: {
        backgroundColor:
          theme === "light" ? "#FEF3C7" : "rgba(245, 158, 11, 0.2)",
        color: theme === "light" ? "#92400E" : "#FCD34D",
      },
      error: {
        backgroundColor:
          theme === "light" ? "#FECACA" : "rgba(239, 68, 68, 0.2)",
        color: theme === "light" ? "#991B1B" : "#FCA5A5",
      },
      success: {
        backgroundColor:
          theme === "light" ? "#D1FAE5" : "rgba(16, 185, 129, 0.2)",
        color: theme === "light" ? "#065F46" : "#A7F3D0",
      },
    };
    return (
      styles[type as keyof typeof styles] || {
        backgroundColor:
          theme === "light" ? "#F3F4F6" : "rgba(107, 114, 128, 0.2)",
        color: theme === "light" ? "#374151" : "#D1D5DB",
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: {
        backgroundColor:
          theme === "light" ? "#F3F4F6" : "rgba(107, 114, 128, 0.2)",
        color: theme === "light" ? "#374151" : "#D1D5DB",
      },
      scheduled: {
        backgroundColor:
          theme === "light" ? "#EDE9FE" : "rgba(147, 51, 234, 0.2)",
        color: theme === "light" ? "#5B21B6" : "#C4B5FD",
      },
      sent: {
        backgroundColor:
          theme === "light" ? "#D1FAE5" : "rgba(16, 185, 129, 0.2)",
        color: theme === "light" ? "#065F46" : "#A7F3D0",
      },
    };
    return (
      styles[status as keyof typeof styles] || {
        backgroundColor:
          theme === "light" ? "#F3F4F6" : "rgba(107, 114, 128, 0.2)",
        color: theme === "light" ? "#374151" : "#D1D5DB",
      }
    );
  };

  // Error display
  const errorMessage = error
    ? "Failed to load alerts. Please try again."
    : null;

  return (
    <div className={`space-y-4 ${className || ""}`}>
      <div className="flex justify-between items-center">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{
              color: theme === "light" ? "#111827" : "#F9FAFB",
            }}
          >
            System Alerts
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage system-wide notifications and alerts
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog} disabled={isLoading}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Alert
        </Button>
      </div>

      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
          <p className="text-sm text-destructive">{errorMessage}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["systemAlerts"] })
            }
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      <div
        className="rounded-md border"
        style={{
          borderColor: theme === "light" ? "#E5E7EB" : "#374151",
          backgroundColor: theme === "light" ? "#FFFFFF" : "#1F2937",
        }}
      >
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
                  <Badge style={getTypeBadge(alert.type)}>{alert.type}</Badge>
                </TableCell>
                <TableCell
                  className="capitalize"
                  style={{
                    color: theme === "light" ? "#111827" : "#F9FAFB",
                  }}
                >
                  {alert.target_users}
                </TableCell>
                <TableCell>
                  <Badge style={getStatusBadge(alert.status)}>
                    {alert.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(alert.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(alert)}
                      disabled={updateMutation.isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {alert.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSend(alert.id)}
                        disabled={sendMutation.isPending}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {alert.status === "scheduled" && (
                      <Button variant="ghost" size="sm" disabled>
                        <Clock className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(alert.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {alerts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8"
                  style={{
                    color: theme === "light" ? "#6B7280" : "#9CA3AF",
                  }}
                >
                  {isLoading ? "Loading..." : "No alerts found"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAlert ? "Edit Alert" : "Create New Alert"}
            </DialogTitle>
            <DialogDescription>
              Create a system alert to notify users about important updates or
              information.
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
                      <Textarea
                        {...field}
                        placeholder="Alert message"
                        rows={4}
                      />
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target users" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="customers">
                            Customers Only
                          </SelectItem>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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

              {form.watch("status") === "scheduled" && (
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
                <Button
                  variant="outline"
                  onClick={handleCloseDialog}
                  type="button"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingAlert ? "Update Alert" : "Create Alert"}
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
