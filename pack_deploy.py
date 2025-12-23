import tarfile
import os

source_dir = ".next/standalone"
output_filename = "deploy.tar.gz"

print(f"Creating {output_filename} from {source_dir}...")

with tarfile.open(output_filename, "w:gz") as tar:
    tar.add(source_dir, arcname=".")

print("Done.")
