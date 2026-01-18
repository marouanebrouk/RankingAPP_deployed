import axios from 'axios';
import { URLSearchParams } from "url";

const INTRA_42_CONFIG = {
    authorization_endpoint: 'https://api.intra.42.fr/oauth/authorize',
    token_endpoint: 'https://api.intra.42.fr/oauth/token',
    userinfo_endpoint: 'https://api.intra.42.fr/v2/me',
};

/**
 * Generate 42 authorization URL
 */
export const get42AuthorizationUrl = () => {
    const clientId = process.env.INTRA_42_CLIENT_ID;
    const callbackUrl = process.env.INTRA_42_CALLBACK_URL;

    if (!clientId || !callbackUrl) {
        console.error('❌ 42 Intra OAuth credentials not configured');
        return null;
    }

    // Generate random state for CSRF protection
    const state = generateRandomState();

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: 'code',
        scope: 'public',
        state: state,
    });

    const authUrl = `${INTRA_42_CONFIG.authorization_endpoint}?${params.toString()}`;

    return {
        url: authUrl,
        state: state
    };
};

/**
 * Exchange authorization code for access token and get user info
 */
export const handle42Callback = async (code) => {
    try {
        const clientId = process.env.INTRA_42_CLIENT_ID;
        const clientSecret = process.env.INTRA_42_CLIENT_SECRET;
        const callbackUrl = process.env.INTRA_42_CALLBACK_URL;

        console.log('🔄 Exchanging 42 authorization code for token...');

        // Exchange code for access token
        // 42 API requires form-urlencoded, not JSON
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: callbackUrl,
        });

        const tokenResponse = await axios.post(
            INTRA_42_CONFIG.token_endpoint,
            params,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const { access_token } = tokenResponse.data;
        console.log('✅ 42 Access token received');

        // Get user info from 42 API
        console.log('🔄 Fetching 42 user info...');
        const userResponse = await axios.get(INTRA_42_CONFIG.userinfo_endpoint, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const userData = userResponse.data;
        console.log('✅ 42 User info received:', userData.login);

        return {
            success: true,
            user: {
                intraLogin: userData.login,
                email: userData.email,
                avatar: userData.image?.versions?.medium || userData.image?.link,
            },
            accessToken: access_token
        };
    } catch (error) {
        console.error('❌ 42 OAuth callback error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error_description || error.message
        };
    }
};

/**
 * Generate random state for CSRF protection
 */
function generateRandomState() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
