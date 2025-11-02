import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getDirectoryFolders } from '@/lib/database';
import fs from 'fs';
import path from 'path';

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
    
    // Get the directory path first
    const directory = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT * FROM selected_directories WHERE id = ?',
        [directoryId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!directory) {
      db.close();
      return NextResponse.json({ error: 'Directory not found' }, { status: 404 });
    }

    // Get course structure including folders and chapters
    const folders = await getDirectoryFolders(directoryId);
    
    // Get chapters for this directory
    let chapters = await new Promise<any[]>((resolve, reject) => {
      db.all(
        'SELECT * FROM chapters WHERE directory_id = ? ORDER BY sort_order, name',
        [directoryId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // If no chapters in database, scan the directory and populate
    if (chapters.length === 0) {
      console.log(`Scanning directory for chapters: ${directory.original_path}`);
      chapters = await scanAndPopulateChapters(db, directoryId, directory.original_path);
    }

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

async function scanAndPopulateChapters(db: any, directoryId: number, directoryPath: string): Promise<any[]> {
  const chapters: any[] = [];
  
  function scanDirectory(currentPath: string, relativePath: string = '') {
    try {
      const items = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item.name);
        const relativeFilePath = path.join(relativePath, item.name).replace(/\\/g, '/');
        
        if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase();
          if (['.html', '.htm', '.mp4', '.avi', '.mov', '.wmv', '.flv'].includes(ext)) {
            const chapter = {
              directory_id: directoryId,
              name: item.name,
              filename: item.name,
              path: relativeFilePath,
              original_path: fullPath,
              type: ['.mp4', '.avi', '.mov', '.wmv', '.flv'].includes(ext) ? 'video' : 'html',
              folder_id: null,
              sort_order: 0
            };
            
            // Insert into database
            db.run(
              `INSERT INTO chapters (directory_id, folder_id, name, filename, path, original_path, type, sort_order) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [chapter.directory_id, chapter.folder_id, chapter.name, chapter.filename, chapter.path, chapter.original_path, chapter.type, chapter.sort_order]
            );
            
            chapters.push(chapter);
          }
        } else if (item.isDirectory()) {
          scanDirectory(fullPath, relativeFilePath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${currentPath}:`, error);
    }
  }
  
  if (fs.existsSync(directoryPath)) {
    scanDirectory(directoryPath);
  }
  
  return chapters;
}