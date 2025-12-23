$ErrorActionPreference = "Stop"

Write-Host "Starting deployment to Raspberry Pi (192.168.0.105)..."

# Define variables
$Source = ".\.next\standalone"
$User = "skolli"
$HostIP = "192.168.0.105"
$Dest = "~/course-directory-prod"

Write-Host "Files to be transferred from: $Source"
Write-Host "Destination: ${User}@${HostIP}:${Dest}"
Write-Host "You will be prompted for the password (skolli) shortly."

# Execute SCP
# Note: This requires the user to enter the password interactively.
scp -r $Source ${User}@${HostIP}:${Dest}

Write-Host "Deployment command finished."
Write-Host "To run the app on the Pi:"
Write-Host "1. SSH into the Pi: ssh $User@$HostIP"
Write-Host "2. Navigate to the folder: cd $Dest/standalone"
Write-Host "3. Start the server: node server.js"
