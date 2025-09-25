import EmailTemplates from "@/components/admin/EmailTemplates";
import { AdvancedDataTable } from "@/components/admin/AdvancedDataTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCommunicationStats } from "@/hooks/useCommunicationStats";
import { communicationService, type Communication, type CommunicationResponse } from "@/services/communicationService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Mail,
  MessageSquare,
  Search,
  Filter,
  MoreHorizontal,
  Reply,
  Archive,
  User,
  Calendar,
  Star,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  Send,
  RefreshCw,
  Grid,
  List,
  KanbanSquare,
  BarChart3,
  Bell,
  BellOff,
  CheckSquare,
  Square,
  Play,
  Pause,
  FastForward,
  Settings,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { format, isWithinInterval, startOfDay, endOfDay, subDays, subWeeks, subMonths } from "date-fns";
import React from "react";

const AdminCommunications: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { stats, loading: statsLoading, error: statsError } = useCommunicationStats();

  // State management
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);
  const [selectedCommunications, setSelectedCommunications] = useState<number[]>([]);

  // View and filter states
  const [viewMode, setViewMode] = useState<"list" | "table" | "kanban">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [assignedFilter, setAssignedFilter] = useState<string>("all");

  // Response dialog state
  const [responseDialog, setResponseDialog] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);

  // Bulk actions state
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Kanban columns
  const kanbanColumns = ["pending", "in_progress", "resolved", "closed"];

  // Calculate derived stats
  const totalCommunications = stats?.total || 0;
  const pendingReview = stats?.by_status.find((status) => status.status === "pending")?.count || 0;
  const resolved = stats?.by_status.find((status) => status.status === "resolved")?.count || 0;
  const inProgress = stats?.by_status.find((status) => status.status === "in_progress")?.count || 0;

  // Load communications
  const loadCommunications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await communicationService.getCommunications();
      setCommunications(data.results || []);
    } catch (err) {
      console.error("Error loading communications:", err);
      setError(err instanceof Error ? err.message : "Failed to load communications");
      toast({
        title: "Error",
        description: "Failed to load communications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Bulk actions handlers
  const handleSelectAll = useCallback(() => {
    if (selectedCommunications.length === filteredCommunications.length) {
      setSelectedCommunications([]);
    } else {
      setSelectedCommunications(filteredCommunications.map(c => c.id));
    }
  }, [selectedCommunications.length, filteredCommunications]);

  const handleSelectCommunication = (id: number) => {
    setSelectedCommunications(prev =>
      prev.includes(id)
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      await Promise.all(
        selectedCommunications.map(id => communicationService.updateStatus(id, newStatus))
      );
      toast({
        title: "Success",
        description: `Updated ${selectedCommunications.length} communications to ${newStatus}`,
      });
      setSelectedCommunications([]);
      loadCommunications();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update communications",
        variant: "destructive",
      });
    }
  };

  // Kanban data
  const kanbanData = useMemo(() => {
    const data: Record<string, Communication[]> = {};
    kanbanColumns.forEach(col => {
      data[col] = filteredCommunications.filter(comm => comm.status === col);
    });
    return data;
  }, [filteredCommunications, kanbanColumns]);

  // Render functions for different views
  const renderListView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          Communications List
          <Badge variant="secondary" className="ml-2">
            {filteredCommunications.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredCommunications.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Communications Found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters to see more results."
                : "No communications have been submitted yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select All Checkbox */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                checked={selectedCommunications.length === filteredCommunications.length && filteredCommunications.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">Select All</span>
            </div>

            {filteredCommunications.map((communication) => (
              <Card key={communication.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Selection Checkbox */}
                      <Checkbox
                        checked={selectedCommunications.includes(communication.id)}
                        onCheckedChange={() => handleSelectCommunication(communication.id)}
                        className="mt-1"
                      />

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge variant={getStatusBadgeVariant(communication.status)}>
                            {communication.status.replace("_", " ")}
                          </Badge>
                          <Badge variant={getPriorityBadgeVariant(communication.priority)}>
                            {getPriorityIcon(communication.priority)}
                            {communication.priority}
                          </Badge>
                          <Badge variant="outline">
                            {communication.communication_type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            #{communication.reference_number}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg">{communication.subject}</h3>
                          <p className="text-muted-foreground mt-1 line-clamp-2">
                            {communication.message}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {communication.user.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(communication.created_at), "MMM dd, yyyy")}
                          </div>
                          {communication.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {communication.rating}/5
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCommunication(communication);
                          setSendNotification(true);
                          setSendEmail(true);
                          setResponseDialog(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Reply className="h-4 w-4" />
                      </Button>

                      {communication.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusUpdate(communication.id, "in_progress")}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}

                      {communication.status === "in_progress" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusUpdate(communication.id, "resolved")}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSelectedCommunication(communication)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {communication.status !== "closed" && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(communication.id, "closed")}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Close
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderTableView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid className="h-5 w-5" />
          Communications Table
          <Badge variant="secondary" className="ml-2">
            {filteredCommunications.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedCommunications.length === filteredCommunications.length && filteredCommunications.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommunications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Communications Found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || typeFilter !== "all"
                        ? "Try adjusting your filters to see more results."
                        : "No communications have been submitted yet."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCommunications.map((communication) => (
                  <TableRow key={communication.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedCommunications.includes(communication.id)}
                        onCheckedChange={() => handleSelectCommunication(communication.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      #{communication.reference_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium line-clamp-1">{communication.subject}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {communication.message}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{communication.communication_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(communication.status)}>
                        {communication.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(communication.priority)}>
                        {getPriorityIcon(communication.priority)}
                        {communication.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {communication.user.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(communication.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCommunication(communication);
                            setSendNotification(true);
                            setSendEmail(true);
                            setResponseDialog(true);
                          }}
                        >
                          <Reply className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedCommunication(communication)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {communication.status !== "closed" && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(communication.id, "closed")}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Close
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  const renderKanbanView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kanbanColumns.map((status) => (
        <Card key={status}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {status === "pending" && <Clock className="h-4 w-4 text-orange-500" />}
              {status === "in_progress" && <Play className="h-4 w-4 text-blue-500" />}
              {status === "resolved" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {status === "closed" && <XCircle className="h-4 w-4 text-gray-500" />}
              {status.replace("_", " ").toUpperCase()}
              <Badge variant="secondary" className="ml-auto">
                {kanbanData[status]?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {kanbanData[status]?.map((communication) => (
                  <Card key={communication.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm line-clamp-2 flex-1">
                          {communication.subject}
                        </h4>
                        <Checkbox
                          checked={selectedCommunications.includes(communication.id)}
                          onCheckedChange={() => handleSelectCommunication(communication.id)}
                          className="ml-2 flex-shrink-0"
                        />
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {communication.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityBadgeVariant(communication.priority)} className="text-xs">
                            {communication.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {communication.communication_type}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCommunication(communication);
                              setSendNotification(true);
                              setSendEmail(true);
                              setResponseDialog(true);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Reply className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {communication.user.name}
                        <span>•</span>
                        {format(new Date(communication.created_at), "MMM dd")}
                      </div>
                    </div>
                  </Card>
                )) || (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No communications</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  useEffect(() => {
    if (user?.role === "admin") {
      loadCommunications();
    }
  }, [user]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + R: Refresh
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        loadCommunications();
      }

      // Ctrl/Cmd + A: Select all (when in list/table view)
      if ((event.ctrlKey || event.metaKey) && event.key === 'a' && (viewMode === 'list' || viewMode === 'table')) {
        event.preventDefault();
        handleSelectAll();
      }

      // Escape: Clear selection
      if (event.key === 'Escape') {
        setSelectedCommunications([]);
      }

      // Number keys: Switch views (1=List, 2=Table, 3=Kanban)
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        if (event.key === '1') {
          setViewMode('list');
        } else if (event.key === '2') {
          setViewMode('table');
        } else if (event.key === '3') {
          setViewMode('kanban');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, loadCommunications, handleSelectAll]);

  // Filter communications based on filters
  const filteredCommunications = useMemo(() => {
    let filtered = communications;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(comm =>
        comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(comm => comm.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(comm => comm.priority === priorityFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(comm => comm.communication_type === typeFilter);
    }

    // Apply date range filter
    if (dateRange !== "all") {
      const now = new Date();
      let dateFilter;

      switch (dateRange) {
        case "today":
          dateFilter = { start: startOfDay(now), end: endOfDay(now) };
          break;
        case "week":
          dateFilter = { start: subDays(now, 7), end: now };
          break;
        case "month":
          dateFilter = { start: subDays(now, 30), end: now };
          break;
        default:
          dateFilter = null;
      }

      if (dateFilter) {
        filtered = filtered.filter(comm => {
          const commDate = new Date(comm.created_at);
          return isWithinInterval(commDate, dateFilter);
        });
      }
    }

    return filtered;
  }, [communications, searchTerm, statusFilter, priorityFilter, typeFilter, dateRange]);

  // Handle response submission
  const handleSubmitResponse = async () => {
    if (!selectedCommunication || !responseText.trim()) return;

    try {
      setSendingResponse(true);
      await communicationService.addResponse(selectedCommunication.id, {
        response: responseText,
        is_resolution: false
      });
      
      toast({
        title: "Success",
        description: "Response sent successfully",
      });
      
      setResponseDialog(false);
      setResponseText("");
      setSendNotification(true);
      setSendEmail(true);
      setSelectedCommunication(null);
      loadCommunications(); // Refresh data
    } catch (err) {
      console.error("Error sending response:", err);
      toast({
        title: "Error",
        description: "Failed to send response",
        variant: "destructive",
      });
    } finally {
      setSendingResponse(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (communicationId: number, newStatus: string) => {
    try {
      await communicationService.updateStatus(communicationId, newStatus);
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
      loadCommunications();
    } catch (err) {
      console.error("Error updating status:", err);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "in_progress": return "default";
      case "resolved": return "default";
      case "closed": return "outline";
      default: return "secondary";
    }
  };

  // Get priority badge variant
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "low": return "outline";
      case "medium": return "default";
      case "high": return "destructive";
      case "urgent": return "destructive";
      default: return "default";
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent": return <AlertTriangle className="h-3 w-3" />;
      case "high": return <AlertCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-3xl font-bold tracking-tight">Communications Management</h1>
          <p className="text-muted-foreground">
          Manage all communications from users including complaints, feedback, suggestions, and inquiries
        </p>
        </div>
        <Button onClick={loadCommunications} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Communications</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">{totalCommunications}</div>
            <p className="text-xs text-muted-foreground">All communications</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">{pendingReview}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Loader2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">{inProgress}</div>
            <p className="text-xs text-muted-foreground">Being processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">{resolved}</div>
            <p className="text-xs text-muted-foreground">Successfully resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading communications...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <div className="space-y-6">
          {/* Control Panel */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">View:</span>
                  <div className="flex rounded-lg border">
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-r-none"
                    >
                      <List className="h-4 w-4 mr-1" />
                      List
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                      className="rounded-none border-x"
                    >
                      <Grid className="h-4 w-4 mr-1" />
                      Table
                    </Button>
                    <Button
                      variant={viewMode === "kanban" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("kanban")}
                      className="rounded-l-none"
                    >
                      <KanbanSquare className="h-4 w-4 mr-1" />
                      Kanban
                    </Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={loadCommunications}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                  {selectedCommunications.length > 0 && (
                    <>
                      <Separator orientation="vertical" className="h-6" />
                      <span className="text-sm text-muted-foreground">
                        {selectedCommunications.length} selected
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="default" size="sm">
                            <Zap className="h-4 w-4 mr-1" />
                            Bulk Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Bulk Status Update</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleBulkStatusUpdate("pending")}>
                            <Clock className="h-4 w-4 mr-2" />
                            Mark as Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkStatusUpdate("in_progress")}>
                            <Play className="h-4 w-4 mr-2" />
                            Mark as In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkStatusUpdate("resolved")}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark as Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkStatusUpdate("closed")}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Close
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters Panel */}
      <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Filters</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+R</kbd>
                  <span>Refresh</span>
                  <span className="mx-2">•</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">1-3</kbd>
                  <span>Switch views</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* Search */}
                <div className="xl:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search communications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
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

                {/* Priority Filter */}
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>

                {/* Type Filter */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="suggestion">Suggestion</SelectItem>
                    <SelectItem value="inquiry">Inquiry</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Range Filter */}
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="month">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
        </CardContent>
      </Card>

          {/* Content Views */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full">
            <TabsContent value="list" className="mt-0">
              {renderListView()}
            </TabsContent>
            <TabsContent value="table" className="mt-0">
              {renderTableView()}
            </TabsContent>
            <TabsContent value="kanban" className="mt-0">
              {renderKanbanView()}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={responseDialog} onOpenChange={setResponseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Response</DialogTitle>
            <DialogDescription>
              Respond to {selectedCommunication?.user.name}'s {selectedCommunication?.communication_type}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCommunication && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">{selectedCommunication.subject}</h4>
                <p className="text-sm text-muted-foreground">{selectedCommunication.message}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Your Response</label>
                <Textarea
                  placeholder="Type your response here..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="mt-2"
                  rows={6}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Notification Options</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send-notification"
                      checked={sendNotification}
                      onCheckedChange={(checked) => setSendNotification(checked as boolean)}
                    />
                    <label
                      htmlFor="send-notification"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Send in-app notification
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send-email"
                      checked={sendEmail}
                      onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                    />
                    <label
                      htmlFor="send-email"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Send email notification
                    </label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Choose how you want to notify the user about this response.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitResponse} 
              disabled={!responseText.trim() || sendingResponse}
            >
              {sendingResponse ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCommunications;
