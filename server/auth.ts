import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { AdminUser, POSSystem } from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      userType: "admin" | "pos";
      id: string;
      username: string;
      password: string;
      createdAt: Date;
      // Admin specific
      // POS specific
      businessName?: string;
      contactEmail?: string;
      status?: string;
      approvedAt?: Date | null;
      approvedBy?: string | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "pos-system-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Admin authentication strategy
  passport.use("admin-local", new LocalStrategy(
    { usernameField: "username", passwordField: "password" },
    async (username, password, done) => {
      try {
        const user = await storage.getAdminUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid admin credentials" });
        }
        return done(null, { ...user, userType: "admin" as const });
      } catch (error) {
        return done(error);
      }
    }
  ));

  // POS authentication strategy
  passport.use("pos-local", new LocalStrategy(
    { usernameField: "username", passwordField: "password" },
    async (username, password, done) => {
      try {
        const system = await storage.getPOSSystemByUsername(username);
        if (!system || system.status !== "approved" || !(await comparePasswords(password, system.password))) {
          return done(null, false, { message: "Invalid POS credentials or system not approved" });
        }
        return done(null, { ...system, userType: "pos" as const });
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, { id: user.id, userType: user.userType });
  });

  passport.deserializeUser(async (data: any, done) => {
    try {
      if (data.userType === "admin") {
        const user = await storage.getAdminUser(data.id);
        if (user) {
          done(null, { ...user, userType: "admin" as const });
        } else {
          done(null, false);
        }
      } else if (data.userType === "pos") {
        const system = await storage.getPOSSystem(data.id);
        if (system && system.status === "approved") {
          done(null, { ...system, userType: "pos" as const });
        } else {
          done(null, false);
        }
      } else {
        done(null, false);
      }
    } catch (error) {
      done(error);
    }
  });

  // Admin login endpoint
  app.post("/api/admin/login", passport.authenticate("admin-local"), (req, res) => {
    res.status(200).json(req.user);
  });

  // POS login endpoint
  app.post("/api/pos/login", passport.authenticate("pos-local"), (req, res) => {
    res.status(200).json(req.user);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
