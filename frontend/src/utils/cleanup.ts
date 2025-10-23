/**
 * Phase 8.1 - Code Cleanup & Organization Utility
 *
 * This utility provides functions to organize, clean up, and optimize
 * the codebase structure for better maintainability.
 */

// File organization utilities
export const fileOrganization = {
  // Categorize files by their purpose
  categorizeFiles: (files: string[]) => {
    const categories = {
      components: [] as string[],
      pages: [] as string[],
      utilities: [] as string[],
      services: [] as string[],
      types: [] as string[],
      assets: [] as string[],
      tests: [] as string[],
      configs: [] as string[],
      deprecated: [] as string[],
    };

    files.forEach((file) => {
      const fileName = file.toLowerCase();

      if (fileName.includes("component") || fileName.endsWith(".tsx")) {
        categories.components.push(file);
      } else if (fileName.includes("page") || fileName.startsWith("pages/")) {
        categories.pages.push(file);
      } else if (fileName.includes("util") || fileName.includes("helper")) {
        categories.utilities.push(file);
      } else if (fileName.includes("service") || fileName.includes("api")) {
        categories.services.push(file);
      } else if (fileName.includes("type") || fileName.endsWith(".d.ts")) {
        categories.types.push(file);
      } else if (
        fileName.includes("asset") ||
        fileName.match(/\.(png|jpg|svg|ico)$/)
      ) {
        categories.assets.push(file);
      } else if (fileName.includes("test") || fileName.includes("spec")) {
        categories.tests.push(file);
      } else if (
        fileName.includes("config") ||
        fileName.endsWith(".config.js")
      ) {
        categories.configs.push(file);
      } else if (fileName.includes("deprecated") || fileName.includes("old")) {
        categories.deprecated.push(file);
      }
    });

    return categories;
  },

  // Generate file structure report
  generateStructureReport: (baseDir: string) => {
    return {
      timestamp: new Date().toISOString(),
      baseDirectory: baseDir,
      structure: {
        "src/components/": {
          purpose: "Reusable UI components",
          subfolders: [
            "admin/ - Admin-specific components",
            "auth/ - Authentication components",
            "ui/ - Base UI components (buttons, inputs, etc.)",
            "shared/ - Shared components across roles",
          ],
        },
        "src/pages/": {
          purpose: "Page-level components and views",
          subfolders: [
            "admin/ - Admin dashboard pages",
            "auth/ - Authentication pages",
            "customer/ - Customer portal pages",
          ],
        },
        "src/utils/": {
          purpose: "Utility functions and helpers",
          organization: "Alphabetically organized by functionality",
        },
        "src/services/": {
          purpose: "API services and data fetching",
          organization: "Organized by feature domain",
        },
        "src/types/": {
          purpose: "TypeScript type definitions",
          organization: "Grouped by feature or component",
        },
      },
    };
  },
};

// Code quality utilities
export const codeQuality = {
  // Check for unused imports/exports
  findUnusedImports: (fileContent: string): string[] => {
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"][^'"]+['"]/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(fileContent)) !== null) {
      const namedImports = match[1].split(",").map((imp) => imp.trim());
      imports.push(...namedImports);
    }

    const unusedImports = imports.filter((imp) => {
      // Simple check if import is used in the file
      const importName = imp.split(" as ")[0].trim();
      const regex = new RegExp(`\\b${importName}\\b`, "g");
      const matches = fileContent.match(regex);
      return !matches || matches.length <= 1; // Only found in import statement
    });

    return unusedImports;
  },

  // Check for duplicate code patterns
  findDuplicatePatterns: (files: Record<string, string>) => {
    const patterns = new Map<string, string[]>();
    const duplicates: { pattern: string; files: string[] }[] = [];

    Object.entries(files).forEach(([fileName, content]) => {
      // Extract function signatures
      const functionRegex = /(?:export\s+)?(?:const|function)\s+(\w+)/g;
      let match;

      while ((match = functionRegex.exec(content)) !== null) {
        const funcName = match[1];
        if (!patterns.has(funcName)) {
          patterns.set(funcName, []);
        }
        patterns.get(funcName)!.push(fileName);
      }
    });

    patterns.forEach((files, pattern) => {
      if (files.length > 1) {
        duplicates.push({ pattern, files });
      }
    });

    return duplicates;
  },

  // Generate code metrics
  generateMetrics: (fileContent: string) => {
    const lines = fileContent.split("\n");
    const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
    const commentLines = lines.filter(
      (line) => line.trim().startsWith("//") || line.trim().startsWith("/*")
    );

    return {
      totalLines: lines.length,
      codeLines: nonEmptyLines.length - commentLines.length,
      commentLines: commentLines.length,
      blankLines: lines.length - nonEmptyLines.length,
      complexity: calculateComplexity(fileContent),
    };
  },
};

