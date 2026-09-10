/* ------------------------------------------------------------------
   Headline A/B test.
   "Stop applying to 200 jobs" sells the filter; "Know before you
   apply" sells the decision: the verdict, the real pay and the red
   flags before an evening is spent. The winner decides the roadmap.

   The variant is chosen before first paint by an inline script so
   there is no flash: ?h=a|b wins, then localStorage, then a coin flip.
   The result is stored on <html data-headline="a|b"> for analytics.
------------------------------------------------------------------- */

export type HeadlineVariant = "a" | "b";

export const HEADLINE_STORAGE_KEY = "sl_headline";

export const headlineBootstrap = `(function(){var d=document.documentElement;var v=null;try{var q=new URLSearchParams(location.search).get('h');if(q==='a'||q==='b'){v=q}var k='${HEADLINE_STORAGE_KEY}';if(!v){var s=localStorage.getItem(k);if(s==='a'||s==='b'){v=s}}if(!v){v=Math.random()<0.5?'a':'b'}localStorage.setItem(k,v)}catch(e){}d.dataset.headline=v||'a';d.classList.add('js')})();`;

export function readHeadlineVariant(): HeadlineVariant {
  if (typeof document === "undefined") return "a";
  const v = document.documentElement.dataset.headline;
  return v === "b" ? "b" : "a";
}
