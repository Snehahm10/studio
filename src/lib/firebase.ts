// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getStorage, ref, listAll, getDownloadURL, ListResult, StorageReference } from "firebase/storage";
import { Subject, ResourceFile } from "./data";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp: FirebaseApp;
if (getApps().length === 0) {
    if (
        firebaseConfig.apiKey &&
        firebaseConfig.authDomain &&
        firebaseConfig.projectId &&
        firebaseConfig.storageBucket &&
        firebaseConfig.messagingSenderId &&
        firebaseConfig.appId
      ) {
        firebaseApp = initializeApp(firebaseConfig);
        if (typeof window !== 'undefined') {
          isSupported().then(supported => {
            if (supported) {
              getAnalytics(firebaseApp);
            }
          });
        }
      } else {
        console.error("Firebase configuration is missing. Please check your .env file.");
      }
} else {
    firebaseApp = getApp();
}


async function processSubjectFolder(subjectFolder: StorageReference): Promise<Subject> {
    const subjectName = subjectFolder.name;
    const notes: { [module: string]: ResourceFile } = {};
    const questionPapers: ResourceFile[] = [];

    const notesFolderRef = ref(subjectFolder.storage, `${subjectFolder.fullPath}/notes`);
    try {
        const noteModuleFolders = await listAll(notesFolderRef);
        for (const moduleFolder of noteModuleFolders.prefixes) {
            const moduleFiles = await listAll(moduleFolder);
            if (moduleFiles.items.length > 0) {
                // Assuming one file per module folder for simplicity in this structure
                const fileRef = moduleFiles.items[0];
                const url = await getDownloadURL(fileRef);
                notes[moduleFolder.name] = { name: fileRef.name, url };
            }
        }
    } catch (e) {
        // notes folder might not exist, which is fine
    }

    const qpFolderRef = ref(subjectFolder.storage, `${subjectFolder.fullPath}/questionPapers`);
    try {
        const qpFiles = await listAll(qpFolderRef);
        for (const fileRef of qpFiles.items) {
            const url = await getDownloadURL(fileRef);
            questionPapers.push({ name: fileRef.name, url });
        }
    } catch (e) {
        // qp folder might not exist, which is fine
    }

    return {
      id: subjectName, // Use folder name as ID
      name: subjectName,
      notes,
      questionPapers,
    };
}


export async function getFilesForSubject(path: string, subjectName?: string): Promise<Subject[]> {
  if (!firebaseApp) {
    console.error("Firebase not initialized");
    return [];
  }
  const storage = getStorage(firebaseApp);

  if (subjectName) {
      // Fetch a single subject
      const subjectFolderRef = ref(storage, `${path}/${subjectName}`);
      try {
          // We don't list here, we just assume the folder exists and process it.
          // A better check would be to get metadata, but this works for a positive case.
          const subject = await processSubjectFolder(subjectFolderRef);
          return [subject];
      } catch (error) {
          console.log(`No specific subject folder found for "${subjectName}", returning empty.`);
          // This can happen if the folder doesn't exist, which is a valid case (no resources yet)
          return [];
      }
  } else {
      // Fetch all subjects in the path
      const subjectFoldersRef = ref(storage, path);
      const subjectFoldersList = await listAll(subjectFoldersRef);
      
      const subjectPromises = subjectFoldersList.prefixes.map(processSubjectFolder);
      const subjects = await Promise.all(subjectPromises);
      return subjects;
  }
}


// Export the initialized app, or a placeholder if not initialized
export { firebaseApp };
