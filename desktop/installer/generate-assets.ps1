$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot "..\public\icon.png"
$source = [System.Drawing.Image]::FromFile($sourcePath)

function Save-InstallerBitmap {
    param(
        [Parameter(Mandatory)] [string] $Name,
        [Parameter(Mandatory)] [int] $Width,
        [Parameter(Mandatory)] [int] $Height,
        [Parameter(Mandatory)] [scriptblock] $Draw
    )

    $bitmap = [System.Drawing.Bitmap]::new(
        $Width,
        $Height,
        [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
    )
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        & $Draw $graphics
        $bitmap.Save(
            (Join-Path $PSScriptRoot $Name),
            [System.Drawing.Imaging.ImageFormat]::Bmp
        )
    }
    finally {
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}

try {
    Save-InstallerBitmap "installerHeader.bmp" 150 57 {
        param($graphics)
        $graphics.Clear([System.Drawing.Color]::White)
        $gold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(194, 151, 86))
        try {
            $graphics.FillRectangle($gold, 91, 5, 2, 47)
            $graphics.DrawImage($source, 99, 5, 47, 47)
        }
        finally {
            $gold.Dispose()
        }
    }

    Save-InstallerBitmap "installerSidebar.bmp" 164 314 {
        param($graphics)
        $graphics.Clear([System.Drawing.Color]::FromArgb(13, 17, 16))
        $gold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(194, 151, 86))
        try {
            $graphics.FillRectangle($gold, 0, 0, 164, 4)
            $graphics.FillRectangle($gold, 0, 310, 164, 4)
            $graphics.DrawImage($source, 24, 85, 116, 114)
            $graphics.FillRectangle($gold, 48, 225, 68, 2)
        }
        finally {
            $gold.Dispose()
        }
    }
}
finally {
    $source.Dispose()
}
