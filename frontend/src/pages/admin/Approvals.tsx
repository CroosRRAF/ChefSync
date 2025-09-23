import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Download,
  Eye,
  Clock,
  AlertCircle
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { toast } from 'sonner';

interface PendingUser {
  id: number;
  name: string;
  email: string;
  role: string;
  phone_no: string;
  address: string;
  created_at: string;
  approval_status: string;
  documents: Array<{
    id: number;
    file_name: string;
    document_type: string;
    uploaded_at: string;
    file_url: string;
  }>;
}

const Approvals: React.FC = () => {
  const [cookApprovals, setCookApprovals] = useState<PendingUser[]>([]);
  const [deliveryApprovals, setDeliveryApprovals] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const [cookData, deliveryData] = await Promise.all([
        adminService.getPendingApprovals('cook'),
        adminService.getPendingApprovals('delivery_agent')
      ]);
      
      setCookApprovals(cookData.users);
      setDeliveryApprovals(deliveryData.users);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast.error('Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (user: PendingUser, action: 'approve' | 'reject') => {
    setSelectedUser(user);
    setApprovalAction(action);
    setApprovalNotes('');
    setShowApprovalDialog(true);
  };

  const confirmApproval = async () => {
    if (!selectedUser || !approvalAction) return;

    try {
      setProcessing(selectedUser.id);
      await adminService.approveUser(selectedUser.id, approvalAction, approvalNotes);
      
      toast.success(`User ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully`);
      
      // Refresh the approvals list
      await fetchApprovals();
      
      setShowApprovalDialog(false);
      setSelectedUser(null);
      setApprovalAction(null);
      setApprovalNotes('');
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error(`Failed to ${approvalAction} user`);
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'cook': return 'bg-orange-100 text-orange-800';
      case 'delivery_agent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const UserCard: React.FC<{ user: PendingUser }> = ({ user }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{user.name}</h3>
              <Badge className={getRoleBadgeColor(user.role)}>
                {user.role.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApproval(user, 'approve')}
              disabled={processing === user.id}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApproval(user, 'reject')}
              disabled={processing === user.id}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{user.phone_no || 'Not provided'}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 md:col-span-2">
            <MapPin className="w-4 h-4" />
            <span>{user.address || 'Not provided'}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Applied: {formatDate(user.created_at)}</span>
          </div>
        </div>

        {user.documents.length > 0 && (
          <div>
            <Separator className="my-4" />
            <h4 className="font-medium mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Documents ({user.documents.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {user.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">{doc.document_type}</p>
                      <p className="text-xs text-gray-500">{doc.file_name}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(doc.file_url, '_blank')}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = doc.file_url;
                        link.download = doc.file_name;
                        link.click();
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Approvals</h1>
          <p className="text-gray-600 mt-1">Review and approve cook and delivery agent applications</p>
        </div>
        <Button onClick={fetchApprovals} variant="outline">
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="cooks" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cooks" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Cooks ({cookApprovals.length})</span>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Delivery Agents ({deliveryApprovals.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cooks" className="space-y-4">
          {cookApprovals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Cook Approvals</h3>
                <p className="text-gray-600">All cook applications have been reviewed.</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              {cookApprovals.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          {deliveryApprovals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Delivery Agent Approvals</h3>
                <p className="text-gray-600">All delivery agent applications have been reviewed.</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              {deliveryApprovals.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {approvalAction === 'approve' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span>
                {approvalAction === 'approve' ? 'Approve' : 'Reject'} User
              </span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">{selectedUser.name}</h3>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                <Badge className={getRoleBadgeColor(selectedUser.role)}>
                  {selectedUser.role.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">
                  {approvalAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={
                    approvalAction === 'approve' 
                      ? 'Add any notes for the approved user...'
                      : 'Please provide a reason for rejection...'
                  }
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="min-h-[100px]"
                />
                {approvalAction === 'reject' && !approvalNotes.trim() && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Rejection reason is required
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowApprovalDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmApproval}
                  disabled={processing === selectedUser.id || (approvalAction === 'reject' && !approvalNotes.trim())}
                  className={
                    approvalAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }
                >
                  {processing === selectedUser.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    `${approvalAction === 'approve' ? 'Approve' : 'Reject'} User`
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Approvals;
