"use strict";
const { generatePrompt, formatIssuance, periodLabel } = require("./app.js");
const grid = require("./forecast-data.js");
function check(ok, message) { if (!ok) throw new Error("TEST FAILED: " + message); }

async function runTests() {
  const rows = grid.parseOverrides("2026-11-16 | PoP | 30 | 60 | LIX CWA");
  check(rows.rows.length === 1 && rows.errors.length === 0, "parse structured AWIPS 30–60");
  check(grid.parseOverrides("Monday | PoP | 30 | 60 | CWA").errors.length === 1, "reject ambiguous AWIPS dates");
  check(grid.parseOverrides("2026-11-16 | PoP | 65 | 30 | CWA").errors.length === 1, "reject descending range");
  check(grid.selectedDays("2026-11-13T02:00")[3] === "2026-11-16", "selected local forecast days");
  check(grid.centralDay(Date.parse("2026-11-13T05:30:00Z")) === "2026-11-12", "CST date before midnight");
  check(grid.centralDay(Date.parse("2026-11-13T06:30:00Z")) === "2026-11-13", "CST date after midnight");
  check(grid.convert(null, "wmoUnit:percent", "PoP") === null, "missing PoP remains null");
  check(grid.convert(20, "wmoUnit:degC", "Temp") === 68, "unit conversion");
  check(grid.convert(20, "unknown", "Wind") === null, "unknown unit omitted");
  check(grid.auditDraft("Monday PoPs 20 to 40 percent.", rows.rows)[0].level === "conflict", "catch unsupported 20–40");
  check(grid.auditDraft("Monday PoPs 30 to 60 percent.", rows.rows)[0].level === "matched", "accept entered 30–60");
  check(grid.auditDraft("Monday PoPs 20–40%.", rows.rows)[0].level === "conflict", "catch symbol range");
  check(grid.auditDraft("Monday PoPs 20–40%.", [])[0].level === "review", "flag unverified figures");
  const otherRows = grid.parseOverrides("2026-11-16 | Wind | 15 | 20 | LIX CWA\n2026-11-16 | RH | 20 | 25 | LIX CWA").rows;
  const other = grid.auditOtherNumerics("Monday winds 25 to 30 mph and humidity 20–25%.", otherRows);
  check(other.some(x => x.level === "conflict" && x.claim.includes("25 to 30")), "flag wind mismatch");
  check(other.some(x => x.level === "matched" && x.claim.includes("20–25")), "find RH match");
  check(grid.snapshotText(null).includes("NO VERIFIED"), "grid unavailable is not fabricated");

  const mockGrid = {
    properties: {
      updateTime: "2026-11-13T05:00:00+00:00",
      probabilityOfPrecipitation: { uom: "wmoUnit:percent", values: [
        { validTime: "2026-11-16T12:00:00+00:00/PT6H", value: 30 },
        { validTime: "2026-11-16T18:00:00+00:00/PT6H", value: 60 },
        { validTime: "2026-11-17T00:00:00+00:00/PT6H", value: null }
      ] },
      temperature: { uom: "wmoUnit:degC", values: [
        { validTime: "2026-11-16T12:00:00+00:00/PT6H", value: 20 }
      ] }
    }
  };
  const mockFetch = async url => {
    if (url.includes("/points/")) {
      if (url.includes("31.2438")) return { ok: false, status: 503 };
      return { ok: true, json: async () => ({ properties: {
        gridId: "LIX", forecastGridData: "https://api.weather.gov/gridpoints/LIX/12,34"
      } }) };
    }
    return { ok: true, json: async () => mockGrid };
  };
  const snapshot = await grid.fetchNwsSamples(mockFetch, "2026-11-13T02:00");
  check(snapshot.locations.length === 11 && snapshot.failures.length === 1, "partial API failure is surfaced");
  check(snapshot.locations[0].days["2026-11-16"].PoP[0] === 30, "actual first grid PoP");
  check(snapshot.locations[0].days["2026-11-16"].PoP[1] === 60, "actual second grid PoP");
  check(!snapshot.locations[0].days["2026-11-17"].PoP, "null PoP not coerced to zero");
  check(grid.snapshotText(snapshot).includes("FAILED SAMPLES"), "failure evidence included");
  check(grid.snapshotText(snapshot).includes("NOT a daily PoP"), "sample caveat included");

  const prompt = generatePrompt({
    issuanceTime: "2026-11-13T02:00", shortPeriod: "Friday through Sunday",
    longPeriod: "Monday through Thursday", desiredLength: "Normal to detailed",
    sections: ["SHORT TERM", "LONG TERM", "AVIATION", "MARINE"],
    focus: ["Convection and PoPs"], notes: {long:"Gulf low brings Monday rain."},
    awipsText: grid.manualText(rows.rows), gridSnapshotText: grid.snapshotText(snapshot),
    alertSnapshot: "No active LIX-issued alerts returned in test snapshot."
  });
  check(prompt.includes("MANDATORY NUMERICAL DATA GATE"), "strict numeric policy");
  check(prompt.includes("2026-11-16: PoP 30–60%"), "AWIPS values in prompt");
  check(prompt.indexOf("FORECASTER AWIPS/GFE VALUES") < prompt.indexOf("PUBLIC NWS RAW-GRID"), "AWIPS priority placement");
  check(prompt.includes("Baton Rouge") && prompt.includes("updateTime="), "grid point sources and times included");
  check(prompt.includes("heat index ≥108°F") && prompt.includes("KBDI >700"), "hazard criteria preserved");
  check(prompt.includes("FORECASTER CHECK") && prompt.includes("Friday through Sunday"), "AFD structure retained");
  check(formatIssuance("2026-11-13T02:00").includes("November 13"), "issuance helper");
  check(periodLabel(new Date(Date.UTC(2026,10,13,12)),new Date(Date.UTC(2026,10,15,12))).includes("Sunday"), "period helper");
  console.log("PASS: source grid, local times, AWIPS priority, numeric prompt, failed API, audit and hazard smoke tests.");
  return true;
}

if (require.main === module) runTests().catch(e => { console.error(e); process.exitCode = 1; });
module.exports = { runTests };
