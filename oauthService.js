import * as client from 'openid-client';
import axios from 'axios';

let codeforcesClient = null;

/**
 * Initialize Codeforces OAuth using OIDC discovery
 */
export const initCodeforcesOAuth = async () => {
    try {
        const CF_CLIENT_ID = process.env.CF_CLIENT_ID;
        const CF_CLIENT_SECRET = process.env.CF_CLIENT_SECRET;

        if (!CF_CLIENT_ID || !CF_CLIENT_SECRET) {
            console.warn('⚠️  Codeforces OAuth credentials not configured');
            return null;
        }

        console.log('🔍 Discovering Codeforces OpenID configuration...');
        
        // Discover the OAuth configuration from Codeforces
        const discoveryUrl = 'https://codeforces.com/.well-known/openid-configuration';
        const config = await client.discovery(
            new URL(discoveryUrl),
            CF_CLIENT_ID,
            CF_CLIENT_SECRET
        );
        
        codeforcesClient = config;
        
        const metadata = config.serverMetadata();
        console.log('✅ Codeforces OAuth client initialized via discovery');
        console.log('   Issuer:', metadata.issuer);
        console.log('   Authorization:', metadata.authorization_endpoint);
        console.log('   Token:', metadata.token_endpoint);
        
        return codeforcesClient;
    } catch (error) {
        console.error('❌ Failed to initialize Codeforces OAuth:', error.message);
        console.error('   Full error:', error);
        return null;
    }
};

/**
 * Generate authorization URL with PKCE (without state parameter)
 */
export const getAuthorizationUrl = async () => {
    if (!codeforcesClient) {
        await initCodeforcesOAuth();
    }
    
    if (!codeforcesClient) {
        return null;
    }
    
    const CF_CALLBACK_URL = process.env.CF_CALLBACK_URL;

    const code_verifier = client.randomPKCECodeVerifier();
    const code_challenge = await client.calculatePKCECodeChallenge(code_verifier);

    // Don't use state parameter - openid-client has issues with it for Codeforces
    const authorizationUrl = client.buildAuthorizationUrl(codeforcesClient, {
        redirect_uri: CF_CALLBACK_URL,
        scope: 'openid',
        code_challenge,
        code_challenge_method: 'S256',
    });
    
    return {
        url: authorizationUrl.href,
        code_verifier,
        state: null
    };
};

/**
 * Exchange authorization code for tokens and get user info
 */
export const handleCallback = async (callbackParams, sessionData) => {
    try {
        if (!codeforcesClient) {
            await initCodeforcesOAuth();
        }

        if (!codeforcesClient) {
            throw new Error('OAuth not configured');
        }

        const { code, state } = callbackParams;

        if (!code) {
            throw new Error('No authorization code received');
        }

        const CF_CALLBACK_URL = process.env.CF_CALLBACK_URL;

        console.log('🔄 Exchanging authorization code for tokens...');
        console.log('   Code received:', code ? 'yes' : 'no');
        
        // Build the current callback URL with only the code parameter (no state)
        const currentUrl = new URL(CF_CALLBACK_URL);
        currentUrl.searchParams.set('code', code);
        
        // Exchange code for tokens using openid-client
        const tokens = await client.authorizationCodeGrant(
            codeforcesClient,
            currentUrl,
            {
                pkceCodeVerifier: sessionData.code_verifier,
            }
        );

        console.log('✅ Tokens received');

        // Get claims from ID token
        const claims = tokens.claims();
        console.log('✅ ID token claims:', claims);

        // Extract user data from claims
        const handle = claims.handle || claims.sub;

        if (!handle) {
            throw new Error('Could not extract user handle from OAuth response');
        }

        return {
            success: true,
            user: {
                handle: handle,
                avatar: claims.avatar,
                rating: claims.rating,
            },
            accessToken: tokens.access_token
        };
    } catch (error) {
        console.error('❌ OAuth callback error:', error.message);
        console.error('   Full error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};
