'use client';

import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

interface OCRResultProps {
  text: string;
}

export default function OCRResult({ text }: OCRResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('복사에 실패했습니다:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!text.trim()) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-500">이미지에서 텍스트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">추출된 텍스트</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? '복사됨' : '복사'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Download size={18} />
            다운로드
          </button>
        </div>
      </div>
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <pre className="whitespace-pre-wrap text-gray-700 font-mono text-sm leading-relaxed">
          {text}
        </pre>
      </div>
    </div>
  );
}
