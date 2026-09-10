import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { STATION_DESTINATIONS } from "./src/data";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  const contentSecurityPolicy = process.env.NODE_ENV === "production"
    ? "default-src 'self'; connect-src 'self' https:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com"
    : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http: https: ws: wss:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com";
  res.setHeader("Content-Security-Policy", contentSecurityPolicy);
  next();
});

type LiveEvent = {
  id: string;
  type: "platform" | "delay" | "route" | "crowd" | "announcement";
  title: string;
  message: string;
  time: string;
  read: boolean;
};

const station = { id: "ndls", name: "New Delhi Railway Station", code: "NDLS", city: "New Delhi", timezone: "Asia/Kolkata" };
const floors = [
  { id: "GF", level: "GF", label: "Ground Floor" },
  { id: "FF", level: "FF", label: "First Floor" },
  { id: "SF", level: "SF", label: "Second Floor" },
];
const facilities = STATION_DESTINATIONS.map((item, index) => ({
  ...item,
  id: `facility-${index + 1}`,
  stationId: station.id,
  floorId: item.floor,
  accessible: item.type !== "escalators",
}));
const trains = [
  { number: "12002", name: "NDLS Shatabdi Exp", platform: "5", departureTime: "06:15 AM", delayStatus: { delayed: true, minutes: 10 }, crowdLevel: "Medium", coachPosition: ["ENG", "C1", "C2", "C3", "C4", "C5", "E1", "E2"], nearbyFacilities: [], nearestLift: "Elevator Lift B", nearestEscalator: "Escalator 2A", nearestExit: "Exit Gate A (North)" },
  { number: "12626", name: "Kerala Express", platform: "4", departureTime: "11:45 AM", delayStatus: { delayed: true, minutes: 25 }, crowdLevel: "Heavy", coachPosition: [], nearbyFacilities: [], nearestLift: "Glass Lift A", nearestEscalator: "Escalator 1A", nearestExit: "Exit Gate B" },
];
const notifications: LiveEvent[] = [
  { id: "notif-1", type: "platform", title: "Platform Changed - 12002", message: "NDLS Shatabdi Express is now assigned to Platform 5.", time: "Just Now", read: false },
  { id: "notif-2", type: "delay", title: "Train Delayed - Kerala Exp", message: "Kerala Express is delayed by 25 minutes.", time: "10 mins ago", read: false },
];
const liveClients = new Set<import("express").Response>();

function publish(event: LiveEvent) {
  notifications.unshift(event);
  for (const client of liveClients) client.write(`data: ${JSON.stringify(event)}\n\n`);
}

function requireStaff(req: import("express").Request, res: import("express").Response, stationId: string) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !["staff-demo", "admin-demo"].includes(token)) {
    res.status(401).json({ error: "Staff authentication required" });
    return false;
  }
  if (token === "staff-demo" && stationId !== station.id) {
    res.status(403).json({ error: "Staff account is not assigned to this station" });
    return false;
  }
  return true;
}

app.get("/health", (_req, res) => res.json({ status: "ok", database: "in-memory-demo", cache: "not-configured" }));
app.get("/stations", (_req, res) => res.json([station]));
app.get("/stations/:id/floors", (req, res) => req.params.id === station.id ? res.json(floors) : res.status(404).json({ error: "Station not found" }));
app.get("/stations/:id/facilities", (req, res) => {
  if (req.params.id !== station.id) return res.status(404).json({ error: "Station not found" });
  const floor = typeof req.query.floor === "string" ? req.query.floor : undefined;
  res.json(facilities.filter((item) => !floor || item.floor === floor));
});
app.get("/stations/:id/trains", (req, res) => req.params.id === station.id ? res.json(trains) : res.status(404).json({ error: "Station not found" }));
app.get("/notifications", (req, res) => res.json(notifications.filter((item) => !req.query.station || req.query.station === station.id)));

app.get("/route", (req, res) => {
  const stationId = String(req.query.station || station.id);
  const fromId = String(req.query.from || facilities[0].id);
  const toId = String(req.query.to || facilities[1].id);
  const accessible = String(req.query.accessible) === "true";
  if (stationId !== station.id) return res.status(404).json({ error: "Station not found" });
  const from = facilities.find((item) => item.id === fromId || item.label.toLowerCase() === fromId.toLowerCase());
  const to = facilities.find((item) => item.id === toId || item.label.toLowerCase() === toId.toLowerCase());
  if (!from || !to) return res.status(400).json({ error: "Unknown route endpoint" });

  const path = [from];
  if (from.floor !== to.floor) {
    const lift = facilities.find((item) => item.label === "Glass Lift A");
    if (accessible && lift) path.push(lift);
    else if (lift) path.push(lift);
  }
  path.push(to);
  const geometry = path.map(({ x, y, floor }) => ({ x, y, floor }));
  const distanceMeters = Math.max(1, Math.round(path.slice(1).reduce((sum, item, index) => sum + Math.hypot(item.x - path[index].x, item.y - path[index].y), 0)));
  const steps = path.slice(1).map((item, index) => ({
    instruction: item.floor !== path[index].floor ? `Take the accessible lift to ${item.floor}` : `Walk toward ${item.label}`,
    distanceMeters: Math.round(Math.hypot(item.x - path[index].x, item.y - path[index].y)),
    floor: item.floor,
    kind: item.floor !== path[index].floor ? "lift" : "walk",
  }));
  steps.push({ instruction: `Arrive at ${to.label}`, distanceMeters: 0, floor: to.floor, kind: "arrive" });
  res.json({ stationId, from: from.id, to: to.id, distanceMeters, steps, geometry });
});

