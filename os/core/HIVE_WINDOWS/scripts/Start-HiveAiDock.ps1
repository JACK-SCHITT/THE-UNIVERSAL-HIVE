#Requires -Version 5.1
<#
  HIVE AI DOCK — permanent, resizable, not casually removable.
  All AI chat buttons live here. Individual + combined force.
#>
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase, System.Windows.Forms

$HiveRoot = if (Test-Path 'C:\HIVE') { 'C:\HIVE' }
  elseif (Test-Path 'C:\ProgramData\THE_HIVE\war-room') { 'C:\ProgramData\THE_HIVE\war-room' }
  else { 'C:\Users\ARCHITECT\THE_HIVE' }

$AgentsPath = Join-Path $HiveRoot 'HIVE_WINDOWS\DNA\AGENTS.json'
if (-not (Test-Path $AgentsPath)) {
  $AgentsPath = 'C:\ProgramData\THE_HIVE\DNA\AGENTS.json'
}
$SkinsPath = Join-Path $HiveRoot 'HIVE_CORE\ui\SKIN_REGISTRY.json'

$agents = @()
if (Test-Path $AgentsPath) {
  $agents = (Get-Content $AgentsPath -Raw | ConvertFrom-Json).agents
} else {
  $agents = @(
    @{ id='krackerjack'; label='KRACKERJACK AI'; taskbar='KJ' },
    @{ id='jaguar'; label='JAGUAR AI'; taskbar='JG' },
    @{ id='counsel'; label='COUNSEL'; taskbar='CO' },
    @{ id='zorg'; label='ZORG'; taskbar='ZG' },
    @{ id='scamshield'; label='NEURAL SCAM SHIELD'; taskbar='NS' },
    @{ id='capricorn'; label='CAPRICORN AI'; taskbar='CP' },
    @{ id='grokschitt'; label='GROKSCHITT'; taskbar='GS' },
    @{ id='assimilate'; label='AssimilateOrDie'; taskbar='AD' },
    @{ id='hive'; label='HIVE'; taskbar='HV' }
  )
}

$skinMap = @{}
if (Test-Path $SkinsPath) {
  $reg = Get-Content $SkinsPath -Raw | ConvertFrom-Json
  foreach ($c in $reg.chambers) {
    $skinMap[$c.id] = $c.tokens
  }
}

function Invoke-HiveAgent([string]$Id, [string]$Prompt) {
  $py = Join-Path $HiveRoot 'NEURAL\brain\agents.py'
  $kj = Join-Path $HiveRoot 'NEURAL\krackerjack\first_contact.py'
  $hl = Join-Path $HiveRoot 'NEURAL\brain\hive_link.py'
  if ($Id -eq 'krackerjack' -and (Test-Path $kj)) {
    Start-Process python -ArgumentList "`"$kj`"", 'status' -WorkingDirectory $HiveRoot
    return
  }
  if (Test-Path $py) {
    $p = if ($Prompt) { $Prompt } else { "Online. Ready. Capricorn. One sentence status." }
    Start-Process python -ArgumentList "`"$py`"", $Id, "`"$p`"" -WorkingDirectory $HiveRoot
    return
  }
  if (Test-Path $hl) {
    Start-Process python -ArgumentList "`"$hl`"", 'status' -WorkingDirectory $HiveRoot
  }
}

function Open-HiveChamber([string]$Id) {
  $cockpit = Join-Path $HiveRoot 'cold-storage\hive-cockpit.html'
  $ui = Join-Path $HiveRoot 'HIVE_WINDOWS\ui\chamber.html'
  if (Test-Path $ui) {
    Start-Process $ui
  } elseif (Test-Path $cockpit) {
    Start-Process $cockpit
  }
  # ensure API up
  $api = Join-Path $HiveRoot 'NEURAL\brain\hive_api.py'
  if (Test-Path $api) {
    Start-Process python -ArgumentList "`"$api`"" -WindowStyle Minimized -WorkingDirectory $HiveRoot -ErrorAction SilentlyContinue
  }
}

[xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="HIVE AI DOCK"
        Height="56" MinHeight="40" MaxHeight="220"
        WindowStyle="None" ResizeMode="CanResizeWithGrip"
        Topmost="True" ShowInTaskbar="True"
        Background="#050505" AllowsTransparency="False">
  <Border BorderBrush="#FFD700" BorderThickness="0,2,0,0">
    <DockPanel>
      <TextBlock DockPanel.Dock="Left" Text=" HIVE " Foreground="#FFD700" FontWeight="Bold"
                 FontFamily="Consolas" VerticalAlignment="Center" Margin="6,0"/>
      <ScrollViewer HorizontalScrollBarVisibility="Auto" VerticalScrollBarVisibility="Disabled">
        <StackPanel x:Name="BtnRow" Orientation="Horizontal" Margin="4"/>
      </ScrollViewer>
    </DockPanel>
  </Border>
</Window>
"@

$reader = New-Object System.Xml.XmlNodeReader $xaml
$window = [Windows.Markup.XamlReader]::Load($reader)
$btnRow = $window.FindName('BtnRow')

# Prevent casual close — confirm Architect intent
$window.Add_Closing({
  param($s, $e)
  $r = [System.Windows.MessageBox]::Show(
    "HIVE AI DOCK is permanent for this session.`n`nYES = hide dock (Architect override)`nNO = keep dock",
    "THE HIVE",
    'YesNo',
    'Warning'
  )
  if ($r -ne 'Yes') { $e.Cancel = $true }
})

foreach ($a in $agents) {
  $id = [string]$a.id
  $label = [string]$a.label
  $tb = if ($a.taskbar) { [string]$a.taskbar } else { $label.Substring(0, [Math]::Min(2, $label.Length)) }
  $chamber = if ($a.chamber) { [string]$a.chamber } else { 'hive-cockpit' }
  $bg = '#111111'
  $fg = '#FFD700'
  if ($skinMap.ContainsKey($chamber)) {
    $t = $skinMap[$chamber]
    if ($t.primary) { $fg = [string]$t.primary }
    if ($t.panel) { $bg = [string]$t.panel }
  }
  $b = New-Object System.Windows.Controls.Button
  $b.Content = $tb
  $b.ToolTip = "$label — chat / chamber (individual + combined force)"
  $b.Margin = New-Object System.Windows.Thickness(3, 6, 3, 6)
  $b.Padding = New-Object System.Windows.Thickness(10, 4, 10, 4)
  $b.MinWidth = 40
  $b.Cursor = 'Hand'
  $b.Background = [System.Windows.Media.BrushConverter]::new().ConvertFromString($bg)
  $b.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString($fg)
  $b.BorderBrush = [System.Windows.Media.BrushConverter]::new().ConvertFromString($fg)
  $b.FontFamily = 'Consolas'
  $b.FontWeight = 'Bold'
  $agentId = $id
  $b.Add_Click({
    Invoke-HiveAgent -Id $agentId -Prompt ''
    Open-HiveChamber -Id $agentId
  }.GetNewClosure())
  [void]$btnRow.Children.Add($b)
}

# COMBINED FORCE button
$combo = New-Object System.Windows.Controls.Button
$combo.Content = 'ALL'
$combo.ToolTip = 'COMBINED FORCE — all AIs as one well-oiled swarm'
$combo.Margin = New-Object System.Windows.Thickness(8, 6, 6, 6)
$combo.Padding = New-Object System.Windows.Thickness(12, 4, 12, 4)
$combo.Background = '#1a1000'
$combo.Foreground = '#FFD700'
$combo.BorderBrush = '#FFD700'
$combo.FontWeight = 'Bold'
$combo.Add_Click({
  foreach ($a in $agents) {
    Invoke-HiveAgent -Id ([string]$a.id) -Prompt 'Combined force check-in. One line. Ready to work solo or swarm.'
  }
})
[void]$btnRow.Children.Add($combo)

# Position above taskbar
$wa = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$window.Width = $wa.Width
$window.Left = $wa.Left
$window.Top = $wa.Bottom - 56
if ($window.Top -lt 0) { $window.Top = $wa.Height - 56 }

# Watchdog: if closed by force, Architect can relaunch via startup
$window.ShowDialog() | Out-Null
