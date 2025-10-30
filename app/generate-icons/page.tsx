'use client';

import { useEffect, useRef } from 'react';

export default function GenerateIconsPage() {
  const canvas192Ref = useRef<HTMLCanvasElement>(null);
  const canvas512Ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const drawIcon = (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = canvas.width;

      // 背景色 - emerald green
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 0, size, size);

      // 白色对勾
      ctx.strokeStyle = 'white';
      ctx.lineWidth = size * 0.15;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(size * 0.25, size * 0.5);
      ctx.lineTo(size * 0.4, size * 0.65);
      ctx.lineTo(size * 0.75, size * 0.3);
      ctx.stroke();
    };

    if (canvas192Ref.current) drawIcon(canvas192Ref.current);
    if (canvas512Ref.current) drawIcon(canvas512Ref.current);
  }, []);

  const downloadCanvas = (canvas: HTMLCanvasElement | null, filename: string) => {
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">生成应用图标</h1>

      <div className="space-y-6">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">192x192 图标</h2>
          <canvas
            ref={canvas192Ref}
            width={192}
            height={192}
            className="border mb-2"
          />
          <button
            onClick={() => downloadCanvas(canvas192Ref.current, 'icon-192.png')}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500"
          >
            下载 icon-192.png
          </button>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">512x512 图标</h2>
          <canvas
            ref={canvas512Ref}
            width={512}
            height={512}
            className="border mb-2"
            style={{ maxWidth: '256px' }}
          />
          <button
            onClick={() => downloadCanvas(canvas512Ref.current, 'icon-512.png')}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500"
          >
            下载 icon-512.png
          </button>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">使用说明：</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>点击上面的按钮下载两个图标文件</li>
            <li>将下载的文件放到项目的 <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">public/</code> 目录</li>
            <li>重启开发服务器</li>
            <li>再次访问 <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">/pwa-check</code> 验证</li>
          </ol>
        </div>
      </div>

      <div className="mt-6">
        <a
          href="/pwa-check"
          className="inline-block px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500"
        >
          返回检查页面
        </a>
      </div>
    </div>
  );
}
