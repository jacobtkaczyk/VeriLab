"use client";

interface NavbarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    // Simulation Props
    onRunSimulation?: () => void;
    simTime?: number;                  // <--- NEW
    setSimTime?: (time: number) => void; // <--- NEW
}

const Navbar = ({ 
    activeTab, 
    onTabChange, 
    onRunSimulation, 
    simTime, 
    setSimTime 
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
                <div className="flex items-center space-x-3 bg-[#1e1e1e] px-3 py-1 rounded border border-[#404040]">
                    {/* Run Button */}
                    <button
                        onClick={onRunSimulation}
                        className="flex items-center text-green-400 hover:text-green-300 transition-colors"
                        title="Run Simulation"
                    >
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                        <span className="text-sm font-bold">Run</span>
                    </button>

                    <div className="w-px h-4 bg-[#404040]"></div>

                    {/* Time Input (CONTROLLED) */}
                    <div className="flex items-center space-x-1">
                        <span className="text-xs text-slate-500">Time:</span>
                        <input 
                            type="number" 
                            value={simTime}
                            onChange={(e) => setSimTime && setSimTime(parseInt(e.target.value) || 0)}
                            className="w-20 bg-[#2d2d2d] border border-[#404040] text-xs text-white px-2 py-0.5 rounded focus:outline-none focus:border-blue-500 text-right" 
                        />
                    </div>

                    {/* Timescale Dropdown (Visual only for now) */}
                    <select className="bg-[#2d2d2d] border border-[#404040] text-xs text-white px-1 py-0.5 rounded focus:outline-none focus:border-blue-500">
                        <option>ns</option>
                        <option>ps</option>
                        <option>us</option>
                        <option>ms</option>
                    </select>
                </div>
            )}

            {/* RIGHT: Status */}
            <div className="text-xs text-slate-500">
                {activeTab === "Simulate" ? "Ready" : "Editing"}
            </div>
        </nav>
    );
};

export default Navbar;