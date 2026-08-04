/* Fotoslider voor toestelkaarten (.toestel-foto).
   Staat er in een kaart maar één foto, dan gebeurt er niets. Staan er twee of
   meer <img>'s in hetzelfde .toestel-foto-vak, dan zet dit bestand er een
   linker- en rechterpijl bij waarmee de bezoeker zelf door de foto's van dat
   toestel klikt (bijvoorbeeld voor-, achter- en zijkant). Geen automatisch
   wisselen: de bezoeker bepaalt het tempo. */

(function () {
  'use strict';

  document.querySelectorAll('.toestel-foto').forEach(function (vak) {
    var fotos = vak.querySelectorAll('img');
    if (fotos.length < 2) return;

    var huidig = 0;
    fotos[0].classList.add('foto-actief');

    function toon(index) {
      fotos[huidig].classList.remove('foto-actief');
      huidig = (index + fotos.length) % fotos.length;
      fotos[huidig].classList.add('foto-actief');
    }

    function maakPijl(className, label, richting) {
      var pijl = document.createElement('button');
      pijl.type = 'button';
      pijl.className = 'foto-pijl ' + className;
      pijl.setAttribute('aria-label', label);
      pijl.textContent = richting < 0 ? '‹' : '›';
      pijl.addEventListener('click', function (e) {
        e.preventDefault();
        toon(huidig + richting);
      });
      return pijl;
    }

    vak.appendChild(maakPijl('foto-pijl-vorige', 'Vorige foto', -1));
    vak.appendChild(maakPijl('foto-pijl-volgende', 'Volgende foto', 1));
  });
})();
