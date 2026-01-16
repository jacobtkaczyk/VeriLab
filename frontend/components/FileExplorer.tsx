"use client";

import { useState, useRef, useEffect } from "react";
import { ProjectFile, FileSystemDirectoryHandle, FileSystemFileHandle } from "../types";

interface FileExplorerProps {
    files: ProjectFile[];
    activeFilePath: string | null;
    onFileSelect: (path: string) => void;
    onProjectLoaded: (files: ProjectFile[]) => void;
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

// Simple Modal Types
type ModalType = 'file' | 'folder' | null;

const FileExplorer = ({
    files,
    activeFilePath,
    onFileSelect,
    onProjectLoaded,
    isCollapsed,
    toggleCollapse
}: FileExplorerProps) => {
    // State
    const [isOpening, setIsOpening] = useState(false);
    const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);

    // Modal State
    const [modalType, setModalType] = useState<ModalType>(null);
    const [newItemName, setNewItemName] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when modal opens
    useEffect(() => {
        if (modalType && inputRef.current) {
            inputRef.current.focus();
        }
    }, [modalType]);

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
        if (isOpening) return;
        setIsOpening(true);

        try {
            // @ts-ignore
            const dirHandle = await window.showDirectoryPicker();
            setRootHandle(dirHandle);
            
            const loadedFiles = await processDirectory(dirHandle);
            onProjectLoaded(loadedFiles);
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                console.error("File picker error:", err);
            }
        } finally {
            setIsOpening(false);
        }
    };

    // --- Modal Logic ---

    const openModal = (type: 'file' | 'folder') => {
        setModalType(type);
        setNewItemName(""); 
    };

    const closeModal = () => {
        setModalType(null);
        setNewItemName("");
    };

    const handleCreateConfirm = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!rootHandle || !newItemName) return;

        try {
            if (modalType === 'file') {
                // Auto-append .v if no extension
                let name = newItemName;
                if (!name.includes(".")) name += ".v";

                await rootHandle.getFileHandle(name, { create: true });
            } else if (modalType === 'folder') {
                await rootHandle.getDirectoryHandle(newItemName, { create: true });
            }

            // Refresh list
            const updatedFiles = await processDirectory(rootHandle);
            onProjectLoaded(updatedFiles);
            closeModal();

        } catch (err) {
            console.error(`Error creating ${modalType}:`, err);
            alert(`Could not create ${modalType}.`);
        }
    };

    // Handle "Enter" key in modal
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') closeModal();
    };

    return (
        <>
            <aside
                className={`
                    bg-[#252526] border-r border-[#404040] flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out relative
                    ${isCollapsed ? "w-10" : "w-64"}
                `}
            >
                {/* Header Row */}
                <div className={`p-3 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                Explorer
                            </span>

                            {/* Toolbar: Only show if project is loaded */}
                            {rootHandle && (
                                <div className="flex items-center gap-1 ml-2 border-l border-[#404040] pl-2 animate-fade-in">
                                    <button
                                        onClick={() => openModal('file')}
                                        className="p-1 text-slate-400 hover:text-white hover:bg-[#37373d] rounded"
                                        title="New File"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </button>
                                    <button
                                        onClick={() => openModal('folder')}
                                        className="p-1 text-slate-400 hover:text-white hover:bg-[#37373d] rounded"
                                        title="New Folder"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>
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
                        {/* Action Buttons Area */}
                        {!rootHandle ? (
                            <div className="px-3 pb-2 flex flex-col gap-2 animate-fade-in">
                                <button
                                    onClick={handleOpenFolder}
                                    disabled={isOpening}
                                    className="w-full py-2 px-3 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold rounded transition-colors"
                                >
                                    {isOpening ? "Opening..." : "Open Project"}
                                </button>
                                <button
                                    onClick={handleOpenFolder} // In web apps, "New Project" usually implies picking a new empty folder
                                    disabled={isOpening}
                                    className="w-full py-2 px-3 bg-[#37373d] hover:bg-[#45454d] text-slate-200 text-xs font-bold rounded transition-colors border border-[#404040]"
                                >
                                    New Project
                                </button>
                            </div>
                        ) : (
                            // If project is loaded, show a small "Close / New" option at the bottom or top?
                            // Let's put a "Switch Project" button at the bottom of the list
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
                        )}
                        
                        {/* Bottom Action for Loaded Project */}
                        {rootHandle && (
                            <div className="p-2 border-t border-[#404040]">
                                <button
                                    onClick={handleOpenFolder}
                                    className="w-full py-1.5 px-3 bg-[#2d2d2d] hover:bg-[#37373d] text-slate-400 hover:text-white text-xs rounded transition-colors border border-[#404040]"
                                >
                                    Switch Project
                                </button>
                            </div>
                        )}
                    </>
                )}
            </aside>

            {/* --- CUSTOM POPUP MODAL --- */}
            {modalType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#252526] border border-[#454545] shadow-2xl rounded-lg w-80 p-4 transform transition-all scale-100">
                        <h3 className="text-sm font-bold text-slate-100 mb-3 uppercase">
                            Create New {modalType}
                        </h3>
                        
                        <form onSubmit={handleCreateConfirm}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-[#1e1e1e] border border-[#404040] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500 mb-4"
                                placeholder={`Enter ${modalType} name...`}
                            />
                            
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#37373d] rounded transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default FileExplorer;