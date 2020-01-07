export function getAuthHeaders(token?: string) {
  const headers: { headers: Record<string, string> } = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  if (token) {
    headers.headers.Authorization = 'Bearer ' + token;
  }
  return headers;
}
