const mongoose = require('mongoose');
const dotenv = require('dotenv');
const QuestionTemplate = require('./api/models/questionTemplate.model');

dotenv.config({ path: './api/config/config.env' });

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const testData = {
            questionKey: "testQuestion",
            question: "Test Question",
            section: "test",
            sectionName: "Test",
            translations: {
                en: "Hello",
                fr: "Bonjour",
                ar: "مرحبا",
                de: "Hallo"
            }
        };

        await QuestionTemplate.deleteMany({ questionKey: "testQuestion" });
        const doc = await QuestionTemplate.create(testData);
        console.log("Saved document:", JSON.stringify(doc, null, 2));

        const fetched = await QuestionTemplate.findOne({ questionKey: "testQuestion" });
        console.log("Fetched document:", JSON.stringify(fetched, null, 2));

        if (fetched.translations && fetched.translations.en === "Hello") {
            console.log("✅ Success: Translations are saved and fetched correctly!");
        } else {
            console.log("❌ Failure: Translations are missing or incorrect.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.connection.close();
    }
}

test();
