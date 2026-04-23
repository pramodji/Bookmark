@echo off
cd /d c:\Source\Projects\Go-Home

git init
git add .
git commit -m "Initial commit - Bookmark productivity app"
git branch -M main
git remote add origin https://github.com/pramodji/Bookmark.git
git push -u origin main

echo.
echo Done! Code pushed to GitHub.
pause
