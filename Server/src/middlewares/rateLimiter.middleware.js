import rateLimit from "express-rate-limit";

// 1. Authentication Limiters
export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: { success: false, message: "Too many login attempts from this IP. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

export const registerRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 account creations per hour
    message: { success: false, message: "Too many accounts created from this IP. Please try again after an hour." },
    standardHeaders: true,
    legacyHeaders: false,
});

export const passwordResetRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 requests per hour
    message: { success: false, message: "Too many password reset requests from this IP. Please try again after an hour." },
    standardHeaders: true,
    legacyHeaders: false,
});

// 2. Financial & Payment Transaction Limiters
export const donationRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 donation attempts per 15 minutes
    message: { success: false, message: "Too many donation requests from this connection. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

// 3. Disk I/O & Cloud Upload Limiters
export const uploadRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP/User to 5 uploads/profile updates per 15 minutes
    message: { success: false, message: "Too many file upload requests. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

// 4. Public Content Creation & Interaction Limiters
export const contentCreationRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP/User to 10 campaign/post creations per hour
    message: { success: false, message: "Too many post or campaign creation requests. Please try again after an hour." },
    standardHeaders: true,
    legacyHeaders: false,
});

export const interactionRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // limit each IP/User to 30 social interactions (likes/comments/follows) per 15 minutes
    message: { success: false, message: "Too many social interactions. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

// 5. Heavy Database Query Limiters
export const heavyQueryRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 45, // limit each IP/User to 45 feed/leaderboard requests per 15 minutes
    message: { success: false, message: "System is experiencing high load from this client. Please slow down requests." },
    standardHeaders: true,
    legacyHeaders: false,
});

// 6. Global Fallback Limiter (General API Protection)
export const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // limit each IP to 150 requests per 15 minutes
    message: { success: false, message: "Too many requests from this IP. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});