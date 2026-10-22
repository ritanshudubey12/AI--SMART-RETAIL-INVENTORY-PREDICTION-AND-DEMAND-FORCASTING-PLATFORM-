@echo off
title OmniStock AI - Start All Servers
echo ========================================================
echo Starting AI Smart Retail Inventory Platform
echo ========================================================

echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "OmniStock Backend" cmd /k "cd /d %~dp0backend && C:\Users\Ritu\python314\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul

echo Starting Vite React Frontend on http://localhost:5173 ...
start "OmniStock Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo Platform is online!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://127.0.0.1:8000/docs
echo ========================================================
pause

