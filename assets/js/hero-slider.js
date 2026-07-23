/* Hero-slider op de homepage.
   Geen externe afhankelijkheden. Draait dit bestand niet, dan blijft de eerste
   dia staan en zijn de knoppen verborgen — precies de hero die er altijd was.

   Een automatisch doorschuivende slider is niet zonder risico: hij haalt tekst
   weg voordat een langzame lezer klaar is. Vandaar:
   - 7 seconden per dia, ruim bemeten;
   - een pauzeknop die er altijd staat (verplicht zodra iets vanzelf beweegt);
   - stilstand zodra de muis erboven hangt of de toetsenbordfocus erin staat;
   - stilstand zodra de bezoeker zelf een knop gebruikt: dan heeft hij het
     overgenomen en moet het niet onder zijn handen vandaan schuiven;
   - stilstand als het tabblad naar de achtergrond gaat;
   - en helemaal geen automatisch doorschuiven als iemand in zijn systeem heeft
     aangegeven bewegende beelden te willen beperken. */

(function () {
  'use strict';

  var slider = document.querySelector('.hero-slider');
  if (!slider) return;

  var diaVak = slider.querySelector('.dias');
  var bediening = slider.querySelector('.slider-bediening');
  var stippenVak = slider.querySelector('.slider-stippen');
  var pauzeKnop = slider.querySelector('.slider-pauze');
  var dias = Array.prototype.slice.call(slider.querySelectorAll('.dia'));

  // Bij één dia valt er niets te schuiven; laat de bediening dan verborgen.
  if (!diaVak || !bediening || !stippenVak || !pauzeKnop || dias.length < 2) return;

  var WISSELTIJD = 7000;
  var huidig = 0;
  var timer = null;

  // Wie bewegende beelden heeft beperkt, begint met een stilstaande slider.
  // Drukt hij alsnog op afspelen, dan gaat hij lopen: het blijft zijn keuze.
  var stilgezet = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  bediening.hidden = false;

  var stippen = dias.map(function (dia, i) {
    var knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'slider-stip';
    knop.setAttribute('aria-label', 'Dia ' + (i + 1) + ' van ' + dias.length);
    knop.addEventListener('click', function () {
      toon(i);
      zetStil();
    });
    stippenVak.appendChild(knop);
    return knop;
  });

  function toon(i) {
    huidig = (i + dias.length) % dias.length;
    dias.forEach(function (dia, n) {
      dia.classList.toggle('is-actief', n === huidig);
    });
    stippen.forEach(function (stip, n) {
      stip.setAttribute('aria-current', String(n === huidig));
    });
  }

  /* aria-live staat uit zolang hij vanzelf doorschuift: anders leest een
     schermlezer om de zeven seconden een nieuwe dia voor, dwars door alles
     heen wat de bezoeker aan het doen was. Staat hij stil, dan is een wissel
     een bewuste handeling en mag hij wél gemeld worden. */
  function start() {
    stop();
    if (stilgezet) return;
    diaVak.setAttribute('aria-live', 'off');
    timer = window.setInterval(function () { toon(huidig + 1); }, WISSELTIJD);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
    diaVak.setAttribute('aria-live', 'polite');
  }

  function werkPauzeknopBij() {
    pauzeKnop.classList.toggle('is-gepauzeerd', stilgezet);
    pauzeKnop.setAttribute(
      'aria-label',
      stilgezet ? 'Diavertoning afspelen' : 'Diavertoning pauzeren'
    );
  }

  function zetStil() {
    stilgezet = true;
    stop();
    werkPauzeknopBij();
  }

  pauzeKnop.addEventListener('click', function () {
    stilgezet = !stilgezet;
    werkPauzeknopBij();
    if (stilgezet) { stop(); } else { start(); }
  });

  Array.prototype.slice.call(slider.querySelectorAll('[data-dia]')).forEach(function (knop) {
    knop.addEventListener('click', function () {
      toon(huidig + (knop.getAttribute('data-dia') === 'vorige' ? -1 : 1));
      zetStil();
    });
  });

  /* Pijltjestoetsen werken alleen als de focus in de slider staat, dus ze
     kapen het scrollen van de pagina niet. */
  slider.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    toon(huidig + (e.key === 'ArrowLeft' ? -1 : 1));
    zetStil();
  });

  // Tijdelijke stilstand: dit zet `stilgezet` bewust niet aan, want de bezoeker
  // heeft niets uitgezet — hij kijkt of leest even.
  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);
  slider.addEventListener('focusin', stop);
  slider.addEventListener('focusout', function (e) {
    if (!slider.contains(e.relatedTarget)) start();
  });

  // Doorschuiven in een tabblad dat niemand ziet, is alleen stroomverbruik.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stop(); } else { start(); }
  });

  toon(0);
  werkPauzeknopBij();
  start();
})();
