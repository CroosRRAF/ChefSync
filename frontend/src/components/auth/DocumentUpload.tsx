import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Download,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentType {
  id: number;
  name: string;
  description: string;
  is_required: boolean;
  allowed_file_types: string | string[]; // Can be either string (comma-separated) or array
  max_file_size_mb: number;
}

interface UploadedFile {
  id: string;
  file: File;
  documentType: DocumentType;
  status: 'uploading' | 'success' | 'error' | 'pending';
  progress: number;
  error?: string;
  preview?: string;
  documentId?: number;
}

interface DocumentUploadProps {
  role: 'cook' | 'delivery_agent';
  onDocumentsComplete: (documents: UploadedFile[]) => void;
  onBack: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  role, 
  onDocumentsComplete, 
  onBack 
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDocumentTypes, setUploadedDocumentTypes] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  // Fetch document types from API
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${apiUrl}/api/auth/documents/types/?role=${role}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setDocumentTypes(data);
        } else {
          console.error('Failed to fetch document types');
          toast({
            title: "Error",
            description: "Failed to load document types. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching document types:', error);
        toast({
          title: "Error",
          description: "Failed to load document types. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTypes(false);
      }
    };

    fetchDocumentTypes();
  }, [role, toast]);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-5 h-5" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to normalize allowed_file_types to array
  const getAllowedFileTypes = (documentType: DocumentType): string[] => {
    if (Array.isArray(documentType.allowed_file_types)) {
      return documentType.allowed_file_types;
    } else if (typeof documentType.allowed_file_types === 'string') {
      return documentType.allowed_file_types.split(',').map(type => type.trim());
    }
    return [];
  };

  const validateFile = (file: File, documentType: DocumentType): string | null => {
    // Check if file is empty
    if (!file || file.size === 0) {
      return "File cannot be empty";
    }

    // Check file name
    if (!file.name || file.name.trim().length === 0) {
      return "File name cannot be empty";
    }

    // Check file extension
    const fileParts = file.name.split('.');
    if (fileParts.length < 2) {
      return "File must have a valid extension";
    }

    // Check file size
    const maxSizeBytes = documentType.max_file_size_mb * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const fileSizeMB = Math.round((file.size / (1024 * 1024)) * 100) / 100;
      return `File size (${fileSizeMB}MB) exceeds maximum allowed size (${documentType.max_file_size_mb}MB). Please choose a smaller file.`;
    }

    // Check file type
    const fileExtension = fileParts[fileParts.length - 1].toLowerCase();
    const allowedTypes = getAllowedFileTypes(documentType).map(type => type.toLowerCase());
    if (!allowedTypes.includes(fileExtension)) {
      const allowedTypesDisplay = allowedTypes.map(t => `.${t}`).join(', ');
      return `File type '.${fileExtension}' is not allowed. Please upload a file with one of these formats: ${allowedTypesDisplay}`;
    }

    return null;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!selectedDocumentType) {
      toast({
        title: "Select Document Type",
        description: "Please select a document type before uploading files.",
        variant: "destructive",
      });
      return;
    }

    const newFiles: UploadedFile[] = acceptedFiles.map(file => {
      const error = validateFile(file, selectedDocumentType);
      const id = Math.random().toString(36).substr(2, 9);
      
      return {
        id,
        file,
        documentType: selectedDocumentType,
        status: error ? 'error' : 'pending',
        progress: 0,
        error,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      };
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Auto-upload valid files
    newFiles.forEach(uploadedFile => {
      if (uploadedFile.status === 'pending') {
        uploadFile(uploadedFile);
      }
    });
  }, [selectedDocumentType, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: selectedDocumentType ? (() => {
      const allowedTypes = getAllowedFileTypes(selectedDocumentType);
      const acceptObject: Record<string, string[]> = {};
      
      allowedTypes.forEach(type => {
        if (type === 'pdf') {
          acceptObject['application/pdf'] = ['.pdf'];
        } else if (['jpg', 'jpeg', 'png'].includes(type)) {
          const mimeType = `image/${type === 'jpg' ? 'jpeg' : type}`;
          if (!acceptObject[mimeType]) {
            acceptObject[mimeType] = [];
          }
          acceptObject[mimeType].push(`.${type}`);
        }
      });
      
      return acceptObject;
    })() : undefined,
    multiple: true,
    disabled: !selectedDocumentType
  });

  const uploadFile = async (uploadedFile: UploadedFile) => {
    setIsUploading(true);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id 
          ? { ...file, progress: Math.min(file.progress + 10, 90) }
          : file
      ));
    }, 200);

    try {
      // Get user email from localStorage or props
      const userEmail = localStorage.getItem('registration_email') || '';
      
      if (!userEmail) {
        console.error('No registration email found in localStorage');
        console.log('Available localStorage keys:', Object.keys(localStorage));
        throw new Error('User email not found. Please restart the registration process.');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file_upload', uploadedFile.file);
      formData.append('document_type_id', uploadedFile.documentType.id.toString());
      formData.append('user_email', userEmail);
      
      // Upload to backend
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      
      // Debug logging
      console.log('Uploading file:', {
        fileName: uploadedFile.file.name,
        fileSize: uploadedFile.file.size,
        fileType: uploadedFile.file.type,
        documentTypeId: uploadedFile.documentType.id,
        userEmail: userEmail,
        apiUrl: `${apiUrl}/api/auth/documents/upload-registration/`
      });
      const response = await fetch(`${apiUrl}/api/auth/documents/upload-registration/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          throw new Error(`Upload failed with status ${response.status}: ${response.statusText}`);
        }
        
        // Use the detailed error message from backend if available
        const errorMessage = errorData.message || errorData.error || `Upload failed with status ${response.status}`;
        console.error('Upload error details:', errorData);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      clearInterval(progressInterval);
      
      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id 
          ? { ...file, status: 'success', progress: 100, documentId: result.document.id }
          : file
      ));

      // Add document type to uploaded set
      setUploadedDocumentTypes(prev => new Set([...prev, uploadedFile.documentType.id]));

      toast({
        title: "File Uploaded",
        description: `${uploadedFile.file.name} has been uploaded successfully.`,
      });
    } catch (error: any) {
      clearInterval(progressInterval);
      
      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id 
          ? { ...file, status: 'error', error: error.message || 'Upload failed' }
          : file
      ));

      toast({
        title: "Upload Failed",
        description: `Failed to upload ${uploadedFile.file.name}: ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      
      // Remove document type from uploaded set if no more files of this type
      const remainingFiles = prev.filter(f => f.id !== fileId);
      const documentTypeIds = new Set(remainingFiles.map(f => f.documentType.id));
      setUploadedDocumentTypes(documentTypeIds);
      
      return remainingFiles;
    });
  };

  const retryUpload = (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'pending', progress: 0, error: undefined }
          : f
      ));
      uploadFile({ ...file, status: 'pending', progress: 0 });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800';
      case 'uploading':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800';
    }
  };

  const requiredDocuments = documentTypes.filter(doc => doc.is_required);
  const optionalDocuments = documentTypes.filter(doc => !doc.is_required);
  const uploadedRequiredDocs = uploadedFiles.filter(file => 
    file.documentType.is_required && file.status === 'success'
  );
  const allRequiredUploaded = requiredDocuments.every(doc => 
    uploadedFiles.some(file => file.documentType.id === doc.id && file.status === 'success')
  );

  const handleContinue = () => {
    if (!allRequiredUploaded) {
      toast({
        title: "Missing Required Documents",
        description: "Please upload all required documents before continuing.",
        variant: "destructive",
      });
      return;
    }
    onDocumentsComplete(uploadedFiles);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Upload Required Documents
        </h2>
        <p className="text-muted-foreground">
          {role === 'cook' 
            ? 'Please upload your cooking credentials and certifications'
            : 'Please upload your delivery-related documents and licenses'
          }
        </p>
      </div>

      {/* Document Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Document Type</CardTitle>
          <CardDescription>
            Choose the type of document you want to upload
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documentTypes.map((docType) => {
              const isUploaded = uploadedDocumentTypes.has(docType.id);
              const uploadedFilesForType = uploadedFiles.filter(f => f.documentType.id === docType.id && f.status === 'success');
              
              return (
                <Button
                  key={docType.id}
                  variant={selectedDocumentType?.id === docType.id ? "default" : "outline"}
                  className={`h-auto p-4 justify-start relative ${
                    isUploaded ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''
                  }`}
                  onClick={() => setSelectedDocumentType(docType)}
                >
                  <div className="text-left w-full">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{docType.name}</div>
                      {isUploaded && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {docType.description}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={docType.is_required ? "destructive" : "secondary"}>
                        {docType.is_required ? "Required" : "Optional"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Max {docType.max_file_size_mb}MB
                      </span>
                      {uploadedFilesForType.length > 0 && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {uploadedFilesForType.length} file{uploadedFilesForType.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      {selectedDocumentType && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Upload {selectedDocumentType.name}
            </CardTitle>
            <CardDescription>
              {selectedDocumentType.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to select files
              </p>
              <p className="text-xs text-muted-foreground">
                Allowed: {getAllowedFileTypes(selectedDocumentType).map(t => `.${t}`).join(', ')} • 
                Max size: {selectedDocumentType.max_file_size_mb}MB
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uploaded Documents</CardTitle>
            <CardDescription>
              Review your uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((uploadedFile) => (
                <div
                  key={uploadedFile.id}
                  className={`p-4 rounded-lg border ${getStatusColor(uploadedFile.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {uploadedFile.preview ? (
                        <img
                          src={uploadedFile.preview}
                          alt="Preview"
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          {getFileIcon(uploadedFile.file.type)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{uploadedFile.file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {uploadedFile.documentType.name} • {formatFileSize(uploadedFile.file.size)}
                        </p>
                        {uploadedFile.error && (
                          <p className="text-sm text-red-600">{uploadedFile.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(uploadedFile.status)}
                      {uploadedFile.status === 'error' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryUpload(uploadedFile.id)}
                        >
                          Retry
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(uploadedFile.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {uploadedFile.status === 'uploading' && (
                    <div className="mt-3">
                      <Progress value={uploadedFile.progress} className="h-2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Document Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Required Documents</h4>
              <div className="space-y-2">
                {requiredDocuments.map((doc) => {
                  const uploaded = uploadedFiles.some(file => 
                    file.documentType.id === doc.id && file.status === 'success'
                  );
                  return (
                    <div key={doc.id} className="flex items-center space-x-2">
                      {uploaded ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className={uploaded ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}>
                        {doc.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {optionalDocuments.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Optional Documents</h4>
                <div className="space-y-2">
                  {optionalDocuments.map((doc) => {
                    const uploaded = uploadedFiles.some(file => 
                      file.documentType.id === doc.id && file.status === 'success'
                    );
                    return (
                      <div key={doc.id} className="flex items-center space-x-2">
                        {uploaded ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <div className="w-4 h-4 border border-muted-foreground rounded" />
                        )}
                        <span className={uploaded ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}>
                          {doc.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={!allRequiredUploaded || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  );
};

export default DocumentUpload;
