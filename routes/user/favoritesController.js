import UserFavorites from '../../models/userFavorites.js';
import { getVerbModel, getVerbTranslationModel } from '../../models/verb.js';
import { getVerbTranslation } from '../../utils/verbUtils.js';

// GET /user/favorites - Получить все избранные глаголы пользователя
export const getFavorites = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user.userId;
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const search = req.query.search;
        const letter = req.query.letter; // Фильтр по букве
        const sortBy = req.query.sort || 'recent'; // recent, alphabetical, oldest

        // Создаем фильтр для поиска
        let filter = { userId };
        if (search) {
            filter.verbText = { $regex: search, $options: 'i' };
        }
        if (letter && letter !== 'all') {
            filter.letter = letter.toLowerCase();
        }

        // Определяем сортировку
        let sortOptions = {};
        switch (sortBy) {
            case 'alphabetical':
                sortOptions = { verbText: 1 };
                break;
            case 'oldest':
                sortOptions = { addedAt: 1 };
                break;
            case 'recent':
            default:
                sortOptions = { addedAt: -1 };
                break;
        }

        // Получаем избранные глаголы с пагинацией
        const favorites = await UserFavorites.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean();

        const totalFavorites = await UserFavorites.countDocuments(filter);
        const totalPages = Math.ceil(totalFavorites / limit);

        // Получаем переводы для каждого избранного глагола
        const favoritesWithTranslations = await Promise.all(
            favorites.map(async (favorite) => {
                try {
                    const { displayTranslation, tooltipText } = await getVerbTranslation(
                        favorite.letter, 
                        'ru', 
                        favorite.verbId
                    );
                    
                    return {
                        ...favorite,
                        translation: displayTranslation,
                        tooltipText: tooltipText,
                        addedAt: favorite.addedAt
                    };
                } catch (error) {
                    console.warn(`Не удалось получить перевод для глагола ${favorite.verbText}:`, error.message);
                    return {
                        ...favorite,
                        translation: 'Перевод недоступен',
                        tooltipText: null
                    };
                }
            })
        );

        // Получаем статистику по буквам для фильтров
        const letterStats = await UserFavorites.aggregate([
            { $match: { userId } },
            { $group: { _id: '$letter', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const result = {
            favorites: favoritesWithTranslations,
            pagination: {
                currentPage: page,
                totalPages,
                totalFavorites,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            letterStats: letterStats.map(stat => ({
                letter: stat._id,
                count: stat.count
            })),
            filters: {
                search: search || '',
                letter: letter || 'all',
                sort: sortBy
            }
        };
        
        res.json(result);
    } catch (error) {
        console.error('Error in getFavorites:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Ошибка загрузки избранного',
            error: error.message 
        });
    }
};

// POST /user/favorites/add - Добавить глагол в избранное
export const addToFavorites = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { letter, verbId, verbText } = req.body;

        if (!letter || verbId === undefined || !verbText) {
            return res.status(400).json({
                status: 'error',
                message: 'Необходимы поля: letter, verbId, verbText'
            });
        }

        // Проверяем, что глагол существует (только в продакшене)
        if (process.env.NODE_ENV !== 'test') {
            try {
                const VerbModel = getVerbModel(letter);
                const verb = await VerbModel.findOne({ verb_id: verbId });
                
                if (!verb) {
                    return res.status(404).json({
                        status: 'error',
                        message: 'Глагол не найден в базе данных'
                    });
                }
            } catch (error) {
                console.warn('Warning: Could not validate verb existence:', error.message);
                // Продолжаем выполнение для обратной совместимости
            }
        }

        // Проверяем, не добавлен ли уже в избранное
        const existingFavorite = await UserFavorites.findOne({
            userId,
            letter: letter.toLowerCase(),
            verbId
        });

        if (existingFavorite) {
            return res.status(400).json({
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
            return res.status(400).json({
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
        const userId = req.user.id || req.user.userId;
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

// DELETE /user/favorites/bulk-remove - Массовое удаление избранных глаголов
export const bulkRemoveFromFavorites = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { favoriteIds } = req.body; // Массив объектов { letter, verbId }

        if (!Array.isArray(favoriteIds) || favoriteIds.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Необходим массив favoriteIds с объектами { letter, verbId }'
            });
        }

        // Создаем условия для удаления
        const deleteConditions = favoriteIds.map(item => ({
            userId,
            letter: item.letter.toLowerCase(),
            verbId: item.verbId
        }));

        const result = await UserFavorites.deleteMany({
            $or: deleteConditions
        });

        res.json({
            status: 'success',
            message: `Удалено ${result.deletedCount} глаголов из избранного`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        next(error);
    }
};

// GET /user/favorites/check - Проверить, находится ли глагол в избранном
export const checkFavorite = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user.userId;
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

// GET /user/favorites/stats - Получить статистику избранного
export const getFavoritesStats = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user.userId;
        
        const totalFavorites = await UserFavorites.countDocuments({ userId });
        
        // Статистика по буквам
        const letterStats = await UserFavorites.aggregate([
            { $match: { userId } },
            { $group: { _id: '$letter', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Недавно добавленные (последние 7 дней)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const recentCount = await UserFavorites.countDocuments({
            userId,
            addedAt: { $gte: weekAgo }
        });

        res.json({
            status: 'success',
            stats: {
                total: totalFavorites,
                recentlyAdded: recentCount,
                byLetter: letterStats.map(stat => ({
                    letter: stat._id,
                    count: stat.count
                }))
            }
        });
    } catch (error) {
        next(error);
    }
}; 