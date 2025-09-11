export function parseRawHeaders(rawHeaders: string[]): Record<string, string> {
  const headers: Record<string, string> = {};
  for (let i = 0; i < rawHeaders.length; i += 2) {
    const key = rawHeaders[i].toLowerCase();
    const value = rawHeaders[i + 1];
    headers[key] = value;
  }
  return headers;
}