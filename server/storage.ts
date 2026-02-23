import { users, records, type User, type InsertUser, type InsertRecord } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createRecord(record: any): Promise<any>;
  getAllRecords(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createRecord(record: any): Promise<any> {
    const recordData: InsertRecord = {
      id: record.id,
      data: JSON.stringify(record),
      createdAt: (record.createdAt || Date.now()).toString(),
      updatedAt: (record.updatedAt || Date.now()).toString(),
    };

    const [existing] = await db.select().from(records).where(eq(records.id, record.id));

    if (existing) {
      const [updated] = await db.update(records)
        .set({
          data: record,
          updatedAt: recordData.updatedAt
        })
        .where(eq(records.id, record.id))
        .returning();
      return updated.data;
    } else {
      const [inserted] = await db.insert(records).values({
        ...recordData,
        data: record
      }).returning();
      return inserted.data;
    }
  }

  async getAllRecords(): Promise<any[]> {
    const allRecords = await db.select().from(records);
    return allRecords.map(r => r.data);
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private records: Map<string, any>;

  constructor() {
    this.users = new Map();
    this.records = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createRecord(record: any): Promise<any> {
    this.records.set(record.id, record);
    return record;
  }

  async getAllRecords(): Promise<any[]> {
    return Array.from(this.records.values());
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
