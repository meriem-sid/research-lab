const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token = null;

    // Try Authorization header first (backward compatibility)
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // Fall back to httpOnly cookie
    if (!token && req.cookies?.authToken) {
      token = req.cookies.authToken;
    }

    if (!token) {
      res.status(401);
      throw new Error("Not authorised: missing token");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      res.status(401);
      throw new Error("Not authorised: user not found");
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error("Account is deactivated");
    }

    if (user.authStatus !== "approved") {
      res.status(403);
      throw new Error("Account is not approved");
    }

    req.user = user;
    next();
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) {
      res.status(401);
    }

    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(new Error("Not authorised: invalid or expired token"));
    }

    return next(error);
  }
};

const authorise = (...roles) => (req, res, next) => {
  if (!req.user) {
    res.status(401);
    return next(new Error("Not authorised"));
  }

  if (!roles.includes(req.user.role)) {
    res.status(403);
    return next(new Error("Forbidden: insufficient permissions"));
  }

  return next();
};

module.exports = {
  protect,
  authorise,
};
