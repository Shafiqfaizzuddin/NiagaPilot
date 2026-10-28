export function getAuthErrorMessage(error) {
  if (error?.message?.includes('CONFIGURATION_NOT_FOUND')) {
    return 'Firebase Authentication is not set up for this project. In Firebase Console, open Authentication and enable Email/Password sign-in.'
  }

  switch (error?.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try signing in.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'The email or password is incorrect.'
    case 'auth/weak-password':
      return 'Choose a stronger password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a little before trying again.'
    case 'auth/network-request-failed':
      return 'Could not reach Firebase Authentication. Check your internet connection and try again.'
    case 'unavailable':
      return 'Cloud Firestore is unavailable. Check that its API is enabled and the (default) database exists in your Firebase project, then try again. Also check your internet connection.'
    case 'profile-save-failed':
      return `Your account was created, but its Firestore profile could not be saved or loaded. ${getAuthErrorMessage(error.cause)} After Firestore is ready, sign in with the same email instead of registering again.`
    case 'permission-denied':
      return 'Cloud Firestore denied access to your profile. If this database was just created, publish the project\'s firestore.rules. If the rules are already published, verify that the app and rules target the same Firebase project.'
    case 'auth/operation-not-allowed':
      return 'Email and password sign-in is not enabled for this Firebase project.'
    case 'auth/configuration-not-found':
      return 'Firebase Authentication is not set up for this project. In Firebase Console, open Authentication and enable Email/Password sign-in.'
    default:
      return 'We could not complete this request. Please try again.'
  }
}
