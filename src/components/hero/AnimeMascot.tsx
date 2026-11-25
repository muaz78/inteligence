import React from 'react';

interface AnimeMascotProps {
  className?: string;
}

export const AnimeMascot: React.FC<AnimeMascotProps> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Dynamic Background Esports Rings & Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Soft radial blue glow */}
        <div className="w-72 h-72 md:w-96 md:h-96 rounded-full bg-gradient-to-tr from-blue-400/20 via-indigo-300/15 to-transparent blur-2xl animate-pulse-slow" />
        {/* Rotating compass ring */}
        <div className="absolute w-80 h-80 rounded-full border border-blue-200/60 border-dashed animate-radar-spin opacity-40" />
        <div className="absolute w-64 h-64 rounded-full border border-orange-200/40 opacity-30" />
      </div>

      {/* Floating Holographic Map Pins */}
      <div className="absolute -top-2 left-6 z-10 animate-float bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-card border border-blue-100 flex items-center space-x-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
        <span className="text-xs font-bold text-slate-700 font-tech">LOCATED: TOKYO (JP)</span>
        <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">0.42s</span>
      </div>

      <div className="absolute bottom-12 -right-4 z-10 animate-float [animation-delay:1.5s] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-card border border-orange-100 flex items-center space-x-2">
        <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
        <span className="text-xs font-bold text-slate-700 font-tech">SPEED COMBO x8</span>
        <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">+450 PTS</span>
      </div>

      {/* Hero Character Illustration SVG */}
      <div className="relative z-0 transition-transform duration-500 hover:scale-[1.02]">
        <svg 
          viewBox="0 0 420 480" 
          width="100%" 
          height="100%" 
          className="w-72 sm:w-84 md:w-96 max-h-[440px] drop-shadow-xl"
        >
          <defs>
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="40%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="jacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF2E8" />
              <stop offset="100%" stopColor="#FFE0CE" />
            </linearGradient>
            <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF9F43" />
              <stop offset="100%" stopColor="#FF6B6B" />
            </linearGradient>
            <linearGradient id="holoGlobe" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(52, 120, 246, 0.7)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0.4)" />
            </linearGradient>
          </defs>

          {/* Holographic Projection Base Ring */}
          <ellipse cx="210" cy="450" rx="140" ry="24" fill="url(#holoGlobe)" opacity="0.25" />
          <ellipse cx="210" cy="450" rx="110" ry="16" fill="none" stroke="#3478F6" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />

          {/* Floating Holographic Compass Sphere near Left Hand */}
          <g transform="translate(65, 230)" className="animate-float">
            <circle cx="35" cy="35" r="32" fill="url(#holoGlobe)" opacity="0.3" />
            <circle cx="35" cy="35" r="30" fill="none" stroke="#3478F6" strokeWidth="1.5" />
            {/* Latitude / Longitude Lines */}
            <ellipse cx="35" cy="35" rx="30" ry="14" fill="none" stroke="#60A5FA" strokeWidth="1.2" opacity="0.7" />
            <ellipse cx="35" cy="35" rx="14" ry="30" fill="none" stroke="#60A5FA" strokeWidth="1.2" opacity="0.7" />
            <line x1="35" y1="5" x2="35" y2="65" stroke="#93C5FD" strokeWidth="1.5" />
            <line x1="5" y1="35" x2="65" y2="35" stroke="#93C5FD" strokeWidth="1.5" />
            {/* Glowing Map Pin on Sphere */}
            <polygon points="35,22 40,32 35,30 30,32" fill="#FF9F43" />
            <circle cx="35" cy="22" r="3" fill="#FFFFFF" />
          </g>

          {/* Character Body / Esports Jacket */}
          <g>
            {/* Torso & Jacket Outer */}
            <path 
              d="M130 250 Q210 230 290 250 L320 440 L100 440 Z" 
              fill="url(#jacketGrad)" 
            />
            {/* White Esports Front V-Panel */}
            <polygon points="175,255 245,255 235,440 185,440" fill="#FFFFFF" />
            {/* Inner Orange Racing Stripes */}
            <path d="M172 258 L182 440" stroke="url(#orangeGrad)" strokeWidth="6" strokeLinecap="round" />
            <path d="M248 258 L238 440" stroke="url(#orangeGrad)" strokeWidth="6" strokeLinecap="round" />
            
            {/* CountryRush Esports Logo Badge on Chest */}
            <g transform="translate(195, 290)">
              <polygon points="15,0 30,15 15,30 0,15" fill="#3478F6" />
              <polygon points="15,4 26,15 15,26 4,15" fill="#FFFFFF" />
              <circle cx="15" cy="15" r="4" fill="#FF9F43" />
            </g>

            {/* Left Arm (Gesturing towards holographic globe) */}
            <path 
              d="M135 260 Q100 290 90 320 Q80 345 75 335 Q90 290 150 255 Z" 
              fill="url(#jacketGrad)" 
            />
            {/* Left Glove (White with blue finger pads) */}
            <path d="M75 335 Q65 340 70 355 Q80 365 90 350 Q92 335 80 330 Z" fill="#FFFFFF" />
            <circle cx="75" cy="345" r="3" fill="#3478F6" />

            {/* Right Arm (Resting with confidence) */}
            <path 
              d="M285 260 Q330 300 335 360 Q320 370 310 350 Q305 310 270 255 Z" 
              fill="url(#jacketGrad)" 
            />
            {/* Right Glove */}
            <path d="M335 360 Q340 375 330 385 Q318 385 320 368 Z" fill="#FFFFFF" />
            <circle cx="330" cy="375" r="3" fill="#FF9F43" />
          </g>

          {/* Neck & Collar */}
          <path d="M185 210 L235 210 L230 255 L190 255 Z" fill="url(#skinGrad)" />
          {/* Tech Choker / Headset Cable Collar */}
          <path d="M187 225 Q210 234 233 225" fill="none" stroke="#0F172A" strokeWidth="4" />
          <circle cx="210" cy="230" r="3.5" fill="#3478F6" />

          {/* Anime Head & Face */}
          <ellipse cx="210" cy="170" rx="55" ry="58" fill="url(#skinGrad)" />
          {/* Ears */}
          <ellipse cx="152" cy="172" rx="8" ry="14" fill="url(#skinGrad)" />
          <ellipse cx="268" cy="172" rx="8" ry="14" fill="url(#skinGrad)" />

          {/* Professional Gaming Headset */}
          <path d="M148 145 Q210 80 272 145" fill="none" stroke="#1E293B" strokeWidth="12" strokeLinecap="round" />
          <path d="M152 145 Q210 84 268 145" fill="none" stroke="#3478F6" strokeWidth="4" strokeLinecap="round" />
          {/* Left Ear Cushion & Glowing LED Ring */}
          <rect x="140" y="152" width="16" height="34" rx="8" fill="#0F172A" />
          <rect x="144" y="158" width="8" height="22" rx="4" fill="#3478F6" />
          {/* Right Ear Cushion & Glowing LED Ring */}
          <rect x="264" y="152" width="16" height="34" rx="8" fill="#0F172A" />
          <rect x="268" y="158" width="8" height="22" rx="4" fill="#3478F6" />
          {/* Mic Boom */}
          <path d="M148 178 Q170 215 195 208" fill="none" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
          <circle cx="196" cy="208" r="4.5" fill="#FF9F43" />

          {/* Eyes (Vibrant, sharp anime eyes with dual highlights) */}
          <g>
            {/* Left Eye */}
            <path d="M174 158 Q188 152 200 162" fill="none" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
            <ellipse cx="188" cy="172" rx="8.5" ry="12" fill="#1D4ED8" />
            <ellipse cx="188" cy="174" rx="6" ry="9" fill="#3B82F6" />
            <circle cx="185" cy="167" r="3.5" fill="#FFFFFF" />
            <circle cx="191" cy="176" r="1.8" fill="#93C5FD" />
            {/* Right Eye */}
            <path d="M220 162 Q232 152 246 158" fill="none" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
            <ellipse cx="232" cy="172" rx="8.5" ry="12" fill="#1D4ED8" />
            <ellipse cx="232" cy="174" rx="6" ry="9" fill="#3B82F6" />
            <circle cx="229" cy="167" r="3.5" fill="#FFFFFF" />
            <circle cx="235" cy="176" r="1.8" fill="#93C5FD" />
            {/* Eyebrows */}
            <path d="M173 148 Q187 144 198 150" fill="none" stroke="#1E40AF" strokeWidth="3" strokeLinecap="round" />
            <path d="M222 150 Q233 144 247 148" fill="none" stroke="#1E40AF" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* Nose & Smile */}
          <path d="M208 178 L210 185" stroke="#E29578" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M200 195 Q210 204 220 195" fill="none" stroke="#9A3412" strokeWidth="3" strokeLinecap="round" />
          {/* Subtle blush */}
          <rect x="166" y="178" width="12" height="4" rx="2" fill="#FF8A8A" opacity="0.65" />
          <rect x="242" y="178" width="12" height="4" rx="2" fill="#FF8A8A" opacity="0.65" />

          {/* Anime Hair (Layered, dynamic blue esports bangs) */}
          <g fill="url(#hairGrad)">
            {/* Back volume */}
            <path d="M150 140 Q130 90 200 80 Q270 70 290 130 Q305 190 270 215 Q265 170 260 150 Q160 150 150 140 Z" />
            {/* Front Fringe & Bangs */}
            <polygon points="155,130 178,168 184,136" />
            <polygon points="180,132 205,180 212,136" />
            <polygon points="208,135 228,175 236,134" />
            <polygon points="232,132 258,166 264,134" />
            {/* Side Long Hair Strands */}
            <path d="M154 135 Q140 180 155 225 Q165 210 162 170 Z" />
            <path d="M266 135 Q280 180 265 225 Q255 210 258 170 Z" />
            {/* Anime Ahoge (Dynamic Top Cowlick hair) */}
            <path d="M210 82 Q230 45 250 55 Q232 65 215 82 Z" fill="#60A5FA" />
          </g>

          {/* Cyber Visor Accent (Resting above forehead) */}
          <path d="M170 126 Q210 114 250 126 L254 135 Q210 122 166 135 Z" fill="#3478F6" opacity="0.9" />
          <circle cx="210" cy="122" r="3" fill="#FF9F43" />
        </svg>
      </div>
    </div>
  );
};
