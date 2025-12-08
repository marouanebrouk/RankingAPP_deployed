import User from '../Models/userModel.js';
import { getCodeforcesUserInfo } from '../codeforcesService.js';

export const addUser = async (req, res) => {
    try {
        const { codeforcesHandle } = req.body;

        if (!codeforcesHandle) {
            return res.status(400).json({ error: 'Codeforces handle is required' });
        }

        const existingUser = await User.findOne({ codeforcesHandle });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this handle already exists' });
        }
        
        if (!(await getCodeforcesUserInfo(codeforcesHandle))) {
            return res.status(404).json({ error: 'Codeforces handle not found' });
        }
        const cfData = await getCodeforcesUserInfo(codeforcesHandle);

        const newUser = new User({
            codeforcesHandle: cfData.handle,
            codeforcesRating: cfData.rating,
            codeforcesRank: cfData.rank,
            codeforcesMaxRating: cfData.maxRating,
            codeforcesMaxRank: cfData.maxRank,
            country: cfData.country,
            avatar: cfData.avatar,
            titlephoto: cfData.titlephoto,
            firstName: cfData.firstName,
            lastName: cfData.lastName,
            organization: cfData.organization,
            lastUpdated: new Date()
        });

        await newUser.save();
        res.status(201).json({
            message: 'User added successfully',
            user: {
                handle: newUser.codeforcesHandle,
                rating: newUser.codeforcesRating,
                rank: newUser.codeforcesRank,
                maxRating: newUser.codeforcesMaxRating,
                maxRank: newUser.codeforcesMaxRank,
                country: newUser.country,
                avatar: newUser.avatar,
                titlephoto: newUser.titlephoto,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                lastUpdated: newUser.lastUpdated
            }
        });
        console.log(`➕ Added new user: ${codeforcesHandle}`);
    } catch (error) {
        console.error('Add user error:', error);
        res.status(500).json({ error: error.message || 'Failed to add user' });
    }
};
