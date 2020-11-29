@echo off
cd /D "%~dp0"

:loop
@echo %1
node index.js %1
shift
if not "%~1"=="" goto loop

pause