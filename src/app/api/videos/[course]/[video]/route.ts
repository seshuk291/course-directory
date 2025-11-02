import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DirectoryManager } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ course: string; video: string }> }
) {
  try {
    const { course, video } = await params;
    const decodedVideo = decodeURIComponent(video);
    
    // Try to find the video file
    let videoPath: string | null = null;
    
    // First, check in the regular courses directory
    const coursesDir = path.join(process.cwd(), 'courses');
    const regularCoursePath = path.join(coursesDir, course);
    const regularVideoPath = path.join(regularCoursePath, decodedVideo.replace(/\//g, path.sep));
    
    if (fs.existsSync(regularVideoPath)) {
      videoPath = regularVideoPath;
    } else {
      // Check in selected directories
      const directoryManager = new DirectoryManager();
      await directoryManager.init();
      const selectedDirectories = await directoryManager.getSelectedDirectories();
      for (const dir of selectedDirectories) {
        if (dir.display_name === course && fs.existsSync(dir.original_path)) {
          const selectedVideoPath = path.join(dir.original_path, decodedVideo.replace(/\//g, path.sep));
          if (fs.existsSync(selectedVideoPath)) {
            videoPath = selectedVideoPath;
            break;
          }
        }
      }
    }
    
    if (!videoPath || !fs.existsSync(videoPath)) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }
    
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');
    
    if (range) {
      // Handle range requests for video streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      
      return new NextResponse(file as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': getVideoMimeType(videoPath),
        },
      });
    } else {
      // Serve the entire file
      const file = fs.createReadStream(videoPath);
      
      return new NextResponse(file as any, {
        status: 200,
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': getVideoMimeType(videoPath),
        },
      });
    }
  } catch (error) {
    console.error('Error serving video:', error);
    return NextResponse.json(
      { error: 'Failed to serve video' },
      { status: 500 }
    );
  }
}

function getVideoMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.mkv': 'video/x-matroska',
    '.m4v': 'video/x-m4v',
    '.3gp': 'video/3gpp',
    '.ogv': 'video/ogg',
  };
  
  return mimeTypes[ext] || 'video/mp4';
}