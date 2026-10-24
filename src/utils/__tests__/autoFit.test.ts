import { calculateFittedFontSize, calculateFittedOptionsLayout } from '../textHeightEstimate';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('--- Running Auto-Fit Text Engine Tests ---');

// 1. Short stem text fits at original target font size
const shortStem = 'রুই মাছের হৃদপিণ্ডে কয়টি প্রকোষ্ঠ থাকে?';
const font1 = calculateFittedFontSize(shortStem, 800, 260, 42, 14);
assert(font1 === 42, `Short stem maintains full target font size 42px (got ${font1})`);

// 2. Long multi-line question automatically scales down inside bounded height
const longStem = `নিচের উদ্দীপকটি লক্ষ্য করো এবং প্রশ্নের উত্তর দাও:
একটি বিশেষ ধরনের উদ্ভিদের পাতায় ভাস্কুলার বান্ডল হাইড্রোফিলিক প্রকৃতির এবং ক্যাম্বিয়াম অনুপস্থিত। উদ্দীপকের উদ্ভিদটির মূলের অন্তর্গঠনে কোন বৈশিষ্ট্যটি পাওয়া যাবে এবং এর ভাস্কুলার বান্ডলের প্রকারভেদ কী রূপ হবে? ব্যাখ্যা করো।`;

const font2 = calculateFittedFontSize(longStem, 800, 180, 48, 14);
assert(font2 < 48 && font2 >= 14, `Long stem scales down to fit inside bounded 180px height (got ${font2}px)`);

// 3. Minimum font size boundary
const superLongStem = 'ক'.repeat(2000);
const font3 = calculateFittedFontSize(superLongStem, 300, 50, 40, 12);
assert(font3 === 12, `Extremely long text respects minFontSize floor (got ${font3}px)`);

// 4. Options layout auto-fit
const sampleOptions = [
  { key: 'ক', text: 'দুই প্রকোষ্ঠ বিশিষ্ট (একটি অলিন্দ ও একটি নিলয়)' },
  { key: 'খ', text: 'চার প্রকোষ্ঠ বিশিষ্ট' },
  { key: 'গ', text: 'তিন প্রকোষ্ঠ বিশিষ্ট' },
  { key: 'ঘ', text: 'একটি প্রকোষ্ঠ বিশিষ্ট' },
];

const optLayout = calculateFittedOptionsLayout(sampleOptions, 800, 360, 32, true, 12);
assert(optLayout.rowHeight > 0, `Options rowHeight computed properly (${optLayout.rowHeight}px)`);
assert(optLayout.fontSize >= 12 && optLayout.fontSize <= 32, `Options fontSize auto-fitted properly (${optLayout.fontSize}px)`);
assert(optLayout.badgeSize > 0, `Badge size scaled appropriately (${optLayout.badgeSize}px)`);

console.log('All Auto-Fit tests passed successfully!');
