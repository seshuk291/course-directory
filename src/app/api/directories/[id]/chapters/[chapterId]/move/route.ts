import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { id, chapterId } = await params;
    const directoryId = parseInt(id);
    const decodedChapterId = decodeURIComponent(chapterId);
    
    if (isNaN(directoryId)) {
      return NextResponse.json({ error: 'Invalid directory ID' }, { status: 400 });
    }

    const { folderId } = await request.json();

    const db = await initDatabase();

    // Update chapter's folder assignment using path as identifier
    await new Promise<void>((resolve, reject) => {
      db.run(
        'UPDATE chapters SET folder_id = ?, updated_at = CURRENT_TIMESTAMP WHERE path = ? AND directory_id = ?',
        [folderId || null, decodedChapterId, directoryId],
        function(err) {
          if (err) {
            console.error('Error updating chapter:', err);
            reject(err);
          } else {
            console.log(`Updated chapter: ${decodedChapterId}, affected rows: ${this.changes}`);
            resolve();
          }
        }
      );
    });

    db.close();

    return NextResponse.json({ message: 'Chapter moved successfully' });
  } catch (error) {
    console.error('Error moving chapter:', error);
    return NextResponse.json(
      { error: 'Failed to move chapter' },
      { status: 500 }
    );
  }
}