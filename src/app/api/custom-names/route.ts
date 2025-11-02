import { NextRequest, NextResponse } from 'next/server';
import { setCustomFileName } from '@/lib/courseUtils';

export async function POST(request: NextRequest) {
  try {
    const { directoryId, filePath, originalName, customName, isDirectory } = await request.json();
    
    await setCustomFileName(directoryId, filePath, originalName, customName, isDirectory || false);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting custom name:', error);
    return NextResponse.json(
      { error: 'Failed to set custom name' },
      { status: 500 }
    );
  }
}