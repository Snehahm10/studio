'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, X, Bot, User, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getChatbotResponse } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'bot';
  content: string;
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: "Hello! How can I help you with VTU today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }, 100);
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await getChatbotResponse([...messages, userMessage], input);

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Chatbot Error',
          description: result.error,
        });
        setMessages((prev) => [...prev, { role: 'bot', content: "Sorry, I couldn't process that. Please try again." }]);
      } else if (result.answer) {
        setMessages((prev) => [...prev, { role: 'bot', content: result.answer as string }]);
      }
    } catch (error) {
       toast({
          variant: 'destructive',
          title: 'Chatbot Error',
          description: 'An unexpected error occurred.',
        });
       setMessages((prev) => [...prev, { role: 'bot', content: "Sorry, an error occurred. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={cn("fixed bottom-4 right-4 z-50 transition-transform duration-300 ease-in-out", isOpen ? "translate-x-[500px]" : "translate-x-0")}>
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-16 h-16 bg-primary shadow-lg hover:bg-primary/90"
          aria-label="Open chat"
        >
          <MessageSquare className="w-8 h-8 text-primary-foreground" />
        </Button>
      </div>

      <div className={cn("fixed bottom-4 right-4 z-50 w-full max-w-sm transition-transform duration-300 ease-in-out", isOpen ? "translate-x-0" : "translate-x-[500px]")}>
          <Card className="flex flex-col h-[60vh] shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="w-6 h-6 text-primary" />
                <CardTitle>VTU AI Assistant</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                    {messages.map((message, index) => (
                        <div
                        key={index}
                        className={cn(
                            'flex items-end gap-2',
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                        >
                        {message.role === 'bot' && (
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className='bg-primary text-primary-foreground'><Bot className="w-5 h-5"/></AvatarFallback>
                            </Avatar>
                        )}
                        <p className={cn(
                            'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                            message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}>
                            {message.content}
                        </p>
                        {message.role === 'user' && (
                             <Avatar className="h-8 w-8">
                                <AvatarFallback><User className="w-5 h-5"/></AvatarFallback>
                            </Avatar>
                        )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-end gap-2 justify-start">
                             <Avatar className="h-8 w-8">
                                <AvatarFallback className='bg-primary text-primary-foreground'><Bot className="w-5 h-5"/></AvatarFallback>
                            </Avatar>
                            <p className="max-w-[75%] rounded-lg px-3 py-2 text-sm bg-muted">
                                <Loader2 className="w-5 h-5 animate-spin" />
                            </p>
                        </div>
                    )}
                    </div>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about VTU..."
                  autoComplete="off"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
      </div>
    </>
  );
}
