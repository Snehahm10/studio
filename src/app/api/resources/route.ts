import { NextResponse } from 'next/server';
import { Subject } from '@/lib/data';
import { getFilesForSubject } from '@/lib/firebase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scheme = searchParams.get('scheme');
  const branch = searchParams.get('branch');
  const semester = searchParams.get('semester');

  if (!scheme || !branch || !semester) {
    return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
  }

  try {
    // This is a simplified approach. In a real app, you'd have a database 
    // of subjects and then fetch files for each subject.
    // For now, we'll imagine a predefined list of subjects and fetch files for them.
    // This part would need to be more dynamic in a real application.
    
    // We'll fetch all subjects from storage for the given path.
    // The subject name will be the folder name.
    const path = `resources/${scheme}/${branch}/${semester}`;
    const subjects = await getFilesForSubject(path);

    return NextResponse.json(subjects);

  } catch (error) {
    console.error('Failed to retrieve resources:', error);
    return NextResponse.json({ error: 'Failed to retrieve resources' }, { status: 500 });
  }
}
