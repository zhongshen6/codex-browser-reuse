param([Parameter(Mandatory = $true)][string]$TargetPath)

$ErrorActionPreference = "Stop"
# The shell process can accept /select before its window exists. Poll the
# Shell.Windows collection for the requested selection, not a window title.
Add-Type -MemberDefinition @'
[System.Runtime.InteropServices.DllImport("user32.dll")]
public static extern bool ShowWindow(System.IntPtr hwnd, int command);
[System.Runtime.InteropServices.DllImport("user32.dll")]
public static extern bool SetForegroundWindow(System.IntPtr hwnd);
[System.Runtime.InteropServices.DllImport("user32.dll")]
public static extern System.IntPtr GetForegroundWindow();
[System.Runtime.InteropServices.DllImport("user32.dll")]
public static extern void keybd_event(byte key, byte scan, uint flags, System.UIntPtr extra);
'@ -Name NativeWindow -Namespace BrowserReuse

$deadline = (Get-Date).AddSeconds(5)
do {
  $shell = New-Object -ComObject Shell.Application
  $windows = @($shell.Windows() | Where-Object {
    try {
      $_.FullName -like "*explorer.exe" -and
      @($_.Document.SelectedItems() | Where-Object {
        [string]::Equals($_.Path, $TargetPath, [System.StringComparison]::OrdinalIgnoreCase)
      }).Count -gt 0
    } catch { $false }
  })
  if ($windows.Count -gt 0) {
    $handle = [IntPtr]$windows[-1].HWND
    [void][BrowserReuse.NativeWindow]::ShowWindow($handle, 9)
    if (-not [BrowserReuse.NativeWindow]::SetForegroundWindow($handle)) {
      # A background bridge process has no foreground permission. A balanced
      # Alt press grants it one activation attempt without changing focus keys.
      [BrowserReuse.NativeWindow]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero)
      [BrowserReuse.NativeWindow]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)
      [void][BrowserReuse.NativeWindow]::SetForegroundWindow($handle)
    }
    if ([BrowserReuse.NativeWindow]::GetForegroundWindow() -eq $handle) { exit 0 }
  }
  Start-Sleep -Milliseconds 200
} while ((Get-Date) -lt $deadline)

throw "Explorer did not select and foreground the requested file."
