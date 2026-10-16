$ErrorActionPreference = 'Stop'

# Resolve everything from the script location so the project remains movable.
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Node = Join-Path $ProjectRoot 'runtime\node\node.exe'
if (-not (Test-Path -LiteralPath $Node -PathType Leaf)) {
    throw 'Bundled Node runtime is missing.'
}

# Force a rebuild manually; startup also repairs missing or stale artifacts.
& $Node (Join-Path $PSScriptRoot 'build-frontend.js')
if ($LASTEXITCODE -ne 0) {
    throw 'Frontend build failed. The backend will use current uncompressed resources.'
}
