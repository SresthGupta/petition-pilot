import Papa from "papaparse";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Extend jsPDF type for autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: {
      head?: string[][];
      body?: string[][];
      startY?: number;
      theme?: string;
      headStyles?: Record<string, unknown>;
      styles?: Record<string, unknown>;
      columnStyles?: Record<string, unknown>;
      margin?: { top?: number; right?: number; bottom?: number; left?: number };
    }) => jsPDF;
    lastAutoTable?: { finalY: number };
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export data as CSV and trigger browser download.
 */
export async function exportToCSV(
  data: Record<string, unknown>[],
  filename: string
): Promise<void> {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

/**
 * Export data as a PDF table and trigger browser download.
 */
export async function exportToPDF(
  title: string,
  columns: string[],
  rows: string[][],
  filename: string
): Promise<void> {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 22);

  // Subtitle with date
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 14, 30);

  // Table
  doc.autoTable({
    head: [columns],
    body: rows,
    startY: 38,
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 4 },
    margin: { top: 38 },
  });

  const blob = doc.output("blob");
  triggerDownload(blob, filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

/**
 * Export a comprehensive project report as PDF.
 */
export async function exportProjectReport(
  project: {
    name: string;
    state: string;
    petition_type: string;
    status: string;
    total_signatures: number;
    verified_count: number;
    invalid_count: number;
    flagged_count: number;
    deadline?: string | null;
    created_at?: string;
  },
  signatures: {
    extracted_name: string;
    extracted_address: string;
    status: string;
    match_confidence: number | null;
    flagged_reason: string | null;
    created_at: string;
  }[]
): Promise<void> {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229);
  doc.text("PetitionPilot", 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text("Signature Verification Report", 14, 27);

  // Project info
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text(project.name, 14, 42);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const infoLines = [
    `State: ${project.state}  |  Type: ${project.petition_type}  |  Status: ${project.status}`,
    `Deadline: ${project.deadline ? new Date(project.deadline).toLocaleDateString() : "Not set"}`,
    `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
  ];
  infoLines.forEach((line, i) => doc.text(line, 14, 50 + i * 6));

  // Stats summary
  const pending = project.total_signatures - project.verified_count - project.invalid_count - project.flagged_count;
  doc.autoTable({
    head: [["Total Signatures", "Verified", "Invalid", "Flagged", "Pending", "Accuracy"]],
    body: [[
      project.total_signatures.toLocaleString(),
      project.verified_count.toLocaleString(),
      project.invalid_count.toLocaleString(),
      project.flagged_count.toLocaleString(),
      Math.max(0, pending).toLocaleString(),
      project.verified_count + project.invalid_count > 0
        ? `${((project.verified_count / (project.verified_count + project.invalid_count)) * 100).toFixed(1)}%`
        : "N/A",
    ]],
    startY: 70,
    theme: "grid",
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 4, halign: "center" },
  });

  // Signature list
  if (signatures.length > 0) {
    const tableY = (doc.lastAutoTable?.finalY ?? 90) + 12;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text("Signature Details", 14, tableY);

    doc.autoTable({
      head: [["Name", "Address", "Status", "Confidence", "Flagged Reason", "Date"]],
      body: signatures.map((s) => [
        s.extracted_name,
        s.extracted_address,
        s.status,
        s.match_confidence != null ? `${(s.match_confidence * 100).toFixed(0)}%` : "-",
        s.flagged_reason || "-",
        new Date(s.created_at).toLocaleDateString(),
      ]),
      startY: tableY + 4,
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 45 },
      },
    });
  }

  const blob = doc.output("blob");
  triggerDownload(blob, `${project.name.replace(/\s+/g, "_")}_Report.pdf`);
}

/**
 * Generate a legal affidavit template PDF.
 */
export async function exportAffidavitTemplate(
  project: {
    name: string;
    state: string;
    petition_type: string;
  },
  signerCount: number
): Promise<void> {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text("CIRCULATOR AFFIDAVIT", 105, 25, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`State of ${project.state}`, 105, 34, { align: "center" });

  doc.setLineWidth(0.5);
  doc.line(14, 40, 196, 40);

  const bodyText = [
    `I, _________________________, being duly sworn, do hereby state:`,
    "",
    `1. I am the circulator of the attached petition sheet(s) for the petition titled`,
    `   "${project.name}" (${project.petition_type}).`,
    "",
    `2. I personally witnessed each of the ${signerCount} signature(s) on this sheet.`,
    "",
    `3. Each signature was made in my presence by the person whose name appears therein.`,
    "",
    `4. I believe each signer is a registered voter in the State of ${project.state}.`,
    "",
    `5. I have not solicited or obtained any signature by fraud, misrepresentation,`,
    `   or other improper means.`,
    "",
    "",
    `Circulator Signature: _________________________________    Date: _______________`,
    "",
    `Printed Name: _________________________________________`,
    "",
    `Address: ______________________________________________`,
    "",
    `City, State, ZIP: _____________________________________`,
    "",
    "",
    `NOTARY PUBLIC`,
    "",
    `State of ${project.state}, County of _____________________`,
    "",
    `Subscribed and sworn to before me this _____ day of _____________, 20___.`,
    "",
    "",
    `Notary Signature: _____________________________________`,
    "",
    `My commission expires: ________________________________`,
  ];

  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  let y = 50;
  for (const line of bodyText) {
    doc.text(line, 14, y);
    y += 6;
  }

  const blob = doc.output("blob");
  triggerDownload(blob, `Affidavit_${project.state}.pdf`);
}

/**
 * Generate a county clerk submission package PDF.
 */
export async function exportCountyClerkSubmission(
  project: {
    name: string;
    state: string;
    petition_type: string;
    total_signatures: number;
    verified_count: number;
    invalid_count: number;
    flagged_count: number;
    deadline?: string | null;
  },
  signatures: {
    extracted_name: string;
    extracted_address: string;
    status: string;
    created_at: string;
  }[]
): Promise<void> {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("PETITION FILING SUBMISSION", 105, 20, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`State of ${project.state} - County Clerk Office`, 105, 28, { align: "center" });

  doc.setLineWidth(0.5);
  doc.line(14, 34, 196, 34);

  // Filing details
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  const details = [
    `Petition Title: ${project.name}`,
    `Petition Type: ${project.petition_type}`,
    `State: ${project.state}`,
    `Filing Deadline: ${project.deadline ? new Date(project.deadline).toLocaleDateString() : "Not specified"}`,
    `Submission Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    "",
    `Total Signatures Submitted: ${project.total_signatures.toLocaleString()}`,
    `Verified Signatures: ${project.verified_count.toLocaleString()}`,
    `Invalid (Excluded): ${project.invalid_count.toLocaleString()}`,
    `Flagged for Review: ${project.flagged_count.toLocaleString()}`,
  ];

  let y = 44;
  for (const line of details) {
    doc.text(line, 14, y);
    y += 7;
  }

  // Verified signatures list
  const verifiedSigs = signatures.filter((s) => s.status === "verified");
  if (verifiedSigs.length > 0) {
    doc.autoTable({
      head: [["#", "Signer Name", "Address", "Date Signed"]],
      body: verifiedSigs.map((s, i) => [
        String(i + 1),
        s.extracted_name,
        s.extracted_address,
        new Date(s.created_at).toLocaleDateString(),
      ]),
      startY: y + 6,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 3 },
    });
  }

  const blob = doc.output("blob");
  triggerDownload(blob, `${project.state}_County_Clerk_Filing_${project.name.replace(/\s+/g, "_")}.pdf`);
}
