import pptxgen from 'pptxgenjs';
console.log('typeof pptxgen:', typeof pptxgen);
console.log('has default?', pptxgen && 'default' in (pptxgen as any));
const anypptx: any = pptxgen;
const candidate = (anypptx && anypptx.default) || pptxgen;
try {
  const x = new candidate();
  console.log('new ok, type:', typeof x);
} catch (e: any) {
  console.log('new err:', e.message);
}
