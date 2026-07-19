# Lokale ontwikkelserver voor de Optie1-website.
#
# Alleen bedoeld om de site tijdens het bouwen te bekijken op http://localhost:8080
# Dit bestand hoort NIET op de webhosting thuis: upload het niet naar httpdocs.
#
# Handmatig starten kan ook:  powershell -ExecutionPolicy Bypass -File dev-server.ps1

$poort = 8080
$root  = $PSScriptRoot
$prefix = "http://localhost:$poort/"

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.gif'  = 'image/gif'
  '.svg'  = 'image/svg+xml'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
  '.woff2'= 'font/woff2'
  '.json' = 'application/json; charset=utf-8'
  '.txt'  = 'text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
  $listener.Start()
} catch {
  Write-Host "Kon de server niet starten op poort $poort."
  Write-Host "Draait er al iets op die poort? Sluit dat af of pas `$poort aan bovenin dit bestand."
  exit 1
}

Write-Host "Website draait op $prefix"
Write-Host "Map: $root"
Write-Host "Stoppen: Ctrl+C"

while ($listener.IsListening) {
  try {
    $context  = $listener.GetContext()
    $request  = $context.Request
    $response = $context.Response

    $pad = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
    if ($pad -eq '/' -or $pad.EndsWith('/')) { $pad = $pad + 'index.html' }

    # Voorkom dat er buiten de projectmap gelezen kan worden.
    $doel = Join-Path $root ($pad.TrimStart('/') -replace '/', '\')
    $volledig = [System.IO.Path]::GetFullPath($doel)

    if (-not $volledig.StartsWith([System.IO.Path]::GetFullPath($root))) {
      $response.StatusCode = 403
      $response.Close()
      continue
    }

    if (Test-Path $volledig -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($volledig).ToLower()
      if ($mime.ContainsKey($ext)) {
        $response.ContentType = $mime[$ext]
      } else {
        $response.ContentType = 'application/octet-stream'
      }
      # Geen caching, zodat wijzigingen meteen zichtbaar zijn na verversen.
      $response.Headers.Add('Cache-Control', 'no-store')

      $bytes = [System.IO.File]::ReadAllBytes($volledig)
      $response.ContentLength64 = $bytes.Length
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
      Write-Host "200  $pad"
    } else {
      $response.StatusCode = 404
      $bericht = [System.Text.Encoding]::UTF8.GetBytes("404 - niet gevonden: $pad")
      $response.ContentType = 'text/plain; charset=utf-8'
      $response.ContentLength64 = $bericht.Length
      $response.OutputStream.Write($bericht, 0, $bericht.Length)
      Write-Host "404  $pad"
    }

    $response.Close()
  } catch {
    Write-Host "Fout: $($_.Exception.Message)"
  }
}
