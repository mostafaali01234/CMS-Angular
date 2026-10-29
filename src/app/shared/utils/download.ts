// shared/utils/download.ts
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// an error body from a blob request arrives as a Blob, so it has to be read as text first
export async function blobError(err: any, fallback: string): Promise<string> {
  try {
    const body = JSON.parse(await (err.error as Blob).text());
    return body.message ?? body.error ?? fallback;
  } catch {
    return fallback;
  }
}