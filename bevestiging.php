<?php
/*
  bevestiging.php — stuurt de klant een bevestiging van zijn reparatieaanvraag.

  Deze server-side stap staat LOS van de melding naar de winkel. Die melding
  gaat, net als voorheen, via Web3Forms rechtstreeks naar optie1hoogeveen@gmail.com
  (zie assets/js/afspraak.js). Dit bestand doet daar niets mee: het verstuurt
  alleen de bevestiging naar het e-mailadres dat de klant zelf invulde.

  Zo blijft de winkelmelding altijd werken, ook als het versturen van deze
  bevestiging mislukt — de twee paden raken elkaar nergens.

  VERSTUREN VIA GMAIL (SMTP)
  De bevestiging gaat niet via de website-server, maar via het Gmail-account
  van de winkel. Google's servers worden door Outlook en andere providers
  vertrouwd, dus komt de mail netjes aan in plaats van in de spam. Er is
  hiervoor geen externe library nodig: onderaan dit bestand staat een compacte,
  zelfstandige SMTP-verzender.

  De inloggegevens (het Gmail-app-wachtwoord) staan BEWUST NIET in dit bestand.
  Ze horen in smtp-config.php, dat je apart op de server plaatst en dat niet in
  de broncode of git terechtkomt. Zie smtp-config.voorbeeld.php.
*/

// ---------------------------------------------------------------------------
// Instellingen.
// ---------------------------------------------------------------------------
const ANTWOORD_NAAR   = 'optie1hoogeveen@gmail.com'; // waar antwoorden van de klant heen gaan
const WEBSITE         = 'https://www.optie1hoogeveen.nl';
const ONDERWERP       = 'Bevestiging van uw reparatieaanvraag - Optie1 Hoogeveen';

// Kleuren, in lijn met de huisstijl van de site.
const KLEUR_TEKST   = '#1d1d1f'; // bijna zwart
const KLEUR_ZACHT   = '#6e6e73'; // grijs voor labels
const KLEUR_LIJN    = '#e5e5e7'; // subtiele grijze lijn
const KLEUR_BLOKBG  = '#f5f5f7'; // rustige achtergrond van het infoblok
const KLEUR_KNOP    = '#1976d2'; // merkblauw

header('Content-Type: application/json; charset=utf-8');

// Alleen POST. Al het andere (een bezoeker die het bestand rechtstreeks opent)
// krijgt netjes een 405 en verder niets.
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Methode niet toegestaan.']);
    exit;
}

// De SMTP-inloggegevens uit het aparte configbestand laden. Ontbreekt dat
// bestand (bijvoorbeeld omdat het nog niet op de server staat), dan kan er
// niet verstuurd worden — we melden dat netjes en stoppen. De winkelmelding
// via Web3Forms staat hier los van en is dan al onderweg.
$configPad = __DIR__ . '/smtp-config.php';
if (!is_file($configPad)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'E-mailinstellingen ontbreken.']);
    exit;
}
$config = require $configPad;
if (!is_array($config) || empty($config['gebruiker']) || empty($config['wachtwoord'])) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'E-mailinstellingen onvolledig.']);
    exit;
}

// De aanvraag komt binnen als JSON, net zoals afspraak.js hem verstuurt.
$ruw = file_get_contents('php://input');
$data = json_decode($ruw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ongeldige aanvraag.']);
    exit;
}

// Kleine hulp: een veld ophalen en spaties eromheen weghalen.
function veld(array $data, string $naam): string {
    return isset($data[$naam]) && is_string($data[$naam]) ? trim($data[$naam]) : '';
}

// Honeypot: is dit onzichtbare veld gevuld, dan is het vrijwel zeker een bot.
// We doen alsof alles goed ging (geven success terug) maar versturen niets.
if (veld($data, 'website') !== '') {
    echo json_encode(['success' => true]);
    exit;
}

$naam       = veld($data, 'naam');
$telefoon   = veld($data, 'telefoon');
$email      = veld($data, 'email');
$toestel    = veld($data, 'toestel');
$probleem   = veld($data, 'probleem');
$moment     = veld($data, 'moment');
$referentie = veld($data, 'referentie');

if ($moment === '') {
    $moment = '(geen voorkeur opgegeven)';
}

// Het e-mailadres moet geldig zijn, anders valt er niets te bevestigen.
// filter_var weigert ook adressen met regeleinden, zodat er via het
// ontvangeradres geen extra kopregels in de mail te smokkelen zijn.
$email = filter_var($email, FILTER_VALIDATE_EMAIL);
if ($email === false || $email === '') {
    // Geen geldig adres: geen fout naar de klant, want de winkelmelding is
    // los hiervan al onderweg. We melden het alleen terug aan het script.
    echo json_encode(['success' => false, 'message' => 'Geen geldig e-mailadres.']);
    exit;
}

