import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { mongoStorage } from "./mongodb-storage";
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
    // Using memory store for sessions in development - in production use a proper session store
    // store: new MemoryStore(),
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

  passport.use(
    "admin",
    new LocalStrategy(async (username, password, done) => {
      try {
        const adminUser = await mongoStorage.getAdminUserByUsername(username);
        if (!adminUser) {
          return done(null, false, { message: "Invalid username or password" });
        }

        const isValid = await comparePasswords(password, adminUser.password);
        if (!isValid) {
          return done(null, false, { message: "Invalid username or password" });
        }

        return done(null, {
          id: adminUser.id,
          username: adminUser.username,
          userType: "admin",
        });
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.use(
    "pos",
    new LocalStrategy(async (username, password, done) => {
      try {
        const posSystem = await mongoStorage.getPOSSystemByUsername(username);
        if (!posSystem) {
          return done(null, false, { message: "Invalid username or password" });
        }

        if (posSystem.status !== "approved") {
          return done(null, false, { message: "POS system not approved" });
        }

        const isValid = await comparePasswords(password, posSystem.password);
        if (!isValid) {
          return done(null, false, { message: "Invalid username or password" });
        }

        return done(null, {
          id: posSystem.id,
          username: posSystem.username,
          businessName: posSystem.businessName,
          userType: "pos",
        });
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, { id: user.id, userType: user.userType });
  });

  passport.deserializeUser(async (data: any, done) => {
    try {
      await mongoStorage.connect();
      if (data.userType === "admin") {
        const user = await mongoStorage.getAdminUser(data.id);
        if (user) {
          done(null, { ...user, userType: "admin" as const });
        } else {
          done(null, false);
        }
      } else if (data.userType === "pos") {
        const system = await mongoStorage.getPOSSystem(data.id);
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

  app.post("/api/admin/login", passport.authenticate("admin"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/pos/login", passport.authenticate("pos"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}