'use server';

/**
 * @fileOverview An AI flow to handle resource uploads to AWS S3.
 *
 * - uploadResource - Handles the file upload and S3 storage.
 */

import { ai } from '@/ai/genkit';
import { uploadFileToS3 } from '@/lib/s3';
import { UploadResourceInput, UploadResourceInputSchema, UploadResourceOutput, UploadResourceOutputSchema } from './upload-types';

export async function uploadResource(input: UploadResourceInput): Promise<UploadResourceOutput> {
  return uploadResourceFlow(input);
}

const uploadResourceFlow = ai.defineFlow(
  {
    name: 'uploadResourceFlow',
    inputSchema: UploadResourceInputSchema,
    outputSchema: UploadResourceOutputSchema,
  },
  async (input) => {
    const { fileDataUri, scheme, branch, semester, subject, fileName, resourceType, module } = input;
    
    // Determine the folder path in S3
    const path = ['VTU Assistant', scheme, branch, semester, subject];
    
    if (resourceType === 'Notes' && module) {
      path.push('notes', module);
    } else if (resourceType === 'Question Paper') {
      path.push('question-papers');
    }

    // Decode the file content from the data URI
    const fileBuffer = Buffer.from(fileDataUri.substring(fileDataUri.indexOf(',') + 1), 'base64');
    const mimeType = fileDataUri.substring(fileDataUri.indexOf(':') + 1, fileDataUri.indexOf(';'));

    // Upload the file to S3
    const publicUrl = await uploadFileToS3(fileBuffer, fileName, mimeType, path);

    // Return the URL without a summary
    return {
      fileUrl: publicUrl,
      summary: undefined,
    };
  }
);
