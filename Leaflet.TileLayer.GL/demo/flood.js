var fragmentShader = `
void main(void) {
	highp vec4 texelColour = texture2D(uTexture0, vec2(vTextureCoords.s, vTextureCoords.t));
	// Height is represented in TENTHS of a meter
	highp float height = (
		texelColour.r * 255.0 * 256.0 * 256.0 +
		texelColour.g * 255.0 * 256.0 +
		texelColour.b * 255.0 )
	-100000.0;
	if (height > 100.0) {
		// High (>30m) over ground, transparent
		gl_FragColor = vec4(0.5, 0.5, 0.5, 0.0);
	} else if (height > 50.0) {
		// Over ground but somewhat close to sea level, yellow
		gl_FragColor = vec4(0.9, 0.9, 0.5, 0.4);
	} else if (height > 0.0) {
		// Over ground but very close to sea level, red
		gl_FragColor = vec4(0.9, 0.5, 0.5, 0.4);
	} else {
		// Water, some semiopaque blue
		gl_FragColor = vec4(0.05, 0.1, 0.9, 0.4);
	}
}
`
		var tileSize = 256;
		var map = L.map('map').fitWorld();
		var mapboxAccessToken = 'pk.eyJ1IjoienN0YWRsZXIiLCJhIjoiY2lvbDc5Zzl6MDAwc3Z2bTZ6NDNybDM3dSJ9.vxR1WVn26mEtpEk9MzdiUA';
		var base = L.tileLayer("https://{s}.tiles.mapbox.com/v4/mapbox.outdoors/{z}/{x}/{y}.png?access_token=" + mapboxAccessToken, {
			attribution: 'Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy;<a href="https://www.mapbox.com/map-feedback/">Mapbox</a>'
		}).addTo(map);
		var antitoner = L.tileLayer.gl({
			fragmentShader: fragmentShader,
			tileUrls: ['https://{s}.tiles.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token=' + mapboxAccessToken]
		}).addTo(map);
		function logEvent(e) { console.log(e.type); }
		map.on('mousemove', function(ev){
			document.getElementById('x').innerHTML = ev.latlng.lng;
			document.getElementById('y').innerHTML = ev.latlng.lat;
		});
		map.on('zoomend', function(ev){
			document.getElementById('zoom').innerHTML = map.getZoom();
		});
