import User from '../Models/userModel.js';
import { getCodeforcesUserInfo } from '../codeforcesService.js';

/**
 * Get all users ranked by Codeforces rating (with live update)
 */
export const getRankings = async (req, res) => {
    try {
        console.log('📊 Fetching rankings...');
        
        // Get all users from database who have linked Codeforces
        const users = await User.find({ codeforcesHandle: { $exists: true, $ne: null, $ne: '' } });

        if (users.length === 0) {
            return res.json({
                message: 'No users with linked Codeforces accounts',
                totalUsers: 0,
                rankings: []
            });
        }

        console.log(`🔄 Updating ${users.length} users from Codeforces API...`);

        // Update each user's rating from Codeforces API
        const updatedUsers = [];
        
        for (const user of users) {
            try {
                const cfData = await getCodeforcesUserInfo(user.codeforcesHandle);
                
                // Update user in database
                user.codeforcesRating = cfData.rating;
                user.codeforcesRank = cfData.rank;
                user.codeforcesMaxRating = cfData.maxRating;
                user.codeforcesMaxRank = cfData.maxRank;
                user.country = cfData.country;
                user.codeforcesAvatar = cfData.avatar;
                user.titlephoto = cfData.titlephoto;
                user.organization = cfData.organization;
                user.firstName = cfData.firstName;
                user.lastName = cfData.lastName;
                user.lastUpdated = new Date();
                
                await user.save();
                
                updatedUsers.push({
                    intraLogin: user.intraLogin,
                    handle: user.codeforcesHandle,
                    rating: user.codeforcesRating,
                    rank: user.codeforcesRank,
                    maxRating: user.codeforcesMaxRating,
                    maxRank: user.codeforcesMaxRank,
                    country: user.country,
                    name: `${user.firstName} ${user.lastName}`.trim() || user.codeforcesHandle,
                    codeforcesAvatar: user.codeforcesAvatar,
                    titlephoto: user.titlephoto,
                    lastUpdated: user.lastUpdated
                });
                

                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.error(`❌ Failed to update ${user.codeforcesHandle}:`, error.message);
                // Keep user with old data if update fails
                updatedUsers.push({
                    intraLogin: user.intraLogin,
                    handle: user.codeforcesHandle,
                    rating: user.codeforcesRating,
                    rank: user.codeforcesRank,
                    maxRating: user.codeforcesMaxRating,
                    maxRank: user.codeforcesMaxRank,
                    country: user.country,
                    name: `${user.firstName} ${user.lastName}`.trim() || user.codeforcesHandle,
                    codeforcesAvatar: user.codeforcesAvatar,
                    titlephoto: user.titlephoto,
                    lastUpdated: user.lastUpdated,
                    updateError: true
                });
            }
        }

        updatedUsers.sort((a, b) => b.rating - a.rating);

        // Add positions
        const rankings = updatedUsers.map((user, index) => ({
            position: index + 1,
            ...user
        }));

        console.log('✅ Rankings updated successfully!');

        res.json({
            message: 'Rankings updated from Codeforces API',
            totalUsers: rankings.length,
            rankings
        });
    } catch (error) {
        console.error('Get rankings error:', error);
        res.status(500).json({ error: 'Failed to fetch rankings' });
    }
};



// not for now;

// /**
//  * Get top N users by rating
//  */
// export const getTopUsers = async (req, res) => {
//     try {
//         const limit = parseInt(req.query.limit) || 10;

//         const users = await User.find({ codeforcesHandle: { $exists: true, $ne: null } })
//             .select('first_name last_name email codeforcesHandle codeforcesRating codeforcesRank codeforcesMaxRating codeforcesMaxRank lastUpdated')
//             .sort({ codeforcesRating: -1 })
//             .limit(limit)
//             .lean();

//         const topUsers = users.map((user, index) => ({
//             position: index + 1,
//             name: `${user.first_name} ${user.last_name}`,
//             email: user.email,
//             codeforcesHandle: user.codeforcesHandle,
//             rating: user.codeforcesRating || 0,
//             rank: user.codeforcesRank || 'unrated',
//             maxRating: user.codeforcesMaxRating || 0,
//             maxRank: user.codeforcesMaxRank || 'unrated',
//             lastUpdated: user.lastUpdated
//         }));

//         res.json({
//             totalUsers: topUsers.length,
//             topUsers
//         });
//     } catch (error) {
//         console.error('Get top users error:', error);
//         res.status(500).json({ error: 'Failed to fetch top users' });
//     }
// };

// /**
//  * Get user's ranking position
//  */
// export const getUserRanking = async (req, res) => {
//     try {
//         const userId = req.session.userId;

//         if (!userId) {
//             return res.status(401).json({ error: 'User not authenticated' });
//         }

//         const user = await User.findById(userId);
//         if (!user || !user.codeforcesHandle) {
//             return res.status(400).json({ error: 'No Codeforces account linked' });
//         }

//         // Count users with higher rating
//         const higherRankedCount = await User.countDocuments({
//             codeforcesHandle: { $exists: true, $ne: null },
//             codeforcesRating: { $gt: user.codeforcesRating }
//         });

//         const position = higherRankedCount + 1;

//         // Get total users with Codeforces linked
//         const totalUsers = await User.countDocuments({
//             codeforcesHandle: { $exists: true, $ne: null }
//         });

//         res.json({
//             user: {
//                 name: `${user.first_name} ${user.last_name}`,
//                 email: user.email,
//                 codeforcesHandle: user.codeforcesHandle,
//                 rating: user.codeforcesRating,
//                 rank: user.codeforcesRank,
//                 maxRating: user.codeforcesMaxRating,
//                 maxRank: user.codeforcesMaxRank
//             },
//             ranking: {
//                 position,
//                 totalUsers,
//                 percentile: totalUsers > 0 ? ((totalUsers - position + 1) / totalUsers * 100).toFixed(2) : 0
//             }
//         });
//     } catch (error) {
//         console.error('Get user ranking error:', error);
//         res.status(500).json({ error: 'Failed to fetch user ranking' });
//     }
// };

// /**
//  * Refresh all users' Codeforces data (admin function)
//  */
// export const refreshAllRatings = async (req, res) => {
//     try {
//         const users = await User.find({ codeforcesHandle: { $exists: true, $ne: null } });

//         let successCount = 0;
//         let errorCount = 0;

//         for (const user of users) {
//             try {
//                 const cfData = await getCodeforcesUserInfo(user.codeforcesHandle);
                
//                 user.codeforcesRating = cfData.rating;
//                 user.codeforcesRank = cfData.rank;
//                 user.codeforcesMaxRating = cfData.maxRating;
//                 user.codeforcesMaxRank = cfData.maxRank;
//                 user.lastUpdated = new Date();
                
//                 await user.save();
//                 successCount++;
                
//                 // Add delay to avoid API rate limiting
//                 await new Promise(resolve => setTimeout(resolve, 500));
//             } catch (error) {
//                 console.error(`Failed to update user ${user.codeforcesHandle}:`, error.message);
//                 errorCount++;
//             }
//         }

//         res.json({
//             message: 'Refresh completed',
//             successCount,
//             errorCount,
//             totalUsers: users.length
//         });
//     } catch (error) {
//         console.error('Refresh all ratings error:', error);
//         res.status(500).json({ error: 'Failed to refresh ratings' });
//     }
// };
