import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslationManagerService, TranslationUnit } from '../../core/services/translation-manager.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-translator',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './translator.component.html',
    styleUrls: ['./translator.component.scss']
})
export class TranslatorComponent implements OnInit {
    private http = inject(HttpClient);
    private xliffService = inject(TranslationManagerService);
    private loadRequestId = 0;

    // UI state
    searchQuery = signal('');
    draftStatus = signal('Edit the target text below. Changes stay in this browser; export XLIFF to use them in a translation build.');
    private readonly draftStoragePrefix = 'internationalization-studio-draft:';

    // Computed results based on search
    filteredUnits = computed(() => {
        const query = this.searchQuery().toLowerCase();
        const units = this.xliffService.units();
        if (!query) return units;
        return units.filter(u =>
            u.id.toLowerCase().includes(query) ||
            u.source.toLowerCase().includes(query) ||
            (u.target || '').toLowerCase().includes(query)
        );
    });

    constructor() {
        // Reload data when active language changes
        effect(() => {
            const lang = this.xliffService.activeLang();
            this.loadTranslations(lang);
        }, { allowSignalWrites: true });
    }

    async ngOnInit() {
        // Initial load is handled by the effect on activeLang
    }

    async loadTranslations(lang: string) {
        const requestId = ++this.loadRequestId;
        try {
            // Always load the base messages.xlf for source text
            const sourceXliff = await firstValueFrom(this.http.get('translate/messages.xlf', { responseType: 'text' }));

            let targetXliff: string | undefined;
            // If lang is not English (the source), try to load its specific xlf
            if (lang !== 'en') {
                try {
                    targetXliff = await firstValueFrom(this.http.get(`translate/messages.${lang}.xlf`, { responseType: 'text' }));
                } catch (e) {
                    console.warn(`No existing translation file for ${lang}, starting fresh.`);
                }
            }

            const units = await this.xliffService.parseXliff(sourceXliff, targetXliff);
            if (requestId !== this.loadRequestId) return;
            const drafts = this.readDrafts(lang);
            const unitIds = new Set(units.map(unit => unit.id));
            const restoredDrafts = Object.entries(drafts).filter(([id]) => unitIds.has(id));
            for (const [id, target] of restoredDrafts) {
                const unit = units.find(item => item.id === id);
                if (unit) unit.target = target;
            }
            this.xliffService.setUnits(units);
            this.draftStatus.set(
                restoredDrafts.length
                    ? `Restored ${restoredDrafts.length} saved ${lang.toUpperCase()} edit${restoredDrafts.length === 1 ? '' : 's'} from this browser. Export XLIFF to use them in a translation build.`
                    : 'Edits are saved in this browser. Export the XLIFF file to use them in a translation build.'
            );
        } catch (e) {
            console.error('Failed to load XLIFF data', e);
            if (requestId === this.loadRequestId) {
                this.draftStatus.set('Could not load translations or saved drafts. Check the browser console and try again.');
            }
        }
    }

    get languages() {
        return this.xliffService.languages();
    }

    get activeLang() {
        return this.xliffService.activeLang();
    }

    set activeLang(code: string) {
        this.xliffService.setActiveLang(code);
    }

    updateValue(id: string, event: Event) {
        const val = (event.target as HTMLTextAreaElement).value;
        this.xliffService.updateTranslation(id, val);
        try {
            const drafts = this.readDrafts(this.activeLang);
            drafts[id] = val;
            localStorage.setItem(`${this.draftStoragePrefix}${this.activeLang}`, JSON.stringify(drafts));
            this.draftStatus.set('Draft saved in this browser. Export XLIFF to use it in a translation build.');
        } catch (error) {
            console.error('Failed to save translation draft in browser storage', error);
            this.draftStatus.set('Browser storage is unavailable. Export XLIFF now to keep your edits.');
        }
    }

    exportXliff() {
        const content = this.xliffService.generateXliff(this.activeLang, this.xliffService.units());
        this.xliffService.exportFile(content, `messages.${this.activeLang}.xlf`, 'application/xml');
        this.draftStatus.set(`Downloaded messages.${this.activeLang}.xlf. Add it to the project and rebuild to publish these translations.`);
    }

    exportJson() {
        const content = this.xliffService.generateJson(this.xliffService.units());
        this.xliffService.exportFile(content, `${this.activeLang}.json`, 'application/json');
    }

    updateSearch(event: Event) {
        this.searchQuery.set((event.target as HTMLInputElement).value);
    }

    private readDrafts(lang: string): Record<string, string> {
        const stored = localStorage.getItem(`${this.draftStoragePrefix}${lang}`);
        if (!stored) return {};

        const parsed: unknown = JSON.parse(stored);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error(`Saved ${lang} translation draft has an invalid format.`);
        }

        const drafts: Record<string, string> = {};
        for (const [id, value] of Object.entries(parsed)) {
            if (typeof value !== 'string') {
                throw new Error(`Saved ${lang} translation draft contains an invalid translation.`);
            }
            drafts[id] = value;
        }
        return drafts;
    }
}
