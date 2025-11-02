import { NextRequest, NextResponse } from 'next/server';
import { createFolder } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const directoryId = parseInt(id);
    
    if (isNaN(directoryId)) {
      return NextResponse.json({ error: 'Invalid directory ID' }, { status: 400 });
    }

    const { name, displayName, parentId } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const folderId = await createFolder(
      directoryId,
      name.trim(),
      displayName?.trim() || name.trim(),
      parentId
    );

    return NextResponse.json({ 
      id: folderId,
      message: 'Folder created successfully' 
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}