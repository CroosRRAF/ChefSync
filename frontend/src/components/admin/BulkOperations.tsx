import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  Trash2,
  Edit,
  Mail,
  UserCheck,
  UserX,
  Settings,
  FileText,
  Database
} from 'lucide-react';

interface BulkOperation {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'secondary';
  requiresConfirmation: boolean;
  requiresInput?: boolean;
  inputType?: 'text' | 'select' | 'textarea';
  inputOptions?: Array<{ value: string; label: string }>;
  inputPlaceholder?: string;
  inputLabel?: string;
}

interface BulkOperationsProps {
  selectedItems: any[];
  onExecute: (operation: string, items: any[], input?: string) => Promise<void>;
  itemType: string;
  className?: string;
}

const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedItems,
  onExecute,
  itemType,
  className = ''
}) => {
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [operationInput, setOperationInput] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const operations: BulkOperation[] = [
    {
      id: 'activate',
      label: 'Activate',
      description: `Activate selected ${itemType}s`,
      icon: <UserCheck className="h-4 w-4" />,
      variant: 'default',
      requiresConfirmation: true
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      description: `Deactivate selected ${itemType}s`,
      icon: <UserX className="h-4 w-4" />,
      variant: 'secondary',
      requiresConfirmation: true
    },
    {
      id: 'delete',
      label: 'Delete',
      description: `Permanently delete selected ${itemType}s`,
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      requiresConfirmation: true
    },
    {
      id: 'export',
      label: 'Export',
      description: `Export selected ${itemType}s to CSV`,
      icon: <Download className="h-4 w-4" />,
      variant: 'default',
      requiresConfirmation: false
    },
    {
      id: 'send_email',
      label: 'Send Email',
      description: `Send email to selected ${itemType}s`,
      icon: <Mail className="h-4 w-4" />,
      variant: 'default',
      requiresConfirmation: true,
      requiresInput: true,
      inputType: 'textarea',
      inputLabel: 'Email Message',
      inputPlaceholder: 'Enter your email message here...'
    },
    {
      id: 'update_status',
      label: 'Update Status',
      description: `Update status of selected ${itemType}s`,
      icon: <Settings className="h-4 w-4" />,
      variant: 'default',
      requiresConfirmation: true,
      requiresInput: true,
      inputType: 'select',
      inputLabel: 'New Status',
      inputOptions: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
        { value: 'suspended', label: 'Suspended' }
      ]
    },
    {
      id: 'bulk_edit',
      label: 'Bulk Edit',
      description: `Edit multiple ${itemType}s at once`,
      icon: <Edit className="h-4 w-4" />,
      variant: 'default',
      requiresConfirmation: true,
      requiresInput: true,
      inputType: 'text',
      inputLabel: 'Field to Update',
      inputPlaceholder: 'Enter field name (e.g., role, status)'
    }
  ];

  const selectedOperationData = operations.find(op => op.id === selectedOperation);

  const handleExecute = async () => {
    if (!selectedOperationData) return;

    try {
      setIsExecuting(true);
      await onExecute(selectedOperation, selectedItems, operationInput);
      setIsDialogOpen(false);
      setSelectedOperation('');
      setOperationInput('');
      setConfirmText('');
    } catch (error) {
      console.error('Bulk operation failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleOperationSelect = (operationId: string) => {
    setSelectedOperation(operationId);
    setOperationInput('');
    setConfirmText('');
    setIsDialogOpen(true);
  };

  const getConfirmationText = () => {
    if (!selectedOperationData) return '';
    
    const count = selectedItems.length;
    const itemText = count === 1 ? itemType : `${itemType}s`;
    
    switch (selectedOperationData.id) {
      case 'delete':
        return `Are you sure you want to permanently delete ${count} ${itemText}? This action cannot be undone.`;
      case 'activate':
        return `Are you sure you want to activate ${count} ${itemText}?`;
      case 'deactivate':
        return `Are you sure you want to deactivate ${count} ${itemText}?`;
      case 'send_email':
        return `Are you sure you want to send an email to ${count} ${itemText}?`;
      case 'update_status':
        return `Are you sure you want to update the status of ${count} ${itemText}?`;
      case 'bulk_edit':
        return `Are you sure you want to edit ${count} ${itemText}?`;
      default:
        return `Are you sure you want to perform this action on ${count} ${itemText}?`;
    }
  };

  const isConfirmationValid = () => {
    if (!selectedOperationData?.requiresConfirmation) return true;
    
    const expectedText = selectedItems.length.toString();
    return confirmText === expectedText;
  };

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Bulk Operations</CardTitle>
          <Badge variant="secondary">
            {selectedItems.length} selected
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {operations.map((operation) => (
            <Button
              key={operation.id}
              variant={operation.variant}
              size="sm"
              onClick={() => handleOperationSelect(operation.id)}
              className="h-auto p-3 flex flex-col items-center space-y-2"
            >
              {operation.icon}
              <span className="text-xs">{operation.label}</span>
            </Button>
          ))}
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {selectedOperationData?.icon}
                <span>{selectedOperationData?.label}</span>
              </DialogTitle>
              <DialogDescription>
                {selectedOperationData?.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Operation Input */}
              {selectedOperationData?.requiresInput && (
                <div className="space-y-2">
                  <Label htmlFor="operation-input">
                    {selectedOperationData.inputLabel}
                  </Label>
                  {selectedOperationData.inputType === 'select' ? (
                    <Select value={operationInput} onValueChange={setOperationInput}>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedOperationData.inputPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedOperationData.inputOptions?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : selectedOperationData.inputType === 'textarea' ? (
                    <Textarea
                      id="operation-input"
                      placeholder={selectedOperationData.inputPlaceholder}
                      value={operationInput}
                      onChange={(e) => setOperationInput(e.target.value)}
                      rows={4}
                    />
                  ) : (
                    <Input
                      id="operation-input"
                      placeholder={selectedOperationData.inputPlaceholder}
                      value={operationInput}
                      onChange={(e) => setOperationInput(e.target.value)}
                    />
                  )}
                </div>
              )}

              {/* Confirmation */}
              {selectedOperationData?.requiresConfirmation && (
                <div className="space-y-2">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          Confirmation Required
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                          {getConfirmationText()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-text">
                      Type <strong>{selectedItems.length}</strong> to confirm:
                    </Label>
                    <Input
                      id="confirm-text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={selectedItems.length.toString()}
                    />
                  </div>
                </div>
              )}

              {/* Selected Items Preview */}
              <div className="space-y-2">
                <Label>Selected Items ({selectedItems.length})</Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {selectedItems.slice(0, 5).map((item, index) => (
                    <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                      • {item.name || item.email || item.id || `Item ${index + 1}`}
                    </div>
                  ))}
                  {selectedItems.length > 5 && (
                    <div className="text-sm text-gray-500">
                      ... and {selectedItems.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isExecuting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecute}
                disabled={isExecuting || !isConfirmationValid()}
                variant={selectedOperationData?.variant}
              >
                {isExecuting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Executing...
                  </>
                ) : (
                  <>
                    {selectedOperationData?.icon}
                    <span className="ml-2">Execute</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BulkOperations;
