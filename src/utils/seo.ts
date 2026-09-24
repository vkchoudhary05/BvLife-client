export interface SeoMetadata {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

function setMeta(selector: string, attribute: string, value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    const [key, keyValue] = selector.match(/\[(name|property)="([^"]+)"\]/)?.slice(1) || [];
    if (key && keyValue) element.setAttribute(key, keyValue);
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, value);
}

export function updateSeoMetadata(metadata: SeoMetadata) {
  const title = metadata.title.slice(0, 65);
  const description = metadata.description.replace(/\s+/g, ' ').trim().slice(0, 160);
  const canonicalUrl = new URL(metadata.path, window.location.origin).toString();
  const imageUrl = new URL(metadata.image || '/Bvlogo.png', window.location.origin).toString();

  document.title = title;
  setMeta('meta[name="description"]', 'content', description);
  setMeta('meta[name="robots"]', 'content', metadata.noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
  setMeta('meta[property="og:type"]', 'content', 'website');
  setMeta('meta[property="og:title"]', 'content', title);
  setMeta('meta[property="og:description"]', 'content', description);
  setMeta('meta[property="og:url"]', 'content', canonicalUrl);
  setMeta('meta[property="og:site_name"]', 'content', 'BV Life');
  setMeta('meta[property="og:image"]', 'content', imageUrl);
  setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
  setMeta('meta[name="twitter:title"]', 'content', title);
  setMeta('meta[name="twitter:description"]', 'content', description);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;

  document.getElementById('seo-jsonld')?.remove();
  if (metadata.structuredData) {
    const script = document.createElement('script');
    script.id = 'seo-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(metadata.structuredData);
    document.head.appendChild(script);
  }
}
