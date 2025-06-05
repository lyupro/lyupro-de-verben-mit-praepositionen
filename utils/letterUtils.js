// utils/letterUtils.js
import { getVerbModel } from '../models/verb.js';
import alphabetConfig from '../config/alphabet.js';
import { getVerbsWithTranslations, getAlphabetWithAvailability } from './verbUtils.js';
import { validateLetter, validateQuery, validateVerbText, validatePage, validatePageRange } from './validationUtils.js';

process.env.ENABLE_LETTER_FILTER = process.env.ENABLE_LETTER_FILTER || 'true';

export async function renderVerbsByLetter(req, res, next, letter, page) {
    try {
        // Приводим букву к нижнему регистру
        const lowerCaseLetter = letter.toLowerCase();
        validateLetter(letter);
        validatePage(page);

        const limit = 10;
        const VerbModel = getVerbModel(lowerCaseLetter);
        const regex = new RegExp(`^${lowerCaseLetter}`, 'i');
        const totalVerbs = await VerbModel.countDocuments({ verb: regex });
        const totalPages = Math.ceil(totalVerbs / limit);

        validatePageRange(page, totalPages);

        const skip = (page - 1) * limit;
        // Static verbs on page (alphabet order)
        const verbs = await VerbModel.find({ verb: regex }).skip(skip).limit(limit);

        const verbsWithTranslations = await getVerbsWithTranslations(verbs);
        const { alphabet, letterAvailability } = await getAlphabetWithAvailability();

        res.render('partials/verbs/letterVerbs', {
            letter: lowerCaseLetter,
            verbs: verbsWithTranslations,
            currentPage: page,
            totalPages,
            alphabet,
            letterAvailability,
            pageTitle: `Список глаголов на букву ${lowerCaseLetter}`,
            pageHeader: `Список глаголов на букву ${lowerCaseLetter}`,
        });
    } catch (error) {
        console.error('Error in showVerbsByLetter:', error);
        next(error);
    }
}
