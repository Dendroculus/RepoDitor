using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

internal static class Program
{
    [DllImport("user32.dll")]
    private static extern bool SetProcessDpiAwarenessContext(IntPtr value);

    [STAThread]
    private static void Main(string[] args)
    {
        try { SetProcessDpiAwarenessContext(new IntPtr(-4)); }
        catch (EntryPointNotFoundException) { }

        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        var options = Arguments.Parse(args);
        using (var window = new InstallerWindow(options))
        {
            Application.Run(window);
        }

        if (options.Cleanup)
        {
            Cleanup.Schedule(AppDomain.CurrentDomain.BaseDirectory);
        }
    }
}

internal sealed class Arguments
{
    internal string Mode = "install";
    internal string Engine = string.Empty;
    internal string Path = string.Empty;
    internal string CurrentPath = string.Empty;
    internal string AllPath = string.Empty;
    internal string Scope = "current";
    internal string Version = string.Empty;
    internal int ParentProcessId;
    internal bool Updated;
    internal bool ScopeLocked;
    internal bool ShowScope = true;
    internal bool Cleanup;

    internal static Arguments Parse(string[] args)
    {
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        for (var index = 0; index < args.Length; index++)
        {
            if (!args[index].StartsWith("--", StringComparison.Ordinal) || index + 1 >= args.Length)
            {
                continue;
            }

            values[args[index].Substring(2)] = args[++index];
        }

        var result = new Arguments();
        result.Mode = Get(values, "mode", result.Mode);
        result.Engine = Get(values, "engine", result.Engine);
        result.Path = Get(values, "path", result.Path);
        result.CurrentPath = Get(values, "current-path", result.Path);
        result.AllPath = Get(values, "all-path", result.Path);
        result.Scope = Get(values, "scope", result.Scope);
        result.Version = Get(values, "version", result.Version);
        result.Updated = GetBool(values, "updated");
        result.ScopeLocked = GetBool(values, "scope-locked");
        result.ShowScope = !values.ContainsKey("show-scope") || GetBool(values, "show-scope");
        result.Cleanup = GetBool(values, "cleanup");
        int.TryParse(Get(values, "parent-pid", "0"), out result.ParentProcessId);
        return result;
    }

    private static string Get(IDictionary<string, string> values, string name, string fallback)
    {
        string value;
        return values.TryGetValue(name, out value) ? value : fallback;
    }

    private static bool GetBool(IDictionary<string, string> values, string name)
    {
        string value;
        return values.TryGetValue(name, out value) &&
            (value == "1" || value.Equals("true", StringComparison.OrdinalIgnoreCase));
    }
}

internal sealed class InstallerWindow : Form
{
    private const string AppOrigin = "https://repoditor-installer.local";
    private const int WmNcLButtonDown = 0x00A1;
    private const int HtCaption = 2;

    [DllImport("user32.dll")]
    private static extern bool ReleaseCapture();

    [DllImport("user32.dll")]
    private static extern IntPtr SendMessage(IntPtr window, int message, IntPtr wParam, IntPtr lParam);

    private readonly Arguments _options;
    private readonly JavaScriptSerializer _json = new JavaScriptSerializer();
    private readonly WebView2 _webView = new WebView2();
    private Process _parentProcess;
    private string _scope;
    private string _selectedPath;
    private bool _busy;
    private bool _ready;

    internal InstallerWindow(Arguments options)
    {
        _options = options;
        _scope = options.Scope.Equals("all", StringComparison.OrdinalIgnoreCase) ? "all" : "current";
        _selectedPath = options.Path;

        Text = options.Mode == "uninstall" ? "RepoDitor Uninstall" : "RepoDitor Setup";
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.None;
        BackColor = Color.FromArgb(9, 11, 18);
        ClientSize = new Size(1216, 800);
        MinimumSize = new Size(960, 640);
        KeyPreview = true;
        AutoScaleMode = AutoScaleMode.Dpi;

        var iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "icon.ico");
        if (File.Exists(iconPath))
        {
            Icon = new Icon(iconPath);
        }

        _webView.Dock = DockStyle.Fill;
        _webView.DefaultBackgroundColor = BackColor;
        _webView.AllowExternalDrop = false;
        Controls.Add(_webView);

