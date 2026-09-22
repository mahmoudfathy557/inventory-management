import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb, isDbConnected, initDatabase } from '../db/index.ts';
import { users as usersTable, appEntities as appEntitiesTable, auditLogs as auditLogsTable } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { INITIAL_USERS } from '../data/initialData.ts';
import { SEED_USERS } from '../data/seedData.ts';
import { UserRole, User } from '../types.ts';
import { RBAC_ROLE_DEFINITIONS, getEffectivePermissions } from '../utils/rbac.ts';

const router = express.Router();
const JWT_SECRET =
  process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-only-insecure-jwt-secret');
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Seed default accounts in memory or database
let inMemoryUsers = INITIAL_USERS.map((u: User) => ({
  ...u,
  passwordHash: bcrypt.hashSync('Password123!', 8),
  department: RBAC_ROLE_DEFINITIONS[u.role]?.department || 'General',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

// In-memory application state fallback if PostgreSQL is warming up or not yet configured
let inMemoryEntities: Record<string, any> = {};

// Helper: Sign JWT
function generateToken(user: any) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Middleware: Authenticate JWT Token
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No Bearer token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

// Middleware: Authorize specific User Roles (RBAC)
export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (user.role === UserRole.ADMIN || allowedRoles.includes(user.role)) {
      return next();
    }
    return res.status(403).json({
      error: `Access Denied. Role '${user.role}' lacks permissions for this operation. Required: [${allowedRoles.join(', ')}]`
    });
  };
}

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------

// POST /api/auth/register (Admin or first-time setup)
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, fullName, password, role, department } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: 'Username, email, fullName, and password are required.' });
    }

    const assignedRole = (role as UserRole) || UserRole.INVENTORY_USER;
    const db = getDb();
    const passwordHash = await bcrypt.hash(password, 10);
    const newUserId = `user-${Date.now()}`;

    if (db) {
      try {
        const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
        if (existing.length > 0) {
          return res.status(409).json({ error: 'User with this email already exists.' });
        }

        const [created] = await (db.insert(usersTable as any) as any).values({
          id: newUserId,
          username: username.toLowerCase().trim(),
          fullName,
          email: email.toLowerCase().trim(),
          passwordHash,
          role: assignedRole,
          department: department || RBAC_ROLE_DEFINITIONS[assignedRole]?.department || 'Operations',
          active: true,
          permissionOverrides: null,
        }).returning();

        const token = generateToken(created);
        const { passwordHash: _, ...safeUser } = created;
        return res.status(201).json({ user: safeUser, token, permissions: getEffectivePermissions(assignedRole) });
      } catch (dbErr: any) {
        console.warn('DB Register error, falling back to memory:', dbErr?.message);
      }
    }

    // In-memory fallback
    if (inMemoryUsers.some((u: any) => u.email === email.toLowerCase().trim())) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    const newUser = {
      id: newUserId,
      username: username.toLowerCase().trim(),
      fullName,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: assignedRole,
      department: department || RBAC_ROLE_DEFINITIONS[assignedRole]?.department || 'Operations',
      active: true,
      permissionOverrides: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    inMemoryUsers.push(newUser);
    const token = generateToken(newUser);
    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({ user: safeUser, token, permissions: getEffectivePermissions(assignedRole) });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to register user.' });
  }
});

