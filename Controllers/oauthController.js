import { getAuthorizationUrl, handleCallback } from '../oauthService.js';
import { getCodeforcesUserInfo } from '../codeforcesService.js';
import User from '../Models/userModel.js';

/**
 * Initiate Codeforces OAuth login
 * Redirects user to Codeforces authorization page
 */
export const loginWithCodeforces = async (req, res) => {
    try {
        const authData = await getAuthorizationUrl();
        
        if (!authData) {
            return res.redirect('https://rankingapp-tb5t.onrender.com/index.html?error=OAuth+not+available');
        }
        
        // Store PKCE verifier and state in session
        req.session.code_verifier = authData.code_verifier;
        req.session.state = authData.state;
        
        res.redirect(authData.url);
    } catch (error) {
        console.error('Login error:', error);
        res.redirect('https://rankingapp-tb5t.onrender.com/index.html?error=OAuth+discovery+failed+-+feature+may+not+be+available');
    }
};

/**
 * Handle OAuth callback from Codeforces
 * Exchange code for user info and create/update user
 */
export const codeforcesCallback = async (req, res) => {
    try {
        console.log('📥 OAuth callback received');
        console.log('   Query params:', req.query);
        console.log('   Session data:', {
            has_code_verifier: !!req.session.code_verifier,
            has_state: !!req.session.state
        });
        
        // Handle OAuth callback with session data
        const sessionData = {
            code_verifier: req.session.code_verifier,
            state: req.session.state
        };
        
        // Check if user is logged in with 42 first
        if (!req.session.user) {
            return res.redirect('https://rankingapp-tb5t.onrender.com/index.html?error=You+must+login+with+42+first');
        }

        const result = await handleCallback(req.query, sessionData);

        if (!result.success) {
            return res.redirect(`https://rankingapp-tb5t.onrender.com/index.html?error=${encodeURIComponent(result.error)}`);
        }

        const { handle } = result.user;

        // Fetch full Codeforces data
        const cfData = await getCodeforcesUserInfo(handle);

        // Update the existing 42 user with Codeforces data
        const user = await User.findById(req.session.user.id);
        
        if (!user) {
            return res.redirect('https://rankingapp-tb5t.onrender.com/index.html?error=User+not+found');
        }

        // Link Codeforces account
        user.codeforcesHandle = cfData.handle;
        user.codeforcesRating = cfData.rating;
        user.codeforcesRank = cfData.rank;
        user.codeforcesMaxRating = cfData.maxRating;
        user.codeforcesMaxRank = cfData.maxRank;
        user.country = cfData.country || user.country;
        user.codeforcesAvatar = cfData.avatar;
        user.titlephoto = cfData.titlePhoto;
        user.organization = cfData.organization;
        user.lastUpdated = new Date();

        await user.save();
        console.log(`✅ Codeforces account ${handle} linked to 42 user ${user.intraLogin}`);

        // Update session
        req.session.user.codeforcesHandle = user.codeforcesHandle;
        req.session.user.codeforcesRating = user.codeforcesRating;
        req.session.user.codeforcesRank = user.codeforcesRank;

        // Redirect to frontend with success
        res.redirect(`https://rankingapp-tb5t.onrender.com/index.html?login=success&user=${handle}`);
    } catch (error) {
        console.error('Callback error:', error);
        res.redirect(`https://rankingapp-tb5t.onrender.com/index.html?error=${encodeURIComponent('Authentication failed')}`);
    }
};

/**
 * Get current logged-in user
 */
export const getCurrentUser = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            authenticated: true,
            user: {
                handle: user.codeforcesHandle,
                rating: user.codeforcesRating,
                rank: user.codeforcesRank,
                maxRating: user.codeforcesMaxRating,
                maxRank: user.codeforcesMaxRank,
                country: user.country,
                avatar: user.avatar,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
};

/**
 * Logout user
 */
export const logout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logged out successfully' });
    });
};
