/**
 * This file is licensed under Creative Commons Zero (CC0)
 * https://creativecommons.org/publicdomain/zero/1.0/
 *
 * Author: https://www.openstreetmap.org/user/Zartbitter
 */

var map;

/**
 * Add or replace a parameter (with value) in the given URL.
 * By Adil Malik, https://stackoverflow.com/questions/1090948/change-url-parameters/10997390#10997390
 * @param String url the URL
 * @param String param the parameter
 * @param String paramVal the value of the parameter
 * @return String the changed URL
 */





function updateURLParameter(url, param, paramVal) {
	var theAnchor = null;
	var newAdditionalURL = "";
	var tempArray = url.split("?");
	var baseURL = tempArray[0];
	var additionalURL = tempArray[1];
	var temp = "";

	if (additionalURL) {
		var tmpAnchor = additionalURL.split("#");
		var theParams = tmpAnchor[0];
		theAnchor = tmpAnchor[1];
		if(theAnchor) {
			additionalURL = theParams;
		}

		tempArray = additionalURL.split("&");

		for (i=0; i<tempArray.length; i++) {
			if(tempArray[i].split('=')[0] != param) {
				newAdditionalURL += temp + tempArray[i];
				temp = "&";
			}
		}        
	} else {
		var tmpAnchor = baseURL.split("#");
		var theParams = tmpAnchor[0];
		theAnchor  = tmpAnchor[1];

		if(theParams) {
			baseURL = theParams;
		}
	}

	if(theAnchor) {
		paramVal += "#" + theAnchor;
	}

	var rows_txt = temp + "" + param + "=" + paramVal;
	return baseURL + "?" + newAdditionalURL + rows_txt;
}

/**
 * Add or replace the language parameter of the URL and reload the page.
 * @param String id of the language
 */
function changeLanguage(pLang) {
	window.location.href = updateURLParameter(window.location.href, 'lang', pLang);
}

/**
 * Get all parameters out of the URL.
 * @return Array List of URL parameters key-value indexed
 */
function getUrlParameters() {
	var vars = [], hash;
	var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
	for(var i=0; i<hashes.length; i++) {
		hash = hashes[i].split('=');
		vars.push(hash[0]);
		vars[hash[0]] = hash[1];
	}
	return vars;
}

/**
 * Callback for successful geolocation.
 * @var position Geolocated position
 */
function foundLocation(position) {
	if (typeof map != "undefined") {
		var lat = position.coords.latitude;
		var lon = position.coords.longitude;
		map.setView(new L.LatLng(lat, lon), 11);
	}
}

/**
 * Example function to replace leaflet-openweathermap's builtin marker by a wind rose symbol.
 * Some helper functions and an event listener are needed, too. See below.
 */
function myWindroseMarker(data) {
	var content = '<canvas id="id_' + data.id + '" width="50" height="50"></canvas>';
	var icon = L.divIcon({html: content, iconSize: [50,50], className: 'owm-div-windrose'});
	return L.marker([data.coord.Lat, data.coord.Lon], {icon: icon, clickable: false});
}

/**
 * Helper function for replacing leaflet-openweathermap's builtin marker by a wind rose symbol.
 * This function draws the canvas of one marker symbol once it is available in the DOM.
 */
