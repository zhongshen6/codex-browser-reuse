param(
    [int]$Port = 4387
)

$ErrorActionPreference = 'Stop'
$project = $PSScriptRoot
$node = (Get-Command node.exe -ErrorAction Stop).Source
$basePath = & $node -e 'console.log(require(process.argv[1]).loadDeployment(process.argv[2]).basePath)' `
    (Join-Path $project 'deployment.js') $project
if ($LASTEXITCODE -ne 0) { throw 'Invalid deployment configuration.' }
$statusUrl = "http://127.0.0.1:$Port$($basePath)__bridge/status"
try {
    $status = Invoke-RestMethod -Uri $statusUrl -TimeoutSec 5
    $status | ConvertTo-Json -Depth 8
} catch {
    Write-Error "Backend status is unavailable at $statusUrl : $($_.Exception.Message)"
    exit 1
}
