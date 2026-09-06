"use strict";

const CENTRAL_ZONE = "America/Chicago";
const STORAGE_KEY = "lix-afd-generator-v1";

const HAZARD_CRITERIA = [
  {
    group: "Heat",
    items: [
      "Heat Advisory: heat index ≥108°F OR temperature ≥103°F.",
      "Excessive Heat Warning: heat index ≥113°F OR temperature ≥105°F. Watch when these conditions are expected in the next 24–72 hours."
    ]
  },
  {
    group: "Cold and freeze",
    items: [
      "Cold Weather Advisory: temperature or wind chill ≤25°F south of I-10/12; ≤20°F north of I-10/12.",
      "Extreme Cold Warning: temperature or wind chill ≤15°F south of I-10/12; ≤10°F north of I-10/12.",
      "Freeze Warning: south of the Donaldsonville–Lake Pontchartrain line, anytime freezing temperatures are forecast. North of the Donaldsonville–Lake Pontchartrain–Pascagoula line, for the first two freezes of the season or after a late-winter extended warm spell when vegetation has begun growing."
    ]
  },
  {
    group: "Fog and land wind",
    items: [
      "Dense Fog Advisory: widespread or localized visibility ≤1/4 mile.",
      "Wind Advisory: sustained wind 26–39 mph OR gusts ≥40 mph, expected for at least 1 hour.",
      "High Wind Warning: sustained wind ≥40 mph for at least 1 hour OR gusts ≥58 mph for at least 1 hour."
    ]
  },
  {
    group: "Marine",
    items: [
      "Small Craft Advisory: sustained wind or frequent gusts 21–33 kt OR waves ≥7 ft, expected to begin within 36 hours.",
      "Gale Warning: sustained wind or frequent gusts 34–47 kt, expected to begin within 36 hours.",
      "Storm Warning: sustained wind or frequent gusts 48–63 kt, expected to begin within 36 hours.",
      "Special Marine Warning: short-duration (up to 2 hours) convective sustained wind/gust ≥34 kt, hail ≥0.75 inch, and/or waterspouts."
    ]
  },
  {
    group: "Severe convection",
    items: [
      "Severe thunderstorm threshold: wind ≥58 mph and/or hail ≥1 inch in diameter.",
      "Tornado Warning: a tornado is imminent or occurring."
    ]
  },
  {
    group: "Coastal and flooding",
    items: [
      "Coastal Flood Watch: moderate to severe coastal flooding is possible along the Gulf or around Lakes Pontchartrain and Maurepas.",
      "Coastal Flood Warning: moderate to severe coastal flooding is occurring or imminent.",
      "Coastal Flood Advisory/Statement: minor or nuisance coastal flooding is occurring or imminent.",
      "Flash Flood Warning: flash flooding is imminent or occurring. Urban/Small Stream Flood Advisory: nuisance flooding remains below a threat to life and property.",
      "Flood Watch: conditions are favorable for flooding; Flood Warning: flooding is imminent or occurring."
    ]
  },
  {
    group: "Winter weather",
    items: [
      "Winter Storm Outlook: ≥30% chance of exceeding local warning criteria 3–7 days in advance.",
      "Winter Storm Watch: ≥50% chance of exceeding warning criteria, generally 12–48 hours ahead.",
      "Winter Storm Warning: winter precipitation is occurring, imminent, or has a very high probability (local page describes ≥80% chance of warning criteria being exceeded).",
      "Heavy snow benchmark: ≥2 inches per event. Ice Storm Warning benchmark: ≥0.25 inch ice accumulation.",
      "Winter Weather Advisory: impactful light snow, sleet, mixed precipitation, or light icing below warning criteria."
    ]
  },
  {
    group: "Fire weather",
    items: [
      "Mississippi red-flag conditions: relative humidity ≤25% AND wind ≥15 mph.",
      "Louisiana red-flag conditions: KBDI >700, relative humidity <25%, AND wind ≥25 mph.",
      "Louisiana Fire Weather Watch conditions: KBDI >700, relative humidity 25–30%, AND wind >20 mph.",
      "Fire Weather Watch/Red Flag decisions require dry fuels plus supportive weather and coordination with state/USFS fire managers and adjacent WFOs."
    ]
  },
  {
    group: "Tropical",
    items: [
      "Tropical Storm: sustained wind 34–63 kt (39–73 mph); watch generally within 48 hours, warning when expected within 36 hours.",
      "Hurricane: sustained wind ≥64 kt (74 mph); watch generally within 48 hours, warning when expected within 36 hours."
    ]
  }
];

