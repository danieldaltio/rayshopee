$url = "https://rayshopee.onrender.com/api/products/barcode?barcode=7898902084012"
$adb = "C:\Users\ThinkPad\AppData\Local\Android\Sdk\platform-tools\adb.exe"

Write-Host "Polling Render API until deployment is ready..."

while ($true) {
    try {
        $response = Invoke-RestMethod -Uri $url
        # The new version converts itemId to a string via the new middleware
        if ($response.itemId -is [string]) {
            Write-Host "Render updated! Opening app..."
            & $adb shell am start -n com.rayshopee.app/com.rayshopee.app.MainActivity
            break
        } else {
            Write-Host "Still running old version (itemId is not a string)..."
        }
    } catch {
        Write-Host "Error connecting to Render..."
    }
    Start-Sleep -Seconds 15
}
