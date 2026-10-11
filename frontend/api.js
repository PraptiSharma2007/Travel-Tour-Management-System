/* ==========================================================
   api.js - the ONLY file that knows about the backend.
   If your real backend differs, change things here:
     1. API_BASE_URL   - server address
     2. ENDPOINTS      - route paths (set a path to null if it doesn't exist)
     3. FIELD_MAP      - JSON field names returned by your backend
     4. buildBookingPayload() - request body for POST
   ========================================================== */

const API_BASE_URL = "const API_BASE_URL = "https://travel-tour-management-system.onrender.com/api";";

const ENDPOINTS = {
  customers: "/customers",        // GET
  destinations: "/destinations",  // GET
  packages: "/packages",          // GET
  bookings: "/bookings",          // GET
  createBooking: "/bookings",     // POST
  createCustomer: null            // POST /customers - NOT in the assumed API, so the UI marks it unavailable
};

// App field name -> JSON field name sent by the backend
const FIELD_MAP = {
  customer: { id: "CustomerID", name: "CustomerName", email: "Email", phone: "Phone", city: "City", registered: "RegistrationDate" },
  destination: { id: "DestinationID", name: "DestinationName", state: "State", country: "Country", description: "Description", bestTime: "BestTimeToVisit" },
  package: { id: "PackageID", name: "PackageName", destinationId: "DestinationID", days: "DurationDays", price: "Price", totalSeats: "TotalSeats", availableSeats: "AvailableSeats", status: "PackageStatus" },
  booking: { id: "BookingID", customerId: "CustomerID", packageId: "PackageID", date: "BookingDate", people: "NumberOfPeople", total: "TotalAmount", status: "BookingStatus" }
};

const NUMERIC_KEYS = new Set(["price", "days", "totalSeats", "availableSeats", "people", "total"]);

// Request body for POST /bookings (column names of the Booking table)
function buildBookingPayload({ customerId, packageId, people, total }) {
  return {
    CustomerID: customerId,
    PackageID: packageId,
    NumberOfPeople: people,
    TotalAmount: total
  };
}

/* ---------- internals ---------- */

class ApiError extends Error {}

function normalize(entity, row) {
  const out = {};
  for (const [key, column] of Object.entries(FIELD_MAP[entity])) {
    const value = row ? row[column] : undefined;
    out[key] = NUMERIC_KEYS.has(key) && value != null && value !== "" ? Number(value) : value;
  }
  return out;
}

function toList(data) {
  if (Array.isArray(data)) return data;
  for (const k of ["data", "rows", "result", "results"]) {
    if (data && Array.isArray(data[k])) return data[k];
  }
  throw new ApiError("The server sent data in an unexpected format.");
}

async function request(path, { method = "GET", body } = {}) {
  if (!path) throw new ApiError("This feature needs a backend endpoint that is not set up yet.");
  let res;
  try {
    res = await fetch(API_BASE_URL + path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (err) {
    throw new ApiError("Can't reach the server. Start the backend at " + API_BASE_URL.replace(/\/api$/, "") + " and try again.");
  }
  let data = null;
  try { data = JSON.parse(await res.text()); } catch (err) { /* handled below */ }

  if (!res.ok) {
    const msg = data && (data.message || data.error);
    if (res.status < 500 && typeof msg === "string") throw new ApiError(msg);
    throw new ApiError("The server ran into a problem (error " + res.status + "). Try again in a moment.");
  }
  if (data === null) throw new ApiError("The server sent a response that couldn't be read.");
  return data;
}

async function getList(endpoint, entity) {
  return toList(await request(endpoint)).map(row => normalize(entity, row));
}

/* ---------- public API ---------- */

const Api = {
  getCustomers: () => getList(ENDPOINTS.customers, "customer"),
  getDestinations: () => getList(ENDPOINTS.destinations, "destination"),
  getPackages: () => getList(ENDPOINTS.packages, "package"),
  getBookings: () => getList(ENDPOINTS.bookings, "booking"),

  // Returns what the backend sent back. `booking` is only filled when the backend
  // returned a booking record; `id` only when the backend returned a real ID.
  async createBooking(input) {
    const raw = await request(ENDPOINTS.createBooking, { method: "POST", body: buildBookingPayload(input) });
    const rec = (raw && (raw.booking || raw.data)) || raw;
    const idCol = FIELD_MAP.booking.id;
    const id = rec && (rec[idCol] ?? rec.bookingId ?? rec.insertId ?? rec.id) || raw.bookingId || raw.insertId || null;
    const booking = rec && rec[idCol] != null ? normalize("booking", rec) : null;
    return { raw, id, booking, message: typeof raw.message === "string" ? raw.message : null };
  },

  canCreateCustomer: () => Boolean(ENDPOINTS.createCustomer)
};
