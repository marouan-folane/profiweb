const mongoose = require('mongoose');
const dotenv = require('dotenv');
const QuestionTemplate = require('./models/questionTemplate.model');

dotenv.config({ path: './config/config.env' });

async function test() {
    try {
        console.log("URI:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const testData = {
            questionKey: "testQuestion_" + Date.now(),
            question: "Test Question",
            section: "test",
            sectionName: "Test",
            translations: {
                en: "Hello EN",
                fr: "Bonjour FR",
                ar: "مرحبا AR",
                de: "Hallo DE"
            }
        };

        console.log("Creating doc with data:", JSON.stringify(testData, null, 2));
        const doc = await QuestionTemplate.create(testData);
        console.log("Created doc (Mongoose object):", doc);
        console.log("Translations in doc:", doc.translations);

        const fetched = await QuestionTemplate.findById(doc._id).lean();
        console.log("Fetched raw (lean):", JSON.stringify(fetched, null, 2));

        if (fetched.translations && fetched.translations.en === "Hello EN") {
            console.log("✅ Success: Translations are saved and fetched correctly!");
        } else {
            console.log("❌ Failure: Translations are missing or incorrect in DB.");
        }

        // Cleanup
        await QuestionTemplate.findByIdAndDelete(doc._id);

    } catch (err) {
        console.error("Error during test:", err);
    } finally {
        await mongoose.connection.close();
    }
}

test();