function myWindroseDrawCanvas(data, owm) {

	var canvas = document.getElementById('id_' + data.id);
	canvas.title = data.name;
	var angle = 0;
	var speed = 0;
	var gust = 0;
	if (typeof data.wind != 'undefined') {
		if (typeof data.wind.speed != 'undefined') {
			canvas.title += ', ' + data.wind.speed + ' m/s';
			canvas.title += ', ' + owm._windMsToBft(data.wind.speed) + ' BFT';
			speed = data.wind.speed;
		}
		if (typeof data.wind.deg != 'undefined') {
			//canvas.title += ', ' + data.wind.deg + '°';
			canvas.title += ', ' + owm._directions[(data.wind.deg/22.5).toFixed(0)];
			angle = data.wind.deg;
		}
		if (typeof data.wind.gust != 'undefined') {
			gust = data.wind.gust;
		}
	}
	if (canvas.getContext && speed > 0) {
		var red = 0;
		var green = 0;
		if (speed <= 10) {
			green = 10*speed+155;
			red = 255*speed/10.0;
		} else {
			red = 255;
			green = 255-(255*(Math.min(speed, 21)-10)/11.0);
		}
		var ctx = canvas.getContext('2d');
		ctx.translate(25, 25);
		ctx.rotate(angle*Math.PI/180);
		ctx.fillStyle = 'rgb(' + Math.floor(red) + ',' + Math.floor(green) + ',' + 0 + ')';
		ctx.beginPath();
		ctx.moveTo(-15, -25);
		ctx.lineTo(0, -10);
		ctx.lineTo(15, -25);
		ctx.lineTo(0, 25);
		ctx.fill();

		// draw inner arrow for gust
		if (gust > 0 && gust != speed) {
			if (gust <= 10) {
				green = 10*gust+155;
				red = 255*gust/10.0;
			} else {
				red = 255;
				green = 255-(255*(Math.min(gust, 21)-10)/11.0);
			}
			canvas.title += ', gust ' + data.wind.gust + ' m/s';
			canvas.title += ', ' + owm._windMsToBft(data.wind.gust) + ' BFT';
			ctx.fillStyle = 'rgb(' + Math.floor(red) + ',' + Math.floor(green) + ',' + 0 + ')';
			ctx.beginPath();
			ctx.moveTo(-15, -25);
			ctx.lineTo(0, -10);
			//ctx.lineTo(15, -25);
			ctx.lineTo(0, 25);
			ctx.fill();
		}
	} else {
		canvas.innerHTML = '<div>'
				+ (typeof data.wind != 'undefined' && typeof data.wind.deg != 'undefined' ? data.wind.deg + '°' : '')
				+ '</div>';
	}
}

/**
 * Helper function for replacing leaflet-openweathermap's builtin marker by a wind rose symbol.
 * This function is called event-driven when the layer and its markers are added. Now we can draw all marker symbols.
 * The this-context has to be the windrose layer.
 */
function windroseAdded(e) {
	for (var i in this._markers) {
		var m = this._markers[i];
		var cv = document.getElementById('id_' + m.options.owmId);
		for (var j in this._cache._cachedData.list) {
			var station = this._cache._cachedData.list[j];
			if (station.id == m.options.owmId) {
				myWindroseDrawCanvas(station, this);
			}
		}
	}
}

/**
 * Example function to replace leaflet-openweathermap's builtin marker.
 */
function myOwmMarker(data) {
	// just a Leaflet default marker
	return L.marker([data.coord.Lat, data.coord.Lon]);
}

/**
 * Example function to replace leaflet-openweathermap's builtin popup.
 */
function myOwmPopup(data) {
	// just a Leaflet default popup
	return L.popup().setContent(typeof data.name != 'undefined' ? data.name : data.id);
}

/**
 * Toggle scroll wheel behaviour.
 */
function toggleWheel(localLang) {
	if (map.scrollWheelZoom._enabled) {
		map.scrollWheelZoom.disable();
		document.getElementById('wheelimg').src = 'files/ScrollWheelDisabled20.png';
		document.getElementById('wheeltxt').innerHTML = getI18n('scrollwheel', localLang) + ' ' + getI18n('off', localLang);
	} else {
		map.scrollWheelZoom.enable();
		document.getElementById('wheelimg').src = 'files/ScrollWheel20.png';
		document.getElementById('wheeltxt').innerHTML = getI18n('scrollwheel', localLang) + ' ' + getI18n('on', localLang);
	}
}


