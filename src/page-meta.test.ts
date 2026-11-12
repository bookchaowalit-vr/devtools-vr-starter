import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Interface coverage (ADR-0015 §1.2, free tool): legal link, status, contact and SEO basics.
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('page metadata and footer links', () => {
  it('has Open Graph title, description and type', () => {
    expect(html).toMatch(/<meta property="og:title" content="[^"]+"/);
    expect(html).toMatch(/<meta property="og:description" content="[^"]+"/);
    expect(html).toContain('<meta property="og:type" content="website"');
  });

  it('links privacy, status and contact', () => {
    expect(html).toContain('href="https://bookchaowalit.com/privacy"');
    expect(html).toContain('href="https://monitor.bookchaowalit.com/"');
    expect(html).toContain('href="mailto:bookchaowalit.work@gmail.com"');
  });

  it('ships robots.txt pointing at a sitemap that exists', () => {
    const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
    expect(robots).toContain('Sitemap: https://devtools-vr-starter.vercel.app/sitemap.xml');
    expect(existsSync(new URL('../public/sitemap.xml', import.meta.url))).toBe(true);
  });
});
