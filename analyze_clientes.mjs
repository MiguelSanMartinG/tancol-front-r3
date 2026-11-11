import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const wb = await SpreadsheetFile.importXlsx(await FileBlob.load("C:/Users/luisa/OneDrive/Escritorio/clientes.xlsx"));
const ws = wb.worksheets.getItem("Datos");
const values = ws.getRange("A1:M1548").values;
const headers = values[0].map(v => String(v ?? ""));
const rows = values.slice(1);
const norm = v => String(v ?? "").trim().toUpperCase();
const isBlank = v => v === null || v === undefined || String(v).trim() === "";
const report = { headers, rows: rows.length, columns: {} };

for (let c = 0; c < headers.length; c++) {
  const vals = rows.map(r => r[c]);
  const nonblank = vals.filter(v => !isBlank(v));
  const types = [...new Set(nonblank.map(v => v instanceof Date ? "Date" : typeof v))];
  const counts = new Map();
  for (const v of nonblank) counts.set(norm(v), (counts.get(norm(v)) ?? 0) + 1);
  const repeated = [...counts.entries()].filter(([,n]) => n > 1).sort((a,b) => b[1]-a[1]).slice(0,10);
  report.columns[headers[c]] = { nonblank: nonblank.length, blank: vals.length-nonblank.length, types, repeated };
}

function rowsWhere(fn) {
  return rows.map((r,i) => fn(r) ? { row: i+2, values: r } : null).filter(Boolean);
}

report.issues = {
  blank_required: rowsWhere(r => [0,1,2,3,4,5,7,8,9,10].some(c => isBlank(r[c]))).slice(0,100),
  invalid_email: rowsWhere(r => !isBlank(r[6]) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(r[6]).trim())).slice(0,100),
  phone_not_10_digits: rowsWhere(r => !isBlank(r[7]) && !/^\d{10}$/.test(String(r[7]).replace(/\D/g,""))).slice(0,100),
  phone_non_numeric: rowsWhere(r => !isBlank(r[7]) && !/^\d+$/.test(String(r[7]).trim())).slice(0,100),
  postal_not_5_digits: rowsWhere(r => !isBlank(r[10]) && !/^\d{5}$/.test(String(r[10]).trim())).slice(0,100),
  rfc_suspicious: rowsWhere(r => !isBlank(r[9]) && !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(String(r[9]).trim().toUpperCase())).slice(0,100),
  credit_days_non_integer_or_negative: rowsWhere(r => !isBlank(r[5]) && (!Number.isInteger(Number(r[5])) || Number(r[5]) < 0)).slice(0,100),
  invalid_payment: rowsWhere(r => !isBlank(r[4]) && !["CONTADO","CREDITO","CRÉDITO"].includes(norm(r[4]))).slice(0,100),
  formula_like_text: rowsWhere(r => r.some(v => typeof v === "string" && /^=/.test(v))).slice(0,100),
};

for (const c of [0,6,7,9,10]) {
  const map = new Map();
  rows.forEach((r,i) => { if (!isBlank(r[c])) { const k = norm(r[c]); if (!map.has(k)) map.set(k,[]); map.get(k).push(i+2); } });
  report[`duplicates_${headers[c]}`] = [...map.entries()].filter(([,rs]) => rs.length>1).slice(0,100).map(([value,rs])=>({value,rows:rs}));
}

console.log(JSON.stringify(report, (k,v)=>v instanceof Date ? v.toISOString() : v, 2));
