import { useEffect } from 'react';

/**
 * useSeo hook dynamically updates document head tags
 * for Single Page Application navigation and search engine crawlers.
 */
export default function useSeo({ title, description, path = '', ogImage = '/og-image.svg' }) {
  useEffect(() => {
    // 1. Update Title
    if (title) {
      document.title = title;
    }

    // 2. Helper to set or update meta tags
    const setMeta = (attrName, attrValue, content) => {
      let meta = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrValue);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // 3. Update Description & Social Tags
    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
      setMeta('name', 'twitter:description', description);
    }

    if (title) {
      setMeta('property', 'og:title', title);
      setMeta('name', 'twitter:title', title);
    }

    const currentUrl = `https://farmchain.gov.in${path ? (path.startsWith('/') ? path : '/' + path) : ''}`;
    setMeta('property', 'og:url', currentUrl);
    setMeta('name', 'twitter:url', currentUrl);

    if (ogImage) {
      setMeta('property', 'og:image', ogImage);
      setMeta('name', 'twitter:image', ogImage);
    }

    // 4. Update Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);
  }, [title, description, path, ogImage]);
}
