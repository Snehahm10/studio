
import { NextResponse } from 'next/server';
import { getFilesForSubject } from '@/lib/cloudinary';
import { Subject } from '@/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scheme = searchParams.get('scheme');
  const branch = searchParams.get('branch');
  const semester = searchParams.get('semester');
  const subjectNameParam = searchParams.get('subject');

  if (!scheme || !branch || !semester) {
    return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
  }
  
  const subjectName = subjectNameParam ? decodeURIComponent(subjectNameParam.trim()) : undefined;

  try {
    const basePath = `resources/${scheme}/${branch}/${semester}`;
    
    // Fetch dynamic subjects from Cloudinary
    const dynamicSubjects = await getFilesForSubject(basePath, subjectName);
    
    // Filter by subject name if the parameter is provided
    const finalSubjects = subjectName 
        ? dynamicSubjects.filter(s => s.name.trim() === subjectName) 
        : dynamicSubjects;
        
    return NextResponse.json(finalSubjects);

  } catch (error) {
    console.error('Failed to retrieve resources:', error);
    return NextResponse.json({ error: 'Failed to retrieve resources' }, { status: 500 });
  }
}
