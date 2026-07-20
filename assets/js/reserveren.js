/* Reserveren van een toestel. Dit bestand doet twee dingen, afhankelijk van de
   pagina waarop het staat:

   1. Op webshop.html: het zet achter elke Reserveren-link het gekozen model,
      zodat reserveren.html weet waar het over gaat.
   2. Op reserveren.html: het vult dat model in en verstuurt het formulier,
      per e-mail via Web3Forms of via WhatsApp.

   Het formulier heeft JavaScript nodig; er is geen server om op terug te
   vallen. De links op de webshoppagina werken wél zonder: dan kom je gewoon op
   een leeg formulier uit en typ je het model zelf.

   Dit bestand lijkt op afspraak.js maar staat er los van. Ze delen geen code
   omdat ze verschillende velden hebben; de overeenkomst zit in de opzet, niet
   in de inhoud. Verandert er iets aan de manier van versturen, kijk dan of het
   in beide bestanden moet. */

(function () {
  'use strict';

  /* Web3Forms-sleutel, dezelfde als op het afspraakformulier: beide formulieren
     komen binnen op hetzelfde adres. Deze sleutel staat bewust gewoon in de
     code; hij is geen wachtwoord, want hij kan alleen post versturen naar dat
     ene vastgelegde adres. */
  var WEB3FORMS_SLEUTEL = '37d7af45-ea97-423f-b67f-e34039eefa09';

  /* Internationale vorm: 31 in plaats van de 0, zonder plusteken of streepjes.
     Anders opent wa.me een leeg gesprek. */
  var WHATSAPP_NUMMER = '31528235734';

  var TELEFOON = '0528 - 23 57 34';

  /* ------------------------------------------------------------------
     1. WEBSHOPPAGINA — het model achter de link zetten
     ------------------------------------------------------------------
     De modelnaam wordt uit de kaart zelf gelezen, niet uit een apart
     attribuut. Zo staat het model op één plek in de HTML: past u de kop van
     een kaart aan, dan verandert de link vanzelf mee. Met een los attribuut
     zou u het op twee plekken moeten bijhouden, en dan gaat er ooit één
     vergeten worden.

     Het gebeurt bij het laden en niet pas bij de klik: dan klopt ook wat er
     in de statusbalk verschijnt als u over de knop zweeft, en werkt openen
     in een nieuw tabblad zoals verwacht. */
  var kaarten = document.querySelectorAll('.kaart-toestel');
  Array.prototype.forEach.call(kaarten, function (kaart) {
    var link = kaart.querySelector('.knop-reserveer');
    if (!link) { return; }

    var merk = kaart.querySelector('.toestel-merk');
    var model = kaart.querySelector('.toestel-model');
    var naam = [
      merk ? merk.textContent.trim() : '',
      model ? model.textContent.trim() : ''
    ].join(' ').trim();

    /* Zolang de kaarten nog op MERK / MODEL INVULLEN staan, geven we niets
       door: anders begint de klant aan een formulier waarin letterlijk
       "MODEL INVULLEN" staat. Zodra de echte modellen ingevuld zijn, gaat dit
       vanzelf werken zonder dat hier iets aan hoeft te veranderen. */
    if (naam === '' || naam.indexOf('INVULLEN') !== -1) { return; }

    link.href = 'reserveren.html?toestel=' + encodeURIComponent(naam);
  });

  /* ------------------------------------------------------------------
     2. RESERVEERPAGINA — formulier vullen en versturen
     ------------------------------------------------------------------ */
  var formulier = document.getElementById('reserveer-formulier');
  if (!formulier) { return; }

  var foutregel = document.getElementById('reserveer-fout');
  var gelukt = document.getElementById('reserveer-gelukt');
  var knop = document.getElementById('reserveer-knop');
  var toestelveld = document.getElementById('r-toestel');

  /* Het model uit de webadresregel halen. URLSearchParams doet het parsen;
     dat zit in elke browser van na 2017. Lukt het niet, dan blijft het veld
     leeg en typt de bezoeker het zelf — geen foutmelding nodig. */
  try {
    var uitAdres = new URLSearchParams(window.location.search).get('toestel');
    if (uitAdres && toestelveld.value === '') {
      toestelveld.value = uitAdres.trim();
    }
  } catch (e) { /* oude browser: veld blijft leeg, dat is geen probleem */ }

  function toonFout(tekst) {
    foutregel.textContent = tekst;
    foutregel.hidden = false;
    foutregel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function waarde(naam) {
    var veld = formulier.elements[naam];
    return veld ? veld.value.trim() : '';
  }

  /* Leest het formulier uit en controleert het. Klopt er iets niet, dan zet
     deze functie de melding neer en geeft null terug; de aanroeper stopt dan.
     Beide knoppen gebruiken dit, zodat de twee routes niet uit elkaar lopen. */
  function leesFormulier() {
    foutregel.hidden = true;

    // Spambot: het onzichtbare veld is ingevuld. We doen alsof er niets
    // gebeurt — een foutmelding zou de bot alleen maar wijzer maken.
    if (waarde('website') !== '') { return null; }

    var gegevens = {
      naam: waarde('naam'),
      telefoon: waarde('telefoon'),
      email: waarde('email'),
      toestel: waarde('toestel'),
      abonnement: waarde('abonnement'),
      opmerking: waarde('opmerking')
    };

    if (gegevens.naam === '' || gegevens.telefoon === '' || gegevens.toestel === '') {
      toonFout('Vul alstublieft uw naam, telefoonnummer en het toestel in.');
      return null;
    }

    /* Vangnet voor het geval iemand toch met een niet-ingevulde modelnaam op
       deze pagina belandt. Beter hier tegenhouden dan als onbruikbare
       aanvraag binnenkrijgen. */
    if (gegevens.toestel.indexOf('INVULLEN') !== -1) {
      toonFout('Dit toestel is nog niet ingevuld op de website. Typt u zelf even merk en model, of bel ons op ' + TELEFOON + '.');
      return null;
    }

    return gegevens;
  }

  /* Bouwt de regels die zowel in de e-mail als in het WhatsApp-bericht komen,
     zodat beide routes dezelfde informatie doorgeven. */
  function alsRegels(g) {
    return [
      'Reservering via de website',
      '',
      'Naam: ' + g.naam,
      'Telefoon: ' + g.telefoon,
      'E-mail: ' + (g.email || 'niet ingevuld'),
      'Toestel: ' + g.toestel,
      'Abonnement: ' + (g.abonnement || 'nog niet beslist'),
      'Opmerking: ' + (g.opmerking || 'geen')
    ];
  }

  /* --- Versturen via WhatsApp ---
     Opent WhatsApp met het bericht al ingevuld. Versturen doet de klant zelf
     met de verzendknop in WhatsApp: een website kan namens iemand anders geen
     bericht de deur uit doen. Daarom zegt de tekst onder de knoppen dat
     WhatsApp opengaat, en niet dat er iets verstuurd is. */
  var whatsappKnop = document.getElementById('reserveer-whatsapp');
  if (whatsappKnop) {
    whatsappKnop.addEventListener('click', function () {
      var gegevens = leesFormulier();
      if (gegevens === null) { return; }

      // encodeURIComponent, anders sneuvelen de regeleinden en tekens als &.
      window.open(
        'https://wa.me/' + WHATSAPP_NUMMER + '?text=' +
          encodeURIComponent(alsRegels(gegevens).join('\n')),
        '_blank'
      );
    });
  }

  formulier.addEventListener('submit', function (e) {
    e.preventDefault();

    var gegevens = leesFormulier();
    if (gegevens === null) { return; }

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
        subject: 'Reservering — ' + gegevens.toestel,
        from_name: 'Website Optie1 Hoogeveen',
        // Het adres van de klant als antwoordadres: in Gmail kun je dan
        // meteen op Beantwoorden drukken.
        replyto: gegevens.email || '',
        Naam: gegevens.naam,
        Telefoon: gegevens.telefoon,
        'E-mail': gegevens.email || '(niet ingevuld)',
        Toestel: gegevens.toestel,
        Abonnement: gegevens.abonnement || '(nog niet beslist)',
        Opmerking: gegevens.opmerking || '(geen)'
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
