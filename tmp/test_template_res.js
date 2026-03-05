const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Mocking some parts if needed, but let's try to load the actual models
require('dotenv').config();

const Project = require('../api/models/project.model');
const Template = require('../api/models/template.model');
const Question = require('../api/models/question.model');

async function testResolution(projectId) {
    try {
        console.log(`Testing resolution for project: ${projectId}`);
        const project = await Project.findById(projectId);
        const allQuestions = await Question.find({ project: projectId });

        console.log('Project selectedTemplate:', project.selectedTemplate);
        console.log('Project templateName:', project.templateName);

        const templateIdx = allQuestions.findIndex(q =>
            (q.questionKey && (q.questionKey === "selectedTemplateId" || q.questionKey === "selectedTemplate")) ||
            (q.question && q.question.toLowerCase().includes("selected template"))
        );

        if (templateIdx !== -1) {
            console.log('Found template question index:', templateIdx);
            console.log('Question answer:', allQuestions[templateIdx].answer);
        } else {
            console.log('Template question not found in questions list');
        }

        const templateIdInput = project.selectedTemplate || (templateIdx !== -1 ? allQuestions[templateIdx].answer : null);
        console.log('Template ID Input:', templateIdInput);

        if (templateIdInput && mongoose.Types.ObjectId.isValid(templateIdInput)) {
            const template = await Template.findById(templateIdInput);
            if (template) {
                console.log('Successfully found template:', template.title);
            } else {
                console.log('Template NOT found in database for ID:', templateIdInput);
            }
        } else {
            console.log('Template ID input is not a valid ObjectId or is null');
        }

    } catch (err) {
        console.error('Error during test:', err);
    } finally {
        // mongoose.disconnect();
    }
}

// Check some project IDs from the database if possible
async function run() {
    // This is just a scratch script, we need to connect to DB first
    // Since I can't easily get the DB URI from here, I'll just assume I can't run it directly
    // but I can use this logic to improve my code.
}
