import { NextRequest, NextResponse } from 'next/server';
import { addSelectedDirectory, removeSelectedDirectory } from '@/lib/courseUtils';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { originalPath, displayName } = await request.json();
    
    if (!originalPath || !displayName) {
      return NextResponse.json(
        { error: 'Both directory path and display name are required' },
        { status: 400 }
      );
    }
    
    // Validate that the path exists and is a directory
    try {
      if (!fs.existsSync(originalPath)) {
        return NextResponse.json(
          { error: `Directory not found: "${originalPath}". Please check the path and ensure it exists.` },
          { status: 400 }
        );
      }
      
      const stats = fs.statSync(originalPath);
      if (!stats.isDirectory()) {
        return NextResponse.json(
          { error: `The path "${originalPath}" is not a directory.` },
          { status: 400 }
        );
      }
    } catch (fsError: any) {
      if (fsError.code === 'ENOENT') {
        return NextResponse.json(
          { error: `Directory not found: "${originalPath}". Please verify the path is correct.` },
          { status: 400 }
        );
      } else if (fsError.code === 'EACCES') {
        return NextResponse.json(
          { error: `Access denied to directory: "${originalPath}". Please check permissions.` },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: `Cannot access directory: "${originalPath}". ${fsError.message}` },
          { status: 400 }
        );
      }
    }
    
    const id = await addSelectedDirectory(originalPath, displayName);
    return NextResponse.json({ id, success: true });
  } catch (error) {
    console.error('Error adding directory:', error);
    return NextResponse.json(
      { error: 'Failed to add directory. Please try again.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Directory ID is required' },
        { status: 400 }
      );
    }
    
    await removeSelectedDirectory(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing directory:', error);
    return NextResponse.json(
      { error: 'Failed to remove directory' },
      { status: 500 }
    );
  }
}