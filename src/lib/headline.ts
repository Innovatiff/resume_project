/* ------------------------------------------------------------------
   Headline A/B test (dormant).
   Variant a, "Resumes that attract the right jobs", is the live
   headline and the one the page metadata and the social image carry.
   Variant b, "Know before you apply", sells the decision and stays in
   the content file for a future test; preview it with ?h=b.

   While HEADLINE_TEST_ENABLED is false every visitor gets variant a
   and nothing is stored. Set it to true to run the test again: ?h=a|b
   wins, then localStorage, then a coin flip, chosen before first paint
   by an inline script so there is no flash. Either way the result is
   stored on <html data-headline="a|b"> for analytics.
------------------------------------------------------------------- */

export type HeadlineVariant = "a" | "b";

export const HEADLINE_STORAGE_KEY = "sl_headline";

export const HEADLINE_TEST_ENABLED = false;

const pick = HEADLINE_TEST_ENABLED
  ? `var q=new URLSearchParams(location.search).get('h');if(q==='a'||q==='b'){v=q}var k='${HEADLINE_STORAGE_KEY}';if(!v){var s=localStorage.getItem(k);if(s==='a'||s==='b'){v=s}}if(!v){v=Math.random()<0.5?'a':'b'}localStorage.setItem(k,v)`
  : `var q=new URLSearchParams(location.search).get('h');if(q==='a'||q==='b'){v=q}`;

export const headlineBootstrap = `(function(){var d=document.documentElement;var v=null;try{${pick}}catch(e){}d.dataset.headline=v||'a';d.classList.add('js')})();`;

export function readHeadlineVariant(): HeadlineVariant {
  if (typeof document === "undefined") return "a";
  const v = document.documentElement.dataset.headline;
  return v === "b" ? "b" : "a";
}
