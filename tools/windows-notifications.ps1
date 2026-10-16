param(
    [ValidateSet('Host', 'Show', 'Hide', 'History')]
    [string]$Mode,
    [int]$Port = 4387,
    [string]$BasePath = '/',
    [int]$BackendPid = 0,
    [string]$PayloadBase64 = ''
)

$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = New-Object Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object Text.UTF8Encoding($false)
$appId = "CodexBrowserReuse.$Port"
$group = 'browser'
# Independent identity prevents Windows from activating the official Codex host.
$activatorClsid = '73CC2BB0-44B5-484D-8EC4-F0A059B24639'

# Windows desktop toasts need a Start-menu shortcut carrying the same AUMID.
# Register the shell identity before starting the activator; accepting Show()
# alone is not evidence that Windows actually presented a desktop banner.
function Ensure-NotificationRegistration {
    $startMenu = [Environment]::GetFolderPath('StartMenu')
    $programs = Join-Path $startMenu 'Programs'
    $shortcutPath = Join-Path $programs "Codex Browser $Port.lnk"
    [void](New-Item -ItemType Directory -Force -Path $programs)

    # Keep the shortcut stable across backend restarts so Windows retains the
    # notification application's identity and per-app banner preferences.
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = Join-Path $PSHOME 'powershell.exe'
    $shortcut.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command `"exit`""
    $shortcut.WorkingDirectory = $PSScriptRoot
    $shortcut.Description = 'Codex Browser notifications'
    $shortcut.IconLocation = "$(Join-Path $PSHOME 'powershell.exe'),0"
    $shortcut.Save()

    # IPropertyStore is the supported shell property path for setting the
    # System.AppUserModel.ID value on a .lnk file from Windows PowerShell.
    if (-not ('CodexBrowserReuseShellPropertyStore' -as [type])) {
        Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential)]
public struct CodexPropertyKey {
    public Guid FormatId;
    public uint PropertyId;
    public CodexPropertyKey(Guid formatId, uint propertyId) {
        FormatId = formatId;
        PropertyId = propertyId;
    }
}

[StructLayout(LayoutKind.Explicit)]
public struct CodexPropVariant {
    [FieldOffset(0)] public ushort VariantType;
    [FieldOffset(8)] public IntPtr Value;
}

[ComImport, Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99"),
 InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface CodexIPropertyStore {
    [PreserveSig] int GetCount(out uint count);
    [PreserveSig] int GetAt(uint index, out CodexPropertyKey key);
    [PreserveSig] int GetValue(ref CodexPropertyKey key, out CodexPropVariant value);
    [PreserveSig] int SetValue(ref CodexPropertyKey key, ref CodexPropVariant value);
    [PreserveSig] int Commit();
}

public static class CodexBrowserReuseShellPropertyStore {
    [DllImport("shell32.dll", CharSet = CharSet.Unicode, PreserveSig = true)]
    private static extern int SHGetPropertyStoreFromParsingName(
        string path,
        IntPtr bindContext,
        uint flags,
        ref Guid interfaceId,
        out CodexIPropertyStore store);

    public static void SetAppUserModelId(string path, string appId) {
        var iid = new Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99");
        CodexIPropertyStore store;
        var hr = SHGetPropertyStoreFromParsingName(path, IntPtr.Zero, 2, ref iid, out store);
        if (hr < 0) Marshal.ThrowExceptionForHR(hr);

        var key = new CodexPropertyKey(
            new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"), 5);
        var value = new CodexPropVariant {
            VariantType = 31, // VT_LPWSTR
            Value = Marshal.StringToCoTaskMemUni(appId)
        };
        try {
            hr = store.SetValue(ref key, ref value);
            if (hr < 0) Marshal.ThrowExceptionForHR(hr);
            hr = store.Commit();
            if (hr < 0) Marshal.ThrowExceptionForHR(hr);
        } finally {
            Marshal.FreeCoTaskMem(value.Value);
            Marshal.ReleaseComObject(store);
        }
    }
}
'@
    }
    [CodexBrowserReuseShellPropertyStore]::SetAppUserModelId($shortcutPath, $appId)
}

