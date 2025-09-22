param(
    [string]$RemoteUser = "root",
    [string]$RemoteHost = "152.53.191.111",
    [string]$RemotePath = "/var/www/drawstep"
)

$itemsToUpload = @(
    @{ Source = "index.html"; Destination = "." },
    @{ Source = "contact.html"; Destination = "." },
    @{ Source = "datenschutz.html"; Destination = "." },
    @{ Source = "impressum.html"; Destination = "." },
    @{ Source = "disclaimer.html"; Destination = "." },
    @{ Source = "assets/css"; Destination = "assets" },
    @{ Source = "assets/js"; Destination = "assets" },
    @{ Source = "assets/fonts"; Destination = "assets" },
    @{ Source = "assets/images/icons"; Destination = "assets/images" },
    @{ Source = "assets/images/logos"; Destination = "assets/images" },
    @{ Source = "tools/lorcana-mulligan/index.html"; Destination = "tools/lorcana-mulligan" },
    @{ Source = "tools/lorcana-mulligan/assets/css"; Destination = "tools/lorcana-mulligan/assets" },
    @{ Source = "tools/lorcana-mulligan/assets/js"; Destination = "tools/lorcana-mulligan/assets" },
    @{ Source = "tools/lorcana-mulligan/assets/images/ui"; Destination = "tools/lorcana-mulligan/assets/images" },
    @{ Source = "tools/lorcana-mulligan/logo.png"; Destination = "tools/lorcana-mulligan" },
    @{ Source = "tools/lorcana-mulligan/data/cardImageMap.js"; Destination = "tools/lorcana-mulligan/data" },
    @{ Source = "tools/lorcana-mulligan/data/metadecks.json"; Destination = "tools/lorcana-mulligan/data" }
)

if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Error "scp command not found. Install OpenSSH client or use PowerShell's built-in scp equivalent first."
    exit 1
}

foreach ($item in $itemsToUpload) {
    $source = $item.Source
    $destination = $item.Destination

    if (-not (Test-Path $source)) {
        Write-Warning "Skipping missing item: $source"
        continue
    }

    $targetPath = if ($destination -eq '.' -or [string]::IsNullOrWhiteSpace($destination)) {
        $RemotePath
    } else {
        "$RemotePath/$destination"
    }

    $targetAddress = "{0}@{1}:{2}/" -f $RemoteUser, $RemoteHost, $targetPath

    Write-Host "Uploading $source -> $targetPath" -ForegroundColor Cyan
    $scpArgs = @('-r', $source, $targetAddress)
    scp @scpArgs

    if ($LASTEXITCODE -ne 0) {
        Write-Error "scp failed for $source"
        exit $LASTEXITCODE
    }
}

Write-Host "Frontend upload complete." -ForegroundColor Green
