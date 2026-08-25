/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, X, Check, Sparkles, AlertCircle } from 'lucide-react';
import { FORMULATION_PRESET_IMAGES } from '../utils/variantImages';

interface ImageUploadFieldProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  optional?: boolean;
  presetCategory?: string; // 'tablets' | 'oil' | 'churna' | 'syrup' | 'cream' | 'capsule' | 'all'
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
  helpText?: string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = 'https://... or upload local file',
  optional = false,
  presetCategory = 'all',
  size = 'md',
  compact = false,
  helpText
}) => {
  const [showPresets, setShowPresets] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP, GIF)');
      return;
    }
    // Limit to 5MB to keep base64 fast and browser-friendly
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image exceeds 5MB limit. Please upload a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file. Please try another.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const filteredPresets = presetCategory === 'all'
    ? FORMULATION_PRESET_IMAGES
    : FORMULATION_PRESET_IMAGES.filter(p => p.form === presetCategory || p.id === presetCategory);

  return (
    <div className="space-y-1.5 w-full" id={id}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-green-700" />
            <span>{label}</span>
            {optional && <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>}
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {compact ? (
        /* Compact inline layout (ideal for tables, inline drawers, variant quick adder) */
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            {value ? (
              <div className="relative group shrink-0">
                <img
                  src={value}
                  alt="Preview"
                  className="w-9 h-9 rounded-lg object-cover border border-green-300 bg-white shadow-2xs"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-lg bg-slate-50 border border-dashed border-slate-300 hover:border-green-500 flex flex-col items-center justify-center text-slate-400 hover:text-green-600 cursor-pointer transition-colors shrink-0"
                title="Click to upload image"
              >
                <Upload className="w-3.5 h-3.5" />
              </div>
            )}

            <div className="flex-1 min-w-0 relative">
              <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-600 truncate"
              />
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 bg-slate-100 hover:bg-green-50 hover:text-green-700 text-slate-600 rounded-lg border border-slate-200 text-xs font-semibold cursor-pointer transition-colors shrink-0"
              title="Upload file from device"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                showPresets ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 border-slate-200'
              }`}
              title="Choose from Ayurvedic formulation gallery"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Full rich layout (ideal for main product creation modals & detailed editors) */
        <div className="space-y-2">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-3 transition-all ${
              dragActive 
                ? 'border-green-500 bg-green-50/50 scale-[1.01]' 
                : value 
                  ? 'border-green-200 bg-emerald-50/20' 
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Preview Thumbnail */}
              <div className="relative group shrink-0">
                {value ? (
                  <div className="relative">
                    <img
                      src={value}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-green-200 bg-white shadow-2xs"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => onChange('')}
                      className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 shadow-sm cursor-pointer transition-all"
                      title="Clear photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-green-700 hover:border-green-400 cursor-pointer transition-colors shadow-2xs group"
                  >
                    <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold mt-1 text-slate-500 group-hover:text-green-700">Upload</span>
                  </div>
                )}
              </div>

              {/* Controls and Input */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <LinkIcon className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white hover:bg-green-50 text-slate-700 hover:text-green-800 border border-slate-200 hover:border-green-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5 text-green-700" />
                    <span className="hidden sm:inline">Browse</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPresets(!showPresets)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all shrink-0 border ${
                      showPresets 
                        ? 'bg-amber-100 border-amber-300 text-amber-900' 
                        : 'bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline">Presets</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Drag & drop image here or paste URL</span>
                  {value && (
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Image Active
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Preset Gallery Drawer */}
      {showPresets && (
        <div className="p-2.5 bg-slate-50 border border-amber-200 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1 duration-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
            <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Ayurvedic Formulation Preset Visuals</span>
            </span>
            <button
              type="button"
              onClick={() => setShowPresets(false)}
              className="text-[10px] text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {filteredPresets.map((preset) => {
              const isSelected = value === preset.image;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onChange(preset.image);
                    setShowPresets(false);
                  }}
                  className={`p-1.5 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-500/20'
                      : 'bg-white hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <img
                    src={preset.image}
                    alt={preset.label}
                    className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-900 truncate leading-tight">{preset.label}</p>
                    <p className="text-[8px] text-slate-500 uppercase font-semibold">{preset.form}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {helpText && <p className="text-[10px] text-slate-500">{helpText}</p>}
    </div>
  );
};
