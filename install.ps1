param(
    [switch]$Start,
    [int]$Port = 4387
)

$ErrorActionPreference = 'Stop'
$project = $PSScriptRoot

# The project already contains dependencies; setup only verifies local files.
. (Join-Path $project 'tools\bundled-runtime.ps1')
$node = Get-BundledNodePath -ProjectPath $project
Write-Host "Bundled dependencies verified: $node"
Write-Host 'Run .\start-backend.ps1 to start the browser backend.'
if ($Start) {
    & (Join-Path $project 'start-backend.ps1') -Port $Port
}
