#!/usr/bin/env python3
"""
AI Image Processing Service Starter
Simple script to start the FastAPI service with proper configuration
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    print("Installing Python packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ All packages installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install packages: {e}")
        return False
    return True

def start_service():
    """Start the FastAPI service"""
    print("Starting AI Image Processing Service...")
    print("🚀 Service will be available at: http://localhost:8000")
    print("📖 API docs will be available at: http://localhost:8000/docs")
    print("Press Ctrl+C to stop the service\n")
    
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\n👋 Service stopped by user")

if __name__ == "__main__":
    # Change to service directory
    service_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(service_dir)
    
    print("🤖 AI Image Processing Service")
    print("=" * 40)
    
    # Install requirements
    if install_requirements():
        start_service()
    else:
        print("❌ Failed to start service due to installation errors")
        sys.exit(1)