// De inhoudelijke velden moeten er zijn. Zo niet, dan is de aanvraag
// onvolledig en sturen we geen half ingevulde bevestiging.
if ($naam === '' || $telefoon === '' || $toestel === '' || $probleem === '') {
    echo json_encode(['success' => false, 'message' => 'Onvolledige aanvraag.']);
    exit;
}

// ---------------------------------------------------------------------------
// De mail opbouwen. Alle klantgegevens worden ge-escaped voordat ze in de
// HTML terechtkomen, zodat tekens als < of & de opmaak niet kunnen breken
// en er geen HTML meegestuurd kan worden.
// ---------------------------------------------------------------------------
function esc(string $s): string {
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

// De regels van het overzicht: label => waarde. Eén plek, zodat de HTML- en
// de tekstversie niet uit elkaar kunnen lopen.
$overzicht = [
    'Naam'             => $naam,
    'Telefoonnummer'   => $telefoon,
    'E-mailadres'      => $email,
    'Merk en model'    => $toestel,
    'Probleem'         => $probleem,
    'Gewenste afspraak'=> $moment,
];
if ($referentie !== '') {
    $overzicht['Referentienummer'] = $referentie;
}

// --- HTML-versie: rustig, wit, Apple-achtig, mobiel vriendelijk ------------
// Elke rij krijgt een subtiele onderlijn, behalve de laatste — die zou anders
// dubbel op de rand van het blok vallen.
$rijenHtml = '';
$aantal = count($overzicht);
$index = 0;
foreach ($overzicht as $label => $waarde) {
    $index++;
    $lijn = $index < $aantal ? 'border-bottom:1px solid ' . KLEUR_LIJN . ';' : '';
    $rijenHtml .=
        '<tr>' .
        '<td style="padding:10px 0;' . $lijn . 'font-size:13px;color:' . KLEUR_ZACHT . ';vertical-align:top;width:42%;">' . esc($label) . '</td>' .
        '<td style="padding:10px 0;' . $lijn . 'font-size:15px;color:' . KLEUR_TEKST . ';vertical-align:top;">' . nl2br(esc($waarde)) . '</td>' .
        '</tr>';
}

$naamHtml = esc($naam);

// De kleuren en adressen als gewone variabelen, zodat de heredoc hieronder ze
// rechtstreeks kan invullen. (Constanten kunnen niet in een heredoc.)
$cTekst  = KLEUR_TEKST;
$cZacht  = KLEUR_ZACHT;
$cLijn   = KLEUR_LIJN;
$cBlok   = KLEUR_BLOKBG;
$cKnop   = KLEUR_KNOP;
$urlSite = WEBSITE;
$mailWinkel = ANTWOORD_NAAR;

$html = <<<HTML
<!DOCTYPE html>
<html lang="nl">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-BMJX78V0YF"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-BMJX78V0YF');
</script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bevestiging reparatieaanvraag</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

          <!-- Merknaam -->
          <tr>
            <td style="padding:0 0 24px 0;">
              <span style="font-size:22px;font-weight:600;color:{$cTekst};letter-spacing:-0.02em;">Optie1</span>
              <span style="font-size:22px;font-weight:400;color:{$cZacht};letter-spacing:-0.02em;">&nbsp;Hoogeveen</span>
            </td>
          </tr>

          <!-- Titel -->
          <tr>
            <td style="padding:0 0 8px 0;font-size:24px;font-weight:600;color:{$cTekst};letter-spacing:-0.02em;">
              Bedankt voor uw aanvraag
            </td>
          </tr>

          <!-- Aanhef en tekst -->
          <tr>
            <td style="padding:16px 0 0 0;font-size:16px;line-height:1.6;color:{$cTekst};">
              Beste {$naamHtml},
            </td>
          </tr>
          <tr>
            <td style="padding:16px 0 0 0;font-size:16px;line-height:1.6;color:{$cTekst};">
              Hartelijk bedankt voor uw reparatieaanvraag bij Optie1 Hoogeveen.
              Wij hebben uw aanvraag succesvol ontvangen.
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0 12px 0;font-size:14px;font-weight:600;color:{$cZacht};text-transform:uppercase;letter-spacing:0.04em;">
              Overzicht van uw aanvraag
            </td>
          </tr>

          <!-- Afgerond infoblok -->
          <tr>
            <td style="background-color:{$cBlok};border:1px solid {$cLijn};border-radius:14px;padding:8px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                {$rijenHtml}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 0 0 0;font-size:16px;line-height:1.6;color:{$cTekst};">
              Onze medewerkers nemen zo spoedig mogelijk contact met u op om de
              afspraak definitief te bevestigen.
            </td>
          </tr>
          <tr>
            <td style="padding:16px 0 0 0;font-size:16px;line-height:1.6;color:{$cTekst};">
              Heeft u nog vragen? U kunt eenvoudig reageren op deze e-mail of
              telefonisch contact met ons opnemen.
            </td>
          </tr>

          <!-- CTA-knop -->
          <tr>
            <td style="padding:28px 0 4px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px;background-color:{$cKnop};">
                    <a href="{$urlSite}" style="display:inline-block;padding:13px 26px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">Bezoek onze website</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Ondertekening -->
          <tr>
            <td style="padding:32px 0 0 0;border-top:1px solid {$cLijn};margin-top:16px;"></td>
          </tr>
          <tr>
            <td style="padding:20px 0 0 0;font-size:15px;line-height:1.7;color:{$cTekst};">
              Met vriendelijke groet,<br>
              <strong style="font-weight:600;">Optie1 Hoogeveen</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0 0 0;font-size:14px;line-height:1.7;color:{$cZacht};">
              E-mail: <a href="mailto:{$mailWinkel}" style="color:{$cKnop};text-decoration:none;">{$mailWinkel}</a><br>
              Website: <a href="{$urlSite}" style="color:{$cKnop};text-decoration:none;">www.optie1hoogeveen.nl</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;

// --- Platte-tekstversie ----------------------------------------------------
$regels = [];
$regels[] = 'Beste ' . $naam . ',';
$regels[] = '';
$regels[] = 'Hartelijk bedankt voor uw reparatieaanvraag bij Optie1 Hoogeveen.';
$regels[] = 'Wij hebben uw aanvraag succesvol ontvangen.';
$regels[] = '';
$regels[] = 'Hieronder vindt u een overzicht van uw aanvraag:';
$regels[] = '';
foreach ($overzicht as $label => $waarde) {
    $regels[] = $label . ': ' . $waarde;
}
$regels[] = '';
$regels[] = 'Onze medewerkers nemen zo spoedig mogelijk contact met u op om de';
$regels[] = 'afspraak definitief te bevestigen.';
$regels[] = '';
$regels[] = 'Heeft u nog vragen? U kunt eenvoudig reageren op deze e-mail of';
$regels[] = 'telefonisch contact met ons opnemen.';
$regels[] = '';
$regels[] = 'Bezoek onze website: ' . WEBSITE;
$regels[] = '';
$regels[] = 'Met vriendelijke groet,';
$regels[] = 'Optie1 Hoogeveen';
$regels[] = '';
$regels[] = 'E-mail: ' . ANTWOORD_NAAR;
$regels[] = 'Website: ' . WEBSITE;
$tekst = implode("\r\n", $regels);

// ---------------------------------------------------------------------------
// Het complete mailbericht opbouwen: eerst de kopregels, dan een lege regel,
// dan de inhoud als multipart/alternative (platte tekst én HTML). Bij versturen
// via SMTP moeten From/To/Subject in het bericht zelf staan; anders dan bij
// mail() geeft de server ze niet vanzelf mee.
//
// De inhoud wordt quoted-printable gecodeerd. Dat houdt regels kort (zodat ook
// een lange klachtomschrijving binnen de SMTP-regellimiet blijft) en zorgt dat
// accenten en bijzondere tekens overal goed aankomen.
// ---------------------------------------------------------------------------
$vanNaam  = !empty($config['van_naam'])  ? $config['van_naam']  : 'Optie1 Hoogeveen';
$vanEmail = !empty($config['van_email']) ? $config['van_email'] : $config['gebruiker'];

$grens = 'grens_' . bin2hex(random_bytes(16));
$onderwerp = '=?UTF-8?B?' . base64_encode(ONDERWERP) . '?=';
$hostDeel = substr((string)strrchr($vanEmail, '@'), 1);
$messageId = '<' . bin2hex(random_bytes(16)) . '@' . ($hostDeel !== '' ? $hostDeel : 'localhost') . '>';

$kop  = 'From: ' . $vanNaam . ' <' . $vanEmail . '>' . "\r\n";
$kop .= 'To: ' . $email . "\r\n";
$kop .= 'Reply-To: ' . ANTWOORD_NAAR . "\r\n";
$kop .= 'Subject: ' . $onderwerp . "\r\n";
$kop .= 'Date: ' . date('r') . "\r\n";
$kop .= 'Message-ID: ' . $messageId . "\r\n";
$kop .= 'MIME-Version: 1.0' . "\r\n";
$kop .= 'Content-Type: multipart/alternative; boundary="' . $grens . '"' . "\r\n";

// Regeleindes gelijktrekken naar CRLF, zodat de quoted-printable-codering
// overal dezelfde harde regelovergangen ziet (los van of het bronbestand
// met \n of \r\n is opgeslagen).
$tekstCrlf = preg_replace('/\r\n|\r|\n/', "\r\n", $tekst);
$htmlCrlf  = preg_replace('/\r\n|\r|\n/', "\r\n", $html);

$body  = '--' . $grens . "\r\n";
$body .= 'Content-Type: text/plain; charset=UTF-8' . "\r\n";
$body .= 'Content-Transfer-Encoding: quoted-printable' . "\r\n\r\n";
$body .= quoted_printable_encode($tekstCrlf) . "\r\n";
$body .= '--' . $grens . "\r\n";
$body .= 'Content-Type: text/html; charset=UTF-8' . "\r\n";
$body .= 'Content-Transfer-Encoding: quoted-printable' . "\r\n\r\n";
$body .= quoted_printable_encode($htmlCrlf) . "\r\n";
$body .= '--' . $grens . '--';

$bericht = $kop . "\r\n" . $body;

$gelukt = stuurViaSmtp($config, $vanEmail, $email, $bericht);

// Geen klantgegevens loggen. We melden alleen of het versturen lukte.
if ($gelukt) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(502);
    echo json_encode(['success' => false, 'message' => 'Verzenden mislukt.']);
}

