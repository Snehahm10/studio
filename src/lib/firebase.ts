
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getStorage, ref, listAll, getDownloadURL, getMetadata, updateMetadata, ListResult, StorageReference, getBytes, deleteObject, uploadBytes, uploadBytesResumable } from "firebase/storage";
import { Subject, ResourceFile } from "./data";
import { getFilesForSubject, deleteFileByPath } from './cloudinary'; // Import Cloudinary functions

// Correct and verified Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAWfHPsEOU50o5oLLNKF0YycHlyNF6gjKA",
  authDomain: "vtu-assistant-rkmf1.firebaseapp.com",
  projectId: "vtu-assistant-rkmf1",
  storageBucket: "vtu-assistant-rkmf1.appspot.com",
  messagingSenderId: "998939257663",
  appId: "1:998939257663:web:1b33f669b722eaa991c18a",
};


let firebaseApp: FirebaseApp;
if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
} else {
    firebaseApp = getApp();
}

// These functions are now delegated to Cloudinary and are kept for compatibility if needed elsewhere,
// but the primary resource fetching logic now uses Cloudinary.
// We can remove them fully later if they are confirmed to be unused.

async function getFileAsBuffer(filePath: string): Promise<Buffer> {
    // This function might still be needed for other purposes, but not for resource display
    const storage = getStorage(firebaseApp);
    const fileRef = ref(storage, filePath);
    const bytes = await getBytes(fileRef);
    return Buffer.from(bytes);
}

async function updateFileSummary(filePath: string, summary: string): Promise<void> {
    const storage = getStorage(firebaseApp);
    const fileRef = ref(storage, filePath);
    await updateMetadata(fileRef, { customMetadata: { summary } });
}


// Export the initialized app, or a placeholder if not initialized
export { firebaseApp, getFilesForSubject, deleteFileByPath, getFileAsBuffer, updateFileSummary };

