import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load("C:/Users/luisa/OneDrive/Escritorio/clientes.xlsx"));
const rows = wb.worksheets.getItem("Datos").getRange("A1:M1548").values;
const h = rows[0]; const data = rows.slice(1);
const blank = v => v == null || String(v).trim() === "";
const norm = v => String(v ?? "").trim().toUpperCase();
const sample = (xs, n=8) => xs.slice(0,n).map(i=>i+2);
const ranges = (xs) => { const a=[...xs].sort((x,y)=>x-y).map(x=>x+2); const out=[]; for (const r of a) { const last=out[out.length-1]; if(last && r===last[1]+1) last[1]=r; else out.push([r,r]); } return out.map(([a,b])=>a===b?String(a):`${a}-${b}`); };
const validDateText = v => { const m=String(v??"").match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/); if(!m)return false; const d=new Date(`${m[3]}-${m[2]}-${m[1]}T${m[4]||"00"}:${m[5]||"00"}:${m[6]||"00"}`); return !Number.isNaN(d.getTime()); };
const issue = {};
for (let c=0;c<h.length;c++) issue[h[c]]={blank:data.filter(r=>blank(r[c])).length, sampleBlank:sample(data.map((r,i)=>blank(r[c])?i:null).filter(i=>i!==null))};
const checks = {
  invalidDate: data.map((r,i)=>!validDateText(r[8])?i:null).filter(i=>i!==null),
  creditBlank: data.map((r,i)=>blank(r[5])?i:null).filter(i=>i!==null),
  badEmail: data.map((r,i)=>String(r[6]??"").trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(r[6]).trim())?i:null).filter(i=>i!==null),
  badPhone10: data.map((r,i)=>!/^\d{10}$/.test(String(r[7]??"").trim())?i:null).filter(i=>i!==null),
  badRfc: data.map((r,i)=>!blank(r[9]) && !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(norm(r[9]))?i:null).filter(i=>i!==null),
  badPostal: data.map((r,i)=>!/^\d{5}$/.test(String(r[10]??"").trim())?i:null).filter(i=>i!==null),
};
const sentinel = {};
for (let c=0;c<h.length;c++) { const ix=data.map((r,i)=>norm(r[c])==="1643"?i:null).filter(i=>i!==null); if(ix.length) sentinel[h[c]]={count:ix.length,ranges:ranges(ix)}; }
const dup = {}; for (const c of [0,1,9]) { const m=new Map(); data.forEach((r,i)=>{const k=norm(r[c]); if(k){if(!m.has(k))m.set(k,[]);m.get(k).push(i+2)}}); dup[h[c]]=[...m.entries()].filter(([,v])=>v.length>1).slice(0,10).map(([value,rows])=>({value,rows})); }
console.log(JSON.stringify({sheet:"Datos",dataRows:data.length,headers:h,issue,checks:Object.fromEntries(Object.entries(checks).map(([k,v])=>[k,{count:v.length,sampleRows:sample(v),ranges:ranges(v)}])),sentinel,duplicates:dup},null,2));
