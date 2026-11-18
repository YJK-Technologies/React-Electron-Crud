@echo off
echo Building Windows .exe Installer with electron-builder...
npm run dist:win
echo.
echo Installer generated in release/ directory!
pause
