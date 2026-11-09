# EDRMS UI prototype

A clickable, front-end-only redesign of the Q-BITS EDRMS file journeys, built with the Q-BITS design system. It does not call the EDMS API; all data is example data kept in the browser.

## Run it

Open `prototype/index.html` through any static web server, for example:

```bash
npx serve prototype
```

## What's in it

- **Sign-in** with one-click demo accounts for the three journeys: Registry Officer (Henry Kiprotich), Marking Officer (Vera Wambui) and Action Officer (Virah Creates). Switch account from the avatar menu.
- **Overview** for each role: Ministry crest, latest files, notifications, AI suggestions, quick-action tiles and file movements.
- **File Routing** with search and a stage filter.
- **The full journey**: record incoming mail → send for marking → mark → dispatch → act or delegate → file away (with the reply added to the outward register).
- **My tasks** with the rule that nobody approves their own request.
- **User guide** with screenshots of each step, and **tutorial mode** that walks through the live screens.
- **Settings → Demo**: simulate a records service outage and reset the demo data.

## Files

- `index.html` – page markup
- `app.js` – state, routing, shell, sign-in and journey actions
- `views.js` – every screen, the user guide and tutorial mode
- `data.js` – example people, files and registers
- `app.css` – layout and the glass skin; `tokens.css`, `bundle.css`, `bundle.js` – Q-BITS design system
- `assets/` – Ministry crest, backgrounds, tile artwork and guide screenshots
