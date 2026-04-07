'use client';

import { useState, useCallback } from 'react';
import { ScanText, Loader2 } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import OCRResult from '@/components/OCRResult';
import { extractTextFromImage, OCRProgress } from '@/lib/ocr';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<OCRProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = useCallback(async (file: File) => {
    setSelectedImage(file);
    setExtractedText('');
    setError(null);
    setIsProcessing(true);
    setProgress(null);

    try {
      const text = await extractTextFromImage(file, (p) => {
        setProgress(p);
      });
      setExtractedText(text);
    } catch (err) {
      console.error('OCR 오류:', err);
      setError('텍스트 추출 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, []);

  const handleClear = useCallback(() => {
    setSelectedImage(null);
    setExtractedText('');
    setError(null);
    setProgress(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ScanText className="text-blue-500" size={40} />
            <h1 className="text-4xl font-bold text-gray-800">이미지 텍스트 추출</h1>
          </div>
          <p className="text-gray-600 text-lg">
            이미지를 업로드하면 텍스트를 자동으로 추출합니다
          </p>
        </header>

        <main className="space-y-8">
          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
              <ScanText size={24} className="text-blue-500" />
              이미지 업로드
            </h2>
            <ImageUploader
              onImageSelect={handleImageSelect}
              selectedImage={selectedImage}
              onClear={handleClear}
            />
          </section>

          {isProcessing && (
            <section className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  텍스트를 추출 중입니다...
                </p>
                {progress && (
                  <div className="w-64">
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 text-center mt-2">
                      {progress.status} ({progress.progress}%)
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {error && (
            <section className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <p className="text-red-600 text-center">{error}</p>
            </section>
          )}

          {extractedText && !isProcessing && (
            <section className="bg-white rounded-2xl shadow-lg p-8">
              <OCRResult text={extractedText} />
            </section>
          )}
        </main>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Tesseract.js 기반 OCR 서비스</p>
        </footer>
      </div>
    </div>
  );
}
