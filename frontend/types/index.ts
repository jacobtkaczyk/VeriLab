// frontend/types/index.ts

export interface FileSystemHandle {
    kind: 'file' | 'directory';
    name: string;
}

export interface FileSystemFileHandle extends FileSystemHandle {
    kind: 'file';
    getFile: () => Promise<File>;
    createWritable: () => Promise<FileSystemWritableFileStream>;
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
    kind: 'directory';
    values: () => AsyncIterableIterator<FileSystemHandle>;
}

export interface FileSystemWritableFileStream extends WritableStream {
    write: (data: string) => Promise<void>;
    close: () => Promise<void>;
}

export interface ProjectFile {
    name: string;
    path: string;       // Unique ID (e.g., "src/counter.v")
    content: string;    // The saved content on disk
    draft: string;      // The current content in the editor
    isDirty: boolean;   // True if content !== draft
    handle?: FileSystemFileHandle; // The reference needed to save back to disk
}