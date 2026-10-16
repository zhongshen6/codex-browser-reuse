const fs = require("node:fs");
const path = require("node:path");

// Browser smoke fixtures live outside git and never touch user documents.
const directory = path.resolve(__dirname, "../logs/preview-fixtures");
fs.mkdirSync(directory, { recursive: true });
const write = (name, bytes) => fs.writeFileSync(path.join(directory, name), bytes);
write("sample.csv", "Name,Quantity,Cost\nApple,3,12\nPear,2,8\n");
write("sample.tsv", "Name\tQuantity\tCost\nApple\t3\t12\nPear\t2\t8\n");
write("sample.md", "# Preview Test\n\n**Formatted text** and a list.\n\n- One\n- Two\n");
write("sample.c", "#include <stdio.h>\n\nint main(void) {\n  puts(\"Preview Test\");\n  return 0;\n}\n");
write("sample.ipynb", JSON.stringify({
  nbformat: 4, nbformat_minor: 5,
  metadata: { kernelspec: { display_name: "Python 3", language: "python", name: "python3" } },
  cells: [
    { id: "title", cell_type: "markdown", metadata: {}, source: ["# Notebook Preview Test\n"] },
    { id: "code", cell_type: "code", metadata: {}, execution_count: 1,
      source: ["print(2 + 3)\n"],
      outputs: [{ name: "stdout", output_type: "stream", text: ["5\n"] }] },
  ],
}));
write("sample.svg", '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#2c8454"/><text x="10" y="55" fill="white">Preview Test</text></svg>');
write("sample.html", '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Preview Test</title></head><body><h1>HTML Preview Test</h1><p>Local fixture</p></body></html>');
write("sample.tex", "\\documentclass{article}\n\\begin{document}\nLaTeX Preview Test\n\\end{document}\n");

// Build a valid one-page PDF with byte-accurate xref offsets, no converter needed.
const content = "BT /F1 24 Tf 50 740 Td (PDF Preview Test) Tj ET";
const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
];
let pdf = "%PDF-1.4\n";
const offsets = [0];
objects.forEach((object, index) => {
  offsets.push(Buffer.byteLength(pdf));
  pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
});
const start = Buffer.byteLength(pdf);
pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
pdf += offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
pdf += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
write("sample.pdf", pdf);
console.log(directory);
