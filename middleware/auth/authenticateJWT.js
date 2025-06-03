// middleware/auth.js
import jwt from 'jsonwebtoken';

export const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }

            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

export const optionalAuthenticateJWT = (req, res, next) => {
    console.log('optionalAuthenticateJWT middleware called');
    const authHeader = req.headers.authorization;

    if (authHeader) {
        console.log('Authorization header found:', authHeader);
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (!err) {
                console.log('JWT verified successfully');
                req.user = user;
            } else {
                console.log('JWT verification failed:', err.message);
            }
        });
    } else {
        console.log('No authorization header found');
    }

    next();
};