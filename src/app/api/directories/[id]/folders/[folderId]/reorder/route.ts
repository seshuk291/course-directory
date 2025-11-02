import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; folderId: string }> }
) {
  try {
    const { id, folderId: folderIdStr } = await params;
    const directoryId = parseInt(id);
    const folderId = parseInt(folderIdStr);
    
    if (isNaN(directoryId) || isNaN(folderId)) {
      return NextResponse.json({ error: 'Invalid directory or folder ID' }, { status: 400 });
    }

    const { direction } = await request.json();

    if (!['up', 'down'].includes(direction)) {
      return NextResponse.json({ error: 'Invalid direction' }, { status: 400 });
    }

    const db = await initDatabase();

    // Get current folder info
    const currentFolder = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT * FROM folder_hierarchy WHERE id = ? AND directory_id = ?',
        [folderId, directoryId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!currentFolder) {
      db.close();
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Find sibling to swap with
    const operator = direction === 'up' ? '<' : '>';
    const orderDirection = direction === 'up' ? 'DESC' : 'ASC';
    
    const sibling = await new Promise<any>((resolve, reject) => {
      db.get(
        `SELECT * FROM folder_hierarchy 
         WHERE directory_id = ? AND parent_id ${currentFolder.parent_id ? '= ?' : 'IS NULL'} 
         AND sort_order ${operator} ? 
         ORDER BY sort_order ${orderDirection} 
         LIMIT 1`,
        currentFolder.parent_id 
          ? [directoryId, currentFolder.parent_id, currentFolder.sort_order]
          : [directoryId, currentFolder.sort_order],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (sibling) {
      // Swap sort orders
      await new Promise<void>((resolve, reject) => {
        db.run(
          'UPDATE folder_hierarchy SET sort_order = ? WHERE id = ?',
          [sibling.sort_order, folderId],
          (err) => {
            if (err) {
              reject(err);
            } else {
              db.run(
                'UPDATE folder_hierarchy SET sort_order = ? WHERE id = ?',
                [currentFolder.sort_order, sibling.id],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            }
          }
        );
      });
    }

    db.close();

    return NextResponse.json({ message: 'Folder reordered successfully' });
  } catch (error) {
    console.error('Error reordering folder:', error);
    return NextResponse.json(
      { error: 'Failed to reorder folder' },
      { status: 500 }
    );
  }
}