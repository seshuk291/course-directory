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

    const { displayName } = await request.json();

    if (!displayName || !displayName.trim()) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    const db = await initDatabase();

    await new Promise<void>((resolve, reject) => {
      db.run(
        'UPDATE folder_hierarchy SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND directory_id = ?',
        [displayName.trim(), folderId, directoryId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    db.close();

    return NextResponse.json({ message: 'Folder updated successfully' });
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json(
      { error: 'Failed to update folder' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const db = await initDatabase();

    // Move child folders to parent
    await new Promise<void>((resolve, reject) => {
      db.get(
        'SELECT parent_id FROM folder_hierarchy WHERE id = ?',
        [folderId],
        (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          
          const parentId = row?.parent_id;
          
          // Update child folders to have the same parent as the folder being deleted
          db.run(
            'UPDATE folder_hierarchy SET parent_id = ? WHERE parent_id = ?',
            [parentId, folderId],
            (err) => {
              if (err) {
                reject(err);
              } else {
                // Move chapters to parent folder
                db.run(
                  'UPDATE chapters SET folder_id = ? WHERE folder_id = ?',
                  [parentId, folderId],
                  (err) => {
                    if (err) {
                      reject(err);
                    } else {
                      // Delete the folder
                      db.run(
                        'DELETE FROM folder_hierarchy WHERE id = ? AND directory_id = ?',
                        [folderId, directoryId],
                        (err) => {
                          if (err) reject(err);
                          else resolve();
                        }
                      );
                    }
                  }
                );
              }
            }
          );
        }
      );
    });

    db.close();

    return NextResponse.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}