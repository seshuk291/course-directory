import { NextRequest, NextResponse } from 'next/server';
import { getCategories, createCategory } from '@/lib/courseUtils';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, color } = await request.json();
    
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const categoryId = await createCategory(name.trim(), description?.trim(), color || '#3b82f6');
    return NextResponse.json({ id: categoryId, message: 'Category created successfully' });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}