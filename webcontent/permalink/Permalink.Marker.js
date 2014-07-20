/*
Copyright (c) 2011-2014, Pavel Shramov, Bruno Bergot
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

//#include "Permalink.js
L.Control.Permalink.include({
	/*
	 * options: { useMarker: true, markerOptions: {} },
	 */

	initialize_marker : function() {
		// console.info("Initialize marker");
		this.on('update', this._set_marker, this);
	},

	_set_marker : function(e) {
		// console.info("Set marker", e);
		var p = e.params;
		// if (!this.options.useMarker) return;
		if (this._marker)
			return;
		if (p.marker !== 1)
			return;
		if (p.mlat !== undefined && p.mlon !== undefined)
			return this._update({
				mlat : null,
				mlon : null,
				lat : p.mlat,
				lon : p.mlon,
				marker : 1
			});
		this._marker = new L.Marker(new L.LatLng(p.lat, p.lon),
				this.options.markerOptions);
		this._marker.bindPopup('<a href="' + this._update_href() + '">'
				+ this.options.text + '</a>');
		this._map.addLayer(this._marker);
		this._update({
			marker : null
		});
	}
});
