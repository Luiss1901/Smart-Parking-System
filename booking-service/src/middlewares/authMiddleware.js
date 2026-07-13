const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "smart-parking-secret";

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Invalid token format' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Failed to authenticate token' });
        }
        req.user = decoded; // { id, email, role }
        next();
    });
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Require Admin Role' });
    }
    next();
};

module.exports = {
    verifyToken,
    requireAdmin
};
