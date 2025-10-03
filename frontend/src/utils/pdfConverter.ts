/**
 * Client-side PDF to Image conversion utility
 * Uses PDF.js to render PDF pages as images
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up PDF.js worker to use locally bundled asset instead of CDN
if (typeof window !== 'undefined' && pdfjsLib?.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
}

interface PDFConversionResult {
  success: boolean;
  message: string;
  images?: {
    blob: Blob;
    dataUrl: string;
    pageNumber: number;
    width: number;
    height: number;
  }[];
  error?: string;
}

class PDFConverterService {
  private maxPages: number = 3;
  private imageQuality: number = 0.8;
  private imageFormat: string = 'image/jpeg';
  private maxImageWidth: number = 1200;

  /**
   * Convert PDF file to images
   */
  async convertPDFToImages(file: File): Promise<PDFConversionResult> {
    try {
      // Validate file
      if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
        return {
          success: false,
          message: 'Please provide a valid PDF file'
        };
      }

      // Read PDF file
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Check page count
      const numPages = pdf.numPages;
      if (numPages > this.maxPages) {
        return {
          success: false,
          message: `PDF has ${numPages} pages. Maximum allowed is ${this.maxPages} pages.`
        };
      }

      if (numPages === 0) {
        return {
          success: false,
          message: 'PDF appears to be empty or corrupted'
        };
      }

      const images = [];
      
      // Convert each page to image
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const imageData = await this.renderPageToImage(page, pageNum);
          images.push(imageData);
        } catch (pageError) {
          console.error(`Error converting page ${pageNum}:`, pageError);
          return {
            success: false,
            message: `Failed to convert page ${pageNum}. The PDF might be corrupted.`,
            error: String(pageError)
          };
        }
      }

      return {
        success: true,
        message: `Successfully converted ${numPages} page(s) to images`,
        images
      };

    } catch (error) {
      console.error('PDF conversion error:', error);
      let errorMessage = 'Failed to convert PDF to images';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid PDF')) {
          errorMessage = 'Invalid PDF file. Please ensure the file is a valid PDF document.';
        } else if (error.message.includes('password')) {
          errorMessage = 'Password-protected PDFs are not supported. Please provide an unprotected PDF.';
        } else {
          errorMessage = `PDF conversion failed: ${error.message}`;
        }
      }

      return {
        success: false,
        message: errorMessage,
        error: String(error)
      };
    }
  }

  /**
   * Render a PDF page to image
   */
  private async renderPageToImage(page: any, pageNumber: number) {
    const viewport = page.getViewport({ scale: 1.0 });
    
    // Calculate scale to fit max width
    const scale = Math.min(this.maxImageWidth / viewport.width, 2.0);
    const scaledViewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    // Render page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport
    };

    await page.render(renderContext).promise;

    // Convert canvas to blob and data URL
    return new Promise<{
      blob: Blob;
      dataUrl: string;
      pageNumber: number;
      width: number;
      height: number;
    }>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to convert canvas to blob'));
          return;
        }

        const dataUrl = canvas.toDataURL(this.imageFormat, this.imageQuality);
        
        resolve({
          blob,
          dataUrl,
          pageNumber,
          width: canvas.width,
          height: canvas.height
        });
      }, this.imageFormat, this.imageQuality);
    });
  }

  /**
   * Create File objects from converted images
   */
  createImageFiles(images: PDFConversionResult['images'], originalFileName: string): File[] {
    if (!images) return [];

    return images.map((image, index) => {
      const baseName = originalFileName.replace(/\.pdf$/i, '');
      const fileName = images.length > 1 
        ? `${baseName}_page_${image.pageNumber}.jpg`
        : `${baseName}.jpg`;
      
      return new File([image.blob], fileName, {
        type: this.imageFormat,
        lastModified: Date.now()
      });
    });
  }

  /**
   * Validate PDF file before processing
   */
  async validatePDF(file: File): Promise<{ valid: boolean; message: string }> {
    try {
      // Basic file validation
      if (!file || file.size === 0) {
        return { valid: false, message: 'File is empty' };
      }

      if (!file.name.toLowerCase().endsWith('.pdf')) {
        return { valid: false, message: 'File is not a PDF' };
      }

      // Check file header
      const arrayBuffer = await file.slice(0, 5).arrayBuffer();
      const header = new TextDecoder().decode(arrayBuffer);
      
      if (!header.startsWith('%PDF')) {
        return { valid: false, message: 'File is not a valid PDF document' };
      }

      // Try to load the PDF to check if it's corrupted
      try {
        const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        const numPages = pdf.numPages;

        if (numPages > this.maxPages) {
          return { 
            valid: false, 
            message: `PDF has ${numPages} pages. Maximum allowed is ${this.maxPages} pages.` 
          };
        }

        return { valid: true, message: 'PDF is valid' };
      } catch (pdfError) {
        return { 
          valid: false, 
          message: 'PDF appears to be corrupted or password-protected' 
        };
      }

    } catch (error) {
      return { 
        valid: false, 
        message: 'Failed to validate PDF file' 
      };
    }
  }
}

// Create singleton instance
export const pdfConverter = new PDFConverterService();

// Export types and service
export type { PDFConversionResult };
export default PDFConverterService;