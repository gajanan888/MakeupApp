export const rateLimiter = (options = {}) => {
  const limit = options.limit || 5;
  const windowMs = options.windowMs || 60000;
  
  const store = new Map();

  return (req, res, next) => {
    // Determine user ID (from customer or artist)
    const userId = req.customer?.id || req.artist?.id || req.ip;
    if (!userId) {
      return next(); // Should be authenticated, but fallback if not
    }

    const now = Date.now();
    
    // Clear old entries periodically to prevent memory leak
    if (store.size > 1000) {
      for (const [key, val] of store.entries()) {
        if (now - val.startTime > windowMs) {
          store.delete(key);
        }
      }
    }

    if (!store.has(userId)) {
      store.set(userId, { count: 1, startTime: now });
      return next();
    }

    const userRecord = store.get(userId);

    // If window expired, reset
    if (now - userRecord.startTime > windowMs) {
      userRecord.count = 1;
      userRecord.startTime = now;
      return next();
    }

    userRecord.count++;

    if (userRecord.count > limit) {
      return res.status(429).json({
        success: false,
        message: "Too many payment requests, please try again later.",
      });
    }

    next();
  };
};
