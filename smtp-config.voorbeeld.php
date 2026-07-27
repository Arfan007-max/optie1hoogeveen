<?php
/*
  smtp-config.voorbeeld.php — voorbeeld van het instellingenbestand voor het
  versturen van de klantbevestiging via Gmail.

  ZO GEBRUIK JE HET
  1. Maak een KOPIE van dit bestand en noem die  smtp-config.php
  2. Vul bij 'wachtwoord' het Gmail-APP-wachtwoord in (zie stappen hieronder).
  3. Zet smtp-config.php op de server, in dezelfde map als bevestiging.php
     (dus in httpdocs). Laat DIT voorbeeldbestand met rust.

  BELANGRIJK
  - smtp-config.php hoort NIET in git of in de openbare broncode. Daarom staat
    het in .gitignore en plaats je het handmatig op de server. Zo blijft het
    app-wachtwoord privé.
  - Gebruik NOOIT je gewone Gmail-wachtwoord hier, maar een 'app-wachtwoord'.

  EEN APP-WACHTWOORD MAKEN (eenmalig, duurt 2 minuten)
  1. Log in op het Gmail-account optie1hoogeveen@gmail.com.
  2. Ga naar  https://myaccount.google.com/security
  3. Zet 'Verificatie in twee stappen' AAN (verplicht voor een app-wachtwoord).
  4. Ga daarna naar  https://myaccount.google.com/apppasswords
  5. Maak een nieuw app-wachtwoord (naam maakt niet uit, bijv. "Website").
  6. Google toont een code van 16 letters. Zet die hieronder bij 'wachtwoord'.
     De spaties mogen erin blijven staan of eruit — allebei werkt.
*/

return [
    // Vaste Gmail-instellingen; deze hoef je meestal niet aan te passen.
    'host' => 'smtp.gmail.com',
    'port' => 587,

    // Het Gmail-account dat de mail verstuurt.
    'gebruiker' => 'optie1hoogeveen@gmail.com',

    // Het APP-wachtwoord van 16 tekens (NIET je gewone wachtwoord).
    'wachtwoord' => 'PLAK-HIER-HET-APP-WACHTWOORD',

    // Hoe de afzender bij de klant in beeld komt.
    'van_naam'  => 'Optie1 Hoogeveen',
    'van_email' => 'optie1hoogeveen@gmail.com',
];
