import React from 'react';
import { CameraObscuraDiagram } from './components/CameraObscuraDiagram';
import { CircleDot } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Clean Minimal Header */}
      <header className="w-full bg-neutral-950 border-b border-neutral-800/80 sticky top-0 z-40 backdrop-blur-md bg-neutral-950/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-neutral-950 shadow-md shadow-amber-500/20">
              <CircleDot className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-neutral-100 tracking-tight">
                Camera Obscura
              </h1>
              <p className="text-[11px] text-neutral-400">
                Single Optics Diagram & DIY Build Guide
              </p>
            </div>
          </div>
          <div className="text-xs text-neutral-400 font-mono hidden sm:block">
            Rectilinear Propagation of Light
          </div>
        </div>
      </header>

      {/* Main Single-Diagram Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        <CameraObscuraDiagram />
      </main>

      {/* Clean Minimal Footer */}
      <footer className="w-full border-t border-neutral-800/60 py-4 text-center text-xs text-neutral-500">
        Camera Obscura Optics • Lord Rayleigh Optimum: d ≈ 1.9√(λf)
      </footer>
    </div>
  );
}
