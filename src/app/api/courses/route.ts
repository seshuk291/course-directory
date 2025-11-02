import { NextRequest, NextResponse } from 'next/server';
import { getCourseStructure } from '@/lib/courseUtils';

export async function GET() {
  try {
    const courses = await getCourseStructure();
    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}