interface SignalListProps {
    signals: string[];
    selectedSignals: string[]; // <--- Added this property
    onToggleSignal: (sig: string) => void;
}

const SignalList = ({ signals, selectedSignals, onToggleSignal }: SignalListProps) => {
    return (
        <div className="flex flex-col h-full">
            <div className="px-3 py-2 text-xs font-bold text-slate-500 bg-[#252526] border-b border-[#404040]">
                AVAILABLE SIGNALS
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                {signals.length === 0 ? (
                    <div className="p-4 text-xs text-slate-600 text-center italic">
                        No signals found.<br />Run simulation first.
                    </div>
                ) : (
                    signals.map((sig) => {
                        const isSelected = selectedSignals.includes(sig);
                        return (
                            <div
                                key={sig}
                                onClick={() => onToggleSignal(sig)}
                                className={`
                  px-3 py-1.5 text-xs font-mono cursor-pointer select-none flex items-center
                  border-b border-[#2d2d2d] transition-colors
                  ${isSelected
                                        ? "bg-[#37373d] text-blue-400 border-l-2 border-l-blue-500"
                                        : "text-slate-400 hover:bg-[#2a2d2e] border-l-2 border-l-transparent"}
                `}
                            >
                                {/* Optional: Add a checkmark icon if selected */}
                                <div className={`w-3 h-3 mr-2 rounded-sm border flex items-center justify-center ${isSelected ? "bg-blue-500 border-blue-500" : "border-slate-600"}`}>
                                    {isSelected && (
                                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                                    )}
                                </div>
                                <span className="truncate" title={sig}>{sig}</span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default SignalList;