const BASE_RESEARCH = `Research the current meteorological situation before drafting. Focus on the LIX CWA and nearby upstream regions that could affect southeast Louisiana and southern/coastal Mississippi.

Use the newest available official or primary meteorological information whenever possible, including:
- Surface observations, fronts, pressure patterns, and regional mesoanalysis
- Radar, satellite, lightning, and precipitation trends
- The latest KLIX sounding and relevant nearby observed soundings, including meaningful changes from prior observations
- SPC mesoanalysis and applicable convective outlooks
- WPC QPF and Excessive Rainfall Outlooks
- NHC information when applicable
- HRRR, RAP, HREF and available CAM/RRFS guidance
- Broader deterministic and ensemble guidance for the extended period
- NBM probabilities, percentiles, temperatures, dewpoints, PoPs, and heat-index guidance when useful
- Model soundings for KBTR, KMSY, and KMCB
- Relevant local aviation, marine, coastal, hydrologic, heat, fog, fire-weather, or winter-weather information

Clearly distinguish observed conditions, model forecasts, and meteorological inference. Do not invent or assume observations, model output, probabilities, hazards, headlines, or office coordination. Leave unverifiable details out or describe the uncertainty honestly.`;

const ANALYSIS_RULES = `Write the SHORT TERM and LONG TERM discussions chronologically. Within each time period, connect the evolving synoptic/mesoscale pattern directly to temperatures, PoPs, convection, hazards, and impacts. Do not split each weather element into a separate topic paragraph when a chronological narrative is clearer.

Focus on timing, location, meaningful spatial differences across the CWA, forecast confidence, reasonable alternative scenarios, reasons behind forecast changes, and supported impacts. Give extra attention when warranted to the New Orleans and Baton Rouge metro areas, coastal Louisiana, the Mississippi Gulf Coast, tidal lakes, and adjacent marine zones.

For convection and PoPs, explain meaningful changes in coverage and their causes rather than simply listing numbers. Assess heavy-rain efficiency and training/backbuilding potential when supported.

Integrate relevant model-sounding findings for KBTR, KMSY, and KMCB into the chronological narrative rather than creating a standalone sounding-data dump. Discuss only parameters with operational significance, such as PWAT and climatological context, CAPE/CIN, lapse rates, warm-cloud depth, moisture layers, wind profile/shear/steering flow, Corfidi vectors, DCAPE, inverted-V or dry-layer signals, capping/inversions, and saturation relevant to convection, fog, ceilings, heat, or severe weather.

When heat is relevant, assess temperatures, dewpoints, heat index, duration, overnight recovery, cloud/precipitation uncertainty, and NBM probabilities or percentiles. When strong storms are possible, explicitly examine dry slots, inverted-V profiles, DCAPE and damaging-downburst potential—not just tornado/hail parameters.

In AVIATION and MARINE, include only operationally relevant details and avoid repeating the public discussion unless needed for clarity.`;

const STYLE_RULES = `Use the tone and structure of an experienced LIX forecaster: meteorologically specific, concise but sufficiently detailed, appropriately cautious, operationally useful, readable, and logically organized. Avoid generic model-by-model summaries, excessive jargon, false precision, dramatic language, repetition, and lengthy discussion of disagreements that do not affect the forecast.

Do not mention research, sources, websites, prompts, AI, uploaded material, or the drafting process inside the AFD.`;

const hasDocument = typeof document !== "undefined";
const form = hasDocument ? document.querySelector("#afdForm") : null;
const outputSection = hasDocument ? document.querySelector("#outputSection") : null;
const output = hasDocument ? document.querySelector("#promptOutput") : null;
const saveStatus = hasDocument ? document.querySelector("#saveStatus") : null;
const alertStatus = hasDocument ? document.querySelector("#alertStatus") : null;
const activeAlerts = hasDocument ? document.querySelector("#activeAlerts") : null;
let liveAlerts = [];
let alertsLastChecked = null;
let alertsSucceeded = false;
let saveTimer;

function centralParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CENTRAL_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  });
  return Object.fromEntries(formatter.formatToParts(date).filter(part => part.type !== "literal").map(part => [part.type, part.value]));
}

function centralInputValue(date = new Date()) {
  const p = centralParts(date);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

function parseInputParts(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value || "");
  if (!match) return null;
  return { year: +match[1], month: +match[2], day: +match[3], hour: +match[4], minute: +match[5] };
}

function dateOnlyFromInput(value) {
  const p = parseInputParts(value);
  return p ? new Date(Date.UTC(p.year, p.month - 1, p.day, 12)) : new Date();
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function weekday(date) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long" }).format(date);
}

