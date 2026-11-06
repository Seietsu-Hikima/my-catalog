# Admin server for the catalog: http://localhost:3001/admin/
# Lists, adds, edits and soft-deletes works in the Notion "works" database.
# Needs the environment variables NOTION_TOKEN and NOTION_DATABASE_ID
# (user-level Windows environment variables are read on every request).
# The token stays on this PC: the browser never sees it.
# Only reachable from this PC. Does not touch the catalog (serve.ps1, works.js):
# sync-works.ps1 copies the Notion data into works.js.
# Keep this file ASCII-only: Windows PowerShell 5.1 misreads BOM-less UTF-8.
param([int]$Port = 3001)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'notion-common.ps1')

$root = [IO.Path]::GetFullPath($PSScriptRoot).TrimEnd([IO.Path]::DirectorySeparatorChar)
$sep = [IO.Path]::DirectorySeparatorChar
$maxBodyBytes = 200000

$statusForNew = U '\u516c\u958b\u4e2d'        # koukai-chuu
$fullWidthComma = U '\u3001'

$contentTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.gif'  = 'image/gif'
  '.webp' = 'image/webp'
  '.avif' = 'image/avif'
}

function Convert-Page($page) {
  $p = $page.properties
  $photo = ''
  if ($null -ne $p.($Prop.photo) -and $p.($Prop.photo).url) { $photo = [string]$p.($Prop.photo).url }
  $price = $null
  if ($null -ne $p.($Prop.price)) { $price = $p.($Prop.price).number }
  return [ordered]@{
    id          = [string]$page.id
    name        = Get-PlainText $p.($Prop.name)
    category    = Get-SelectName $p.($Prop.category)
    price       = $price
    photo       = $photo
    description = Get-PlainText $p.($Prop.desc)
    status      = Get-SelectName $p.($Prop.status)
  }
}

function New-RichText($value) {
  $s = if ($null -eq $value) { '' } else { [string]$value }
  $list = New-Object System.Collections.ArrayList
  # Notion allows at most 2000 characters per text piece.
  for ($i = 0; $i -lt $s.Length; $i += 2000) {
    $len = [Math]::Min(2000, $s.Length - $i)
    [void]$list.Add(@{ type = 'text'; text = @{ content = $s.Substring($i, $len) } })
  }
  return ,$list
}

function Get-Works {
  $items = New-Object System.Collections.ArrayList
  foreach ($pg in (Get-ActivePages)) { [void]$items.Add((Convert-Page $pg)) }
  return ,$items
}

function Build-Properties($in, [bool]$isNew) {
  $names = @($in.PSObject.Properties | ForEach-Object { $_.Name })
  $props = @{}

  if ($names -contains 'name') {
    $props[$Prop.name] = @{ title = (New-RichText ("$($in.name)".Trim())) }
  } elseif ($isNew) {
    $props[$Prop.name] = @{ title = (New-RichText '') }
  }
  if ($names -contains 'category') {
    $c = "$($in.category)".Trim().Replace(',', $fullWidthComma)
    if ($c.Length -gt 100) { throw (New-AppError 400 'bad_category' '') }
    $props[$Prop.category] = if ($c) { @{ select = @{ name = $c } } } else { @{ select = $null } }
  }
  if ($names -contains 'price') {
    $v = $in.price
    if ($null -eq $v -or "$v".Trim() -eq '') {
      $props[$Prop.price] = @{ number = $null }
    } else {
      $num = 0.0
      $ok = [double]::TryParse("$v", [Globalization.NumberStyles]::Float, [Globalization.CultureInfo]::InvariantCulture, [ref]$num)
      if (-not $ok -or $num -lt 0) { throw (New-AppError 400 'bad_price' '') }
      $props[$Prop.price] = @{ number = $num }
    }
  }
  if ($names -contains 'photo') {
    $u = "$($in.photo)".Trim()
    if ($u.Length -gt 2000) { throw (New-AppError 400 'bad_photo' '') }
    $props[$Prop.photo] = if ($u) { @{ url = $u } } else { @{ url = $null } }
  }
  if ($names -contains 'description') {
    $props[$Prop.desc] = @{ rich_text = (New-RichText "$($in.description)") }
  }
  if ($isNew) {
    $props[$Prop.status] = @{ select = @{ name = $statusForNew } }
    $props[$Prop.deleted] = @{ checkbox = $false }
  }
  return $props
}

