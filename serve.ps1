# Serves this folder at http://localhost:3000/ for local preview.
# Needs nothing but Windows PowerShell. Only reachable from this PC.
# Keep this file ASCII-only: Windows PowerShell 5.1 misreads BOM-less UTF-8.
param([int]$Port = 3000)

$root = [IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\')

$contentTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.md'   = 'text/plain; charset=utf-8'
  '.txt'  = 'text/plain; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.gif'  = 'image/gif'
  '.webp' = 'image/webp'
  '.avif' = 'image/avif'
  '.ico'  = 'image/x-icon'
}

function Get-RequestedFile([string]$urlPath) {
  try {
    $relative = [Uri]::UnescapeDataString($urlPath).TrimStart('/').Replace('/', '\')
    $full = [IO.Path]::GetFullPath([IO.Path]::Combine($root, $relative))
  } catch {
    return $null # Malformed path, e.g. one containing ':'
  }
  # Never serve anything outside this folder.
  if ($full -ne $root -and -not $full.StartsWith("$root\", [StringComparison]::OrdinalIgnoreCase)) {
    return $null
  }
  if ([IO.Directory]::Exists($full)) { $full = [IO.Path]::Combine($full, 'index.html') }
  if ([IO.File]::Exists($full)) { return $full }
  return $null
}

function Send-Response($context) {
  $request = $context.Request
  $response = $context.Response
  # Always re-read from disk so saved edits show up on reload.
  $response.Headers['Cache-Control'] = 'no-store'

  # A "localhost" prefix alone is not enough: the port is open on every
  # interface, and a LAN client can get through by sending "Host: localhost".
  if (-not [Net.IPAddress]::IsLoopback($request.RemoteEndPoint.Address)) {
    $response.StatusCode = 403
    return
  }
  if ($request.HttpMethod -ne 'GET' -and $request.HttpMethod -ne 'HEAD') {
    $response.StatusCode = 405
    return
  }
  $file = Get-RequestedFile $request.Url.AbsolutePath
  if (-not $file) {
    $response.StatusCode = 404
    return
  }

  $type = $contentTypes[[IO.Path]::GetExtension($file).ToLowerInvariant()]
  if (-not $type) { $type = 'application/octet-stream' }
  $bytes = [IO.File]::ReadAllBytes($file)
  $response.ContentType = $type
  $response.ContentLength64 = $bytes.Length
  if ($request.HttpMethod -eq 'GET') {
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
  }
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
try {
  $listener.Start()
} catch {
  Write-Host "Could not start on port ${Port}: $($_.Exception.Message)"
  Write-Host "If the server is already running, close that window first."
  exit 1
}

Write-Host "Catalog is running: http://localhost:$Port/"
Write-Host "Press Ctrl+C or close this window to stop."

try {
  while ($true) {
    # Poll instead of calling GetContext(), which would block Ctrl+C.
    $pending = $listener.BeginGetContext($null, $null)
    while (-not $pending.AsyncWaitHandle.WaitOne(200)) { }
    $context = $listener.EndGetContext($pending)
    try {
      Send-Response $context
    } catch {
      # The browser went away mid-response, or a file was locked.
      Write-Host "Request failed: $($context.Request.Url.AbsolutePath): $($_.Exception.Message)"
      try { $context.Response.StatusCode = 500 } catch { }
    } finally {
      try { $context.Response.Close() } catch { }
    }
  }
} finally {
  $listener.Close()
}
