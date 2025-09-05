#!/usr/bin/env python3
"""
Google OAuth Setup Script for ChefSync
This script helps you set up Google OAuth credentials properly.
"""

import os
import sys
from pathlib import Path

def create_env_files():
    """Create environment files with proper Google OAuth configuration."""
    
    # Get the project root directory
    project_root = Path(__file__).parent
    
    # Frontend environment file
    frontend_env_path = project_root / "frontend" / ".env.local"
    frontend_env_content = """# Frontend Environment Variables
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_OAUTH_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
"""
    
    # Backend environment file
    backend_env_path = project_root / "backend" / ".env"
    backend_env_content = """# Backend Environment Variables
SECRET_KEY=django-insecure-3oo5lepmhh(qlf-m^s+ftjk=g0r7)h-jb$2vzu%1g7&jq0a32o
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173
FRONTEND_URL=http://localhost:8080
GOOGLE_OAUTH_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz123456
"""
    
    try:
        # Create frontend .env.local
        with open(frontend_env_path, 'w') as f:
            f.write(frontend_env_content)
        print(f"✅ Created {frontend_env_path}")
        
        # Create backend .env
        with open(backend_env_path, 'w') as f:
            f.write(backend_env_content)
        print(f"✅ Created {backend_env_path}")
        
        print("\n🎉 Environment files created successfully!")
        print("\n⚠️  IMPORTANT: The Google OAuth credentials are placeholder values.")
        print("   You need to replace them with real credentials from Google Cloud Console.")
        print("\n📋 Next steps:")
        print("1. Go to https://console.cloud.google.com/")
        print("2. Create a new project or select existing one")
        print("3. Enable Google+ API")
        print("4. Create OAuth 2.0 credentials")
        print("5. Replace the placeholder values in the .env files")
        print("6. Restart your servers")
        
    except Exception as e:
        print(f"❌ Error creating environment files: {e}")
        return False
    
    return True

def main():
    print("🔧 ChefSync Google OAuth Setup")
    print("=" * 40)
    
    if create_env_files():
        print("\n✅ Setup completed successfully!")
    else:
        print("\n❌ Setup failed. Please check the error messages above.")
        sys.exit(1)

if __name__ == "__main__":
    main()




