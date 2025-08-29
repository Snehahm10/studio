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


export async function getFilesForSubject(path: string): Promise<Subject[]> {
  if (!firebaseApp) {
    console.error("Firebase not initialized");
    return [];
  }
  const storage = getStorage(firebaseApp);
  const subjectFoldersRef = ref(storage, path);
  const subjectFolders = await listAll(subjectFoldersRef);

  const subjects: Subject[] = [];

  for (const subjectFolder of subjectFolders.prefixes) {
    const subjectName = subjectFolder.name;
    const notes: { [module: string]: ResourceFile } = {};
    const questionPapers: ResourceFile[] = [];

    const notesFolderRef = ref(storage, `${subjectFolder.fullPath}/notes`);
    try {
        const noteModuleFolders = await listAll(notesFolderRef);
        for(const moduleFolder of noteModuleFolders.prefixes) {
            const moduleFiles = await listAll(moduleFolder);
            for(const fileRef of moduleFiles.items) {
                 const url = await getDownloadURL(fileRef);
                 notes[moduleFolder.name] = { name: fileRef.name, url };
            }
        }
    } catch(e) {
        // notes folder might not exist
    }

    const qpFolderRef = ref(storage, `${subjectFolder.fullPath}/questionPapers`);

    try {
        const qpFiles = await listAll(qpFolderRef);
        for (const fileRef of qpFiles.items) {
            const url = await getDownloadURL(fileRef);
            questionPapers.push({ name: fileRef.name, url });
        }
    } catch(e) {
        // qp folder might not exist
    }


    subjects.push({
      name: subjectName,
      notes,
      questionPapers,
    });
  }

  return subjects;
}


// Export the initialized app, or a placeholder if not initialized
export { firebaseApp };
