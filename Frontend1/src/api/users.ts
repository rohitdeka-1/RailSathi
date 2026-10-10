export interface UserProfile {
  id: string;
  cognitoSub: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function requestProfile(token: string, displayName?: string): Promise<UserProfile> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const options: RequestInit = { headers };

  if (displayName !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.method = 'PUT';
    options.body = JSON.stringify({ displayName: displayName.trim() || null });
  }

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/users/me`, options);

  if (!response.ok) {
    if (response.status === 401) throw new Error('Your session is no longer valid. Please sign out and sign in again.');
    if (response.status === 400) throw new Error('Please enter a name of at most 100 characters.');
    throw new Error('Unable to load or save your profile. Check that the backend is running and try again.');
  }

  return response.json();
}
