# LIX AFD Prompt Generator

A no-server GitHub Pages app for building consistent, research-ready Area Forecast Discussion prompts for WFO New Orleans/Baton Rouge (LIX).

## What it does

- Starts with the current date and time in `America/Chicago`
- Automatically fills short- and long-term forecast periods, while keeping them editable
- Supports full-AFD and section-specific presets
- Captures short-term, long-term, aviation, marine/coastal, hazard, coordination, confidence, and bust-risk notes
- Pulls current LIX-issued alerts from `api.weather.gov` and adds the snapshot to the prompt
- Embeds LIX hazard thresholds so near-criteria conditions are evaluated explicitly
- Saves the working draft in the browser's local storage
- Copies the finished prompt or downloads it as a text file

## Use

Open the GitHub Pages site, enter the shift notes, choose the required sections and forecast focus, then select **Generate AFD prompt**. Copy the result into ChatGPT.

The site is entirely client-side. It has no backend and sends no entered forecast notes anywhere. The only network requests made by the page are read-only calls to the public NWS alerts API.

## GitHub Pages

In repository **Settings → Pages**, choose **Deploy from a branch**, then select **main** and **/(root)**. The site will be available at:

`https://mefferso.github.io/AFD_generator/`

## Hazard criteria source

Thresholds were checked on September 6, 2026 against the [official WFO LIX Watch, Warning and Advisory Criteria page](https://www.weather.gov/lix/wwa_criteria). Operational policy and current AWIPS configuration always take precedence; periodically recheck the source and update `HAZARD_CRITERIA` in `app.js` when local criteria change.
