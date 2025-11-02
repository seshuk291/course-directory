import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDirectoryFolders } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const directoryId = parseInt(id);
    
    if (isNaN(directoryId)) {
      return NextResponse.json({ error: 'Invalid directory ID' }, { status: 400 });
    }

    const db = await initDatabase();
    
    // Get course structure including folders and chapters
    const folders = await getDirectoryFolders(directoryId);
    
    // Get chapters for this directory
    const chapters = await new Promise<any[]>((resolve, reject) => {
      db.all(
        'SELECT * FROM chapters WHERE directory_id = ? ORDER BY sort_order, name',
        [directoryId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    db.close();
    
    return NextResponse.json({
      folders,
      chapters
    });
  } catch (error) {
    console.error('Error fetching directory structure:', error);
    return NextResponse.json(
      { error: 'Failed to fetch directory structure' },
      { status: 500 }
    );
  }
}