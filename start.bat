@echo off
echo.
echo =====================================
echo    QuickLocal Frontend Server
echo =====================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ package.json not found
    echo This should have been created automatically
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing development dependencies...
    npm install
)

REM Start the frontend server
echo.
echo 🚀 Starting QuickLocal Frontend Server...
echo 🌐 Frontend will be available at: http://localhost:3000
echo 🏪 Marketplace: http://localhost:3000/marketplace.html
echo 🔐 Admin Panel: http://localhost:3000/admin-dashboard.html
echo 💡 Press Ctrl+C to stop the server
echo.
echo ⚠️  Make sure your backend is running on http://localhost:10000
echo.

REM Check if live-server is installed globally, if not use local
where live-server >nul 2>&1
if errorlevel 1 (
    echo Using local live-server...
    npx live-server --port=3000 --open=/index.html --watch=./
) else (
    echo Using global live-server...
    live-server --port=3000 --open=/index.html --watch=./
)
