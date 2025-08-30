'use server';
/**
 * @fileOverview A flow for uploading files to Firebase Storage.
 *
 * - uploadFile - A function that handles the file upload process.
 * - UploadFileInput - The input type for the uploadFile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { firebaseApp } from '@/lib/firebase';
import { summarizeAndStore } from '@/lib/actions';

const UploadFileInputSchema = z.object({
  fileName: z.string().describe('The full path for the file in Firebase storage.'),
  fileContent: z.string().describe("The base64-encoded content of the file."),
  contentType: z.string().describe('The MIME type of the file.'),
});
export type UploadFileInput = z.infer<typeof UploadFileInputSchema>;


export async function uploadFile(input: UploadFileInput): Promise<{ success: boolean, error?: string }> {
  return uploadFileFlow(input);
}


const uploadFileFlow = ai.defineFlow(
  {
    name: 'uploadFileFlow',
    inputSchema: UploadFileInputSchema,
    outputSchema: z.object({ success: z.boolean(), error: z.string().optional() }),
  },
  async (input) => {
    try {
        const storage = getStorage(firebaseApp);
        const storageRef = ref(storage, input.fileName);

        // Upload the file from the base64 string.
        await uploadString(storageRef, input.fileContent, 'base64', { contentType: input.contentType });
        
        // After successful upload, trigger summarization
        const summarizationResult = await summarizeAndStore(input.fileName);

        if (!summarizationResult.success) {
            // Even if summarization fails, the upload itself was successful.
            // We might want to log this error or handle it differently.
            console.warn(`File uploaded to ${input.fileName} but summarization failed: ${summarizationResult.error}`);
        }

        return { success: true };

    } catch (error: any) {
        console.error(`File upload failed for ${input.fileName}:`, error);
        return { success: false, error: error.message || 'An unknown error occurred during file upload.' };
    }
  }
);
