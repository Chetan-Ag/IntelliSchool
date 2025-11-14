@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    INTELLISCHOOL                            ║
echo ║              AI-Powered School Infrastructure Assessment    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🔧 Automatic Dependency Installation & Setup
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Running with administrator privileges
) else (
    echo ⚠️  Not running as administrator. Some installations may fail.
    echo    Right-click this file and select "Run as administrator" for best results.
    echo.
    pause
)

:: Check Python installation
echo.
echo 🔍 Checking Python installation...
python --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Python is already installed
    python --version
) else (
    echo ❌ Python not found. Installing Python...
    echo.
    echo 📥 Downloading Python 3.11 (recommended version)...
    
    :: Download Python installer
    powershell -Command "& {Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe' -OutFile 'python_installer.exe'}"
    
    if exist python_installer.exe (
        echo 📦 Installing Python...
        echo ⚠️  IMPORTANT: Check "Add Python to PATH" during installation!
        echo.
        python_installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
        echo.
        echo ⏳ Waiting for Python installation to complete...
        timeout /t 30 /nobreak >nul
        
        :: Clean up installer
        del python_installer.exe
        
        :: Refresh environment variables
        call refreshenv.cmd >nul 2>&1
        if not exist refreshenv.cmd (
            echo 🔄 Refreshing environment variables...
            set PATH=%PATH%;C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311;C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311\Scripts
        )
        
        echo ✅ Python installation completed
    ) else (
        echo ❌ Failed to download Python installer
        echo    Please manually install Python from https://python.org
        pause
        exit /b 1
    )
)

:: Check Node.js installation
echo.
echo 🔍 Checking Node.js installation...
node --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Node.js is already installed
    node --version
) else (
    echo ❌ Node.js not found. Installing Node.js...
    echo.
    echo 📥 Downloading Node.js LTS version...
    
    :: Download Node.js installer
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi' -OutFile 'nodejs_installer.msi'}"
    
    if exist nodejs_installer.msi (
        echo 📦 Installing Node.js...
        msiexec /i nodejs_installer.msi /quiet /norestart
        echo.
        echo ⏳ Waiting for Node.js installation to complete...
        timeout /t 30 /nobreak >nul
        
        :: Clean up installer
        del nodejs_installer.msi
        
        :: Refresh environment variables
        call refreshenv.cmd >nul 2>&1
        if not exist refreshenv.cmd (
            echo 🔄 Refreshing environment variables...
            set PATH=%PATH%;C:\Program Files\nodejs
        )
        
        echo ✅ Node.js installation completed
    ) else (
        echo ❌ Failed to download Node.js installer
        echo    Please manually install Node.js from https://nodejs.org
        pause
        exit /b 1
    )
)

:: Verify installations
echo.
echo 🔍 Verifying installations...

python --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Python verification successful
) else (
    echo ❌ Python verification failed. Please restart your computer and try again.
    pause
    exit /b 1
)

node --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Node.js verification successful
) else (
    echo ❌ Node.js verification failed. Please restart your computer and try again.
    pause
    exit /b 1
)

:: Install Python dependencies
echo.
echo 📦 Installing Python dependencies...
echo.

:: Upgrade pip first
python -m pip install --upgrade pip

:: Install required packages
echo Installing FastAPI and web framework...
pip install fastapi uvicorn

echo Installing data science packages...
pip install pandas numpy scikit-learn

echo Installing machine learning packages...
pip install xgboost lightgbm

echo Installing utility packages...
pip install joblib shap matplotlib seaborn

echo Installing additional packages...
pip install python-multipart aiofiles

:: Try to install from requirements.txt if it exists
if exist requirements.txt (
    echo.
    echo 📋 Installing from requirements.txt...
    pip install -r requirements.txt
)

:: Install frontend dependencies
echo.
echo 📦 Installing frontend dependencies...
echo.

