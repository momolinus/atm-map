# atm-map

check out <a href="https://geldautomaten-suche.org/">geldautomaten-suche.org</a>

- icons used by this project:
<a href="http://mapicons.nicolasmollet.com/">Nicolas Mollet</a> <a href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY SA 3.0</a>
- map framework: http://leafletjs.com/
- JavaScript framework: https://jquery.com/

# Run locally

The page uses ES modules, so it must be served by a web server (opening `index.html` via `file://` does not work).

1. Open a terminal in the folder `ATM-Map`.
2. Start a web server, e.g. `python3 -m http.server 8000`.
3. Open http://localhost:8000/index.html in the browser.
4. The unit tests run at http://localhost:8000/test/TestRunner.html.

In VS Code the extension "Live Server" works as well (right click on `index.html`, "Open with Live Server").

# Releases

## Version 6.2

published 25.10.2026

- forgot version note

## Version 6.1

published 25.10.2026

- opening hours are shown as a readable weekly table in popups using the locally bundled opening_hours.js (LGPL-3.0) and SunCalc; today is highlighted, invalid values fall back to the raw text
- unified naming of the module objects (`layerBuilder`, `atmMap`, `utils` instead of upper case names); constants like `SOURCE_OVERPASS` stay upper case
- documented the `atm*.js` modules and translated all code comments to English
- fixed the attribution link to `https://obstbaumkarte.de/` (the certificate is not valid for `www.`)
- the cash withdrawal note ("nur mit Einkauf") is shown on its own line and centered
- cleaned up whitespace and indentation, removed unused ESLint global comments

## Version 6.0

published 24.10.2026

- added an alternative ATM data source using locally bundled Leaflet.VectorGrid and PBF vector tiles
- the sidebar lets users switch exclusively between Overpass API and ATM vector tiles; ATM vector tiles are the default, Overpass stays available
- vector tile mode also shows shops with cash withdrawal (`alle_cash_withdrawal` layer, e.g. supermarkets) with a green supermarket icon (Nicolas Mollet, CC BY-SA 3.0, Map Icons Collection); they can be switched off in the sidebar
- ATM category filters and status icons are also applied to vector tile features
- OSM tag values are now HTML-escaped in popups
- replaced the IIFE wrappers by ES modules (`import`/`export`, new `atmmap_config.js`); the page and the tests must now be served by a web server (e.g. `python3 -m http.server` in `ATM-Map`), opening the files via `file://` no longer works
- refactored `atmmap.js` into a core (`atmmap.js`) and one module per data source (`atmmap_vectortiles.js`, `atmmap_overpass.js`) without changing behavior

- all vibe coding

## Version 5.3

published 02.10.2026

- improved error handling when overpass api has an error
- placed copyright on right bottom edge


## Version 5.0

published 16.07.2023

- intelligent area search
- new WMS service
- JQuery update
- leaflet update
- source code refactoring
	- reduce size of methods
 	- eliminate the warning messages of ESLint  

## Version 4.0.0

published 02.02.2021

minor change: now using ATM's network tag to find ATM's operator or name

## Version 3.0

published 15.10.2018

- added side bar https://github.com/turbo87/sidebar-v2/
- removed permalink feature

## Version 2.0

- updated spinner to https://github.com/makinacorpus/Leaflet.Spin/releases/tag/1.1.0
	- depends on Spin.js https://github.com/fgnass/spin.js/releases/tag/3.1.0 download http://spin.js.org/spin.js
- update permalink to https://github.com/shramov/leaflet-plugins/releases/tag/3.0.1
- updated to leaflet 1.2.0
- updated to jquery 3.2.1
- changed to locate control https://github.com/domoritz/leaflet-locatecontrol
- changed search https://github.com/k4r573n/leaflet-control-osm-geocoder

## Version 1.4

published 15.10.2016

- update to leaflet 1.0.1
- update to jquery 3.1.1
- libraries used from local now
- new geocoder: L.GeoSearch
- spin: Leaflet.Spin

## Version 1.3

published 30.4.2016

- updated to leaflet v0.7.7
- updated to jquery 1.12.2
- added opening hours

## Version 1.2

published 8.2.2015

- bug fixed by updating photon search plugin

## Version 1.1

published 01.09.2014

- some enhancement

## Version 1.0

published 27.07.2014

- fixed error with "way-nodes" has individual tags
