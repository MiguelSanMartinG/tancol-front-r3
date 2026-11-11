import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/luisa/OneDrive/Escritorio/clientes.xlsx";
const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table,definedName,drawing",
  maxChars: 12000,
  tableMaxRows: 8,
  tableMaxCols: 20,
  tableMaxCellChars: 120,
});
console.log("SUMMARY\n" + summary.ndjson);

const sheets = await workbook.inspect({ kind: "sheet", include: "id,name", maxChars: 4000 });
console.log("SHEETS\n" + sheets.ndjson);

for (const item of workbook.worksheets.items) {
  const used = item.getUsedRange();
  console.log(`USED ${item.name} ${used?.address ?? "none"}`);
  if (used) {
    const region = await workbook.inspect({
      kind: "region",
      sheetId: item.name,
      range: used.address,
      maxChars: 30000,
      tableMaxRows: 25,
      tableMaxCols: 30,
      tableMaxCellChars: 160,
    });
    console.log(`REGION ${item.name}\n` + region.ndjson);
    const formulas = await workbook.inspect({
      kind: "formula",
      sheetId: item.name,
      range: used.address,
      maxChars: 8000,
      options: { maxResults: 100 },
    });
    console.log(`FORMULAS ${item.name}\n` + formulas.ndjson);
  }
}

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NULL!|#NUM!",
  options: { useRegex: true, maxResults: 300 },
  summary: "formula error scan",
  maxChars: 10000,
});
console.log("ERRORS\n" + errors.ndjson);
