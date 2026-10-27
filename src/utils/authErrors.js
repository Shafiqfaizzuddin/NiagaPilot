export function getAuthErrorMessage(error) {
  switch (error?.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try signing in.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/invalid-credential':
      return 'The email or password is incorrect.'
    case 'auth/weak-password':
      return 'Choose a stronger password.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
