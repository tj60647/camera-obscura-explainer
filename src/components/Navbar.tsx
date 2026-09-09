import React from 'react';
import { ActiveTab, OpticalParameters, OpticalPhysicsOutputs } from '../types';
import { Sparkles, Eye, Atom, Wrench, CircleDot } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  params: OpticalParameters;
  outputs: OpticalPhysicsOutputs;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  params,
  outputs,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'simulator',
      label: 'Ray Optics Bench',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 'chamber',
      label: 'Dark Chamber View',
      icon: <Eye className="w-4 h-4" />,
    },
    {
      id: 'physics',
      label: 'Advance Wave Physics',
      icon: <Atom className="w-4 h-4" />,
      badge: 'Airy Wave',
    },
    {
      id: 'builder',
      label: 'DIY Builder & Calculator',
      icon: <Wrench className="w-4 h-4" />,
      badge: 'Blueprints',
    },
  ];

  return (
    <header className="w-full bg-neutral-950 border-b border-neutral-800 sticky top-0 z-50 backdrop-blur-md bg-neutral-950/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* App Title & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-neutral-950 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/40">
            <CircleDot className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-neutral-100 tracking-tight flex items-center gap-2">
              Camera Obscura Lab
            </h1>
            <p className="text-[11px] text-neutral-400">
              Interactive Ray Tracing & DIY Optics Studio
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-xs">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono hidden sm:inline ${
                    isActive ? 'bg-amber-500/30 text-amber-200' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Live Quick Physics Readout Pill */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">Aperture:</span>
            <span className="text-amber-300 font-semibold">{params.pinholeDiameter.toFixed(2)}mm</span>
          </div>
          <span className="text-neutral-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">f:</span>
            <span className="text-sky-300 font-semibold">{params.boxDepth}cm</span>
          </div>
          <span className="text-neutral-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">Speed:</span>
            <span className="text-neutral-200 font-semibold">f/{outputs.fNumber.toFixed(0)}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
