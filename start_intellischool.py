#!/usr/bin/env python3
"""
IntelliSchool Startup Script

This script helps you start both the backend and frontend services for IntelliSchool.
It provides options to:
- Start the FastAPI backend
- Start the Next.js frontend
- Train the ML models
- Run tests
"""

import os
import sys
import subprocess
import time
import argparse
from pathlib import Path

def print_banner():
    """Print the IntelliSchool banner."""
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║                    INTELLISCHOOL                            ║
    ║              AI-Powered School Infrastructure Assessment    ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)

def check_dependencies():
    """Check if required dependencies are installed."""
    print("🔍 Checking dependencies...")
    
    # Check Python dependencies
    try:
        import fastapi
        import uvicorn
        import pandas
        import numpy
        import xgboost
        import lightgbm
        import optuna
        import shap
        print("✅ Python dependencies: OK")
    except ImportError as e:
        print(f"❌ Python dependency missing: {e}")
        print("   Run: pip install -r requirements.txt")
        return False
    
    # Check Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js: {result.stdout.strip()}")
        else:
            print("❌ Node.js not found")
            return False
    except FileNotFoundError:
        print("❌ Node.js not found. Please install Node.js 16+")
        return False
    
    # Check npm
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ npm: {result.stdout.strip()}")
        else:
            print("❌ npm not found")
            return False
    except FileNotFoundError:
        print("❌ npm not found")
        return False
    
    return True

def install_frontend_dependencies():
    """Install frontend dependencies if needed."""
    print("📦 Installing frontend dependencies...")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    # Check if node_modules exists
    node_modules = frontend_dir / "node_modules"
    if not node_modules.exists():
        print("   Installing npm packages...")
        try:
            subprocess.run(['npm', 'install'], cwd=frontend_dir, check=True)
            print("✅ Frontend dependencies installed")
        except subprocess.CalledProcessError:
            print("❌ Failed to install frontend dependencies")
            return False
    else:
        print("✅ Frontend dependencies already installed")
    
    return True

def start_backend():
    """Start the FastAPI backend server."""
    print("🚀 Starting IntelliSchool backend...")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return False
    
    # Check if models exist, if not suggest training
    models_dir = Path("models")
    if not models_dir.exists() or not list(models_dir.glob("*.joblib")):
        print("⚠️  No trained models found. Consider training first:")
        print("   python backend/train.py --quick")
    
    try:
        print("   Starting FastAPI server on http://localhost:8000")
        print("   API docs: http://localhost:8000/docs")
        print("   Press Ctrl+C to stop")
        
        subprocess.run([
            sys.executable, "-m", "uvicorn", "backend.app:app",
            "--reload", "--host", "0.0.0.0", "--port", "8000"
        ], cwd=Path.cwd(), check=True)
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start backend: {e}")
        return False
    except KeyboardInterrupt:
        print("\n🛑 Backend stopped")
    
    return True

def start_frontend():
    """Start the Next.js frontend."""
    print("🌐 Starting IntelliSchool frontend...")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    try:
        print("   Starting Next.js development server on http://localhost:3000")
        print("   Press Ctrl+C to stop")
        
        subprocess.run(['npm', 'run', 'dev'], cwd=frontend_dir, check=True)
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start frontend: {e}")
        return False
    except KeyboardInterrupt:
        print("\n🛑 Frontend stopped")
    
    return True

def train_models():
    """Train the ML models."""
    print("🤖 Training IntelliSchool ML models...")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return False
    
    try:
        print("   Starting model training...")
        print("   This may take several minutes depending on your system")
        
        subprocess.run([
            sys.executable, "backend/train.py", "--quick"
        ], cwd=Path.cwd(), check=True)
        
        print("✅ Model training completed")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Model training failed: {e}")
        return False
    
    return True

def run_tests():
    """Run the test suite."""
    print("🧪 Running IntelliSchool tests...")
    
    tests_dir = Path("tests")
    if not tests_dir.exists():
        print("❌ Tests directory not found")
        return False
    
    try:
        print("   Running test suite...")
        
        subprocess.run([
            sys.executable, "-m", "pytest", "tests/", "-v"
        ], cwd=Path.cwd(), check=True)
        
        print("✅ Tests completed")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Tests failed: {e}")
        return False
    
    return True

def show_status():
    """Show the current status of IntelliSchool services."""
    print("📊 IntelliSchool Status")
    print("=" * 50)
    
    # Check backend
    try:
        import requests
        response = requests.get("http://localhost:8000/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend: Running (http://localhost:8000)")
        else:
            print("⚠️  Backend: Responding but unhealthy")
    except:
        print("❌ Backend: Not running")
    
    # Check frontend
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend: Running (http://localhost:3000)")
        else:
            print("⚠️  Frontend: Responding but unhealthy")
    except:
        print("❌ Frontend: Not running")
    
    # Check models
    models_dir = Path("models")
    if models_dir.exists() and list(models_dir.glob("*.joblib")):
        print("✅ ML Models: Available")
    else:
        print("❌ ML Models: Not found (run training first)")
    
    # Check data
    data_dir = Path("Data")
    if data_dir.exists() and list(data_dir.glob("*.csv")):
        csv_files = list(data_dir.glob("*.csv"))
        print(f"✅ Data: {len(csv_files)} CSV files found")
    else:
        print("⚠️  Data: No CSV files found")

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description='IntelliSchool Startup Script')
    parser.add_argument('--backend', action='store_true', help='Start backend only')
    parser.add_argument('--frontend', action='store_true', help='Start frontend only')
    parser.add_argument('--train', action='store_true', help='Train ML models')
    parser.add_argument('--test', action='store_true', help='Run tests')
    parser.add_argument('--status', action='store_true', help='Show service status')
    parser.add_argument('--install', action='store_true', help='Install dependencies')
    
    args = parser.parse_args()
    
    print_banner()
    
    # Check dependencies first
    if not check_dependencies():
        print("\n❌ Dependency check failed. Please install missing dependencies.")
        return
    
    # Handle different modes
    if args.install:
        install_frontend_dependencies()
        return
    
    if args.status:
        show_status()
        return
    
    if args.train:
        train_models()
        return
    
    if args.test:
        run_tests()
        return
    
    if args.backend:
        start_backend()
        return
    
    if args.frontend:
        install_frontend_dependencies()
        start_frontend()
        return
    
    # Default: interactive mode
    print("🎯 Welcome to IntelliSchool!")
    print("Choose an option:")
    print("1. Start Backend (FastAPI)")
    print("2. Start Frontend (Next.js)")
    print("3. Train ML Models")
    print("4. Run Tests")
    print("5. Show Status")
    print("6. Install Dependencies")
    print("0. Exit")
    
    while True:
        try:
            choice = input("\nEnter your choice (0-6): ").strip()
            
            if choice == '0':
                print("👋 Goodbye!")
                break
            elif choice == '1':
                start_backend()
            elif choice == '2':
                install_frontend_dependencies()
                start_frontend()
            elif choice == '3':
                train_models()
            elif choice == '4':
                run_tests()
            elif choice == '5':
                show_status()
            elif choice == '6':
                install_frontend_dependencies()
            else:
                print("❌ Invalid choice. Please enter 0-6.")
                
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