function loadGeoJsonString(geoString) {
        var geojson = JSON.parse(geoString);
        map.data.addGeoJson(geojson);
        zoom(map);
      }

      /**
       * Update a map's viewport to fit each geometry in a dataset
       * @param {google.maps.Map} map The map to adjust
       */
      function zoom(map) {
        var bounds = new google.maps.LatLngBounds();
        map.data.forEach(function(feature) {
          processPoints(feature.getGeometry(), bounds.extend, bounds);
        });
        map.fitBounds(bounds);
      }

      /**
       * Process each point in a Geometry, regardless of how deep the points may lie.
       * @param {google.maps.Data.Geometry} geometry The structure to process
       * @param {function(google.maps.LatLng)} callback A function to call on each
       *     LatLng point encountered (e.g. Array.push)
       * @param {Object} thisArg The value of 'this' as provided to 'callback' (e.g.
       *     myArray)
       */
      function processPoints(geometry, callback, thisArg) {
        if (geometry instanceof google.maps.LatLng) {
          callback.call(thisArg, geometry);
        } else if (geometry instanceof google.maps.Data.Point) {
          callback.call(thisArg, geometry.get());
        } else {
          geometry.getArray().forEach(function(g) {
            processPoints(g, callback, thisArg);
          });
        }
      }


      /* DOM (drag/drop) functions */

      function initEvents() {
        // set up the drag & drop events
        var mapContainer = document.getElementById('map');
        var dropContainer = document.getElementById('drop-container');

        // map-specific events
        mapContainer.addEventListener('dragenter', showPanel, false);

        // overlay specific events (since it only appears once drag starts)
        dropContainer.addEventListener('dragover', showPanel, false);
        dropContainer.addEventListener('drop', handleDrop, false);
        dropContainer.addEventListener('dragleave', hidePanel, false);
      }

      function showPanel(e) {
        e.stopPropagation();
        e.preventDefault();
        document.getElementById('drop-container').style.display = 'block';
        return false;
      }

      function hidePanel(e) {
        document.getElementById('drop-container').style.display = 'none';
      }

      function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        hidePanel(e);

        var files = e.dataTransfer.files;
        if (files.length) {
          // process file(s) being dropped
          // grab the file data from each file
          for (var i = 0, file; file = files[i]; i++) {
            var reader = new FileReader();
            reader.onload = function(e) {
              loadGeoJsonString(e.target.result);
            };
            reader.onerror = function(e) {
              console.error('reading failed');
            };
            reader.readAsText(file);
          }
        } else {
          // process non-file (e.g. text or html) content being dropped
          // grab the plain text version of the data
          var plainText = e.dataTransfer.getData('text/plain');
          if (plainText) {
            loadGeoJsonString(plainText);
          }
        }

        // prevent drag event from bubbling further
        return false;
      }



/**
 * Initialize the map.
 */
