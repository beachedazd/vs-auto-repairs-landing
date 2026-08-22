// Square webhook: when staff type a rego into the "Vehicle rego" custom field
// on a customer, look the plate up on PlateAPI and fill the "Vehicle" field.
//
// Env vars (set in Netlify, never committed):
//   SQUARE_ACCESS_TOKEN          - production token for the VS Auto Intake app
//   SQUARE_WEBHOOK_SIGNATURE_KEY - from the webhook subscription
//   PLATEAPI_KEY                 - plateapi.com.au key
//   WEBHOOK_URL                  - this function's public URL (used in signature check)

import crypto from "node:crypto";

const SQUARE_BASE = "https://connect.squareup.com/v2";
const STATES = new Set(["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]);
const REGO_KEY = "vehicle-rego";
const VEHICLE_KEY = "vehicle";

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawBody = await req.text();

  // --- verify the event really came from Square ---
  const sigKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const url = process.env.WEBHOOK_URL || req.url;
  const expected = crypto.createHmac("sha256", sigKey || "").update(url + rawBody).digest("base64");
  const got = req.headers.get("x-square-hmacsha256-signature") || "";
  if (!sigKey || !timingSafeEqual(expected, got)) {
    console.log("signature mismatch", { url, got });
    return new Response("Invalid signature", { status: 403 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  // Log every event while the integration is young - visible via `netlify logs:function`
  console.log("event", JSON.stringify(event));

  try {
    if ((event.type || "").startsWith("customer.custom_attribute")) {
      await handleCustomAttribute(event);
    }
  } catch (err) {
    // Log but return 200 so Square doesn't retry a permanently-failing event forever
    console.log("handler error", err && err.stack ? err.stack : String(err));
  }
  return new Response("ok", { status: 200 });
};

async function handleCustomAttribute(event) {
  const ca = event?.data?.object?.custom_attribute;
  if (!ca) return;

  // Keys may arrive qualified as "<app_id>:<key>" - compare the tail
  const key = String(ca.key || "").split(":").pop();
  if (key !== REGO_KEY) return; // ignore our own writes to "vehicle" etc.
  if (event.type.endsWith(".deleted")) return;

  const customerId = findCustomerId(event);
  if (!customerId) {
    console.log("no customer id found in event");
    return;
  }

  const raw = String(ca.value || "").trim();
  if (!raw) return;
  const { plate, state } = parseRego(raw);

  const vehicle = await lookupPlate(plate, state);
  const text = vehicle
    ? [vehicle.year_range, vehicle.make, vehicle.model, vehicle.engine].filter(Boolean).join(" ")
    : `No match for ${plate} (${state}) - check plate/state`;

  await squareFetch(`/customers/${customerId}/custom-attributes/${VEHICLE_KEY}`, {
    method: "POST",
    body: JSON.stringify({ custom_attribute: { value: text } }),
  });
  console.log("vehicle set", { customerId, plate, state, text });
}

function findCustomerId(event) {
  const d = event?.data || {};
  // data.id format: "<app_id>:<key>:CUSTOMER:<customer_id>" (verified via Square's test event)
  if (typeof d.id === "string") {
    const parts = d.id.split(":");
    const i = parts.indexOf("CUSTOMER");
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
  }
  const ca = d.object?.custom_attribute || {};
  for (const cand of [ca.customer_id, d.object?.customer_id, d.id]) {
    if (typeof cand === "string") {
      const m = cand.match(/[A-Z0-9]{16,}/); // Square customer ids are long uppercase alnum
      if (m) return m[0];
    }
  }
  return null;
}

function parseRego(raw) {
  const parts = raw.toUpperCase().split(/[\s,]+/).filter(Boolean);
  let state = "VIC";
  if (parts.length > 1 && STATES.has(parts[parts.length - 1])) {
    state = parts.pop();
  }
  return { plate: parts.join(""), state };
}

async function lookupPlate(plate, state) {
  const res = await fetch(
    `https://api.plateapi.com.au/api/v1/lookup?plate=${encodeURIComponent(plate)}&state=${state}`,
    { headers: { "X-API-Key": process.env.PLATEAPI_KEY } }
  );
  const data = await res.json().catch(() => null);
  console.log("plateapi", res.status, JSON.stringify(data));
  if (!res.ok || !data?.success || !data?.vehicle) return null;
  return data.vehicle;
}

async function squareFetch(path, opts = {}) {
  const res = await fetch(SQUARE_BASE + path, {
    ...opts,
    headers: {
      Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...opts.headers,
    },
  });
  if (!res.ok) console.log("square error", path, res.status, await res.text());
  return res;
}

function timingSafeEqual(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export const config = { path: "/hooks/square" };
