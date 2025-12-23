Write-Host "Deploying tar bundle to Raspberry Pi..."
$TarPath = "deploy.tar.gz"
$User = "skolli"
$HostIP = "192.168.0.105"
$RemoteDir = "~/course-directory-prod"

# Upload Tar
Write-Host "Uploading $TarPath..."
scp $TarPath ${User}@${HostIP}:~

# Remote commands to untar and start
# Ensure directory exists, clean it, untar
$RemoteCommand = "rm -rf $RemoteDir && mkdir -p $RemoteDir && tar -xzf ~/deploy.tar.gz -C $RemoteDir && rm ~/deploy.tar.gz && cd $RemoteDir && echo 'Starting server...' && node server.js"

Write-Host "Executing remote setup..."
ssh -t ${User}@${HostIP} $RemoteCommand