app.get("/live", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.write(`data: ${JSON.stringify(notifications[0])}\n\n`);
  liveClients.add(res);
  req.on("close", () => liveClients.delete(res));
});

app.post("/sos", (req, res) => {
  const stationId = typeof req.body?.stationId === "string" ? req.body.stationId : station.id;
  const floorId = typeof req.body?.floorId === "string" ? req.body.floorId : "GF";
  if (stationId !== station.id || !floors.some((item) => item.id === floorId)) return res.status(400).json({ error: "Invalid SOS location" });
  const id = `sos-${Date.now()}`;
  publish({ id, type: "announcement", title: "Emergency SOS received", message: `Station staff dispatched to ${floorId}.`, time: "Just Now", read: false });
  res.status(202).json({ id, status: "dispatched" });
});

app.put("/admin/trains/:id/platform", (req, res) => {
  const train = trains.find((item) => item.number === req.params.id);
  if (!train || !requireStaff(req, res, station.id)) return;
  if (typeof req.body?.platform !== "string" || !/^\d+$/.test(req.body.platform)) return res.status(400).json({ error: "Platform must be numeric" });
  train.platform = req.body.platform;
  publish({ id: `platform-${Date.now()}`, type: "platform", title: `Platform changed - ${train.number}`, message: `${train.name} is now assigned to Platform ${train.platform}.`, time: "Just Now", read: false });
  res.json(train);
});

app.post("/admin/facilities", (req, res) => {
  if (!requireStaff(req, res, String(req.body?.stationId || station.id))) return;
  const { stationId, floorId, name, type, x, y } = req.body || {};
  if (stationId !== station.id || !floors.some((item) => item.id === floorId) || typeof name !== "string" || typeof type !== "string" || !Number.isFinite(x) || !Number.isFinite(y)) {
    return res.status(400).json({ error: "Invalid facility payload" });
  }
  const facility = { id: `facility-${facilities.length + 1}`, stationId, floorId, floor: floorId, name, label: name, type, x, y, details: "", crowd: "Low" as const, keywords: [name.toLowerCase()], accessible: type !== "escalators" };
  facilities.push(facility);
  res.status(201).json(facility);
});

app.put("/admin/facilities/:id", (req, res) => {
  const facility = facilities.find((item) => item.id === req.params.id);
  if (!facility || !requireStaff(req, res, facility.stationId)) return;
  Object.assign(facility, {
    name: typeof req.body?.name === "string" ? req.body.name : facility.label,
    label: typeof req.body?.name === "string" ? req.body.name : facility.label,
    details: typeof req.body?.details === "string" ? req.body.details : facility.details,
  });
  res.json(facility);
});

app.post("/admin/announcements", (req, res) => {
  if (!requireStaff(req, res, String(req.body?.stationId || station.id))) return;
  if (typeof req.body?.title !== "string" || typeof req.body?.message !== "string") return res.status(400).json({ error: "Title and message are required" });
  const event = { id: `announcement-${Date.now()}`, type: "announcement" as const, title: req.body.title, message: req.body.message, time: "Just Now", read: false };
  publish(event);
  res.status(201).json(event);
});

