import React from 'react';
import SimpleDocumentUpload from './SimpleDocumentUpload';

interface DocumentUploadProps {
  role: 'cook' | 'delivery_agent';
  onDocumentsComplete: (documents: any[]) => void;
  onBack: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = (props) => {
  return <SimpleDocumentUpload {...props} />;
};

export default DocumentUpload;
