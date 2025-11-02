import { NextRequest, NextResponse } from 'next/server';
import { getChapterContent, getChapterContentFromSelectedDir, getCourseStructure } from '@/lib/courseUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ course: string; chapter: string }> }
) {
  try {
    const { course, chapter } = await params;
    const decodedChapter = decodeURIComponent(chapter);
    
    // First try the traditional course structure
    let content = getChapterContent(course, decodedChapter);
    
    // If not found, check if it's from a selected directory
    if (!content) {
      const courseStructure = await getCourseStructure();
      const targetCourse = courseStructure?.courses?.find(c => c.name === course);
      
      if (targetCourse && targetCourse.directoryId) {
        content = await getChapterContentFromSelectedDir(targetCourse.directoryId, decodedChapter);
      }
    }
    
    if (!content) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error fetching chapter content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chapter content' },
      { status: 500 }
    );
  }
}