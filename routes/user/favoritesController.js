import UserFavorites from '../../models/userFavorites.js';
import { getVerbModel, getVerbTranslationModel } from '../../models/verb.js';
import { getVerbTranslation } from '../../utils/verbUtils.js';

// GET /user/favorites - Получить все избранные глаголы пользователя
export const getFavorites = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        // Получаем избранные глаголы с пагинацией
        const favorites = await UserFavorites.find({ userId })
            .sort({ addedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalFavorites = await UserFavorites.countDocuments({ userId });
        const totalPages = Math.ceil(totalFavorites / limit);

        // Получаем полную информацию о глаголах
        const favoritesWithDetails = await Promise.all(
            favorites.map(async (favorite) => {
                try {
                    const VerbModel = getVerbModel(favorite.letter);
                    const verb = await VerbModel.findOne({ verb_id: favorite.verbId }).lean();
                    
                    if (verb) {
                        // Получаем перевод
                        const { displayTranslation } = await getVerbTranslation(
                            favorite.letter, 
                            'ru', 
                            favorite.verbId
                        );
                        
                        return {
                            ...favorite,
                            verb,
                            translation: displayTranslation
                        };
                    }
                    return null;
                } catch (error) {
                    console.error(`Error loading verb ${favorite.letter}/${favorite.verbText}:`, error);
                    return null;
                }
            })
        );

        // Фильтруем null значения (глаголы которые не удалось загрузить)
        const validFavorites = favoritesWithDetails.filter(item => item !== null);

        res.json({
            favorites: validFavorites,
            pagination: {
                currentPage: page,
                totalPages,
                totalFavorites,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        next(error);
    }
};

// POST /user/favorites/add - Добавить глагол в избранное
export const addToFavorites = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { letter, verbId, verbText } = req.body;

        if (!letter || verbId === undefined || !verbText) {
            return res.status(400).json({
                status: 'error',
                message: 'Необходимы поля: letter, verbId, verbText'
            });
        }

        // Проверяем, что глагол существует
        const VerbModel = getVerbModel(letter);
        const verb = await VerbModel.findOne({ verb_id: verbId });
        
        if (!verb) {
            return res.status(404).json({
                status: 'error',
                message: 'Глагол не найден'
            });
        }

        // Проверяем, не добавлен ли уже в избранное
        const existingFavorite = await UserFavorites.findOne({
            userId,
            letter,
            verbId
        });

        if (existingFavorite) {
            return res.status(409).json({
                status: 'error',
                message: 'Глагол уже в избранном'
            });
        }

        // Добавляем в избранное
        const favorite = new UserFavorites({
            userId,
            letter: letter.toLowerCase(),
            verbId,
            verbText: verbText.toLowerCase()
        });

        await favorite.save();

        res.status(201).json({
            status: 'success',
            message: 'Глагол добавлен в избранное',
            favorite
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                status: 'error',
                message: 'Глагол уже в избранном'
            });
        }
        next(error);
    }
};

// DELETE /user/favorites/remove - Удалить глагол из избранного
export const removeFromFavorites = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { letter, verbId } = req.body;

        if (!letter || verbId === undefined) {
            return res.status(400).json({
                status: 'error',
                message: 'Необходимы поля: letter, verbId'
            });
        }

        const result = await UserFavorites.findOneAndDelete({
            userId,
            letter: letter.toLowerCase(),
            verbId
        });

        if (!result) {
            return res.status(404).json({
                status: 'error',
                message: 'Глагол не найден в избранном'
            });
        }

        res.json({
            status: 'success',
            message: 'Глагол удален из избранного'
        });
    } catch (error) {
        next(error);
    }
};

// GET /user/favorites/check - Проверить, находится ли глагол в избранном
export const checkFavorite = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { letter, verbId } = req.query;

        if (!letter || verbId === undefined) {
            return res.status(400).json({
                status: 'error',
                message: 'Необходимы параметры: letter, verbId'
            });
        }

        const favorite = await UserFavorites.findOne({
            userId,
            letter: letter.toLowerCase(),
            verbId: parseInt(verbId)
        });

        res.json({
            status: 'success',
            isFavorite: !!favorite
        });
    } catch (error) {
        next(error);
    }
}; 