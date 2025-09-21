const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const adminPagesDir = 'frontend/src/pages/admin';
const adminComponentsDir = 'frontend/src/components/admin';

function getGitInfo(filePath) {
  try {
    const output = execSync(`git log --oneline -1 -- "${filePath}"`, { encoding: 'utf8' }).trim();
    const match = output.match(/^(\w+) (.+)$/);
    if (match) {
      return { commit: match[1], message: match[2] };
    }
  } catch (e) {
    return { commit: 'unknown', message: 'no git history' };
  }
  return { commit: 'unknown', message: 'no git history' };
}

function parseTsxFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  let componentName = '';
  let exportNames = [];
  let props = {};

  // Find export statements
  const exportRegex = /export\s+(default\s+)?(?:const|function|class)?\s*(\w+)/g;
  let match;
  while ((match = exportRegex.exec(content)) !== null) {
    if (match[1]) { // default
      exportNames.push('default');
      if (match[2]) componentName = match[2];
    } else {
      exportNames.push(match[2]);
      if (!componentName) componentName = match[2];
    }
  }

  // Find component function/class
  const funcRegex = /(?:export\s+)?(?:const|function)\s+(\w+)\s*(?:\(|:)/;
  const funcMatch = content.match(funcRegex);
  if (funcMatch && !componentName) {
    componentName = funcMatch[1];
  }

  // Find props interface
  const propsRegex = /interface\s+(\w+Props)/;
  const propsMatch = content.match(propsRegex);
  if (propsMatch) {
    props = { interface: propsMatch[1] };
  }

  return {
    componentName,
    exportNames,
    props
  };
}

function processDir(dir) {
  const results = [];
  const files = fs.readdirSync(dir, { recursive: true });
  for (const file of files) {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isFile()) {
        const relativePath = path.relative('.', filePath);
        const { componentName, exportNames, props } = parseTsxFile(filePath);
        const gitInfo = getGitInfo(relativePath);
        results.push({
          path: relativePath,
          componentName,
          exportNames,
          props,
          lastCommit: gitInfo
        });
      }
    }
  }
  return results;
}

const pages = processDir(adminPagesDir);
const components = processDir(adminComponentsDir);

const inventory = {
  pages,
  components
};

fs.writeFileSync('inventory.json', JSON.stringify(inventory, null, 2));
console.log('Inventory generated: inventory.json');