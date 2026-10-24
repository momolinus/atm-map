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
- Start with Overpass selected and verify ATMs appear at zoom 14 or higher.
- Select ATM vector tiles and verify the map shows ATM/bank features with the expected status icons and popup details.
- Move and zoom the map; verify tiles update and the category filters continue to work.
- Switch back to Overpass and verify old tile features disappear and Overpass results load for the current area without duplicates.

# ST9 Use ATM vector tiles below zoom 14

## Unreleased
- Select ATM vector tiles and zoom below 14; verify vector tiles remain visible.
- Switch to Overpass below zoom 14; verify no Overpass request is made until zooming back to 14 or higher.
