import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AppConfig } from 'src/app/core/config/app.Config';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [RouterLinkActive, RouterLink, CommonModule],
})
export class NavbarComponent {
  private readonly navigateToPdfPasswordRemover = AppConfig.pdfPasswordRemover();
  public themeService = inject(ThemeService);

  private readonly supportedLocales = ['en', 'nl', 'sr'];
  currentLocale = this.getCurrentLocale();

  languages = [
    { code: 'en', label: 'English' },
    { code: 'nl', label: 'Dutch' },
    { code: 'sr', label: 'Serbian' }
  ];

  navigateToPdfPwdRmv() {
    window.location.href = `${this.navigateToPdfPasswordRemover}`;
  }

  switchSiteLanguage(code: string) {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const routeSegments = this.supportedLocales.includes(pathSegments[0])
      ? pathSegments.slice(1)
      : pathSegments;
    const route = routeSegments.length ? `/${routeSegments.join('/')}` : '/';
    window.location.href = `/${code}${route}`;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  private getCurrentLocale() {
    const locale = window.location.pathname.split('/')[1];
    return this.supportedLocales.includes(locale) ? locale : 'en';
  }
}
