import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Download,
  Eye,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: number;
  document_type: {
    name: string;
    description: string;
  };
  file: string; // Cloudinary URL
  file_name: string;
  file_size: number;
  file_type: string;
  status: string;
  status_display: string;
  uploaded_at: string;
}

interface DeliveryAgent {
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

const DeliveryAgentApprovals: React.FC = () => {
  const [pendingAgents, setPendingAgents] = useState<DeliveryAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<DeliveryAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingAgents();
  }, []);

  const fetchPendingAgents = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${apiUrl}/api/auth/admin/pending-approvals/?role=delivery_agent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingAgents(data);
      } else {
        throw new Error('Failed to fetch pending delivery agents');
      }
    } catch (error) {
      console.error('Error fetching pending delivery agents:', error);
      toast({
        title: "Error",
        description: "Failed to load pending delivery agent applications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentSelect = async (agent: DeliveryAgent) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const token = localStorage.getItem('access_token');
      
      console.log('Fetching agent details for:', agent.user_id);
      console.log('API URL:', `${apiUrl}/api/auth/admin/user/${agent.user_id}/`);
      
      const response = await fetch(`${apiUrl}/api/auth/admin/user/${agent.user_id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const agentData = await response.json();
        console.log('Agent data received:', agentData);
        console.log('Documents count:', agentData.documents ? agentData.documents.length : 0);
        
        if (agentData.documents) {
          agentData.documents.forEach((doc: any, index: number) => {
            console.log(`Document ${index + 1}:`, {
              id: doc.id,
              name: doc.file_name,
              url: doc.file,
              type: doc.file_type,
              size: doc.file_size,
              status: doc.status,
              document_type: doc.document_type,
              is_image: doc.file_type && doc.file_type.startsWith('image/'),
              is_pdf: doc.file_type === 'application/pdf',
              is_document: doc.file_type && !doc.file_type.startsWith('image/')
            });
          });
        } else {
          console.log('No documents found in agent data');
        }
        
        setSelectedAgent(agentData);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch agent details:', response.status, errorText);
        throw new Error(`Failed to fetch delivery agent details: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching delivery agent details:', error);
      toast({
        title: "Error",
        description: "Failed to load delivery agent details",
        variant: "destructive",
      });
    }
  };

  const handleApproval = async (action: 'approve' | 'reject') => {
    if (!selectedAgent) return;

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
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${apiUrl}/api/auth/admin/user/${selectedAgent.user_id}/approve/`, {
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
          title: action === 'approve' ? "Delivery Agent Approved" : "Delivery Agent Rejected",
          description: `Delivery agent has been ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        });
        
        // Remove agent from pending list
        setPendingAgents(prev => prev.filter(agent => agent.user_id !== selectedAgent.user_id));
        setSelectedAgent(null);
        setShowApprovalModal(false);
        setApprovalNotes('');
        setApprovalAction(null);
      } else {
        throw new Error(`Failed to ${action} delivery agent`);
      }
    } catch (error) {
      console.error(`Error ${approvalAction}ing delivery agent:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} delivery agent`,
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

  const handleDownload = async (doc: Document) => {
    console.log('🔽 DOWNLOAD ATTEMPT - Using Backend Proxy');
    console.log('📄 Document:', doc);
    console.log('🔗 Document file URL:', doc.file);
    console.log('🆔 Document ID:', doc.id);
    
    if (!doc.file) {
      console.error('No file URL available for document:', doc);
      toast({
        title: "Download Error",
        description: "File URL not available",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Starting download for:', doc.file);
      
      // Use backend proxy for all downloads to handle Cloudinary authentication
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to download documents",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Using backend proxy for download');
      const proxyResponse = await fetch(`${apiUrl}/api/auth/documents/proxy-download/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: doc.id,
          file_url: doc.file
        }),
      });
      
      if (proxyResponse.ok) {
        const blob = await proxyResponse.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.file_name;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
        
        console.log('Download completed successfully via proxy');
        toast({
          title: "Download Started",
          description: `Downloading ${doc.file_name}`,
        });
        return;
      } else {
        const errorText = await proxyResponse.text().catch(() => '');
        let errorData = {};
        try {
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch {
          errorData = { error: errorText };
        }
        console.error('Proxy request failed:', {
          status: proxyResponse.status,
          statusText: proxyResponse.statusText,
          errorData,
          url: `${apiUrl}/api/auth/documents/proxy-download/`,
          requestBody: { document_id: doc.id, file_url: doc.file }
        });
        throw new Error((errorData as any)?.error || `Proxy request failed: ${proxyResponse.status} ${proxyResponse.statusText}`);
      }
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: `Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handlePreview = async (doc: Document) => {
    console.log('👁️ PREVIEW ATTEMPT - Using Backend Proxy');
    console.log('📄 Document:', doc);
    console.log('🔗 Document file URL:', doc.file);
    console.log('🆔 Document ID:', doc.id);
    
    if (!doc.file) {
      toast({
        title: "Preview Error",
        description: "File URL not available",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🚀 Starting preview for:', doc.file);
      
      // Use backend proxy for all previews to handle Cloudinary authentication
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to preview documents",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Using backend proxy for preview');
      const proxyResponse = await fetch(`${apiUrl}/api/auth/documents/proxy-download/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: doc.id,
          file_url: doc.file,
          preview: true
        }),
      });
      
      if (proxyResponse.ok) {
        const blob = await proxyResponse.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Open the blob URL in new tab
        const newWindow = window.open(url, '_blank');
        
        if (newWindow) {
          // Clean up after a delay
          setTimeout(() => window.URL.revokeObjectURL(url), 30000);
          
          console.log('Preview opened successfully via proxy');
          toast({
            title: "Preview Opened",
            description: `Opening ${doc.file_name} in new tab`,
          });
          return;
        } else {
          throw new Error('Failed to open preview window');
        }
      } else {
        const errorText = await proxyResponse.text().catch(() => '');
        let errorData = {};
        try {
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch {
          errorData = { error: errorText };
        }
        console.error('Preview proxy request failed:', {
          status: proxyResponse.status,
          statusText: proxyResponse.statusText,
          errorData,
          url: `${apiUrl}/api/auth/documents/proxy-download/`,
          requestBody: { document_id: doc.id, file_url: doc.file, preview: true }
        });
        throw new Error((errorData as any)?.error || `Proxy request failed: ${proxyResponse.status} ${proxyResponse.statusText}`);
      }
      
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Preview Error",
        description: `Failed to preview file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/admin">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Delivery Agent Approvals</h1>
                <p className="text-sm text-muted-foreground">Review and approve delivery agent applications</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {pendingAgents.length} pending
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Delivery Agents List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Pending Delivery Agent Applications</span>
              </CardTitle>
              <CardDescription>
                Delivery agents waiting for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingAgents.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending delivery agent applications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingAgents.map((agent) => (
                    <div
                      key={agent.user_id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAgent?.user_id === agent.user_id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleAgentSelect(agent)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{agent.name}</h3>
                          <p className="text-sm text-muted-foreground">{agent.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">Delivery Agent</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(agent.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {agent.documents.length} documents
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Agent Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Delivery Agent Details</span>
              </CardTitle>
              <CardDescription>
                Review delivery agent information and documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedAgent ? (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a delivery agent to view details</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Agent Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">{selectedAgent.name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium">{selectedAgent.email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Role:</span>
                        <p className="font-medium capitalize">{selectedAgent.role}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Applied:</span>
                        <p className="font-medium">
                          {new Date(selectedAgent.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="mt-1">{getStatusBadge(selectedAgent.approval_status)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Delivery Agent Documents</h4>
                    {selectedAgent.documents.length === 0 ? (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          No documents uploaded
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-2">
                        {selectedAgent.documents.map((doc, index) => {
                          console.log(`Rendering document ${index + 1}:`, {
                            id: doc.id,
                            name: doc.file_name,
                            type: doc.file_type,
                            is_image: doc.file_type && doc.file_type.startsWith('image/'),
                            is_pdf: doc.file_type === 'application/pdf'
                          });
                          return (
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
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handlePreview(doc)}
                                  title={`Preview ${doc.file_name}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDownload(doc)}
                                  title={`Download ${doc.file_name}`}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          );
                        })}
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
                      Approve Agent
                    </Button>
                    <Button
                      onClick={() => openApprovalModal('reject')}
                      variant="destructive"
                      className="flex-1"
                      disabled={isApproving}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Agent
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {approvalAction === 'approve' ? 'Approve Delivery Agent' : 'Reject Delivery Agent'}
              </CardTitle>
              <CardDescription>
                {approvalAction === 'approve' 
                  ? 'This delivery agent will be approved and can start using the platform'
                  : 'This delivery agent will be rejected and cannot access the platform'
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

export default DeliveryAgentApprovals;
