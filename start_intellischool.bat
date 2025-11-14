@echo off
echo.
echo ========================================
echo    INTELLISCHOOL STARTUP SCRIPT
echo ========================================
echo.

echo Starting Backend Server...
start "IntelliSchool Backend" cmd /k "cd backend && python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend...
start "IntelliSchool Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo    SERVICES STARTING...
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to open the application...
pause > nul

start http://localhost:3000
start http://localhost:8000/docs

echo.
echo IntelliSchool is starting up!
echo Check the opened command windows for any errors.
echo.
pause
