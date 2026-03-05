import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { Upload, FileText, Scissors, Download, AlertCircle, X, Archive } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [splitSize, setSplitSize] = useState<number>(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<{ name: string; url: string; pages: string; blob: Blob }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('请上传 PDF 文件');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setGeneratedFiles([]);
      
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setPageCount(pdfDoc.getPageCount());
      } catch (err) {
        setError('无法解析 PDF 文件');
        console.error(err);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== 'application/pdf') {
        setError('请上传 PDF 文件');
        return;
      }
      setFile(droppedFile);
      setError(null);
      setGeneratedFiles([]);
      
      try {
        const arrayBuffer = await droppedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setPageCount(pdfDoc.getPageCount());
      } catch (err) {
        setError('无法解析 PDF 文件');
        console.error(err);
      }
    }
  };

  const splitPdf = async () => {
    if (!file || splitSize <= 0) return;

    setIsProcessing(true);
    setGeneratedFiles([]);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const totalPages = srcDoc.getPageCount();
      const newFiles = [];

      let startPage = 0;
      let partIndex = 1;

      while (startPage < totalPages) {
        // Calculate end page (exclusive for slice, inclusive for logic is endPage - 1)
        // If remaining pages are less than splitSize, take all remaining
        const endPage = Math.min(startPage + splitSize, totalPages);
        
        const subDoc = await PDFDocument.create();
        const pageIndices = Array.from({ length: endPage - startPage }, (_, i) => startPage + i);
        const copiedPages = await subDoc.copyPages(srcDoc, pageIndices);
        
        copiedPages.forEach((page) => subDoc.addPage(page));
        
        const pdfBytes = await subDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        newFiles.push({
          name: `${file.name.replace('.pdf', '')}_part${partIndex}.pdf`,
          url,
          pages: `${startPage + 1}-${endPage} (共 ${endPage - startPage} 页)`,
          blob
        });

        startPage = endPage;
        partIndex++;
      }

      setGeneratedFiles(newFiles);
    } catch (err) {
      setError('拆分 PDF 时出错');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAll = async () => {
    if (generatedFiles.length === 0) return;

    try {
      const zip = new JSZip();
      
      generatedFiles.forEach(file => {
        zip.file(file.name, file.blob);
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file?.name.replace('.pdf', '')}_split.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('打包下载时出错');
      console.error(err);
    }
  };

  const reset = () => {
    setFile(null);
    setPageCount(0);
    setGeneratedFiles([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
            <Scissors className="w-8 h-8 text-blue-600" />
            PDF 拆分工具
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            简单、安全、跨平台的 PDF 拆分方案
          </p>
        </div>

        {!file ? (
          <div
            className="mt-8 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-500 transition-colors cursor-pointer bg-gray-50"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <span className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  上传文件
                </span>
                <p className="pl-1">或拖拽文件到这里</p>
              </div>
              <p className="text-xs text-gray-500">支持 PDF 文件</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-md border border-blue-100">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">共 {pageCount} 页</p>
                </div>
              </div>
              <button
                onClick={reset}
                className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="splitSize" className="block text-sm font-medium text-gray-700">
                每份页数
              </label>
              <div className="flex rounded-md shadow-sm">
                <input
                  type="number"
                  name="splitSize"
                  id="splitSize"
                  min="1"
                  className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300 p-2 border"
                  placeholder="30"
                  value={splitSize}
                  onChange={(e) => setSplitSize(parseInt(e.target.value) || 0)}
                />
              </div>
              <p className="text-xs text-gray-500">
                默认每 30 页拆分一份，不足部分自动归为最后一份。
              </p>
            </div>

            <button
              onClick={splitPdf}
              disabled={isProcessing || splitSize <= 0}
              className={cn(
                "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors",
                (isProcessing || splitSize <= 0) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isProcessing ? '处理中...' : '开始拆分'}
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {generatedFiles.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">拆分结果</h3>
              <button
                onClick={downloadAll}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors shadow-sm"
              >
                <Archive className="h-4 w-4" />
                一键打包下载
              </button>
            </div>
            <div className="space-y-3">
              {generatedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{file.pages}</p>
                    </div>
                  </div>
                  <a
                    href={file.url}
                    download={file.name}
                    className="ml-4 flex-shrink-0 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                    title="下载"
                  >
                    <Download className="h-5 w-5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
