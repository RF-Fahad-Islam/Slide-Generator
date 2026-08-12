import { describe, it, expect } from 'vitest';
import {
  effectiveAnswerMode,
  resolveSlideAnswerFlags,
  expandDeckSlides,
} from '../answerSlides';
import { DeckConfig, MCQItem } from '../../types';

describe('answerSlides mode resolution', () => {
  const mockItems: MCQItem[] = [
    {
      id: 'q1',
      stem: 'What is 2 + 2?',
      options: [
        { key: 'A', text: '3' },
        { key: 'B', text: '4' },
      ],
      answer: 'B',
    },
    {
      id: 'q2',
      stem: 'What is the capital of Bangladesh?',
      options: [
        { key: 'A', text: 'Dhaka' },
        { key: 'B', text: 'Chittagong' },
      ],
      answer: 'A',
    },
  ];

  const baseConfig: DeckConfig = {
    templateId: 'nobel-dark',
    brandName: 'TEST',
    logoUrl: '',
    logoSize: 'md',
    logoPosition: 'top-left',
    headerTitle: 'Math',
    badgeTag: 'Class 10',
    footerTag: 'FOOTER',
    watermarkAvatar: '',
    watermarkHandle: 'Teacher',
    aspectRatio: '16:9',
    showAnswerInSlide: true,
    showExplanationInSlide: false,
  };

  it('correctly resolves effectiveAnswerMode', () => {
    expect(effectiveAnswerMode({ ...baseConfig, answerMode: 'separate_slide' })).toBe('separate_slide');
    expect(effectiveAnswerMode({ ...baseConfig, answerMode: 'highlight' })).toBe('highlight');
    expect(effectiveAnswerMode({ ...baseConfig, answerMode: 'hidden' })).toBe('hidden');
    expect(effectiveAnswerMode({ ...baseConfig, answerMode: undefined, showAnswerInSlide: true })).toBe('highlight');
    expect(effectiveAnswerMode({ ...baseConfig, answerMode: undefined, showAnswerInSlide: false })).toBe('hidden');
  });

  it('keeps question slides 100% clean in separate_slide mode', () => {
    const config: DeckConfig = {
      ...baseConfig,
      answerMode: 'separate_slide',
      answerDisplayStyles: ['highlight_option', 'answer_pill', 'explanation_card'],
    };

    const questionFlags = resolveSlideAnswerFlags(config, false);
    expect(questionFlags.showOptionHighlight).toBe(false);
    expect(questionFlags.showAnswerPill).toBe(false);
    expect(questionFlags.showExplanationCard).toBe(false);

    const answerFlags = resolveSlideAnswerFlags(config, true);
    expect(answerFlags.showOptionHighlight).toBe(true);
    expect(answerFlags.showAnswerPill).toBe(true);
    expect(answerFlags.showExplanationCard).toBe(true);
  });

  it('expands deck slides to 2N slides in separate_slide mode', () => {
    const separateConfig = { ...baseConfig, answerMode: 'separate_slide' as const };
    const slides = expandDeckSlides(mockItems, separateConfig);
    expect(slides.length).toBe(4);
    expect(slides[0].isAnswerSlide).toBe(false);
    expect(slides[1].isAnswerSlide).toBe(true);
    expect(slides[2].isAnswerSlide).toBe(false);
    expect(slides[3].isAnswerSlide).toBe(true);
  });

  it('keeps deck slides at N slides in highlight or hidden mode', () => {
    const highlightSlides = expandDeckSlides(mockItems, { ...baseConfig, answerMode: 'highlight' });
    expect(highlightSlides.length).toBe(2);

    const hiddenSlides = expandDeckSlides(mockItems, { ...baseConfig, answerMode: 'hidden' });
    expect(hiddenSlides.length).toBe(2);
  });
});
