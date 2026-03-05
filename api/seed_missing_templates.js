require('dotenv').config({ path: './config/config.env' });
const mongoose = require('mongoose');
const QuestionTemplate = require('./models/questionTemplate.model');

// Load registry from the frontend (simulated or imported if possible)
// Since we are in backend, we can just define the two missing ones to ensure they exist.

async function seedMissing() {
    try {
        const mongoUri = process.env.MONGO_URI;
        console.log('Connecting to:', mongoUri);
        await mongoose.connect(mongoUri);

        const contactName = await QuestionTemplate.findOneAndUpdate(
            { questionKey: 'contactName' },
            {
                questionKey: 'contactName',
                question: 'Contact Name',
                type: 'text',
                section: 'preliminary',
                sectionName: 'Preliminary Information',
                order: 4,
                isRequired: false,
                isVisible: true,
                isSectionVisible: true
            },
            { upsert: true, new: true }
        );

        const whatsapp = await QuestionTemplate.findOneAndUpdate(
            { questionKey: 'whatsappNumber' },
            {
                questionKey: 'whatsappNumber',
                question: 'WhatsApp Number',
                type: 'tel',
                section: 'preliminary',
                sectionName: 'Preliminary Information',
                order: 5,
                isRequired: false,
                isVisible: true,
                isSectionVisible: true,
                placeholder: '+212 ...'
            },
            { upsert: true, new: true }
        );

        console.log('Successfully added contactName and whatsappNumber to DB templates.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedMissing();
