# Optie1 Hoogeveen — website

Statische website. Geen build-stap, geen frameworks, geen externe scripts of lettertypen.
De bestanden die je hier ziet zijn precies de bestanden die op de server komen.

## Structuur

```
index.html         Home
diensten.html      Smartphones, internet/tv, smart home
reparaties.html    Reparaties + tarieventabel
over-ons.html      Over de winkel
contact.html       Contactgegevens, openingstijden, route
assets/css/style.css
```

## VOOR LIVEGANG INVULLEN

Op de oude site stonden geen adres, KvK-nummer of reparatieprijzen. Die zijn **niet verzonnen**.
Overal waar iets ontbreekt staat een geel gemarkeerde tekst zoals `STRAAT + HUISNUMMER INVULLEN`.

Zoek in alle bestanden op `INVULLEN` om ze te vinden. Te doen:

1. **Adres en postcode** — staat in de footer van elke pagina, op `contact.html`, en in de
   JSON-LD in `index.html` (dat laatste is wat Google gebruikt — niet vergeten).
2. **KvK-nummer** — in de footer van elke pagina.
3. **Reparatieprijzen** — in de tabel op `reparaties.html`. Geen vaste prijzen? Verwijder
   die hele sectie; er staat een HTML-commentaar bij waar die begint en eindigt.
4. **Tekst "Over ons"** — nu een concept. Vervang door het echte verhaal van de winkel.
5. **Google Maps-link** op `contact.html` — vervang `Optie1+Hoogeveen` in de URL door het
   echte adres, anders klopt de routebeschrijving mogelijk niet.

Laat de gele markeringen nooit online staan; ze vallen bezoekers direct op.

## Uploaden naar Plesk (Yourhosting)

1. Log in op Plesk.
2. Ga naar **Bestanden** (Bestandsbeheer).
3. Open de map **`httpdocs`** — dat is de webmap van het domein.
4. Verwijder of hernoem de bestaande "Coming Soon"-pagina (meestal `index.html`).
   Hernoemen naar `index-oud.html` is veiliger dan verwijderen: dan kun je terug.
5. Upload `index.html`, `diensten.html`, `reparaties.html`, `over-ons.html`,
   `contact.html` en de map `assets` naar `httpdocs`.
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

Deze map is een lokale Git-repository. Na elke wijziging:

```
git add -A
git commit -m "korte omschrijving van de wijziging"
```

Er is bewust nog geen GitHub-remote. Alles staat lokaal op deze computer —
dat betekent ook dat een backup van deze map je enige backup is.
