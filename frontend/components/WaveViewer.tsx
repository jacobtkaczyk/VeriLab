"use client";

import { useEffect, useRef, useState } from "react";
import { Waveform } from "../utils/vcdParser";

interface WaveViewerProps {
    waveforms: Record<string, Waveform>;
    selectedSignals: string[];
}

// 1. Single Row Component (Optimized)
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
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
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


// 2. Main Component
const WaveViewer = ({ waveforms, selectedSignals }: WaveViewerProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [cursorTime, setCursorTime] = useState<number>(0);
    const [cursorX, setCursorX] = useState<number>(0);

    const ROW_HEIGHT = 40;
    const TIME_SCALE = 10;
    const SIDEBAR_WIDTH = 200;

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
    const contentWidth = Math.max(800, simulationDuration * TIME_SCALE + 100);

    const updateCursor = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current || selectedSignals.length === 0) return;

        const rect = scrollContainerRef.current.getBoundingClientRect();
        const scrollLeft = scrollContainerRef.current.scrollLeft;

        let x = e.clientX - rect.left + scrollLeft - SIDEBAR_WIDTH;
        x = Math.max(0, Math.min(x, contentWidth));

        const time = Math.floor(x / TIME_SCALE);
        const snappedX = time * TIME_SCALE;

        setCursorX(snappedX);
        setCursorTime(time);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        updateCursor(e);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (e.buttons === 1) {
            updateCursor(e);
        }
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

            {/* 1. Header (Time Ruler) */}
            <div className="flex border-b border-[#404040] bg-[#252526] h-8 shrink-0">
                <div className="w-[200px] border-r border-[#404040] shrink-0 flex items-center px-4 text-xs font-bold text-slate-500">
                    SIGNALS
                </div>
                <div className="flex-1 overflow-hidden relative">
                    {selectedSignals.length > 0 && (
                        <div className="text-[10px] text-slate-500 flex items-center h-full pl-2">
                            Cursor Time: <span className="text-white ml-2 font-mono">{cursorTime}ns</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Main Scroll Area */}
            <div
                ref={scrollContainerRef}
                className={`
            flex-1 overflow-auto relative 
            /* Persistent Blue Scrollbar */
            [&::-webkit-scrollbar]:h-4 
            [&::-webkit-scrollbar]:w-4
            [&::-webkit-scrollbar-track]:bg-[#1e1e1e]
            [&::-webkit-scrollbar-track]:border-t 
            [&::-webkit-scrollbar-track]:border-[#333]
            [&::-webkit-scrollbar-thumb]:bg-blue-600 
            [&::-webkit-scrollbar-thumb]:rounded-full 
            [&::-webkit-scrollbar-thumb]:border-4 
            [&::-webkit-scrollbar-thumb]:border-solid 
            [&::-webkit-scrollbar-thumb]:border-[#1e1e1e]
            hover:[&::-webkit-scrollbar-thumb]:bg-blue-500
        `}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                style={{ cursor: selectedSignals.length > 0 ? 'crosshair' : 'default' }}
            >
                <div
                    className="relative flex flex-col"
                    style={{ width: `${SIDEBAR_WIDTH + contentWidth}px` }}
                >
                    {/* RED CURSOR LINE - Only render if signals exist */}
                    {selectedSignals.length > 0 && (
                        <div
                            className="absolute top-0 bottom-0 border-l border-red-500 z-20 pointer-events-none"
                            style={{ left: `${SIDEBAR_WIDTH + cursorX}px` }}
                        >
                            <div className="absolute bottom-0 translate-y-full bg-red-600 text-white text-[10px] px-1 rounded-b">
                                {cursorTime}
                            </div>
                        </div>
                    )}

                    {selectedSignals.length === 0 ? (
                        <div className="fixed inset-0 top-32 flex justify-center text-slate-600 pointer-events-none">
                            <div className="text-center">
                                <p className="text-lg mb-2">No signals selected</p>
                                <p className="text-sm text-slate-700">Select signals from the sidebar to view waveforms</p>
                            </div>
                        </div>
                    ) : (
                        selectedSignals.map((sig) => (
                            <div
                                key={sig}
                                className="flex border-b border-[#2d2d2d] hover:bg-[#2a2d2e] group"
                                style={{ height: `${ROW_HEIGHT}px` }}
                            >
                                {/* Sticky Sidebar Label */}
                                <div
                                    className="w-[200px] shrink-0 border-r border-[#404040] bg-[#252526] group-hover:bg-[#2a2d2e] flex items-center justify-between px-3 sticky left-0 z-30 shadow-[4px_0_5px_-2px_rgba(0,0,0,0.3)]"
                                >
                                    <div className="flex flex-col truncate pr-2" title={sig}>
                                        <span className="text-sm text-slate-200 font-medium truncate">{formatName(sig)}</span>
                                        <span className="text-[10px] text-slate-500 truncate">{sig}</span>
                                    </div>
                                    <span className={`font-mono font-bold ${getValue(sig) === '1' ? 'text-green-400' : 'text-slate-500'}`}>
                                        {getValue(sig)}
                                    </span>
                                </div>

                                {/* Waveform Canvas */}
                                <div className="relative bg-[#1e1e1e]">
                                    <SignalRow
                                        waveform={waveforms[sig]}
                                        width={contentWidth}
                                        height={ROW_HEIGHT}
                                        timeScale={TIME_SCALE}
                                    />
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