import { get42AuthorizationUrl, handle42Callback } from '../intra42Service.js';
import User from '../Models/userModel.js';

/**
 * Initiate 42 Intra OAuth login
 * Redirects user to 42 authorization page
 */
export const loginWith42 = async (req, res) => {
    try {
        const authData = get42AuthorizationUrl();
        
        if (!authData) {
            return res.redirect('http://localhost:3000/index.html?error=42+OAuth+not+configured');
        }
        
        // Store state in session for verification
        req.session.intra42_state = authData.state;
        
        res.redirect(authData.url);
    } catch (error) {
        console.error('42 Login error:', error);
        res.redirect('http://localhost:3000/index.html?error=42+login+failed');
    }
};

/**
 * Handle 42 OAuth callback
 * Exchange code for user info and create/update user
 */
export const intra42Callback = async (req, res) => {
    try {
        console.log('📥 42 OAuth callback received');
        const { code, state } = req.query;

        // Verify state matches
        if (state !== req.session.intra42_state) {
            console.error('❌ State mismatch - possible CSRF attack');
            return res.redirect('http://localhost:3000/index.html?error=Invalid+state');
        }

        if (!code) {
            return res.redirect('http://localhost:3000/index.html?error=No+authorization+code');
        }

        // Exchange code for user info
        const result = await handle42Callback(code);

        if (!result.success) {
            return res.redirect(`http://localhost:3000/index.html?error=${encodeURIComponent(result.error)}`);
        }

        const { intraLogin, email, avatar } = result.user;

        // Check if user exists
        let user = await User.findOne({ intraLogin: intraLogin });

        if (!user) {
            // Create new user
            user = new User({
                intraLogin: intraLogin,
                email: email,
                intraAvatar: avatar,
                avatar: avatar,
                lastUpdated: new Date()
            });

            await user.save();
            console.log(`✅ New 42 user created: ${intraLogin}`);
        } else {
            // Update existing user
            user.email = email;
            user.intraAvatar = avatar;
            user.avatar = avatar;
            user.lastUpdated = new Date();

            await user.save();
            console.log(`✅ 42 user updated: ${intraLogin}`);
        }

        // Store user in session
        req.session.user = {
            id: user._id,
            intraLogin: user.intraLogin,
            email: user.email,
            avatar: user.avatar,
        };

        // Redirect to home page with success message
        res.redirect(`http://localhost:3000/index.html?login=success&user=${encodeURIComponent(intraLogin)}`);
    } catch (error) {
        console.error('❌ 42 callback error:', error);
        res.redirect('http://localhost:3000/index.html?error=Callback+failed');
    }
};

/**
 * Get current logged in user
 */
export const getCurrentUser = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Fetch full user data from database
        const user = await User.findById(req.session.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                intraLogin: user.intraLogin,
                email: user.email,
                avatar: user.avatar,
                intraAvatar: user.intraAvatar,
                codeforcesAvatar: user.codeforcesAvatar,
                codeforcesHandle: user.codeforcesHandle,
                codeforcesRating: user.codeforcesRating,
                codeforcesRank: user.codeforcesRank,
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
};

/**
 * Logout user
 */
export const logout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
};
