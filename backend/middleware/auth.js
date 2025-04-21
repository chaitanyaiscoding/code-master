import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  try {
    // Get token from Authorization header: "Bearer <token>"
    const token = req.headers.authorization?.split(" ")[1];

    // If no token, block access
    if (!token) return res.status(401).json({ message: 'Unauthorized - No token provided' });

    // Verify token with secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user data to request
    req.user = decoded;

    // Go to the actual route
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default auth;