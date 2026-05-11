# PowerShell script to convert HTML to PDF using Chrome
$htmlFile = "..\MK_Air_NCL_Division5_Opposition_Analysis_2025.html"
$pdfFile = "..\MK_Air_NCL_Division5_Opposition_Analysis_2025.pdf"

# Get full path
$fullHtmlPath = (Resolve-Path $htmlFile).Path
$fullPdfPath = Join-Path (Get-Location) $pdfFile

Write-Host "Converting: $fullHtmlPath"
Write-Host "To: $fullPdfPath"

# Try to find Chrome
$chromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe"
)

$chrome = $null
foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        $chrome = $path
        break
    }
}

if ($chrome) {
    Write-Host "Found Chrome at: $chrome"
    & $chrome --headless --disable-gpu --print-to-pdf="$fullPdfPath" "file:///$($fullHtmlPath.Replace('\', '/'))"
    Write-Host "PDF created: $fullPdfPath"
} else {
    Write-Host "Chrome not found. Please use the browser method:"
    Write-Host "1. Double-click the HTML file to open in browser"
    Write-Host "2. Press Ctrl+P"
    Write-Host "3. Select 'Save as PDF'"
    Write-Host "4. Click Save"
}