# Poppler Installation Guide for Windows

## Problem
The PDF to image conversion feature requires Poppler utilities to be installed on your system. The error message indicates that Poppler is not found in your system PATH.

## Solution

### Option 1: Manual Installation (Recommended)

1. **Download Poppler for Windows:**
   - Go to: https://github.com/oschwartz10612/poppler-windows/releases/
   - Download the latest release (e.g., `Release-23.08.0-0.zip`)

2. **Extract Poppler:**
   - Extract the downloaded ZIP file to `C:\poppler\`
   - Your directory structure should look like:
     ```
     C:\poppler\
     ├── bin\
     │   ├── pdftoppm.exe
     │   ├── pdftotext.exe
     │   └── ... (other utilities)
     ├── include\
     └── lib\
     ```

3. **Add to System PATH:**
   - Open System Properties → Advanced → Environment Variables
   - Under "System Variables", find and select "Path", then click "Edit"
   - Click "New" and add: `C:\poppler\bin`
   - Click "OK" to save

4. **Restart your terminal/IDE:**
   - Close and reopen your command prompt/PowerShell
   - Restart your IDE (VS Code, PyCharm, etc.)

### Option 2: Using Conda (If you have Anaconda/Miniconda)

```bash
conda install -c conda-forge poppler
```

### Option 3: Using Chocolatey (If you have Chocolatey installed)

```bash
choco install poppler
```

## Verification

After installation, verify that Poppler is working:

```bash
# Test if pdftoppm is available
pdftoppm -h

# Test Python integration
python -c "from pdf2image import convert_from_path; print('Poppler is working!')"
```

## Troubleshooting

### If you still get errors:

1. **Check PATH:**
   ```bash
   echo $env:PATH  # PowerShell
   echo %PATH%     # Command Prompt
   ```
   Make sure `C:\poppler\bin` is in the output.

2. **Test directly:**
   ```bash
   C:\poppler\bin\pdftoppm.exe -h
   ```

3. **Restart everything:**
   - Close all terminals and IDEs
   - Restart your computer if necessary

### Alternative: Use Docker

If you're having persistent issues, you can run the backend in Docker with Poppler pre-installed:

```dockerfile
FROM python:3.11-slim

# Install Poppler
RUN apt-get update && apt-get install -y poppler-utils

# ... rest of your Dockerfile
```

Once Poppler is installed, the PDF upload and conversion feature will work correctly.
