import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  const token = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      success: false,
      message: "Server authentication configuration is missing",
    });
  }

  try {
    const decodedToken = jwt.verify(token, jwtSecret);

    if (
      typeof decodedToken === "string" ||
      !decodedToken.userId
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    req.user = {
      id: Number(decodedToken.userId),
      email: decodedToken.email,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}