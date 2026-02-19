import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

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
