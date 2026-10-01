param(
    [int]$Port = 4387
)

$ErrorActionPreference = 'Stop'
$project = $PSScriptRoot

# Restart is deliberately composed from the same safe stop/start operations
# used by normal maintenance, so PID and port checks cannot diverge.
& (Join-Path $project 'stop-backend.ps1') -Port $Port
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& (Join-Path $project 'start-backend.ps1') -Port $Port
exit $LASTEXITCODE
