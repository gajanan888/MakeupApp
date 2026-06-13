import fs from "fs";
import os from "os";
import path from "path";

function buildPdf() {
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << >> >>\nendobj\n",
    "4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 72 120 Td (Test PDF) Tj ET\nendstream\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = ["0000000000 65535 f \n"];

  for (const obj of objects) {
    offsets.push(`${String(pdf.length).padStart(10, "0")} 00000 n \n`);
    pdf += obj;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += offsets.join("");
  pdf += "trailer\n<< /Root 1 0 R /Size 5 >>\n";
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

async function run() {
  const tempPath = path.join(
    os.tmpdir(),
    `artist-certificate-${Date.now()}.pdf`,
  );
  const pdfBuffer = buildPdf();
  fs.writeFileSync(tempPath, pdfBuffer);

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([fs.readFileSync(tempPath)], { type: "application/pdf" }),
    "certificate.pdf",
  );

  const res = await fetch("http://127.0.0.1:5000/api/upload", {
    method: "POST",
    body: formData,
  });

  console.log("status", res.status);
  console.log(await res.text());

  try {
    fs.unlinkSync(tempPath);
  } catch {
    // ignore cleanup failures
  }
}

run().catch((error) => {
  console.error("Certificate upload test failed:", error);
  process.exit(1);
});