# Update and delete always act on exactly one work: one id in the URL,
# and that page must belong to the configured database and not be deleted.
function Resolve-OneWork([string]$rawId) {
  $id = $rawId.Replace('-', '').ToLowerInvariant()
  if ($id -notmatch '^[0-9a-f]{32}$') { throw (New-AppError 400 'bad_id' '') }
  try {
    $page = Invoke-Notion 'Get' "pages/$id" $null
  } catch {
    if ($_.Exception.Data['code'] -eq 'notion_not_found') { throw (New-AppError 404 'not_found' '') }
    throw
  }
  $db = Get-DatabaseId
  $parentDb = "$($page.parent.database_id)".Replace('-', '').ToLowerInvariant()
  if ($page.parent.type -ne 'database_id' -or $parentDb -ne $db) { throw (New-AppError 404 'not_found' '') }
  if ($page.archived -eq $true -or $page.in_trash -eq $true -or (Test-Deleted $page)) {
    throw (New-AppError 404 'not_found' '')
  }
  return $id
}

function Read-JsonBody($request) {
  if ($request.ContentLength64 -gt $maxBodyBytes) { throw (New-AppError 413 'too_large' '') }
  $reader = New-Object IO.StreamReader($request.InputStream, [Text.Encoding]::UTF8)
  $raw = $reader.ReadToEnd()
  if ($raw.Length -gt $maxBodyBytes) { throw (New-AppError 413 'too_large' '') }
  try { $obj = ConvertFrom-Json $raw } catch { throw (New-AppError 400 'bad_json' '') }
  if ($null -eq $obj -or $obj -isnot [System.Management.Automation.PSCustomObject]) {
    throw (New-AppError 400 'bad_json' '')
  }
  return $obj
}

