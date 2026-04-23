@echo off
setlocal

set IMAGE_NAME=go-home
set OUTPUT_DIR=go-home-installer

echo [1/4] Building Docker image...
docker build -t %IMAGE_NAME% .
if errorlevel 1 ( echo Build failed. & pause & exit /b 1 )

echo [2/4] Exporting image to tar...
if not exist %OUTPUT_DIR% mkdir %OUTPUT_DIR%
docker save -o %OUTPUT_DIR%\go-home-image.tar %IMAGE_NAME%
if errorlevel 1 ( echo Export failed. & pause & exit /b 1 )

echo [3/4] Copying data and config...
copy data.json %OUTPUT_DIR%\data.json >nul

echo [4/4] Writing installer...
(
echo @echo off
echo setlocal
echo.
echo set /p INSTALL_PORT="Enter port to run on [default: 3002]: "
echo if "%%INSTALL_PORT%%"=="" set INSTALL_PORT=3002
echo.
echo set /p DATA_PATH="Enter full path for data storage [default: %cd%\data]: "
echo if "%%DATA_PATH%%"=="" set DATA_PATH=%cd%\data
echo.
echo if not exist "%%DATA_PATH%%" mkdir "%%DATA_PATH%%"
echo copy /Y data.json "%%DATA_PATH%%\data.json" ^>nul
echo.
echo echo Loading Docker image ^(this may take a minute^)...
echo docker load -i go-home-image.tar
echo if errorlevel 1 ^( echo Docker load failed. ^& pause ^& exit /b 1 ^)
echo.
echo echo Starting container...
echo docker rm -f go-home 2^>nul
echo docker run -d --name go-home --restart unless-stopped -p %%INSTALL_PORT%%:3000 -v "%%DATA_PATH%%\data.json:/app/data.json" go-home
echo if errorlevel 1 ^( echo Container start failed. ^& pause ^& exit /b 1 ^)
echo.
echo echo.
echo echo Done! Go-Home is running at http://localhost:%%INSTALL_PORT%%
echo echo Data stored at: %%DATA_PATH%%
echo echo.
echo echo To stop:    docker stop go-home
echo echo To restart: docker start go-home
echo echo To remove:  docker rm -f go-home
echo pause
) > %OUTPUT_DIR%\install.bat

echo.
echo Installer package ready in: %OUTPUT_DIR%\
echo Copy the entire '%OUTPUT_DIR%' folder to the target machine and run install.bat
echo.
pause
