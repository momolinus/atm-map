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

	initialize_layer : function() {
		// console.info("Initialize layer");
		this.on('update', this._set_layer, this);
		this.on('add', this._onadd_layer, this);
	},

	_onadd_layer : function(e) {
		// console.info("onAdd::layer", e);
		this._map.on('layeradd', this._update_layer, this);
		this._map.on('layerremove', this._update_layer, this);
		this._update_layer();
	},

	_update_layer : function() {
		if (!this.options.layers)
			return;
		// console.info(this.options.layers);
		var layer = this.options.layers.currentBaseLayer();
		if (layer)
			this._update({
				layer : layer.name
			});
	},

	_set_layer : function(e) {
		// console.info("Set layer", e);
		var p = e.params;
		if (!this.options.layers || !p.layer)
			return;
		this.options.layers.chooseBaseLayer(p.layer);
	}
});

L.Control.Layers.include({
	chooseBaseLayer : function(name) {
		var layer, obj;
		for ( var i in this._layers) {
			if (!this._layers.hasOwnProperty(i))
				continue;
			obj = this._layers[i];
			if (!obj.overlay && obj.name === name)
				layer = obj.layer;
		}
		if (!layer || this._map.hasLayer(layer))
			return;

		for ( var j in this._layers) {
			if (!this._layers.hasOwnProperty(j))
				continue;
			obj = this._layers[j];
			if (!obj.overlay && this._map.hasLayer(obj.layer))
				this._map.removeLayer(obj.layer);
		}
		this._map.addLayer(layer);
		this._update();
	},

	currentBaseLayer : function() {
		for ( var i in this._layers) {
			if (!this._layers.hasOwnProperty(i))
				continue;
			var obj = this._layers[i];
			// console.info("Layer: ", obj.name, obj);
			if (obj.overlay)
				continue;
			if (!obj.overlay && this._map.hasLayer(obj.layer))
				return obj;
		}
	}
});
