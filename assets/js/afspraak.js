/* Afspraakformulier op afspraak.html.
   Verstuurt de aanvraag via Web3Forms, een gratis dienst die van de ingevulde
   gegevens een e-mail maakt. Zo is er geen eigen server of PHP nodig; de site
   blijft dus een verzameling losse bestanden.

   Zonder JavaScript werkt dit formulier niet. Dat is hier bewust: er is geen
   server om naar terug te vallen. Wie geen JavaScript heeft, krijgt bij een
   verzendpoging het telefoonnummer te zien in plaats van een stille storing. */

(function () {
  'use strict';

  /* Web3Forms-sleutel van het formulier "Optie1 Hoogeveen".
     Hoort bij het account op optie1hoogeveen@gmail.com; aanvragen komen daar
     binnen. Deze sleutel staat bewust gewoon in de code: hij is geen wachtwoord,
     want hij kan alleen post versturen naar dat ene vastgelegde adres.
     Een nieuwe nodig? Zie het overzicht op app.web3forms.com. */
  var WEB3FORMS_SLEUTEL = '37d7af45-ea97-423f-b67f-e34039eefa09';

  var TELEFOON = '0528 - 23 57 34';

  var formulier = document.getElementById('afspraak-formulier');
  if (!formulier) { return; }

  var foutregel = document.getElementById('formulier-fout');
  var gelukt = document.getElementById('formulier-gelukt');
  var knop = document.getElementById('verstuur-knop');

  function toonFout(tekst) {
    foutregel.textContent = tekst;
    foutregel.hidden = false;
    foutregel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function waarde(naam) {
    var veld = formulier.elements[naam];
    return veld ? veld.value.trim() : '';
  }

  formulier.addEventListener('submit', function (e) {
    e.preventDefault();
    foutregel.hidden = true;

    // Spambot: het onzichtbare veld is ingevuld. We doen alsof er niets
    // gebeurt — een foutmelding zou de bot alleen maar wijzer maken.
    if (waarde('website') !== '') { return; }

    var naam = waarde('naam');
    var telefoon = waarde('telefoon');
    var email = waarde('email');
    var toestel = waarde('toestel');
    var probleem = waarde('probleem');
    var moment = waarde('moment');

    if (naam === '' || telefoon === '' || toestel === '' || probleem === '') {
      toonFout('Vul alstublieft uw naam, telefoonnummer, het toestel en de klacht in.');
      return;
    }

    if (WEB3FORMS_SLEUTEL === 'SLEUTEL-INVULLEN') {
      toonFout('Het formulier is nog niet actief. Belt u ons gerust op ' + TELEFOON + '.');
      return;
    }

    var origineel = knop.textContent;
    knop.disabled = true;
    knop.textContent = 'Bezig met versturen…';

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_SLEUTEL,
        subject: 'Afspraak aangevraagd — ' + toestel,
        from_name: 'Website Optie1 Hoogeveen',
        // Het adres van de klant als antwoordadres: in Gmail kun je dan
        // meteen op Beantwoorden drukken.
        replyto: email || '',
        Naam: naam,
        Telefoon: telefoon,
        'E-mail': email || '(niet ingevuld)',
        Toestel: toestel,
        Klacht: probleem,
        Voorkeursmoment: moment || '(geen voorkeur opgegeven)'
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (resultaat) {
        if (resultaat.success) {
          formulier.hidden = true;
          gelukt.hidden = false;
          gelukt.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          toonFout('Het versturen is helaas niet gelukt. Probeert u het nog eens, of bel ons op ' + TELEFOON + '.');
        }
      })
      .catch(function () {
        toonFout('Er is geen verbinding. Controleer uw internet of bel ons op ' + TELEFOON + '.');
      })
      .then(function () {
        knop.disabled = false;
        knop.textContent = origineel;
      });
  });
})();
