// utils/alphabetUtils.js
const { getVerbModel } = require('../models/verb');
const alphabetConfig = require('../config/alphabet');

async function getAvailableAlphabetLetters() {
    const availableAlphabetLetters = [];

    for (const letter of alphabetConfig.letters) {
        const VerbModel = getVerbModel(letter);
        const count = await VerbModel.countDocuments();

        if (count > 0) {
            availableAlphabetLetters.push(letter);
        }
    }

    //console.log('getAvailableAlphabetLetters() | availableAlphabetLetters: ', availableAlphabetLetters);
    return availableAlphabetLetters;
}

module.exports = {
    getAvailableAlphabetLetters,
};