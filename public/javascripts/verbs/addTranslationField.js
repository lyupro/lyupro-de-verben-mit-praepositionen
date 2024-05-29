// public/javascripts/verbs/addTranslationField.js

// Функция для создания нового поля ввода
function createInputField(fieldType, placeholder, maxFields) {
    const inputGroup = document.createElement('div');
    inputGroup.classList.add('input-group', 'mb-3');

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control';
    input.name = `${fieldType}[]`;
    input.placeholder = placeholder;
    input.required = true;

    const inputGroupAppend = document.createElement('div');
    inputGroupAppend.classList.add('input-group-append');

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.classList.add('btn', 'btn-outline-danger');
    removeButton.innerHTML = '<i class="fas fa-times-circle"></i>';
    removeButton.addEventListener('click', function() {
        const inputGroup = this.closest('.input-group');
        if (inputGroup) {
            inputGroup.remove();
        }
    });

    inputGroupAppend.appendChild(removeButton);
    inputGroup.appendChild(input);
    inputGroup.appendChild(inputGroupAppend);

    return { inputGroup, maxFields };
}

// Функция для добавления нового поля ввода перевода
function addTranslationField() {
    const translationFields = document.getElementById('translationFields');
    const maxFields = 10;
    const currentFields = translationFields.querySelectorAll('.input-group').length;

    if (currentFields < maxFields) {
        const { inputGroup } = createInputField('translations', 'Новый перевод', maxFields);
        translationFields.appendChild(inputGroup);
    } else {
        alert('Вы достигли максимального количества полей для ввода перевода.');
    }
}

// Функция для добавления нового поля ввода предложения
function addSentenceField() {
    const sentenceTableBody = document.getElementById('sentenceTableBody');
    const maxFields = 20;
    const currentFields = sentenceTableBody.querySelectorAll('tr').length;

    if (currentFields < maxFields) {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>
                <input type="text" class="form-control" name="sentences[]">
            </td>
            <td>
                <button class="btn btn-outline-danger btn-sm" type="button" onclick="removeSentenceRow(this)">
                    <i class="fas fa-times-circle"></i>
                </button>
            </td>
        `;
        sentenceTableBody.appendChild(newRow);
    } else {
        alert('Вы достигли максимального количества полей для ввода предложения.');
    }
}

// Функция для добавления нового поля ввода перевода предложения
function addSentenceTranslationField() {
    const sentenceTranslationTableBody = document.getElementById('sentenceTranslationTableBody');
    const maxFields = 20;
    const currentFields = sentenceTranslationTableBody.querySelectorAll('tr').length;

    if (currentFields < maxFields) {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>
                <input type="text" class="form-control" name="sentencesTranslation[]">
            </td>
            <td>
                <button class="btn btn-outline-danger btn-sm" type="button" onclick="removeSentenceTranslationRow(this)">
                    <i class="fas fa-times-circle"></i>
                </button>
            </td>
        `;
        sentenceTranslationTableBody.appendChild(newRow);
    } else {
        alert('Вы достигли максимального количества полей для ввода перевода предложения.');
    }
}

// Добавление обработчиков событий для кнопок с иконкой плюса
document.addEventListener('DOMContentLoaded', function() {
    const addTranslationBtn = document.getElementById('addTranslationBtn');
    const addSentenceBtn = document.getElementById('addSentenceBtn');
    const addSentenceTranslationBtn = document.getElementById('addSentenceTranslationBtn');

    addTranslationBtn.addEventListener('click', addTranslationField);
    addSentenceBtn.addEventListener('click', addSentenceField);
    addSentenceTranslationBtn.addEventListener('click', addSentenceTranslationField);
});