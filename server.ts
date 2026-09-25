import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { STATION_DESTINATIONS } from "./src/data";
import { WebSocketServer } from "ws";
import { verifyJwt } from "./src/server/auth";

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
let webSocketClients: Set<import("ws").WebSocket> = new Set();

function publish(event: LiveEvent) {
  notifications.unshift(event);
  for (const client of liveClients) client.write(`data: ${JSON.stringify(event)}\n\n`);
  for (const client of webSocketClients) if (client.readyState === 1) client.send(JSON.stringify(event));
}

function requireStaff(req: import("express").Request, res: import("express").Response, stationId: string) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  const user = token ? verifyJwt(token) : null;
  const isDemoStaff = token === "staff-demo" || token === "admin-demo";
  if (!token || (!user && !isDemoStaff)) {
    res.status(401).json({ error: "Staff authentication required" });
    return false;
  }
  if (user && !user.roles.some((role) => role === "staff" || role === "admin")) {
    res.status(403).json({ error: "Insufficient permissions" });
    return false;
  }
  if ((token === "staff-demo" || (user?.roles.includes("staff") && !user.roles.includes("admin") && user.stationId !== station.id)) && stationId !== station.id) {
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
  const query = prompt.trim().toLowerCase().replace(/\s+/g, " ");
  const has = (...terms: string[]) => terms.some((term) => query.includes(term));

  if (!query) return "Tell me what you need help finding, such as a platform, restroom, food court, lift, ticket counter, or emergency assistance.";
  if (has("hello", "hi ", "hey", "good morning", "good afternoon", "good evening")) {
    return "Hello! I can help you navigate the station. Ask me for a platform, facility, route, accessibility option, train area, or emergency help.";
  }
  if (has("thank", "thanks")) return "You're welcome! I’m here whenever you need help finding your way around the station.";
  if (has("help", "what can you do", "what do you know")) {
    return "I can guide you to platforms, restrooms, food, tickets, lifts, escalators, waiting rooms, ATMs, charging points, water, security, and Lost & Found. You can ask in a full sentence, such as “How do I get to Platform 8?”";
  }

  const platformMatch = query.match(/platform\s*(?:no\.?\s*)?(\d+)|(?:platform|track)\s*(one|two|three|four|five|six|seven|eight)/);
  const numberWords: Record<string, string> = { one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8" };
  if (platformMatch) {
    const platform = platformMatch[1] || numberWords[platformMatch[2]];
    const details: Record<string, string> = {
      "4": "Platform 4 is on the Ground Floor along the main corridor, so no lift or stairs are required.",
      "5": "Platform 5 is reached by following the main platform signs, then taking the primary escalator or wheelchair-friendly Glass Lift A before descending to the platform.",
      "8": "Platform 8 is on the First Floor overbridge. Take the escalator beside Gate A, cross the bridge, and follow the Platform 8 signs.",
    };
    return `To reach Platform ${platform}: ${details[platform] || "Follow the overhead platform signs from the main concourse. I can also open the interactive map to help you follow the route."} Estimated walking time is about 3–6 minutes depending on your starting point.`;
  }

  if (has("restroom", "washroom", "toilet", "bathroom")) {
    return "The nearest clean restroom is Restroom Block A on the Ground Floor near the waiting hall. It has accessible facilities and high-contrast sign boards.";
  }
  if (has("lift", "elevator", "wheelchair", "accessible", "step free", "step-free", "ramp")) {
    return "For step-free travel, use Glass Lift A on the Ground Floor. It connects GF and FF and supports wheelchair access; a ramp is also available at the main gate.";
  }
  if (has("food", "court", "eat", "restaurant", "irctc", "coffee", "cafe")) {
    return "The IRCTC Food Court is on the First Floor (FF), with Domino’s, Haldirams, coffee kiosks, and local breakfast options.";
  }
  if (has("ticket", "counter", "booking")) {
    return "Ticket Counter North is on the Ground Floor. Eight counters are currently available for unreserved ticket bookings.";
  }
  if (has("atm", "cash", "money")) {
    return "The State Bank ATM is on the Ground Floor near the exit gates and is available 24/7.";
  }
  if (has("waiting", "lounge", "sit", "rest")) {
    return "The General Waiting Room is on the Ground Floor. For quieter seating and refreshments, use the Executive VIP Lounge on the First Floor.";
  }
  if (has("charge", "charging", "usb", "power")) {
    return "Charging Point Station B is on the First Floor (FF), with six USB docks and multi-pin outlets.";
  }
  if (has("stair", "stairs", "escalator")) {
    return "Use Platform 6 Stairs on the First Floor; an adjacent escalator provides continuous access between levels.";
  }
  if (has("water", "drinking", "purifier")) {
    return "The Water Purifier Station is on the First Floor and provides free cold RO drinking water.";
  }
  if (has("police", "rpf", "security", "sos", "emergency", "unsafe")) {
    return "For emergency assistance, go to the Railway Police Office (RPF booth) on the Second Floor. Railway helpline: 139. If you are in immediate danger, contact station staff now.";
  }
  if (has("dormitory", "dormitories", "sleeping", "bed")) {
    return "Resting Dormitories are on the Second Floor, with AC and non-AC sleeping berths.";
  }
  if (has("lost", "found", "missing", "baggage", "luggage")) {
    return "Report lost baggage at the Lost & Found Center on the Second Floor. Keep your ticket and a description of the item ready.";
  }

  return `I understood that you asked about “${prompt.trim()}”. I can answer station-navigation questions about platforms, facilities, routes, accessibility, trains, and emergencies. Try asking “Where is the nearest restroom?” or “How do I reach Platform 8?”`;
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
    if (typeof message !== "string" || !message.trim()) {
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

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`RailNav AI Full-Stack Server running on port ${PORT}`);
  });
  const wss = new WebSocketServer({ server, path: "/ws" });
  wss.on("connection", (socket) => {
    webSocketClients.add(socket);
    socket.send(JSON.stringify(notifications[0]));
    socket.on("close", () => webSocketClients.delete(socket));
  });
}

startServer();
