# Orvenic browser extension

Manifest V3, for Chrome, Edge and Brave. Scores the job posting on the current page against the candidate's resume, fills application forms from a built Orvenic package for the candidate's review, marks in red what they must answer themselves, and records the fill on their tracker.

It never clicks submit. There is no code path in `src/content/page.ts` that touches a button, and the end-to-end test asserts that the form's submit handler never ran.

## Build

```bash
npm run build:extension        # extension/dist + public/downloads/orvenic-extension.zip
node extension/build.mjs --dev # extension/.dev: same code, plus localhost hosts, used by npm run e2e:extension
```

`build.mjs` bundles `src/` with esbuild and writes the manifest. The ATS host list there mirrors `src/lib/extension/ats.ts`; change both together. `dist/` and the zip are committed so a customer can install without building.

## Install

Customers install from the Chrome Web Store listing: https://chromewebstore.google.com/detail/ilpkkihajccpmnnoalhobpcmbagbcjch — the Extension page in the app links to it. Edge and Brave install from the same listing.

## Install by hand (development, or a browser without the store)

1. Download `public/downloads/orvenic-extension.zip` (the app's Extension page links to it) and unzip it, or use `extension/dist` from a checkout.
2. `chrome://extensions` → Developer mode → Load unpacked → choose the folder.
3. In the Orvenic app open Extension and click Connect this browser.

## How it is put together

| File | Runs where | Does |
| --- | --- | --- |
| `src/background.ts` | service worker | Holds the connection key in `chrome.storage.local`, calls `/api/extension/*`, drives the content script in the current tab. |
| `src/content/page.ts` | ATS hosts (declared) and any page the popup is opened on (`activeTab`) | Reads the posting, finds fields, classifies them with `src/lib/extension/fields.ts`, fills, flags, shows the on-page panel, undoes. |
| `src/content/bridge.ts` | orvenic.com | Announces the extension to `/app/extension` and carries the key it issues to the worker. |
| `src/popup/popup.ts` | the popup | One screen per situation: connect, no pass, score this posting, fill this form, what was filled. `?url=` picks a tab by URL prefix, which the e2e uses. |
| `static/` | | popup markup and styles, the page marks (`content.css`), icons rendered from the logo. |

The shared, DOM-free logic lives in the app's tree so it is unit-tested with everything else: `src/lib/extension/fields.ts` (what may be filled, hinted, skipped or flagged), `match.ts` (which saved application a page belongs to), `ats.ts` (hosts and selectors).

## Permissions, and why

| Permission | Why |
| --- | --- |
| `storage` | The connection key and the site address. |
| `activeTab` | Score or fill on a page that is not one of the declared ATS hosts, only when the candidate opens the popup there. |
| `scripting` | Inject the content script on such a page, and count inputs per frame to find an embedded application form. |
| Greenhouse, Lever, Ashby, Workday hosts | The content script and its styles on the sites the extension knows. |
| `orvenic.com` | The API, and the bridge on the Extension page. |

No `tabs`, no `webNavigation`, no `<all_urls>`. The dev build adds `localhost` so the end-to-end test can serve look-alike pages.

## Store submission

`store/listing.md` has the listing text, the permission justifications and the data disclosures to paste into the developer dashboard; `store/*.png` are the screenshots and promo tiles. After approval set `NEXT_PUBLIC_EXTENSION_STORE_URL` on the site so the Extension page offers Add to Chrome.

## Store submission notes

- Single purpose: fill job applications from the candidate's own Orvenic package, for their review.
- Remote code: none. All code ships in the package; the API returns data only.
- Data: the connection key (a bearer secret for the candidate's own account) in extension storage; the resume and cover letter pass through memory to the form and are not stored. Nothing is collected from the pages beyond the posting text the candidate asks to score.
- Privacy policy: the site's `/privacy`.
