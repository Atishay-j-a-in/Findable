import React from 'react'
import { useState } from 'react';
const DropFile = () => {
  const outerText = "• DROP YOUR FILE • ENABLE OCR • ";
  const innerText = "•MAKE IT FINDABLE•EASE HUSTLE• ";
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [status, setStatus] = useState('idle');

  // Function to send file to Backend
  const uploadFile = async (file) => {
    setStatus('uploading');
    const formData = new FormData();
    formData.append('file', file); // 'file' is the key your backend will look for

    try {
      const response = await fetch('http://localhost:5500/upload/ocr', {
        method: 'POST',
        body: formData,
        // Do not set Content-Type header; the browser sets it automatically for FormData
      });

      if (response.ok) {
        setStatus('success');

        const blob = await response.blob();
      
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `ocr_${file.name.split('.')[0]}.pdf`);
        document.body.appendChild(link);
        link.click();

        // Cleanup
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        setStatus({
          type: 'success',
          message: 'Success! Your searchable PDF is downloading.'
        });
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error("Upload error:", error);
      setStatus('error');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setFileName(files[0].name);
      uploadFile(files[0]); // Trigger upload on drop
    }
  };
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      uploadFile(file); // Trigger upload on click-select
    }
  };
  return (
    <div className="relative flex items-center justify-center h-fit bg-gradient-to-r bg-transparent">

      {/* 1. Outer Glass Slab (Large) */}
      <div className="relative flex items-center justify-center w-120 h-120">

        {/* Circular Text for Outer Slab */}
        <div className="absolute inset-0 animate-[spin_20s_linear_infinite]">
          <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
            <path id="outerCirclePath" d="M 100, 100 m -90, 0 a 90,90 0 1,1 180,0 a 90,90 0 1,1 -180,0" fill="transparent" />
            <text className="text-[10px] uppercase tracking-[1em] font-bold fill-gray-800/60">
              <textPath href="#outerCirclePath" startOffset="0%">
                {outerText}
              </textPath>
            </text>
          </svg>
        </div>

        {/* Outer Glass Body */}
        <div className="absolute w-100 h-100 rounded-full bg-white/10 backdrop-blur-2xl border border-white/30 shadow-2xl flex items-center justify-center">

          {/* 2. Inner Glass Slab (Small) */}
          <div className="relative flex items-center justify-center w-[220px] h-[220px]">

            {/* Circular Text for Inner Slab */}
            <div className="absolute inset-0 animate-[spin_15s_linear_infinite_reverse]">
              <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                <path id="innerCirclePath" d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0" fill="transparent" />
                <text className="text-[10px] uppercase tracking-[1em] font-semibold fill-gray-700/80">
                  <textPath href="#innerCirclePath" startOffset="0%">
                    {innerText}
                  </textPath>
                </text>
              </svg>
            </div>
            {/* 3. The Drag & Drop Input (Center Slab) */}
            <label
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                relative cursor-pointer transition-all duration-300
                w-[160px] h-[160px] rounded-full flex flex-col items-center justify-center text-center p-4
                backdrop-blur-3xl border-2 shadow-inner group
                ${isDragging
                  ? 'bg-white/40 border-blue-400 scale-110'
                  : 'bg-white/25 border-white/50 hover:bg-white/35'}
                  ${status === 'uploading' ? 'animate-pulse border-yellow-400' : ''}
              ${status === 'success' ? 'border-green-400' : ''}
              `}
            >
              <input type="file" className="hidden" onChange={handleFileSelect} />

              {/* Icon / Content */}
              <div className="text-gray-700 flex flex-col justify-center items-center  pointer-events-none">
                {/* Icon changes based on status */}
                {status === 'uploading' ? (
                  <div className="w-8 h-8 border-4  border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                ) : (
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}

                <p className="text-[10px] font-bold uppercase tracking-widest">
                  {status === 'success' ? 'Uploaded!' : (fileName || 'Drop File')}
                </p>
              </div>

              {/* Visual Feedback Overlay */}
              {status === 'success' && (
                <div className="absolute inset-0  backdrop-blur-sm animate-in fade-in duration-500"></div>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Reusable SVG Grain Filter (Hidden) */}
      <svg className="hidden">
        <filter id="frostedNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
    </div>
  )
}

export default DropFile
