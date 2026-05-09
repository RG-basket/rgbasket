const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize Firebase Admin
try {
    if (!admin.apps.length) {
        // Try to initialize from environment variable first
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            // Brute-force fix for private key
            if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
                serviceAccount.private_key = serviceAccount.private_key
                    .replace(/\\n/g, '\n')
                    .replace(/\n/g, '\n');
            }
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log(`🚀 Firebase Admin: Ready for project ${serviceAccount.project_id}`);
            console.log(`📧 Connected as: ${serviceAccount.client_email}`);
        } else {
            // Fallback: Check for a local file (useful for environments where env vars are tricky)
            const path = require('path');
            const fs = require('fs');
            const keyPath = path.join(__dirname, '../firebase-key.json');
            
            if (fs.existsSync(keyPath)) {
                const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
                
                // Brute-force fix for private key: handle any variant of escaped newlines
                if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
                    serviceAccount.private_key = serviceAccount.private_key
                        .replace(/\\n/g, '\n') // Handle literal \n
                        .replace(/\n/g, '\n'); // Ensure real newlines are preserved
                }

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log(`🚀 Firebase Admin: Ready for project ${serviceAccount.project_id}`);
                console.log(`📧 Connected as: ${serviceAccount.client_email}`);
            } else {
                console.log('⚠️ Firebase Admin: No credentials found (env or file)');
            }
        }
    }
} catch (error) {
    console.error('❌ Firebase Admin init error:', error);
}

const FirebaseAdminService = {
    /**
     * Send notification to a specific user
     */
    sendToUser: async (userId, title, body, data = {}) => {
        try {
            const user = await User.findOne({
                $or: [
                    { _id: userId.match(/^[0-9a-fA-F]{24}$/) ? userId : null },
                    { googleId: userId }
                ].filter(Boolean)
            });

            if (!user || (!user.pushToken && (!user.pushTokens || user.pushTokens.length === 0))) {
                console.log(`ℹ️ No push tokens for user ${userId}`);
                return null;
            }

            // Collect all tokens
            const tokens = new Set();
            if (user.pushToken) tokens.add(user.pushToken);
            if (user.pushTokens) {
                user.pushTokens.forEach(t => tokens.add(t.token));
            }

            const tokenList = Array.from(tokens);
            if (tokenList.length === 0) return null;

            const message = {
                notification: { title, body },
                data: {
                    ...data,
                    click_action: 'FLUTTER_NOTIFICATION_CLICK', // For legacy mobile
                },
                tokens: tokenList
            };

            if (!admin.apps.length) {
                console.error('❌ Firebase Admin not initialized');
                return null;
            }

            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(`✅ Sent notification to ${userId}: ${response.successCount} success, ${response.failureCount} failure`);
            
            // Clean up invalid tokens if any
            if (response.failureCount > 0) {
                // Logic to remove failed tokens could be added here
            }
            
            return response;
        } catch (error) {
            console.error('❌ Error sending notification:', error);
            return null;
        }
    },

    /**
     * Send notification to all users who have tokens
     */
    broadcast: async (title, body, data = {}) => {
        try {
            // Get all users with at least one token
            const users = await User.find({
                $or: [
                    { pushToken: { $ne: '', $exists: true } },
                    { 'pushTokens.0': { $exists: true } }
                ]
            }).select('pushToken pushTokens');

            const allTokens = new Set();
            users.forEach(user => {
                if (user.pushToken) allTokens.add(user.pushToken);
                if (user.pushTokens) {
                    user.pushTokens.forEach(t => allTokens.add(t.token));
                }
            });

            const tokenList = Array.from(allTokens);
            if (tokenList.length === 0) return { successCount: 0 };

            // FCM allows max 500 tokens per multicast message
            const batches = [];
            for (let i = 0; i < tokenList.length; i += 500) {
                batches.push(tokenList.slice(i, i + 500));
            }

            let totalSuccess = 0;
            for (const batch of batches) {
                const message = {
                    notification: { title, body },
                    data: data || {}, // Ensure data is an object
                    tokens: batch
                };
                if (!admin.apps.length) {
                    throw new Error('Firebase Admin not initialized');
                }

                const response = await admin.messaging().sendEachForMulticast(message);
                totalSuccess += response.successCount;
                
                if (response.failureCount > 0) {
                    const tokensToRemove = [];
                    response.responses.forEach((resp, idx) => {
                        const token = batch[idx];
                        if (!resp.success) {
                            console.error(`❌ Token ${idx} failed:`, resp.error.code);
                            // If token is invalid or belongs to another project, we should remove it
                            if (resp.error.code === 'messaging/registration-token-not-registered' || 
                                resp.error.code === 'messaging/invalid-registration-token' ||
                                resp.error.code === 'messaging/third-party-auth-error') {
                                tokensToRemove.push(token);
                            }
                        }
                    });

                    if (tokensToRemove.length > 0) {
                        console.log(`🧹 Cleaning up ${tokensToRemove.length} invalid tokens...`);
                        await User.updateMany(
                            { $or: [{ pushToken: { $in: tokensToRemove } }, { 'pushTokens.token': { $in: tokensToRemove } }] },
                            { 
                                $pull: { pushTokens: { token: { $in: tokensToRemove } } },
                                $set: { pushToken: '' } 
                            }
                        );
                    }
                }
            }

            return { successCount: totalSuccess, totalTokens: tokenList.length };
        } catch (error) {
            console.error('❌ Broadcast error:', error);
            throw error;
        }
    }
};

module.exports = FirebaseAdminService;
