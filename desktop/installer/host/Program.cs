using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;

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