:: Navigate to frontend directory
if exist frontend (
    cd frontend
    
    echo Installing Node.js packages...
    npm install
    
    if %errorLevel% == 0 (
        echo ✅ Frontend dependencies installed successfully
    ) else (
        echo ❌ Failed to install frontend dependencies
        echo    Trying with force flag...
        npm install --force
    )
    
    cd ..
) else (
    echo ⚠️  Frontend directory not found
)

:: Create startup scripts
echo.
echo 🚀 Creating startup scripts...
echo.

:: Create backend startup script
echo @echo off > start_backend.bat
echo echo Starting IntelliSchool Backend... >> start_backend.bat
echo cd backend >> start_backend.bat
echo python app.py >> start_backend.bat
echo pause >> start_backend.bat

:: Create frontend startup script
echo @echo off > start_frontend.bat
echo echo Starting IntelliSchool Frontend... >> start_frontend.bat
echo cd frontend >> start_frontend.bat
echo npm run dev >> start_frontend.bat
echo pause >> start_frontend.bat

:: Create main startup script
echo @echo off > start_intellischool.bat
echo echo Starting IntelliSchool... >> start_intellischool.bat
echo echo. >> start_intellischool.bat
echo echo Starting Backend Server... >> start_intellischool.bat
echo start "IntelliSchool Backend" cmd /k "cd backend ^&^& python app.py" >> start_intellischool.bat
echo timeout /t 3 /nobreak ^>nul >> start_intellischool.bat
echo echo Starting Frontend Server... >> start_intellischool.bat
echo start "IntelliSchool Frontend" cmd /k "cd frontend ^&^& npm run dev" >> start_intellischool.bat
echo echo. >> start_intellischool.bat
echo echo 🎉 IntelliSchool is starting up! >> start_intellischool.bat
echo echo. >> start_intellischool.bat
echo echo 📱 Open your browser and go to: http://localhost:3000 >> start_intellischool.bat
echo echo. >> start_intellischool.bat
echo echo ⏳ Waiting for services to start... >> start_intellischool.bat
echo timeout /t 10 /nobreak >> start_intellischool.bat
echo echo. >> start_intellischool.bat
echo echo 🌐 Opening IntelliSchool in your default browser... >> start_intellischool.bat
echo start http://localhost:3000 >> start_intellischool.bat
echo echo. >> start_intellischool.bat
echo echo ✅ IntelliSchool is ready! >> start_intellischool.bat
echo pause >> start_intellischool.bat

echo ✅ Startup scripts created successfully

:: Final verification
echo.
echo 🔍 Final verification...
echo.

:: Check if all required packages are installed
python -c "import fastapi, pandas, sklearn, xgboost, joblib; print('✅ All Python packages verified')" 2>nul
if %errorLevel% == 0 (
    echo ✅ All Python packages are properly installed
) else (
    echo ⚠️  Some Python packages may not be properly installed
)

:: Check if frontend dependencies are ready
if exist frontend\node_modules (
    echo ✅ Frontend dependencies are ready
) else (
    echo ⚠️  Frontend dependencies may not be properly installed
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🎉 SETUP COMPLETE! 🎉                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 📋 What was installed:
echo    ✅ Python 3.11+ with all required packages
echo    ✅ Node.js LTS with npm
echo    ✅ All Python dependencies (FastAPI, pandas, scikit-learn, etc.)
echo    ✅ All frontend dependencies
echo    ✅ Startup scripts for easy launching
echo.
echo 🚀 How to start IntelliSchool:
echo    1. Double-click "start_intellischool.bat" (recommended)
echo    2. Or run "start_backend.bat" and "start_frontend.bat" separately
echo.
echo 🌐 Access the application:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8000
echo.
echo 📚 Documentation:
echo    API Docs: http://localhost:8000/docs
echo    README: Check the README.md file
echo.
echo ⚠️  Important Notes:
echo    - Make sure ports 3000 and 8000 are not in use
echo    - Run as administrator if you encounter permission issues
echo    - Restart your computer if some components don't work
echo.
echo 🎯 Ready to analyze school infrastructure with AI!
echo.
pause
