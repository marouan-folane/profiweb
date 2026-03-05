"use client";

import { useState, useEffect } from "react";
import { Save, Copy, Download, Loader2, Type, RefreshCw, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGlobalInstructions, updateGlobalInstructions } from "@/config/functions/ai-interactions";
import { toast } from "sonner";
import dynamic from 'next/dynamic';
import { EditorState } from 'draft-js';
import { stateToMarkdown } from 'draft-js-export-markdown';
import { stateFromMarkdown } from 'draft-js-import-markdown';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    toast.info("Reset to original content");
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
        <Loader2 className="h-12 w-12 animate-spin text-[#ddc165] mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading Global Instructions...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error loading instructions</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">We couldn't retrieve the global AI settings. Please try again.</p>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['global-instructions'] })}
            className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-4xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text dark:text-white mb-2">
              Global AI Instructions
            </h1>
            <p className="text-slate-500 dark:text-mist-50 font-medium">
              Define the baseline personality and behavioral rules for AI across all platform modules.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={toggleMode}
              className="gap-2 text-slate-600 border-slate-200 hover:bg-gray-100 dark:border-slate-300 dark:text-slate-300 dark:hover:bg-gray-100 transition-colors"
            >
              <Type className="h-4 w-4" />
              <span>{isRawMode ? 'WYSIWYG Editor' : 'Raw Markdown'}</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="gap-2 text-white  bg-[#FCCF3C] shadow-md transition-all"
            >
              {saveMutation.isPending ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Save Changes</span>
            </Button>
          </div>
        </div>

        <Card className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardContent className="p-0">
            {/* Editor Area */}
            <div className="relative">
              {isRawMode ? (
                <textarea
                  value={rawMarkdown}
                  onChange={(e) => setRawMarkdown(e.target.value)}
                  className="w-full min-h-[500px] p-6 text-slate-800 dark:text-slate-200 font-mono text-sm bg-transparent focus:outline-none placeholder-slate-400"
                  placeholder="Enter baseline instructions in markdown..."
                  spellCheck="false"
                />
              ) : (
                <div className="editor-container">
                  <style jsx global>{`
                      .rdw-editor-main {
                        padding: 1.5rem !important;
                        min-height: 500px !important;
                        color: inherit !important;
                      }
                      .rdw-editor-wrapper {
                        background: transparent !important;
                      }
                      .rdw-toolbar-wrapper {
                        border-bottom: 1px solid rgba(0,0,0,0.05) !important;
                        background: rgba(255,255,255,0.5) !important;
                        padding: 0.5rem 1rem !important;
                      }

                      /* DARK MODE — editor body */
                      .dark .rdw-editor-toolbar {
                        background: #000000 !important;
                        color: #ffffff !important;
                        padding-bottom:10px !important;
                        border:none !important;
                        border-bottom: 1px solid #ddc165 !important;
                      }
                      .dark .rdw-toolbar-wrapper {
                        background: #000000 !important;
                        border-color: #ddc165 !important;
                      }

                      .dark .rdw-editor-wrapper {
                        background: #000000 !important;
                      }
                     

                      /* DARK MODE — toolbar buttons */
                      .dark .rdw-option-wrapper {
                        background: #000000 !important;
                        border-color: rgba(220, 193, 101, 0.3) !important;
                      }
                      .dark .rdw-option-wrapper img {
                        filter: invert(1) !important;
                      }
                      .dark .rdw-option-wrapper:hover {
                        background: #FCCF3C !important;
                        border-color: #FCCF3C !important;
                      }
                      .dark .rdw-option-wrapper:hover img {
                        filter: invert(0) !important;
                      }
                      .dark .rdw-option-active {
                        background: #ddc165 !important;
                        border-color: #FCCF3C !important;
                      }

                      /* DARK MODE — dropdowns */
                      .dark .rdw-dropdown-wrapper {
                        background: #000000 !important;
                        border-color: rgba(220, 193, 101, 0.4) !important;
                        color: #ffffff !important;
                      }
                      .dark .rdw-dropdown-carettoopen {
                        border-top-color: #FCCF3C !important;
                      }
                      .dark .rdw-dropdown-carettoclose {
                        border-bottom-color: #FCCF3C !important;
                      }
                      .dark .rdw-dropdown-optionwrapper {
                        background: #000000 !important;
                        color: #ffffff !important;
                        border-color: rgba(220, 193, 101, 0.4) !important;
                      }
                      .dark .rdw-dropdown-optionwrapper li:hover {
                        background: #FCCF3C !important;
                        color: #000000 !important;
                      }

                      /* DARK MODE — placeholder */
                      .dark .public-DraftEditorPlaceholder-root {
                        color: rgba(220, 193, 101, 0.5) !important;
                      }

                      /* DARK MODE — editor focus border */
                      .dark .rdw-editor-wrapper:focus-within {
                        outline: 1px solid #ddc165 !important;
                      }
                      `}</style>  
                  <Editor
                    editorState={editorState}
                    onEditorStateChange={setEditorState}
                    placeholder="Start typing your baseline AI behaviors..."
                  />
                </div>
              )}
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-100 dark:border-white/5 p-4 bg-slate-50/50 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Reset to Original
                </Button>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#ddc165] animate-pulse" />
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {getCharacterCount()} Characters
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-9 gap-2 border-slate-200 dark:border-[#FCCF3C] hover:bg-white dark:hover:bg-white/10 dark:text-[#FCCF3C] dark:hover:bg-[#FCCF3C] dark:hover:text-white transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="h-9 gap-2 border-slate-200 dark:border-[#FCCF3C] hover:bg-white dark:hover:bg-white/10 dark:text-[#FCCF3C] dark:hover:bg-[#FCCF3C] dark:hover:text-white transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download .md</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ddc165]">Formatting Tips</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <p><code># Heading</code></p>
                <p><code>- List Item</code></p>
                <p><code>**Bold**</code></p>
                <p><code>1. Ordered</code></p>
                <p><code>*Italic*</code></p>
                <p><code>---</code> Divider</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ddc165]">Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ul className="text-xs text-slate-600 dark:text-slate-400 font-medium space-y-1">
                <li>• Be explicit about the professional tone.</li>
                <li>• Define clear constraints (what NOT to do).</li>
                <li>• Use markdown to structure hierarchy.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default GlobalAIPage;