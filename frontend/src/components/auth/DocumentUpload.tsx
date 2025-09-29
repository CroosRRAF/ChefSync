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
  Eye,
  ArrowRight
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
  isPdfConverted?: boolean;
  convertedImages?: any[];
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
  const [isValidating, setIsValidating] = useState(false);
  const [uploadedDocumentTypes, setUploadedDocumentTypes] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  // Fetch document types from API
  useEffect(() => {
    console.log('DocumentUpload component mounted with role:', role);
    const fetchDocumentTypes = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        const response = await fetch(`${apiUrl}/auth/documents/types/?role=${role}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Fetched document types:', data);
          setDocumentTypes(data);
        } else {
          console.error('Failed to fetch document types:', response.status, response.statusText);
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

  const getFileIcon = (fileType: string, isPdfConverted?: boolean) => {
    if (fileType.startsWith('image/') || isPdfConverted) {
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

    // Basic PDF validation (header check will be done in async validation)
    if (fileExtension === 'pdf') {
      // Additional size check for PDFs
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for PDFs
        return "PDF file is too large. Maximum size allowed is 10MB.";
      }
    }

    return null;
  };

  const validatePDFFile = async (file: File): Promise<string | null> => {
    try {
      // First check PDF header
      const headerCheck = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Check PDF header (%PDF)
          const header = String.fromCharCode(uint8Array[0], uint8Array[1], uint8Array[2], uint8Array[3]);
          if (header !== '%PDF') {
            resolve("Invalid PDF file. Please ensure the file is a valid PDF document.");
            return;
          }
          resolve(null);
        };
        reader.onerror = () => {
          resolve("Error reading PDF file. Please try again.");
        };
        reader.readAsArrayBuffer(file.slice(0, 1024)); // Read first 1KB to check header
      });

      if (headerCheck) {
        return headerCheck;
      }

      // Now check page count using pdf-lib
      try {
        const { PDFDocument } = await import('pdf-lib');
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();
        
        if (pageCount > 3) {
          return `PDF has ${pageCount} pages. Maximum allowed is 3 pages. Please use a PDF with fewer pages.`;
        }
        
        if (pageCount === 0) {
          return "PDF appears to be empty or corrupted. Please check your file.";
        }
        
        return null; // PDF is valid
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        // If pdf-lib fails, we'll let the backend handle the validation
        // This provides a fallback for edge cases
        console.log('Falling back to backend validation for PDF page count');
        return null;
      }
    } catch (error) {
      console.error('PDF validation error:', error);
      return "Error validating PDF file. Please try again.";
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedDocumentType) {
      toast({
        title: "Select Document Type",
        description: "Please select a document type before uploading files.",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    const newFiles: UploadedFile[] = [];
    
    try {
      // Validate files (including async PDF validation)
      for (const file of acceptedFiles) {
        const id = Math.random().toString(36).substr(2, 9);
        let error: string | null = null;
        
        // Basic validation
        error = validateFile(file, selectedDocumentType);
        
      // If it's a PDF and basic validation passed, do async PDF validation
      if (!error && file.name.toLowerCase().endsWith('.pdf')) {
        try {
          error = await validatePDFFile(file);
        } catch (validationError) {
          console.error('PDF validation failed:', validationError);
          // If client-side validation fails, let the backend handle it
          error = null;
        }
      }
        
        newFiles.push({
          id,
          file,
          documentType: selectedDocumentType,
          status: error ? 'error' : 'pending',
          progress: 0,
          error,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        });
      }

      setUploadedFiles(prev => [...prev, ...newFiles]);

      // Auto-upload valid files
      newFiles.forEach(uploadedFile => {
        if (uploadedFile.status === 'pending') {
          uploadFile(uploadedFile);
        }
      });
    } catch (error) {
      console.error('Error during file validation:', error);
      toast({
        title: "Validation Error",
        description: "An error occurred while validating files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
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
      
      console.log('User email found in localStorage:', userEmail);
      
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
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      
      // Debug logging
      console.log('Uploading file:', {
        fileName: uploadedFile.file.name,
        fileSize: uploadedFile.file.size,
        fileType: uploadedFile.file.type,
        documentTypeId: uploadedFile.documentType.id,
        userEmail: userEmail,
        apiUrl: `${apiUrl}/auth/documents/upload-registration/`
      });
      const response = await fetch(`${apiUrl}/auth/documents/upload-registration/`, {
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
          ? { 
              ...file, 
              status: 'success', 
              progress: 100, 
              documentId: result.document.id,
              isPdfConverted: result.document.is_pdf_converted || false,
              convertedImages: result.document.converted_images || []
            }
          : file
      ));

      // Add document type to uploaded set
      setUploadedDocumentTypes(prev => new Set([...prev, uploadedFile.documentType.id]));

      const isPdfConverted = result.document.is_pdf_converted || false;
      const convertedImagesCount = result.document.converted_images?.length || 0;
      
      toast({
        title: "File Uploaded",
        description: isPdfConverted 
          ? `${uploadedFile.file.name} has been converted to ${convertedImagesCount} image(s) and uploaded successfully.`
          : `${uploadedFile.file.name} has been uploaded successfully.`,
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
      case 'pending':
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
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
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800';
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
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Upload Required Documents
        </h2>
        <div className="max-w-2xl mx-auto">
          <p className="text-muted-foreground text-lg mb-3">
            {role === 'cook' 
              ? 'Please upload your cooking credentials and certifications to verify your culinary expertise'
              : 'Please upload your delivery-related documents and licenses to verify your delivery capabilities'
            }
          </p>
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📋 Document Requirements
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 text-left">
              <li>• Upload clear, high-quality images or PDF files</li>
              <li>• Maximum file size: 15MB per document</li>
              <li>• Supported formats: PDF, JPG, PNG, JPEG</li>
              <li>• PDF files will be automatically converted to images</li>
              <li>• All documents are securely stored and encrypted</li>
              <li>• Your documents will be reviewed by our admin team</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Document Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Select Document Type
          </CardTitle>
          <CardDescription>
            Choose the type of document you want to upload. Click on a document type to select it, then upload your files below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTypes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading document types...</span>
            </div>
          ) : documentTypes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No document types found for your role.</p>
              <p className="text-sm text-muted-foreground mt-2">Please contact support if you believe this is an error.</p>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* Upload Area */}
      {selectedDocumentType && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload {selectedDocumentType.name}
            </CardTitle>
            <CardDescription>
              {selectedDocumentType.description}
              <br />
              <span className="text-sm text-muted-foreground mt-1 block">
                Drag and drop your files here or click to browse. You can upload multiple files of the same type.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : isValidating
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} disabled={isValidating} />
              {isValidating ? (
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
              ) : (
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              )}
              <p className="text-lg font-medium mb-2">
                {isValidating 
                  ? 'Validating files...' 
                  : isDragActive 
                    ? 'Drop files here' 
                    : 'Drag & drop files here'
                }
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {isValidating ? 'Please wait while we validate your files' : 'or click to select files'}
              </p>
              <p className="text-xs text-muted-foreground">
                Allowed: {getAllowedFileTypes(selectedDocumentType).map(t => `.${t}`).join(', ')} • 
                Max size: {selectedDocumentType.max_file_size_mb}MB
              </p>
              {getAllowedFileTypes(selectedDocumentType).includes('pdf') && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    📄 PDF files will be automatically converted to images for better viewing and storage.
                    Maximum 3 pages allowed. We'll validate your PDF before upload.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Uploaded Documents
            </CardTitle>
            <CardDescription>
              Review your uploaded documents. You can remove files or retry failed uploads.
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
                          {getFileIcon(uploadedFile.file.type, uploadedFile.isPdfConverted)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{uploadedFile.file.name}</p>
                          {uploadedFile.isPdfConverted && (
                            <Badge variant="secondary" className="text-xs">
                              PDF → Image
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {uploadedFile.documentType.name} • {formatFileSize(uploadedFile.file.size)}
                          {uploadedFile.isPdfConverted && uploadedFile.convertedImages && (
                            <span className="ml-2 text-blue-600">
                              ({uploadedFile.convertedImages.length} page{uploadedFile.convertedImages.length > 1 ? 's' : ''})
                            </span>
                          )}
                        </p>
                        {uploadedFile.error && (
                          <p className="text-sm text-red-600">{uploadedFile.error}</p>
                        )}
                        {uploadedFile.status === 'pending' && !uploadedFile.error && (
                          <p className="text-sm text-yellow-600">Validating file...</p>
                        )}
                        {uploadedFile.status === 'uploading' && (
                          <p className="text-sm text-blue-600">Uploading...</p>
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
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document Status
          </CardTitle>
          <CardDescription>
            Track your document upload progress. All required documents must be uploaded before you can continue.
          </CardDescription>
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
      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to Role Selection
        </Button>
        <div className="text-right">
          {!allRequiredUploaded && (
            <p className="text-sm text-muted-foreground mb-2">
              {requiredDocuments.length - uploadedRequiredDocs.length} required document(s) remaining
            </p>
          )}
          <Button 
            onClick={handleContinue}
            disabled={!allRequiredUploaded || isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                Continue to Account Setup
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
