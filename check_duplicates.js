
const { QUESTION_REGISTRY } = require('./app/app/[lang]/(dashboard)/projects/[id]/components/questionTranslations.js');
const keys = QUESTION_REGISTRY.map(q => q.questionKey);
const duplicates = keys.filter((item, index) => keys.indexOf(item) !== index);
console.log('Duplicates:', duplicates);
