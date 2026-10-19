import { Component } from '@angular/core';
import { NavbarComponent } from './i18n/navbar/navbar.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
  RouterOutlet,
} from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Meta, Title } from '@angular/platform-browser';
import { filter, map } from 'rxjs';

import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    NavbarComponent,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    RouterOutlet,
  ],
})
export class AppComponent {
  currentYear: number = new Date().getFullYear();

  private readonly siteOrigin = 'https://internationalization-d2aa6.web.app';

  constructor(
    private readonly themeService: ThemeService,
    private readonly meta: Meta,
    private readonly title: Title,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) { }


  ngOnInit() {
    this.currentYear = new Date().getFullYear();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let child = this.route.firstChild;
          while (child?.firstChild) {
            child = child.firstChild;
          }
          return child?.snapshot.data;
        })
      )
      .subscribe((routeData) => {
        const localeSegment = window.location.pathname.split('/')[1];
        const locale = ['en', 'nl', 'sr'].includes(localeSegment)
          ? localeSegment
          : 'en';
        const siteUrl = new URL(`/${locale}/`, this.siteOrigin).href;
        const routePath = this.router.url.split(/[?#]/, 1)[0].replace(/^\/+/, '');
        const currentUrl = new URL(routePath, siteUrl).href;
        if (routeData) {
          const pageTitle = routeData['title'] || 'Angular Internationalization Demo';
          const description =
            routeData['description'] ||
            'Explore a multilingual Angular internationalization demo.';
          this.title.setTitle(pageTitle);
          this.meta.updateTag({
            name: 'description',
            content: description,
          });
          this.meta.updateTag({
            name: 'robots',
            content: routeData['index'] === false ? 'noindex,follow' : 'index,follow',
          });
          this.meta.updateTag({ property: 'og:title', content: pageTitle });
          this.meta.updateTag({ property: 'og:description', content: description });
          this.meta.updateTag({ property: 'og:url', content: currentUrl });
          this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
          this.meta.updateTag({ name: 'twitter:description', content: description });
          const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
          if (routeData['index'] === false) {
            canonical?.remove();
            return;
          }
          let canonicalLink = canonical;
          if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.rel = 'canonical';
            document.head.appendChild(canonicalLink);
          }
          canonicalLink.href = currentUrl;
        }
      });
  }
}
