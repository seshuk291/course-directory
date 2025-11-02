import { NextResponse } from 'next/server';
import { getCourseStructure } from '@/lib/courseUtils';

export async function GET() {
  try {
    const courseStructure = await getCourseStructure();
    return NextResponse.json(courseStructure);
  } catch (error) {
    console.error('Error fetching course structure:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}