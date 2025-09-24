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
  type EmailTemplate,
} from "@/services/communicationService";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Eye, Loader2, Plus, Send, Trash2 } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  type: z.enum(["welcome", "order", "alert", "feedback", "promotional"]),
  variables: z.array(z.string()).optional(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface EmailTemplatesProps {
  className?: string;
}

const EmailTemplates: React.FC<EmailTemplatesProps> = ({ className }) => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(
    null
  );

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      type: "welcome",
      variables: [],
    },
  });

  // React Query for fetching templates
  const {
    data: templates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["emailTemplates"],
    queryFn: () =>
      communicationService.getEmailTemplates({ page: 1, limit: 50 }),
    select: (response) => response.results || [],
  });

  // Mutation for creating templates
  const createMutation = useMutation({
    mutationFn: (
      data: Omit<EmailTemplate, "id" | "created_at" | "updated_at">
    ) => communicationService.createEmailTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast.success("Template created successfully");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Failed to create template");
      console.error("Create template error:", error);
    },
  });

  // Mutation for updating templates
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EmailTemplate> }) =>
      communicationService.updateEmailTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast.success("Template updated successfully");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Failed to update template");
      console.error("Update template error:", error);
    },
  });

  // Mutation for deleting templates
  const deleteMutation = useMutation({
    mutationFn: (id: number) => communicationService.deleteEmailTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast.success("Template deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete template");
      console.error("Delete template error:", error);
    },
  });

  // Mutation for sending test emails
  const sendTestMutation = useMutation({
    mutationFn: (id: number) =>
      communicationService.sendCustomEmail({
        template_id: id,
        subject: "[TEST] Email Template Preview",
        recipients: [], // Add admin email here
        body: "This is a test email to preview the template.",
      }),
    onSuccess: () => {
      toast.success("Test email sent successfully");
    },
    onError: (error) => {
      toast.error("Failed to send test email");
      console.error("Send test email error:", error);
    },
  });

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
    form.reset();
  }, [form]);

  const handleOpenCreateDialog = useCallback(() => {
    setEditingTemplate(null);
    form.reset({
      type: "welcome",
      variables: [],
    });
    setIsDialogOpen(true);
  }, [form]);

  const handleEdit = useCallback(
    (template: EmailTemplate) => {
      setEditingTemplate(template);
      form.reset({
        name: template.name,
        subject: template.subject,
        body: template.body,
        type: template.type,
        variables: template.variables,
      });
      setIsDialogOpen(true);
    },
    [form]
  );

  const handleDelete = useCallback(
    (template: EmailTemplate) => {
      if (window.confirm("Are you sure you want to delete this template?")) {
        deleteMutation.mutate(template.id);
      }
    },
    [deleteMutation]
  );

  const handleSendTest = useCallback(
    (id: number) => {
      sendTestMutation.mutate(id);
    },
    [sendTestMutation]
  );

  const handlePreview = useCallback((template: EmailTemplate) => {
    setPreviewTemplate(template);
  }, []);

  const onSubmit = useCallback(
    (data: TemplateFormValues) => {
      if (editingTemplate) {
        updateMutation.mutate({ id: editingTemplate.id, data });
      } else {
        const newTemplate: Omit<
          EmailTemplate,
          "id" | "created_at" | "updated_at"
        > = {
          name: data.name,
          subject: data.subject,
          body: data.body,
          type: data.type,
          variables: data.variables || [],
        };
        createMutation.mutate(newTemplate);
      }
    },
    [editingTemplate, updateMutation, createMutation]
  );

  const getTemplateTypeBadge = (type: string) => {
    const styles = {
      welcome: {
        backgroundColor:
          theme === "light" ? "#D1FAE5" : "rgba(16, 185, 129, 0.2)",
        color: theme === "light" ? "#065F46" : "#A7F3D0",
      },
      order: {
        backgroundColor:
          theme === "light" ? "#DBEAFE" : "rgba(59, 130, 246, 0.2)",
        color: theme === "light" ? "#1E40AF" : "#93C5FD",
      },
      alert: {
        backgroundColor:
          theme === "light" ? "#FECACA" : "rgba(239, 68, 68, 0.2)",
        color: theme === "light" ? "#991B1B" : "#FCA5A5",
      },
      feedback: {
        backgroundColor:
          theme === "light" ? "#EDE9FE" : "rgba(147, 51, 234, 0.2)",
        color: theme === "light" ? "#5B21B6" : "#C4B5FD",
      },
      promotional: {
        backgroundColor:
          theme === "light" ? "#FEF3C7" : "rgba(245, 158, 11, 0.2)",
        color: theme === "light" ? "#92400E" : "#FCD34D",
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

  // Error display
  const errorMessage = error
    ? "Failed to load templates. Please try again."
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
            Email Templates
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage email templates for system communications
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog} disabled={isLoading}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
          <p className="text-sm text-destructive">{errorMessage}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["emailTemplates"] })
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
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Variables</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <div>
                    <div
                      className="font-medium"
                      style={{
                        color: theme === "light" ? "#111827" : "#F9FAFB",
                      }}
                    >
                      {template.name}
                    </div>
                    <div
                      className="text-sm"
                      style={{
                        color: theme === "light" ? "#6B7280" : "#9CA3AF",
                      }}
                    >
                      {template.subject}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge style={getTemplateTypeBadge(template.type)}>
                    {template.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor:
                            theme === "light" ? "#D1D5DB" : "#6B7280",
                          color: theme === "light" ? "#6B7280" : "#D1D5DB",
                          backgroundColor:
                            theme === "light" ? "#FFFFFF" : "#374151",
                        }}
                      >
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {template.last_used_at
                    ? new Date(template.last_used_at).toLocaleDateString()
                    : "Never"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      disabled={updateMutation.isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendTest(template.id)}
                      disabled={sendTestMutation.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {templates.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8"
                  style={{
                    color: theme === "light" ? "#6B7280" : "#9CA3AF",
                  }}
                >
                  {isLoading ? "Loading..." : "No templates found"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create Email Template"}
            </DialogTitle>
            <DialogDescription>
              Create or modify email templates for various communication
              purposes.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Welcome Email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="welcome">Welcome</SelectItem>
                          <SelectItem value="order">Order</SelectItem>
                          <SelectItem value="alert">Alert</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                          <SelectItem value="promotional">
                            Promotional
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Subject</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Email subject line" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Body</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Email content with optional HTML"
                        className="min-h-[300px] font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  {editingTemplate ? "Update Template" : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewTemplate}
        onOpenChange={() => setPreviewTemplate(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview of the email template content.
            </DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Template Name</label>
                  <p className="text-sm text-muted-foreground">
                    {previewTemplate.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Badge style={getTemplateTypeBadge(previewTemplate.type)}>
                    {previewTemplate.type}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Subject</label>
                <p className="text-sm text-muted-foreground">
                  {previewTemplate.subject}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Body</label>
                <div
                  className="border rounded-md p-4 max-h-96 overflow-y-auto bg-muted/50"
                  dangerouslySetInnerHTML={{ __html: previewTemplate.body }}
                />
              </div>

              {previewTemplate.variables.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Variables</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {previewTemplate.variables.map((variable, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
            {previewTemplate && (
              <Button onClick={() => handleSendTest(previewTemplate.id)}>
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplates;
