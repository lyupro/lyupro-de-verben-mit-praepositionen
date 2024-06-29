// utils/alphabetUtils.js
import { getVerbModel } from '../models/verb.js';
import alphabetConfig from '../config/alphabet.js';

export async function getAvailableAlphabetLetters() {
    const availableAlphabetLetters = [];

    for (const letter of alphabetConfig.getAll()) {
        const VerbModel = getVerbModel(letter);
        const count = await VerbModel.countDocuments();

        if (count > 0) {
            availableAlphabetLetters.push(letter);
        }
    }

    //console.log('getAvailableAlphabetLetters() | availableAlphabetLetters: ', availableAlphabetLetters);
    return availableAlphabetLetters;
}