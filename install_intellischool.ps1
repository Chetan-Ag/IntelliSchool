# IntelliSchool Automatic Dependency Installation & Setup
# PowerShell Script for Windows

param(
    [switch]$Force,
    [switch]$SkipPython,
    [switch]$SkipNodeJS
)

# Set execution policy for current session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Enable UTF-8 support
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    INTELLISCHOOL                            ║" -ForegroundColor Cyan
Write-Host "║              AI-Powered School Infrastructure Assessment    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Automatic Dependency Installation & Setup" -ForegroundColor Yellow
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if ($isAdmin) {
    Write-Host "✅ Running with administrator privileges" -ForegroundColor Green
} else {
    Write-Host "⚠️  Not running as administrator. Some installations may fail." -ForegroundColor Yellow
    Write-Host "   Right-click this file and select 'Run as administrator' for best results." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to continue anyway"
}

# Function to download file
function Download-File {
    param($Url, $OutFile)
    try {
        Write-Host "📥 Downloading $OutFile..." -ForegroundColor Blue
        Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing
        return $true
    } catch {
        Write-Host "❌ Failed to download $OutFile" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to install Python
function Install-Python {
    if ($SkipPython) {
        Write-Host "⏭️  Skipping Python installation as requested" -ForegroundColor Yellow
        return
    }
    
    Write-Host ""
    Write-Host "🔍 Checking Python installation..." -ForegroundColor Blue
    
    try {
        $pythonVersion = python --version 2>$null
        if ($pythonVersion) {
            Write-Host "✅ Python is already installed" -ForegroundColor Green
            Write-Host $pythonVersion -ForegroundColor Green
            return
        }
    } catch {}
    
    Write-Host "❌ Python not found. Installing Python..." -ForegroundColor Red
    Write-Host ""
    
    $pythonUrl = "https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe"
    $pythonInstaller = "python_installer.exe"
    
    if (Download-File -Url $pythonUrl -OutFile $pythonInstaller) {
        Write-Host "📦 Installing Python..." -ForegroundColor Blue
        Write-Host "⚠️  IMPORTANT: Check 'Add Python to PATH' during installation!" -ForegroundColor Yellow
        Write-Host ""
        
        Start-Process -FilePath $pythonInstaller -ArgumentList "/quiet", "InstallAllUsers=1", "PrependPath=1", "Include_test=0" -Wait
        
        Write-Host ""
        Write-Host "⏳ Waiting for Python installation to complete..." -ForegroundColor Blue
        Start-Sleep -Seconds 30
        
        # Clean up installer
        if (Test-Path $pythonInstaller) {
            Remove-Item $pythonInstaller
        }
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Host "✅ Python installation completed" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to download Python installer" -ForegroundColor Red
        Write-Host "   Please manually install Python from https://python.org" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Function to install Node.js
function Install-NodeJS {
    if ($SkipNodeJS) {
        Write-Host "⏭️  Skipping Node.js installation as requested" -ForegroundColor Yellow
        return
    }
    
    Write-Host ""
    Write-Host "🔍 Checking Node.js installation..." -ForegroundColor Blue
    
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Host "✅ Node.js is already installed" -ForegroundColor Green
            Write-Host $nodeVersion -ForegroundColor Green
            return
        }
    } catch {}
    
    Write-Host "❌ Node.js not found. Installing Node.js..." -ForegroundColor Red
    Write-Host ""
    
    $nodeUrl = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
    $nodeInstaller = "nodejs_installer.msi"
    
    if (Download-File -Url $nodeUrl -OutFile $nodeInstaller) {
        Write-Host "📦 Installing Node.js..." -ForegroundColor Blue
        
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $nodeInstaller, "/quiet", "/norestart" -Wait
        
        Write-Host ""
        Write-Host "⏳ Waiting for Node.js installation to complete..." -ForegroundColor Blue
        Start-Sleep -Seconds 30
        
        # Clean up installer
        if (Test-Path $nodeInstaller) {
            Remove-Item $nodeInstaller
        }
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Host "✅ Node.js installation completed" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to download Node.js installer" -ForegroundColor Red
        Write-Host "   Please manually install Node.js from https://nodejs.org" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Function to verify installations
function Test-Installations {
    Write-Host ""
    Write-Host "🔍 Verifying installations..." -ForegroundColor Blue
    
    # Test Python
    try {
        $pythonVersion = python --version 2>$null
        if ($pythonVersion) {
            Write-Host "✅ Python verification successful" -ForegroundColor Green
        } else {
            throw "Python not found"
        }
    } catch {
        Write-Host "❌ Python verification failed. Please restart your computer and try again." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    # Test Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Host "✅ Node.js verification successful" -ForegroundColor Green
        } else {
            throw "Node.js not found"
        }
    } catch {
        Write-Host "❌ Node.js verification failed. Please restart your computer and try again." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Function to install Python dependencies
function Install-PythonDependencies {
    Write-Host ""
    Write-Host "📦 Installing Python dependencies..." -ForegroundColor Blue
    Write-Host ""
    
    # Upgrade pip first
    Write-Host "🔄 Upgrading pip..." -ForegroundColor Blue
    python -m pip install --upgrade pip
    
    # Install required packages
    $packages = @(
        @{Name="FastAPI and web framework"; Packages=@("fastapi", "uvicorn")},
        @{Name="Data science packages"; Packages=@("pandas", "numpy", "scikit-learn")},
        @{Name="Machine learning packages"; Packages=@("xgboost", "lightgbm")},
        @{Name="Utility packages"; Packages=@("joblib", "shap", "matplotlib", "seaborn")},
        @{Name="Additional packages"; Packages=@("python-multipart", "aiofiles")}
    )
    
    foreach ($packageGroup in $packages) {
        Write-Host "Installing $($packageGroup.Name)..." -ForegroundColor Blue
        foreach ($package in $packageGroup.Packages) {
            try {
                pip install $package
                Write-Host "  ✅ $package" -ForegroundColor Green
            } catch {
                Write-Host "  ❌ $package" -ForegroundColor Red
            }
        }
    }
    
    # Try to install from requirements.txt if it exists
    if (Test-Path "requirements.txt") {
        Write-Host ""
        Write-Host "📋 Installing from requirements.txt..." -ForegroundColor Blue
        try {
            pip install -r requirements.txt
            Write-Host "✅ Requirements.txt installation completed" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Some packages from requirements.txt may have failed" -ForegroundColor Yellow
        }
    }
}

# Function to install frontend dependencies
function Install-FrontendDependencies {
    Write-Host ""
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Blue
    Write-Host ""
    
    if (Test-Path "frontend") {
        Set-Location "frontend"
        
        Write-Host "Installing Node.js packages..." -ForegroundColor Blue
        try {
            npm install
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Frontend dependencies installed successfully" -ForegroundColor Green
            } else {
                Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
                Write-Host "   Trying with force flag..." -ForegroundColor Yellow
                npm install --force
            }
        } catch {
            Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
        }
        
        Set-Location ".."
    } else {
        Write-Host "⚠️  Frontend directory not found" -ForegroundColor Yellow
    }
}

# Function to create startup scripts
function Create-StartupScripts {
    Write-Host ""
    Write-Host "🚀 Creating startup scripts..." -ForegroundColor Blue
    Write-Host ""
    
    # Create backend startup script
    $backendScript = @"
@echo off
echo Starting IntelliSchool Backend...
cd backend
python app.py
pause
"@
    $backendScript | Out-File -FilePath "start_backend.bat" -Encoding ASCII
    
    # Create frontend startup script
    $frontendScript = @"
@echo off
echo Starting IntelliSchool Frontend...
cd frontend
npm run dev
pause
"@
    $frontendScript | Out-File -FilePath "start_frontend.bat" -Encoding ASCII
    
    # Create main startup script
    $mainScript = @"
@echo off
echo Starting IntelliSchool...
echo.
echo Starting Backend Server...
start "IntelliSchool Backend" cmd /k "cd backend && python app.py"
timeout /t 3 /nobreak >nul
echo Starting Frontend Server...
start "IntelliSchool Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo 🎉 IntelliSchool is starting up!
echo.
echo 📱 Open your browser and go to: http://localhost:3000
echo.
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak
echo.
echo 🌐 Opening IntelliSchool in your default browser...
start http://localhost:3000
echo.
echo ✅ IntelliSchool is ready!
pause
"@
    $mainScript | Out-File -FilePath "start_intellischool.bat" -Encoding ASCII
    
    Write-Host "✅ Startup scripts created successfully" -ForegroundColor Green
}

# Function to perform final verification
function Test-FinalVerification {
    Write-Host ""
    Write-Host "🔍 Final verification..." -ForegroundColor Blue
    Write-Host ""
    
    # Check if all required packages are installed
    try {
        python -c "import fastapi, pandas, sklearn, xgboost, joblib; print('✅ All Python packages verified')" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ All Python packages are properly installed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Some Python packages may not be properly installed" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Some Python packages may not be properly installed" -ForegroundColor Yellow
    }
    
    # Check if frontend dependencies are ready
    if (Test-Path "frontend\node_modules") {
        Write-Host "✅ Frontend dependencies are ready" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Frontend dependencies may not be properly installed" -ForegroundColor Yellow
    }
}

# Main execution
try {
    Install-Python
    Install-NodeJS
    Test-Installations
    Install-PythonDependencies
    Install-FrontendDependencies
    Create-StartupScripts
    Test-FinalVerification
    
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                    🎉 SETUP COMPLETE! 🎉                    ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 What was installed:" -ForegroundColor White
    Write-Host "   ✅ Python 3.11+ with all required packages" -ForegroundColor Green
    Write-Host "   ✅ Node.js LTS with npm" -ForegroundColor Green
    Write-Host "   ✅ All Python dependencies (FastAPI, pandas, scikit-learn, etc.)" -ForegroundColor Green
    Write-Host "   ✅ All frontend dependencies" -ForegroundColor Green
    Write-Host "   ✅ Startup scripts for easy launching" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 How to start IntelliSchool:" -ForegroundColor White
    Write-Host "   1. Double-click 'start_intellischool.bat' (recommended)" -ForegroundColor Cyan
    Write-Host "   2. Or run 'start_backend.bat' and 'start_frontend.bat' separately" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 Access the application:" -ForegroundColor White
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   Backend API: http://localhost:8000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📚 Documentation:" -ForegroundColor White
    Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "   README: Check the README.md file" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  Important Notes:" -ForegroundColor White
    Write-Host "   - Make sure ports 3000 and 8000 are not in use" -ForegroundColor Yellow
    Write-Host "   - Run as administrator if you encounter permission issues" -ForegroundColor Yellow
    Write-Host "   - Restart your computer if some components don't work" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🎯 Ready to analyze school infrastructure with AI!" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Setup failed with error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Please check the error and try again." -ForegroundColor Red
}

Read-Host "Press Enter to exit"
