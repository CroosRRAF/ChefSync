import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChefHat, 
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

interface Cook {
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

const CookApprovals: React.FC = () => {
  const [pendingCooks, setPendingCooks] = useState<Cook[]>([]);
  const [selectedCook, setSelectedCook] = useState<Cook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingCooks();
  }, []);

  const fetchPendingCooks = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const token = localStorage.getItem('chefsync_token');
      
      const response = await fetch(`${apiUrl}/api/auth/admin/pending-approvals/?role=cook`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingCooks(data);
      } else {
        throw new Error('Failed to fetch pending cooks');
      }
    } catch (error) {
      console.error('Error fetching pending cooks:', error);
      toast({
        title: "Error",
        description: "Failed to load pending cook applications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCookSelect = async (cook: Cook) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const token = localStorage.getItem('chefsync_token');
      
      console.log('Fetching cook details for:', cook.user_id);
      console.log('API URL:', `${apiUrl}/api/auth/admin/user/${cook.user_id}/`);
      
      const response = await fetch(`${apiUrl}/api/auth/admin/user/${cook.user_id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const cookData = await response.json();
        console.log('Cook data received:', cookData);
        console.log('Documents count:', cookData.documents ? cookData.documents.length : 0);
        
        if (cookData.documents) {
          cookData.documents.forEach((doc: any, index: number) => {
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
          console.log('No documents found in cook data');
        }
        
        setSelectedCook(cookData);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch cook details:', response.status, errorText);
        throw new Error(`Failed to fetch cook details: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching cook details:', error);
      toast({
        title: "Error",
        description: "Failed to load cook details",
        variant: "destructive",
      });
    }
  };

  const handleApproval = async (action: 'approve' | 'reject') => {
    if (!selectedCook) return;

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
      
      const response = await fetch(`${apiUrl}/api/auth/admin/user/${selectedCook.user_id}/approve/`, {
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
          title: action === 'approve' ? "Cook Approved" : "Cook Rejected",
          description: `Cook has been ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        });
        
        // Remove cook from pending list
        setPendingCooks(prev => prev.filter(cook => cook.user_id !== selectedCook.user_id));
        setSelectedCook(null);
        setShowApprovalModal(false);
        setApprovalNotes('');
        setApprovalAction(null);
      } else {
        throw new Error(`Failed to ${action} cook`);
      }
    } catch (error) {
      console.error(`Error ${approvalAction}ing cook:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} cook`,
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
      const token = localStorage.getItem('chefsync_token');
      
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
        throw new Error(errorData.error || `Proxy request failed: ${proxyResponse.status} ${proxyResponse.statusText}`);
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
      const token = localStorage.getItem('chefsync_token');
      
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
        throw new Error(errorData.error || `Proxy request failed: ${proxyResponse.status} ${proxyResponse.statusText}`);
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
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <ChefHat className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Cook Approvals</h1>
                <p className="text-sm text-muted-foreground">Review and approve cook applications</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ChefHat className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {pendingCooks.length} pending
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Cooks List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Pending Cook Applications</span>
              </CardTitle>
              <CardDescription>
                Cooks waiting for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingCooks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending cook applications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCooks.map((cook) => (
                    <div
                      key={cook.user_id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedCook?.user_id === cook.user_id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleCookSelect(cook)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{cook.name}</h3>
                          <p className="text-sm text-muted-foreground">{cook.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">Cook</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(cook.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {cook.documents.length} documents
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cook Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Cook Details</span>
              </CardTitle>
              <CardDescription>
                Review cook information and documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedCook ? (
                <div className="text-center py-8">
                  <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a cook to view details</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Cook Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">{selectedCook.name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium">{selectedCook.email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Role:</span>
                        <p className="font-medium capitalize">{selectedCook.role}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Applied:</span>
                        <p className="font-medium">
                          {new Date(selectedCook.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="mt-1">{getStatusBadge(selectedCook.approval_status)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Cook Documents</h4>
                    {selectedCook.documents.length === 0 ? (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          No documents uploaded
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-2">
                        {selectedCook.documents.map((doc, index) => {
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
                      Approve Cook
                    </Button>
                    <Button
                      onClick={() => openApprovalModal('reject')}
                      variant="destructive"
                      className="flex-1"
                      disabled={isApproving}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Cook
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
                {approvalAction === 'approve' ? 'Approve Cook' : 'Reject Cook'}
              </CardTitle>
              <CardDescription>
                {approvalAction === 'approve' 
                  ? 'This cook will be approved and can start using the platform'
                  : 'This cook will be rejected and cannot access the platform'
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

export default CookApprovals;
