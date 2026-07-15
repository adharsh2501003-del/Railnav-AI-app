import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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
app.post("/api/chat", async (req, res) => {
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
