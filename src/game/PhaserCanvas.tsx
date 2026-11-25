import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createPhaserConfig } from './config';
import { GameBridge } from './GameBridge';
import { Sparkles, MapPin } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface PhaserCanvasProps {
  className?: string;
}

export const PhaserCanvas: React.FC<PhaserCanvasProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [lastClickedNode, setLastClickedNode] = useState<{ name: string; code: string } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const containerId = 'phaser-countryrush-canvas';
    containerRef.current.id = containerId;

    const config = createPhaserConfig(containerId);
    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Listen to node click from the Phaser Canvas
    const handleNodeClick = (data: unknown) => {
      const city = data as { name: string; code: string };
      setLastClickedNode(city);
      sounds.playClick();
    };

    GameBridge.on('countryPinClicked', handleNodeClick);

    return () => {
      GameBridge.off('countryPinClicked', handleNodeClick);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`relative w-full h-full min-h-[340px] rounded-3xl overflow-hidden border border-slate-200/80 shadow-card bg-white ${className}`}>
      {/* The Phaser 3 mount container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating Status Pill over Canvas */}
      {lastClickedNode && (
        <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-blue-200 flex items-center space-x-2 animate-in fade-in zoom-in-95">
          <MapPin className="w-4 h-4 text-blue-600 animate-bounce" />
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Node Coordinates Locked
            </span>
            <span className="text-xs font-black text-slate-800 font-tech">
              {lastClickedNode.name} [{lastClickedNode.code}] • 0.38s
            </span>
          </div>
          <Sparkles className="w-4 h-4 text-orange-400" />
        </div>
      )}
    </div>
  );
};
