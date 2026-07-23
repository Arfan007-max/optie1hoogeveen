# Optie1 Hoogeveen — website

Statische website. Geen build-stap, geen frameworks, geen externe scripts.
De bestanden die je hier ziet zijn precies de bestanden die op de server komen.

Het lettertype (Atkinson Hyperlegible Next) wordt meegeleverd in `assets/fonts/` en
bewust **niet** bij Google Fonts opgehaald: dan zou het IP-adres van elke bezoeker
naar Google gaan. Het valt onder de SIL Open Font License, zelf meeleveren mag dus.

Die letter is gekozen op leesbaarheid, niet op smaak: het Braille Institute heeft hem
getekend voor mensen die slecht zien, en elke letter is bewust onderscheidend — I, l
en 1 zijn niet te verwarren, b en d evenmin. Dat past bij de klanten van de winkel,
en bij `senioren.html` in het bijzonder.

De hele site staat erop, koppen inbegrepen. Er zijn twee variabelen (`--letter` en
`--letter-hero`) met nu dezelfde waarde; ze staan los zodat de hero later een eigen
letter kan krijgen zonder de rest te raken.

Er is bewust **geen cursieve snede** meegeleverd — de site gebruikt nergens cursief.
Gebruik je het ooit toch, haal dan de italic-bestanden erbij; anders maakt de browser
zelf een scheve variant en dat oogt slordig.

## Structuur

```
index.html         Home
diensten.html      Smartphones, tablets, abonnementen
reparaties.html    Reparaties + tarieventabel
webshop.html       Webshop
over-ons.html      Over de winkel
contact.html       Contactgegevens, openingstijden, route
assets/css/style.css
assets/js/site.js
assets/js/hero-slider.js   Hero-slider op de homepage (4 dia's)
assets/img/optie1-logo.png                Logo in de header
assets/fonts/atkinson-hyperlegible-latin.woff2      Lettertype, gewone tekst
assets/fonts/atkinson-hyperlegible-latin-ext.woff2  Lettertype, accenttekens
```

## Logo

De header verwijst naar `assets/img/optie1-logo.png`. Dat bestand moet er zijn,
anders tonen alle pagina's een gebroken afbeelding. Vervang je het logo ooit,
houd dan dezelfde bestandsnaam aan — dan hoeft er geen HTML aangepast te worden.

## VOOR LIVEGANG INVULLEN

Op de oude site stonden geen adres, KvK-nummer of reparatieprijzen. Die zijn **niet verzonnen**.
Overal waar iets ontbreekt staat een geel gemarkeerde tekst zoals `STRAAT + HUISNUMMER INVULLEN`.

Zoek in alle bestanden op `INVULLEN` om ze te vinden. Te doen:

1. **Adres en postcode** — staat in de footer van elke pagina, op `contact.html`, en in de
   JSON-LD in `index.html` (dat laatste is wat Google gebruikt — niet vergeten).
2. **KvK-nummer** — in de footer van elke pagina.
3. **Tekst "Over ons"** — nu een concept. Vervang door het echte verhaal van de winkel.
4. **Google Maps-link** op `contact.html` — vervang `Optie1+Hoogeveen` in de URL door het
   echte adres, anders klopt de routebeschrijving mogelijk niet.

De tarievensectie op `reparaties.html` is verwijderd: de winkel werkt op aanvraag, niet
met vaste bedragen. Klanten maken een afspraak via het formulier op `afspraak.html`.
Wil je later toch een tarieventabel, dan staan de opmaakregels `.prijzen` en `.invullen`
nog in `style.css` — de HTML eromheen is weg en staat in de Git-geschiedenis.

Laat de gele markeringen nooit online staan; ze vallen bezoekers direct op.

## Uploaden naar Plesk (Yourhosting)

1. Log in op Plesk.
2. Ga naar **Bestanden** (Bestandsbeheer).
3. Open de map **`httpdocs`** — dat is de webmap van het domein.
4. Verwijder of hernoem de bestaande "Coming Soon"-pagina (meestal `index.html`).
   Hernoemen naar `index-oud.html` is veiliger dan verwijderen: dan kun je terug.
5. Upload `index.html`, `diensten.html`, `reparaties.html`, `webshop.html`,
   `over-ons.html`, `contact.html` en de map `assets` naar `httpdocs`.
   Let op dat `assets` volledig meegaat, inclusief `fonts` — ontbreekt die map,
   dan valt de site terug op de systeemletter en ziet hij er anders uit.
6. Controleer https://www.optie1hoogeveen.nl in een privévenster (anders zie je
   mogelijk de oude pagina uit je browsercache).

Uploaden kan ook via FTP; de inloggegevens staan in Plesk onder **FTP-toegang**.
Deel die gegevens niet in een chat of e-mail.

## Na livegang

- **HTTPS**: controleer in Plesk onder **SSL/TLS-certificaten** dat er een geldig
  (Let's Encrypt) certificaat staat en dat "Omleiden van HTTP naar HTTPS" aan staat.
- **Google Bedrijfsprofiel**: zorg dat naam, adres, telefoonnummer en openingstijden
  daar exact hetzelfde zijn als op de site. Google let daarop bij lokale zoekresultaten.

## Versiebeheer

Deze map is een Git-repository. Na elke wijziging:

```
git add -A
git commit -m "korte omschrijving van de wijziging"
git push
```

De repository is gekoppeld aan een **privé** GitHub-repo:
`https://github.com/Arfan007-max/optie1hoogeveen.git` (remote `origin`, tak `main`).
Met `git push` zet je je commits daar ook neer — dat is meteen je backup buiten
deze computer. Houd de repo privé: er hoeft niemand mee te kunnen kijken in de
broncode.
