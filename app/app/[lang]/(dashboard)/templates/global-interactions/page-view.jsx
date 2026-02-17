"use client";

import { useState, useEffect } from "react";
import { Save, Copy, Download, Loader2, Type } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGlobalInstructions, updateGlobalInstructions } from "@/config/functions/ai-interactions";
import { toast } from "react-hot-toast";
import dynamic from 'next/dynamic';
import { EditorState } from 'draft-js';
import { stateToMarkdown } from 'draft-js-export-markdown';
import { stateFromMarkdown } from 'draft-js-import-markdown';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

// Dynamically import the Editor to avoid SSR issues
const Editor = dynamic(
  () => import('react-draft-wysiwyg').then((mod) => mod.Editor),
  { ssr: false }
);

const GlobalAIPage = () => {
  const queryClient = useQueryClient();
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
  const [isRawMode, setIsRawMode] = useState(false);
  const [rawMarkdown, setRawMarkdown] = useState("");

  const { data: initialData, isLoading, isError } = useQuery({
    queryKey: ['global-instructions'],
    queryFn: getGlobalInstructions,
  });

  useEffect(() => {
    if (initialData?.data?.instructions) {
      const markdown = initialData.data.instructions;
      setRawMarkdown(markdown);
      
      // Convert markdown to Draft.js ContentState
      const contentState = stateFromMarkdown(markdown);
      setEditorState(EditorState.createWithContent(contentState));
    }
  }, [initialData]);

  const saveMutation = useMutation({
    mutationFn: updateGlobalInstructions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-instructions'] });
      toast.success("Saved successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Error saving");
    }
  });

  const getMarkdownContent = () => {
    if (isRawMode) {
      return rawMarkdown;
    } else {
      const contentState = editorState.getCurrentContent();
      return stateToMarkdown(contentState);
    }
  };

  const handleSave = () => {
    const markdown = getMarkdownContent();
    if (markdown) {
      saveMutation.mutate({ instructions: markdown });
    }
  };

  const handleCopy = () => {
    const markdown = getMarkdownContent();
    if (markdown) {
      navigator.clipboard.writeText(markdown);
      toast.success("Copied to clipboard!");
    }
  };

  const handleDownload = () => {
    const markdown = getMarkdownContent();
    if (markdown) {
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ai-instructions.md';
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded as markdown file!");
    }
  };

  const toggleMode = () => {
    if (!isRawMode) {
      // Switching from WYSIWYG to raw mode
      const contentState = editorState.getCurrentContent();
      const markdown = stateToMarkdown(contentState);
      setRawMarkdown(markdown);
    } else {
      // Switching from raw to WYSIWYG mode
      const contentState = stateFromMarkdown(rawMarkdown);
      setEditorState(EditorState.createWithContent(contentState));
    }
    setIsRawMode(!isRawMode);
  };

  const handleReset = () => {
    const originalMarkdown = initialData?.data?.instructions || '';
    setRawMarkdown(originalMarkdown);
    const contentState = stateFromMarkdown(originalMarkdown);
    setEditorState(EditorState.createWithContent(contentState));
    toast.success("Reset to original content");
  };

  const getCharacterCount = () => {
    if (isRawMode) {
      return rawMarkdown.length;
    } else {
      return editorState.getCurrentContent().getPlainText('').length;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error loading instructions</p>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['global-instructions'] })}
            className="mt-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Global AI Instructions</h1>
          <p className="text-gray-600 mt-2">
            Define how the AI should behave across all templates and projects
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-6">
          <button
            onClick={toggleMode}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Type size={16} />
            <span>{isRawMode ? 'Switch to WYSIWYG Editor' : 'Switch to Raw Markdown'}</span>
          </button>
        </div>

        {/* Editor Area */}
        <div className="mb-6">
          {isRawMode ? (
            <textarea
              value={rawMarkdown}
              onChange={(e) => setRawMarkdown(e.target.value)}
              className="w-full min-h-[500px] p-4 text-gray-800 font-mono text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter markdown here..."
              spellCheck="false"
            />
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Editor
                editorState={editorState}
                onEditorStateChange={setEditorState}
                wrapperClassName="wrapper-class"
                editorClassName="editor-class p-4 min-h-[500px] bg-white"
                toolbarClassName="toolbar-class border-b bg-gray-50"
                toolbar={{
                  options: ['inline', 'list', 'history'],
                  inline: {
                    options: ['bold', 'italic', 'underline', 'strikethrough'],
                  },
                  list: {
                    options: ['unordered', 'ordered'],
                  },
                }}
                placeholder="Start typing your AI instructions..."
              />
            </div>
          )}
        </div>

        {/* Info and Actions */}
        <div className="border-t pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleReset}
                className="text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5 hover:bg-gray-50 rounded"
              >
                Reset to Original
              </button>
              <span className="text-gray-500 text-sm">
                {getCharacterCount()} characters
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border"
              >
                <Copy size={18} />
                <span>Copy</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-4 py-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              >
                <Download size={18} />
                <span>Download</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Markdown Tips:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="space-y-1">
              <p><code># Heading 1</code></p>
              <p><code>## Heading 2</code></p>
              <p><code>**bold text**</code></p>
              <p><code>*italic text*</code></p>
            </div>
            <div className="space-y-1">
              <p><code>- Bullet point</code></p>
              <p><code>1. Numbered item</code></p>
              <p><code>---</code> (horizontal rule)</p>
              <p>Two newlines = paragraph break</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GlobalAIPage;