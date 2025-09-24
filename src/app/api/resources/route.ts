
import { NextResponse } from 'next/server';
import { getFilesFromDrive } from '@/lib/drive';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scheme = searchParams.get('scheme');
  const branch = searchParams.get('branch');
  const semester = searchParams.get('semester');
  const subjectName = searchParams.get('subject');

  if (!scheme || !branch || !semester) {
    return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
  }

  try {
    // Authentication has been removed, so userId is a placeholder.
    const userId = 'public-user'; 
    
    const resources = await getFilesFromDrive(userId, { scheme, branch, semester, subject: subjectName });

    return NextResponse.json(resources);

  } catch (error: any) {
    console.error('Failed to retrieve resources:', error);
    return NextResponse.json({ error: 'Failed to retrieve resources from Google Drive' }, { status: 500 });
  }
}
