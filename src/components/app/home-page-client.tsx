'use client';

import { useState } from 'react';
import { CourseSelector } from './course-selector';
import { ResourceList } from './resource-list';
import { Subject } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { vtuResources } from '@/lib/vtu-data';

export function HomePageClient() {
  const [selectedFilters, setSelectedFilters] = useState<{
    scheme: string;
    branch: string;
    year: string;
    semester: string;
  } | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getStaticSubjects = (scheme: string, branch: string, semester: string): Subject[] => {
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
        if (value && value !== '#') {
          acc[key] = { name: key, url: value as string, summary: '' };
        }
        return acc;
      }, {} as { [module: string]: any }),
      questionPapers: (s.questionPapers.current ? [{ name: 'Current', url: s.questionPapers.current, summary: '' }, { name: 'Previous', url: s.questionPapers.previous, summary: '' }] : []).filter(qp => qp.url !== '#'),
    }));
  }

  const handleSearch = async (filters: { scheme: string; branch: string; year: string; semester: string }) => {
    setIsLoading(true);
    setSelectedFilters(filters);
    
    try {
      const { scheme, branch, semester } = filters;
      const response = await fetch(`/api/resources?scheme=${scheme}&branch=${branch}&semester=${semester}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch resources.');
      }
      
      const dynamicSubjects: Subject[] = await response.json();
      const staticSubjects = getStaticSubjects(scheme, branch, semester);

      const subjectsMap = new Map<string, Subject>();

      // Add all static subjects to the map first
      for (const subject of staticSubjects) {
          subjectsMap.set(subject.name.trim(), JSON.parse(JSON.stringify(subject))); // Deep copy
      }

      // Merge dynamic subjects into the map
      for (const dynamicSubject of dynamicSubjects) {
          const subjectId = dynamicSubject.name.trim();
          const existingSubject = subjectsMap.get(subjectId);

          if (existingSubject) {
              // If subject exists, merge notes and question papers
              Object.assign(existingSubject.notes, dynamicSubject.notes);

              const existingQpUrls = new Set(existingSubject.questionPapers.map(qp => qp.url));
              dynamicSubject.questionPapers.forEach(qp => {
                  if (!existingQpUrls.has(qp.url)) {
                      existingSubject.questionPapers.push(qp);
                  }
              });
          } else {
              // If subject does not exist, add it to the map
              subjectsMap.set(subjectId, dynamicSubject);
          }
      }

      setSubjects(Array.from(subjectsMap.values()));

    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not fetch resources. Please try again later.',
      });
      setSubjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="space-y-8">
        <CourseSelector onSearch={handleSearch} isLoading={isLoading} />
        <ResourceList subjects={subjects} isLoading={isLoading} filtersSet={!!selectedFilters} />
      </div>
    </div>
  );
}