// POST /api/auth/login (Email + Password)
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Please provide email or username, and password.' });
    }

    const normalized = emailOrUsername.toLowerCase().trim();
    const db = getDb();

    if (db) {
      try {
        const found = await db.select().from(usersTable).where(eq(usersTable.email, normalized));
        const user = found[0] || (await db.select().from(usersTable).where(eq(usersTable.username, normalized)))[0];

        if (user) {
          const isMatch = await bcrypt.compare(password, user.passwordHash);
          if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials. Please verify your email and password.' });
          }
          if (!user.active) {
            return res.status(403).json({ error: 'This account has been deactivated. Please contact an Administrator.' });
          }

          const token = generateToken(user);
          const { passwordHash: _, ...safeUser } = user;
          const role = user.role as UserRole;
          return res.json({
            user: safeUser,
            token,
            permissions: getEffectivePermissions(role, user.permissionOverrides as any),
            roleDefinition: RBAC_ROLE_DEFINITIONS[role]
          });
        }
      } catch (dbErr: any) {
        console.warn('DB Login check error, checking memory accounts:', dbErr?.message);
      }
    }

    // Check in-memory accounts (seeded with 'Password123!')
    const user = inMemoryUsers.find(
      (u: any) => u.email.toLowerCase() === normalized || u.username.toLowerCase() === normalized
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. Account not found.' });
    }

    // Also accept default demo password 'Password123!' or matching hash
    const isMatch = (password === 'Password123!') || await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password. Hint: Default password is Password123!' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;
    const role = user.role as UserRole;

    return res.json({
      user: safeUser,
      token,
      permissions: getEffectivePermissions(role, user.permissionOverrides),
      roleDefinition: RBAC_ROLE_DEFINITIONS[role]
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Login error.' });
  }
});

// GET /api/auth/me (Get current authenticated user info)
router.get('/auth/me', authenticateToken, async (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  const role = tokenUser.role as UserRole;
  return res.json({
    user: tokenUser,
    permissions: getEffectivePermissions(role),
    roleDefinition: RBAC_ROLE_DEFINITIONS[role]
  });
});

// GET /api/auth/rbac/roles (List all business roles and recommended permission matrix)
router.get('/auth/rbac/roles', (req: Request, res: Response) => {
  return res.json({
    roles: Object.values(RBAC_ROLE_DEFINITIONS),
    summary: 'Standard Enterprise ERP & Manufacturing RBAC with Separation of Duties'
  });
});

// -------------------------------------------------------------
// MASTER DATA & ENTITY STORAGE API (PostgreSQL + Drizzle)
// -------------------------------------------------------------

// GET /api/data/entities/:entityType
router.get('/data/entities/:entityType', async (req: Request, res: Response) => {
  const { entityType } = req.params;
  const db = getDb();

  if (db) {
    try {
      const result = await db.select().from(appEntitiesTable).where(eq(appEntitiesTable.entityType, entityType));
      if (result.length > 0) {
        return res.json({ entityType, data: result[0].data, source: 'postgresql' });
      }
    } catch (err: any) {
      console.warn(`Postgres read for ${entityType} failed:`, err?.message);
    }
  }

  if (inMemoryEntities[entityType] !== undefined) {
    return res.json({ entityType, data: inMemoryEntities[entityType], source: 'memory' });
  }

  return res.status(404).json({ error: `Entity '${entityType}' not found.` });
});

// POST /api/data/entities/:entityType
router.post('/data/entities/:entityType', authenticateToken, async (req: Request, res: Response) => {
  const { entityType } = req.params;
  const { data } = req.body;
  const user = (req as any).user;
  const db = getDb();

  if (db) {
    try {
      await (db.insert(appEntitiesTable as any) as any)
        .values({
          entityType,
          data,
          updatedBy: user?.fullName || 'system',
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: appEntitiesTable.entityType,
          set: {
            data,
            updatedBy: user?.fullName || 'system',
            updatedAt: new Date()
          }
        });

      return res.json({ success: true, entityType, source: 'postgresql' });
    } catch (err: any) {
      console.warn(`Postgres upsert for ${entityType} failed:`, err?.message);
    }
  }

  inMemoryEntities[entityType] = data;
  return res.json({ success: true, entityType, source: 'memory' });
});

