export async function getTrainByNo(token: string, trainNo: string) {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/trains/${trainNo}`, { headers });

  if (!response.ok) {
    throw new Error('Could not fetch train data.');
  }

  return response.json();
}

export async function getJourneys(token: string, source: string, destination: string, date: string) {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const query = new URLSearchParams({ source, destination, date }).toString();
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/journey/search?${query}`, { headers });

  if (!response.ok) {
    throw new Error('Could not fetch journey data.');
  }

  return response.json();
}
