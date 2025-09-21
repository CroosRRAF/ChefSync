const fs = require('fs');
const path = require('path');

const adminPagesDir = 'frontend/src/pages/admin';

function parseImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const imports = [];
  let inImport = false;
  let currentImport = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('import')) {
      inImport = true;
      currentImport = trimmed;
    } else if (inImport) {
      currentImport += ' ' + trimmed;
    }

    if (inImport && (trimmed.endsWith(';') || trimmed.endsWith('}'))) {
      // Parse the import
      const importMatch = currentImport.match(/import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        const namedImports = importMatch[1] ? importMatch[1].split(',').map(s => s.trim()) : [];
        const defaultImport = importMatch[2];
        const fromPath = importMatch[3];

        if (fromPath.includes('@/components/')) {
          const resolvedPath = fromPath.replace('@/', 'frontend/src/');
          const fullPath = path.resolve(resolvedPath);
          const isAdminComponent = resolvedPath.includes('components/admin');

          imports.push({
            from: fromPath,
            resolvedPath: resolvedPath,
            isAdminComponent: isAdminComponent,
            namedImports: namedImports,
            defaultImport: defaultImport
          });
        }
      }
      inImport = false;
      currentImport = '';
    }
  }

  return imports;
}

function processPages() {
  const results = {};
  const files = fs.readdirSync(adminPagesDir, { recursive: true });
  for (const file of files) {
    if (file.endsWith('.tsx') && !file.includes('__tests__')) {
      const filePath = path.join(adminPagesDir, file);
      if (fs.statSync(filePath).isFile()) {
        const relativePath = path.relative('.', filePath);
        const imports = parseImports(filePath);
        results[relativePath] = imports;
      }
    }
  }
  return results;
}

const usageMap = processPages();

fs.writeFileSync('usage-map.json', JSON.stringify(usageMap, null, 2));
console.log('Usage map generated: usage-map.json');