export function getAuthHeaders(token: string) {
  return {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  }
}
