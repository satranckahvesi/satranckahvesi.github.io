// Entry for pages without articles (home, archives, about).

import { installCookieConsent } from './consent.js';
import { markExternalLinks } from './external-links.js';
import { curlyPass } from './text/curly-quotes.js';
import { installAppButton } from './install-app.js';
import { installNavMenu } from './nav-menu.js';
import { installServiceWorker } from './service-worker.js';
import { installThemeToggle } from './theme-toggle.js';

curlyPass(document.body);
markExternalLinks(document.querySelector('main'));
installThemeToggle();
installNavMenu();
installAppButton();
installServiceWorker();
installCookieConsent();
