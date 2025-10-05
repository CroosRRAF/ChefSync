import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { pdfConverter, type PDFConversionResult } from '@/utils/pdfConverter';

interface DocumentType {
  id: number;
  name: string;
  description: string;
  is_required: boolean;
  allowed_file_types: string | string[];
  max_file_size_mb: number;
  max_pages?: number;
  is_single_page_only?: boolean;
}

interface UploadedFile {
  id: string;
  file: File;
  documentType: DocumentType;
  status: 'uploading' | 'success' | 'error' | 'pending' | 'converting';
  progress: number;
  error?: string;
  preview?: string;
  documentId?: number;
  isPdfConverted?: boolean;
  convertedImages?: File[];
  originalPdfFile?: File;
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
  const [isConverting, setIsConverting] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  // Fetch document types from API
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${apiUrl}/api/auth/documents/types/?role=${role}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch document types: ${response.status}`);
        }

        const data = await response.json();
        
        const normaliseList = (items: DocumentType[]): DocumentType[] =>
          items.map((item) => ({
            ...item,
            allowed_file_types: Array.isArray(item.allowed_file_types)
              ? item.allowed_file_types.join(',')
              : item.allowed_file_types || '',
          }));

        if (Array.isArray(data)) {
          setDocumentTypes(normaliseList(data));
        } else if (data.document_types && Array.isArray(data.document_types)) {
          setDocumentTypes(normaliseList(data.document_types));
        } else {
          setDocumentTypes([]);
        }

      } catch (error) {
        console.error('Error fetching document types:', error);
        alert('Failed to load document types. Please refresh the page and try again.');
        setDocumentTypes([]);
      } finally {
        setIsLoadingTypes(false);
      }
    };

    fetchDocumentTypes();
  }, [role]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileExtension = (fileName: string): string => {
    return fileName.toLowerCase().split('.').pop() || '';
  };

  const validateFile = (file: File, documentType: DocumentType): string | null => {
    if (!file || file.size === 0) {
      return "File cannot be empty";
    }

    if (!file.name || file.name.trim().length === 0) {
      return "File name cannot be empty";
    }

    const extension = getFileExtension(file.name);
    if (!extension) {
      return "File must have a valid extension";
    }

    const maxSizeBytes = documentType.max_file_size_mb * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const fileSizeMB = Math.round((file.size / (1024 * 1024)) * 100) / 100;
      return `File size (${fileSizeMB}MB) exceeds maximum allowed size (${documentType.max_file_size_mb}MB)`;
    }

    const rawTypes = typeof documentType.allowed_file_types === 'string'
      ? documentType.allowed_file_types
      : (documentType.allowed_file_types || []).join(',');

    const allowedTypes = rawTypes
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);
    if (!allowedTypes.includes(extension)) {
      return `File type '.${extension.toUpperCase()}' is not allowed. Allowed: ${allowedTypes.map(t => `.${t.toUpperCase()}`).join(', ')}`;
    }

    return null;
  };

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedDocumentType) return;

    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = Math.random().toString(36).substr(2, 9);
      const error = validateFile(file, selectedDocumentType);
      
      // Check if it's a PDF file
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      
      const uploadedFile: UploadedFile = {
        id,
        file,
        documentType: selectedDocumentType,
        status: error ? 'error' : 'pending',
        progress: 0,
        error,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        isPdfConverted: false,
        originalPdfFile: isPdf ? file : undefined
      };

      newFiles.push(uploadedFile);
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Process files (convert PDFs and upload)
    for (const uploadedFile of newFiles) {
      if (uploadedFile.status === 'pending') {
        await processFile(uploadedFile);
      }
    }

    // Reset input
    event.target.value = '';
  };

  const processFile = async (uploadedFile: UploadedFile) => {
    const isPdf = uploadedFile.file.name.toLowerCase().endsWith('.pdf');
    
    if (isPdf) {
      // Convert PDF to images first
      await convertPdfToImages(uploadedFile);
    } else {
      // Upload image file directly
      uploadFile(uploadedFile);
    }
  };

  const convertPdfToImages = async (uploadedFile: UploadedFile) => {
    setIsConverting(true);
    
    // Update status to converting
    setUploadedFiles(prev => prev.map(file => 
      file.id === uploadedFile.id 
        ? { ...file, status: 'converting' as const }
        : file
    ));

    try {
      // Convert PDF to images
      const conversionResult = await pdfConverter.convertPDFToImages(uploadedFile.file);
      
      if (!conversionResult.success) {
        throw new Error(conversionResult.message);
      }

      if (!conversionResult.images || conversionResult.images.length === 0) {
        throw new Error('No images generated from PDF');
      }

      // Create File objects from converted images
      const imageFiles = pdfConverter.createImageFiles(conversionResult.images, uploadedFile.file.name);
      
      // Update the uploaded file with converted images
      const updatedFile: UploadedFile = {
        ...uploadedFile,
        status: 'pending' as const,
        isPdfConverted: true,
        convertedImages: imageFiles,
        preview: conversionResult.images[0].dataUrl // Use first image as preview
      };

      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id ? updatedFile : file
      ));

      // Upload each converted image
      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];
        const imageUploadFile: UploadedFile = {
          ...updatedFile,
          id: `${uploadedFile.id}_img_${i}`,
          file: imageFile,
          status: 'pending' as const,
          progress: 0
        };

        await uploadFile(imageUploadFile);
      }

      alert(`PDF successfully converted to ${imageFiles.length} image(s) and uploaded!`);

    } catch (error: any) {
      console.error('PDF conversion error:', error);
      
      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id 
          ? { ...file, status: 'error' as const, error: error.message || 'PDF conversion failed' }
          : file
      ));

      alert(`Failed to convert PDF: ${error.message || 'Unknown error'}`);
    } finally {
      setIsConverting(false);
    }
  };

  const uploadFile = async (uploadedFile: UploadedFile) => {
    setIsUploading(true);
    
    // Update status to uploading
    setUploadedFiles(prev => prev.map(file => 
      file.id === uploadedFile.id 
        ? { ...file, status: 'uploading' as const }
        : file
    ));

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id 
          ? { ...file, progress: Math.min(file.progress + 10, 90) }
          : file
      ));
    }, 200);

    try {
      const userEmail = localStorage.getItem('registration_email') || '';
      
      if (!userEmail) {
        throw new Error('User email not found. Please restart the registration process.');
      }

      const formData = new FormData();
      formData.append('file_upload', uploadedFile.file);
      formData.append('document_type_id', uploadedFile.documentType.id.toString());
      formData.append('user_email', userEmail);
      
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      
      const response = await fetch(`${apiUrl}/api/auth/documents/upload-registration/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Upload failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // Use default error message
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      clearInterval(progressInterval);
      
      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id 
          ? { 
              ...file, 
              status: 'success' as const, 
              progress: 100, 
              documentId: result.document.id
            }
          : file
      ));

      alert(`${uploadedFile.file.name} uploaded successfully!`);

    } catch (error: any) {
      clearInterval(progressInterval);
      
      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id 
          ? { ...file, status: 'error' as const, error: error.message || 'Upload failed' }
          : file
      ));

      alert(`Failed to upload ${uploadedFile.file.name}: ${error.message}`);
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
      return prev.filter(f => f.id !== fileId);
    });
  };

  const retryUpload = (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'pending' as const, progress: 0, error: undefined }
          : f
      ));
      uploadFile(file);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'converting':
        return '🔄';
      case 'uploading':
        return '⏳';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'converting':
        return 'border-purple-200 bg-purple-50';
      case 'uploading':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const requiredDocuments = documentTypes.filter(doc => doc.is_required);
  const allRequiredUploaded = requiredDocuments.every(doc => 
    uploadedFiles.some(file => file.documentType.id === doc.id && file.status === 'success')
  );

  const handleContinue = () => {
    if (!allRequiredUploaded) {
      alert('Please upload all required documents before continuing.');
      return;
    }
    onDocumentsComplete(uploadedFiles);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold mb-2">
          Upload Required Documents
        </h2>
        <p className="text-gray-600 text-lg mb-3">
          {role === 'cook' 
            ? 'Please upload your cooking credentials and certifications'
            : 'Please upload your delivery-related documents and licenses'
          }
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            📋 Document Requirements
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 text-left">
            <li>• Upload clear, high-quality images or PDF files</li>
            <li>• Maximum file size: 15MB per document</li>
            <li>• Supported formats: PDF, JPG, PNG, JPEG</li>
            <li>• PDF files will be converted to images (max 3 pages)</li>
            <li>• All documents are securely stored</li>
          </ul>
        </div>
      </div>

      {/* Document Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Document Type</CardTitle>
          <CardDescription>
            Choose the type of document you want to upload, then select your files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTypes ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-gray-500">Loading document types...</span>
            </div>
          ) : documentTypes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No document types found for your role.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documentTypes.map((docType) => {
                const isUploaded = uploadedFiles.some(f => f.documentType.id === docType.id && f.status === 'success');
                
                return (
                  <Button
                    key={docType.id}
                    variant={selectedDocumentType?.id === docType.id ? "default" : "outline"}
                    className={`h-auto p-4 justify-start text-left ${
                      isUploaded ? 'border-green-500 bg-green-50' : ''
                    }`}
                    onClick={() => setSelectedDocumentType(docType)}
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{docType.name}</div>
                        {isUploaded && <span>✅</span>}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {docType.description}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={docType.is_required ? "destructive" : "secondary"}>
                          {docType.is_required ? "Required" : "Optional"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Max {docType.max_file_size_mb}MB
                        </span>
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
            <CardTitle className="text-lg">Upload {selectedDocumentType.name}</CardTitle>
            <CardDescription>
              {selectedDocumentType.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">📁</div>
                <p className="text-lg font-medium mb-2">Select Files to Upload</p>
                <p className="text-sm text-gray-500 mb-4">
                  Allowed: {(
                    typeof selectedDocumentType.allowed_file_types === 'string'
                      ? selectedDocumentType.allowed_file_types
                      : selectedDocumentType.allowed_file_types.join(',')
                  )
                    .split(',')
                    .map(t => `.${t.trim()}`)
                    .filter(Boolean)
                    .join(', ')} • 
                  Max size: {selectedDocumentType.max_file_size_mb}MB
                </p>
                <input
                  type="file"
                  multiple
                  accept={(
                    typeof selectedDocumentType.allowed_file_types === 'string'
                      ? selectedDocumentType.allowed_file_types
                      : selectedDocumentType.allowed_file_types.join(',')
                  )
                    .split(',')
                    .map(t => `.${t.trim()}`)
                    .filter(Boolean)
                    .join(',')}
                  onChange={handleFileSelection}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              
              {/* Mobile Camera Button */}
              <div className="md:hidden">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelection}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                <p className="text-xs text-gray-500 mt-1 text-center">📱 Take Photo</p>
              </div>
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
              Review your uploaded documents.
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
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          📄
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{uploadedFile.file.name}</p>
                          <span className="text-lg">{getStatusIcon(uploadedFile.status)}</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {uploadedFile.documentType.name} • {formatFileSize(uploadedFile.file.size)}
                        </p>
                        {uploadedFile.error && (
                          <p className="text-sm text-red-600">{uploadedFile.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
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
                        variant="outline"
                        onClick={() => removeFile(uploadedFile.id)}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                  {uploadedFile.status === 'uploading' && (
                    <div className="mt-3">
                      <Progress value={uploadedFile.progress} className="h-2" />
                    </div>
                  )}
                  {uploadedFile.status === 'converting' && (
                    <div className="mt-3">
                      <div className="text-sm text-purple-600 mb-1">Converting PDF to images...</div>
                      <Progress value={uploadedFile.progress || 0} className="h-2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Document Status</CardTitle>
          <CardDescription>
            Track your document upload progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {requiredDocuments.map((doc) => {
              const uploaded = uploadedFiles.some(file => 
                file.documentType.id === doc.id && file.status === 'success'
              );
              return (
                <div key={doc.id} className="flex items-center space-x-2">
                  <span className="text-lg">{uploaded ? '✅' : '⏳'}</span>
                  <span className={uploaded ? 'text-green-700' : 'text-amber-700'}>
                    {doc.name}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          ← Back to Role Selection
        </Button>
        <div className="text-right">
          {!allRequiredUploaded && (
            <p className="text-sm text-gray-500 mb-2">
              {requiredDocuments.length - uploadedFiles.filter(f => f.status === 'success' && f.documentType.is_required).length} required document(s) remaining
            </p>
          )}
          <Button 
            onClick={handleContinue}
            disabled={!allRequiredUploaded || isUploading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            {isUploading ? 'Uploading...' : 'Continue to Account Setup →'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
