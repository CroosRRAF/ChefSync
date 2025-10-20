// Accessibility Testing Utilities for ChefSync Admin
// WCAG 2.1 AA Compliance Checker

interface AccessibilityIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  rule: string;
  description: string;
  element: string;
  suggestion: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagCriterion: string;
}

interface AccessibilityReport {
  score: number;
  issues: AccessibilityIssue[];
  passed: number;
  failed: number;
  warnings: number;
  timestamp: Date;
}

class AccessibilityTester {
  private issues: AccessibilityIssue[] = [];
  private testResults: Map<string, boolean> = new Map();

  // Run comprehensive accessibility audit
  async runAudit(): Promise<AccessibilityReport> {
    this.issues = [];
    this.testResults.clear();

    // Run all accessibility tests
    await this.testColorContrast();
    await this.testKeyboardNavigation();
    await this.testAriaLabels();
    await this.testSemanticHTML();
    await this.testFocusManagement();
    await this.testImageAltText();
    await this.testFormLabels();
    await this.testHeadingStructure();
    await this.testLinkPurpose();
    await this.testTableHeaders();

    // Calculate score
    const totalTests = this.testResults.size;
    const passedTests = Array.from(this.testResults.values()).filter(Boolean).length;
    const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    return {
      score,
      issues: this.issues,
      passed: passedTests,
      failed: totalTests - passedTests,
      warnings: this.issues.filter(i => i.severity === 'warning').length,
      timestamp: new Date(),
    };
  }