function initMap() {

	var standard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors</a>'
		});

	var humanitarian = L.tileLayer('https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
		maxZoom: 17,
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors</a> <a href="https://www.hotosm.org/" target="_blank">Tiles courtesy of Humanitarian OpenStreetMap Team</a>'
		});

	var esri = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.jpg", {
		maxZoom: 19, attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
	});
	
	var GeoportailFrance_orthos = L.tileLayer('https://wxs.ign.fr/{apikey}/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
	attribution: '<a target="_blank" href="https://www.geoportail.gouv.fr/">Geoportail France</a>',
	bounds: [[-75, -180], [81, 180]],
	minZoom: 2,
	maxZoom: 19,
	apikey: 'choisirgeoportail',
	format: 'image/jpeg',
	style: 'normal'
	});
	
	var OpenInfraMap_Power = L.tileLayer('https://tiles-{s}.openinframap.org/power/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://www.openinframap.org/about.html">About OpenInfraMap</a>'
	});
	
	var OpenInfraMap_Telecom = L.tileLayer('https://tiles-{s}.openinframap.org/telecoms/{z}/{x}/{y}.png', {
	maxZoom: 18,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://www.openinframap.org/about.html">About OpenInfraMap</a>'
	});
	
	var NASAGIBS_ModisTerraLSTDay = L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_Land_Surface_Temp_Day/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
	attribution: 'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
	bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
	minZoom: 1,
	maxZoom: 7,
	format: 'png',
	time: '',
	tilematrixset: 'GoogleMapsCompatible_Level',
	opacity: 0.75
});
	
	var OpenRailwayMap = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> | Map style: &copy; <a href="https://www.OpenRailwayMap.org">OpenRailwayMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});
	
	var NASAGIBS_ViirsEarthAtNight2012 = L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
	attribution: 'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
	bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
	minZoom: 1,
	maxZoom: 8,
	format: 'jpg',
	time: '',
	tilematrixset: 'GoogleMapsCompatible_Level'
});
	var NASAGIBS_ModisTerraBands367CR = L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_CorrectedReflectance_Bands367/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
	attribution: 'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
	bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
	minZoom: 1,
	maxZoom: 9,
	format: 'jpg',
	time: '',
	tilematrixset: 'GoogleMapsCompatible_Level'
});
	var NASAGIBS_ModisTerraTrueColorCR = L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_CorrectedReflectance_TrueColor/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
	attribution: 'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
	bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
	minZoom: 1,
	maxZoom: 9,
	format: 'jpg',
	time: '',
	tilematrixset: 'GoogleMapsCompatible_Level'
});
	var HERE_hybridDay = L.tileLayer('https://{s}.{base}.maps.cit.api.here.com/maptile/2.1/{type}/{mapID}/hybrid.day/{z}/{x}/{y}/{size}/{format}?app_id={app_id}&app_code={app_code}&lg={language}', {
	attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
	subdomains: '1234',
	mapID: 'newest',
	app_id: '<your app_id>',
	app_code: '<your app_code>',
	base: 'aerial',
	maxZoom: 20,
	type: 'maptile',
	language: 'eng',
	format: 'png8',
	size: '256'
});
	var HERE_normalDay = L.tileLayer('https://{s}.{base}.maps.cit.api.here.com/maptile/2.1/{type}/{mapID}/normal.day/{z}/{x}/{y}/{size}/{format}?app_id={app_id}&app_code={app_code}&lg={language}', {
	attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
	subdomains: '1234',
	mapID: 'newest',
	app_id: '<your app_id>',
	app_code: '<your app_code>',
	base: 'base',
	maxZoom: 20,
	type: 'maptile',
	language: 'eng',
	format: 'png8',
	size: '256'
});
	var Esri_WorldShadedRelief = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri',
	maxZoom: 13
});
	var Esri_NatGeoWorldMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
	maxZoom: 16
});
	var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});
	var Esri_WorldTopoMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
});
	var Esri_DeLorme = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Specialty/DeLorme_World_Base_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Copyright: &copy;2012 DeLorme',
	minZoom: 1,
	maxZoom: 11
});
	var Esri_WorldStreetMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
});
	var Stamen_TerrainBackground = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-background/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 18,
	ext: 'png'
});
	var Stamen_Terrain = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 18,
	ext: 'png'
});
	var Stamen_TonerLite = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});
	var Hydda_Full = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
	maxZoom: 18,
	attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
	var OpenMapSurfer_Roads = L.tileLayer('https://korona.geog.uni-heidelberg.de/tiles/roads/x={x}&y={y}&z={z}', {
	maxZoom: 20,
	attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
	var OpenTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});
	var OpenStreetMap_HOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
});
	var OpenStreetMap_BlackAndWhite = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
	maxZoom: 18,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
	var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
	
	// Get your own free OWM API key at https://www.openweathermap.org/appid - please do not re-use mine!
	// You don't need an API key for this to work at the moment, but this will change eventually.
	var OWM_API_KEY = '06aac0fd4ba239a20d824ef89602f311';

	var clouds = L.OWM.clouds({opacity: 0.8, legendImagePath: 'files/NT2.png', appId: OWM_API_KEY});
	var cloudscls = L.OWM.cloudsClassic({opacity: 0.5, appId: OWM_API_KEY});
	var precipitation = L.OWM.precipitation( {opacity: 0.5, appId: OWM_API_KEY} );
	var precipitationcls = L.OWM.precipitationClassic({opacity: 0.5, appId: OWM_API_KEY});
	var rain = L.OWM.rain({opacity: 0.5, appId: OWM_API_KEY});
	var raincls = L.OWM.rainClassic({opacity: 0.5, appId: OWM_API_KEY});
	var snow = L.OWM.snow({opacity: 0.5, appId: OWM_API_KEY});
	var pressure = L.OWM.pressure({opacity: 0.4, appId: OWM_API_KEY});
	var pressurecntr = L.OWM.pressureContour({opacity: 0.5, appId: OWM_API_KEY});
	var temp = L.OWM.temperature({opacity: 0.5, appId: OWM_API_KEY});
	var wind = L.OWM.wind({opacity: 0.5, appId: OWM_API_KEY});

	var localLang = getLocalLanguage();

	var city = L.OWM.current({intervall: 15, imageLoadingUrl: 'leaflet/owmloading.gif', lang: localLang, minZoom: 5,
			appId: OWM_API_KEY});
	var windrose = L.OWM.current({intervall: 15, imageLoadingUrl: 'leaflet/owmloading.gif', lang: localLang, minZoom: 4,
			appId: OWM_API_KEY, markerFunction: myWindroseMarker, popup: false, clusterSize: 50,
   			imageLoadingBgUrl: 'https://openweathermap.org/img/w0/iwind.png' });
	windrose.on('owmlayeradd', windroseAdded, windrose); // Add an event listener to get informed when windrose layer is ready

	var useGeolocation = true;
	var zoom = 6;
	var lat = 2.7465;
	var lon = 101.44724;
	var urlParams = getUrlParameters();
	if (typeof urlParams.zoom != "undefined" && typeof urlParams.lat != "undefined" && typeof urlParams.lon != "undefined") {
		zoom = urlParams.zoom;
		lat = urlParams.lat;
		lon = urlParams.lon;
		useGeolocation = false;
	}

	map = L.map('map', {
		center: new L.LatLng(lat, lon), zoom: zoom,
		layers: [standard]
	});
	map.attributionControl.setPrefix("");

	map.addControl(L.languageSelector({
		languages: new Array(
			L.langObject('en', 'English', 'mapicons/en.png')
		,	L.langObject('de', 'Deutsch', 'mapicons/de.png')
		,	L.langObject('fr', 'Français', 'mapicons/fr.png')
		,	L.langObject('it', 'Italiano', 'mapicons/it.png')
		,	L.langObject('es', 'Español', 'mapicons/es.png')
		,	L.langObject('ca', 'Català', 'mapicons/catalonia.png')
		,	L.langObject('ru', 'Русский', 'mapicons/ru.png')
		,	L.langObject('nl', 'Nederlands', 'mapicons/nl.png')
		,	L.langObject('pt_br', 'Português do Brasil', 'mapicons/br.png')
		),
		callback: changeLanguage,
		initialLanguage: localLang,
		hideSelected: false,
		vertical: false
	}));

	var baseMaps = {
		"OSM Standard": standard
		, "OSM Humanitarian": humanitarian
		, "ESRI Aerial": esri
		, "GeoportailFrance_orthos": GeoportailFrance_orthos
		, "OpenInfraMap_Power": OpenInfraMap_Power
		, "OpenInfraMap_Telecom": OpenInfraMap_Telecom
		, "_ModisSurfaceTemp": NASAGIBS_ModisTerraLSTDay
		, "OpenRailwayMap": OpenRailwayMap
		, "EarthNight": NASAGIBS_ViirsEarthAtNight2012
		, "ModisTerra367": NASAGIBS_ModisTerraBands367CR
		, "TerraTrueColor": NASAGIBS_ModisTerraTrueColorCR
		, "HEREHybrid": HERE_hybridDay
		, "HereNormal": HERE_normalDay
		, "ESRIRelief": Esri_WorldShadedRelief
		, "ESRIMap": Esri_NatGeoWorldMap
		, "ESRIImagery": Esri_WorldImagery
		, "ESRITopo": Esri_WorldTopoMap
		, "ESRIDeLome": Esri_DeLorme
		, "StamenTerrainBg": Stamen_TerrainBackground
		, "StamenTerrain": Stamen_Terrain
		, "StamenTL": Stamen_TonerLite
		, "Hydda": Hydda_Full
		, "OpenMapSurfer": OpenMapSurfer_Roads
		, "OpenTopo": OpenTopoMap
		, "HOT" : OpenStreetMap_HOT
		, "OSMBW": OpenStreetMap_BlackAndWhite
		, "Mapnik": OpenStreetMap_Mapnik
		
	};

	var overlayMaps = {};
	overlayMaps[getI18n('clouds', localLang)] = clouds;
	overlayMaps[getI18n('cloudscls', localLang)] = cloudscls;
	overlayMaps[getI18n('precipitation', localLang)] = precipitation;
	overlayMaps[getI18n('precipitationcls', localLang)] = precipitationcls;
	overlayMaps[getI18n('rain', localLang)] = rain;
	overlayMaps[getI18n('raincls', localLang)] = raincls;
	overlayMaps[getI18n('snow', localLang)] = snow;
	overlayMaps[getI18n('temp', localLang)] = temp;
	overlayMaps[getI18n('windspeed', localLang)] = wind;
	overlayMaps[getI18n('pressure', localLang)] = pressure;
	overlayMaps[getI18n('presscont', localLang)] = pressurecntr;
	overlayMaps[getI18n('city', localLang) + " (min Zoom 5)"] = city;
	overlayMaps[getI18n('windrose', localLang)] = windrose;

	var layerControl = L.control.layers(baseMaps, overlayMaps, {collapsed: false}).addTo(map);
	map.addControl(new L.Control.Permalink({layers: layerControl, useAnchor: false, position: 'bottomright'}));
	
	// loading GeoJSON file - Here my html and usa_adm.geojson file resides in same folder
