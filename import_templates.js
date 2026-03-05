const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const QuestionTemplate = require('./api/models/questionTemplate.model');
require('dotenv').config({ path: './api/.env' });

async function importTemplates() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/profiweb';
        console.log('Connecting to:', mongoUri);
        await mongoose.connect(mongoUri);
        console.log('DB connected.');

        const jsonPath = path.join(__dirname, 'question_templates_export.json');
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        // Clear existing templates to avoid duplicates during this migration
        console.log('Clearing existing templates...');
        await QuestionTemplate.deleteMany({});

        console.log(`Importing ${data.length} templates...`);
        await QuestionTemplate.insertMany(data);

        console.log('Import successful!');
        process.exit(0);
    } catch (err) {
        console.error('Import failed:', err);
        process.exit(1);
    }
}

importTemplates();