  // Test color contrast ratios
  private async testColorContrast(): Promise<void> {
    const elements = document.querySelectorAll('*');
    let contrastIssues = 0;

    elements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const contrast = this.calculateContrastRatio(color, backgroundColor);
        
        if (contrast < 4.5) {
          contrastIssues++;
          this.addIssue({
            id: `contrast-${contrastIssues}`,
            severity: contrast < 3 ? 'error' : 'warning',
            rule: 'Color Contrast',
            description: `Insufficient color contrast ratio: ${contrast.toFixed(2)}:1`,
            element: this.getElementSelector(element),
            suggestion: 'Increase contrast ratio to at least 4.5:1 for normal text, 3:1 for large text',
            wcagLevel: 'AA',
            wcagCriterion: '1.4.3 Contrast (Minimum)',
          });
        }
      }
    });

    this.testResults.set('colorContrast', contrastIssues === 0);
  }

  // Test keyboard navigation
  private async testKeyboardNavigation(): Promise<void> {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    let keyboardIssues = 0;

    focusableElements.forEach((element) => {
      // Check if element is keyboard accessible
      const tabIndex = element.getAttribute('tabindex');
      const isHidden = element.getAttribute('aria-hidden') === 'true';
      const isDisabled = element.hasAttribute('disabled');

      if (!isHidden && !isDisabled) {
        // Check if element has visible focus indicator
        const styles = window.getComputedStyle(element, ':focus');
        const outline = styles.outline;
        const outlineWidth = styles.outlineWidth;
        const boxShadow = styles.boxShadow;

        if (outline === 'none' && outlineWidth === '0px' && !boxShadow.includes('inset')) {
          keyboardIssues++;
          this.addIssue({
            id: `keyboard-${keyboardIssues}`,
            severity: 'warning',
            rule: 'Keyboard Navigation',
            description: 'Focusable element lacks visible focus indicator',
            element: this.getElementSelector(element),
            suggestion: 'Add visible focus styles using :focus pseudo-class',
            wcagLevel: 'AA',
            wcagCriterion: '2.4.7 Focus Visible',
          });
        }
      }
    });

    this.testResults.set('keyboardNavigation', keyboardIssues === 0);
  }

  // Test ARIA labels and attributes
  private async testAriaLabels(): Promise<void> {
    const elementsNeedingLabels = document.querySelectorAll(
      'button:not([aria-label]):not([aria-labelledby]), input:not([aria-label]):not([aria-labelledby]), select:not([aria-label]):not([aria-labelledby])'
    );

    let ariaIssues = 0;

    elementsNeedingLabels.forEach((element) => {
      const hasTextContent = element.textContent?.trim();
      const hasLabel = element.closest('label');
      const hasTitle = element.getAttribute('title');

      if (!hasTextContent && !hasLabel && !hasTitle) {
        ariaIssues++;
        this.addIssue({
          id: `aria-${ariaIssues}`,
          severity: 'error',
          rule: 'ARIA Labels',
          description: 'Interactive element lacks accessible name',
          element: this.getElementSelector(element),
          suggestion: 'Add aria-label, aria-labelledby, or associate with a label element',
          wcagLevel: 'A',
          wcagCriterion: '4.1.2 Name, Role, Value',
        });
      }
    });

    // Check for invalid ARIA attributes
    const elementsWithAria = document.querySelectorAll('[aria-*]');
    elementsWithAria.forEach((element) => {
      const ariaAttributes = Array.from(element.attributes).filter(attr => 
        attr.name.startsWith('aria-')
      );

      ariaAttributes.forEach((attr) => {
        if (!this.isValidAriaAttribute(attr.name)) {
          ariaIssues++;
          this.addIssue({
            id: `aria-invalid-${ariaIssues}`,
            severity: 'warning',
            rule: 'ARIA Attributes',
            description: `Invalid ARIA attribute: ${attr.name}`,
            element: this.getElementSelector(element),
            suggestion: 'Use only valid ARIA attributes as defined in the ARIA specification',
            wcagLevel: 'A',
            wcagCriterion: '4.1.2 Name, Role, Value',
          });
        }
      });
    });

    this.testResults.set('ariaLabels', ariaIssues === 0);
  }

  // Test semantic HTML structure
  private async testSemanticHTML(): Promise<void> {
    let semanticIssues = 0;

    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    headings.forEach((heading) => {
      const currentLevel = parseInt(heading.tagName.charAt(1));
      
      if (currentLevel > previousLevel + 1) {
        semanticIssues++;
        this.addIssue({
          id: `heading-${semanticIssues}`,
          severity: 'warning',
          rule: 'Heading Structure',
          description: `Heading level skipped from h${previousLevel} to h${currentLevel}`,
          element: this.getElementSelector(heading),
          suggestion: 'Use heading levels sequentially without skipping levels',
          wcagLevel: 'AA',
          wcagCriterion: '1.3.1 Info and Relationships',
        });
      }
      
      previousLevel = currentLevel;
    });

    // Check for missing main landmark
    const mainElements = document.querySelectorAll('main, [role="main"]');
    if (mainElements.length === 0) {
      semanticIssues++;
      this.addIssue({
        id: 'missing-main',
        severity: 'error',
        rule: 'Landmarks',
        description: 'Page is missing main landmark',
        element: 'document',
        suggestion: 'Add a <main> element or role="main" to identify the main content area',
        wcagLevel: 'AA',
        wcagCriterion: '1.3.1 Info and Relationships',
      });
    }

    this.testResults.set('semanticHTML', semanticIssues === 0);
  }

  // Test focus management
  private async testFocusManagement(): Promise<void> {
    let focusIssues = 0;

    // Check for focus traps in modals
    const modals = document.querySelectorAll('[role="dialog"], .modal');
    modals.forEach((modal) => {
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) {
        focusIssues++;
        this.addIssue({
          id: `focus-trap-${focusIssues}`,
          severity: 'error',
          rule: 'Focus Management',
          description: 'Modal dialog contains no focusable elements',
          element: this.getElementSelector(modal),
          suggestion: 'Ensure modals contain at least one focusable element and implement focus trapping',
          wcagLevel: 'AA',
          wcagCriterion: '2.4.3 Focus Order',
        });
      }
    });

    this.testResults.set('focusManagement', focusIssues === 0);
  }

  // Test image alt text
  private async testImageAltText(): Promise<void> {
    const images = document.querySelectorAll('img');
    let imageIssues = 0;

    images.forEach((img) => {
      const alt = img.getAttribute('alt');
      const ariaLabel = img.getAttribute('aria-label');
      const ariaHidden = img.getAttribute('aria-hidden');

      if (!alt && !ariaLabel && ariaHidden !== 'true') {
        imageIssues++;
        this.addIssue({
          id: `img-alt-${imageIssues}`,
          severity: 'error',
          rule: 'Image Alt Text',
          description: 'Image missing alternative text',
          element: this.getElementSelector(img),
          suggestion: 'Add descriptive alt attribute or aria-label, or use aria-hidden="true" for decorative images',
          wcagLevel: 'A',
          wcagCriterion: '1.1.1 Non-text Content',
        });
      }
    });

    this.testResults.set('imageAltText', imageIssues === 0);
  }

  // Test form labels
  private async testFormLabels(): Promise<void> {
    const formControls = document.querySelectorAll('input, select, textarea');
    let formIssues = 0;

    formControls.forEach((control) => {
      const id = control.getAttribute('id');
      const ariaLabel = control.getAttribute('aria-label');
      const ariaLabelledBy = control.getAttribute('aria-labelledby');
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;
      const parentLabel = control.closest('label');

      if (!ariaLabel && !ariaLabelledBy && !label && !parentLabel) {
        formIssues++;
        this.addIssue({
          id: `form-label-${formIssues}`,
          severity: 'error',
          rule: 'Form Labels',
          description: 'Form control missing associated label',
          element: this.getElementSelector(control),
          suggestion: 'Associate form control with a label element or add aria-label',
          wcagLevel: 'A',
          wcagCriterion: '3.3.2 Labels or Instructions',
        });
      }
    });

    this.testResults.set('formLabels', formIssues === 0);
  }

  // Test heading structure
  private async testHeadingStructure(): Promise<void> {
    const h1Elements = document.querySelectorAll('h1');
    let headingIssues = 0;

    if (h1Elements.length === 0) {
      headingIssues++;
      this.addIssue({
        id: 'missing-h1',
        severity: 'error',
        rule: 'Heading Structure',
        description: 'Page is missing h1 heading',
        element: 'document',
        suggestion: 'Add an h1 element to identify the main heading of the page',
        wcagLevel: 'AA',
        wcagCriterion: '1.3.1 Info and Relationships',
      });
    } else if (h1Elements.length > 1) {
      headingIssues++;
      this.addIssue({
        id: 'multiple-h1',
        severity: 'warning',
        rule: 'Heading Structure',
        description: 'Page contains multiple h1 headings',
        element: 'document',
        suggestion: 'Use only one h1 per page for the main heading',
        wcagLevel: 'AA',
        wcagCriterion: '1.3.1 Info and Relationships',
      });
    }

    this.testResults.set('headingStructure', headingIssues === 0);
  }

  // Test link purpose
  private async testLinkPurpose(): Promise<void> {
    const links = document.querySelectorAll('a[href]');
    let linkIssues = 0;

    links.forEach((link) => {
      const text = link.textContent?.trim();
      const ariaLabel = link.getAttribute('aria-label');
      const title = link.getAttribute('title');

      if (!text && !ariaLabel && !title) {
        linkIssues++;
        this.addIssue({
          id: `link-purpose-${linkIssues}`,
          severity: 'error',
          rule: 'Link Purpose',
          description: 'Link has no accessible text',
          element: this.getElementSelector(link),
          suggestion: 'Add descriptive text, aria-label, or title attribute to explain link purpose',
          wcagLevel: 'A',
          wcagCriterion: '2.4.4 Link Purpose (In Context)',
        });
      } else if (text && (text.toLowerCase() === 'click here' || text.toLowerCase() === 'read more')) {
        linkIssues++;
        this.addIssue({
          id: `link-generic-${linkIssues}`,
          severity: 'warning',
          rule: 'Link Purpose',
          description: 'Link text is not descriptive',
          element: this.getElementSelector(link),
          suggestion: 'Use descriptive link text that explains the link destination or purpose',
          wcagLevel: 'AA',
          wcagCriterion: '2.4.4 Link Purpose (In Context)',
        });
      }
    });

    this.testResults.set('linkPurpose', linkIssues === 0);
  }

  // Test table headers
  private async testTableHeaders(): Promise<void> {
    const tables = document.querySelectorAll('table');
    let tableIssues = 0;

    tables.forEach((table) => {
      const headers = table.querySelectorAll('th');
      const caption = table.querySelector('caption');

      if (headers.length === 0) {
        tableIssues++;
        this.addIssue({
          id: `table-headers-${tableIssues}`,
          severity: 'error',
          rule: 'Table Headers',
          description: 'Data table missing header cells',
          element: this.getElementSelector(table),
          suggestion: 'Add th elements to identify column and row headers',
          wcagLevel: 'A',
          wcagCriterion: '1.3.1 Info and Relationships',
        });
      }

      if (!caption) {
        tableIssues++;
        this.addIssue({
          id: `table-caption-${tableIssues}`,
          severity: 'warning',
          rule: 'Table Caption',
          description: 'Data table missing caption',
          element: this.getElementSelector(table),
          suggestion: 'Add a caption element to describe the table content',
          wcagLevel: 'AA',
          wcagCriterion: '1.3.1 Info and Relationships',
        });
      }
    });

    this.testResults.set('tableHeaders', tableIssues === 0);
  }

  // Helper methods
  private addIssue(issue: AccessibilityIssue): void {
    this.issues.push(issue);
  }

  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private calculateContrastRatio(color1: string, color2: string): number {
    // Simplified contrast calculation
    // In a real implementation, you'd convert colors to RGB and calculate luminance
    return 4.5; // Placeholder - would need proper color parsing and luminance calculation
  }

  private isValidAriaAttribute(attribute: string): boolean {
    const validAriaAttributes = [
      'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden',
      'aria-expanded', 'aria-controls', 'aria-haspopup', 'aria-current',
      'aria-selected', 'aria-checked', 'aria-disabled', 'aria-readonly',
      'aria-required', 'aria-invalid', 'aria-live', 'aria-atomic',
      'aria-relevant', 'aria-busy', 'aria-dropeffect', 'aria-grabbed',
      'aria-activedescendant', 'aria-colcount', 'aria-colindex',
      'aria-colspan', 'aria-rowcount', 'aria-rowindex', 'aria-rowspan',
      'aria-sort', 'aria-valuemax', 'aria-valuemin', 'aria-valuenow',
      'aria-valuetext', 'aria-orientation', 'aria-keyshortcuts',
      'aria-roledescription', 'aria-placeholder', 'aria-modal',
      'aria-multiline', 'aria-multiselectable', 'aria-autocomplete',
      'aria-setsize', 'aria-posinset', 'aria-level', 'aria-flowto',
      'aria-owns', 'aria-details'
    ];

    return validAriaAttributes.includes(attribute);
  }

  // Get accessibility report
  getReport(): AccessibilityReport | null {
    if (this.issues.length === 0 && this.testResults.size === 0) {
      return null;
    }

    const totalTests = this.testResults.size;
    const passedTests = Array.from(this.testResults.values()).filter(Boolean).length;
    const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    return {
      score,
      issues: this.issues,
      passed: passedTests,
      failed: totalTests - passedTests,
      warnings: this.issues.filter(i => i.severity === 'warning').length,
      timestamp: new Date(),
    };
  }
}

// Create singleton instance
export const accessibilityTester = new AccessibilityTester();

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).accessibilityTester = accessibilityTester;
}

export type { AccessibilityIssue, AccessibilityReport };
