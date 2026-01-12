"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import CodeEditor from "../components/CodeEditor";
import FileExplorer from "../components/FileExplorer";
import SignalList from "../components/SignalList";
import WaveViewer from "../components/WaveViewer";
import { ProjectFile } from "../types";
import { parseVCD, Waveform } from "../utils/vcdParser";

export default function Home() {
  const [activeTab, setActiveTab] = useState("Editor");

  // --- Sidebar State ---
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);

  // --- File System State ---
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [openTabPaths, setOpenTabPaths] = useState<string[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  // --- Simulation State ---
  const [selectedSimFile, setSelectedSimFile] = useState<string>("");
  const [availableSignals, setAvailableSignals] = useState<string[]>([]);
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [waveforms, setWaveforms] = useState<Record<string, Waveform>>({});
  const [simTime, setSimTime] = useState<number>(1000); // <--- NEW STATE

  const activeFile = files.find(f => f.path === activeFilePath);

  // 1. Navigation
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "Simulate") {
      setIsExplorerCollapsed(true);
    } else {
      setIsExplorerCollapsed(false);
    }
  };

  // 2. Load Project
  const handleProjectLoaded = (loadedFiles: ProjectFile[]) => {
    setFiles(loadedFiles);
    setOpenTabPaths([]);
    setActiveFilePath(null);
    setIsExplorerCollapsed(false);
    setAvailableSignals([]);
    setSelectedSignals([]);
    setWaveforms({});
  };

  // 3. Open File
  const handleOpenFile = (path: string) => {
    if (!openTabPaths.includes(path)) {
      setOpenTabPaths([...openTabPaths, path]);
    }
    setActiveFilePath(path);
    setActiveTab("Editor");
  };

  // 4. Close Tab
  const handleCloseTab = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const fileToClose = files.find(f => f.path === path);
    if (fileToClose?.isDirty) {
      if (window.confirm(`Save changes to ${fileToClose.name}?`)) {
        handleSaveFile(path);
      } else {
        return;
      }
    }
    const newTabs = openTabPaths.filter(p => p !== path);
    setOpenTabPaths(newTabs);
    if (activeFilePath === path) {
      setActiveFilePath(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
    }
  };

  // 5. Code Change
  const handleCodeChange = (newCode: string | undefined) => {
    if (!activeFilePath || newCode === undefined) return;
    setFiles(prev => prev.map(f => f.path === activeFilePath ? { ...f, draft: newCode, isDirty: newCode !== f.content } : f));
  };

  // 6. Save File
  const handleSaveFile = async (path: string) => {
    const file = files.find(f => f.path === path);
    if (!file) return;
    if (file.handle) {
      try {
        const writable = await file.handle.createWritable();
        await writable.write(file.draft);
        await writable.close();
        setFiles(prev => prev.map(f => f.path === path ? { ...f, content: f.draft, isDirty: false } : f));
      } catch (err) {
        alert("Could not save to disk.");
      }
    } else {
      alert("Memory-only file.");
    }
  };

  // 7. Load Simulation
  const handleLoadSimulation = async () => {
    if (!selectedSimFile) {
      alert("Please select a testbench file first.");
      return;
    }

    console.log(`Running simulation for ${simTime}ns...`);

    try {
      const payload = {
        testbench_name: selectedSimFile,
        duration: simTime, // <--- SENDING DURATION
        files: files.map(f => ({
          name: f.name,
          content: f.content
        }))
      };

      const response = await fetch('http://127.0.0.1:8000/api/simulate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setAvailableSignals(data.signals);
        if (data.vcd) {
          const parsedWaves = parseVCD(data.vcd);
          setWaveforms(parsedWaves);
        }
        setSelectedSignals([]);
      } else {
        alert("Simulation Error:\n" + data.error);
      }

    } catch (error) {
      alert("Failed to connect to simulation server.");
    }
  };

  const toggleSignal = (sig: string) => {
    setSelectedSignals(prev => prev.includes(sig) ? prev.filter(s => s !== sig) : [...prev, sig]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeFilePath) handleSaveFile(activeFilePath);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFilePath, files]);

  return (
    <main className="flex flex-col h-screen bg-[#1e1e1e] text-slate-200 overflow-hidden">
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onRunSimulation={handleLoadSimulation}
        simTime={simTime}        // <--- PASS STATE
        setSimTime={setSimTime}  // <--- PASS SETTER
      />

      <div className="flex-1 flex overflow-hidden min-h-0">
        <FileExplorer
          files={files}
          activeFilePath={activeFilePath}
          onFileSelect={handleOpenFile}
          onProjectLoaded={handleProjectLoaded}
          isCollapsed={isExplorerCollapsed}
          toggleCollapse={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
        />

        <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          {activeTab === "Editor" && (
            <div className="flex flex-col h-full">
              {openTabPaths.length > 0 ? (
                <div className="flex bg-[#252526] border-b border-[#1e1e1e] overflow-x-auto no-scrollbar shrink-0">
                  {openTabPaths.map(path => {
                    const file = files.find(f => f.path === path);
                    const isActive = activeFilePath === path;
                    if (!file) return null;
                    return (
                      <div
                        key={path}
                        onClick={() => setActiveFilePath(path)}
                        className={`group flex items-center min-w-[120px] max-w-[200px] px-3 py-2 text-sm cursor-pointer border-r border-[#1e1e1e] select-none ${isActive ? "bg-[#1e1e1e] text-slate-100 border-t-2 border-t-blue-500" : "bg-[#2d2d2d] text-slate-500 hover:bg-[#2a2d2e]"}`}
                      >
                        <span className="truncate mr-2">{file.name}</span>
                        <div className="ml-auto w-5 h-5 flex items-center justify-center rounded-sm hover:bg-slate-700" onClick={(e) => handleCloseTab(e, path)}>
                          <span className="block text-slate-400">×</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (<div className="h-9 bg-[#252526] border-b border-[#1e1e1e]"></div>)}

              <div className="flex-1 relative overflow-hidden">
                {activeFile ? (
                  <CodeEditor code={activeFile.draft} onCodeChange={handleCodeChange} />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-600">
                    <p>No file open.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "Simulate" && (
            <div className="flex h-full overflow-hidden">
              <div className="flex flex-col border-r border-[#404040] w-64 shrink-0 bg-[#252526]">
                <div className="p-3 border-b border-[#404040]">
                  <label className="text-xs text-slate-500 block mb-1 font-bold uppercase">Testbench File</label>
                  <select
                    className="w-full bg-[#3c3c3c] text-sm text-white border border-[#555] rounded p-1.5 mb-2 focus:border-blue-500 focus:outline-none"
                    value={selectedSimFile}
                    onChange={(e) => setSelectedSimFile(e.target.value)}
                  >
                    <option value="">Select TB...</option>
                    {files.filter(f => f.name.includes(".v")).map(f => (
                      <option key={f.path} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                  <button onClick={handleLoadSimulation} disabled={!selectedSimFile} className={`w-full py-1.5 px-3 text-white text-xs font-bold rounded transition-colors ${!selectedSimFile ? "bg-slate-600" : "bg-green-700 hover:bg-green-600"}`}>
                    LOAD / RUN
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <SignalList signals={availableSignals} onToggleSignal={toggleSignal} />
                </div>
              </div>

              <div className="flex-1 overflow-hidden relative">
                <WaveViewer waveforms={waveforms} selectedSignals={selectedSignals} />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}