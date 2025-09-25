import EmailTemplates from "@/components/admin/EmailTemplates";
import { AdvancedDataTable } from "@/components/admin/AdvancedDataTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import React from "react";

const AdminComplaints: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { stats, loading: statsLoading, error: statsError } = useCommunicationStats();

  // State management
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);
  const [activeTab, setActiveTab] = useState("complaints");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Response dialog state
  const [responseDialog, setResponseDialog] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);

  // Calculate derived stats
  const totalComplaints = stats?.by_type.find((type) => type.communication_type === "complaint")?.count || 0;
  const pendingReview = stats?.by_status.find((status) => status.status === "pending")?.count || 0;
  const resolved = stats?.by_status.find((status) => status.status === "resolved")?.count || 0;
  const positiveFeedback = stats?.by_type.find((type) => type.communication_type === "feedback")?.count || 0;

  // Load communications
  const loadCommunications = async () => {
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
  };

  useEffect(() => {
    if (user?.role === "admin") {
      loadCommunications();
    }
  }, [user]);

  // Filter communications based on current tab and filters
  const filteredCommunications = useMemo(() => {
    let filtered = communications;

    // Filter by tab
    if (activeTab === "complaints") {
      filtered = filtered.filter(comm => comm.communication_type === "complaint");
    } else if (activeTab === "feedback") {
      filtered = filtered.filter(comm => comm.communication_type === "feedback");
    }

    // Apply other filters
    if (searchTerm) {
      filtered = filtered.filter(comm => 
        comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(comm => comm.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(comm => comm.priority === priorityFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(comm => comm.communication_type === typeFilter);
    }

    return filtered;
  }, [communications, activeTab, searchTerm, statusFilter, priorityFilter, typeFilter]);

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
          <h1 className="text-3xl font-bold tracking-tight">Complaints & Feedback</h1>
          <p className="text-muted-foreground">
          Manage all complaints and feedback from users
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
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">{totalComplaints}</div>
            <p className="text-xs text-muted-foreground">All time complaints</p>
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
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">{resolved}</div>
            <p className="text-xs text-muted-foreground">Successfully resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">{positiveFeedback}</div>
            <p className="text-xs text-muted-foreground">User feedback</p>
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
      <Card>
        <CardHeader>
          <CardTitle>Complaints & Feedback Management</CardTitle>
          <CardDescription>
              Manage all complaints and feedback from users. View, respond, and resolve issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="complaints">Complaints</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="all">All Communications</TabsTrigger>
            </TabsList>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 mt-6 mb-4">
                <div className="flex-1 min-w-[200px]">
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
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
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[150px]">
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
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="suggestion">Suggestion</SelectItem>
                    <SelectItem value="inquiry">Inquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Communications List */}
              <div className="space-y-4">
                {filteredCommunications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Communications Found</h3>
                      <p className="text-muted-foreground">
                        {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || typeFilter !== "all"
                          ? "Try adjusting your filters to see more results."
                          : "No communications have been submitted yet."}
                  </p>
                </CardContent>
              </Card>
                ) : (
                  filteredCommunications.map((communication) => (
                    <Card key={communication.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
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

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setSelectedCommunication(communication)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCommunication(communication);
                                  setResponseDialog(true);
                                }}
                              >
                                <Reply className="h-4 w-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {communication.status === "pending" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(communication.id, "in_progress")}
                                >
                                  <Clock className="h-4 w-4 mr-2" />
                                  Mark In Progress
                                </DropdownMenuItem>
                              )}
                              {communication.status === "in_progress" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(communication.id, "resolved")}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Mark Resolved
                                </DropdownMenuItem>
                              )}
                              {communication.status !== "closed" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(communication.id, "closed")}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Close
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                </CardContent>
              </Card>
                  ))
                )}
              </div>
          </Tabs>
        </CardContent>
      </Card>
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

export default AdminComplaints;
