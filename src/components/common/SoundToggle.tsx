import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

export const SoundToggle: React.FC = () => {
  const [muted, setMuted] = useState(sounds.getMuted());

  const toggleSound = () => {
    const next = !muted;
    sounds.setMuted(next);
    setMuted(next);
    if (!next) {
      sounds.playClick();
    }
  };

  return (
    <button
      onClick={toggleSound}
      className={`p-2 rounded-xl transition-all duration-200 cursor-pointer ${
        muted 
          ? 'bg-slate-100 text-slate-400 hover:text-slate-600' 
          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
      }`}
      title={muted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
    >
      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
    </button>
  );
};