if ($Mode -eq 'Host') {
    # Registration belongs to host startup, not Show, Hide, or History. This
    # avoids rewriting the shortcut and compiling shell interop on every toast.
    Ensure-NotificationRegistration
    $classes = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey(
        "Software\Classes\AppUserModelId\$appId")
    $classes.SetValue('DisplayName', 'Codex Browser')
    $classes.SetValue('CustomActivator', "{$activatorClsid}")
    $classes.Close()
    # A new AUMID has no per-app notification preferences yet. Initialize
    # only missing values so later Windows Settings choices remain respected.
    $notificationSettings = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey(
        "Software\Microsoft\Windows\CurrentVersion\Notifications\Settings\$appId")
    foreach ($name in @('Enabled', 'ShowBanner', 'ShowInActionCenter')) {
        if ($null -eq $notificationSettings.GetValue($name, $null)) {
            $notificationSettings.SetValue($name, 1, [Microsoft.Win32.RegistryValueKind]::DWord)
        }
    }
    $notificationSettings.Close()
    $registration = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey(
        "Software\Classes\CLSID\{$activatorClsid}\LocalServer32")
    # The COM callback restarts this helper if Windows activates a queued toast.
    $exe = Join-Path $PSHOME 'powershell.exe'
    $registration.SetValue('', "`"$exe`" -NoProfile -NonInteractive -STA -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Mode Host -Port $Port -BackendPid $BackendPid")
    $registration.Close()

    # COM activation handles real button and reply input without opening a
    # browser for approval decisions. Only the open action launches a URL.
    Add-Type -ReferencedAssemblies System.Web.Extensions, System.Windows.Forms -TypeDefinition @'
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Web.Script.Serialization;
using System.Windows.Forms;

[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
public struct ToastInput {
    [MarshalAs(UnmanagedType.LPWStr)] public string Key;
    [MarshalAs(UnmanagedType.LPWStr)] public string Value;
}

[ComImport, Guid("53E31837-6600-4A81-9395-75CFFE746F94"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IToastActivation {
    [PreserveSig] int Activate(
        [MarshalAs(UnmanagedType.LPWStr)] string appId,
        [MarshalAs(UnmanagedType.LPWStr)] string arguments,
        [MarshalAs(UnmanagedType.LPArray, SizeParamIndex = 3)] ToastInput[] input,
        uint count);
}

[ComVisible(true), Guid("73CC2BB0-44B5-484D-8EC4-F0A059B24639"), ClassInterface(ClassInterfaceType.None)]
public class BrowserToastActivator : IToastActivation {
    public int Activate(string appId, string arguments, ToastInput[] input, uint count) {
        try {
            var json = new JavaScriptSerializer();
            var payload = json.Deserialize<System.Collections.Generic.Dictionary<string, object>>(arguments);
            if (input != null) foreach (var field in input)
                if (field.Key == "reply") payload["reply"] = field.Value;
            // All state changes go back to the loopback backend, never to Codex App.
            var request = (HttpWebRequest)WebRequest.Create(ToastHost.BaseUrl + "/__bridge/notifications/activate");
            request.Proxy = null;
            request.Method = "POST";
            request.ContentType = "application/json";
            request.Timeout = 15000;
            var bytes = Encoding.UTF8.GetBytes(json.Serialize(payload));
            using (var stream = request.GetRequestStream()) stream.Write(bytes, 0, bytes.Length);
            string text;
            using (var response = request.GetResponse())
            using (var reader = new StreamReader(response.GetResponseStream())) text = reader.ReadToEnd();
            var result = json.Deserialize<System.Collections.Generic.Dictionary<string, object>>(text);
            if (result.ContainsKey("openUrl")) {
                var url = result["openUrl"] as string;
                // The backend generates this URL; do not execute arbitrary activation arguments.
                if (url != null && url.StartsWith(ToastHost.BaseUrl + "/local/", StringComparison.Ordinal))
                    Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            return 0;
        } catch (Exception error) {
            Console.Error.WriteLine(error.ToString());
            return Marshal.GetHRForException(error);
        }
    }
}

[ComImport, Guid("00000001-0000-0000-C000-000000000046"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IToastFactory {
    [PreserveSig] int CreateInstance(IntPtr outer, ref Guid iid, out IntPtr instance);
    [PreserveSig] int LockServer(bool locked);
}

[ComVisible(true), ClassInterface(ClassInterfaceType.None)]
public class ToastFactory : IToastFactory {
    public int CreateInstance(IntPtr outer, ref Guid iid, out IntPtr instance) {
        instance = IntPtr.Zero;
        if (outer != IntPtr.Zero) return unchecked((int)0x80040110);
        var unknown = Marshal.GetIUnknownForObject(new BrowserToastActivator());
        try { return Marshal.QueryInterface(unknown, ref iid, out instance); }
        finally { Marshal.Release(unknown); }
    }
    public int LockServer(bool locked) { return 0; }
}

public static class ToastHost {
    public static string BaseUrl;
    private static ToastFactory factory;
    [DllImport("ole32.dll")] private static extern int CoRegisterClassObject(
        ref Guid clsid, [MarshalAs(UnmanagedType.IUnknown)] object factory, uint context, uint flags, out uint cookie);
    [DllImport("ole32.dll")] private static extern int CoRevokeClassObject(uint cookie);
    public static void Run(string baseUrl, int parentPid) {
        BaseUrl = baseUrl;
        factory = new ToastFactory();
        var clsid = new Guid("73CC2BB0-44B5-484D-8EC4-F0A059B24639");
        uint cookie;
        Marshal.ThrowExceptionForHR(CoRegisterClassObject(ref clsid, factory, 4, 1, out cookie));
        // A Windows message loop dispatches STA COM calls. The parent lease
        // prevents an orphaned notification host after a backend restart.
        var timer = new Timer { Interval = 3000 };
        timer.Tick += (sender, args) => {
            try { if (Process.GetProcessById(parentPid).HasExited) Application.Exit(); }
            catch { Application.Exit(); }
        };
        timer.Start();
        Console.WriteLine("NOTIFICATION_HOST_READY");
        Console.Out.Flush();
        try { Application.Run(); }
        finally { timer.Dispose(); CoRevokeClassObject(cookie); }
    }
}
'@
    # Native activation and returned conversation URLs share the configured mount.
    [ToastHost]::Run("http://127.0.0.1:$Port$($BasePath.TrimEnd('/'))", $BackendPid)
    exit
}

[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
# Load the XML projection before accessing Content on history notifications.
# Otherwise Windows PowerShell can project an existing toast's Content as null.
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] > $null
if ($Mode -eq 'History') {
    # Limit history to this application's identity, leaving official toasts untouched.
    # Enumerate WinRT directly: Count and indexing can project unexpectedly.
    # Expired history entries may have no Content; they cannot be activated.
    $history = [Windows.UI.Notifications.ToastNotificationManager]::History.GetHistory($appId)
    $items = @(foreach ($entry in $history) {
        if ($null -ne $entry.Content) {
            @{ tag = $entry.Tag; xml = $entry.Content.GetXml() }
        }
    })
    ConvertTo-Json -InputObject $items -Depth 6 -Compress
    exit
}

$payload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($PayloadBase64)) | ConvertFrom-Json
if ($Mode -eq 'Hide') {
    # History is a global static object, unlike the scoped toast notifier.
    # Without the application id, Remove silently targets PowerShell's
    # identity and leaves the browser's resolved approval in the center.
    try {
        [Windows.UI.Notifications.ToastNotificationManager]::History.Remove(
            [string]$payload.tag, $group, $appId)
    } catch {
        if (-not $_.Exception.Message.Contains('0x80070490')) { throw }
    }
    '{"hidden":true}'
    [Environment]::Exit(0)
}

# XmlDocument escapes all user-supplied content and native action arguments.
$doc = New-Object System.Xml.XmlDocument
$toast = $doc.CreateElement('toast')
$toast.SetAttribute('activationType', 'foreground')
function New-Arguments([string]$Type) {
    @{ id = $payload.id; token = $payload.token; type = $Type } | ConvertTo-Json -Compress
}
$toast.SetAttribute('launch', (New-Arguments 'open'))
$visual = $doc.CreateElement('visual')
$binding = $doc.CreateElement('binding')
$binding.SetAttribute('template', 'ToastGeneric')
foreach ($text in @($payload.title, $payload.body)) {
    $node = $doc.CreateElement('text')
    $node.InnerText = [string]$text
    [void]$binding.AppendChild($node)
}
[void]$visual.AppendChild($binding)
[void]$toast.AppendChild($visual)
$actions = $doc.CreateElement('actions')
foreach ($action in $payload.actions) {
    $node = $doc.CreateElement('action')
    $node.SetAttribute('content', [string]$action.title)
    $node.SetAttribute('arguments', (New-Arguments $action.actionType))
    $node.SetAttribute('activationType', 'foreground')
    [void]$actions.AppendChild($node)
}
if ($payload.replyPlaceholder) {
    # Native reply input is delivered to the COM callback as user input data.
    $input = $doc.CreateElement('input')
    $input.SetAttribute('id', 'reply')
    $input.SetAttribute('type', 'text')
    $input.SetAttribute('placeHolderContent', [string]$payload.replyPlaceholder)
    [void]$actions.AppendChild($input)
    $reply = $doc.CreateElement('action')
    $reply.SetAttribute('content', 'Reply')
    $reply.SetAttribute('hint-inputId', 'reply')
    $reply.SetAttribute('arguments', (New-Arguments 'reply'))
    $reply.SetAttribute('activationType', 'foreground')
    [void]$actions.AppendChild($reply)
}
if ($actions.HasChildNodes) { [void]$toast.AppendChild($actions) }
$audio = $doc.CreateElement('audio')
# Official WAV playback belongs to the host. Never add two audio XML nodes.
$audio.SetAttribute('silent', $(if ($payload.sound -eq 'none' -or $payload.soundPath) { 'true' } else { 'false' }))
[void]$toast.AppendChild($audio)
[void]$doc.AppendChild($toast)
$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml($doc.OuterXml)
$notification = New-Object Windows.UI.Notifications.ToastNotification($xml)
$notification.Tag = [string]$payload.tag
$notification.Group = $group
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($notification)
if ($payload.sound -ne 'none' -and $payload.soundPath) {
    $player = New-Object System.Media.SoundPlayer([string]$payload.soundPath)
    $player.PlaySync()
}
'{"shown":true}'
# WinRT may retain an apartment reference after Show. The adapter is a
# one-shot process; the independently registered host owns all activation.
[Console]::Out.Flush()
[Environment]::Exit(0)
