import { z } from 'genkit';

export const UploadResourceInputSchema = z.object({
  scheme: z.string().describe('The academic scheme (e.g., 2022).'),
  branch: z.string().describe('The engineering branch (e.g., cse).'),
  semester: z.string().describe('The semester (e.g., 3).'),
  subject: z.string().describe('The subject code (e.g., 22CS32).'),
  fileName: z.string().describe('The name of the file being uploaded.'),
  fileDataUri: z
    .string()
    .describe(
      "The file content as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  resourceType: z.enum(['Notes', 'Question Paper']).describe('The type of resource being uploaded.'),
  module: z.string().optional().describe('The module number for notes (e.g., module1).'),
});

export type UploadResourceInput = z.infer<typeof UploadResourceInputSchema>;

export const UploadResourceOutputSchema = z.object({
  fileUrl: z.string().describe('The public URL of the file stored in AWS S3.'),
  summary: z.string().optional().describe('A summary of the file content if it was a PDF.'),
});

export type UploadResourceOutput = z.infer<typeof UploadResourceOutputSchema>;
