using System;
using System.IO;
using System.Runtime.InteropServices;

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
