// Identity of the Firebase project behind the website. These values identify the project to the
// browser and are meant to be public — access is enforced by firestore.rules. Kept free of imports
// so the Vercel functions in api/ can use them too.

// The site owner's account. Their first login creates their admin profile; see firestore.rules.
export const OWNER_EMAIL = 'aceattacker028@gmail.com';

export const FIREBASE_PROJECT = {
  apiKey: 'AIzaSyDFn12BAEpyC-oI1TrSgvt4flSuWiuhVCY',
  authDomain: 'ag-construction-builders.firebaseapp.com',
  projectId: 'ag-construction-builders',
  messagingSenderId: '769512310378',
  appId: '1:769512310378:web:11fdcd7afae85e78212c13',
};