// ---------------------------------------------------------------------------
// Compacte SMTP-verzender, zonder externe library.
//
// Speciaal voor Gmail: verbinden op poort 587, dan met STARTTLS de verbinding
// versleutelen en inloggen met AUTH LOGIN. Elke stap controleert de
// antwoordcode van de server; klopt die niet, dan stopt de functie en geeft
// false terug. Geeft true terug zodra de server het bericht heeft aangenomen.
// ---------------------------------------------------------------------------
function stuurViaSmtp(array $config, string $van, string $naar, string $bericht): bool {
    $host       = !empty($config['host']) ? $config['host'] : 'smtp.gmail.com';
    $poort      = (int)(!empty($config['port']) ? $config['port'] : 587);
    $gebruiker  = (string)$config['gebruiker'];
    $wachtwoord = (string)$config['wachtwoord'];

    $fp = @stream_socket_client(
        'tcp://' . $host . ':' . $poort,
        $errno, $errstr, 20, STREAM_CLIENT_CONNECT
    );
    if (!$fp) {
        return false;
    }
    stream_set_timeout($fp, 20);

    // Leest een volledig serverantwoord. Bij een meerregelig antwoord staat op
    // elke tussenregel een '-' na de code; op de laatste regel een spatie.
    $lees = function () use ($fp) {
        $antwoord = '';
        while (($regel = fgets($fp, 515)) !== false) {
            $antwoord .= $regel;
            if (strlen($regel) < 4 || $regel[3] !== '-') {
                break;
            }
        }
        return $antwoord;
    };

    // Stuurt een commando (leeg = niets sturen, alleen lezen) en controleert of
    // het antwoord met de verwachte driecijferige code begint.
    $stuur = function (string $commando, string $verwacht) use ($fp, $lees) {
        if ($commando !== '') {
            fwrite($fp, $commando . "\r\n");
        }
        return strncmp($lees(), $verwacht, 3) === 0;
    };

    $ok = $stuur('', '220');
    $ok = $ok && $stuur('EHLO optie1hoogeveen.nl', '250');
    $ok = $ok && $stuur('STARTTLS', '220');
    if ($ok) {
        $ok = @stream_socket_enable_crypto(
            $fp, true,
            STREAM_CRYPTO_METHOD_TLS_CLIENT
                | STREAM_CRYPTO_METHOD_TLSv1_1_CLIENT
                | STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT
        );
    }
    // Na STARTTLS opnieuw EHLO, nu over de versleutelde verbinding.
    $ok = $ok && $stuur('EHLO optie1hoogeveen.nl', '250');
    $ok = $ok && $stuur('AUTH LOGIN', '334');
    $ok = $ok && $stuur(base64_encode($gebruiker), '334');
    $ok = $ok && $stuur(base64_encode($wachtwoord), '235');
    $ok = $ok && $stuur('MAIL FROM:<' . $van . '>', '250');
    $ok = $ok && $stuur('RCPT TO:<' . $naar . '>', '250');
    $ok = $ok && $stuur('DATA', '354');

    if ($ok) {
        // Puntbescherming: een regel die met '.' begint krijgt er een tweede
        // punt bij, anders ziet de server die als einde van het bericht.
        $veilig = preg_replace('/^\./m', '..', $bericht);
        fwrite($fp, $veilig . "\r\n.\r\n");
        $ok = strncmp($lees(), '250', 3) === 0;
    }

    @fwrite($fp, "QUIT\r\n");
    fclose($fp);

    return $ok;
}
