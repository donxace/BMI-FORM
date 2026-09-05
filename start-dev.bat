@echo off
title BMI-FORM Dev Server
cd /d "C:\xampp\htdocs\BMI-FORM"
echo Waiting for MySQL to finish starting...
timeout /t 10 /nobreak >nul
npm run dev
