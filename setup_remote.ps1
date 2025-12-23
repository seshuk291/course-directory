Write-Host "Connecting to Raspberry Pi to install dependencies and start the server..."
Write-Host "You will be prompted for the password (skolli) shortly."

# Command to run on the remote Pi
# 1. Go to the directory
# 2. Install dependencies (rebuilds sqlite3 for ARM)
# 3. Start the server
$RemoteCommand = "cd ~/course-directory-prod/standalone && echo 'Installing dependencies (this may take a few minutes)...' && npm install --production && echo 'Starting server...' && node server.js"

# Execute SSH
# -t forces pseudo-terminal allocation so you can see the output nicely and Ctrl+C works
ssh -t skolli@192.168.0.105 $RemoteCommand
