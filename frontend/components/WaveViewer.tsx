"use client";

import { useEffect, useRef, useState } from "react";
import { Waveform } from "../utils/vcdParser";

interface WaveViewerProps {
    waveforms: Record<string, Waveform>;
    selectedSignals: string[];
    // NEW PROPS for Lifted State
    cursorTime: number;
    setCursorTime: (time: number) => void;
    markers: number[];
}

// ... SignalRow component remains EXACTLY the same ...
// (I am omitting SignalRow here for brevity, keep your existing one)
const SignalRow = ({
    waveform,
    width,
    height,
    timeScale
}: {
    waveform: Waveform,
    width: number,
    height: number,
    timeScale: number
}) => {
    // ... Copy your existing SignalRow logic with the safety check ...
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (width > 32000) return; // Safety check
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height - 1);
        ctx.lineTo(width, height - 1);
        ctx.stroke();
        if (!waveform || waveform.data.length === 0) return;
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const yHigh = 10;
        const yLow = height - 10;
        let currVal = waveform.data[0].value;
        ctx.moveTo(0, currVal === '1' ? yHigh : yLow);
        waveform.data.forEach(point => {
            const nextX = point.time * timeScale;
            const yLevel = currVal === '1' ? yHigh : yLow;
            ctx.lineTo(nextX, yLevel);
            if (point.value !== currVal) {
                const nextY = point.value === '1' ? yHigh : yLow;
                ctx.lineTo(nextX, nextY);
            }
            currVal = point.value as string;
        });
        const finalY = currVal === '1' ? yHigh : yLow;
        ctx.lineTo(width, finalY);
        ctx.stroke();
    }, [waveform, width, height, timeScale]);
    return <canvas ref={canvasRef} />;
};

