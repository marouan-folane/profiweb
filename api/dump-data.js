const mongoose = require('mongoose');
const dotenv = require('dotenv');
const QuestionTemplate = require('./models/questionTemplate.model');

dotenv.config({ path: './config/config.env' });

async function dump() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const templates = await QuestionTemplate.find().limit(5).lean();
        console.log("DB Content (First 5):", JSON.stringify(templates, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

dump();
