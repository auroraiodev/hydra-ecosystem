import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const expected = `Bearer ${process.env.REVALIDATE_SECRET}`;
  if (req.headers.get('authorization') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tag = searchParams.get('tag');
  const path = searchParams.get('path');

  if (tag) {
    revalidateTag(tag, 'default');
  }

  if (path) {
    revalidatePath(path);
  }

  if (!tag && !path) {
    revalidatePath('/', 'layout');
  }

  return NextResponse.json({ revalidated: true, tag, path });
}
