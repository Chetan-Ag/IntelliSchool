# 🚀 IntelliSchool Quick Start Guide

## **Daily Execution - Choose Your Method:**

### **Method 1: One-Click Startup (Recommended)**
1. **Double-click** `start_intellischool.bat` (Windows)
2. **Right-click** `start_intellischool.ps1` → "Run with PowerShell"
3. **Wait** for both services to start
4. **Use** the application!

### **Method 2: Manual Startup**
1. **Open 2 terminal windows**
2. **Terminal 1 (Backend):**
   ```bash
   cd backend
   python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```
3. **Terminal 2 (Frontend):**
   ```bash
   cd frontend
   npm run dev
   ```

### **Method 3: Using Python Script**
```bash
python start_intellischool.py
```

---

## **🌐 Access Points:**

- **Frontend App**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

---

## **✅ What Should Happen:**

1. **Backend starts** → Shows "Uvicorn running on http://0.0.0.0:8000"
2. **Frontend starts** → Shows "Local: http://localhost:3000"
3. **Browser opens** → IntelliSchool application loads
4. **API docs open** → Swagger documentation

---

## **🔧 Troubleshooting:**

### **If Backend Won't Start:**
- Check if port 8000 is free: `netstat -an | findstr :8000`
- Kill process: `taskkill /F /PID <PID>`
- Restart terminal

### **If Frontend Won't Start:**
- Check if port 3000 is free: `netstat -an | findstr :3000`
- Kill process: `taskkill /F /PID <PID>`
- Restart terminal

### **If Models Not Found:**
- Run: `python backend/train.py --quick --trials 5`
- Wait for training to complete
- Restart backend

---

## **📁 Project Structure:**
```
IntelliSchool/
├── start_intellischool.bat     ← Double-click to start
├── start_intellischool.ps1     ← PowerShell startup
├── start_intellischool.py      ← Python startup script
├── backend/                    ← FastAPI server
├── frontend/                   ← Next.js app
├── models/                     ← Trained ML models
├── Data/                       ← School data CSV files
└── reports/                    ← Training reports
```

---

## **🎯 Daily Workflow:**

1. **Start** the project using any method above
2. **Use** the web interface at http://localhost:3000
3. **Input** school data or upload CSV files
4. **Get** AI-powered infrastructure assessments
5. **View** compliance reports and recommendations
6. **Export** results as needed

---

## **💡 Pro Tips:**

- **Keep both terminals open** to see any errors
- **Use the batch file** for quick daily startup
- **Check the health endpoint** if something seems wrong
- **The backend must start first** before the frontend
- **Models are already trained** - no need to retrain daily

---

**🎉 You're all set! IntelliSchool will revolutionize your school infrastructure assessment workflow!**
