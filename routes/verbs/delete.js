// routes/verbs/delete.js
import express from 'express';
import { deleteVerb } from '../../utils/verbUtils.js';
import { validateLetter, validateVerbText } from '../../utils/validationUtils.js';

const router = express.Router();

// DELETE /verbs/:letter/:verb - Удаление глагола
export const deleteVerbHandler = async (req, res, next) => {
    try {
        const letter = req.params.letter.toLowerCase();
        const verb = req.params.verb.toLowerCase();

        validateLetter(letter);
        validateVerbText(verb);

        const deletedVerb = await deleteVerb(letter, verb);

        if (!deletedVerb) {
            return res.status(404).send('Глагол не найден');
        }

        res.sendStatus(204); // No Content
    } catch (error) {
        next(error);
    }
};

export default router;