import { exportDeckToPPTX } from './src/utils/pptxExport';

const item: any = {
  id: 'q1',
  questionType: 'standard',
  stem: 'What is 2+2?',
  options: [
    { key: 'A', text: '3' },
    { key: 'B', text: '4' },
    { key: 'C', text: '5' },
    { key: 'D', text: '6' },
  ],
  answer: 'B',
  explanation: '2+2=4',
};

const config: any = {
  templateId: 'nobel',
  brandName: 'Test',
};

async function main() {
  try {
    const res = await exportDeckToPPTX(
      [item],
      config,
      (msg) => console.log('[progress]', msg)
    );
    console.log('RESULT:', res);
  } catch (e: any) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
  }
}

main();
