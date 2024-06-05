document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('checkSentenceForm');
    const sentenceInput = document.getElementById('sentenceInput');
    const checkResult = document.getElementById('checkResult');

    if (form && sentenceInput && checkResult) {
        // Код для обработки формы проверки предложения
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const verbText = form.elements['verb'].value;
            //console.log('checkSentence.js | verbText: ', verbText);
            const sentence = sentenceInput.value.trim();
            //console.log('checkSentence.js | sentence: ', sentence);

            if (sentence === '') {
                checkResult.textContent = 'Пожалуйста, введите предложение.';
                return;
            }

            try {
                const response = await fetch('/verb/check', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ verb: verbText, sentence }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! Status: ${response.status}. ${errorText}`);
                }

                const result = await response.text();
                checkResult.textContent = result;
            } catch (error) {
                console.error('Error checking sentence:', error);
                checkResult.textContent = error.message;
            }
        });
    }
});