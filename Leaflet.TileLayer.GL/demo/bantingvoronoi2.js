showHide = function(selector) {
  d3.select(selector).select('.hide').on('click', function(){
    d3.select(selector)
      .classed('visible', false)
      .classed('hidden', true);
  });

  d3.select(selector).select('.show').on('click', function(){
    d3.select(selector)
      .classed('visible', true)
      .classed('hidden', false);
  });
}

voronoiMap = function(map, url, initialSelections) {
  var pointTypes = d3.map(),
      points = [],
      lastSelectedPoint;

  var voronoi = d3.geom.voronoi()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; });

  // voronoi.find is included in [d3 v4.3.0](https://github.com/d3/d3/releases/v4.3.0)
// the following lines just add coloring
voronoi.find = function(x, y, radius) {
  var i, next = voronoi.find.found || Math.floor(Math.random() * diagram.cells.length);
  var cell = voronoi.cells[next] || voronoi.cells[next=0];
  var dx = x - cell.site[0], 
      dy = y - cell.site[1],
      dist = dx*dx + dy*dy;
  

  do {
    cell = voronoi.cells[i=next];
    next = null;
    polygon._groups[0][i].setAttribute('fill', '#f5a61d');
    cell.halfedges.forEach(function(e) {
      var edge = voronoi.edges[e];
      var ea = edge.left;
      if (ea === cell.site || !ea) {
        ea = edge.right;
      }
      if (ea){
        if (polygon._groups[0][ea.index].getAttribute('fill') != '#f5a61d')
        polygon._groups[0][ea.index].setAttribute('fill', '#fbe8ab');
				var dx = x - ea[0],
            dy = y - ea[1],
            ndist = dx*dx + dy*dy;
        if (ndist < dist){
          dist = ndist;
          next = ea.index;
          return;
        }
      }
    });

  } while (next !== null);

  voronoi.find.found = i;
  if (!radius || dist < radius * radius) return cell.site;
} 


findcell([width/2, height/2]);

function moved() {
  findcell(d3.mouse(this));
}

function findcell(m) {
  polygon.attr('fill', '');
	var found = voronoi.find(m[0],m[1], 50);
  if (found)
    polygon._groups[0][found.index].setAttribute('fill', 'red');
}

function redraw() {
  polygon = polygon.data(voronoi.polygons()).call(redrawPolygon);
}

function redrawPolygon(polygon) {
  polygon
      .attr("d", function(d) { return d ? "M" + d.join("L") + "Z" : null; });
}

  
  
  var selectPoint = function() {
    d3.selectAll('.selected').classed('selected', false);

    var cell = d3.select(this),
        point = cell.datum();

    lastSelectedPoint = point;
    cell.classed('selected', true);

    d3.select('#selected h1')
      .html('')
      .append('a')
        .text(point.name)
        .attr('href', point.url)
        .attr('target', '_blank')
  }

  var drawPointTypeSelection = function() {
    showHide('#selections')
    labels = d3.select('#toggles').selectAll('input')
      .data(pointTypes.values())
      .enter().append("label");

    labels.append("input")
      .attr('type', 'checkbox')
      .property('checked', function(d) {
        return initialSelections === undefined || initialSelections.has(d.type)
      })
      .attr("value", function(d) { return d.type; })
      .on("change", drawWithLoading);

    labels.append("span")
      .attr('class', 'key')
      .style('background-color', function(d) { return '#' + d.color; });

    labels.append("span")
      .text(function(d) { return d.type; });
  }

  var selectedTypes = function() {
    return d3.selectAll('#toggles input[type=checkbox]')[0].filter(function(elem) {
      return elem.checked;
    }).map(function(elem) {
      return elem.value;
    })
  }

  var pointsFilteredToSelectedTypes = function() {
    var currentSelectedTypes = d3.set(selectedTypes());
    return points.filter(function(item){
      return currentSelectedTypes.has(item.type);
    });
  }

  var drawWithLoading = function(e){
    d3.select('#loading').classed('visible', true);
    if (e && e.type == 'viewreset') {
      d3.select('#overlay').remove();
    }
    setTimeout(function(){
      draw();
      d3.select('#loading').classed('visible', false);
    }, 0);
  }

  var draw = function() {
    d3.select('#overlay').remove();

    var bounds = map.getBounds(),
        topLeft = map.latLngToLayerPoint(bounds.getNorthWest()),
        bottomRight = map.latLngToLayerPoint(bounds.getSouthEast()),
        existing = d3.set(),
        drawLimit = bounds.pad(0.4);

    filteredPoints = pointsFilteredToSelectedTypes().filter(function(d) {
      var latlng = new L.LatLng(d.latitude, d.longitude);

      if (!drawLimit.contains(latlng)) { return false };

      var point = map.latLngToLayerPoint(latlng);

      key = point.toString();
      if (existing.has(key)) { return false };
      existing.add(key);

      d.x = point.x;
      d.y = point.y;
      return true;
    });

    voronoi(filteredPoints).forEach(function(d) { d.point.cell = d; });

    var svg = d3.select(map.getPanes().overlayPane).append("svg")
      .attr('id', 'overlay')
      .attr("class", "leaflet-zoom-hide")
      .style("width", map.getSize().x + 'px')
      .style("height", map.getSize().y + 'px')
      .style("margin-left", topLeft.x + "px")
      .style("margin-top", topLeft.y + "px");

    var g = svg.append("g")
      .attr("transform", "translate(" + (-topLeft.x) + "," + (-topLeft.y) + ")");

    var svgPoints = g.attr("class", "points")
      .selectAll("g")
        .data(filteredPoints)
      .enter().append("g")
        .attr("class", "point");

    var buildPathFromPoint = function(point) {
      return "M" + point.cell.join("L") + "Z";
    }

    svgPoints.append("path")
      .attr("class", "point-cell")
      .attr("d", buildPathFromPoint)
      .on('click', selectPoint)
      .classed("selected", function(d) { return lastSelectedPoint == d} );

    svgPoints.append("circle")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .style('fill', function(d) { return '#' + d.color } )
      .attr("r", 2);
  }

  var mapLayer = {
    onAdd: function(map) {
      map.on('viewreset moveend', drawWithLoading);
      drawWithLoading();
    }
  };

  showHide('#about');

  map.on('ready', function() {
    d3.csv(url, function(csv) {
      points = csv;
      points.forEach(function(point) {
        pointTypes.set(point.type, {type: point.type, color: point.color});
      })
      drawPointTypeSelection();
      map.addLayer(mapLayer);
    })
  });
} 
