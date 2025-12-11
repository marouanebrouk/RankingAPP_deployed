import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    // 42 Intra fields (required for access)
    intraLogin: {
        type: String,
        sparse: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        trim: true
    },

    // Codeforces fields (optional - for ranking)
    codeforcesHandle: {
        type: String,
        sparse: true,
        trim: true
    },
    codeforcesRating: {
        type: Number,
        default: 0
    },
    codeforcesRank: {
        type: String,
        default: 'unrated'
    },
    codeforcesMaxRating: {
        type: Number,
        default: 0
    },
    codeforcesMaxRank: {
        type: String,
        default: 'unrated'
    },
    country: {
        type: String,
        default: ''
    },
    intraAvatar: {
        type: String,
        default: ''
    },
    codeforcesAvatar: {
        type: String,
        default: ''
    },
    avatar: {
        type: String,
        default: ''
    },
    titlephoto: {
        type: String,
        default: ''
    },
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    organization: {
        type: String,
        default: ''
    },
    deletedCFHandle: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("users", userSchema);