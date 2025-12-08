/**
 * Middleware to check if user is authenticated with 42 Intra
 */
export const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ 
            error: 'Authentication required', 
            message: 'You must login with 42 Intra to access this resource'
        });
    }
    next();
};

/**
 * Middleware to check if user has linked their Codeforces account
 */
export const requireCodeforces = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ 
            error: 'Authentication required'
        });
    }
    
    if (!req.session.user.codeforcesHandle) {
        return res.status(403).json({ 
            error: 'Codeforces account not linked',
            message: 'Please link your Codeforces account to access rankings'
        });
    }
    next();
};
