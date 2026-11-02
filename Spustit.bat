@echo off
rem Spusti Quest Spanish: pri prvnim spusteni stahne balicky, pak otevre aplikaci v prohlizeci.
rem Aplikace bezi, dokud je toto okno otevrene.
cd /d "%~dp0"
if not exist node_modules call npm.cmd install
start "" http://localhost:5173
call npm.cmd run dev
