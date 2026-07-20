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

  /* --- Dag en tijd ---------------------------------------------------------

     OPENINGSTIJDEN per weekdag, zoals JavaScript ze nummert: 0 is zondag,
     1 maandag, ... 6 zaterdag. Staat een dag hier niet in, dan is de winkel
     dicht en kan die dag niet gekozen worden.

     `laatste` is het laatste tijdstip dat te kiezen is, niet het sluitingsuur:
     om 17:00 gaat de deur dicht, dus de laatste afspraak staat om 16:30. Wijzigen
     de openingstijden, dan hoeft alleen deze tabel aangepast — de lijst met
     tijden rolt er vanzelf uit. Vergeet dan niet ook de tekst onder de velden
     in afspraak.html en de openingstijden op contact.html bij te werken. */
  var OPENINGSTIJDEN = {
    1: { eerste: '12:00', laatste: '16:30' },
    2: { eerste: '10:00', laatste: '16:30' },
    3: { eerste: '10:00', laatste: '16:30' },
    4: { eerste: '10:00', laatste: '16:30' },
    5: { eerste: '10:00', laatste: '16:30' },
    6: { eerste: '10:00', laatste: '16:30' }
  };

  /* Om de hoeveel minuten er een tijdstip in de lijst komt. */
  var STAP_MINUTEN = 30;

  /* Hoe ver vooruit er gekozen kan worden. Verder dan een paar maanden heeft
     geen zin: dan weet niemand nog of het uitkomt. */
  var MAX_DAGEN_VOORUIT = 90;

  var datumveld = document.getElementById('f-datum');
  var tijdveld = document.getElementById('f-tijd');

  function naarMinuten(tijd) {
    var delen = tijd.split(':');
    return Number(delen[0]) * 60 + Number(delen[1]);
  }

  function naarTijd(minuten) {
    var uur = Math.floor(minuten / 60);
    var min = minuten % 60;
    return (uur < 10 ? '0' : '') + uur + ':' + (min < 10 ? '0' : '') + min;
  }

  /* Een datum als JJJJ-MM-DD, de vorm die <input type="date"> gebruikt.
     Bewust niet toISOString(): die rekent naar UTC om, en in de Nederlandse
     zomertijd levert dat vóór 02:00 's nachts de dag ervoor op. */
  function alsDatumwaarde(datum) {
    var maand = datum.getMonth() + 1;
    var dag = datum.getDate();
    return datum.getFullYear() + '-' + (maand < 10 ? '0' : '') + maand +
      '-' + (dag < 10 ? '0' : '') + dag;
  }

  /* De ingevulde datum als Date-object, op middernacht lokale tijd. We plakken
     de waarde niet in `new Date(...)` als string: "2026-07-20" wordt dan als
     UTC gelezen, met dezelfde dag-verschuiving als hierboven. */
  function gekozenDatum() {
    if (!datumveld || datumveld.value === '') { return null; }
    var delen = datumveld.value.split('-');
    if (delen.length !== 3) { return null; }
    return new Date(Number(delen[0]), Number(delen[1]) - 1, Number(delen[2]));
  }

  function vulTijden() {
    var datum = gekozenDatum();

    // Alles wissen en opnieuw opbouwen; zo blijft er nooit een tijd van een
    // vorige dag staan die vandaag niet meer kan.
    tijdveld.innerHTML = '';

    function zetMelding(tekst) {
      var optie = document.createElement('option');
      optie.value = '';
      optie.textContent = tekst;
      tijdveld.appendChild(optie);
      tijdveld.disabled = true;
    }

    if (datum === null) {
      zetMelding('Kies eerst een dag');
      return;
    }

    var tijden = OPENINGSTIJDEN[datum.getDay()];
    if (!tijden) {
      zetMelding('Op deze dag zijn we gesloten');
      return;
    }

    var vanaf = naarMinuten(tijden.eerste);
    var tot = naarMinuten(tijden.laatste);

    /* Is de gekozen dag vandaag, dan vallen de tijdstippen die al geweest zijn
       af. Anders kan iemand om vier uur 's middags nog tien uur 's ochtends
       kiezen. Een uur speling, want een afspraak over vijf minuten is voor
       niemand handig. */
    var nu = new Date();
    if (alsDatumwaarde(datum) === alsDatumwaarde(nu)) {
      var vroegstMogelijk = nu.getHours() * 60 + nu.getMinutes() + 60;
      // Naar boven afronden op een heel tijdslot.
      vroegstMogelijk = Math.ceil(vroegstMogelijk / STAP_MINUTEN) * STAP_MINUTEN;
      if (vroegstMogelijk > vanaf) { vanaf = vroegstMogelijk; }
    }

    if (vanaf > tot) {
      zetMelding('Vandaag lukt niet meer — kies een andere dag');
      return;
    }

    var leeg = document.createElement('option');
    leeg.value = '';
    leeg.textContent = 'Maakt niet uit';
    tijdveld.appendChild(leeg);

    for (var m = vanaf; m <= tot; m += STAP_MINUTEN) {
      var optie = document.createElement('option');
      optie.value = naarTijd(m);
      optie.textContent = naarTijd(m);
      tijdveld.appendChild(optie);
    }
    tijdveld.disabled = false;
  }

  if (datumveld && tijdveld) {
    var vandaag = new Date();
    var laatsteDag = new Date();
    laatsteDag.setDate(laatsteDag.getDate() + MAX_DAGEN_VOORUIT);

    /* De browser laat data buiten dit bereik niet kiezen. Dit vervangt de
       controle in vulTijden() niet: min en max zijn een hulpmiddel in de
       kalender, geen slot op het veld. */
    datumveld.min = alsDatumwaarde(vandaag);
    datumveld.max = alsDatumwaarde(laatsteDag);

    datumveld.addEventListener('change', vulTijden);
    // Ook bij het laden: na een herlaadactie onthoudt de browser de ingevulde
    // datum, en dan hoort de lijst met tijden daar meteen bij te kloppen.
    vulTijden();
  }

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

  /* Leest het formulier uit en controleert het. Klopt er iets niet, dan zet
     deze functie de melding neer en geeft null terug; de aanroeper stopt dan.

     Beide knoppen gebruiken dit — versturen per e-mail én versturen via
     WhatsApp. Zo staan de regels op één plek en kunnen de twee routes niet
     uit elkaar gaan lopen. */
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
      probleem: waarde('probleem'),
      moment: '(geen voorkeur opgegeven)'
    };

    if (gegevens.naam === '' || gegevens.telefoon === '' ||
        gegevens.toestel === '' || gegevens.probleem === '') {
      toonFout('Vul alstublieft uw naam, telefoonnummer, het toestel en de klacht in.');
      return null;
    }

    /* Het voorkeursmoment is niet verplicht, maar is er wél een dag gekozen,
       dan moet die kloppen. De kalender van de browser houdt een gesloten dag
       niet tegen — min en max gaan alleen over het bereik, niet over welke
       weekdagen open zijn. Zonder deze controle kan iemand met het toetsenbord
       een zondag intikken en toch versturen. */
    var datum = gekozenDatum();
    if (datum !== null) {
      if (!OPENINGSTIJDEN[datum.getDay()]) {
        toonFout('Op de gekozen dag is de winkel gesloten. Kiest u een dag van maandag tot en met zaterdag.');
        return null;
      }
      if (alsDatumwaarde(datum) < alsDatumwaarde(new Date())) {
        toonFout('De gekozen dag ligt in het verleden. Kiest u een dag vanaf vandaag.');
        return null;
      }
      // Bijvoorbeeld: "zaterdag 25 juli 2026 om 14:30". Voluit geschreven,
      // want in een bericht leest 2026-07-25 een stuk minder prettig.
      gegevens.moment = datum.toLocaleDateString('nl-NL', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      var tijd = waarde('tijd');
      gegevens.moment += tijd === '' ? ' (tijd maakt niet uit)' : ' om ' + tijd;
    }

    return gegevens;
  }

  /* --- Versturen via WhatsApp ---
     Opent WhatsApp met het bericht al ingevuld. Versturen doet de klant zelf
     met de verzendknop in WhatsApp: een website kan namens iemand anders geen
     bericht de deur uit doen, en dat hoort ook niet. Daarom zegt de tekst
     onder de knoppen dat WhatsApp opengaat, en niet dat er iets verstuurd is.

     Het nummer staat in internationale vorm: 31 in plaats van de 0, zonder
     plusteken en zonder streepjes. Anders opent wa.me een leeg gesprek. */
  var WHATSAPP_NUMMER = '31528235734';

  var whatsappKnop = document.getElementById('whatsapp-knop');
  if (whatsappKnop) {
    whatsappKnop.addEventListener('click', function () {
      var gegevens = leesFormulier();
      if (gegevens === null) { return; }

      var regels = [
        'Afspraak aanvragen via de website',
        '',
        'Naam: ' + gegevens.naam,
        'Telefoon: ' + gegevens.telefoon,
        'E-mail: ' + (gegevens.email || 'niet ingevuld'),
        'Toestel: ' + gegevens.toestel,
        'Klacht: ' + gegevens.probleem,
        'Voorkeursmoment: ' + gegevens.moment
      ];

      // encodeURIComponent, anders sneuvelen de regeleinden en tekens als &.
      window.open(
        'https://wa.me/' + WHATSAPP_NUMMER + '?text=' + encodeURIComponent(regels.join('\n')),
        '_blank'
      );
    });
  }

  formulier.addEventListener('submit', function (e) {
    e.preventDefault();

    var gegevens = leesFormulier();
    if (gegevens === null) { return; }

    var naam = gegevens.naam;
    var telefoon = gegevens.telefoon;
    var email = gegevens.email;
    var toestel = gegevens.toestel;
    var probleem = gegevens.probleem;
    var moment = gegevens.moment;

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
