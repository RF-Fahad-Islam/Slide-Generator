export interface FontPreset {
  id: string;
  name: string;
  family: string;
  category: 'bangla_clean' | 'bangla_traditional' | 'bangla_display' | 'english_modern' | 'english_serif';
  description: string;
  sampleBangla: string;
  sampleEnglish: string;
}

export const FONT_PRESETS: FontPreset[] = [
  {
    id: 'kalpurush',
    name: 'Kalpurush (Default Bangla Standard)',
    family: "'Kalpurush', serif",
    category: 'bangla_traditional',
    description: 'Classic Bangla font, widely used for textbooks, publications, and exam question papers.',
    sampleBangla: '১. রুই মাছের হৃদপিণ্ডে কয়টি প্রকোষ্ঠ থাকে?',
    sampleEnglish: 'A) 2 Chambers   B) 4 Chambers',
  },
  {
    id: 'hind-siliguri',
    name: 'Hind Siliguri (Clean Sans)',
    family: "'Hind Siliguri', sans-serif",
    category: 'bangla_clean',
    description: 'Clean, legible modern sans-serif. Excellent for Bangla & English mixed slides.',
    sampleBangla: '১. রুই মাছের হৃদপিণ্ডে কয়টি প্রকোষ্ঠ থাকে?',
    sampleEnglish: 'A) 2 Chambers   B) 4 Chambers',
  },
  {
    id: 'noto-sans-bengali',
    name: 'Noto Sans Bengali (Academic)',
    family: "'Noto Sans Bengali', sans-serif",
    category: 'bangla_clean',
    description: 'Crisp, high-density academic font favored by textbook publishers and board exams.',
    sampleBangla: '২. বৃক্কের কার্যকরী একক কোনটি?',
    sampleEnglish: 'Nephron is the functional unit of kidney',
  },
  {
    id: 'anek-bangla',
    name: 'Anek Bangla (Modern Bold)',
    family: "'Anek Bangla', sans-serif",
    category: 'bangla_display',
    description: 'Bold, contemporary display font with high visual punch for live class streams.',
    sampleBangla: '৩. আলো সংবেদনশীল কোষ কোনটি?',
    sampleEnglish: 'Rods and Cones in Human Retina',
  },
  {
    id: 'tiro-bangla',
    name: 'Tiro Bangla (Editorial Serif)',
    family: "'Tiro Bangla', serif",
    category: 'bangla_traditional',
    description: 'Traditional editorial serif with formal newspaper and literature aesthetic.',
    sampleBangla: '৪. সালোকসংশ্লেষণ প্রক্রিয়ার উপজাত কোনটি?',
    sampleEnglish: 'Photosynthesis Process & Equation',
  },
  {
    id: 'atma',
    name: 'Atma (Casual Playful)',
    family: "'Atma', display",
    category: 'bangla_display',
    description: 'Friendly, rounded handwriting style. Great for primary/junior class revision decks.',
    sampleBangla: '৫. মজার বিজ্ঞান কুইজ পর্ব-১',
    sampleEnglish: 'Fun Science & Math Quiz Time!',
  },
  {
    id: 'mina',
    name: 'Mina (Curved Artistic)',
    family: "'Mina', sans-serif",
    category: 'bangla_traditional',
    description: 'Distinctive curved strokes for elegant literary or cultural presentation decks.',
    sampleBangla: '৬. বাংলা সাহিত্য ও ব্যাকরণ প্রশ্নাবলী',
    sampleEnglish: 'Bengali Literature Exam Questions',
  },
  {
    id: 'plus-jakarta',
    name: 'Plus Jakarta Sans (Sleek Tech)',
    family: "'Plus Jakarta Sans', sans-serif",
    category: 'english_modern',
    description: 'Ultra-modern tech typeface with high readability on digital projectors.',
    sampleBangla: '৭. মেডিকেল ও ডেন্টাল ভর্তি পরীক্ষা',
    sampleEnglish: 'Medical & Dental Admission Preparation',
  },
  {
    id: 'poppins',
    name: 'Poppins (Geometric Bold)',
    family: "'Poppins', sans-serif",
    category: 'english_modern',
    description: 'Balanced geometric proportions for punchy slide headlines and numbers.',
    sampleBangla: '৮. পদার্থবিজ্ঞান ও রসায়ন প্রশ্ন ব্যাংক',
    sampleEnglish: 'Physics & Chemistry Question Bank',
  },
  {
    id: 'playfair',
    name: 'Playfair Display (Luxury Editorial)',
    family: "'Playfair Display', serif",
    category: 'english_serif',
    description: 'Sophisticated editorial serif for university admission and law test prep.',
    sampleBangla: '৯. বিশ্ববিদ্যালয় "খ" ইউনিট ভর্তি প্রস্তুতি',
    sampleEnglish: 'University Admission Test 2026',
  },
];

export function getFontPresetByFamily(family?: string): FontPreset {
  if (!family) return FONT_PRESETS[0];
  return FONT_PRESETS.find(f => f.family === family || f.id === family) || FONT_PRESETS[0];
}
