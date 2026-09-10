# Chrome Web Store listing

Everything to paste into the developer dashboard (https://chrome.google.com/webstore/devconsole). The package to upload is `public/downloads/orvenic-extension.zip`, produced by `npm run build:extension`.

## Store listing

**Name:** Orvenic

**Summary (132 characters max):**
Scores job postings against your resume and fills applications from your Orvenic package for your review. Never submits for you.

**Category:** Productivity › Workflow & Planning

**Language:** English

**Detailed description:**

Orvenic tells you which job postings are worth applying to, what they really pay in your city, and rewrites your resume for the ones that pass. This extension brings that to the page you are on.

On a job posting, click the Orvenic button and it scores the posting against your resume: a verdict (apply, borderline or skip), the pay report for that role in that city, and the red flags in the posting. Same pipeline as the app.

On an application form, it fills your details, attaches the tailored resume and types or attaches the cover letter, all from the package you built in Orvenic. Filled fields are highlighted so you can check every one. It works on Greenhouse, Lever, Ashby and Workday, and on application forms embedded in company sites.

What it never does:
• It never clicks submit. You review, then you click the site's own button.
• It never answers a legal attestation. Work authorization, sponsorship, citizenship, criminal record, licences, age and clearances are marked in red for you to answer yourself, and voluntary self-identification questions are left to you.
• It never invents a fact. Every field comes from your profile or your package, both verified against your own resume.
• It never fills a salary ask. It shows the pay report beside it; the number is yours to type.

Everything it typed can be undone with one click. Once you have submitted, one more click records the application on your tracker.

The extension comes with the Orvenic 30-Day Pass and Landed packages. Connect it from the Extension page in your account; it works while a pass is active and picks up again when you renew.

**Official URL:** https://orvenic.com (verify the domain in Google Search Console with the same Google account, then pick it under Account → Verified websites)

**Support URL:** https://orvenic.com/contact

**Privacy policy URL:** https://orvenic.com/privacy

## Graphic assets

| Asset | File | Size |
| --- | --- | --- |
| Store icon | comes from the manifest (`icons/icon128.png`) | 128 × 128 |
| Screenshot 1 | `screenshot-1-score.png` | 1280 × 800 |
| Screenshot 2 | `screenshot-2-fill.png` | 1280 × 800 |
| Screenshot 3 | `screenshot-3-flags.png` | 1280 × 800 |
| Screenshot 4 | `screenshot-4-connect.png` | 1280 × 800 |
| Small promo tile | `promo-small-440x280.png` | 440 × 280 |
| Marquee promo tile | `promo-marquee-1400x560.png` | 1400 × 560 |

## Privacy tab

**Single purpose description:**
Fill job applications from the user's own Orvenic package for their review, and score the job posting on the current page against their resume.

**Permission justifications:**

- `storage`: stores the connection key that links the extension to the user's own Orvenic account, and the site address. Nothing else.
- `activeTab`: lets the user score a posting, or fill a form, on a site that is not one of the declared job boards, only when they open the popup on that page.
- `scripting`: injects the same content script on such a page, and counts form inputs per frame to find an application form embedded in a company site.
- Host permissions for boards.greenhouse.io, job-boards.greenhouse.io (and the EU hosts), jobs.lever.co, jobs.ashbyhq.com, *.myworkdayjobs.com and *.myworkdaysite.com: the content script and its styles run on the four applicant-tracking systems the extension supports, so a form can be filled from the popup without an extra click.
- Host permission for orvenic.com: the extension's own API, and a bridge script on the account's Extension page that receives the connection key so the user does not have to copy it.

**Remote code:** No, I am not using remote code. All code ships in the package; the API returns data only.

**Data usage (check these):**
- Personally identifiable information: yes. Name, email, phone, city and links from the user's own Orvenic profile, typed into the form in front of them at their request.
- Authentication information: yes. A key for the user's own Orvenic account, stored in extension storage.
- Website content: yes. The text of a job posting is read and sent to Orvenic only when the user clicks "Score this posting".
- Health, financial and payment, personal communications, location, web history, user activity: no.

**Certifications (tick all three):**
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

## Distribution tab

- Visibility: Public (or Unlisted while the pass is invite-only: the link works, the store search does not show it).
- Regions: all regions.
- Pricing: free (the pass is sold on orvenic.com, not in the store).

## Account settings the dashboard asks for

- Contact email: hello@orvenic.com, verified from the Account tab.
- Trader declaration (EU Digital Services Act): Orvenic sells a product, so declare as a trader and give a business address, email and phone. The address is shown to visitors of the listing from the EU.
- Two-step verification on the Google account is required to publish.
