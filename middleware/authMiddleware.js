const jwt = require("jsonwebtoken");
const { User, Role, AuditLog } = require("../models");

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
    console.error("Failed to create audit log:", error.message);
  }
};

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized. Missing bearer token." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.sub, {
      include: [{ model: Role, as: "role" }],
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized." });
  }
};

const restrictTo = (...roles) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (!roles.includes(req.user.role.name)) {
      await createAuditEntry({
        actorUserId: req.user.id,
        action: "RBAC_ACCESS_DENIED",
        entityType: "Authorization",
        entityId: req.user.id,
        metadata: {
          role: req.user.role.name,
          allowedRoles: roles,
          method: req.method,
          path: req.originalUrl,
        },
      });

      return res.status(403).json({ message: "Forbidden." });
    }

    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
