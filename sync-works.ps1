# Copies the Notion "works" database into the WORKS list of works.js.
# Needs NOTION_TOKEN and NOTION_DATABASE_ID (see ADMIN.md).
# works.js stays untouched unless at least one work can be published.
#   -DryRun     Show what would be written, without writing anything.
#   -WorksFile  The file to update (default: works.js next to this script).
#   -PagesFile  Read pages from a JSON file instead of Notion (for testing).
# Keep this file ASCII-only: Windows PowerShell 5.1 misreads BOM-less UTF-8.
param(
  [switch]$DryRun,
  [string]$WorksFile = (Join-Path $PSScriptRoot 'works.js'),
  [string]$PagesFile
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'notion-common.ps1')
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch { }

# Notion status -> catalog status. Anything else stays unpublished.
$statusMap = @{
  (U '\u516c\u958b\u4e2d')             = 'available' # koukai-chuu
  (U '\u8ca9\u58f2\u4e2d')             = 'available' # hanbai-chuu
  (U '\u53d7\u6ce8\u5236\u4f5c')       = 'order'     # juchuu-seisaku
  (U '\u58f2\u308a\u5207\u308c')       = 'soldout'   # urikire
}

function Convert-ToWork($page, $status) {
  $p = $page.properties
  $images = @()
  if ($null -ne $p.($Prop.photo) -and $p.($Prop.photo).url) { $images = @([string]$p.($Prop.photo).url) }
  $price = $null
  if ($null -ne $p.($Prop.price)) { $price = $p.($Prop.price).number }
  return [ordered]@{
    id          = [string]$page.id
    name        = (Get-PlainText $p.($Prop.name)).Trim()
    price       = $price
    status      = $status
    images      = $images
    description = Get-PlainText $p.($Prop.desc)
    material    = Get-PlainText $p.($Prop.material)
    size        = Get-PlainText $p.($Prop.size)
  }
}

function Get-Pages {
  if (-not $PagesFile) { return (Get-ActivePages) }
  $text = [IO.File]::ReadAllText($PagesFile, [Text.Encoding]::UTF8)
  return ,@((ConvertFrom-Json $text).results)
}

function Write-WorksFile($works) {
  $utf8 = New-Object Text.UTF8Encoding($false)
  $current = [IO.File]::ReadAllText($WorksFile, $utf8)
  $marker = [regex]::Match($current, '(?m)^const WORKS = \[')
  if (-not $marker.Success) { throw (New-AppError 500 'works_file_format' $WorksFile) }

  $lines = @($works | ForEach-Object { '  ' + (ConvertTo-Json -InputObject $_ -Depth 5 -Compress) })
  $list = "const WORKS = [`n" + ($lines -join ",`n") + "`n];`n"

  # Replace in one step, keeping the previous file as the backup.
  $full = [IO.Path]::GetFullPath($WorksFile)
  $temp = "$full.tmp"
  $backup = Join-Path ([IO.Path]::GetDirectoryName($full)) 'works.backup.js'
  [IO.File]::WriteAllText($temp, $current.Substring(0, $marker.Index) + $list, $utf8)
  [IO.File]::Replace($temp, $full, $backup)
}

try {
  $works = New-Object System.Collections.ArrayList
  $skipped = 0
  foreach ($page in (Get-Pages)) {
    if ($page.archived -eq $true -or $page.in_trash -eq $true -or (Test-Deleted $page)) { continue }
    $name = Get-PlainText $page.properties.($Prop.name)
    $label = Get-SelectName $page.properties.($Prop.status)
    if (-not $name.Trim()) {
      Write-Host "Skipped: a row has no name (id $($page.id))"
      $skipped++
    } elseif (-not $statusMap.ContainsKey($label)) {
      Write-Host "Not published: $name (status: '$label')"
      $skipped++
    } else {
      [void]$works.Add((Convert-ToWork $page $statusMap[$label]))
    }
  }

  if ($works.Count -eq 0) { throw (New-AppError 500 'no_publishable_works' '') }

  foreach ($w in $works) { Write-Host "  $($w.status): $($w.name)" }
  if ($DryRun) {
    Write-Host "Dry run: $($works.Count) works would be written, $skipped left out. Nothing was changed."
  } else {
    Write-WorksFile $works
    Write-Host "Updated works.js: $($works.Count) works written, $skipped left out."
    Write-Host 'Previous version saved as works.backup.js. Reload the catalog to check it.'
  }
  exit 0
} catch {
  $code = $_.Exception.Data['code']
  $detail = $_.Exception.Data['detail']
  if (-not $code) { $code = $_.Exception.Message }
  Write-Host "Sync failed: $code. works.js was not changed."
  if ($detail) { Write-Host "  $detail" }
  switch ($code) {
    { $_ -like 'config_*' }  { Write-Host '  Set NOTION_TOKEN and NOTION_DATABASE_ID. See ADMIN.md.' }
    'notion_unauthorized'    { Write-Host '  Check NOTION_TOKEN. See ADMIN.md.' }
    'notion_forbidden'       { Write-Host '  Connect the integration to the database. See ADMIN.md.' }
    'notion_not_found'       { Write-Host '  Check NOTION_DATABASE_ID and the connection. See ADMIN.md.' }
    'no_publishable_works'   { Write-Host '  No row has a name and a publishable status. See README.md.' }
  }
  exit 1
}
