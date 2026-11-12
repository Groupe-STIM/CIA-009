/* Ten fixed domain-recognition questions. URLs are examples, never opened. */
const URL_QUIZ_QUESTIONS = [
  { url: 'https://devforum.roblox.com/', choices: ['devforum.roblox.com', 'roblox.com', 'devforum.com', 'forum.com'], answer: 1,
    explanation: 'Le domaine principal est roblox.com. « devforum » est un sous-domaine.' },
  { url: 'https://login.roblox.com.verification-urgence.com/connexion', choices: ['roblox.com', 'login.roblox.com', 'verification-urgence.com', 'urgence.com'], answer: 2,
    explanation: 'Le domaine principal est verification-urgence.com. « login.roblox.com » au début ne transforme pas cette adresse en site Roblox.' },
  { url: 'https://www.fortnite.com/news?lang=fr', choices: ['fortnite.com', 'www.fortnite.com', 'news.com', 'epicgames.com'], answer: 0,
    explanation: 'Le domaine principal est fortnite.com. « www » est un sous-domaine ; /news et ?lang=fr indiquent une page et une option.' },
  { url: 'https://epicgames.com.verification-compte.net/inscription', choices: ['epicgames.com', 'compte.net', 'epicgames.net', 'verification-compte.net'], answer: 3,
    explanation: 'Le domaine principal est verification-compte.net. « epicgames.com » est ici un sous-domaine trompeur.' },
  { url: 'https://www.minecraft.net/fr-fr', choices: ['www.minecraft.net', 'minecraft.net', 'minecraft.com', 'microsoft.com'], answer: 1,
    explanation: 'Le domaine principal est minecraft.net. « www » et le chemin /fr-fr n’en font pas partie.' },
  { url: 'https://www.minecraft.skins.net/cadeau', choices: ['minecraft.net', 'minecraft.skins.net', 'skins.net', 'www.minecraft.net'], answer: 2,
    explanation: 'Le domaine principal est skins.net. Le mot « minecraft » placé avant ne prouve pas que le site appartient à Minecraft.' },
  { url: 'https://accounts.google.com/signin', choices: ['google.com', 'accounts.google.com', 'accounts.com', 'google-signin.com'], answer: 0,
    explanation: 'Le domaine principal est google.com. « accounts » est un sous-domaine et /signin est le chemin.' },
  { url: 'https://security.google.com.verification-compte.com/', choices: ['google.com', 'security.google.com', 'compte.com', 'verification-compte.com'], answer: 3,
    explanation: 'Le domaine principal est verification-compte.com. « security.google.com » est un sous-domaine qui cherche à inspirer confiance.' },
  { url: 'https://security.microsoft.com/compte', choices: ['security.com', 'microsoft.com', 'security.microsoft.com', 'compte.com'], answer: 1,
    explanation: 'Le domaine principal est microsoft.com. « security » est un sous-domaine et /compte est le chemin.' },
  { url: 'https://login.microsoft.com.verification-securite.com/', choices: ['microsoft.com', 'login.microsoft.com', 'verification-securite.com', 'securite.com'], answer: 2,
    explanation: 'Le domaine principal est verification-securite.com. « login.microsoft.com » n’est que le début trompeur de l’adresse.' }
];

function createUrlQuizState(){
  return { index: 0, answers: Array(URL_QUIZ_QUESTIONS.length).fill(null), finished: false };
}

function answerUrlQuiz(state, choice){
  if(state.finished || state.answers[state.index] !== null || !Number.isInteger(choice)
    || choice < 0 || choice >= URL_QUIZ_QUESTIONS[state.index].choices.length) return false;
  state.answers[state.index] = choice;
  return true;
}

function advanceUrlQuiz(state){
  if(state.finished || state.answers[state.index] === null) return false;
  if(state.index === URL_QUIZ_QUESTIONS.length - 1) state.finished = true;
  else state.index++;
  return true;
}

function getUrlQuizScore(state){
  return state.answers.reduce((score, answer, index) => score + (answer === URL_QUIZ_QUESTIONS[index].answer ? 1 : 0), 0);
}

