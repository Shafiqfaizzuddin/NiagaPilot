export function getBusinessErrorMessage(error) {
  if (error?.code === 'permission-denied') {
    return 'Your business could not be accessed. Check the published Firestore security rules.'
  }
  if (error?.code === 'unavailable') {
    return 'Could not connect to Firestore. Check your connection and try again.'
  }
  return error?.message || 'Something went wrong. Please try again.'
}
