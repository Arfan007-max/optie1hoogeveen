/* Gedeelde scripts voor alle pagina's van Optie1 Hoogeveen.
   Geen externe afhankelijkheden. De site werkt volledig zonder dit bestand;
   alles hieronder is een verbetering bovenop werkende HTML. */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. Uitklapmenu op smalle schermen
     ------------------------------------------------------------------ */
  var knop = document.querySelector('.menu-knop');
  var menu = document.getElementById('hoofdmenu');

  if (knop && menu) {
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
  }

  /* ------------------------------------------------------------------
     2. Openingsstatus in de infokaart (alleen op de homepage aanwezig)
     ------------------------------------------------------------------
     Let op: dit gebruikt de klok van de bezoeker. Wie zijn apparaat op een
     andere tijdzone heeft staan, ziet mogelijk een afwijkende status.
     Wijzigen de openingstijden? Pas ze hieronder én in de tabellen op
     index.html en contact.html en in de JSON-LD in index.html aan. */

  var status = document.getElementById('winkelstatus');
  var dagVeld = document.getElementById('vandaag-dag');
  var tijdVeld = document.getElementById('vandaag-tijd');
  if (!status || !dagVeld || !tijdVeld) return;

  var dagen = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  // Per dag [openen, sluiten] in minuten na middernacht; null is gesloten.
  var tijden = [
    null,          // zondag
    [720, 1020],   // maandag  12:00 - 17:00
    [600, 1020],   // dinsdag  10:00 - 17:00
    [600, 1020],   // woensdag
    [600, 1020],   // donderdag
    [600, 1020],   // vrijdag
    [600, 1020]    // zaterdag
  ];

  function alsTijd(m) {
    var u = Math.floor(m / 60), r = m % 60;
    return (u < 10 ? '0' : '') + u + ':' + (r < 10 ? '0' : '') + r;
  }

  var nu = new Date();
  var dag = nu.getDay();
  var minuten = nu.getHours() * 60 + nu.getMinutes();
  var vandaag = tijden[dag];

  dagVeld.textContent = dagen[dag].charAt(0).toUpperCase() + dagen[dag].slice(1);
  tijdVeld.textContent = vandaag ? alsTijd(vandaag[0]) + ' – ' + alsTijd(vandaag[1]) : 'Gesloten';

  var open = vandaag && minuten >= vandaag[0] && minuten < vandaag[1];
  var tekst;

  if (open) {
    tekst = 'Nu geopend — tot ' + alsTijd(vandaag[1]);
  } else if (vandaag && minuten < vandaag[0]) {
    tekst = 'Gesloten — vandaag open vanaf ' + alsTijd(vandaag[0]);
  } else {
    var d = dag;
    for (var i = 1; i <= 7; i++) {
      d = (dag + i) % 7;
      if (tijden[d]) break;
    }
    var wanneer = (d === (dag + 1) % 7) ? 'morgen' : dagen[d];
    tekst = 'Gesloten — ' + wanneer + ' open vanaf ' + alsTijd(tijden[d][0]);
  }

  status.className = 'status ' + (open ? 'status-open' : 'status-dicht');
  status.innerHTML = '<span class="status-stip" aria-hidden="true"></span>' + tekst;
  status.hidden = false;
})();
