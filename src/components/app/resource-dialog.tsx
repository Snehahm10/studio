
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Subject, ResourceFile } from '@/lib/data';
import Link from 'next/link';
import { Book, FileText, Trash2, Loader2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { deleteResource } from '@/lib/actions';
import { Button } from '../ui/button';

type ResourceDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Subject;
  onResourceDeleted: () => void;
};

function ResourceItem({ resource, onDelete }: { resource: ResourceFile; onDelete: (s3Key: string) => void; }) {
  const { toast } = useToast();

  if (!resource || !resource.url) {
      return <p className="text-sm text-muted-foreground px-2 py-1">No resource available.</p>;
  }

  const isStaticLink = resource.url.includes('vtucircle.com');

  return (
    <div className="flex items-center gap-2 group">
        <Link
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'outline' }), "flex-1 justify-start text-left h-auto flex flex-col items-start p-2")}
        >
            <span className='font-semibold'>{resource.name}</span>
            {resource.summary && (
                <span className="text-xs text-muted-foreground mt-1 line-clamp-2">{resource.summary}</span>
            )}
        </Link>
        {!isStaticLink && resource.s3Key && (
             <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDelete(resource.s3Key!)}
             >
                <Trash2 className="h-4 w-4" />
             </Button>
        )}
    </div>
  );
}

export function ResourceDialog({ isOpen, onOpenChange, subject, onResourceDeleted }: ResourceDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);

  const hasNotes = subject.notes && Object.values(subject.notes).some(r => r && r.url);
  const hasQuestionPapers = subject.questionPapers && subject.questionPapers.length > 0;
  
  const notesModules = Object.entries(subject.notes || {}).sort(([a], [b]) => a.localeCompare(b));
  const questionPapers = subject.questionPapers || [];

  const handleDeleteRequest = (s3Key: string) => {
    setDeleteCandidate(s3Key);
  }

  const executeDelete = async () => {
    if (!deleteCandidate) return;

    setIsDeleting(true);
    try {
        const result = await deleteResource(deleteCandidate);
        if (result.error) {
            throw new Error(result.error);
        }
        toast({
            title: "Success",
            description: "Resource deleted successfully."
        });
        setDeleteCandidate(null);
        onResourceDeleted(); // Trigger refresh
        onOpenChange(false); // Close dialog
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to delete resource."
        });
    } finally {
        setIsDeleting(false);
    }
  }


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{subject.name}</DialogTitle>
            <DialogDescription>Resources for {subject.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              {hasNotes && (
                <div>
                    <h4 className="font-semibold mb-2 flex items-center"><Book className="mr-2 h-4 w-4"/>Notes</h4>
                    <Separator />
                    <Accordion type="single" collapsible className="w-full" defaultValue={notesModules.length > 0 ? notesModules[0][0] : undefined}>
                       {notesModules.map(([module, resourceFile]) => (
                          <AccordionItem value={module} key={module}>
                              <AccordionTrigger>{`Module ${module.replace('module', '')}`}</AccordionTrigger>
                              <AccordionContent>
                                 <ResourceItem resource={resourceFile} onDelete={handleDeleteRequest} />
                              </AccordionContent>
                          </AccordionItem>
                      ))}
                    </Accordion>
                </div>
              )}
              {hasQuestionPapers && (
                <div className="mt-4">
                    <h4 className="font-semibold mb-2 flex items-center"><FileText className="mr-2 h-4 w-4"/>Question Papers</h4>
                    <Separator />
                    <div className="grid grid-cols-1 gap-2 mt-2">
                        {questionPapers.map((qp, index) => (
                          <ResourceItem key={`${qp.url}-${index}`} resource={qp} onDelete={handleDeleteRequest}/>
                        ))}
                    </div>
                </div>
              )}
              {!hasNotes && !hasQuestionPapers && (
                <p className="text-center text-muted-foreground">No resources found for this subject yet.</p>
              )}
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the resource from the server.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={executeDelete} disabled={isDeleting} className={buttonVariants({variant: 'destructive'})}>
                      {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Delete
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
