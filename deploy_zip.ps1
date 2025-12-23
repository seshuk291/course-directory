Write-Host "Deploying zip bundle to Raspberry Pi..."
$ZipPath = "deploy.zip"
$User = "skolli"
$HostIP = "192.168.0.105"
$RemoteDir = "~/course-directory-prod"

# Upload Zip
Write-Host "Uploading $ZipPath..."
scp $ZipPath ${User}@${HostIP}:~

# Remote commands to unzip and start
$RemoteCommand = "rm -rf $RemoteDir && mkdir -p $RemoteDir && unzip -o ~/deploy.zip -d $RemoteDir && rm ~/deploy.zip && cd $RemoteDir && echo 'Starting server...' && node server.js"

Write-Host "Executing remote setup..."
ssh -t ${User}@${HostIP} $RemoteCommand
