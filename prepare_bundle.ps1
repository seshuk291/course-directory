Write-Host "Preparing Linux (ARM64) bundle..."

# Paths
$StandalonePath = ".next\standalone"
$LinuxModulesPath = "temp-linux-build\node_modules"
$ZipPath = "deploy.zip"

# Replace node_modules
if (Test-Path "$StandalonePath\node_modules") {
    Write-Host "Removing Windows node_modules..."
    Remove-Item -Recurse -Force "$StandalonePath\node_modules"
}

Write-Host "Copying Linux node_modules..."
Copy-Item -Recurse "$LinuxModulesPath" "$StandalonePath\node_modules"

# Zip
if (Test-Path $ZipPath) { Remove-Item $ZipPath }
Write-Host "Zipping standalone build..."
Compress-Archive -Path "$StandalonePath\*" -DestinationPath $ZipPath

Write-Host "Bundle ready: $ZipPath"