        if (options.ParentProcessId > 0)
        {
            try { _parentProcess = Process.GetProcessById(options.ParentProcessId); }
            catch (ArgumentException) { }
            catch (Win32Exception) { }
        }
    }

    protected override async void OnShown(EventArgs eventArgs)
    {
        base.OnShown(eventArgs);
        try
        {
            var userData = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "WebView2Data");
            var environment = await CoreWebView2Environment.CreateAsync(null, userData, null);
            await _webView.EnsureCoreWebView2Async(environment);
            ConfigureWebView();
        }
        catch (Exception error)
        {
            MessageBox.Show(
                this,
                "RepoDitor Setup could not start Microsoft Edge WebView2.\n\n" + error.Message,
                Text,
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            Close();
        }
    }

    protected override void OnFormClosing(FormClosingEventArgs eventArgs)
    {
        if (_busy && eventArgs.CloseReason == CloseReason.UserClosing)
        {
            eventArgs.Cancel = true;
            return;
        }

        base.OnFormClosing(eventArgs);
    }

    protected override void OnKeyDown(KeyEventArgs eventArgs)
    {
        if (eventArgs.KeyCode == Keys.Escape && !_busy)
        {
            Close();
            eventArgs.Handled = true;
        }
        base.OnKeyDown(eventArgs);
    }

    private void ConfigureWebView()
    {
        var core = _webView.CoreWebView2;
        core.Settings.AreDefaultContextMenusEnabled = false;
        core.Settings.AreDevToolsEnabled = false;
        core.Settings.AreHostObjectsAllowed = false;
        core.Settings.IsStatusBarEnabled = false;
        core.Settings.IsZoomControlEnabled = false;
        core.Settings.AreBrowserAcceleratorKeysEnabled = false;
        core.Settings.IsGeneralAutofillEnabled = false;
        core.Settings.IsPasswordAutosaveEnabled = false;

        core.NavigationStarting += delegate(object sender, CoreWebView2NavigationStartingEventArgs args)
        {
            if (!args.Uri.StartsWith(AppOrigin + "/", StringComparison.OrdinalIgnoreCase))
            {
                args.Cancel = true;
            }
        };
        core.NewWindowRequested += delegate(object sender, CoreWebView2NewWindowRequestedEventArgs args)
        {
            args.Handled = true;
        };
        core.PermissionRequested += delegate(object sender, CoreWebView2PermissionRequestedEventArgs args)
        {
            args.State = CoreWebView2PermissionState.Deny;
        };
        core.DownloadStarting += delegate(object sender, CoreWebView2DownloadStartingEventArgs args)
        {
            args.Cancel = true;
        };
        core.WebMessageReceived += OnWebMessageReceived;

        core.SetVirtualHostNameToFolderMapping(
            "repoditor-installer.local",
            AppDomain.CurrentDomain.BaseDirectory,
            CoreWebView2HostResourceAccessKind.DenyCors);
        core.Navigate(AppOrigin + "/index.html");
    }

    private void OnWebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs eventArgs)
    {
        if (!eventArgs.Source.Equals(AppOrigin + "/index.html", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        string command;
        try { command = eventArgs.TryGetWebMessageAsString(); }
        catch (ArgumentException) { return; }

        if (command == "ready")
        {
            _ready = true;
            SendInitialize();
        }
        else if (command == "choose-path" && !_busy && _options.Mode != "uninstall")
        {
            ChoosePath();
        }
        else if (command == "scope:current" && !_busy && !_options.ScopeLocked)
        {
            SetScope("current", _options.CurrentPath);
        }
        else if (command == "scope:all" && !_busy && !_options.ScopeLocked)
        {
            SetScope("all", _options.AllPath);
        }
        else if ((command == "start" || command == "retry") && !_busy)
        {
            RunEngine();
        }
        else if ((command == "cancel" || command == "close" || command == "window:close") && !_busy)
        {
            Close();
        }
        else if (command == "launch" && !_busy)
        {
            LaunchRepoDitor();
        }
        else if (command == "window:minimize")
        {
            WindowState = FormWindowState.Minimized;
        }
        else if (command == "window:maximize")
        {
            WindowState = WindowState == FormWindowState.Maximized
                ? FormWindowState.Normal
                : FormWindowState.Maximized;
        }
        else if (command == "window:drag" && WindowState != FormWindowState.Maximized)
        {
            ReleaseCapture();
            SendMessage(Handle, WmNcLButtonDown, new IntPtr(HtCaption), IntPtr.Zero);
        }
    }

    private void SendInitialize()
    {
        Send(new Dictionary<string, object>
        {
            { "type", "initialize" },
            { "mode", _options.Mode },
            { "version", _options.Version },
            { "updated", _options.Updated },
            { "scope", _scope },
            { "scopeLocked", _options.ScopeLocked },
            { "showScope", _options.ShowScope },
            { "path", _selectedPath }
        });
    }

    private void SetScope(string scope, string path)
    {
        _scope = scope;
        _selectedPath = path;
        Send(new Dictionary<string, object>
        {
            { "type", "path" },
            { "path", _selectedPath }
        });
    }

    private void ChoosePath()
    {
        using (var dialog = new FolderBrowserDialog())
        {
            dialog.Description = "Choose the parent folder for RepoDitor";
            dialog.ShowNewFolderButton = true;
            try
            {
                var parent = Directory.GetParent(_selectedPath);
                if (parent != null && parent.Exists)
                {
                    dialog.SelectedPath = parent.FullName;
                }
            }
            catch (Exception) { }

            if (dialog.ShowDialog(this) != DialogResult.OK)
            {
                return;
            }

            _selectedPath = Path.GetFullPath(Path.Combine(dialog.SelectedPath, "RepoDitor"));
            Send(new Dictionary<string, object>
            {
                { "type", "path" },
                { "path", _selectedPath }
            });
        }
    }

    private async void RunEngine()
    {
        _busy = true;
        SendState("progress", _options.Mode == "uninstall" ? "Removing application…" : "Installing application…");

        try
        {
            if (string.IsNullOrWhiteSpace(_options.Engine) || !File.Exists(_options.Engine))
            {
                throw new FileNotFoundException("The installer engine is unavailable.", _options.Engine);
            }

            await WaitForParentAsync();
            var arguments = "/S /" + (_scope == "all" ? "allusers" : "currentuser");
            if (_options.Mode != "uninstall")
            {
                if (_options.Updated)
                {
                    arguments += " --updated";
                }
                arguments += " /D=" + _selectedPath;
            }

            var startInfo = new ProcessStartInfo(_options.Engine, arguments);
            startInfo.WorkingDirectory = Path.GetDirectoryName(_options.Engine) ?? string.Empty;
            if (_scope == "all")
            {
                startInfo.UseShellExecute = true;
                startInfo.Verb = "runas";
            }
            else
            {
                startInfo.UseShellExecute = false;
                startInfo.CreateNoWindow = true;
            }

            using (var process = Process.Start(startInfo))
            {
                if (process == null)
                {
                    throw new InvalidOperationException("The installer engine did not start.");
                }
                await Task.Run(delegate { process.WaitForExit(); });
                if (process.ExitCode != 0)
                {
                    throw new InvalidOperationException("The installer engine returned error " + process.ExitCode + ".");
                }
            }

            _busy = false;
            SendState("done", string.Empty);
        }
        catch (Win32Exception error)
        {
            _busy = false;
            SendState("error", error.NativeErrorCode == 1223
                ? "Administrator access was cancelled. No changes were made."
                : error.Message);
        }
        catch (Exception error)
        {
            _busy = false;
            SendState("error", error.Message);
        }
    }

    private Task WaitForParentAsync()
    {
        if (_parentProcess == null)
        {
            return Task.Delay(750);
        }

        try
        {
            if (_parentProcess.HasExited)
            {
                return Task.FromResult(0);
            }
        }
        catch (Win32Exception) { return Task.Delay(750); }
        catch (InvalidOperationException) { return Task.Delay(750); }

        return Task.Run(delegate { _parentProcess.WaitForExit(); });
    }

    private void LaunchRepoDitor()
    {
        var executable = Path.Combine(_selectedPath, "RepoDitor.exe");
        try
        {
            Process.Start(new ProcessStartInfo(executable) { UseShellExecute = true });
            Close();
        }
        catch (Exception error)
        {
            SendState("error", error.Message);
        }
    }

    private void SendState(string state, string message)
    {
        Send(new Dictionary<string, object>
        {
            { "type", "state" },
            { "state", state },
            { "message", message }
        });
    }

    private void Send(IDictionary<string, object> message)
    {
        if (_ready && _webView.CoreWebView2 != null)
        {
            _webView.CoreWebView2.PostWebMessageAsJson(_json.Serialize(message));
        }
    }
}

internal static class Cleanup
{
    private const int MoveFileDelayUntilReboot = 0x4;

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool MoveFileEx(string existingFile, string newFile, int flags);

    internal static void Schedule(string directory)
    {
        try
        {
            foreach (var file in Directory.GetFiles(directory, "*", SearchOption.AllDirectories))
            {
                MoveFileEx(file, null, MoveFileDelayUntilReboot);
            }

            var directories = Directory.GetDirectories(directory, "*", SearchOption.AllDirectories);
            Array.Sort(directories, delegate(string left, string right) { return right.Length.CompareTo(left.Length); });
            foreach (var child in directories)
            {
                MoveFileEx(child, null, MoveFileDelayUntilReboot);
            }
            MoveFileEx(directory, null, MoveFileDelayUntilReboot);
        }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }
}
