param(
    [int]$Port = 4387
)

$ErrorActionPreference = 'Stop'
$project = $PSScriptRoot
# Accept a backend entry inside this project, never an unrelated Node listener.
$entryPattern = '(?:^|\s)"?' + [regex]::Escape($project) +
    '\\(?:[A-Za-z0-9_-]+\\)*server\.js"?(?=\s|$)'
$logs = Join-Path $project 'logs'
$pidFile = Join-Path $logs 'browser-backend.pid'

function Get-BackendProcess([int]$ProcessId) {
    if ($ProcessId -le 0) { return $null }
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" `
        -ErrorAction SilentlyContinue
    if (-not $process -or $process.Name -ne 'node.exe') { return $null }
    if (-not $process.CommandLine -or $process.CommandLine -notmatch $entryPattern) {
        return $null
    }
    return $process
}

$stopped = $false
if (Test-Path -LiteralPath $pidFile -PathType Leaf) {
    $savedPid = 0
    $rawPid = Get-Content -LiteralPath $pidFile -Raw
    if ([int]::TryParse($rawPid.Trim(), [ref]$savedPid)) {
        $process = Get-BackendProcess $savedPid
        if ($process) {
            Stop-Process -Id $process.ProcessId -Force
            $stopped = $true
        }
    }
    Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1
if ($listener) {
    $process = Get-BackendProcess ([int]$listener.OwningProcess)
    if (-not $process) {
        throw "Port $Port is used by another process; it was not stopped."
    }
    Stop-Process -Id $process.ProcessId -Force
    $stopped = $true
}

if ($stopped) {
    Write-Host "Backend stopped on port $Port."
} else {
    Write-Host "No backend from this project was running on port $Port."
}
