"use client";

import { useState } from "react";
import { ProjectFile, FileSystemDirectoryHandle, FileSystemFileHandle } from "../types";

interface FileExplorerProps {
    files: ProjectFile[];
    activeFilePath: string | null;
    onFileSelect: (path: string) => void;
    onProjectLoaded: (files: ProjectFile[]) => void;
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

const FileExplorer = ({
    files,
    activeFilePath,
    onFileSelect,
    onProjectLoaded,
    isCollapsed,
    toggleCollapse
}: FileExplorerProps) => {
    // New state to prevent double-clicking
    const [isOpening, setIsOpening] = useState(false);

    // Recursive function to read folder contents
    const processDirectory = async (dirHandle: FileSystemDirectoryHandle, pathPrefix = ""): Promise<ProjectFile[]> => {
        const fileList: ProjectFile[] = [];

        // @ts-ignore
        for await (const entry of dirHandle.values()) {
            const currentPath = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name;

            if (entry.kind === 'file') {
                const fileHandle = entry as FileSystemFileHandle;
                const file = await fileHandle.getFile();
                if (file.name.endsWith('.v') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                    const text = await file.text();
                    fileList.push({
                        name: file.name,
                        path: currentPath,
                        content: text,
                        draft: text,
                        isDirty: false,
                        handle: fileHandle
                    });
                }
            } else if (entry.kind === 'directory') {
                const subFiles = await processDirectory(entry as FileSystemDirectoryHandle, currentPath);
                fileList.push(...subFiles);
            }
        }
        return fileList;
    };

    const handleOpenFolder = async () => {
        if (isOpening) return; // Prevent multiple clicks
        setIsOpening(true);

        try {
            // @ts-ignore
            const dirHandle = await window.showDirectoryPicker();
            const files = await processDirectory(dirHandle);
            onProjectLoaded(files);
        } catch (err) {
            // Ignore "User cancelled" errors, but log others
            if ((err as Error).name !== 'AbortError') {
                console.error("File picker error:", err);
            }
        } finally {
            // Always reset the lock, even if they cancel or it fails
            setIsOpening(false);
        }
    };

    return (
        <aside
            className={`
        bg-[#252526] border-r border-[#404040] flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-10" : "w-64"}
      `}
        >
            {/* Header Row */}
            <div className={`p-3 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
                {!isCollapsed && (
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap overflow-hidden">
                        Explorer
                    </span>
                )}

                <button
                    onClick={toggleCollapse}
                    className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#37373d] focus:outline-none"
                >
                    {isCollapsed ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                    )}
                </button>
            </div>

            {!isCollapsed && (
                <>
                    <div className="px-3 pb-2 animate-fade-in">
                        <button
                            onClick={handleOpenFolder}
                            disabled={isOpening}
                            className={`
                w-full py-1.5 px-3 text-white text-xs font-medium rounded transition-colors whitespace-nowrap
                ${isOpening ? "bg-slate-600 cursor-wait" : "bg-blue-700 hover:bg-blue-600"}
              `}
                        >
                            {isOpening ? "Opening..." : "Open Project"}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto mt-2 animate-fade-in">
                        {files.map((file) => {
                            const isActive = activeFilePath === file.path;
                            return (
                                <div
                                    key={file.path}
                                    onClick={() => onFileSelect(file.path)}
                                    className={`
                    px-4 py-1.5 text-sm cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis flex items-center
                    ${isActive ? "bg-[#37373d] text-white" : "text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200"}
                  `}
                                    title={file.path}
                                >
                                    <span className="mr-2 text-blue-400 text-xs shrink-0">V</span>
                                    <span className="truncate">{file.name}</span>
                                    {file.isDirty && (
                                        <span className="ml-auto w-2 h-2 rounded-full bg-white shrink-0 block" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </aside>
    );
};

export default FileExplorer;