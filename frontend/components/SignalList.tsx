"use client";

interface SignalListProps {
    signals: string[];
    onToggleSignal: (signal: string) => void;
}

const SignalList = ({ signals, onToggleSignal }: SignalListProps) => {
    return (
        <div className="flex flex-col h-full bg-[#252526] overflow-hidden">
            <div className="p-2 bg-[#333] border-b border-[#404040] flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300 uppercase">Signals</span>
                <span className="text-[10px] text-slate-500">{signals.length} found</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {signals.length === 0 ? (
                    <div className="text-center mt-4">
                        <p className="text-slate-500 text-xs italic mb-2">No signals yet.</p>
                        <p className="text-slate-600 text-[10px]">Select a testbench and click Run.</p>
                    </div>
                ) : (
                    signals.map((sig) => (
                        <div key={sig} className="flex items-center space-x-2 mb-1 group">
                            <input
                                type="checkbox"
                                id={sig}
                                onChange={() => onToggleSignal(sig)}
                                className="rounded-sm bg-[#3c3c3c] border-[#555] text-blue-600 focus:ring-0 cursor-pointer"
                            />
                            <label
                                htmlFor={sig}
                                className="text-sm text-slate-400 cursor-pointer select-none group-hover:text-slate-200 truncate"
                                title={sig} // Tooltip for full path
                            >
                                {/* Visual trick: Make the hierarchy parts dimmer */}
                                {sig.split('.').map((part, index, arr) => (
                                    <span key={index} className={index === arr.length - 1 ? "text-slate-200 font-medium" : "text-slate-500"}>
                                        {part}{index < arr.length - 1 && "."}
                                    </span>
                                ))}
                            </label>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SignalList;