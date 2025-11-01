
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { schemes, branches, years, semesters as allSemesters, cycles } from '@/lib/data';
import { vtuResources } from '@/lib/vtu-data';
import { Loader2, Upload, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { uploadResource } from '@/lib/actions';
import { useRouter } from 'next/navigation';


const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const formSchema = z.object({
  scheme: z.string().min(1, 'Please select a scheme'),
  branch: z.string().min(1, 'Please select a branch'),
  year: z.string().min(1, 'Please select a year'),
  semester: z.string().min(1, 'Please select a semester'),
  subject: z.string().min(1, 'Please select a subject'),
  resourceType: z.enum(['Notes', 'Question Paper']),
  file: z.any()
    .refine((files) => files?.length === 1, 'File is required.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE_BYTES, `Max file size is 10MB.`),
  module: z.string().optional(),
}).refine(data => {
    if (data.resourceType === 'Notes') {
        return !!data.module;
    }
    return true;
}, {
    message: "Please select a module for notes.",
    path: ['module'],
});

type FormValues = z.infer<typeof formSchema>;


export function UploadForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'pending' | 'uploading' | 'complete' | 'error'>('pending');
  const [conflict, setConflict] = useState<{ show: boolean, existingFileKey: string | null }>({ show: false, existingFileKey: null });
  const { toast } = useToast();
  const [availableSubjects, setAvailableSubjects] = useState<{ id: string, name: string }[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scheme: '',
      branch: '',
      year: '',
      semester: '',
      subject: '',
      resourceType: 'Notes',
      module: 'module1',
    },
  });

  const { watch, reset, resetField, register, handleSubmit } = form;
  const watchedScheme = watch('scheme');
  const watchedBranch = watch('branch');
  const watchedSemester = watch('semester');
  const selectedYear = watch('year');
  const resourceType = watch('resourceType');
  const fileRef = register('file');

  useEffect(() => {
    if (watchedScheme && watchedBranch && watchedSemester) {
      const schemeData = vtuResources[watchedScheme as keyof typeof vtuResources];
      const branchData = schemeData?.[watchedBranch as keyof typeof schemeData];
      const semesterData = branchData?.[watchedSemester as keyof typeof branchData] || [];
      setAvailableSubjects(semesterData.map(s => ({ id: s.id, name: s.name })));
    } else {
      setAvailableSubjects([]);
    }
    resetField('subject');
  }, [watchedScheme, watchedBranch, watchedSemester, resetField]);
  
  const availableSemesters = useMemo(() => {
    if (!selectedYear) return [];
    if (selectedYear === '1') return cycles;

    const yearNum = parseInt(selectedYear, 10);
    if (isNaN(yearNum)) return [];
    
    const startSem = (yearNum - 1) * 2 + 1;
    const endSem = startSem + 1;

    return allSemesters.filter(s => {
        const semNum = parseInt(s.value, 10);
        return semNum >= startSem && semNum <= endSem;
    });
  }, [selectedYear]);

  const semesterLabel = selectedYear === '1' ? 'Cycle' : 'Semester';

  const handleUpload = async (values: FormValues, overwrite = false, existingFileKey: string | null = null) => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not Authenticated',
            description: 'You must be logged in to upload a resource.',
        });
        return;
    }
    setIsSubmitting(true);
    setUploadStatus('uploading');
    setUploadProgress(50);

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'file') {
        formData.append(key, value[0]);
      } else if (value) {
        formData.append(key, value as string);
      }
    });

    if (overwrite) {
        formData.append('overwrite', 'true');
        if (existingFileKey) {
            formData.append('existingFileKey', existingFileKey);
        }
    }


    try {
        const result = await uploadResource(formData);

        if (result.conflict && result.existingFileKey) {
            setUploadStatus('pending');
            setIsSubmitting(false);
            setConflict({ show: true, existingFileKey: result.existingFileKey });
            return;
        }

        if (result.fileUrl) {
            setUploadProgress(100);
            setUploadStatus('complete');
            toast({
                title: 'Upload Successful!',
                description: `File uploaded. You will now be redirected.`,
            });
            reset();
            setTimeout(() => {
              router.push('/');
            }, 2000);
        } else {
            throw new Error(result.error || "An unknown error occurred during upload.");
        }
    } catch (error: any) {
        setUploadStatus('error');
        setUploadProgress(0);
        toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: error.message || 'Could not upload the file. Please try again.',
        });
    } finally {
        if (!conflict.show) { // Don't reset submitting state if we are showing conflict dialog
            setIsSubmitting(false);
        }
    }
  }

  const onConfirmOverwrite = () => {
    handleSubmit((values) => handleUpload(values, true, conflict.existingFileKey))();
    setConflict({ show: false, existingFileKey: null });
  };


  let statusIndicatorContent = null;
  switch (uploadStatus) {
    case 'uploading':
      statusIndicatorContent = <p className="text-sm text-muted-foreground mt-1">Uploading to S3...</p>;
      break;
    case 'complete':
      statusIndicatorContent = <div className="flex items-center text-sm text-green-600 mt-1"><CheckCircle2 className="mr-1 h-4 w-4" />Upload complete! Redirecting...</div>;
      break;
    case 'error':
      statusIndicatorContent = <div className="flex items-center text-sm text-destructive mt-1"><XCircle className="mr-1 h-4 w-4" />Upload failed.</div>;
      break;
    default:
      statusIndicatorContent = null;
  }
  
  return (
    <>
    <Form {...form}>
      <form onSubmit={handleSubmit(values => handleUpload(values))} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
           <FormField
                control={form.control}
                name="scheme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheme</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Scheme" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {schemes.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                     <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.value} value={b.value}>
                            {b.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                     <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <Select onValueChange={(value) => {
                        field.onChange(value);
                        resetField('semester');
                    }} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y.value} value={y.value}>
                            {y.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                     <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
                control={form.control}
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{semesterLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedYear || isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedYear ? `Select ${semesterLabel}`: "Select Year first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableSemesters.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                     <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={availableSubjects.length === 0 || isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={availableSubjects.length > 0 ? "Select Subject" : "Select filters first"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableSubjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="resourceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Type</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select resource type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Notes">Notes</SelectItem>
                        <SelectItem value="Question Paper">Question Paper</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
        </div>
       
        {resourceType === 'Notes' && (
           <FormField
              control={form.control}
              name="module"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Module</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select module" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1,2,3,4,5].map(m => (
                        <SelectItem key={m} value={`module${m}`}>{`Module ${m}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        )}
      
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>File</FormLabel>
              <FormControl>
                <Input type="file" {...fileRef} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>Select the PDF or document you want to upload (Max 10MB).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
       
        {isSubmitting && (
          <div>
             <Progress value={uploadProgress} className="h-2 mt-1" />
             {statusIndicatorContent}
          </div>
        )}
       
        <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} className="hover:bg-accent/90">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? 'Uploading...' : 'Upload Resource'}
            </Button>
        </div>
      </form>
    </Form>

    <AlertDialog open={conflict.show} onOpenChange={(open) => !open && setConflict({ show: false, existingFileKey: null })}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>File Already Exists</AlertDialogTitle>
                  <AlertDialogDescription>
                      A file for this subject and module already exists. Do you want to replace it with the new file?
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConflict({ show: false, existingFileKey: null })} disabled={isSubmitting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={onConfirmOverwrite} disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Replace
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