// Lazy load Gemini AI to avoid crashing on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// Local mock responder for high reliability when API key is missing or rate limited
function getMockResponse(prompt: string): string {
  const query = prompt.toLowerCase();
  
  if (query.includes("platform 5") || query.includes("five")) {
    return "To reach Platform 5: From your current location on the Ground Floor, walk past the main ticket counters. Take the primary escalator or the wheelchair-friendly Glass Lift A. Walk across to the signpost for Platform 5 and descend. Estimated walking time is 3 minutes.";
  }

  if (query.includes("platform 4") || query.includes("four")) {
    return "To reach Platform 4: Walk straight from the entrance along the main ground floor corridor. Platform 4 is located on the Ground Floor itself, with immediate track access. No stairs or lifts are required for this track.";
  }
  
  if (query.includes("restroom") || query.includes("washroom") || query.includes("toilet")) {
    return "The nearest clean restroom is Restroom Block A situated on the Ground Floor near the waiting hall. It is fully sanitized, includes disabled-friendly facilities, and has high-contrast sign boards.";
  }

  if (query.includes("lift") || query.includes("elevator") || query.includes("wheelchair") || query.includes("accessible")) {
    return "For complete step-free accessibility, please use Glass Lift A on the Ground Floor, which provides wheelchair access from level GF to FF. There is also a secondary ramp available at the main gate.";
  }

  if (query.includes("food") || query.includes("court") || query.includes("eat") || query.includes("restaurant") || query.includes("irctc")) {
    return "The primary dining facility is the IRCTC Food Court located on the First Floor (FF). It features Dominos, Haldirams, Coffee Kiosks, and local regional Indian breakfast foods.";
  }

  if (query.includes("ticket") || query.includes("counter") || query.includes("booking")) {
    return "Unreserved ticket bookings can be purchased at Ticket Counter North on the Ground Floor. There are 8 active counters open with a queue status monitor to speed up check-in.";
  }

  if (query.includes("atm") || query.includes("cash") || query.includes("money")) {
    return "A State Bank ATM is fully active on the Ground Floor near the exit gates. It supports cash withdrawals and is open 24/7.";
  }

  if (query.includes("waiting") || query.includes("lounge")) {
    return "We have two main waiting halls: the General Waiting Room located on the Ground Floor (GF), and the premium Executive VIP Lounge located on the First Floor (FF) with luxury sofa seating and refreshments.";
  }

  if (query.includes("charge") || query.includes("charging")) {
    return "To charge your electronic devices, navigate to Charging Point Station B located on the First Floor (FF), which provides 6 high-speed USB power docks and multi-pin plugs.";
  }

  if (query.includes("stair") || query.includes("stairs") || query.includes("escalator")) {
    return "To travel between levels, use the Platform 6 Stairs which has an adjacent escalator running upwards continuously, located on the First Floor (FF).";
  }

  if (query.includes("water") || query.includes("drinking")) {
    return "A cold RO drinking water kiosk is available at the Water Purifier Station located on the First Floor (FF), providing free pure drinking water.";
  }

  if (query.includes("police") || query.includes("rpf") || query.includes("security") || query.includes("sos") || query.includes("emergency")) {
    return "⚠️ EMERGENCY ASSISTANCE: The Railway Police Office (RPF booth) is located on the Second Floor (SF), providing 24/7 security assistance. You can also dial 139 for central railway helpline.";
  }

  if (query.includes("dormitory") || query.includes("dormitories") || query.includes("sleeping") || query.includes("bed")) {
    return "Clean sleeping berths can be booked at the Resting Dormitories located on the Second Floor (SF). Options include both AC deluxe and non-AC single beds.";
  }

  if (query.includes("lost") || query.includes("found") || query.includes("missing") || query.includes("baggage")) {
    return "If you lost any item or baggage, report it immediately to the Lost & Found Center located on the Second Floor (SF).";
  }

  return "I'm RailNav AI, your station guide. I can help you find Platform 5, Platform 4, Restroom Block A, IRCTC Food Court, Ticket Counter North, State Bank ATM, General Waiting Room, Executive VIP Lounge, and security centers. What can I find for you?";
}

// Resilient Gemini generator with auto-retry and fallback model support
async function generateWithFallback(ai: GoogleGenAI, message: string, systemPrompt: string): Promise<string> {
  // Try preferred model, then secondary free tier model if first is unavailable/overloaded
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Attempting Gemini generation with model "${model}" (attempt ${attempt}/2)`);
        const response = await ai.models.generateContent({
          model: model,
          contents: message,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          },
        });
        
        if (response && response.text) {
          console.log(`Success using model "${model}" on attempt ${attempt}`);
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Attempt ${attempt} with model "${model}" failed with: ${err?.message || err}`);
        if (attempt < 2) {
          // Quick sleep before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
  }
  throw lastError || new Error("All Gemini generation attempts failed");
}

// API Routes
app.post(["/api/chat", "/ai/chat"], async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message parameter is required." });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Use local response if API key is not configured or placeholder
      console.log("Using RailNav local response engine (no API key configured)");
      const text = getMockResponse(message);
      res.json({ text });
      return;
    }

    const systemPrompt = `You are "RailNav AI", an advanced, friendly, and helpful indoor navigation assistant for railway stations (specifically Indian Railways stations like New Delhi, Howrah, Mumbai CSMT, Chennai Central).
Your job is to provide clear, step-by-step indoor station directions, platform info, crowd alerts, and facility locations (restrooms, food courts, ticket counters, lifts, escalators, water points, ATMs).
Provide direct, short, bulleted or highly readable steps suitable for mobile screens. Keep it concise (under 120 words).
If the user asks about platforms, give realistic instructions: "Take the main escalator to the foot overbridge and descend to Platform [X]."
If they ask for lifts, escalators, or restrooms, explain their locations (e.g. near the waiting hall or platforms). Always highlight accessibility options (lifts, ramps, tactile paths) if relevant.
Avoid dry or technical code references. Keep all responses friendly, humble, and practical for travelers who are carrying heavy luggage, traveling with seniors, or in a rush.`;

    const text = await generateWithFallback(ai, message, systemPrompt);
    res.json({ text });
  } catch (error: any) {
    console.error("Gemini API Error, falling back to local engine:", error);
    // Fallback on failure
    try {
      const text = getMockResponse(req.body.message);
      res.json({ text });
    } catch (fallbackError) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

// Start server and handle Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RailNav AI Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
