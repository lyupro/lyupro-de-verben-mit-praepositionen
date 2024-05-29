// public/javascripts/verbs/verbDetailsEdit.js

// Функция для удаления строки из таблицы предложений
function removeSentenceRow(button) {
    const row = button.closest('tr');
    const sentenceId = row.dataset.sentenceId;
    const translationRow = document.querySelector(`#sentenceTranslationTableBody tr[data-sentence-id="${sentenceId}"]`);

    if (translationRow) {
        translationRow.classList.add('empty-row');
    } else {
        row.remove();
    }
}

// Функция для удаления строки из таблицы переводов предложений
function removeSentenceTranslationRow(button) {
    const row = button.closest('tr');
    const sentenceId = row.dataset.sentenceId;
    const sentenceRow = document.querySelector(`#sentenceTableBody tr[data-sentence-id="${sentenceId}"]`);

    if (sentenceRow) {
        sentenceRow.classList.add('empty-row');
    } else {
        row.remove();
    }
}

// Функция для обновления пустых строк
function updateEmptyRows() {
    const sentenceTableBody = document.getElementById('sentenceTableBody');
    const sentenceTranslationTableBody = document.getElementById('sentenceTranslationTableBody');

    const sentenceRows = sentenceTableBody.querySelectorAll('tr');
    const sentenceTranslationRows = sentenceTranslationTableBody.querySelectorAll('tr');

    sentenceRows.forEach(row => {
        const sentenceId = row.dataset.sentenceId;
        const translationRow = sentenceTranslationTableBody.querySelector(`tr[data-sentence-id="${sentenceId}"]`);

        if (!translationRow || translationRow.classList.contains('empty-row')) {
            row.classList.add('empty-row');
        } else {
            row.classList.remove('empty-row');
        }
    });

    sentenceTranslationRows.forEach(row => {
        const sentenceId = row.dataset.sentenceId;
        const sentenceRow = sentenceTableBody.querySelector(`tr[data-sentence-id="${sentenceId}"]`);

        if (!sentenceRow || sentenceRow.classList.contains('empty-row')) {
            row.classList.add('empty-row');
        } else {
            row.classList.remove('empty-row');
        }
    });
}

// Инициализация Sortable.js для таблиц предложений и переводов
const sentenceTableBody = document.getElementById('sentenceTableBody');
const sentenceTranslationTableBody = document.getElementById('sentenceTranslationTableBody');

new Sortable(sentenceTableBody, {
    animation: 150,
    ghostClass: 'empty-row',
    handle: '.move-cell',
    direction: 'vertical',
    onEnd: function (evt) {
        const sentenceId = evt.item.dataset.sentenceId;
        const translationRow = sentenceTranslationTableBody.querySelector(`tr[data-sentence-id="${sentenceId}"]`);
        sentenceTranslationTableBody.insertBefore(translationRow, sentenceTranslationTableBody.children[evt.newIndex]);
        updateEmptyRows();
    },
});

new Sortable(sentenceTranslationTableBody, {
    animation: 150,
    ghostClass: 'empty-row',
    handle: '.move-cell',
    direction: 'vertical',
    onEnd: function (evt) {
        const sentenceId = evt.item.dataset.sentenceId;
        const sentenceRow = sentenceTableBody.querySelector(`tr[data-sentence-id="${sentenceId}"]`);
        sentenceTableBody.insertBefore(sentenceRow, sentenceTableBody.children[evt.newIndex]);
        updateEmptyRows();
    },
});

// Обновление пустых строк при загрузке страницы
document.addEventListener('DOMContentLoaded', updateEmptyRows);