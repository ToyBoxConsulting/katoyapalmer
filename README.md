# Deploy katoyapalmer.com on GitHub Pages

This folder is a complete, self-contained website. No build step.

```
katoyapalmer-site/
├── index.html        ← the site
├── CNAME             ← tells GitHub your custom domain (katoyapalmer.com)
└── assets/           ← photos + brand logos
```

## 1. Put these files in a GitHub repo
- Create a new repository (any name, e.g. `katoyapalmer`). Make it **Public**.
- Upload **the contents of this folder** to the repo root — so `index.html` and `CNAME`
  sit at the top level of the repo (not inside a subfolder), with `assets/` beside them.
  (On github.com: "Add file → Upload files" → drag everything in, Commit.)

## 2. Turn on GitHub Pages
- Repo **Settings → Pages**.
- **Source:** "Deploy from a branch" → Branch: `main` → Folder: `/ (root)` → Save.
- Wait ~1 minute. It goes live at `https://YOURUSERNAME.github.io/REPONAME/`.
- Under **Custom domain**, `katoyapalmer.com` should already be filled in (from the CNAME file).
  Tick **Enforce HTTPS** once it's available.

## 3. Point your domain at GitHub (DNS)
At whatever provider holds katoyapalmer.com after you transfer it, set these records:

**Apex domain (katoyapalmer.com) — four A records:**
```
A   @   185.199.108.153
A   @   185.199.109.153
A   @   185.199.110.153
A   @   185.199.111.153
```
**(Optional, IPv6) — four AAAA records:**
```
AAAA  @  2606:50c0:8000::153
AAAA  @  2606:50c0:8001::153
AAAA  @  2606:50c0:8002::153
AAAA  @  2606:50c0:8003::153
```
**www subdomain — one CNAME:**
```
CNAME   www   YOURUSERNAME.github.io
```

DNS can take a few minutes to 24 hours. GitHub issues the HTTPS certificate automatically.

## Updating the site later
Edit `index.html` in the repo (or re-upload) — GitHub Pages redeploys on every commit.

---
Built for Katoya Raquell Palmer · katoyapalmer.com
