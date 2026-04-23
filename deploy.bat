@echo off
echo === Go-Home Deploy ===

REM Download mkcert if not present
if not exist "mkcert.exe" (
  echo Downloading mkcert...
  curl -L -o mkcert.exe https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v1.4.4-windows-amd64.exe
  echo mkcert downloaded.
)

REM Generate certs (includes hostname for LAN access)
echo Generating certificates...
mkcert.exe -install
if not exist certs mkdir certs
del /q certs\cert.pem certs\key.pem 2>nul
del /q certs\localhost*.pem 2>nul
pushd certs
..\mkcert.exe localhost 127.0.0.1 LSFO-000J7HMXC4
for %%f in (localhost*-key.pem) do rename "%%f" key.pem
for %%f in (localhost*.pem) do rename "%%f" cert.pem
popd
echo Certificates created.

echo Starting with Docker Compose...
docker-compose down
docker-compose build
docker-compose up -d

echo Patching entrypoint...
docker stop go-home-bookmark-1
docker cp docker-entrypoint.sh go-home-bookmark-1:/app/docker-entrypoint.sh
docker cp .next\standalone\.next\server\app\api\backup\route.js go-home-bookmark-1:/app/.next/server/app/api/backup/route.js
docker start go-home-bookmark-1
docker commit go-home-bookmark-1 go-home-bookmark:latest
echo Patch applied and committed.

echo.
echo Done! App running at https://localhost:8443
echo.
echo To view logs: docker-compose logs -f
echo To stop:      docker-compose down
pause
