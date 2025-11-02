import { NextRequest, NextResponse } from 'next/server';
import { DirectoryManager } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { displayName, categoryId } = await request.json();
    
    if (!displayName?.trim()) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    const directoryManager = new DirectoryManager();
    await directoryManager.init();

    // Update the directory record
    await directoryManager.updateDirectory(parseInt(id), displayName.trim(), categoryId);
    
    await directoryManager.close();

    return NextResponse.json({ message: 'Course updated successfully' });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const directoryManager = new DirectoryManager();
    await directoryManager.init();

    await directoryManager.removeDirectory(parseInt(id));
    
    await directoryManager.close();

    return NextResponse.json({ message: 'Course removed successfully' });
  } catch (error) {
    console.error('Error removing course:', error);
    return NextResponse.json(
      { error: 'Failed to remove course' },
      { status: 500 }
    );
  }
}