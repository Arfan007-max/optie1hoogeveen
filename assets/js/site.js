/* Gedeelde scripts voor alle pagina's van Optie1 Hoogeveen.
   Geen externe afhankelijkheden. De site werkt volledig zonder dit bestand;
   alles hieronder is een verbetering bovenop werkende HTML. */

(function () {
  'use strict';

  /* Uitklapmenu op smalle schermen */
  var knop = document.querySelector('.menu-knop');
  var menu = document.getElementById('hoofdmenu');
  if (!knop || !menu) return;

  // De knop staat standaard verborgen in de HTML en wordt hier zichtbaar
  // gemaakt. Zonder JavaScript blijft het menu gewoon uitgeklapt staan.
  knop.hidden = false;
  document.querySelector('.site-header').classList.add('js-menu');

  knop.addEventListener('click', function () {
    var open = knop.getAttribute('aria-expanded') === 'true';
    knop.setAttribute('aria-expanded', String(!open));
    menu.classList.toggle('is-open', !open);
  });

  // Sluiten met Escape, zodat het menu niet blijft hangen bij toetsenbordgebruik.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && knop.getAttribute('aria-expanded') === 'true') {
      knop.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
      knop.focus();
    }
  });

  // Bij terugschalen naar een breed scherm de mobiele staat opruimen.
  window.addEventListener('resize', function () {
    if (window.innerWidth > 860) {
      knop.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
    }
  });
})();