$.getJSON("countours.geojson",function(data){
// L.geoJson function is used to parse geojson file and load on to map
L.geoJson(data).addTo(map);
});

	// patch layerControl to add some titles
	var patch = L.DomUtil.create('div', 'owm-layercontrol-header');
	patch.innerHTML = getI18n('layers', localLang); // 'TileLayers';
	layerControl._form.children[2].parentNode.insertBefore(patch, layerControl._form.children[2]);
	patch = L.DomUtil.create('div', 'leaflet-control-layers-separator');
	layerControl._form.children[3].children[0].parentNode.insertBefore(patch, layerControl._form.children[3].children[layerControl._form.children[3].children.length-2]);
	patch = L.DomUtil.create('div', 'owm-layercontrol-header');
	patch.innerHTML = getI18n('current', localLang); // 'Current Weather';
	layerControl._form.children[3].children[0].parentNode.insertBefore(patch, layerControl._form.children[3].children[layerControl._form.children[3].children.length-2]);
	patch = L.DomUtil.create('div', 'owm-layercontrol-header');
	patch.innerHTML = getI18n('maps', localLang); // 'Maps';
	layerControl._form.children[0].parentNode.insertBefore(patch, layerControl._form.children[0]);

	patch = L.DomUtil.create('div', 'leaflet-control-layers-separator');
	layerControl._form.children[0].parentNode.insertBefore(patch, null);
	patch = L.DomUtil.create('div', 'owm-layercontrol-header');
	patch.innerHTML = getI18n('prefs', localLang); // 'Preferences';
	layerControl._form.children[0].parentNode.insertBefore(patch, null);
	patch = L.DomUtil.create('div', '');
	patch.innerHTML = '<div id="wheeldiv" onClick="toggleWheel(\'' + localLang + '\')"><img id="wheelimg" src="files/ScrollWheel20.png" align="middle" > <span id="wheeltxt">' + getI18n('scrollwheel', localLang) + ' ' + getI18n('on', localLang) + '</span></div>';
	layerControl._form.children[0].parentNode.insertBefore(patch, null);

	if (useGeolocation && typeof navigator.geolocation != "undefined") {
		navigator.geolocation.getCurrentPosition(foundLocation);
	}
	//initEvents();
}
