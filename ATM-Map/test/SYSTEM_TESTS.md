# ST1 Inspect New York

## Version 5.0
Test successful, no anomalies

# ST2 Inspect Santiago de Chile

## Version 5.0
Test successful, no anomalies

# ST3 Inspect Tokio

## Version 5.0
Test successful, no anomalies

# ST4 Inspect Auckland

## Version 5.0
Test successful, no anomalies

# ST5 Inspect Search "Stühlingen"

## Version 5.0
Test successful, no anomalies

# ST6 Berlin Pöppelmannstr. 1

## Version 5.0
Test successful, no anomalies

# ST7 turn on/off bank categories

## Version 5.0
Test successful, no anomalies

# ST8 Switch between Overpass and ATM vector tiles

## Unreleased
- Start the map and verify ATM vector tiles are selected and show ATM/bank features with the expected status icons and popup details.
- Move and zoom the map; verify tiles update and the category filters continue to work.
- Select Overpass and verify ATMs appear at zoom 13 or higher, verify the tile features disappear and Overpass results load for the current area without duplicates. Switch back to vector tiles and verify the Overpass markers disappear.

# ST10 Cash withdrawal shops

## Unreleased
- In vector tile mode verify green supermarket icons appear (e.g. Berlin Mitte, zoom 16) and clicking one opens a popup with name, opening hours, and cash withdrawal note.
- Untick "Supermärkte mit Bargeldauszahlung" and verify the green icons disappear; tick again and verify they return.
- Select Overpass and verify the checkbox is disabled and no green icons are shown.

# ST9 Zoom limit of ATM vector tiles

## Unreleased
- Select ATM vector tiles and zoom out below 13; verify no ATM or supermarket icons are shown and no tiles are requested. Zoom to 13 or higher and verify the icons appear.
- Switch to Overpass below zoom 13; verify no Overpass request is made until zooming back to 13 or higher.
