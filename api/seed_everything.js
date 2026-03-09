const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
require('dotenv').config({ path: './config/config.env' });

const Role = require('./models/role.model');
const User = require('./models/user.model');

// Fix for ECONNREFUSED
dns.setServers(['8.8.8.8', '8.8.4.4']);

const ROLES_DATA = [
    { name: 'Super Administrator', code: 'SUPERADMIN', level: 100, isSystemRole: true },
    { name: 'Administrator', code: 'ADMIN', level: 90, isSystemRole: true },
    { name: 'Manager', code: 'MANAGER', level: 80, isSystemRole: true },
    { name: 'Sales Department', code: 'D.S', department: 'sales', level: 10 },
    { name: 'Information Department', code: 'D.I', department: 'informations', level: 10 },
    { name: 'Information Alt', code: 'D.INF', department: 'informations', level: 10 },
    { name: 'Content Department', code: 'D.C', department: 'content', level: 10 },
    { name: 'Design Department', code: 'D.D', department: 'design', level: 10 },
    { name: 'IT Department', code: 'D.IT', department: 'it', level: 10 },
    { name: 'Integration Department', code: 'D.IN', department: 'integration', level: 10 },
    { name: 'Control Manager', code: 'C.M', department: 'informations', level: 20 },
];

const USERS_TO_CREATE = [
    { username: 'admin', email: 'admin@maya.com', firstName: 'Admin', lastName: 'Maya', phone: '0600000001', roleCode: 'ADMIN', department: 'informations' },
    { username: 'manager', email: 'manager@maya.com', firstName: 'Manager', lastName: 'Maya', phone: '0600000002', roleCode: 'MANAGER', department: 'informations' },
    { username: 'sales', email: 'd.s@maya.com', firstName: 'Sales', lastName: 'Dept', phone: '0600000010', roleCode: 'D.S', department: 'sales' },
    { username: 'information', email: 'd.i@maya.com', firstName: 'Info', lastName: 'Dept', phone: '0600000020', roleCode: 'D.I', department: 'informations' },
    { username: 'infodept', email: 'd.inf@maya.com', firstName: 'InfoAlt', lastName: 'Dept', phone: '0600000021', roleCode: 'D.INF', department: 'informations' },
    { username: 'content', email: 'd.c@maya.com', firstName: 'Content', lastName: 'Dept', phone: '0600000030', roleCode: 'D.C', department: 'content' },
    { username: 'designer', email: 'd.d@maya.com', firstName: 'Designer', lastName: 'Dept', phone: '0600000040', roleCode: 'D.D', department: 'design' },
    { username: 'itdept', email: 'd.it@maya.com', firstName: 'IT', lastName: 'Dept', phone: '0600000050', roleCode: 'D.IT', department: 'it' },
    { username: 'integration', email: 'd.in@maya.com', firstName: 'Integration', lastName: 'Dept', phone: '0600000060', roleCode: 'D.IN', department: 'integration' },
    { username: 'controlmanager', email: 'c.m@maya.com', firstName: 'Control', lastName: 'Manager', phone: '0600000070', roleCode: 'C.M', department: 'informations' },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 10000 });
        console.log('✅ Connected to MongoDB');

        // 1. Create a placeholder user ID for role creation (bypasses circular dependency)
        const fakeUserId = new mongoose.Types.ObjectId();

        // 2. Create Roles
        console.log('--- Seeding Roles ---');
        const roleIds = {};
        for (const data of ROLES_DATA) {
            let role = await Role.findOne({ code: data.code });
            if (!role) {
                role = await Role.create({ ...data, createdBy: fakeUserId });
                console.log(`✅ Role Created: ${data.code}`);
            } else {
                console.log(`ℹ️ Role Exists: ${data.code}`);
            }
            roleIds[data.code] = role._id;
        }

        // 3. Clear and Create Users
        console.log('\n--- Seeding Users ---');
        await User.deleteMany({});
        console.log('🗑️  All users cleared');

        let superadmin = await User.findOne({ email: 'superadmin@superadmin.com' });
        if (!superadmin) {
            superadmin = await User.create({
                username: 'superadmin',
                email: 'superadmin@superadmin.com',
                password: 'password123',
                passwordConfirm: 'password123',
                firstName: 'Super',
                lastName: 'Admin',
                phone: '0600000000',
                role: roleIds['SUPERADMIN'],
                isActive: true
            });
            console.log('✅ Superadmin Created: superadmin@superadmin.com');
        } else {
            console.log('ℹ️ Superadmin Exists');
        }

        // 4. Fix Role createdBy
        await Role.updateMany({ createdBy: fakeUserId }, { createdBy: superadmin._id });
        console.log('✅ Fixed Roles audit tail');

        // 5. Create Other Users
        console.log('\n--- Seeding Users ---');
        for (const userData of USERS_TO_CREATE) {
            const roleId = roleIds[userData.roleCode];
            if (!roleId) continue;

            const existing = await User.findOne({ 
                $or: [{ email: userData.email }, { username: userData.username }] 
            });

            if (existing) {
                await User.deleteOne({ _id: existing._id });
                console.log(`🗑️  Cleaned up existing user: ${userData.email}`);
            }

            await User.create({
                ...userData,
                password: 'password123',
                passwordConfirm: 'password123',
                role: roleId,
                isActive: true,
                createdBy: superadmin._id
            });
            console.log(`✅ User Created: ${userData.email}`);
        }

        console.log('\n🌟 ALL SEEDING COMPLETED SUCCESSFULLY');
    } catch (err) {
        console.error('❌ SEED ERROR:', err);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected');
    }
}

seed();
