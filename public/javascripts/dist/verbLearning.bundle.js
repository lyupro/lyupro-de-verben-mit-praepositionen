(()=>{"use strict";function n(i,o,r,l){document.getElementById("gameContainer");var c,d,s=document.getElementById("cardContainer"),u=document.getElementById("stopBtn"),m=i,v=!0,y=[{duration:3e4,interval:3e3},{duration:2e4,interval:2e3},{duration:1e4,interval:1e3},{duration:2e4,interval:500},{duration:3e4,interval:3e3},{duration:1e4,interval:250},{duration:2e4,interval:2e3},{duration:7500,interval:150},{duration:3e4,interval:3e3}],b=0;function g(){clearInterval(c),clearTimeout(d),--l>0?function(i,o,r,l){document.getElementById("gameContainer").innerHTML='\n        <div class="endGameScreen">\n            <h3>Упражнение завершено!</h3>\n            <p>Осталось повторений: '.concat(l,'</p>\n            <button id="restartBtn" class="btn btn-primary">Повторить</button>\n            <button id="exitBtn" class="btn btn-secondary">Выйти</button>\n        </div>\n    ');var c=document.getElementById("restartBtn"),d=document.getElementById("exitBtn");c.addEventListener("click",(function(){e(),n(i,o,r,l)})),d.addEventListener("click",(function(){t(),a()}))}(i,o,r,l):(document.getElementById("gameContainer").innerHTML='\n        <div class="endGameScreen">\n            <h3>Игра окончена!</h3>\n            <button id="exitBtn" class="btn btn-secondary">Выйти</button>\n        </div>\n    ',document.getElementById("exitBtn").addEventListener("click",(function(){t(),a()})))}u&&u.addEventListener("click",(function(){clearInterval(c),clearTimeout(d),g()})),function n(){var t=y[b],e=t.duration,a=t.interval;c=setInterval((function(){m=v?i:r,v=!v,s.textContent=m}),a),d=setTimeout((function(){clearInterval(c),++b<y.length?n():g()}),e)}()}function t(){var n=document.getElementById("verbLearningGameContainer"),t=document.getElementById("gameContainer"),e=document.getElementById("startLearningBtn");t.style.display="none",n.style.display="block",e.style.display="block"}function e(){document.getElementById("gameContainer").innerHTML='\n        \x3c!--<button id="backBtn" class="btn btn-secondary">Назад</button>--\x3e\n        <button id="stopBtn" class="btn btn-danger">Стоп</button>\n        <div id="cardContainer" class="card-container"></div>\n    '}function a(){var n=document.querySelector(".verbDetails"),t=document.getElementById("startLearningBtn");n.style.display="block",t.style.display="block"}document.addEventListener("DOMContentLoaded",(function(){var t=document.getElementById("startLearningBtn"),a=document.querySelector(".verbDetails");t.addEventListener("click",(function(){var t,i;a?(t=a.dataset.letter,i=a.dataset.verb,fetch("/verbs/letter/".concat(t,"/").concat(i,"/learn/visually")).then((function(n){return n.json()}))).then((function(t){console.log("verbLearning.js | data: ",t),t.translation&&t.translation.translations?(document.querySelector(".verbDetails").style.display="none",function(){var n=document.getElementById("verbLearningGameContainer"),t=document.getElementById("startLearningBtn"),e=document.getElementById("gameContainer");t.style.display="none",e.style.display="block",n.style.display="block"}(),e(),function(t,a){var i=document.getElementById("gameContainer"),o="";a.forEach((function(n,t){o+='<option value="'.concat(n,'">').concat(n,"</option>")})),i.innerHTML='\n        <div class="gameSettings">\n            <h3>Настройки игры</h3>\n            <div>\n                <label for="translationSelect">Выберите перевод:</label>\n                <select id="translationSelect">'.concat(o,'</select>\n            </div>\n            <div>\n                <label for="repetitionsInput">Количество повторений:</label>\n                <input type="number" id="repetitionsInput" min="1" max="10" value="1">\n            </div>\n            <button id="startGameBtn" class="btn btn-primary">Начать игру</button>\n        </div>\n    '),document.getElementById("startGameBtn").addEventListener("click",(function(){var i=document.getElementById("translationSelect"),o=document.getElementById("repetitionsInput"),r=i.value,l=parseInt(o.value,10);e(),n(t,a,r,l)}))}(t.verb,t.translation.translations)):console.error("Отсутствует перевод или варианты перевода")})).catch((function(n){console.error("Ошибка при получении данных:",n)})):console.error("Элемент .verbDetails не найден")}))}))})();