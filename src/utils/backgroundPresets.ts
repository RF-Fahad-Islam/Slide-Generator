// Presets for slide image backgrounds generated as standalone SVG Data URLs or CSS image patterns

export interface BackgroundPreset {
  id: 'none' | 'dark_chalkboard' | 'tech_mesh' | 'blue_studio' | 'geometric_dark' | 'paper_texture' | 'custom';
  name: string;
  description: string;
  url: string;
  previewGradient: string;
}

// Inline SVG Data URLs for reliable, high-resolution rendering without external network calls
const CHALKBOARD_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="grad" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </radialGradient>
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise"/>
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.08 0"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)"/>
  <rect width="100%" height="100%" filter="url(#noise)"/>
  <!-- Subtle Grid lines -->
  <path d="M0 100 H1920 M0 200 H1920 M0 300 H1920 M0 400 H1920 M0 500 H1920 M0 600 H1920 M0 700 H1920 M0 800 H1920 M0 900 H1920 M0 1000 H1920" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
</svg>
`)}`;

const TECH_MESH_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19"/>
      <stop offset="50%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(245, 158, 11, 0.07)" stroke-width="1"/>
      <circle cx="60" cy="60" r="1.5" fill="rgba(245, 158, 11, 0.15)"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#grid)"/>
  <circle cx="1600" cy="200" r="400" fill="rgba(245, 158, 11, 0.04)" filter="blur(80px)"/>
  <circle cx="300" cy="800" r="500" fill="rgba(59, 130, 246, 0.04)" filter="blur(100px)"/>
</svg>
`)}`;

const BLUE_STUDIO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="blueGlow" cx="50%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#blueGlow)"/>
  <path d="M-200 400 C 400 200, 800 800, 2100 300" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="3"/>
  <path d="M-200 600 C 600 900, 1200 100, 2100 700" fill="none" stroke="rgba(245, 158, 11, 0.05)" stroke-width="2"/>
</svg>
`)}`;

const GEOMETRIC_DARK_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="darkBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#darkBg)"/>
  <polygon points="0,0 600,0 0,600" fill="rgba(255,255,255,0.015)"/>
  <polygon points="1920,1080 1320,1080 1920,480" fill="rgba(245,158,11,0.02)"/>
  <circle cx="960" cy="540" r="450" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="1.5"/>
  <circle cx="960" cy="540" r="700" fill="none" stroke="rgba(255,255,255,0.01)" stroke-width="1"/>
</svg>
`)}`;

const PAPER_TEXTURE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="paperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#paperGrad)"/>
  <!-- Light diagonal grain lines -->
  <path d="M 0,0 L 1920,1080 M -200,0 L 1720,1080 M 200,0 L 2120,1080" stroke="rgba(255,255,255,0.02)" stroke-width="1"/>
</svg>
`)}`;

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'none',
    name: 'Standard Template Theme',
    description: 'Use default clean template background gradient',
    url: '',
    previewGradient: 'from-slate-900 to-slate-950',
  },
  {
    id: 'dark_chalkboard',
    name: 'Classroom Chalkboard',
    description: 'Realistic dark slate board texture with fine grain',
    url: CHALKBOARD_SVG,
    previewGradient: 'from-slate-800 to-slate-900',
  },
  {
    id: 'tech_mesh',
    name: 'Tech Grid Mesh',
    description: 'EdTech digital grid with glowing subtle accents',
    url: TECH_MESH_SVG,
    previewGradient: 'from-amber-950/40 via-slate-900 to-slate-950',
  },
  {
    id: 'blue_studio',
    name: 'Deep Blue Studio',
    description: 'University level premium dark blue studio gradient',
    url: BLUE_STUDIO_SVG,
    previewGradient: 'from-blue-900/60 to-slate-950',
  },
  {
    id: 'geometric_dark',
    name: 'Cyber Geometric',
    description: 'Minimalist sleek dark angular geometric backdrop',
    url: GEOMETRIC_DARK_SVG,
    previewGradient: 'from-zinc-900 to-black',
  },
  {
    id: 'paper_texture',
    name: 'Academic Parchment',
    description: 'Subtle paper grain for rich contrast',
    url: PAPER_TEXTURE_SVG,
    previewGradient: 'from-indigo-950/50 to-slate-950',
  },
];

export const getBackgroundPresetUrl = (presetId: string, customUrl?: string): string => {
  if (presetId === 'custom' && customUrl) {
    return customUrl;
  }
  const found = BACKGROUND_PRESETS.find(p => p.id === presetId);
  return found ? found.url : '';
};
