# IntelliSchool Startup Script (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    INTELLISCHOOL STARTUP SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Please install Python first." -ForegroundColor Red
    exit 1
}

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting IntelliSchool services..." -ForegroundColor Yellow
Write-Host ""

# Start Backend Server
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Green
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd backend && python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload" -WindowStyle Normal

# Wait for backend to start
Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Start Frontend
Write-Host "🌐 Starting Frontend..." -ForegroundColor Green
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd frontend && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    SERVICES STARTING..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Backend: http://localhost:8000" -ForegroundColor Blue
Write-Host "🎨 Frontend: http://localhost:3000" -ForegroundColor Blue
Write-Host "📚 API Docs: http://localhost:8000/docs" -ForegroundColor Blue
Write-Host ""

# Wait a bit more for services to fully start
Write-Host "⏳ Waiting for services to fully start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Open applications
Write-Host "🌐 Opening IntelliSchool..." -ForegroundColor Green
Start-Process "http://localhost:3000"
Start-Process "http://localhost:8000/docs"

Write-Host ""
Write-Host "🎉 IntelliSchool is starting up!" -ForegroundColor Green
Write-Host "Check the opened command windows for any errors." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this startup script..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
