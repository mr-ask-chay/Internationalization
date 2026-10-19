import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature/home/home.component').then((m) => m.HomeComponent),
    title: 'Angular Internationalization Demo | XLIFF Translation Studio',
    data: {
      description:
        'Explore a multilingual Angular i18n demo with English, Dutch, and Serbian translations, an XLIFF translation studio, and practical localization examples.',
    },
  },
  {
    path: 'studio',
    loadComponent: () =>
      import('./feature/translator/translator.component').then((m) => m.TranslatorComponent),
    title: 'Angular XLIFF Translation Studio | Internationalization Demo',
    data: {
      description:
        'Explore and edit Angular XLIFF translation units, search source and target text, and export translation files in this internationalization demo.',
    },
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./i18n/about/about.component').then((m) => m.AboutComponent),
    title: 'About the Author | Angular Internationalization Demo',
    data: {
      description:
        'Learn about the author and projects behind this multilingual Angular internationalization demo.',
    },
  },
  {
    path: 'feedback',
    loadComponent: () =>
      import('./i18n/feedback/feedback.component').then(
        (m) => m.FeedbackComponent
      ),
    title: 'Feedback - Internationalization',
    data: {
      description:
        'Feedback about the demo of Internationalization.',
    },
  },
  {
    path: '**',
    loadComponent: () =>
      import('./feature/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
    title: 'Page Not Found',
    data: {
      description: 'Sorry, the page you’re looking for doesn’t exist.',
      index: false,
    },
  },
];
