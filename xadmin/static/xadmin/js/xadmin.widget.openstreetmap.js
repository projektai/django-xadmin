;(function($){

    var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
    var toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection

    var defaultOpts = {
        zoom   : 2,
        center : {lon:0, lat:0}
    };

    function to_lonlat(str) {
        tmp = str.split(':');
        if (tmp.length != 2)
            return false;
        if (!$.isNumeric(tmp[0]) || !$.isNumeric(tmp[1]))
            return false;
        var lat = parseFloat(tmp[0]);
        var lon = parseFloat(tmp[1]);
        if (Math.abs(lon) > 180 || Math.abs(lat) > 90)
            return false;
        return {lon: lon, lat: lat}
    }

    $('.openstreetmap').each(function () {
        var field_id = $(this).attr('id');
        var map_id = 'map_for_'+field_id;
        var map, zoom;
        var center = false;
        var mark_center = true;

        $( "<div id=\"" + map_id + "\" style=\"width:100%;height:350px;\"></div>" ).insertAfter($(this));

        map = new OpenLayers.Map(map_id, {
            controls:
                [
                    new OpenLayers.Control.Navigation(),
                    new OpenLayers.Control.PanZoomBar(),
                    new OpenLayers.Control.ScaleLine(),
                ],
            // don't load default theme with js
            theme: ''
        });

        var markers     = new OpenLayers.Layer.Markers('Markers');
        markers.id = 'Markers';

        if ($(this).val()) {
            center = to_lonlat($(this).val());
        }

        if (center === false) {
            mark_center = false;
            if ($(this).attr('center')) {
                center = to_lonlat($(this).attr('center'));
            }
        }

        if (center === false) {
            center = defaultOpts.center;
        }

        zoom = $(this).attr('zoom') ? $(this).attr('zoom') : defaultOpts.zoom;

        var cntrposition = new OpenLayers.LonLat(center.lon, center.lat).transform(fromProjection, toProjection);

        map.addLayer(new OpenLayers.Layer.OSM());
        map.setCenter(cntrposition, zoom);
        map.addLayer(markers);

        if (mark_center) {
            markers.addMarker(new OpenLayers.Marker(cntrposition));
        }

        map.events.register("click", map, function(e) {
            var field = $(e.currentTarget.parentElement).prev();
            var lonlat = this.getLonLatFromPixel(e.xy);
            var lonlatTransf = new OpenLayers.LonLat(lonlat.lon,lonlat.lat).transform(toProjection,fromProjection);
            var markerlayer = this.getLayer('Markers');

            if (markerlayer.markers.length > 0) {
                markerlayer.clearMarkers();
            }

            markerlayer.addMarker(new OpenLayers.Marker(lonlat));
            field.val(lonlatTransf.lat + ':' + lonlatTransf.lon);
        });

        $(this).change(function () {
            var center = to_lonlat($(this).val());
            var markerlayer = map.getLayer('Markers');

            if (markerlayer.markers.length > 0) {
                markerlayer.clearMarkers();
            }

            if (center) {
                var bounds = map.calculateBounds(map.getCenter(), map.getResolution());
                var lonlat = new OpenLayers.LonLat(center.lon, center.lat).transform(fromProjection, toProjection);

                if (!bounds.contains(lonlat.lon,lonlat.lat)) {
                    map.setCenter(lonlat, map.getZoom());
                }

                markerlayer.addMarker(new OpenLayers.Marker(lonlat));
            }
        });

    });

})(jQuery)