function periodLabel(start, end) {
  const first = weekday(start);
  const last = weekday(end);
  return first === last ? first : `${first} through ${last}`;
}

function formatIssuance(value) {
  const p = parseInputParts(value);
  if (!p) return value;
  const date = dateOnlyFromInput(value);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hourCycle: "h12", timeZone: "UTC" })
    .format(new Date(Date.UTC(2000, 0, 1, p.hour, p.minute)));
  // Noon UTC safely samples the target Central date's DST abbreviation outside transition hour ambiguity.
  const zoneName = new Intl.DateTimeFormat("en-US", { timeZone: CENTRAL_ZONE, timeZoneName: "short" })
    .formatToParts(new Date(Date.UTC(p.year, p.month - 1, p.day, 12)))
    .find(part => part.type === "timeZoneName")?.value || "CT";
  const dateText = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);
  return `${time} ${zoneName} ${dateText}`;
}

function fillPeriods() {
  const start = dateOnlyFromInput(document.querySelector("#issuanceTime").value);
  document.querySelector("#shortPeriod").value = periodLabel(start, addDays(start, 2));
  document.querySelector("#longPeriod").value = periodLabel(addDays(start, 3), addDays(start, 6));
  scheduleSave();
}

function checkedValues(name) {
  return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function renderCriteria() {
  document.querySelector("#criteriaList").innerHTML = HAZARD_CRITERIA.map((entry, index) => `
    <details class="criteria-group" ${index < 4 ? "open" : ""}>
      <summary>${escapeHtml(entry.group)}</summary>
      <ul>${entry.items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </details>
  `).join("");
}

function criteriaText() {
  return HAZARD_CRITERIA.map(entry => `### ${entry.group}\n${entry.items.map(item => `- ${item}`).join("\n")}`).join("\n\n");
}

function notesBlock(label, value) {
  const clean = value.trim();
  return clean ? `### ${label}\n${clean}` : "";
}

function liveAlertText() {
  if (!document.querySelector("#includeAlerts").checked) return "Live NWS alert snapshot intentionally omitted by the forecaster. Independently verify current LIX hazards.";
  if (!alertsSucceeded) return "The live NWS alert check did not complete. Independently verify all current LIX hazards before drafting.";
  if (!liveAlerts.length) return `No active LIX-issued alerts were returned by api.weather.gov at ${alertsLastChecked}. Independently verify before drafting.`;
  return `Snapshot checked ${alertsLastChecked}:\n${liveAlerts.map(alert => `- ${alert.event}: ${alert.areaDesc} (ends ${alert.ends})`).join("\n")}\nThis is only a snapshot; independently verify current status before drafting.`;
}

function generatePrompt(config) {
  const sections = config.sections || [];
  const focus = config.focus || [];
  const shortPeriod = (config.shortPeriod || "").trim() || "not specified";
  const longPeriod = (config.longPeriod || "").trim() || "not specified";
  const notes = config.notes || {};
  const noteSections = [
    notesBlock("Short-term concerns and guidance trends", notes.short || ""),
    notesBlock("Long-term concerns and guidance trends", notes.long || ""),
    notesBlock("Aviation", notes.aviation || ""),
    notesBlock("Marine and coastal", notes.marine || ""),
    notesBlock("Hazards, messaging, and coordination", notes.hazards || ""),
    notesBlock("Confidence, alternatives, and bust risks", notes.confidence || ""),
    notesBlock("Additional instructions", notes.extra || "")
  ].filter(Boolean).join("\n\n") || "No additional forecaster notes were entered.";

  return `# AFD INPUTS — WFO NEW ORLEANS/BATON ROUGE (LIX)

**Valid/issuance time:** ${formatIssuance(config.issuanceTime)}
**Short-term forecast period:** ${shortPeriod}
**Long-term forecast period:** ${longPeriod}
**Desired length:** ${config.desiredLength || "Normal"}
**Required AFD sections:** ${sections.length ? sections.join(", ") : "None selected—ask before drafting"}
**Forecaster-selected emphasis:** ${focus.length ? focus.join(", ") : "No special emphasis selected; determine priorities from current conditions"}

## FORECASTER NOTES

Treat these notes as the highest-priority input. Use external research to supplement, verify, and sanity-check them. Do not silently override them. Identify meaningful disagreements in the separate Forecaster Check.

${noteSections}

## CURRENT LIX HAZARD SNAPSHOT

${config.alertSnapshot || "Independently verify all current LIX hazards before drafting."}

---

# TASK

Write a conservative, operationally useful Area Forecast Discussion for WFO New Orleans/Baton Rouge (LIX), valid at the time above.

Draft only these selected sections, in this order when selected: SHORT TERM, LONG TERM, AVIATION, MARINE, HYDROLOGY, FIRE WEATHER. Use the forecast periods specified above. If a selected section is not meteorologically warranted as a separate section, keep it brief rather than inventing content.

## RESEARCH AND SOURCE PRIORITIES

${BASE_RESEARCH}

## FORECAST ANALYSIS REQUIREMENTS

${ANALYSIS_RULES}

## LIX HAZARD CRITERIA — SCREEN THE FORECAST AGAINST THESE

These criteria were checked against the official WFO LIX criteria page on September 6, 2026. Verify that they remain current. Explicitly call out conditions approaching a threshold when supported, even if a headline is not yet warranted. Do not recommend or imply a hazard without supporting forecast data, appropriate duration/coverage, and any required coordination.

${criteriaText()}

## WRITING STYLE

${STYLE_RULES}

## FORECASTER CHECK — NOT PART OF THE OFFICIAL PRODUCT

After the AFD, add a clearly separated **Forecaster Check**. Briefly identify:
- The most important forecast assumptions
- Information that could not be verified
- The two or three greatest forecast bust risks
- Items that should be manually checked in AWIPS before issuance
- Any meaningful disagreement between researched information and the forecaster notes
- Any condition close to a LIX hazard threshold and the supporting values, timing, area, duration, and uncertainty
`;
}

function buildPrompt() {
  return generatePrompt({
    issuanceTime: document.querySelector("#issuanceTime").value,
    shortPeriod: document.querySelector("#shortPeriod").value,
    longPeriod: document.querySelector("#longPeriod").value,
    desiredLength: document.querySelector("#desiredLength").value,
    sections: checkedValues("sections"),
    focus: checkedValues("focus"),
    notes: {
      short: document.querySelector("#shortNotes").value,
      long: document.querySelector("#longNotes").value,
      aviation: document.querySelector("#aviationNotes").value,
      marine: document.querySelector("#marineNotes").value,
      hazards: document.querySelector("#hazardNotes").value,
      confidence: document.querySelector("#confidenceNotes").value,
      extra: document.querySelector("#extraInstructions").value
    },
    alertSnapshot: liveAlertText()
  });
}

function serializeForm() {
  const data = {};
  for (const element of form.elements) {
    if (!element.name || ["button", "submit"].includes(element.type)) continue;
    if (element.type === "checkbox") {
      if (!data[element.name]) data[element.name] = [];
      if (element.checked) data[element.name].push(element.value || true);
    } else {
      data[element.name] = element.value;
    }
  }
  return data;
}

function restoreForm() {
  let data;
  try { data = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return false; }
  if (!data) return false;
  for (const [name, value] of Object.entries(data)) {
    const elements = [...form.querySelectorAll(`[name="${name}"]`)];
    for (const element of elements) {
      if (element.type === "checkbox") element.checked = Array.isArray(value) && value.includes(element.value || true);
      else element.value = value;
    }
  }
  return true;
}

function saveForm() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeForm()));
  saveStatus.textContent = "Draft saved locally";
}