// POST /api/data/sync-full (Sync full state snapshot to PostgreSQL)
router.post('/data/sync-full', authenticateToken, async (req: Request, res: Response) => {
  const fullState = req.body;
  const user = (req as any).user;
  const db = getDb();

  if (!fullState || typeof fullState !== 'object') {
    return res.status(400).json({ error: 'Invalid state object.' });
  }

  const entries = Object.entries(fullState);
  let savedToDb = 0;

  if (db) {
    try {
      for (const [key, value] of entries) {
        await (db.insert(appEntitiesTable as any) as any)
          .values({
            entityType: key,
            data: value as any,
            updatedBy: user?.fullName || 'system',
            updatedAt: new Date()
          })
          .onConflictDoUpdate({
            target: appEntitiesTable.entityType,
            set: {
              data: value as any,
              updatedBy: user?.fullName || 'system',
              updatedAt: new Date()
            }
          });
        savedToDb++;
      }
    } catch (err: any) {
      console.warn('DB sync-full error:', err?.message);
    }
  }

  // Also update memory fallback
  inMemoryEntities = { ...inMemoryEntities, ...fullState };

  return res.json({
    success: true,
    message: 'Full ERP state synchronized successfully.',
    totalEntities: entries.length,
    savedToPostgres: savedToDb,
    isPostgresConnected: isDbConnected(),
  });
});

// POST /api/data/reset-scratch (Wipes all inventory and transaction data, preserving only users)
router.post('/data/reset-scratch', authenticateToken, async (req: Request, res: Response) => {
  const db = getDb();
  if (db && isDbConnected()) {
    try {
      await db.delete(appEntitiesTable);
      await db.delete(auditLogsTable);
    } catch (err: any) {
      console.warn('DB reset-scratch error:', err?.message);
    }
  }
  inMemoryEntities = {
    rawMaterials: [],
    products: [],
    boms: [],
    machines: [],
    suppliers: [],
    customers: [],
    receipts: [],
    landedCosts: [],
    issues: [],
    transfers: [],
    productionOrders: [],
    materialIssues: [],
    productionReceipts: [],
    customerDeliveries: [],
    costAdjustments: [],
    ledgerEntries: [],
    auditLogs: []
  };

  return res.json({
    success: true,
    message: 'All inventory, production, and transaction data cleared. Users preserved.',
    isPostgresConnected: isDbConnected()
  });
});

// POST /api/seed (Seed 100% coverage dataset into database)
router.post('/seed', async (req: Request, res: Response) => {
  const db = getDb();
  let seededUsersCount = 0;

  if (db && isDbConnected()) {
    try {
      for (const u of SEED_USERS) {
        const passwordHash = bcrypt.hashSync('Password123!', 8);
        await (db.insert(usersTable as any) as any)
          .values({
            id: u.id,
            username: u.username,
            fullName: u.fullName,
            email: u.email,
            passwordHash,
            role: u.role,
            department: RBAC_ROLE_DEFINITIONS[u.role]?.department || 'Operations',
            active: true
          })
          .onConflictDoUpdate({
            target: usersTable.email,
            set: {
              fullName: u.fullName,
              role: u.role,
              updatedAt: new Date()
            }
          });
        seededUsersCount++;
      }
    } catch (err: any) {
      console.warn('DB Seed error:', err?.message);
    }
  }

  // Refresh in-memory users with 100% seed accounts
  inMemoryUsers = SEED_USERS.map((u: User) => ({
    ...u,
    passwordHash: bcrypt.hashSync('Password123!', 8),
    department: RBAC_ROLE_DEFINITIONS[u.role]?.department || 'General',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  return res.json({
    success: true,
    message: '100% Seed coverage loaded successfully.',
    totalAccounts: inMemoryUsers.length,
    rolesCovered: Object.keys(RBAC_ROLE_DEFINITIONS),
    users: inMemoryUsers.map(({ passwordHash, ...safe }) => safe)
  });
});

// GET /api/status (Health check & architecture info)
router.get('/status', (req: Request, res: Response) => {
  return res.json({
    status: 'online',
    service: 'Inventory & Production Control API Server',
    database: {
      type: 'PostgreSQL 16 with Drizzle ORM',
      connected: isDbConnected(),
      configured: !!process.env.DATABASE_URL
    },
    auth: {
      mechanism: 'JWT (JSON Web Token) with bcrypt password hashing',
      rbacEnabled: true,
      rolesSupported: Object.keys(RBAC_ROLE_DEFINITIONS)
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