const WaveViewer = ({ waveforms, selectedSignals, cursorTime, setCursorTime, markers }: WaveViewerProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [cursorX, setCursorX] = useState<number>(0); // Logic for X px position still local is fine
    const [timeScale, setTimeScale] = useState<number>(10);

    const ROW_HEIGHT = 40;
    const SIDEBAR_WIDTH = 200;

    const handleZoomIn = () => setTimeScale(prev => Math.min(prev * 1.2, 20));
    const handleZoomOut = () => setTimeScale(prev => Math.max(prev / 1.5, 1));

    const getMaxTime = () => {
        let max = 100;
        selectedSignals.forEach(sig => {
            const data = waveforms[sig]?.data;
            if (data && data.length > 0) {
                max = Math.max(max, data[data.length - 1].time);
            }
        });
        return max;
    };

    const simulationDuration = getMaxTime();
    const contentWidth = Math.max(800, simulationDuration * timeScale + 100);

    // Sync Cursor X position when timeScale or cursorTime changes
    useEffect(() => {
        setCursorX(cursorTime * timeScale);
    }, [timeScale, cursorTime]);

    const updateCursor = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current || selectedSignals.length === 0) return;
        const rect = scrollContainerRef.current.getBoundingClientRect();
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        let x = e.clientX - rect.left + scrollLeft - SIDEBAR_WIDTH;
        x = Math.max(0, Math.min(x, contentWidth));
        
        const time = Math.floor(x / timeScale);
        
        // LIFTED STATE UPDATE
        setCursorTime(time);
    };

    const handleMouseDown = (e: React.MouseEvent) => updateCursor(e);
    const handleMouseMove = (e: React.MouseEvent) => {
        if (e.buttons === 1) updateCursor(e);
    };

    const getValue = (sig: string) => {
        const wave = waveforms[sig];
        if (!wave || wave.data.length === 0) return '-';
        let val = wave.data[0].value;
        for (const p of wave.data) {
            if (p.time > cursorTime) break;
            val = p.value;
        }
        return val;
    };

    const formatName = (name: string) => {
        const parts = name.split('.');
        return parts.length > 1 ? `${parts[parts.length - 2]}.${parts[parts.length - 1]}` : name;
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-300 select-none overflow-hidden">
             {/* Header */}
             <div className="flex border-b border-[#404040] bg-[#252526] h-10 shrink-0 items-center">
                <div className="w-[200px] border-r border-[#404040] shrink-0 flex items-center justify-between px-3 text-xs font-bold text-slate-500 h-full">
                    <span>SIGNALS</span>
                    <div className="flex space-x-1">
                        <button onClick={handleZoomOut} className="p-1 hover:bg-[#3c3c3c] rounded text-slate-400 hover:text-white" title="Zoom Out"> - </button>
                        <button onClick={handleZoomIn} className="p-1 hover:bg-[#3c3c3c] rounded text-slate-400 hover:text-white" title="Zoom In"> + </button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden relative flex items-center px-4">
                    {selectedSignals.length > 0 && (
                        <div className="text-xs text-slate-400 flex items-center gap-4">
                            <span>Cursor: <span className="text-white font-mono">{cursorTime}ns</span></span>
                            <span>Scale: <span className="text-white font-mono">{Math.round(timeScale * 10) / 10} px/ns</span></span>
                        </div>
                    )}
                </div>
            </div>

            {/* Scroll Area */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-auto relative [&::-webkit-scrollbar]:h-4 [&::-webkit-scrollbar]:w-4 [&::-webkit-scrollbar-thumb]:bg-blue-600"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                style={{ cursor: selectedSignals.length > 0 ? 'crosshair' : 'default' }}
            >
                <div className="relative flex flex-col" style={{ width: `${SIDEBAR_WIDTH + contentWidth}px` }}>
                    
                    {/* RED CURSOR LINE */}
                    {selectedSignals.length > 0 && (
                        <div className="absolute top-0 bottom-0 border-l border-red-500 z-20 pointer-events-none" style={{ left: `${SIDEBAR_WIDTH + cursorX}px` }}>
                            <div className="absolute bottom-0 translate-y-full bg-red-600 text-white text-[10px] px-1 rounded-b">{cursorTime}</div>
                        </div>
                    )}

                    {/* YELLOW MARKERS (NEW) */}
                    {markers.map((markTime, idx) => (
                         <div 
                             key={idx}
                             className="absolute top-0 bottom-0 border-l border-yellow-400 border-dashed z-10 pointer-events-none opacity-80" 
                             style={{ left: `${SIDEBAR_WIDTH + (markTime * timeScale)}px` }}
                         >
                            <div className="absolute top-0 bg-yellow-500 text-black text-[9px] px-1 rounded-b font-bold">M{idx+1}</div>
                         </div>
                    ))}

                    {/* Waveform Rows */}
                    {selectedSignals.length === 0 ? (
                        <div className="fixed inset-0 top-32 flex justify-center text-slate-600 pointer-events-none">
                            <p>No signals selected</p>
                        </div>
                    ) : (
                        selectedSignals.map((sig) => (
                            <div key={sig} className="flex border-b border-[#2d2d2d] hover:bg-[#2a2d2e] group" style={{ height: `${ROW_HEIGHT}px` }}>
                                <div className="w-[200px] shrink-0 border-r border-[#404040] bg-[#252526] flex items-center justify-between px-3 sticky left-0 z-30 shadow-lg">
                                    <div className="flex flex-col truncate pr-2" title={sig}>
                                        <span className="text-sm text-slate-200 font-medium truncate">{formatName(sig)}</span>
                                    </div>
                                    <span className={`font-mono font-bold ${getValue(sig) === '1' ? 'text-green-400' : 'text-slate-500'}`}>{getValue(sig)}</span>
                                </div>
                                <div className="relative bg-[#1e1e1e]">
                                    <SignalRow waveform={waveforms[sig]} width={contentWidth} height={ROW_HEIGHT} timeScale={timeScale} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default WaveViewer;