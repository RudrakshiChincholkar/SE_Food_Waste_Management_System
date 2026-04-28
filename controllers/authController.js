const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Role, AuditLog } = require("../models");

const WEB_TOKEN_EXPIRY = "1h";
const MOBILE_TOKEN_EXPIRY = "8h";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 30;
const NIL_UUID = "00000000-0000-0000-0000-000000000000";

const createAuditEntry = async ({
  actorUserId = null,
  action,
  entityType,
  entityId,
  metadata = null,
}) => {
  try {
    await AuditLog.create({
      actorUserId,
      action,
      entityType,
      entityId,
      metadata,
    });
  } catch (error) {
    // Audit failure should never block auth flow.
    console.error("Failed to create audit log:", error.message);
  }
};

const registerUser = async ({ fullName, email, password, phone, roleId, roleName }) => {
  if (!fullName || !email || !password || (!roleId && !roleName)) {
    const error = new Error("fullName, email, password, and roleId/roleName are required.");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    const error = new Error("Email is already registered.");
    error.statusCode = 409;
    throw error;
  }

  let role;
  if (roleId) {
    role = await Role.findByPk(roleId);
  } else {
    // Force the incoming roleName to uppercase before searching
    role = await Role.findOne({ where: { name: roleName.toUpperCase() } });
  }

  if (!role) {
    const error = new Error("Invalid role provided.");
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    fullName,
    email,
    passwordHash,
    phone: phone || null,
    roleId: role.id,
    isActive: true,
  });

  await createAuditEntry({
    actorUserId: user.id,
    action: "USER_REGISTERED",
    entityType: "User",
    entityId: user.id,
    metadata: {
      email: user.email,
      role: role.name,
    },
  });

  return { user, role };
};

const register = async (req, res) => {
  try {
    const { user, role } = await registerUser(req.body);

    return res.status(201).json({
      message: "Registration successful.",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: role.name,
      },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, clientType = "web" } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: "role" }],
    });

    if (!user) {
      await createAuditEntry({
        action: "LOGIN_FAILED_UNKNOWN_USER",
        entityType: "Auth",
        entityId: NIL_UUID,
        metadata: {
          email,
          reason: "USER_NOT_FOUND",
          ip: req.ip,
        },
      });
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const now = new Date();
    if (user.lockoutUntil && user.lockoutUntil > now) {
      await createAuditEntry({
        actorUserId: user.id,
        action: "LOGIN_BLOCKED_LOCKOUT",
        entityType: "User",
        entityId: user.id,
        metadata: {
          lockoutUntil: user.lockoutUntil,
          ip: req.ip,
        },
      });
      return res.status(401).json({
        message: "Account is temporarily locked. Try again later.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      const newFailedAttempts = (user.failedAttempts || 0) + 1;
      const updates = { failedAttempts: newFailedAttempts };
      let lockoutTriggered = false;

      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        updates.lockoutUntil = new Date(
          now.getTime() + LOCKOUT_WINDOW_MINUTES * 60 * 1000
        );
        updates.failedAttempts = 0;
        lockoutTriggered = true;
      }

      await user.update(updates);

      await createAuditEntry({
        actorUserId: user.id,
        action: lockoutTriggered ? "LOGIN_LOCKOUT_TRIGGERED" : "LOGIN_FAILED",
        entityType: "User",
        entityId: user.id,
        metadata: {
          failedAttempts: newFailedAttempts,
          lockoutUntil: updates.lockoutUntil || null,
          ip: req.ip,
        },
      });

      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (!user.isActive) {
      await createAuditEntry({
        actorUserId: user.id,
        action: "LOGIN_FAILED_INACTIVE_ACCOUNT",
        entityType: "User",
        entityId: user.id,
        metadata: { ip: req.ip },
      });
      return res.status(401).json({ message: "Invalid credentials." });
    }

    await user.update({
      failedAttempts: 0,
      lockoutUntil: null,
    });

    const expiresIn = clientType === "mobile" ? MOBILE_TOKEN_EXPIRY : WEB_TOKEN_EXPIRY;
    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role ? user.role.name : null,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    await createAuditEntry({
      actorUserId: user.id,
      action: "LOGIN_SUCCESS",
      entityType: "User",
      entityId: user.id,
      metadata: {
        clientType,
        tokenExpiry: expiresIn,
        ip: req.ip,
      },
    });

    return res.status(200).json({
      message: "Login successful.",
      token,
      expiresIn,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role ? user.role.name : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  registerUser,
};
