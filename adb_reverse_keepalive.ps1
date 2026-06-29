# adb_reverse_keepalive.ps1
# Run this script once to keep ADB reverse ports alive throughout your dev session.
# Ports re-establish automatically every 5 seconds if they drop.

Write-Host "[ADB Keepalive] Starting. Press Ctrl+C to stop." -ForegroundColor Cyan

while ($true) {
    $devices = adb devices 2>&1 | Select-String "device$"
    if ($devices) {
        $ports = adb reverse --list 2>&1
        if ($ports -notmatch "tcp:8000") {
            adb reverse tcp:8000 tcp:8000 | Out-Null
            Write-Host "[ADB Keepalive] Re-established tcp:8000" -ForegroundColor Yellow
        }
        if ($ports -notmatch "tcp:5000") {
            adb reverse tcp:5000 tcp:5000 | Out-Null
            Write-Host "[ADB Keepalive] Re-established tcp:5000" -ForegroundColor Yellow
        }
        if ($ports -notmatch "tcp:8081") {
            adb reverse tcp:8081 tcp:8081 | Out-Null
            Write-Host "[ADB Keepalive] Re-established tcp:8081" -ForegroundColor Yellow
        }
    }
    Start-Sleep -Seconds 5
}
