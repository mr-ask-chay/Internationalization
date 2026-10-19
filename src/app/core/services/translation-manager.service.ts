import { Injectable, signal, computed } from '@angular/core';

export interface TranslationUnit {
  id: string;
  source: string;
  target?: string;
  description?: string;
  meaning?: string;
}

export interface Language {
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationManagerService {
  // Configured in angular.json
  private readonly LOCALE_MAP: { [key: string]: string } = {
    'en': 'English',
    'nl': 'Dutch',
    'sr': 'Serbian'
  };

  private languagesSignal = signal<Language[]>([
    { code: 'en', name: 'English' },
    { code: 'nl', name: 'Dutch' },
    { code: 'sr', name: 'Serbian' }
  ]);

  private activeLangSignal = signal<string>('en');
  // Store units as a signal
  private unitsSignal = signal<TranslationUnit[]>([]);

  languages = computed(() => this.languagesSignal());
  activeLang = computed(() => this.activeLangSignal());
  units = computed(() => this.unitsSignal());

  constructor() {
    this.detectBrowserLanguage();
  }

  setUnits(units: TranslationUnit[]) {
    this.unitsSignal.set(units);
  }

  addLanguage(code: string, name: string) {
    this.languagesSignal.update(langs => {
      if (langs.find(l => l.code === code)) return langs;
      return [...langs, { code, name }];
    });
  }

  setActiveLang(code: string) {
    this.activeLangSignal.set(code);
  }

  updateTranslation(id: string, value: string) {
    this.unitsSignal.update(units => {
      return units.map(u => u.id === id ? { ...u, target: value } : u);
    });
  }

  async parseXliff(sourceXml: string, targetXml?: string): Promise<TranslationUnit[]> {
    const parser = new DOMParser();
    const sourceDoc = parser.parseFromString(sourceXml, 'application/xml');
    const targetDoc = targetXml ? parser.parseFromString(targetXml, 'application/xml') : null;

    const units: TranslationUnit[] = [];
    const sourceTransUnits = sourceDoc.querySelectorAll('trans-unit');

    sourceTransUnits.forEach(unit => {
      const id = unit.getAttribute('id') || '';
      const source = unit.querySelector('source')?.textContent || '';

      let target = '';
      if (targetDoc) {
        const targetUnit = targetDoc.querySelector(`trans-unit[id="${id}"]`);
        target = targetUnit?.querySelector('target')?.textContent || '';
      } else {
        // If no target doc, we are likely viewing the source language (English)
        target = source;
      }

      units.push({ id, source, target });
    });

    return units;
  }

  generateXliff(lang: string, units: TranslationUnit[]): string {
    const header = `<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en-US" target-language="${lang}" datatype="plaintext" original="ng2.template">
    <body>`;

    const body = units.map(u => `
      <trans-unit id="${u.id}" datatype="html">
        <source>${this.escapeXml(u.source)}</source>
        <target>${this.escapeXml(u.target || '')}</target>
      </trans-unit>`).join('');

    const footer = `
    </body>
  </file>
</xliff>`;

    return header + body + footer;
  }

  generateJson(units: TranslationUnit[]): string {
    const obj: { [key: string]: string } = {};
    units.forEach(u => {
      obj[u.id] = u.target || u.source;
    });
    return JSON.stringify(obj, null, 2);
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  private detectBrowserLanguage() {
    const browserLang = navigator.language.split('-')[0];
    const supported = this.languagesSignal().find(l => l.code === browserLang);
    if (supported) {
      this.activeLangSignal.set(browserLang);
    }
  }

  exportFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  }
}
