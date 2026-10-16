function Get-BundledNodePath {
    param([string]$ProjectPath = (Split-Path -Parent $PSScriptRoot))

    # This helper lives under tools, so its default project is the parent directory.
    # A private executable is used even when the system PATH contains another Node.
    $node = Join-Path $ProjectPath 'runtime\node\node.exe'
    if (-not (Test-Path -LiteralPath $node -PathType Leaf)) {
        throw 'Bundled Node is missing. Restore the complete project directory.'
    }
    # Validate executable bytes before running a damaged or substituted runtime.
    $manifest = Get-Content -LiteralPath (Join-Path $ProjectPath 'runtime\dependencies.json') -Raw |
        ConvertFrom-Json
    $hash = (Get-FileHash -LiteralPath $node -Algorithm SHA256).Hash
    if ($hash -ne $manifest.node.sha256) {
        throw 'Bundled Node checksum mismatch. Restore runtime\node from the project.'
    }
    $details = & $node (Join-Path $ProjectPath 'tools\verify-dependencies.js')
    if ($LASTEXITCODE -ne 0) {
        throw "Bundled dependencies are incomplete or incompatible. $details"
    }
    # Only return the executable path; diagnostic stdout is not part of this API.
    return [IO.Path]::GetFullPath($node)
}
