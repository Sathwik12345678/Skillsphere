const fs = require("fs");
const path = require("path");

const sourcePath = path.join(__dirname, "SkillSphere_Project_Demo_Guide.md");
const outputPath = path.join(__dirname, "SkillSphere_Project_Demo_Guide.pdf");

const markdown = fs.readFileSync(sourcePath, "utf8");

const pageWidth = 612;
const pageHeight = 792;
const marginX = 54;
const topY = 738;
const bottomY = 54;
const maxChars = 88;

const escapePdf = (value) =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");

const wrap = (text, limit) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    if (!line) {
      line = word;
      continue;
    }

    if (`${line} ${word}`.length > limit) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [""];
};

const pages = [];
let current = [];
let y = topY;

const newPage = () => {
  pages.push(current);
  current = [];
  y = topY;
};

const addLine = (text, size = 10.5, indent = 0, gap = 14) => {
  if (y < bottomY) newPage();
  current.push({ text, size, x: marginX + indent, y });
  y -= gap;
};

const addParagraph = (text, size = 10.5, indent = 0, gap = 14) => {
  const limit = Math.max(36, maxChars - Math.round(indent / 5) - Math.round((size - 10) * 4));
  for (const line of wrap(text, limit)) {
    addLine(line, size, indent, gap);
  }
};

for (const rawLine of markdown.split(/\r?\n/)) {
  const line = rawLine.trim();

  if (!line) {
    y -= 7;
    if (y < bottomY) newPage();
    continue;
  }

  if (line.startsWith("# ")) {
    y -= 8;
    addParagraph(line.replace(/^#\s+/, ""), 20, 0, 24);
    y -= 8;
  } else if (line.startsWith("## ")) {
    y -= 7;
    addParagraph(line.replace(/^##\s+/, ""), 15, 0, 19);
    y -= 4;
  } else if (line.startsWith("### ")) {
    y -= 5;
    addParagraph(line.replace(/^###\s+/, ""), 12.5, 0, 16);
  } else if (line.startsWith("- ")) {
    addParagraph(`- ${line.slice(2)}`, 10.5, 14, 14);
  } else if (/^\d+\.\s/.test(line)) {
    addParagraph(line, 10.5, 14, 14);
  } else {
    addParagraph(line, 10.5, 0, 14);
  }
}

if (current.length) pages.push(current);

const objects = [];
const addObject = (body) => {
  objects.push(body);
  return objects.length;
};

const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
const pagesId = addObject("");
const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
const pageIds = [];

for (const pageLines of pages) {
  const content = pageLines
    .map(
      (item) =>
        `BT /F1 ${item.size} Tf 1 0 0 1 ${item.x} ${item.y} Tm (${escapePdf(item.text)}) Tj ET`
    )
    .join("\n");
  const contentId = addObject(`<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`);
  const pageId = addObject(
    `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`
  );
  pageIds.push(pageId);
}

objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

let pdf = "%PDF-1.4\n";
const offsets = [0];

objects.forEach((body, index) => {
  offsets.push(Buffer.byteLength(pdf, "utf8"));
  pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
});

const xrefOffset = Buffer.byteLength(pdf, "utf8");
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += "0000000000 65535 f \n";
for (let i = 1; i < offsets.length; i += 1) {
  pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

fs.writeFileSync(outputPath, pdf);
console.log(`Generated ${outputPath}`);
