param(
    [string]$RemoteUser = "root",
    [string]$RemoteHost = "152.53.191.111",
    [string]$RemotePath = "/var/www/drawstep/backend",
    [string]$Pm2Process = "drawstep-backend"
)

$itemsToUpload = @(
    "server.js",
    "routes",
    "admin/js",
    "admin/index.html",
    "package.json"
)

if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Error "scp command not found. Install OpenSSH client or use PowerShell's built-in scp equivalent first."
    exit 1
}

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Error "ssh command not found. Install OpenSSH client first."
    exit 1
}

$target = "${RemoteUser}@${RemoteHost}:${RemotePath}"

foreach ($item in $itemsToUpload) {
    if (-not (Test-Path $item)) {
        Write-Warning "Skipping missing item: $item"
        continue
    }

    Write-Host "Uploading $item ..." -ForegroundColor Cyan

    $scpArgs = @('-r', $item, "$target/")
    scp @scpArgs

    if ($LASTEXITCODE -ne 0) {
        Write-Error "scp failed for $item"
        exit $LASTEXITCODE
    }
}

Write-Host "Restarting remote PM2 process '$Pm2Process' ..." -ForegroundColor Cyan
ssh "$RemoteUser@$RemoteHost" "pm2 restart $Pm2Process"

if ($LASTEXITCODE -ne 0) {
    Write-Warning "Remote restart command exited with code $LASTEXITCODE"
} else {
    Write-Host "Deployment complete." -ForegroundColor Green
}
