import { StrictMode, createElement } from 'react';
import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Mount a page's `App` into the document's one root, under StrictMode.
 *
 * Each page's `main.tsx` is its stylesheet and this call: the HTML entry
 * names the script, the script names the sheet and the app, and the site
 * says how the two meet the document.
 */
export function mountPage(App: ComponentType): void {
  createRoot(document.getElementById('root')!).render(
    createElement(StrictMode, null, createElement(App)),
  );
}
