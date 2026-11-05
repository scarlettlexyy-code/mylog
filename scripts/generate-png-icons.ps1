Add-Type -AssemblyName System.Drawing

function Create-AppIcon {
    param([int]$dim, [string]$targetPath)
    $bmp = New-Object System.Drawing.Bitmap($dim, $dim)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    # Background Navy #0B1C30
    $bg = [System.Drawing.ColorTranslator]::FromHtml('#0B1C30')
    $g.Clear($bg)

    # Gold Accent Dot #FE932C
    $gold = [System.Drawing.ColorTranslator]::FromHtml('#FE932C')
    $brushGold = New-Object System.Drawing.SolidBrush($gold)

    # Text MYlog
    $fontSize = [float]($dim * 0.22)
    $font = New-Object System.Drawing.Font('Arial', $fontSize, [System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF(0, 0, $dim, $dim)
    $brushWhite = [System.Drawing.Brushes]::White

    $g.DrawString('MYlog', $font, $brushWhite, $rect, $sf)

    # Accent Dot near top right of text
    $dotSize = [float]($dim * 0.04)
    $dotX = [float]($dim * 0.77)
    $dotY = [float]($dim * 0.52)
    $g.FillEllipse($brushGold, $dotX, $dotY, $dotSize, $dotSize)

    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Create-AppIcon -dim 192 -targetPath "C:\Users\USER\.gemini\antigravity\scratch\mylog\public\icons\icon-192.png"
Create-AppIcon -dim 512 -targetPath "C:\Users\USER\.gemini\antigravity\scratch\mylog\public\icons\icon-512.png"
Write-Output "ICONS_GENERATED_SUCCESSFULLY"
