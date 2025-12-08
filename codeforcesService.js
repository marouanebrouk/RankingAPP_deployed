import axios from 'axios';

const CODEFORCES_API_BASE = 'https://codeforces.com/api';

/**
 * Fetches user information from Codeforces API
 * @param {string} handle - Codeforces username
 * @returns {Promise<Object>} User data including rating and rank
 */
export const getCodeforcesUserInfo = async (handle) => {
    try {
        const response = await axios.get(`${CODEFORCES_API_BASE}/user.info`, {
            params: { handles: handle }
        });

        if (response.data.status !== 'OK') {
            throw new Error('Invalid response from Codeforces API');
        }

        const user = response.data.result[0];
        
        return {
            handle: user.handle,
            rating: user.rating || 0,
            rank: user.rank || 'unrated',
            maxRating: user.maxRating || 0,
            maxRank: user.maxRank || 'unrated',
            avatar: user.avatar ||  '',
            titlephoto: user.titlePhoto || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            country: user.country || '',
            organization: user.organization || ''
        };
    } catch (error) {
        if (error.response?.data?.comment) {
            throw new Error(`Codeforces API: ${error.response.data.comment}`);
        }
        throw new Error('Failed to fetch Codeforces user data');
    }
};

/**
 * Validates if a Codeforces handle exists
 * @param {string} handle - Codeforces username to validate
 * @returns {Promise<boolean>} True if handle exists
 */
export const validateCodeforcesHandle = async (handle) => {
    try {
        await getCodeforcesUserInfo(handle);
        return true;
    } catch (error) {
        return false;
    }
};

/**
 * Fetches user's recent contest participation
 * @param {string} handle - Codeforces username
 * @returns {Promise<Array>} List of contests
 */
export const getUserRatingHistory = async (handle) => {
    try {
        const response = await axios.get(`${CODEFORCES_API_BASE}/user.rating`, {
            params: { handle }
        });

        if (response.data.status !== 'OK') {
            throw new Error('Invalid response from Codeforces API');
        }

        return response.data.result;
    } catch (error) {
        throw new Error('Failed to fetch rating history');
    }
};
