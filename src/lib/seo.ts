import { useEffect } from "react";
import { api } from "./api";
import { sessionId } from "./format";

export function track(type: string, data: { product_id?: string; query?: string; quantity?: number } = {}) {
  api.post("/analytics/events", { type, session_id: sessionId(), ...data }).catch(() => undefined);
}

function setMeta(attr: string, key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function useSeo({ title, description, image, jsonLd, noindex }: { title?: string; description?: string; image?: string; jsonLd?: object; noindex?: boolean }) {
  useEffect(() => {
    const t = title ? `${title} | Raf Decor` : "Raf Decor | Premium Handcrafted Wooden Furniture & Kitchenware";
    document.title = t;
    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
    }
    setMeta("property", "og:title", t);
    setMeta("property", "og:type", "website");
    if (image) setMeta("property", "og:image", image);
    setMeta("name", "robots", noindex ? "noindex,nofollow" : "index,follow");
    let canon = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) {
      canon = document.createElement("link");
      canon.rel = "canonical";
      document.head.appendChild(canon);
    }
    canon.href = window.location.origin + window.location.pathname;
    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => { script?.remove(); };
  }, [title, description, image, jsonLd, noindex]);
}
