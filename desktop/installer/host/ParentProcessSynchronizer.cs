using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Threading.Tasks;

// Owns the captured NSIS parent handle and its access-denied synchronization fallback.
internal sealed class ParentProcessSynchronizer : IDisposable
{
    private readonly int _parentProcessId;
    private readonly Process _parentProcess;

    internal ParentProcessSynchronizer(int parentProcessId)
    {
        _parentProcessId = parentProcessId;
        if (parentProcessId > 0)
        {
            try { _parentProcess = Process.GetProcessById(parentProcessId); }
            catch (ArgumentException) { }
            catch (Win32Exception) { }
        }
    }

    internal async Task WaitAsync()
    {
        if (_parentProcess == null)
        {
            await Task.Delay(750);
            return;
        }

        try
        {
            await Task.Run(delegate { _parentProcess.WaitForExit(); });
            return;
        }
        catch (Win32Exception error)
        {
            if (error.NativeErrorCode != 5)
            {
                throw;
            }
        }
        catch (InvalidOperationException)
        {
            return;
        }
        // A hardened parent may deny even SYNCHRONIZE. Never race it with a fixed delay.
        while (true)
        {
            try
            {
                using (Process.GetProcessById(_parentProcessId)) { }
            }
            catch (ArgumentException)
            {
                return;
            }
            catch (InvalidOperationException)
            {
                return;
            }
            await Task.Delay(100);
        }
    }

    public void Dispose()
    {
        if (_parentProcess != null)
        {
            _parentProcess.Dispose();
        }
    }
}
