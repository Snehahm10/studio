// This is a server-side file!
'use server';

/**
 * @fileOverview A chatbot flow that answers questions about VTU courses and syllabus.
 *
 * - vtuChatbot - A function that handles the chatbot interaction.
 * - VtuChatbotInput - The input type for the vtuChatbot function.
 * - VtuChatbotOutput - The return type for the vtuChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VtuChatbotInputSchema = z.object({
  query: z.string().describe('The user query about VTU courses or syllabus.'),
  resources: z.string().describe('Relevant VTU syllabus and course information to answer the query.'),
});
export type VtuChatbotInput = z.infer<typeof VtuChatbotInputSchema>;

const VtuChatbotOutputSchema = z.object({
  answer: z.string().describe('The answer to the user query based on the provided resources.'),
});
export type VtuChatbotOutput = z.infer<typeof VtuChatbotOutputSchema>;

export async function vtuChatbot(input: VtuChatbotInput): Promise<VtuChatbotOutput> {
  return vtuChatbotFlow(input);
}

const vtuChatbotPrompt = ai.definePrompt({
  name: 'vtuChatbotPrompt',
  input: {schema: VtuChatbotInputSchema},
  output: {schema: VtuChatbotOutputSchema},
  prompt: `You are a chatbot assistant specialized in answering questions about Visvesvaraya Technological University (VTU) courses and syllabus.

  Use the provided resources to answer the user's question. If the answer is not found in the resources, respond politely that you cannot answer the question.  Do not make up answers.

  Resources:
  {{resources}}

  Question: {{{query}}}`,
});

const vtuChatbotFlow = ai.defineFlow(
  {
    name: 'vtuChatbotFlow',
    inputSchema: VtuChatbotInputSchema,
    outputSchema: VtuChatbotOutputSchema,
  },
  async input => {
    const {output} = await vtuChatbotPrompt(input);
    return output!;
  }
);
