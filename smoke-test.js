const { generatePrompt, formatIssuance, periodLabel } = require("./app.js");

const start = new Date(Date.UTC(2026, 8, 6, 12));
const prompt = generatePrompt({
  issuanceTime: "2026-09-06T00:00",
  shortPeriod: "Sunday through Tuesday",
  longPeriod: "Wednesday through Saturday",
  desiredLength: "Normal to detailed",
  sections: ["SHORT TERM", "LONG TERM", "AVIATION", "MARINE"],
  focus: ["Severe and downbursts"],
  notes: { short: "Weakness aloft shifts west Monday; verify CAM coverage and downburst signal." },
  alertSnapshot: "No active LIX-issued alerts returned in test snapshot."
});

const checks = {
    issuance: formatIssuance("2026-09-06T00:00"),
    periodHelper: periodLabel(start, new Date(Date.UTC(2026, 8, 8, 12))),
    includesNotes: prompt.includes("Weakness aloft shifts west Monday"),
    includesSections: prompt.includes("SHORT TERM, LONG TERM, AVIATION, MARINE"),
    includesHeat: prompt.includes("heat index ≥108°F"),
    includesFire: prompt.includes("KBDI >700"),
    includesForecasterCheck: prompt.includes("FORECASTER CHECK"),
    includesAlertSnapshot: prompt.includes("No active LIX-issued alerts returned"),
    promptLength: prompt.length
};

console.log(JSON.stringify(checks, null, 2));
if (Object.values(checks).some(value => value === false)) process.exitCode = 1;
