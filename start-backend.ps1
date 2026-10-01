param(
    [int]$Port = 4387
)

$ErrorActionPreference = 'Stop'
$project = $PSScriptRoot
$serverFile = Join-Path $project 'server.js'
$logs = Join-Path $project 'logs'
$pidFile = Join-Path $logs 'browser-backend.pid'
$stdoutFile = Join-Path $logs 'browser-backend.stdout.log'
$stderrFile = Join-Path $logs 'browser-backend.stderr.log'

if (-not (Test-Path -LiteralPath $serverFile -PathType Leaf)) {
    throw "Backend entry point not found: $serverFile"
}
New-Item -ItemType Directory -Path $logs -Force | Out-Null
$node = (Get-Command node.exe -ErrorAction Stop).Source
$basePath = & $node -e 'console.log(require(process.argv[1]).loadDeployment(process.argv[2]).basePath)' `
    (Join-Path $project 'deployment.js') $project
if ($LASTEXITCODE -ne 0) { throw 'Invalid deployment configuration.' }

function Get-Listener {
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1
}

if (Get-Listener) {
    throw "Port $Port is already in use. Use .\restart-backend.ps1 to replace this project's backend."
}

# The server performs the same lookup. Doing it here gives a visible error
# before a hidden background process can fail.
if (-not $env:CODEX_BIN) {
    $package = Get-AppxPackage -Name 'OpenAI.Codex*' -ErrorAction SilentlyContinue |
        Sort-Object Version -Descending |
        Select-Object -First 1
    if ($package) {
        $env:CODEX_BIN = Join-Path $package.InstallLocation 'app\resources\codex.exe'
    } elseif (-not (Get-Command codex.exe -ErrorAction SilentlyContinue)) {
        throw 'Codex CLI was not found. Install Codex, add codex.exe to PATH, or set CODEX_BIN.'
    }
}

$env:PORT = [string]$Port
$backend = Start-Process -FilePath $node -ArgumentList "`"$serverFile`"" `
    -WorkingDirectory $project -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput $stdoutFile -RedirectStandardError $stderrFile

$httpReady = $false
for ($attempt = 0; $attempt -lt 40; $attempt++) {
    Start-Sleep -Milliseconds 500
    if ($backend.HasExited) { break }
    try {
        $result = Invoke-WebRequest -Uri "http://127.0.0.1:$Port$($basePath)__bridge/events" -TimeoutSec 2
        if ($result.StatusCode -eq 200) {
            $httpReady = $true
            break
        }
    } catch {}
}

if (-not $httpReady) {
    if (-not $backend.HasExited) { Stop-Process -Id $backend.Id -Force }
    $details = if (Test-Path -LiteralPath $stderrFile) {
        (Get-Content -LiteralPath $stderrFile -Tail 12) -join [Environment]::NewLine
    } else { '' }
    throw "Backend did not become ready on port $Port. $details"
}

$appServerReady = $false
for ($attempt = 0; $attempt -lt 40; $attempt++) {
    Start-Sleep -Milliseconds 500
    try {
        $status = Invoke-RestMethod -Uri "http://127.0.0.1:$Port$($basePath)__bridge/status" -TimeoutSec 2
        if ($status.appServer -eq 'running') {
            $appServerReady = $true
            break
        }
    } catch {}
}

if (-not $appServerReady) {
    if (-not $backend.HasExited) { Stop-Process -Id $backend.Id -Force }
    $details = if (Test-Path -LiteralPath $stderrFile) {
        (Get-Content -LiteralPath $stderrFile -Tail 12) -join [Environment]::NewLine
    } else { '' }
    throw "Codex app-server did not become ready on port $Port. $details"
}

Set-Content -LiteralPath $pidFile -Value $backend.Id
Write-Host "Backend ready: http://127.0.0.1:$Port$basePath"
Write-Host "App Server: running"
Write-Host "PID: $($backend.Id)"
Write-Host "Logs: $stdoutFile ; $stderrFile"
