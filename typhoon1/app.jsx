import React from 'react';
import ReactDOM from 'react-dom';
import ol from 'openlayers';
import {IntlProvider} from 'react-intl';
import UI from 'pui-react-buttons';
import Icon from 'pui-react-iconography';
import enMessages from './node_modules/boundless-sdk/locale/en.js';
import InfoPopup from './node_modules/boundless-sdk/js/components/InfoPopup.jsx';
import Toolbar from './node_modules/boundless-sdk/js/components/Toolbar.jsx';
import App from './node_modules/boundless-sdk/js/components/App.js';
import FeatureTable from './node_modules/boundless-sdk/js/components/FeatureTable.jsx';
import QueryBuilder from './node_modules/boundless-sdk/js/components/QueryBuilder.jsx';
import Select from './node_modules/boundless-sdk/js/components/Select.jsx';

var defaultFill = new ol.style.Fill({
   color: 'rgba(255,255,255,0.4)'
 });
 var defaultStroke = new ol.style.Stroke({
   color: '#3399CC',
   width: 1.25
 });
 var defaultSelectionFill = new ol.style.Fill({
   color: 'rgba(255,255,0,0.4)'
 });
 var defaultSelectionStroke = new ol.style.Stroke({
   color: '#FFFF00',
   width: 1.25
 });


var textStyleCache_unisys_tracks_1956_217dec31unisys_tracks_1956_217dec31linestring = {}
var clusterStyleCache_unisys_tracks_1956_217dec31unisys_tracks_1956_217dec31linestring = {}
var style_unisys_tracks_1956_217dec31unisys_tracks_1956_217dec31linestring = function(feature, resolution) {

    var value = "";
    var style = [new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: "rgba(129,70,83,1.0)",
            lineDash: null,
            width: 0
        })
    })];
    var allStyles = [];

    allStyles.push.apply(allStyles, style);
    return allStyles;
};
var selectionStyle_unisys_tracks_1956_217dec31unisys_tracks_1956_217dec31linestring = function(feature, resolution) {

    var value = "";
    var style = [new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: "rgba(255, 204, 0, 1)",
            lineDash: null,
            width: 0
        })
    })]
    var allStyles = [];

    allStyles.push.apply(allStyles, style);
    return allStyles;
};
var baseLayers = [];
var baseLayersGroup = new ol.layer.Group({
    showContent: true,
    'type': 'base-group',
    'title': 'Base maps',
    layers: baseLayers
});
var overlayLayers = [];
var overlaysGroup = new ol.layer.Group({
    showContent: true,
    'title': 'Overlays',
    layers: overlayLayers
});
var lyr_unisys_tracks_1956_217dec31unisys_tracks_1956_217dec31linestring = new ol.layer.Vector({
    opacity: 1.0,
    source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        url: './data/lyr_unisys_tracks_1956_217dec31unisys_tracks_1956_217dec31linestring.json'
    }),

    style: style_unisys_tracks_1956_217dec31unisys_tracks_1956_217dec31linestring,
    selectedStyle: selectionStyle_unisys_tracks_1956_217dec31unisys_tracks_1956_217dec31linestring,
    title: "unisys_tracks_1956_2017dec31 UNISYS_tracks_1956_2017Dec31 LineString",
    id: "unisys_tracks_1956_2017dec3120180829213122103",
    filters: [],
    timeInfo: null,
    isSelectable: true,
    popupInfo: ""
});

lyr_unisys_tracks_1956_217dec31unisys_tracks_1956_217dec31linestring.setVisible(true);
var layersList = [lyr_unisys_tracks_1956_217dec31unisys_tracks_1956_217dec31linestring];
var legendData = {
    "unisys_tracks_1956_2017dec3120180829213122103": [{
        "href": "0_0.png",
        "title": ""
    }]
};
var view = new ol.View({
    maxZoom: 32,
    minZoom: 1,
    projection: 'EPSG:3857'
});
var originalExtent = [-2744366.062975, 369305.219810, 13897114.546673, 17849578.441158];

var map = new ol.Map({
  layers: layersList,
  view: view,
  controls: [new ol.control.Attribution()]
});



class BasicApp extends App {
  componentDidMount() {
    super.componentDidMount();
    
  }
  _toggle(el) {
    if (el.style.display === 'block') {
      el.style.display = 'none';
    } else {
      el.style.display = 'block';
    }
  }
  _toggleTable() {
    this._toggle(document.getElementById('table-panel'));
    this.refs.table.getWrappedInstance().setDimensionsOnState();
  }
  _toggleWFST() {
    this._toggle(document.getElementById('wfst'));
  }
  _toggleQuery() {
    this._toggle(document.getElementById('query-panel'));
  }
  _toggleEdit() {
    this._toggle(document.getElementById('edit-tool-panel'));
  }
  _toggleAboutPanel() {
    this._toggle(document.getElementById('about-panel'));
  }
  _toggleChartPanel(evt) {
    evt.preventDefault();
    this._toggle(document.getElementById('chart-panel'));
  }
  _navigationFunc() {
    ToolActions.activateTool(null, 'navigation');
  }
  render() {
    var options = [{text: 'Table', icon: 'list-alt', onClick: this._toggleTable.bind(this)},
{text: 'Query', icon: 'filter', onClick: this._toggleQuery.bind(this)},
{
                              jsx: React.createElement(Select, {toggleGroup: 'navigation', map:map})
                            }, {
                              text: 'Navigation',
                              icon: 'hand-paper-o',
                              onClick: this._navigationFunc.bind(this)
                            },
{exclude: true, jsx: React.createElement("a", {className:"navbar-brand", href:"#"}, "My Web App")}];
    return React.createElement("article", null,
      React.createElement(Toolbar, {options: options}
      ),
      React.createElement("div", {id: 'content'},
        React.createElement("div", {id: 'map', ref: 'map'}
          ,
React.createElement("div", {id: 'query-panel', className:'query-panel'},
                                          React.createElement(QueryBuilder, {map: map})
                                        ),
React.createElement("div", {id: 'popup', className: 'ol-popup'},
                                    React.createElement(InfoPopup, {map: map, hover: false})
                                  )
        )
        ,
 React.createElement("div", {id: 'table-panel', className: 'attributes-table'},
                                          React.createElement(FeatureTable, {offset: [20, 20], ref: 'table', resizeTo: 'table-panel', layer: lyr_unisys_tracks_1956_217dec31unisys_tracks_1956_217dec31linestring, pointZoom:16, map: map})
                                    ),
React.createElement("div",{id: "legend"},
                                React.createElement(QGISLegend, {map:map, legendBasePath:'./resources/legend/',showExpandedOnStartup:false, expandOnHover:true, legendData:legendData})
                            )
      )
    );
  }
}


ReactDOM.render(<IntlProvider locale='en' messages={enMessages}><BasicApp map={map} extent={originalExtent} useHistory={true}/></IntlProvider>, document.getElementById('main'));



