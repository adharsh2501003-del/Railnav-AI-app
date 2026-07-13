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
  
  if (query.includes("platform 8") || query.includes("platform eight")) {
    return "To reach Platform 8: From your current location near the main entry, walk straight past the main ticket counters. Take the primary escalator or the wheelchair-friendly lift up to the foot overbridge. Walk across to the signpost for Platform 8 and take the elevator/stairs down. Estimated walking time is 3 minutes (180 meters).";
  }
  
  if (query.includes("restroom") || query.includes("washroom") || query.includes("toilet")) {
    return "The nearest clean restroom is situated right behind Platform 2's waiting hall on the Ground Floor. There is also an accessibility-friendly, wheelchair-accessible toilet located near the Medical Room at Entry Gate A.";
  }

  if (query.includes("lift") || query.includes("elevator") || query.includes("wheelchair") || query.includes("accessible")) {
    return "RailNav AI Accessibility route: There are glass lifts operating at Platforms 1, 3, and 5. The nearest wheelchair ramp is next to Entry Gate A. We have updated your navigation layer to show wheelchair-friendly flat paths with zero stairs.";
  }

  if (query.includes("food") || query.includes("court") || query.includes("eat") || query.includes("restaurant") || query.includes("irctc")) {
    return "The main IRCTC Food Court is located on the First Floor (Mezzanine Level) above Platform 1. You can find popular options like Nescafe, Jan Ahaar, and local sweet stalls. An express snack kiosk is also present at Platform 4.";
  }

  if (query.includes("ticket") || query.includes("counter") || query.includes("booking")) {
    return "The unreserved ticket booking counter is at Entry Gate A (North Terminal). Reserved reservation counters are in the adjacent building to the left. The automated ticket vending machines (ATVMs) are also available near Platforms 1 and 4.";
  }

  if (query.includes("exit") || query.includes("out") || query.includes("gate")) {
    return "There are two major exit corridors: Exit Gate A (leads to the main metro station link and pre-paid auto stand) and Exit Gate B (leads to the east city side parking). Exit Gate A is closest to your current position (approx. 50 meters away).";
  }

  if (query.includes("sos") || query.includes("emergency") || query.includes("police") || query.includes("doctor")) {
    return "⚠️ EMERGENCY ALERT: The Railway Protection Force (RPF) booth is located on Platform 1, next to the Station Master's office. The Medical Clinic is beside the main waiting room. You can trigger the SOS button in the emergency panel to directly call our emergency helpline numbers (139 or 112).";
  }

  return "I'm RailNav AI, your station guide. I can help you find platforms (e.g., 'Platform 8'), clean restrooms, IRCTC food courts, lifts/escalators, and help with wheelchair-friendly paths. What station facility can I help you find right now?";
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
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
