/**
 * Setup Verification Script
 * Run this to check if your environment is configured correctly
 * Usage: node check-setup.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✓' : '✗';
  const color = exists ? 'green' : 'red';
  log(`${status} ${description}: ${exists ? 'Found' : 'Missing'}`, color);
  return exists;
}

function checkDirectory(dirPath, description) {
  const exists = fs.existsSync(dirPath);
  const status = exists ? '✓' : '✗';
  const color = exists ? 'green' : 'red';
  log(`${status} ${description}: ${exists ? 'Found' : 'Missing'}`, color);
  return exists;
}

function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  const isValid = major >= 18;
  const status = isValid ? '✓' : '✗';
  const color = isValid ? 'green' : 'red';
  log(`${status} Node.js version: ${version} ${isValid ? '(OK)' : '(Requires v18+)'}`, color);
  return isValid;
}

function readEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    return null;
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  return env;
}

function checkEnvVariables() {
  log('\n=== Environment Variables ===', 'cyan');
  
  const env = readEnvFile();
  
  if (!env) {
    log('✗ .env file not found', 'red');
    log('  Create a .env file with VITE_API_BASE_URL=/api', 'yellow');
    return false;
  }
  
  log('✓ .env file exists', 'green');
  
  const requiredVars = ['VITE_API_BASE_URL'];
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    if (env[varName]) {
      log(`✓ ${varName}: ${env[varName]}`, 'green');
    } else {
      log(`✗ ${varName}: Not set`, 'red');
      allPresent = false;
    }
  });
  
  return allPresent;
}

function checkPackageJson() {
  const packagePath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packagePath)) {
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    log(`✓ Project: ${packageJson.name}`, 'green');
    return true;
  } catch (error) {
    log('✗ Error reading package.json', 'red');
    return false;
  }
}

async function main() {
  log('\n╔═══════════════════════════════════════════╗', 'blue');
  log('║   ChefSync Setup Verification Tool       ║', 'blue');
  log('╚═══════════════════════════════════════════╝\n', 'blue');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Check Node.js version
  log('=== System Requirements ===', 'cyan');
  if (checkNodeVersion()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Check package.json
  log('\n=== Project Files ===', 'cyan');
  if (checkPackageJson()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Check critical directories
  if (checkDirectory(path.join(__dirname, 'node_modules'), 'node_modules directory')) {
    results.passed++;
  } else {
    results.failed++;
    log('  Run: npm install', 'yellow');
  }

  if (checkDirectory(path.join(__dirname, 'src'), 'src directory')) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Check critical files
  if (checkFile(path.join(__dirname, 'vite.config.ts'), 'Vite config')) {
    results.passed++;
  } else {
    results.failed++;
  }

  if (checkFile(path.join(__dirname, 'tsconfig.json'), 'TypeScript config')) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Check environment variables
  if (checkEnvVariables()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Check source files
  log('\n=== Source Files ===', 'cyan');
  const criticalFiles = [
    'src/main.tsx',
    'src/routes/AppRoutes.tsx',
    'src/services/apiClient.ts',
    'src/context/AuthContext.tsx',
  ];

  criticalFiles.forEach(file => {
    if (checkFile(path.join(__dirname, file), file)) {
      results.passed++;
    } else {
      results.failed++;
    }
  });

  // Summary
  log('\n═══════════════════════════════════════════', 'blue');
  log('Summary:', 'cyan');
  log(`  Passed: ${results.passed}`, 'green');
  log(`  Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`  Warnings: ${results.warnings}`, results.warnings > 0 ? 'yellow' : 'green');
  log('═══════════════════════════════════════════\n', 'blue');

  if (results.failed === 0) {
    log('✓ All checks passed! You can run: npm run dev', 'green');
    process.exit(0);
  } else {
    log('✗ Some checks failed. Please fix the issues above.', 'red');
    log('\nQuick fixes:', 'yellow');
    log('  1. Run: npm install', 'yellow');
    log('  2. Create .env file with: VITE_API_BASE_URL=/api', 'yellow');
    log('  3. Ensure you\'re in the correct directory', 'yellow');
    log('  4. Check SETUP_GUIDE.md for detailed instructions', 'yellow');
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n✗ Error running checks: ${error.message}`, 'red');
  process.exit(1);
});