function formatUrlQuizAddress(question, answered){
  if(!answered) return escapeHtml(question.url);
  const result = analyzeLearningUrl(question.url);
  const start = result.domainOffset;
  return `${escapeHtml(result.fullUrl.slice(0, start))}<mark class="url-quiz-domain">${escapeHtml(result.domain)}</mark>${escapeHtml(result.fullUrl.slice(start + result.domain.length))}`;
}

window.addEventListener('DOMContentLoaded', () => {
  const launcher = document.getElementById('url-quiz-button');
  const dialog = document.getElementById('url-quiz-dialog');
  const content = document.getElementById('url-quiz-content');
  const counter = document.getElementById('url-quiz-counter');
  const progress = document.getElementById('url-quiz-progress');
  let state = createUrlQuizState();
  const render = (focus = true) => {
    progress.value = state.answers.filter(answer => answer !== null).length;
    if(state.finished){
      counter.textContent = 'Quiz terminé';
      content.innerHTML = `<section class="url-quiz-summary"><h3 tabindex="-1">Ton résultat</h3><p class="url-quiz-score">${getUrlQuizScore(state)}<span> / 10</span></p><p>Tu as terminé les dix questions sur le domaine principal des adresses Web.</p><button type="button" class="btn primary" id="url-quiz-restart">Recommencer le quiz</button></section>`;
      document.getElementById('url-quiz-restart').addEventListener('click', () => { state = createUrlQuizState(); render(); });
      if(focus) content.querySelector('h3').focus();
      return;
    }
    const question = URL_QUIZ_QUESTIONS[state.index];
    const chosen = state.answers[state.index];
    const answered = chosen !== null;
    const correct = chosen === question.answer;
    counter.textContent = `Question ${state.index + 1} / ${URL_QUIZ_QUESTIONS.length}`;
    content.innerHTML = `<h3 id="url-quiz-question" tabindex="-1">Quel est le domaine principal de cette adresse ?</h3><p class="url-quiz-instruction">Choisis le nom du domaine avec son extension.</p><div class="url-quiz-address">${formatUrlQuizAddress(question, answered)}</div><div class="url-quiz-choices" role="group" aria-labelledby="url-quiz-question">${question.choices.map((choice, index) => {
      const isRight = answered && index === question.answer;
      const isWrong = answered && index === chosen && !correct;
      return `<button type="button" class="url-quiz-choice${isRight ? ' is-correct' : ''}${isWrong ? ' is-incorrect' : ''}" data-quiz-choice="${index}" ${answered ? 'disabled' : ''}><span class="url-quiz-letter">${'ABCD'[index]}</span><span class="url-quiz-choice-text">${escapeHtml(choice)}</span>${isRight ? '<span class="url-quiz-choice-status">✓ Bonne réponse</span>' : isWrong ? '<span class="url-quiz-choice-status">✕ Ta réponse</span>' : ''}</button>`;
    }).join('')}</div><div class="url-quiz-feedback" role="status" aria-live="polite">${answered ? `<div class="${correct ? 'url-quiz-feedback-correct' : 'url-quiz-feedback-wrong'}" tabindex="-1"><strong>${correct ? 'BRAVO !' : 'La bonne réponse est surlignée.'}</strong><p>${escapeHtml(question.explanation)}</p></div>` : ''}</div><div class="url-quiz-footer"><span>${answered ? 'Les choix sont verrouillés pour cette question.' : 'Une seule réponse possible.'}</span><button type="button" class="btn primary" id="url-quiz-next" ${answered ? '' : 'disabled'}>${state.index === URL_QUIZ_QUESTIONS.length - 1 ? 'Voir mon résultat' : 'Suivant →'}</button></div>`;
    content.querySelectorAll('[data-quiz-choice]').forEach(button => {
      button.addEventListener('click', () => {
        if(!answerUrlQuiz(state, Number(button.dataset.quizChoice))) return;
        render(false);
        content.querySelector('.url-quiz-feedback > div').focus();
      });
    });
    document.getElementById('url-quiz-next').addEventListener('click', () => {
      if(advanceUrlQuiz(state)) render();
    });
    if(focus) content.querySelector('h3').focus();
  };
  launcher.addEventListener('click', () => { render(false); dialog.showModal(); });
  document.getElementById('url-quiz-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => launcher.focus());
  dialog.addEventListener('click', event => {
    if(event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if(event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
});
