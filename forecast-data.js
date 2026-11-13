"use strict";
(function(root) {
  // Each figure is a native NWS valid-time gridpoint sample, not a daily or CWA-wide forecast.
  const CENTRAL = "America/Chicago";
  const POINTS = [
    ["Baton Rouge",30.4515,-91.1871],["New Orleans",29.9511,-90.0715],
    ["Hammond",30.5044,-90.4612],["McComb",31.2438,-90.4532],
    ["Slidell",30.2752,-89.7812],["Gulfport",30.3674,-89.0928],
    ["Houma",29.5958,-90.7195],["Thibodaux",29.7958,-90.8229],
    ["Bogalusa",30.7910,-89.8487],["Picayune",30.5255,-89.6795],
    ["Waveland",30.2869,-89.3762],["Grand Isle",29.2366,-89.9873]
  ].map(p => ({name:p[0],lat:p[1],lon:p[2]}));
  const FIELDS = [
    ["probabilityOfPrecipitation","PoP","%"],["temperature","Temp","°F"],
    ["dewpoint","Dewpoint","°F"],["relativeHumidity","RH","%"],
    ["windSpeed","Wind","mph"],["windGust","Gust","mph"]
  ];
  const DAY_FORMAT = new Intl.DateTimeFormat("en-US", {
    timeZone:CENTRAL,year:"numeric",month:"2-digit",day:"2-digit"
  });
  function centralDay(ms) {
    const parts=Object.fromEntries(DAY_FORMAT.formatToParts(new Date(ms))
      .filter(p => ["year","month","day"].includes(p.type)).map(p => [p.type,p.value]));
    return parts.year+"-"+parts.month+"-"+parts.day;
  }
  function selectedDays(local,count=7) {
    const m=String(local||"").match(/^(\d{4})-(\d{2})-(\d{2})T/);
    if(!m) return [];
    const base=Date.UTC(+m[1],+m[2]-1,+m[3]);
    return Array.from({length:count},(_,i)=>new Date(base+i*86400000).toISOString().slice(0,10));
  }
  function parseValidTime(value) {
    const parts=String(value||"").split("/");
    const start=Date.parse(parts[0]);
    const m=/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(parts[1]||"");
    if(!Number.isFinite(start)||!m) return null;
    const ms=((+(m[1]||0)*24+ +(m[2]||0))*60+ +(m[3]||0))*60000+ +(m[4]||0)*1000;
    return ms>0?[start,start+ms]:null;
  }
  function daysOverlapping(interval,days) {
    const found=new Set();
    if(!interval) return found;
    const allowed=new Set(days);
    const add=ms=>{const d=centralDay(ms);if(allowed.has(d))found.add(d);};
    add(interval[0]);add(interval[1]-1);
    for(let t=Math.ceil(interval[0]/3600000)*3600000;t<interval[1];t+=3600000)add(t);
    return found;
  }
  function convert(v,uom,field) {
    if(typeof v!=="number"||!Number.isFinite(v))return null;
    const u=String(uom||"");
    if(field==="PoP"||field==="RH")return /percent|%/i.test(u)?v:null;
    if(field==="Temp"||field==="Dewpoint"){
      if(/degC|celsius/i.test(u))return v*9/5+32;
      if(/degF|fahrenheit/i.test(u))return v;
      return null;
    }
    if(field==="Wind"||field==="Gust"){
      if(/km_h|km\/h/i.test(u))return v*.621371;
      if(/m_s-1|m\/s/i.test(u))return v*2.236936;
      if(/(?:^|:)(?:kn|knot|knots)$/i.test(u))return v*1.150779;
      if(/mi_h|mph/i.test(u))return v;
    }
    return null;
  }
  function summarizeGrid(p,days) {
    const byDay=Object.fromEntries(days.map(d=>[d,{}]));
    const unavailable=[];
    for(const [key,id] of FIELDS){
      const series=p&&p[key];
      if(!series||!Array.isArray(series.values)){unavailable.push(id+": missing layer");continue;}
      let accepted=0;
      for(const entry of series.values){
        const value=convert(entry.value,series.uom,id);
        if(value===null)continue;
        for(const d of daysOverlapping(parseValidTime(entry.validTime),days)){
          const old=byDay[d][id];
          byDay[d][id]=old?[Math.min(old[0],value),Math.max(old[1],value)]:[value,value];
          accepted++;
        }
      }
      if(!accepted)unavailable.push(id+": no usable values or unrecognized units");
    }
    return {days:byDay,unavailable};
  }
  function rangeText(pair,field) {
    if(!pair)return "missing";
    const spec=FIELDS.find(x=>x[1]===field);
    if(!spec)return "missing";
    const a=Math.round(pair[0]),b=Math.round(pair[1]);
    return String(a)+(a===b?"":"–"+b)+spec[2];
  }
  async function fetchNwsSamples(fetcher,issuance,onProgress) {
    const days=selectedDays(issuance);
    if(!days.length)throw new Error("Select a valid issuance date before loading.");
    const result={retrievedAt:new Date().toISOString(),desiredDays:days,locations:[],failures:[]};
    let next=0,completed=0;
    async function get(url){
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
      try{
        const response=await fetcher(url,{signal:controller.signal,headers:{Accept:"application/geo+json"}});
        if(!response.ok)throw new Error("HTTP "+response.status);
        return await response.json();
      }finally{clearTimeout(timer);}
    }
    async function worker(){
      while(next<POINTS.length){
        const point=POINTS[next++];
        try{
          const metadata=(await get("https://api.weather.gov/points/"+point.lat+","+point.lon)).properties||{};
          if(metadata.gridId!=="LIX")throw new Error("mapped to "+(metadata.gridId||"unknown")+" instead of LIX");
          const url=metadata.forecastGridData;
          if(!/^https:\/\/api\.weather\.gov\/gridpoints\/LIX\/\d+,\d+\/?$/.test(url||""))throw new Error("invalid LIX raw-grid URL");
          const data=(await get(url)).properties||{};
          const summary=summarizeGrid(data,days);
          result.locations.push(Object.assign({},point,{url,updatedAt:data.updateTime||null,days:summary.days,unavailable:summary.unavailable}));
        }catch(e){result.failures.push(point.name+": "+(e instanceof Error?e.message:String(e)));}
        completed++;
        if(onProgress)onProgress(completed,POINTS.length);
      }
    }
    await Promise.all(Array.from({length:4},()=>worker()));
    result.locations.sort((a,b)=>POINTS.findIndex(p=>p.name===a.name)-POINTS.findIndex(p=>p.name===b.name));
    return result;
  }
  function parseOverrides(text){
    const rows=[],errors=[];
    String(text||"").split(/\r?\n/).forEach((line,index)=>{
      if(!line.trim())return;
      const c=line.split("|").map(s=>s.trim());
      const field=({pop:"PoP",temp:"Temp",temperature:"Temp",dewpoint:"Dewpoint",
        rh:"RH",humidity:"RH",wind:"Wind",gust:"Gust"})[(c[1]||"").toLowerCase()];
      const a=Number(c[2]),b=Number(c[3]);
      const date=/^\d{4}-\d{2}-\d{2}$/.test(c[0]||"")&&
        !Number.isNaN(Date.parse(c[0]+"T12:00:00Z"))&&
        new Date(c[0]+"T12:00:00Z").toISOString().slice(0,10)===c[0];
      if(c.length!==5||!date||!field||!c[2]||!c[3]||!Number.isFinite(a)||!Number.isFinite(b)||
        a>b||!c[4]||(["PoP","RH"].includes(field)&&(a<0||b>100))){
        errors.push("Line "+(index+1)+": use YYYY-MM-DD | PoP/Temp/Dewpoint/RH/Wind/Gust | min | max | area");
      }else rows.push({date:c[0],field,min:a,max:b,area:c[4]});
    });
    return {rows,errors};
  }
  function manualText(rows){
    if(!rows.length)return "No structured forecaster AWIPS overrides supplied.";
    return rows.map(r=>{
      const unit=FIELDS.find(x=>x[1]===r.field)[2];
      return "- "+r.date+": "+r.field+" "+r.min+"–"+r.max+unit+" ("+r.area+"); SOURCE: forecaster AWIPS/GFE value.";
    }).join("\n");
  }
  function snapshotText(snapshot){
    if(!snapshot||!snapshot.locations||!snapshot.locations.length)
      return "NO VERIFIED PUBLIC GRID VALUES AVAILABLE. Never invent numbers. Use qualitative wording and disclose unverified values.";
    const timestamps=snapshot.locations.map(x=>Date.parse(x.updatedAt)).filter(Number.isFinite);
    const stamp=(arr,fn)=>arr.length?new Date(fn(...arr)).toISOString():"UNKNOWN";
    const lines=[
      "Public NWS raw-grid samples: retrieved "+snapshot.retrievedAt+"; "+snapshot.locations.length+"/"+POINTS.length+" locations; "+snapshot.failures.length+" failed.",
      "Grid updateTime oldest "+stamp(timestamps,Math.min)+"; newest "+stamp(timestamps,Math.max)+". Published data may lag AWIPS edits.",
      "IMPORTANT: These are native valid-time gridpoint samples on each LOCAL calendar day; NOT a daily PoP or true CWA-wide extrema. Never average, sum, interpolate, or extrapolate PoPs.",
      "Units: PoP/RH %, Temp/Dewpoint °F, Wind/Gust mph. Missing or unsupported values omitted, NOT zero."
    ];
    for(const d of snapshot.desiredDays){
      lines.push("\n"+d+" (America/Chicago):");
      for(const p of snapshot.locations){
        const values=p.days[d]||{};
        const available=FIELDS.filter(f=>values[f[1]]).map(f=>f[1]+" "+rangeText(values[f[1]],f[1]));
        if(available.length)lines.push("- "+p.name+": "+available.join("; "));
      }
    }
    lines.push("\nSAMPLE SOURCES AND UPDATE TIMES:");
    for(const p of snapshot.locations)lines.push("- "+p.name+": "+p.url+"; updateTime="+(p.updatedAt||"UNKNOWN")+"; excluded: "+(p.unavailable.join(", ")||"none"));
    if(snapshot.failures.length)lines.push("\nFAILED SAMPLES:\n"+snapshot.failures.map(x=>"- "+x).join("\n"));
    return lines.join("\n");
  }
  function auditDraft(draft,manualRows){
    const plain=String(draft||"").split(/FORECASTER CHECK/i)[0];
    const sentences=plain.split(/(?<=[.!?])\s+|\n+/).filter(Boolean);
    const dates=[...new Set((manualRows||[]).map(r=>r.date))];
    const weekday=d=>new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{weekday:"long",timeZone:"UTC"});
    const findings=[];
    for(const sentence of sentences){
      if(!/\b(pop|pops|rain chances|precipitation chances|chance of rain|chance of precipitation)\b/i.test(sentence))continue;
      const re=/\b(\d{1,3})\s*(?:-|–|—|to)\s*(\d{1,3})\s*(?:%|percent\b)/gi;
      let m;
      while((m=re.exec(sentence))){
        const day=dates.find(d=>new RegExp("\\b"+weekday(d)+"\\b","i").test(sentence));
        const options=(manualRows||[]).filter(r=>r.date===day&&r.field==="PoP");
        const exact=options.some(r=>r.min===+m[1]&&r.max===+m[2]);
        findings.push({
          level:options.length?(exact?"matched":"conflict"):"review",
          claim:m[0],sentence:sentence.trim().slice(0,240),
          explanation:!options.length?"No dated manual AWIPS PoP reference; verify claim.":
            exact?"Matches forecaster AWIPS range on "+day+".":
              "Conflicts with "+day+" AWIPS PoPs: "+options.map(r=>r.min+"–"+r.max+"% ("+r.area+")").join(", ")
        });
      }
    }
    return findings.length?findings:[{level:"review",claim:"No explicit PoP ranges identified",sentence:"",
      explanation:"Audit checks explicit PoP ranges only. It cannot certify every numeric or spatial claim."}];
  }
  const api={CENTRAL,POINTS,FIELDS,centralDay,selectedDays,parseValidTime,daysOverlapping,
    convert,summarizeGrid,rangeText,fetchNwsSamples,parseOverrides,manualText,snapshotText,auditDraft};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.ForecastData=api;
})(typeof globalThis!=="undefined"?globalThis:this);
