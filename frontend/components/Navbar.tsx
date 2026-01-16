"use client";

interface NavbarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    // Simulation Props
    onRunSimulation?: () => void;
    simTime?: number;
    setSimTime?: (time: number) => void;
    // New Feature Props
    onAddMarker?: () => void;
    onClearMarkers?: () => void;
    onPrevEdge?: () => void;
    onNextEdge?: () => void;
}

const Navbar = ({ 
    activeTab, 
    onTabChange, 
    onRunSimulation, 
    simTime, 
    setSimTime,
    onAddMarker,
    onClearMarkers,
    onPrevEdge,
    onNextEdge
}: NavbarProps) => {
    const tabs = ["Editor", "Simulate"];

    return (
        <nav className="h-12 bg-[#2d2d2d] border-b border-[#1e1e1e] flex items-center shadow-lg select-none px-4 justify-between shrink-0 z-30 relative">

            {/* LEFT: Branding & Tabs */}
            <div className="flex items-center h-full">
                <div className="font-bold text-lg text-slate-100 mr-8">
                    Veri<span className="text-blue-500">Lab</span>
                </div>

                <div className="flex space-x-1 h-full pt-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className={`
                px-4 h-full text-sm font-medium rounded-t transition-colors
                ${activeTab === tab
                                    ? "bg-[#1e1e1e] text-blue-400 border-t-2 border-blue-500"
                                    : "text-slate-400 hover:bg-[#353535]"}
              `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* CENTER: Simulation Controls */}
            {activeTab === "Simulate" && (
                <div className="flex items-center space-x-3 bg-[#1e1e1e] px-2 py-1 rounded border border-[#404040]">
                    
                    {/* Run Section */}
                    <button
                        onClick={onRunSimulation}
                        className="flex items-center text-green-400 hover:text-green-300 transition-colors px-2"
                        title="Run Simulation"
                    >
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                        <span className="text-sm font-bold">Run</span>
                    </button>
                    <div className="flex items-center space-x-1">
                        <input 
                            type="number" 
                            value={simTime}
                            onChange={(e) => setSimTime && setSimTime(parseInt(e.target.value) || 0)}
                            className="w-16 bg-[#2d2d2d] border border-[#404040] text-xs text-white px-1 py-0.5 rounded focus:outline-none focus:border-blue-500 text-right" 
                        />
                        <span className="text-xs text-slate-500">ns</span>
                    </div>

                    <div className="w-px h-4 bg-[#404040] mx-1"></div>

                    {/* Edge Navigation Group */}
                    <div className="flex space-x-1">
                        <button onClick={onPrevEdge} className="p-1 hover:bg-[#333] rounded text-slate-400 hover:text-white" title="Previous Edge">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 19l-7-7 7-7" /></svg>
                        </button>
                        <button onClick={onNextEdge} className="p-1 hover:bg-[#333] rounded text-slate-400 hover:text-white" title="Next Edge">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    <div className="w-px h-4 bg-[#404040] mx-1"></div>

                    {/* Markers Group */}
                    <div className="flex space-x-1">
                        <button onClick={onAddMarker} className="p-1 hover:bg-[#333] rounded text-yellow-500 hover:text-yellow-400" title="Add Marker at Cursor">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" /></svg>
                        </button>
                        <button onClick={onClearMarkers} className="p-1 hover:bg-[#333] rounded text-red-400 hover:text-red-300" title="Clear All Markers">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>

                </div>
            )}

            <div className="text-xs text-slate-500 w-16 text-right">
                {activeTab === "Simulate" ? "Ready" : "Editor"}
            </div>
        </nav>
    );
};

export default Navbar;