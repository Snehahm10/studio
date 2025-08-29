import { NextResponse } from 'next/server';
import { Subject } from '@/lib/data';
import { getFilesForSubject } from '@/lib/firebase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scheme = searchParams.get('scheme');
  const branch = searchParams.get('branch');
  const semester = searchParams.get('semester');
  const subject = searchParams.get('subject'); // Can be a single subject name now

  if (!scheme || !branch || !semester) {
    return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
  }

  try {
    // If a specific subject is requested, fetch only that one.
    // Otherwise, fetch all subjects for the given path.
    const path = `resources/${scheme}/${branch}/${semester}`;
    const subjects = await getFilesForSubject(path, subject || undefined);

    return NextResponse.json(subjects);

  } catch (error) {
    console.error('Failed to retrieve resources:', error);
    return NextResponse.json({ error: 'Failed to retrieve resources' }, { status: 500 });
  }
}
