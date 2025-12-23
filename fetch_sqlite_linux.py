import urllib.request
import tarfile
import os
import shutil

base_url = "https://github.com/TryGhost/node-sqlite3/releases/download/v5.1.7/"
files_to_try = [
    "sqlite3-v5.1.7-napi-v6-linux-arm.tar.gz",
    "sqlite3-v5.1.7-napi-v3-linux-arm.tar.gz",
    "sqlite3-v5.1.7-napi-v6-linux-arm64.tar.gz", # Fallback to 64-bit just in case
]

dest_tar = "sqlite3-linux.tar.gz"
extract_dir = "sqlite3-linux"

success = False
for filename in files_to_try:
    url = base_url + filename
    print(f"Trying {url}...")
    try:
        urllib.request.urlretrieve(url, dest_tar)
        print("Download successful.")
        success = True
        break
    except urllib.error.HTTPError as e:
        print(f"Failed: {e.code}")

if not success:
    print("All downloads failed.")
    exit(1)

print("Extracting...")
with tarfile.open(dest_tar, "r:gz") as tar:
    tar.extractall(extract_dir)

# Find the .node file
node_file = None
for root, dirs, files in os.walk(extract_dir):
    for file in files:
        if file.endswith(".node"):
            node_file = os.path.join(root, file)
            break

if node_file:
    target_dir = "temp-linux-build/node_modules/sqlite3/build/Release"
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
    
    target_path = os.path.join(target_dir, "node_sqlite3.node")
    print(f"Moving {node_file} to {target_path}")
    shutil.move(node_file, target_path)
    print("Success!")
else:
    print("Could not find .node file in archive")
    exit(1)
