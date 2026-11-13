# LIX AFD Prompt Generator

A no-server GitHub Pages app for building consistent, research-ready Area Forecast Discussion prompts for WFO New Orleans/Baton Rouge (LIX).

## What it does

- Starts with the current date and time in `America/Chicago`
- Automatically fills short- and long-term forecast periods, while keeping them editable
- Supports full-AFD and section-specific presets
- Captures short-term, long-term, aviation, marine/coastal, hazard, coordination, confidence, and bust-risk notes
- Pulls current LIX-issued alerts from `api.weather.gov` and adds the snapshot to the prompt
- Automatically samples 12 representative LIX-area locations from the public NWS `/points` → `forecastGridData` API, preserving native valid-time intervals, source URLs and grid `updateTime`
- Supports structured forecaster AWIPS/GFE ranges that explicitly take numerical precedence over potentially older published grids
- Flags missing/stale public grid samples rather than inventing numbers, and embeds a mandatory numerical verification policy
- Provides a preliminary post-draft PoP/temperature/RH/wind numeric-claim audit against entered AWIPS values
- Embeds LIX hazard thresholds so near-criteria conditions are evaluated explicitly
- Saves the working draft in the browser's local storage
- Copies the finished prompt or downloads it as a text file

## Use

Open the GitHub Pages site, enter the shift notes and select the sections. Wait for the **NWS grids & AWIPS priority** panel to finish its automatic public-grid check (or click **Refresh grids**). If your AWIPS grids are newer or have better areal coverage, enter values in the supported format, such as `2026-11-16 | PoP | 30 | 60 | LIX CWA`. Select **Generate AFD prompt** and copy the result into ChatGPT. Paste a completed draft into **Post-draft numerical check** to inventory explicit numeric claims.

The site is entirely client-side, has no backend, and does not upload typed forecast notes. It requests public NWS alerts, point metadata, and raw gridpoint data from `api.weather.gov`. AWIPS entries and working notes are stored locally in the browser.

**Limits:** The public data represent discrete point samples, NOT full-CWA minima/maxima, a daily PoP, or necessarily the latest local AWIPS grids. Native grid PoP intervals may span calendar-day boundaries; do not sum or average them. Public data may lag or fail. The post-draft audit is a conservative text scanner, NOT an operational verification system; it may miss qualitative or ambiguous statements. A human forecaster must verify values, valid times, areas, units, and hazards in AWIPS before issuance.

## GitHub Pages

For the one-time setup, open repository **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select **main** and **/(root)**, then click **Save**. Future changes to `main` will deploy automatically. The site will be available at:

`https://mefferso.github.io/AFD_generator/`

GitHub Pages sites are public even when their source repository is private. If the Pages settings say the private repository is not eligible under the account's current plan, change the repository visibility to public or use a GitHub plan that supports Pages from private repositories.

## Hazard criteria source

Thresholds were checked on September 6, 2026 against the [official WFO LIX Watch, Warning and Advisory Criteria page](https://www.weather.gov/lix/wwa_criteria). Operational policy and current AWIPS configuration always take precedence; periodically recheck the source and update `HAZARD_CRITERIA` in `app.js` when local criteria change.
