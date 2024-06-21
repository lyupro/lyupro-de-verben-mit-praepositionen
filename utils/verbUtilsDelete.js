// utils/verbUtilsDelete.js
import {
    getVerbModel,
    getVerbTranslationModel,
    getVerbTensesModel,
    getVerbSentencesModel,
    getVerbSentencesTranslationModel,
} from '../models/verb.js';

export async function deleteVerbData(letter, verbId) {
    try {
        const VerbModel = getVerbModel(letter);
        await VerbModel.deleteOne({ verb_id: verbId });

        const translationModel = getVerbTranslationModel(letter, 'ru');
        await translationModel.deleteOne({ verb_id: verbId });

        const tensesModel = getVerbTensesModel(letter, 'present');
        await tensesModel.deleteOne({ verb_id: verbId });

        const sentencesModel = getVerbSentencesModel(letter, 'present');
        await sentencesModel.deleteOne({ verb_id: verbId });

        const sentencesTranslationModel = getVerbSentencesTranslationModel(letter, 'present', 'ru');
        await sentencesTranslationModel.deleteOne({ verb_id: verbId });
    } catch (error) {
        console.error('Ошибка при удалении данных глагола:', error);
        throw error;
    }
}