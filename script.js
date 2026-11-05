document.querySelectorAll('.menu-toggle').forEach(function(b){b.addEventListener('click',function(){var n=this.parentElement.querySelector('.nav');if(n)n.classList.toggle('open');});});

// Ajustes puntuales de Saberes del Territorio (noviembre 2026).
// Se conserva toda la plantilla original, sus estilos y el menu.
(function () {
  'use strict';
  var path = location.pathname.split('/').pop();

  // Portada del proyecto: cambiar solamente la fotografia, no el diseno.
  if (path === 'saberes-del-territorio.html') {
    var hero = document.querySelector('.visual-hero .visual-bg');
    if (hero) hero.style.backgroundImage = "url('assets/img/saberes-portada-oficios.jpg')";

    // Taller celebrado: no ofrecer inscripcion ni lista de espera.
    var alfareriaCard = document.querySelector('.saber-card[data-activity-id="alfareria"]');
    if (alfareriaCard) {
      alfareriaCard.removeAttribute('data-activity-id');
      var state = alfareriaCard.querySelector('.registration-state');
      if (state) {
        state.textContent = 'TALLER CELEBRADO';
        state.classList.remove('availability-full', 'availability-pulse');
      }
      alfareriaCard.querySelectorAll('a.registration-button').forEach(function (a) { a.remove(); });
      // El contador de plazas consulta de forma asincrona: impedir que reponga el mensaje de lista de espera.
      if (state) {
        new MutationObserver(function () {
          if (state.textContent !== 'TALLER CELEBRADO') state.textContent = 'TALLER CELEBRADO';
        }).observe(state, {childList:true, characterData:true, subtree:true});
      }
    }
  }

  // Ficha Alfareria: cerrar inscripcion y ofrecer material audiovisual.
  if (path === 'alfareria.html') {
    var detail = document.querySelector('.detail-layout[data-activity-id="alfareria"]');
    if (detail) detail.removeAttribute('data-activity-id');
    var badge = document.querySelector('.detail-copy .registration-state');
    if (badge) {
      badge.textContent = 'TALLER CELEBRADO';
      badge.classList.remove('availability-full', 'availability-pulse');
      new MutationObserver(function () {
        if (badge.textContent !== 'TALLER CELEBRADO') badge.textContent = 'TALLER CELEBRADO';
      }).observe(badge, {childList:true, characterData:true, subtree:true});
    }
    var actions = document.querySelector('.detail-copy .inline-actions');
    if (actions) {
      actions.querySelectorAll('a.registration-button').forEach(function (a) { a.remove(); });
      var video = document.createElement('a');
      video.className = 'button';
      video.href = 'https://www.youtube.com/watch?v=23a5cklWCTg';
      video.target = '_blank';
      video.rel = 'noopener noreferrer';
      video.textContent = 'VER ENTREVISTA DE CESAR RODRIGUEZ';
      actions.appendChild(video);
      var shorts = document.createElement('a');
      shorts.className = 'button secondary';
      shorts.href = 'https://www.youtube.com/channel/UCI8iVCYel_OhMeTrtUNsnHQ/shorts';
      shorts.target = '_blank';
      shorts.rel = 'noopener noreferrer';
      shorts.textContent = 'SHORTS DEL CANAL';
      actions.appendChild(shorts);
    }
    var note = document.querySelector('.detail-copy .capacity-note');
    if (note) note.textContent = 'Taller realizado el 17 de octubre de 2026 en Arroyo de la Luz.';
  }
})();
