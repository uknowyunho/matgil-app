import * as ImageManipulator from 'expo-image-manipulator';

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;

export async function resizeImage(uri: string): Promise<{ uri: string; width: number; height: number }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  return { uri: result.uri, width: result.width, height: result.height };
}

export async function uploadToS3(
  uploadUrl: string,
  fileUri: string,
  mimeType: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const response = await fetch(fileUri);
  const blob = await response.blob();

  await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
    },
    body: blob,
  });

  onProgress?.(1);
}

export async function getFileSize(uri: string): Promise<number> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob.size;
}
