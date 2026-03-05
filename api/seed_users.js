/**
 * User Seeding Script
 * Run: node seed_users.js
 * Deletes ALL non-superadmin users and creates fresh users for each role/department
 */

require('dotenv').config({ path: './config/config.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Must require role.model first so User model can populate it
const Role = require('./models/role.model');
const User = require('./models/user.model');

const DEFAULT_PASSWORD = 'password123';

const USERS_TO_CREATE = [
    // --- Admin level ---
    {
        username: 'admin',
        email: 'admin@maya.com',
        firstName: 'Admin',
        lastName: 'Maya',
        phone: '0600000001',
        roleCode: 'ADMIN',
        department: 'informations',
    },
    {
        username: 'manager',
        email: 'manager@maya.com',
        firstName: 'Manager',
        lastName: 'Maya',
        phone: '0600000002',
        roleCode: 'MANAGER',
        department: 'informations',
    },

    // --- Department: Sales ---
    {
        username: 'sales',
        email: 'd.s@maya.com',
        firstName: 'Sales',
        lastName: 'Dept',
        phone: '0600000010',
        roleCode: 'D.S',
        department: 'sales',
    },

    // --- Department: Information ---
    {
        username: 'information',
        email: 'd.i@maya.com',
        firstName: 'Info',
        lastName: 'Dept',
        phone: '0600000020',
        roleCode: 'D.I',
        department: 'informations',
    },
    {
        username: 'infodept',
        email: 'd.inf@maya.com',
        firstName: 'InfoAlt',
        lastName: 'Dept',
        phone: '0600000021',
        roleCode: 'D.INF',
        department: 'informations',
    },

    // --- Department: Content ---
    {
        username: 'content',
        email: 'd.c@maya.com',
        firstName: 'Content',
        lastName: 'Dept',
        phone: '0600000030',
        roleCode: 'D.C',
        department: 'content',
    },

    // --- Department: Design ---
    {
        username: 'designer',
        email: 'd.d@maya.com',
        firstName: 'Designer',
        lastName: 'Dept',
        phone: '0600000040',
        roleCode: 'D.D',
        department: 'design',
    },

    // --- Department: IT ---
    {
        username: 'itdept',
        email: 'd.it@maya.com',
        firstName: 'IT',
        lastName: 'Dept',
        phone: '0600000050',
        roleCode: 'D.IT',
        department: 'it',
    },

    // --- Department: Integration ---
    {
        username: 'integration',
        email: 'd.in@maya.com',
        firstName: 'Integration',
        lastName: 'Dept',
        phone: '0600000060',
        roleCode: 'D.IN',
        department: 'integration',
    },

    // --- Control Manager ---
    {
        username: 'controlmanager',
        email: 'c.m@maya.com',
        firstName: 'Control',
        lastName: 'Manager',
        phone: '0600000070',
        roleCode: 'C.M',
        department: 'informations',
    },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find superadmin to use as createdBy
        const superadminRole = await Role.findOne({ code: 'SUPERADMIN' });
        const superadminUser = await User.findOne({ role: superadminRole?._id });
        if (!superadminUser) {
            console.error('❌ No superadmin user found. Cannot seed.');
            process.exit(1);
        }

        const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

        let created = 0;
        let skipped = 0;
        let deleted = 0;

        for (const userData of USERS_TO_CREATE) {
            const role = await Role.findOne({ code: userData.roleCode });
            if (!role) {
                console.warn(`⚠️  Role "${userData.roleCode}" not found in DB. Skipping ${userData.email}`);
                skipped++;
                continue;
            }

            // Delete existing user with same email or username
            const existing = await User.findOne({
                $or: [{ email: userData.email }, { username: userData.username }]
            });

            if (existing) {
                await User.deleteOne({ _id: existing._id });
                console.log(`🗑️  Deleted old user: ${userData.email}`);
                deleted++;
            }

            // Create fresh user
            await User.create({
                username: userData.username,
                email: userData.email,
                password: hash,
                passwordConfirm: hash,
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone,
                role: role._id,
                department: userData.department,
                isActive: true,
                createdBy: superadminUser._id,
            });

            console.log(`✅ Created: ${userData.email} (role: ${userData.roleCode}, dept: ${userData.department})`);
            created++;
        }

        console.log('\n--- Seed Summary ---');
        console.log(`Deleted: ${deleted}`);
        console.log(`Created: ${created}`);
        console.log(`Skipped: ${skipped}`);
        console.log('\n📋 Login credentials (all use password: password123):');
        console.log('┌──────────────────────────────┬──────────────────┬─────────────────┬──────────────────┐');
        console.log('│ Email                        │ Username         │ Role            │ Department       │');
        console.log('├──────────────────────────────┼──────────────────┼─────────────────┼──────────────────┤');
        for (const u of USERS_TO_CREATE) {
            const email = u.email.padEnd(28);
            const uname = u.username.padEnd(16);
            const role = u.roleCode.padEnd(15);
            const dept = u.department.padEnd(16);
            console.log(`│ ${email} │ ${uname} │ ${role} │ ${dept} │`);
        }
        console.log('└──────────────────────────────┴──────────────────┴─────────────────┴──────────────────┘');
        console.log('\nSuperadmin: superadmin@superadmin.com (original password unchanged)');

    } catch (err) {
        console.error('❌ Seed error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

seed();