function scheduleSave() {
  saveStatus.textContent = "Saving…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveForm, 350);
}

function setSectionPreset(preset) {
  const map = {
    full: ["SHORT TERM", "LONG TERM", "AVIATION", "MARINE"],
    public: ["SHORT TERM", "LONG TERM"],
    short: ["SHORT TERM"],
    long: ["LONG TERM"]
  };
  form.querySelectorAll('input[name="sections"]').forEach(input => { input.checked = map[preset].includes(input.value); });
  document.querySelectorAll(".preset").forEach(button => button.classList.toggle("active", button.dataset.preset === preset));
  scheduleSave();
}

function resetForNewShift() {
  const keepLength = document.querySelector("#desiredLength").value;
  form.reset();
  document.querySelector("#desiredLength").value = keepLength;
  document.querySelector("#issuanceTime").value = centralInputValue();
  setSectionPreset("full");
  fillPeriods();
  outputSection.hidden = true;
  localStorage.removeItem(STORAGE_KEY);
  saveForm();
  fetchAlerts();
  document.querySelector("#shortNotes").focus();
}

function normalizeAlert(feature) {
  const p = feature.properties || {};
  const end = p.ends || p.expires;
  return {
    id: feature.id,
    event: p.event || "Weather alert",
    areaDesc: p.areaDesc || "Area not specified",
    ends: end ? new Intl.DateTimeFormat("en-US", { timeZone: CENTRAL_ZONE, month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(end)) : "unknown"
  };
}

async function fetchAlerts() {
  alertStatus.className = "alert-status";
  alertStatus.textContent = "Checking current alerts from api.weather.gov…";
  activeAlerts.innerHTML = "";
  document.querySelector("#refreshAlerts").disabled = true;
  try {
    const urls = ["LA", "MS"].map(area => `https://api.weather.gov/alerts/active?area=${area}`);
    urls.push("https://api.weather.gov/alerts/active?region=GM");
    const responses = await Promise.all(urls.map(url => fetch(url, { headers: { Accept: "application/geo+json" } })));
    if (responses.some(response => !response.ok)) throw new Error(`NWS API returned ${responses.find(response => !response.ok).status}`);
    const payloads = await Promise.all(responses.map(response => response.json()));
    const seen = new Set();
    liveAlerts = payloads.flatMap(payload => payload.features || [])
      .filter(feature => /NWS New Orleans LA/i.test(feature.properties?.senderName || ""))
      .filter(feature => !seen.has(feature.id) && seen.add(feature.id))
      .map(normalizeAlert);
    alertsSucceeded = true;
    alertsLastChecked = new Intl.DateTimeFormat("en-US", { timeZone: CENTRAL_ZONE, month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date());
    alertStatus.textContent = liveAlerts.length
      ? `${liveAlerts.length} active LIX-issued alert${liveAlerts.length === 1 ? "" : "s"} found. Checked ${alertsLastChecked}.`
      : `No active LIX-issued alerts found. Checked ${alertsLastChecked}.`;
    activeAlerts.innerHTML = liveAlerts.map(alert => `<div class="active-alert"><strong>${escapeHtml(alert.event)}</strong><span>${escapeHtml(alert.areaDesc)} · Ends ${escapeHtml(alert.ends)}</span></div>`).join("");
  } catch (error) {
    alertsSucceeded = false;
    liveAlerts = [];
    alertsLastChecked = null;
    alertStatus.className = "alert-status error";
    alertStatus.textContent = `Live alert check failed: ${error.message}. The generated prompt will require an independent check.`;
  } finally {
    document.querySelector("#refreshAlerts").disabled = false;
  }
}

if (hasDocument) {
  form.addEventListener("input", scheduleSave);
  form.addEventListener("change", scheduleSave);
  form.addEventListener("submit", event => {
  event.preventDefault();
  if (!checkedValues("sections").length) {
    alert("Select at least one AFD section.");
    document.querySelector("#sectionChoices").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  output.value = buildPrompt();
  outputSection.hidden = false;
  outputSection.scrollIntoView({ behavior: "smooth", block: "start" });
  saveForm();
  });

  document.querySelector("#setNow").addEventListener("click", () => {
  document.querySelector("#issuanceTime").value = centralInputValue();
  fillPeriods();
  });
  document.querySelector("#autoPeriods").addEventListener("click", fillPeriods);
  document.querySelector("#clearForm").addEventListener("click", () => {
  if (confirm("Start a new shift and clear all forecaster notes?")) resetForNewShift();
  });
  document.querySelector("#clearFocus").addEventListener("click", () => {
  form.querySelectorAll('input[name="focus"]').forEach(input => { input.checked = false; });
  scheduleSave();
  });
  document.querySelectorAll(".preset").forEach(button => button.addEventListener("click", () => setSectionPreset(button.dataset.preset)));
  document.querySelector("#refreshAlerts").addEventListener("click", fetchAlerts);
  document.querySelector("#copyPrompt").addEventListener("click", async () => {
  const status = document.querySelector("#copyStatus");
  try {
    await navigator.clipboard.writeText(output.value);
    status.textContent = "Copied. Paste it into ChatGPT and let it rip.";
  } catch {
    output.select();
    document.execCommand("copy");
    status.textContent = "Copied.";
  }
  });
  document.querySelector("#downloadPrompt").addEventListener("click", () => {
  const blob = new Blob([output.value], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `LIX_AFD_prompt_${document.querySelector("#issuanceTime").value.replace(/[:T]/g, "-")}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
  });

  renderCriteria();
  if (!restoreForm()) {
    document.querySelector("#issuanceTime").value = centralInputValue();
    fillPeriods();
  } else {
    // A new visit should know the current time; notes and choices remain recovered.
    document.querySelector("#issuanceTime").value = centralInputValue();
    fillPeriods();
  }
  fetchAlerts();
}

// Expose pure helpers for lightweight automated tests without affecting the page.
if (typeof module !== "undefined") module.exports = { HAZARD_CRITERIA, centralInputValue, periodLabel, formatIssuance, generatePrompt };
