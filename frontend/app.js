/* Shared UI helpers (no data lives here) */

const $ = (sel, root = document) => root.querySelector(sel);

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const money = n => Number.isFinite(Number(n)) && n !== null && n !== undefined && n !== ""
  ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n)
  : "-";

const fmtDate = d => (d ? String(d).slice(0, 10) : "-");

const isBookable = p => p.availableSeats > 0 && String(p.status || "").toLowerCase() === "available";

function renderHeader(active) {
  const links = [["index.html", "Packages"], ["booking.html", "Book a tour"], ["bookings.html", "Bookings"], ["customers.html", "Customers"]];
  $("#site-header").innerHTML =
    '<div class="bar"><a class="brand" href="index.html">Tour<span>Wise</span></a><nav>' +
    links.map(([href, label]) => `<a href="${href}"${href === active ? ' class="active"' : ""}>${label}</a>`).join("") +
    "</nav></div>";
}
// type: "loading" | "error" | "empty"
function showState(el, type, message, retry) {
  const spinner = type === "loading" ? '<span class="spin" aria-hidden="true"></span>' : "";
  const btn = type === "error" && retry ? '<button class="btn small" type="button">Try again</button>' : "";
  el.innerHTML = `<div class="state ${type}" role="${type === "error" ? "alert" : "status"}">${spinner}<p>${esc(message)}</p>${btn}</div>`;
  if (btn) $("button", el).addEventListener("click", retry);
}

function seatBadge(p) {
  if (String(p.status || "").toLowerCase() !== "available") return `<span class="badge bad">${esc(p.status || "Unavailable")}</span>`;
  if (p.availableSeats <= 0) return '<span class="badge bad">Sold out</span>';
  if (p.availableSeats <= 5) return `<span class="badge warn">Only ${p.availableSeats} left</span>`;
  return `<span class="badge">${p.availableSeats} of ${p.totalSeats} seats open</span>`;
}
