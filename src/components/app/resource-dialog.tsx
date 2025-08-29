
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Subject } from '@/lib/data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Book, FileText } from 'lucide-react';
import { Separator } from '../ui/separator';

type ResourceDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Subject;
};

export function ResourceDialog({ isOpen, onOpenChange, subject }: ResourceDialogProps) {
  const hasNotes = subject.notes && Object.keys(subject.notes).length > 0;
  const hasQuestionPapers = subject.questionPapers && subject.questionPapers.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{subject.name}</DialogTitle>
          <DialogDescription>Resources for {subject.name}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            {hasNotes && (
              <div>
                  <h4 className="font-semibold mb-2 flex items-center"><Book className="mr-2 h-4 w-4"/>Notes</h4>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                      {Object.entries(subject.notes).map(([key, value]) => (
                          <Button asChild variant="outline" key={key}>
                              <Link href={value.url} target="_blank" rel="noopener noreferrer">
                                  {value.name}
                              </Link>
                          </Button>
                      ))}
                  </div>
              </div>
            )}
            {hasQuestionPapers && (
              <div>
                  <h4 className="font-semibold mb-2 flex items-center"><FileText className="mr-2 h-4 w-4"/>Question Papers</h4>
                  <Separator />
                  <div className="grid grid-cols-1 gap-2 mt-2">
                      {subject.questionPapers.map((qp) => (
                        <Button asChild variant="secondary" key={qp.url}>
                          <Link href={qp.url} target="_blank" rel="noopener noreferrer">
                             {qp.name}
                          </Link>
                        </Button>
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
  );
}
