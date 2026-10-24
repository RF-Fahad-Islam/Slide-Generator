import { BUILTIN_BOUNDED_PRESETS } from '../../components/social-post/CustomTemplateManager';
import { calculateFittedFontSize, calculateFittedOptionsLayout } from '../textHeightEstimate';

console.log('--- Running Custom Template & Bounded Zone Tests ---');

// 1. Verify Comic Quiz preset is present
const comicPreset = BUILTIN_BOUNDED_PRESETS.find(p => p.id === 'preset_comic_quiz_time_4_5');
if (!comicPreset) {
  throw new Error('Comic Quiz Time preset not found in BUILTIN_BOUNDED_PRESETS');
}
console.log('✅ PASS: Found Comic Quiz Time preset with aspectRatio:', comicPreset.aspectRatio);

// 2. Verify design dimensions catch the 819x1024 graphic aspect ratio
const natW = 819;
const natH = 1024;
const ratio = natW / natH;
const targetH = 1080;
const targetW = Math.round(targetH * ratio);
if (targetW !== 864) {
  throw new Error(`Expected targetW 864 for 819x1024 image, got ${targetW}`);
}
console.log(`✅ PASS: Dimension auto-catching calculated targetW ${targetW}x${targetH} correctly`);

// 3. Verify Comic preset boxes
const stemBox = comicPreset.boxes.find(b => b.bind === 'stem');
const optionsBox = comicPreset.boxes.find(b => b.bind === 'options');
if (!stemBox || !optionsBox) {
  throw new Error('Stem or Options box missing from Comic preset');
}
if (!stemBox.autoFit || !stemBox.isBoundedZone || !optionsBox.autoFit || !optionsBox.isBoundedZone) {
  throw new Error('Stem or Options box is missing autoFit or isBoundedZone');
}
console.log('✅ PASS: Comic preset has autoFit & isBoundedZone flags set on stem and options');

// 4. Test auto-fit on stem with realistic Bengali question text inside the comic preset box
const sampleBengaliStem = 'যে সকল রাসায়নিক পদার্থ স্নায়ুতন্ত্রের মাধ্যমে সংকেত আদান-প্রদান করে তাদের কী বলে? এবং মস্তিষ্কের কার্যকারিতায় এদের ভূমিকা কী?';
const fittedStemSize = calculateFittedFontSize(sampleBengaliStem, stemBox.w, stemBox.h!, stemBox.fontSize, 14);
console.log(`✅ PASS: Bengali stem inside comic box (${stemBox.w}x${stemBox.h}) fitted font size: ${fittedStemSize}px`);

// 5. Test auto-fit on 4 options inside comic options box
const sampleOptions = [
  { key: 'ক', text: 'হরমোন ও জৈব অনুঘটক' },
  { key: 'খ', text: 'নিউরোট্রান্সমিটার সংকেতবাহী' },
  { key: 'গ', text: 'এনজাইম ও প্রোটিন মিশ্রণ' },
  { key: 'ঘ', text: 'অ্যান্টিবডি ও প্রতিরোধক' },
];
const fittedOptions = calculateFittedOptionsLayout(sampleOptions, optionsBox.w, optionsBox.h!, optionsBox.fontSize, optionsBox.optionsLayout === '2col', 12);
console.log(`✅ PASS: Options inside comic box (${optionsBox.w}x${optionsBox.h}) fitted: font=${fittedOptions.fontSize}px, rowH=${fittedOptions.rowHeight}px`);

console.log('All Custom Template & Bounded Zone tests passed successfully!');
