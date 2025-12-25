@echo off
echo 🔄 Starting backup...
git add .
git commit -m "daily: Work progress %date% %time%"
git push
echo ✅ Backup complete!
pause