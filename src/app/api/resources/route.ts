
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
  const subjectName = searchParams.get('subject');

  if (!scheme || !branch || !semester) {
    return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
  }

  try {
    const path = `resources/${scheme}/${branch}/${semester}`;
    
    // Fetch dynamic subjects from Cloudinary first
    const dynamicSubjects = await getFilesForSubject(path, subjectName || undefined);
    const allSubjectsMap = new Map(dynamicSubjects.map(s => [s.id.toLowerCase(), s]));

    if (subjectName) {
        // If a specific subject is requested, we rely primarily on Cloudinary.
        // If Cloudinary returns nothing, check static data as a fallback.
        if (allSubjectsMap.size > 0) {
            return NextResponse.json(Array.from(allSubjectsMap.values()));
        }
        const staticSubjects = getStaticSubjects(scheme, branch, semester);
        const filteredStatic = staticSubjects.filter(s => s.id.toLowerCase() === subjectName.toLowerCase());
        return NextResponse.json(filteredStatic);
    }
    
    // For a general query, merge static and dynamic data
    const staticSubjects = getStaticSubjects(scheme, branch, semester);

    staticSubjects.forEach(staticSubject => {
        const subjectId = staticSubject.id.toLowerCase();
        const dynamicSubject = allSubjectsMap.get(subjectId);

        if (dynamicSubject) {
            // Merge notes from static if not present in dynamic
            for(const moduleKey in staticSubject.notes) {
                if (!dynamicSubject.notes[moduleKey] && staticSubject.notes[moduleKey].url !== '#') {
                    dynamicSubject.notes[moduleKey] = staticSubject.notes[moduleKey];
                }
            }

            // Merge question papers from static if not present in dynamic
            const dynamicQpUrls = new Set(dynamicSubject.questionPapers.map(qp => qp.url));
            staticSubject.questionPapers.forEach(staticQp => {
                if (!dynamicQpUrls.has(staticQp.url) && staticQp.url !== '#') {
                    dynamicSubject.questionPapers.push(staticQp);
                }
            });
        } else {
            // Static subject doesn't exist in dynamic, so add it
            allSubjectsMap.set(subjectId, staticSubject);
        }
    });

    const combinedSubjects = Array.from(allSubjectsMap.values());
    
    return NextResponse.json(combinedSubjects);

  } catch (error) {
    console.error('Failed to retrieve resources:', error);
    return NextResponse.json({ error: 'Failed to retrieve resources' }, { status: 500 });
  }
}
