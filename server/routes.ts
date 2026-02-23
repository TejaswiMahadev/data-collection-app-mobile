import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  app.get("/api/tts", async (req, res) => {
    try {
      const { text, language } = req.query as { text: string; language: string };
      if (!text || !language) {
        return res.status(400).json({ message: "Missing text or language" });
      }

      // Maps app languages to Sarvam's expected format
      const langMap: Record<string, string> = {
        'en': 'en-IN',
        'hi': 'hi-IN',
        'od': 'or-IN'
      };

      const targetLanguageCode = langMap[language] || 'en-IN';

      const payload = {
        text,
        target_language_code: targetLanguageCode,
        speaker: "tanya",
        model: "bulbul:v3",
        pace: 1.0,
        speech_sample_rate: 22050,
        output_audio_codec: "mp3",
        enable_preprocessing: true
      };

      // Fallback API key for development if not provided in env
      const apiKey = process.env.SARVAM_API_KEY || "sk_il938rc5_x5ON1h82fC2g2kYwRBoEnyqf";

      const response = await fetch("https://api.sarvam.ai/text-to-speech/stream", {
        method: "POST",
        headers: {
          "api-subscription-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sarvam API error: ${response.status} - ${errorText}`);
      }

      // Stream the response directly to the client
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'no-store, max-age=0');

      if (response.body) {
        // Using Node's stream pipeline to stream Web stream to Node response
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      } else {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return res.send(buffer);
      }

    } catch (error: any) {
      console.error("TTS Proxy error:", error);
      res.status(500).json({ message: "Internal server error during TTS" });
    }
  });

  app.get("/api/records", async (_req, res) => {
    const records = await storage.getAllRecords();
    res.json(records);
  });

  app.post("/api/records", async (req, res) => {
    const record = req.body;
    if (!record || !record.id) {
      return res.status(400).json({ message: "Invalid record data" });
    }
    const saved = await storage.createRecord(record);
    res.json(saved);
  });

  const httpServer = createServer(app);

  return httpServer;
}
