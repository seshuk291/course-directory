import { NextRequest, NextResponse } from 'next/server';
import { DirectoryManager } from '@/lib/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const directoryId = parseInt(id);
    
    if (isNaN(directoryId)) {
      return NextResponse.json(
        { error: 'Invalid directory ID' },
        { status: 400 }
      );
    }

    const manager = new DirectoryManager();
    await manager.init();

    const progress = await manager.getCourseProgress(directoryId);
    const chapterProgress = await manager.getChapterProgress(directoryId);

    await manager.close();

    return NextResponse.json({
      courseProgress: progress,
      chapterProgress: chapterProgress
    });
  } catch (error) {
    console.error('Error fetching course progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course progress' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { chapterPath, completed } = await request.json();
    
    const directoryId = parseInt(id);
    
    if (isNaN(directoryId)) {
      return NextResponse.json(
        { error: 'Invalid directory ID' },
        { status: 400 }
      );
    }

    if (!chapterPath) {
      return NextResponse.json(
        { error: 'Chapter path is required' },
        { status: 400 }
      );
    }

    const manager = new DirectoryManager();
    await manager.init();

    if (completed) {
      await manager.markChapterCompleted(directoryId, chapterPath);
    } else {
      await manager.markChapterIncomplete(directoryId, chapterPath);
    }

    // Get updated progress
    const progress = await manager.getCourseProgress(directoryId);

    await manager.close();

    return NextResponse.json({
      success: true,
      courseProgress: progress
    });
  } catch (error) {
    console.error('Error updating chapter progress:', error);
    return NextResponse.json(
      { error: 'Failed to update chapter progress' },
      { status: 500 }
    );
  }
}