// Helper function to calculate cyclomatic complexity
function calculateComplexity(code: string): number {
  // Simple complexity calculation based on control flow statements
  const patterns = [
    /\bif\s*\(/g,
    /\belse\s+if\s*\(/g,
    /\bwhile\s*\(/g,
    /\bfor\s*\(/g,
    /\bswitch\s*\(/g,
    /\bcatch\s*\(/g,
    /\?\s*.*?\s*:/g, // ternary operator
    /&&|\|\|/g, // logical operators
  ];

  let complexity = 1; // Base complexity

  patterns.forEach((pattern) => {
    const matches = code.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  });

  return complexity;
}

// Cleanup recommendations
export const cleanupRecommendations = {
  // Generate cleanup tasks
  generateTasks: () => [
    {
      category: "File Organization",
      tasks: [
        "Remove test files from src root (test-*.ts)",
        "Consolidate duplicate utility folders (lib/ and libs/)",
        "Move demo components to separate demo/ folder",
        "Organize components by feature in subfolders",
      ],
    },
    {
      category: "Code Deduplication",
      tasks: [
        "Merge placeholder utility functions",
        "Consolidate similar service functions",
        "Create shared types for common interfaces",
        "Extract common component patterns",
      ],
    },
    {
      category: "Performance Optimization",
      tasks: [
        "Add lazy loading for large components",
        "Implement code splitting for routes",
        "Optimize bundle size by removing unused dependencies",
        "Add tree shaking for utility functions",
      ],
    },
    {
      category: "Code Quality",
      tasks: [
        "Remove unused imports and variables",
        "Add proper TypeScript types for all functions",
        "Standardize naming conventions",
        "Add JSDoc documentation for public APIs",
      ],
    },
  ],

  // Priority matrix for cleanup tasks
  prioritizeCleanup: () => ({
    high: [
      "Remove unused test files",
      "Fix TypeScript errors",
      "Consolidate duplicate utilities",
      "Remove dead code",
    ],
    medium: [
      "Organize component structure",
      "Standardize naming conventions",
      "Add missing documentation",
      "Optimize imports",
    ],
    low: [
      "Refactor complex functions",
      "Add performance monitoring",
      "Enhance error handling",
      "Improve code comments",
    ],
  }),
};

// Export utilities
export const exportUtils = {
  // Generate index files for cleaner imports
  generateIndexFile: (files: string[], baseImport: string = "") => {
    const exports = files
      .filter((file) => !file.includes("test") && !file.includes("spec"))
      .map((file) => {
        const fileName = file.replace(".tsx", "").replace(".ts", "");
        const importPath = baseImport
          ? `${baseImport}/${fileName}`
          : `./${fileName}`;
        return `export * from '${importPath}';`;
      })
      .join("\n");

    return `// Auto-generated index file for cleaner imports\n// Generated on ${new Date().toISOString()}\n\n${exports}\n`;
  },

  // Create barrel exports for utilities
  createBarrelExports: (categories: Record<string, string[]>) => {
    const barrelExports: Record<string, string> = {};

    Object.entries(categories).forEach(([category, files]) => {
      const exports = files
        .map((file) => {
          const fileName = file.replace(".ts", "").replace(".tsx", "");
          return `export * from './${fileName}';`;
        })
        .join("\n");

      barrelExports[
        `${category}.ts`
      ] = `// ${category} utilities barrel export\n${exports}\n`;
    });

    return barrelExports;
  },
};

// File structure validator
export const structureValidator = {
  // Validate folder structure follows conventions
  validateStructure: (structure: string[]) => {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for common issues
    if (
      structure.some(
        (path) => path.includes("test") && !path.includes("__tests__")
      )
    ) {
      issues.push(
        "Test files should be in __tests__ folders or have .test/.spec suffix"
      );
    }

    if (
      structure.some((path) => path.includes("util") && path.includes("helper"))
    ) {
      issues.push("Inconsistent naming: both util and helper folders found");
      recommendations.push("Standardize on either utils/ or helpers/ naming");
    }

    if (structure.filter((path) => path.includes("index")).length < 3) {
      recommendations.push("Add index.ts files for cleaner imports");
    }

    return { issues, recommendations };
  },

  // Generate structure documentation
  generateStructureDocs: () => `
# Project Structure Documentation

## Overview
This document outlines the recommended project structure for maintainability and scalability.

## Directory Structure

\`\`\`
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── auth/           # Authentication components
│   ├── ui/             # Base UI components
│   └── shared/         # Cross-feature components
├── pages/              # Page-level components
│   ├── admin/          # Admin dashboard pages
│   ├── auth/           # Authentication pages
│   └── customer/       # Customer portal pages
├── utils/              # Utility functions
├── services/           # API services
├── types/              # TypeScript definitions
├── hooks/              # Custom React hooks
├── context/            # React context providers
└── assets/             # Static assets
\`\`\`

## Naming Conventions
- Use PascalCase for components (UserProfile.tsx)
- Use camelCase for utilities (formatDate.ts)
- Use kebab-case for assets (user-avatar.png)
- Use UPPER_CASE for constants (API_ENDPOINTS.ts)

## Import Organization
1. External libraries
2. Internal components
3. Utilities and helpers
4. Types and interfaces
5. Relative imports
`,
};

export default {
  fileOrganization,
  codeQuality,
  cleanupRecommendations,
  exportUtils,
  structureValidator,
};
