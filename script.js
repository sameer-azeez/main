var map = L.map('map').setView([19.615, 37.216], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var drawControl = new L.Control.Draw({
  edit: { featureGroup: drawnItems },
  draw: { polyline: true, polygon: true, rectangle: true, circle: false, marker: true }
});
map.addControl(drawControl);

map.on(L.Draw.Event.CREATED, function (e) {
  drawnItems.addLayer(e.layer);
});

// استيراد Shapefile من ملف ZIP
var shpInput = document.getElementById('shpFile');
shpInput.addEventListener('change', function(e) {
  var file = e.target.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function(evt) {
    shp(evt.target.result).then(function(geojson) {
      var layer = L.geoJSON(geojson, {
        style: { color: '#006064', weight: 2, fillColor: '#80cbc4', fillOpacity: 0.3 },
        onEachFeature: function(feature, layer) {
          if (feature.properties && feature.properties.name) {
            layer.bindPopup(feature.properties.name);
          }
        }
      }).addTo(map);
      map.fitBounds(layer.getBounds());
    }).catch(function(err) {
      alert('خطأ في قراءة ملف Shapefile: ' + err);
    });
  };
  reader.readAsArrayBuffer(file);
});

// تصدير GeoJSON
function exportGeoJSON() {
  var features = [];
  drawnItems.eachLayer(function(layer) {
    if (layer instanceof L.Marker) {
      features.push({ type: 'Feature', properties: { type: 'Marker' }, geometry: { type: 'Point', coordinates: [layer.getLatLng().lng, layer.getLatLng().lat] } });
    } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
      var coords = layer.getLatLngs().map(function(latlng) { return [latlng.lng, latlng.lat]; });
      features.push({ type: 'Feature', properties: { type: 'Polyline' }, geometry: { type: 'LineString', coordinates: coords } });
    } else if (layer instanceof L.Polygon) {
      var coords = layer.getLatLngs()[0].map(function(latlng) { return [latlng.lng, latlng.lat]; });
      features.push({ type: 'Feature', properties: { type: 'Polygon' }, geometry: { type: 'Polygon', coordinates: [coords] } });
    }
  });
  var geojson = { type: 'FeatureCollection', features: features };
  downloadFile(JSON.stringify(geojson), 'data.geojson', 'application/json');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type: type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// تصدير Shapefile باستخدام shp-write
function exportShapefile() {
  var features = [];
  drawnItems.eachLayer(function(layer) {
    if (layer instanceof L.Marker) {
      features.push({ type: 'Feature', properties: { type: 'Marker' }, geometry: { type: 'Point', coordinates: [layer.getLatLng().lng, layer.getLatLng().lat] } });
    } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
      var coords = layer.getLatLngs().map(function(latlng) { return [latlng.lng, latlng.lat]; });
      features.push({ type: 'Feature', properties: { type: 'Polyline' }, geometry: { type: 'LineString', coordinates: coords } });
    } else if (layer instanceof L.Polygon) {
      var coords = layer.getLatLngs()[0].map(function(latlng) { return [latlng.lng, latlng.lat]; });
      features.push({ type: 'Feature', properties: { type: 'Polygon' }, geometry: { type: 'Polygon', coordinates: [coords] } });
    }
  });
  var geojson = { type: 'FeatureCollection', features: features };
  shpwrite.download(geojson, { folder: 'shapefile', types: { point: 'points', polygon: 'polygons', line: 'lines' } });
}
