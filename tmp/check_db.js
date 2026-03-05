const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Role = require('./api/models/role.model');
const User = require('./api/models/user.model');

dotenv.config({ path: './api/config/config.env' });

async function check() {
    try {
        const connStr = process.env.DATABASE_LOCAL || process.env.DATABASE;
        await mongoose.connect(connStr);
        console.log('Connected to DB');

        const roles = await Role.find();
        console.log('--- ROLES ---');
        roles.forEach(r => console.log(`${r.code}: ${r._id}`));

        const users = await User.find({ isDeleted: false }).populate('role');
        console.log('\n--- ACTIVE USERS ---');
        users.forEach(u => console.log(`${u.username} (${u.role?.code}): ${u._id}`));

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
