// frontend/components/VerilogEditor.tsx
"use client";

import Editor, { OnMount } from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;
  onCodeChange: (value: string | undefined) => void;
}

const CodeEditor = ({ code, onCodeChange }: CodeEditorProps) => {
  
  // Optional: Configuration for the editor instance when it loads
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // You can configure extra settings here if needed later
    // e.g., configuring custom autocompletion for Verilog
  };

  return (
    <div className="h-full w-full overflow-hidden bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage="verilog" 
        theme="vs-dark"
        value={code}
        onChange={onCodeChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false }, // Save screen space
          fontSize: 14,
          fontFamily: "'Fira Code', 'Consolas', monospace", // Better coding fonts
          scrollBeyondLastLine: false,
          automaticLayout: true, // Resizes nicely when window changes
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  );
};

export default CodeEditor;