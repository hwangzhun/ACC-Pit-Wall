# Auto-elevate to Administrator and install OpenSSH server/client.

$scriptPath = $MyInvocation.MyCommand.Path
if (-not $scriptPath) { $scriptPath = $PSCommandPath }

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Administrator permission is required. Requesting elevation..." -ForegroundColor Yellow
    try {
        $proc = Start-Process -FilePath "powershell.exe" -ArgumentList @(
            "-NoProfile",
            "-ExecutionPolicy", "Bypass",
            "-File", "`"$scriptPath`""
        ) -Verb RunAs -PassThru -Wait
        if ($proc -and $null -ne $proc.ExitCode) { exit $proc.ExitCode }
        exit 0
    } catch {
        Write-Host "Failed to elevate permission: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Press any key to exit..."
        try { $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown') } catch { Read-Host "Press Enter to exit" }
        exit 1
    }
}

$success = $false
$failReason = $null

try {
    $ErrorActionPreference = "Stop"

    $clientName = "OpenSSH.Client~~~~0.0.1.0"
    $serverName = "OpenSSH.Server~~~~0.0.1.0"

    $clientStatus = Get-WindowsCapability -Online | Where-Object Name -eq $clientName
    if ($clientStatus.State -ne "Installed") {
        Write-Host "Installing OpenSSH Client..." -ForegroundColor Cyan
        Add-WindowsCapability -Online -Name $clientName | Out-Null
    } else {
        Write-Host "OpenSSH Client is already installed." -ForegroundColor Green
    }

    $serverStatus = Get-WindowsCapability -Online | Where-Object Name -eq $serverName
    if ($serverStatus.State -ne "Installed") {
        Write-Host "Installing OpenSSH Server..." -ForegroundColor Cyan
        Add-WindowsCapability -Online -Name $serverName | Out-Null
    } else {
        Write-Host "OpenSSH Server is already installed." -ForegroundColor Green
    }

    Write-Host "Configuring sshd service..." -ForegroundColor Cyan
    Set-Service -Name "sshd" -StartupType "Automatic"
    Start-Service "sshd"

    if (-not (Get-NetFirewallRule -Name "OpenSSH-Server-In-TCP" -ErrorAction SilentlyContinue)) {
        Write-Host "Creating firewall rule for SSH port 22..." -ForegroundColor Yellow
        New-NetFirewallRule -Name "OpenSSH-Server-In-TCP" -DisplayName "OpenSSH Server (sshd)" -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22 | Out-Null
    }

    $success = $true
} catch {
    $failReason = $_.Exception.Message
    Write-Host ""
    Write-Host "Execution failed: $failReason" -ForegroundColor Red
}

Write-Host ""
if ($success) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " OpenSSH installation/configuration done." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host " OpenSSH installation/configuration failed." -ForegroundColor Red
    if ($failReason) {
        Write-Host " Reason: $failReason" -ForegroundColor Red
    }
    Write-Host "========================================" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..."
try {
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} catch {
    Read-Host "Press Enter to exit"
}

if (-not $success) { exit 1 }
