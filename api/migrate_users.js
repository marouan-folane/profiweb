const mongoose = require('mongoose');
const User = require('./models/user.model');
const Role = require('./models/role.model');
require('dotenv').config({ path: './config/config.env' });

async function migrateUsers() {
    try {
        const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/profiweb';
        await mongoose.connect(dbUri);
        console.log('Connected to DB');

        const users = await User.find({});
        console.log(`Found ${users.length} users to migrate.`);

        const roles = await Role.find({});
        const roleMap = {};
        roles.forEach(r => {
            roleMap[r.code.toLowerCase()] = r._id;
        });

        for (const user of users) {
            // If role is still a string (old format)
            if (typeof user.role === 'string') {
                const oldRole = user.role.toLowerCase();
                const roleId = roleMap[oldRole];

                if (roleId) {
                    await User.updateOne(
                        { _id: user._id },
                        {
                            $set: {
                                role: roleId,
                                roleCode: oldRole
                            }
                        }
                    );
                    console.log(`Migrated user ${user.email}: ${oldRole} -> ${roleId}`);
                } else {
                    console.warn(`No role found for code: ${oldRole} (User: ${user.email})`);
                }
            } else {
                console.log(`User ${user.email} already has an ObjectId role.`);
            }
        }

        console.log('User migration completed');
        process.exit(0);
    } catch (err) {
        console.error('Error migrating users:', err);
        process.exit(1);
    }
}

migrateUsers();
