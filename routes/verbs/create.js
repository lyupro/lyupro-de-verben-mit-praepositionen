// routes/verbs/create.js
import { createVerb } from '../../utils/verbUtils.js';
import { validateLetter, validateVerbText } from '../../utils/validationUtils.js';

// GET /verbs/create - Отображение формы создания глагола
export const showCreateForm = async (req, res, next) => {
    try {
        res.render('partials/verb/verbCreate', {
            pageTitle: 'Создать новый глагол',
            pageHeader: 'Создать новый глагол',
            createMode: true,
        });
    } catch (error) {
        next(error);
    }
};

// POST /verbs - Создание нового глагола
export const createVerbHandler = async (req, res, next) => {
    try {
        const { verb, translations, conjugations, sentences, sentencesTranslation } = req.body;

        validateVerbText(verb);

        const letter = verb.charAt(0).toLowerCase();
        validateLetter(letter);

        const createdVerb = await createVerb(verb, letter, translations, conjugations, sentences, sentencesTranslation);

        if (!createdVerb) {
            return res.status(500).send('Не удалось создать глагол');
        }

        res.redirect(`/verbs/${letter}/${verb}`);
    } catch (error) {
        next(error);
    }
};