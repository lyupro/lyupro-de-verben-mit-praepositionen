// routes/verbs/update.js
const express = require('express');
const router = express.Router();
const { deleteVerb } = require('../../utils/verbUtils');
const { validateLetter, validateVerbText } = require('../../utils/validationUtils');

// DELETE /verbs/:letter/:verb - Удаление глагола
exports.deleteVerb = async (req, res, next) => {
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

module.exports = router;