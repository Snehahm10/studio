
import { NextResponse } from 'next/server';
import { getFilesFromDrive } from '@/lib/drive';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scheme = searchParams.get('scheme');
  const branch = searchParams.get('branch');
  const semester = searchParams.get('semester');
  const subjectName = searchParams.get('subject');
  const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];

  if (!idToken) {
    // In a real app, this token would be validated. 
    // Since we are using a dummy auth, we will just check for its presence.
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!scheme || !branch || !semester) {
    return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
  }

  try {
    // With a real OAuth flow, you'd use a real user ID.
    const userId = 'dummy-user'; 
    
    const resources = await getFilesFromDrive(userId, { scheme, branch, semester, subject: subjectName });

    return NextResponse.json(resources);

  } catch (error: any) {
    console.error('Failed to retrieve resources:', error);
    return NextResponse.json({ error: 'Failed to retrieve resources from Google Drive' }, { status: 500 });
  }
}
