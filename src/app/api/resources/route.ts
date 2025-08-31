
import { NextResponse } from 'next/server';
import { getFilesForSubject } from '@/lib/cloudinary';
import { vtuResources } from '@/lib/vtu-data';
import { Subject, ResourceFile } from '@/lib/data';

function getStaticSubjects(scheme: string, branch: string, semester: string): Subject[] {
  const schemeData = vtuResources[scheme as keyof typeof vtuResources];
  if (!schemeData) return [];
  const branchData = schemeData[branch as keyof typeof schemeData];
  if (!branchData) return [];
  const semesterData = branchData[semester as keyof typeof branchData];
  if (!semesterData) return [];

  return semesterData.map((s: any) => ({
    id: s.id,
    name: s.name,
    notes: Object.entries(s.notes).reduce((acc, [key, value]) => {
      acc[key] = { name: key, url: value as string, summary: '' };
      return acc;
    }, {} as { [module: string]: ResourceFile }),
    questionPapers: (s.questionPapers.current ? [{ name: 'Current', url: s.questionPapers.current, summary: '' }, { name: 'Previous', url: s.questionPapers.previous, summary: '' }] : []).filter(qp => qp.url !== '#'),
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scheme = searchParams.get('scheme');
  const branch = searchParams.get('branch');
  const semester = searchParams.get('semester');
  const subjectNameParam = searchParams.get('subject');

  if (!scheme || !branch || !semester) {
    return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
  }
  
  const subjectName = subjectNameParam ? subjectNameParam.trim() : undefined;

  try {
    const basePath = `resources/${scheme}/${branch}/${semester}`;
    
    const dynamicSubjects = await getFilesForSubject(basePath, subjectName);
    
    const staticSubjects = subjectName ? [] : getStaticSubjects(scheme, branch, semester);

    const subjectsMap = new Map<string, Subject>();

    for (const subject of staticSubjects) {
        subjectsMap.set(subject.name.trim(), subject);
    }

    for (const subject of dynamicSubjects) {
        const subjectId = subject.name.trim();
        const existing = subjectsMap.get(subjectId);
        if (existing) {
            Object.assign(existing.notes, subject.notes);
            const existingQpUrls = new Set(existing.questionPapers.map(qp => qp.url));
            subject.questionPapers.forEach(qp => {
                if (!existingQpUrls.has(qp.url)) {
                    existing.questionPapers.push(qp);
                }
            });
        } else {
            subjectsMap.set(subjectId, subject);
        }
    }

    const allSubjects = Array.from(subjectsMap.values());

    const finalSubjects = subjectName 
        ? allSubjects.filter(s => s.name.trim() === subjectName) 
        : allSubjects;
        
    return NextResponse.json(finalSubjects);

  } catch (error) {
    console.error('Failed to retrieve resources:', error);
    return NextResponse.json({ error: 'Failed to retrieve resources' }, { status: 500 });
  }
}
