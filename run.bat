@echo off
title YOLOv8 Collaborative Annotation Server
echo =====================================================================
echo       Starting YOLOv8 Multi-User Collaborative Annotation Server
echo =====================================================================
echo.
python app.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo An error occurred. Ensure dependencies are installed via:
    echo pip install -r requirements.txt
    pause
)
