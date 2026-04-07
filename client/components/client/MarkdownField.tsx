"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import rehypeSanitize from "rehype-sanitize";
import MDEditor, { commands } from "@uiw/react-md-editor";
import MediaLibraryModal from "./MediaLibraryModal";

const MDEditorWithNoSSR = dynamic(
  () => import("@uiw/react-md-editor"),
  { ssr: false, loading: () => <div className="animate-pulse h-64 bg-slate-100 rounded-xl"></div> }
);

interface MarkdownFieldProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
}

export default function MarkdownField({ value, onChange, label = "Nội dung", placeholder = "Viết nội dung dự án..." }: MarkdownFieldProps) {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  
  // Custom toolbar command to open our image modal
  const imageCommand = {
    name: 'image',
    keyCommand: 'image',
    buttonProps: { 'aria-label': 'Insert Image' },
    icon: (
      <svg width="12" height="12" viewBox="0 0 20 20">
        <path fill="currentColor" d="M15 9c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4-7H1C.5 2 0 2.5 0 3v14c0 .5.5 1 1 1h18c.5 0 1-.5 1-1V3c0-.5-.5-1-1-1zM3 16l4-5 3.5 4.5 3-4L17 16H3z" />
      </svg>
    ),
    execute: (state: any, api: any) => {
      setIsMediaModalOpen(true);
    }
  };

  const handleImageSelect = useCallback((url: string) => {
    // Insert into cursor using basic DOM textarea replacement 
    const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
    const textToInsert = `![Image](${url})`;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const prevValue = value;
      
      const newValue = prevValue.substring(0, start) + textToInsert + prevValue.substring(end);
      onChange(newValue);
      
      // Attempt to put cursor back
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
      }, 0);
    } else {
      // Fallback
      onChange(value + "\n" + textToInsert + "\n");
    }
  }, [value, onChange]);

  // Set sticky CSS for the toolbar dynamically
  const containerStyle = {
    "--color-canvas-default": "transparent",
  } as React.CSSProperties;

  return (
    <div className="md-editor-container space-y-2">
      {label && <label className="block text-smaller font-semibold mb-2">{label}</label>}
      <div className="flex justify-end mb-2">
         <button
            type="button"
            onClick={() => setIsMediaModalOpen(true)}
            className="px-3 py-1.5 text-smaller font-bold flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base">image</span>
            Chèn ảnh từ thư viện
          </button>
      </div>
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm" style={containerStyle}>
        <MDEditorWithNoSSR
          value={value}
          onChange={(val) => onChange(val || "")}
          previewOptions={{ rehypePlugins: [[rehypeSanitize]] }}
          commands={[...commands.getCommands().filter(c => c.name !== 'image'), imageCommand]}
          height={400}
          className="w-md-editor-sticky-toolbar"
          textareaProps={{
            placeholder: placeholder
          }}
        />
      </div>

      {isMediaModalOpen && (
        <MediaLibraryModal
          isOpen={true}
          onClose={() => setIsMediaModalOpen(false)}
          onSelect={(url) => {
            handleImageSelect(url);
            setIsMediaModalOpen(false);
          }}
        />
      )}
      
      <style jsx global>{`
        .w-md-editor-sticky-toolbar .w-md-editor-toolbar {
          position: sticky;
          top: 0;
          z-index: 10;
          background: var(--color-canvas-default, #fff);
          border-bottom: 1px solid var(--color-border-default, #d0d7de);
        }
        .dark .w-md-editor-sticky-toolbar .w-md-editor-toolbar {
          background: #0f172a;
          border-bottom: 1px solid #1e293b;
        }
        .w-md-editor {
          background-color: transparent !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
