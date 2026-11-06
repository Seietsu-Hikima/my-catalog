# Notion helpers shared by admin.ps1 and sync-works.ps1. Dot-source this file.
# Keep this file ASCII-only: Windows PowerShell 5.1 misreads BOM-less UTF-8.

try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch { }

$notionBase = 'https://api.notion.com/v1'
$notionVersion = '2022-06-28'

function U([string]$s) { return [regex]::Unescape($s) }

# Notion property names (Japanese, written as escapes to keep this file ASCII).
# Named $Prop, not $P: PowerShell names ignore case, so $P would clash with $p.
$Prop = @{
  name     = U '\u4f5c\u54c1\u540d'          # sakuhin-mei (title)
  category = U '\u30ab\u30c6\u30b4\u30ea'    # kategori (select)
  price    = U '\u4fa1\u683c'                # kakaku (number)
  photo    = U '\u5199\u771fURL'             # shashin URL (url)
  desc     = U '\u8aac\u660e'                # setsumei (text)
  status   = U '\u72b6\u614b'                # joutai (select)
  deleted  = U '\u524a\u9664\u6e08\u307f'    # sakujo-zumi (checkbox)
  material = U '\u7d20\u6750'                # sozai (text, optional)
  size     = U '\u30b5\u30a4\u30ba'          # saizu (text, optional)
}

function New-AppError([int]$status, [string]$code, [string]$detail) {
  $e = New-Object Exception($code)
  $e.Data['status'] = $status
  $e.Data['code'] = $code
  $e.Data['detail'] = $detail
  return $e
}

function Get-Setting([string]$name) {
  $v = [Environment]::GetEnvironmentVariable($name, 'Process')
  if (-not $v) { try { $v = [Environment]::GetEnvironmentVariable($name, 'User') } catch { } }
  if ($v) { return $v.Trim() }
  return $null
}

function Get-DatabaseId {
  $raw = Get-Setting 'NOTION_DATABASE_ID'
  if (-not $raw) { throw (New-AppError 500 'config_missing_database' '') }
  # Accept a bare id, a dashed id, or a pasted Notion URL.
  $m = [regex]::Match($raw.Replace('-', ''), '[0-9a-fA-F]{32}')
  if (-not $m.Success) { throw (New-AppError 500 'config_bad_database' '') }
  return $m.Value.ToLowerInvariant()
}

function Invoke-Notion([string]$method, [string]$path, $body) {
  $token = Get-Setting 'NOTION_TOKEN'
  if (-not $token) { throw (New-AppError 500 'config_missing_token' '') }
  $params = @{
    Uri             = "$notionBase/$path"
    Method          = $method
    Headers         = @{ Authorization = "Bearer $token"; 'Notion-Version' = $notionVersion }
    UseBasicParsing = $true
  }
  if ($null -ne $body) {
    $json = ConvertTo-Json -InputObject $body -Depth 20 -Compress
    $params.Body = [Text.Encoding]::UTF8.GetBytes($json)
    $params.ContentType = 'application/json; charset=utf-8'
  }
  try {
    $r = Invoke-WebRequest @params
  } catch {
    $resp = $_.Exception.Response
    if ($null -eq $resp) { throw (New-AppError 502 'network' $_.Exception.Message) }
    $status = [int]$resp.StatusCode
    $detail = ''
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $detail = $_.ErrorDetails.Message }
    $code = switch ($status) {
      400 { 'notion_bad_request' }
      401 { 'notion_unauthorized' }
      403 { 'notion_forbidden' }
      404 { 'notion_not_found' }
      409 { 'notion_conflict' }
      429 { 'notion_rate_limited' }
      default { 'notion_error' }
    }
    throw (New-AppError 502 $code $detail)
  }
  # Decode as UTF-8 ourselves: PowerShell 5.1 may guess the wrong charset.
  $text = [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray())
  return (ConvertFrom-Json $text)
}

function Get-PlainText($prop) {
  if ($null -eq $prop) { return '' }
  $parts = if ($prop.type -eq 'title') { $prop.title } else { $prop.rich_text }
  return ((@($parts) | Where-Object { $_ } | ForEach-Object { $_.plain_text }) -join '')
}

function Get-SelectName($prop) {
  if ($null -ne $prop -and $null -ne $prop.select) { return [string]$prop.select.name }
  return ''
}

function Test-Deleted($page) {
  $d = $page.properties.($Prop.deleted)
  return ($null -ne $d -and $d.checkbox -eq $true)
}

# Every page not marked as deleted, newest first.
function Get-ActivePages {
  $db = Get-DatabaseId
  $pages = New-Object System.Collections.ArrayList
  $cursor = $null
  do {
    $body = @{
      filter    = @{ property = $Prop.deleted; checkbox = @{ equals = $false } }
      sorts     = @(@{ timestamp = 'created_time'; direction = 'descending' })
      page_size = 100
    }
    if ($cursor) { $body.start_cursor = $cursor }
    $res = Invoke-Notion 'Post' "databases/$db/query" $body
    foreach ($pg in @($res.results)) { if ($pg) { [void]$pages.Add($pg) } }
    $cursor = if ($res.has_more) { $res.next_cursor } else { $null }
  } while ($cursor)
  return ,$pages
}
