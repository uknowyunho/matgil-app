import Tesseract from 'tesseract.js';

export interface OCRProgress {
  status: string;
  progress: number;
}

function preprocessImage(canvas: HTMLCanvasElement, img: HTMLImageElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const size = 4;
  canvas.width = img.width * size;
  canvas.height = img.height * size;
  
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const contrast = ((avg - 128) * 1.5) + 128;
    const val = Math.max(0, Math.min(255, contrast));
    data[i] = data[i + 1] = data[i + 2] = val > 128 ? 255 : 0;
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function postProcessText(text: string): string {
  let result = text;
  
  result = result.replace(/0{4,}/g, (match) => {
    const oCount = (match.length / 2) | 0;
    const zeros = Math.ceil(match.length / 2);
    return 'O'.repeat(oCount) + '0'.repeat(zeros);
  });
  
  const patterns = [
    { regex: /(?<![A-Za-z0-9])0(?![A-Za-z0-9])(?=[A-Z]{2,})/g, replace: 'O' },
    { regex: /(?<![A-Za-z0-9])O(?![A-Za-z0-9])(?=\d{2,})/g, replace: '0' },
    { regex: /(?<=[\dO])O(?=[\dO])/g, replace: '0' },
    { regex: /(?<=[\d])0(?=0)(?=[A-Z])/g, replace: 'O' },
  ];
  
  patterns.forEach(({ regex, replace }) => {
    result = result.replace(regex, replace);
  });
  
  return result;
}

export async function extractTextFromImage(
  imageFile: File,
  onProgress?: (progress: OCRProgress) => void
): Promise<string> {
  const img = await loadImage(imageFile);
  
  const preCanvas = document.createElement('canvas');
  preprocessImage(preCanvas, img);
  
  const preprocessedFile = await canvasToFile(preCanvas);
  
  return new Promise((resolve, reject) => {
    Tesseract.recognize(
      preprocessedFile,
      'eng+kor',
      {
        logger: (m) => {
          if (onProgress && m.status) {
            onProgress({
              status: m.status,
              progress: m.progress ? Math.round(m.progress * 100) : 0,
            });
          }
        },
      }
    )
      .then(({ data: { text } }) => {
        resolve(postProcessText(text));
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToFile(canvas: HTMLCanvasElement): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'preprocessed.png', { type: 'image/png' });
        resolve(file);
      } else {
        reject(new Error('Canvas to blob failed'));
      }
    }, 'image/png');
  });
}