function Send-Json($response, [int]$status, $obj) {
  $json = ConvertTo-Json -InputObject $obj -Depth 10 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $response.StatusCode = $status
  $response.ContentType = 'application/json; charset=utf-8'
  $response.ContentLength64 = $bytes.Length
  $response.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Test-SameOrigin($request) {
  # Block other web pages from sending changes to this local server.
  if ($request.Headers['X-Requested-With'] -ne 'admin') { return $false }
  $origin = $request.Headers['Origin']
  if ($origin -and $origin -ne "http://localhost:$Port" -and $origin -ne "http://127.0.0.1:$Port") { return $false }
  return $true
}

function Invoke-Api($request, $response, [string]$path) {
  $method = $request.HttpMethod
  if ($method -ne 'GET' -and -not (Test-SameOrigin $request)) {
    Send-Json $response 403 @{ error = 'forbidden' }
    return
  }
  try {
    if ($path -eq '/api/works') {
      switch ($method) {
        'GET' {
          $works = Get-Works
          Send-Json $response 200 @{ works = $works }
        }
        'POST' {
          $in = Read-JsonBody $request
          $db = Get-DatabaseId
          $page = Invoke-Notion 'Post' 'pages' @{ parent = @{ database_id = $db }; properties = (Build-Properties $in $true) }
          Send-Json $response 201 @{ work = (Convert-Page $page) }
        }
        { $_ -eq 'PATCH' -or $_ -eq 'DELETE' } {
          # No id: refuse instead of touching more than one work.
          throw (New-AppError 400 'bad_id' '')
        }
        default { Send-Json $response 405 @{ error = 'method_not_allowed' } }
      }
      return
    }
    $m = [regex]::Match($path, '^/api/works/([^/]+)$')
    if ($m.Success) {
      switch ($method) {
        'PATCH' {
          $in = Read-JsonBody $request
          $id = Resolve-OneWork $m.Groups[1].Value
          $page = Invoke-Notion 'Patch' "pages/$id" @{ properties = (Build-Properties $in $false) }
          Send-Json $response 200 @{ work = (Convert-Page $page) }
        }
        'DELETE' {
          $id = Resolve-OneWork $m.Groups[1].Value
          $props = @{}
          $props[$Prop.deleted] = @{ checkbox = $true }
          $page = Invoke-Notion 'Patch' "pages/$id" @{ properties = $props }
          Send-Json $response 200 @{ work = (Convert-Page $page) }
        }
        default { Send-Json $response 405 @{ error = 'method_not_allowed' } }
      }
      return
    }
    Send-Json $response 404 @{ error = 'not_found' }
  } catch {
    $ex = $_.Exception
    if ($ex.Data['code']) {
      if ($ex.Data['detail']) { Write-Host "  $($ex.Data['code']): $($ex.Data['detail'])" }
      Send-Json $response ([int]$ex.Data['status']) @{ error = [string]$ex.Data['code'] }
    } else {
      Write-Host "  server_error: $($ex.Message)"
      Send-Json $response 500 @{ error = 'server_error' }
    }
  }
}

function Get-StaticFile([string]$urlPath) {
  try {
    $relative = [Uri]::UnescapeDataString($urlPath).TrimStart('/').Replace('/', $sep)
    $full = [IO.Path]::GetFullPath([IO.Path]::Combine($root, $relative))
  } catch {
    return $null
  }
  # Only the admin page and the photos are served from here.
  $allowed = @("$root$($sep)admin$sep", "$root$($sep)images$sep")
  $ok = $false
  foreach ($a in $allowed) { if ($full.StartsWith($a, [StringComparison]::OrdinalIgnoreCase)) { $ok = $true } }
  if (-not $ok) { return $null }
  if ([IO.File]::Exists($full)) { return $full }
  return $null
}

function Send-Response($context) {
  $request = $context.Request
  $response = $context.Response
  $response.Headers['Cache-Control'] = 'no-store'
  $response.Headers['X-Content-Type-Options'] = 'nosniff'

  if (-not [Net.IPAddress]::IsLoopback($request.RemoteEndPoint.Address)) {
    $response.StatusCode = 403
    return
  }
  $path = $request.Url.AbsolutePath
  if ($path.StartsWith('/api/')) {
    Invoke-Api $request $response $path
    return
  }
  if ($request.HttpMethod -ne 'GET' -and $request.HttpMethod -ne 'HEAD') {
    $response.StatusCode = 405
    return
  }
  if ($path -eq '/' -or $path -eq '/admin') {
    $response.Redirect("http://localhost:$Port/admin/")
    return
  }
  if ($path -eq '/admin/') { $path = '/admin/index.html' }
  $file = Get-StaticFile $path
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
  Write-Host "If the admin server is already running, close that window first."
  exit 1
}

Write-Host "Admin is running: http://localhost:$Port/admin/"
if (-not (Get-Setting 'NOTION_TOKEN')) { Write-Host 'Warning: NOTION_TOKEN is not set. See ADMIN.md.' }
if (-not (Get-Setting 'NOTION_DATABASE_ID')) { Write-Host 'Warning: NOTION_DATABASE_ID is not set. See ADMIN.md.' }
Write-Host 'Press Ctrl+C or close this window to stop.'

try {
  while ($true) {
    $pending = $listener.BeginGetContext($null, $null)
    while (-not $pending.AsyncWaitHandle.WaitOne(200)) { }
    $context = $listener.EndGetContext($pending)
    Write-Host "$($context.Request.HttpMethod) $($context.Request.Url.AbsolutePath)"
    try {
      Send-Response $context
    } catch {
      Write-Host "Request failed: $($context.Request.Url.AbsolutePath): $($_.Exception.Message)"
      try { $context.Response.StatusCode = 500 } catch { }
    } finally {
      try { $context.Response.Close() } catch { }
    }
  }
} finally {
  $listener.Close()
}
