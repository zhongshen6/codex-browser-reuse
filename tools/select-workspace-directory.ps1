param(
    [string]$InitialDirectory
)

$ErrorActionPreference = 'Stop'
# Emit UTF-8 JSON so paths with non-ASCII directory names survive execFile.
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
# This chooses a backend path, not a directory on a remote browser's device.
$dialog.Description = 'Codex projectless task folder'
$dialog.ShowNewFolderButton = $true
if (Test-Path -LiteralPath $InitialDirectory -PathType Container) {
    $dialog.SelectedPath = $InitialDirectory
}
try {
    $selected = $null
    if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $selected = $dialog.SelectedPath
    }
    # Cancellation is a null result, not an error and not an empty path.
    @{ path = $selected } | ConvertTo-Json -Compress
} finally {
    $dialog.Dispose()
}
