param(
    [switch]$Start,
    [int]$Port = 4387
)

$ErrorActionPreference = 'Stop'
$project = $PSScriptRoot

# Keep installation explicit: cloning the project must not silently download
# packages while the user is trying to diagnose a failed launch.
$node = Get-Command node.exe -ErrorAction SilentlyContinue
$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $node -or -not $npm) {
    throw 'Node.js 18 or newer with npm is required before installation.'
}
$nodeMajor = [int]((& $node.Source '--version').TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 18) {
    throw "Node.js 18 or newer is required. Found: $(& $node.Source '--version')"
}

if (-not (Test-Path -LiteralPath (Join-Path $project 'package.json') -PathType Leaf)) {
    throw "package.json was not found in $project"
}

# npm ci uses the committed lockfile, keeping a fresh machine reproducible.
& $npm.Source 'ci' '--ignore-scripts' '--no-audit' '--no-fund'
if ($LASTEXITCODE -ne 0) {
    throw "npm ci failed with exit code $LASTEXITCODE"
}

Write-Host 'Dependencies installed.'
Write-Host 'Run .\start-backend.ps1 to start the browser backend.'
if ($Start) {
    & (Join-Path $project 'start-backend.ps1') -Port $Port
}
