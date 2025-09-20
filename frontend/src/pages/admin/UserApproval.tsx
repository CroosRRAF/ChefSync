import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Download,
  Eye,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: number;
  document_type: {
    name: string;
    description: string;
  };
  file_name: string;
  file_size: number;
  file_type: string;
  status: string;
  status_display: string;
  uploaded_at: string;
}

interface User {
  user_id: number;
  name: string;
  email: string;
  role: string;
  approval_status: string;
  approval_status_display: string;
  approval_notes: string;
  approved_by_name: string;
  approved_at: string;
  created_at: string;
  documents: Document[];
}

const UserApproval: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const token = localStorage.getItem('chefsync_token');
      
      const response = await fetch(`${apiUrl}/api/auth/admin/pending-approvals/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data);
      } else {
        throw new Error('Failed to fetch pending users');
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        title: "Error",
        description: "Failed to load pending approvals",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = async (user: User) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const token = localStorage.getItem('chefsync_token');
      
      const response = await fetch(`${apiUrl}/api/auth/admin/user/${user.user_id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setSelectedUser(userData);
      } else {
        throw new Error('Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({
        title: "Error",
        description: "Failed to load user details",
        variant: "destructive",
      });
    }
  };

  const handleApproval = async (action: 'approve' | 'reject') => {
    if (!selectedUser) return;

    if (action === 'reject' && !approvalNotes.trim()) {
      toast({
        title: "Notes Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setIsApproving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const token = localStorage.getItem('chefsync_token');
      
      const response = await fetch(`${apiUrl}/api/auth/admin/user/${selectedUser.user_id}/approve/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          notes: approvalNotes.trim()
        }),
      });

      if (response.ok) {
        toast({
          title: action === 'approve' ? "User Approved" : "User Rejected",
          description: `User has been ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        });
        
        // Remove user from pending list
        setPendingUsers(prev => prev.filter(user => user.user_id !== selectedUser.user_id));
        setSelectedUser(null);
        setShowApprovalModal(false);
        setApprovalNotes('');
        setApprovalAction(null);
      } else {
        throw new Error(`Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${approvalAction}ing user:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} user`,
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const openApprovalModal = (action: 'approve' | 'reject') => {
    setApprovalAction(action);
    setApprovalNotes('');
    setShowApprovalModal(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve cook and delivery agent applications
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {pendingUsers.length} pending
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Pending Approvals</span>
            </CardTitle>
            <CardDescription>
              Users waiting for approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedUser?.user_id === user.user_id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{user.role}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {user.documents.length} documents
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>User Details</span>
            </CardTitle>
            <CardDescription>
              Review user information and documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedUser ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a user to view details</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* User Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Role:</span>
                      <p className="font-medium capitalize">{selectedUser.role}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Applied:</span>
                      <p className="font-medium">
                        {new Date(selectedUser.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="mt-1">{getStatusBadge(selectedUser.approval_status)}</div>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Documents</h4>
                  {selectedUser.documents.length === 0 ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No documents uploaded
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      {selectedUser.documents.map((doc) => (
                        <div key={doc.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{doc.document_type.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {doc.file_name} • {formatFileSize(doc.file_size)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.document_type.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getDocumentStatusBadge(doc.status)}
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Approval Actions */}
                <div className="flex space-x-3">
                  <Button
                    onClick={() => openApprovalModal('approve')}
                    className="flex-1"
                    disabled={isApproving}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => openApprovalModal('reject')}
                    variant="destructive"
                    className="flex-1"
                    disabled={isApproving}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {approvalAction === 'approve' ? 'Approve User' : 'Reject User'}
              </CardTitle>
              <CardDescription>
                {approvalAction === 'approve' 
                  ? 'This user will be approved and can start using the platform'
                  : 'This user will be rejected and cannot access the platform'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  {approvalAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
                </label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder={
                    approvalAction === 'approve' 
                      ? 'Add any notes about this approval...'
                      : 'Please provide a reason for rejection...'
                  }
                  className="mt-1"
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalAction(null);
                    setApprovalNotes('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleApproval(approvalAction!)}
                  variant={approvalAction === 'approve' ? 'default' : 'destructive'}
                  className="flex-1"
                  disabled={isApproving}
                >
                  {isApproving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    approvalAction === 'approve' ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )
                  )}
                  {approvalAction === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UserApproval;