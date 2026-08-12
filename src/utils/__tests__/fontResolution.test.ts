import { describe, it, expect } from 'vitest';
import { getBoxFontFamily } from '../slideTextBoxes';
import { DeckConfig, SlideTextBox } from '../../types';

describe('getBoxFontFamily', () => {
  const baseConfig: DeckConfig = {
    templateId: 'nobel-dark',
    brandName: "NOBEL'S CLASSROOM",
    logoUrl: '',
    logoSize: 'md',
    logoPosition: 'top-left',
    headerTitle: 'Biology',
    badgeTag: 'SSC Biology',
    footerTag: 'BIOMISSION',
    watermarkAvatar: '',
    watermarkHandle: 'Instructor',
    aspectRatio: '16:9',
    showAnswerInSlide: true,
    showExplanationInSlide: false,
    fontFamily: "'Hind Siliguri', sans-serif",
    headerFont: "'Playfair Display', serif",
    bodyFont: "'Anek Bangla', sans-serif",
    optionsFont: "'Poppins', sans-serif",
    footerFont: "'Tiro Bangla', serif",
  };

  it('dynamically resolves header font for header text boxes', () => {
    const box: SlideTextBox = {
      id: 'hdr_brand',
      bind: 'brand',
      x: 0,
      y: 0,
      w: 100,
      fontSize: 20,
      color: '#fff',
      align: 'left',
      bold: true,
    };
    expect(getBoxFontFamily(box, baseConfig)).toBe("'Playfair Display', serif");
  });

  it('dynamically resolves body font for stem and roman text boxes', () => {
    const stemBox: SlideTextBox = {
      id: 'mdl_stem',
      bind: 'stem',
      x: 0,
      y: 0,
      w: 100,
      fontSize: 20,
      color: '#fff',
      align: 'left',
      bold: true,
    };
    expect(getBoxFontFamily(stemBox, baseConfig)).toBe("'Anek Bangla', sans-serif");
  });

  it('dynamically resolves options font for options and answer boxes', () => {
    const optionsBox: SlideTextBox = {
      id: 'mdl_options',
      bind: 'options',
      x: 0,
      y: 0,
      w: 100,
      fontSize: 20,
      color: '#fff',
      align: 'left',
      bold: false,
    };
    expect(getBoxFontFamily(optionsBox, baseConfig)).toBe("'Poppins', sans-serif");
  });

  it('dynamically resolves footer font for footerTag and watermark boxes', () => {
    const footerBox: SlideTextBox = {
      id: 'ftr_tag',
      bind: 'footerTag',
      x: 0,
      y: 0,
      w: 100,
      fontSize: 20,
      color: '#fff',
      align: 'left',
      bold: true,
    };
    expect(getBoxFontFamily(footerBox, baseConfig)).toBe("'Tiro Bangla', serif");
  });

  it('respects explicit per-box custom font overrides when isCustomFontOverride is true', () => {
    const customBox: SlideTextBox = {
      id: 'custom_stem',
      bind: 'stem',
      x: 0,
      y: 0,
      w: 100,
      fontSize: 20,
      color: '#fff',
      align: 'left',
      bold: true,
      fontFamily: "'Atma', display",
      isCustomFontOverride: true,
    };
    expect(getBoxFontFamily(customBox, baseConfig)).toBe("'Atma', display");
  });
});
