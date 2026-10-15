// A small, dependency-free PDF summary for this demonstration.
export function bookingPdf(b,kind){
  const lines = [
    `TravelSure DEMO ${kind.toUpperCase()}`,
    `Booking: ${b.id}`,
    `${b.trip.name}: ${b.trip.from} to ${b.trip.to}`,
    `Date: ${b.trip.date}`,
    `Passengers: ${b.passengers.map((p) => p.name).join(", ")}`,
    `Fare INR ${b.fare}; Insurance INR ${b.premium}; Fee INR ${b.fee}`,
    `Total paid INR ${b.total}`,
    `Policy: ${b.policy.policyNumber || "None"}`,
    `Status: ${b.policy.status}`,
    "Simulated booking. Not valid for travel or insurance.",
  ];
  const esc = (s) => s.replace(/[\\()]/g, "\\$&").replace(/[^\x20-\x7E]/g, "?");
  const stream =
    "BT /F1 12 Tf 45 790 Td " +
    lines.map((s, i) => `${i ? "0 -25 Td " : ""}(${esc(s)}) Tj`).join("\n") +
    " ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n",
    offsets = [0];
  objects.forEach((o, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((o) => String(o).padStart(10, "0") + " 00000 n \n")
    .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

return Buffer.from(pdf);
}
