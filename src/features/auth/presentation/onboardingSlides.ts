export type OnboardingSlide = {
  readonly imageUri: string;
  readonly eyebrowKey: 'welcome.slide1Eyebrow' | 'welcome.slide2Eyebrow' | 'welcome.slide3Eyebrow';
  readonly titleKey: 'welcome.slide1Title' | 'welcome.slide2Title' | 'welcome.slide3Title';
  readonly bodyKey: 'welcome.slide1Body' | 'welcome.slide2Body' | 'welcome.slide3Body';
};

export const ONBOARDING_SLIDES: readonly OnboardingSlide[] = [
  {
    imageUri:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80',
    eyebrowKey: 'welcome.slide1Eyebrow',
    titleKey: 'welcome.slide1Title',
    bodyKey: 'welcome.slide1Body',
  },
  {
    imageUri:
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80',
    eyebrowKey: 'welcome.slide2Eyebrow',
    titleKey: 'welcome.slide2Title',
    bodyKey: 'welcome.slide2Body',
  },
  {
    imageUri:
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=80',
    eyebrowKey: 'welcome.slide3Eyebrow',
    titleKey: 'welcome.slide3Title',
    bodyKey: 'welcome.slide3Body',
  },
];
