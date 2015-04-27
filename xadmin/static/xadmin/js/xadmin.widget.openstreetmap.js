;(function($){
    /* !!! FORMAT difference:
     * coordinates: LAT LON
     * point: LON LAT
     */

    var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
    var toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection

    var defaultOpts = {
        zoom: 2,
        center: {lon:0, lat:0}
    };

    function str_to_lonlat(str) {
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

    function point_to_lonlat(str) {
        if (str.length > 0) {
            tmp = str.match(/\((.*)\)/);
            if (tmp[1]) {
                tmp = tmp[1].split(' ');
                return {lon: tmp[0], lat: tmp[1]}
            }
        }
        return false;
    }

    function point_to_str(point) {
        return 'SRID=4326;POINT (' + point.lon + ' ' + point.lat + ')';
    }

    function lonlat_to_str(lonlat) {
        return lonlat.lat + ':' + lonlat.lon;
    }

    function showPoints(map, vectors, point, show_in_map) {
        var zoom = map.getZoom();
        var bounds = map.getExtent();
        var ne = new OpenLayers.LonLat(bounds.right, bounds.top).transform(toProjection, fromProjection);
        var sw = new OpenLayers.LonLat(bounds.left, bounds.bottom).transform(toProjection, fromProjection);

        // TODO: remove. don't destroy each time
        vectors.destroyFeatures();
        $.each(show_in_map, function(i) {
            item = $(show_in_map[i]);
            if (zoom >= item.attr('zoom')) {
                var icon = item.attr('icon');
                $.ajax({
                    data: {'x1': ne.lon, 'y1': ne.lat, 'x2': sw.lon, 'y2': sw.lat},
                    type: 'GET',
                    url: item.attr('url'),
                    success: function(data) {
                        if (data) {
                            $.each(data, function(key, value) {
                                if (point && point.lat == value.lat && point.lon == value.lon) {
                                    // marker
                                } else {
                                    var feature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(value.lon, value.lat).transform(fromProjection, toProjection),
                                        {description: value.name} ,
                                        {externalGraphic: icon, graphicHeight: 25, graphicWidth: 21, graphicXOffset:-12, graphicYOffset:-25  });
                                    vectors.addFeatures(feature);
                                }
                            });
                        }
                    }
                });
            } else {
                //TODO: destroy
            }
        });
    }

    function changeFieldAttrs(map, field) {
        var center = map.getCenter();
        var centerTransf = new OpenLayers.LonLat(center.lon,center.lat).transform(toProjection,fromProjection);
        field.attr('zoom', map.getZoom())
        field.attr('center', lonlat_to_str(centerTransf));
    }

    function openMap(map_id) {
        return new OpenLayers.Map(map_id, {
            controls:
                [
                    new OpenLayers.Control.Navigation(),
                    new OpenLayers.Control.PanZoomBar(),
                    new OpenLayers.Control.ScaleLine(),
                ],
            // don't load default theme with js
            theme: ''
        });
    }

    $('.openstreetmap').each(function () {
        var field = $(this);
        var field_id = field.attr('id');
        var lonlat_field_id = 'lonlat_' + field_id;
        var map_id = 'map_for_' + field_id;
        var map, zoom;
        var center = false;
        var mark_center = true;

        $('<input id="' + lonlat_field_id + '" class="form-control" type="text" maxlength="40">' +
            '<div id="' + map_id + '" style="width:100%;height:350px;"></div>' +
            '<a id="handler_' + map_id + '" class="btn btn-primary map-handler"><i class="fa fa-search"> </i> ' + gettext('Enlarge') + '</a>').insertAfter(field);

        var lonlat_field = $('#'+lonlat_field_id);

        map = openMap(map_id);

        var markers = new OpenLayers.Layer.Markers('Markers');
        markers.id = 'Markers';

        if (field.val()) {
            center = point_to_lonlat(field.val());
        }

        if (center === false) {
            mark_center = false;
            if (field.attr('center')) {
                center = str_to_lonlat(field.attr('center'));
            }
        }

        if (center === false) {
            center = defaultOpts.center;
        }

        zoom = field.attr('zoom') ? field.attr('zoom') : defaultOpts.zoom;

        field.attr('center', lonlat_to_str(center));
        field.attr('zoom', zoom);

        var centerTransf = new OpenLayers.LonLat(center.lon, center.lat).transform(fromProjection, toProjection);

        map.addLayer(new OpenLayers.Layer.OSM());
        map.setCenter(centerTransf, zoom);
        map.addLayer(markers);

        if (mark_center) {
            markers.addMarker(new OpenLayers.Marker(centerTransf));
            lonlat_field.val(lonlat_to_str(center));
        }

        map.events.register("click", map, function(e) {
            var lonlat = this.getLonLatFromPixel(e.xy);
            var lonlatTransf = new OpenLayers.LonLat(lonlat.lon,lonlat.lat).transform(toProjection,fromProjection);
            var markerlayer = this.getLayer('Markers');

            if (markerlayer.markers.length > 0) {
                markerlayer.clearMarkers();
            }

            markerlayer.addMarker(new OpenLayers.Marker(lonlat));
            lonlat_field.val(lonlat_to_str(lonlatTransf));
            field.val(point_to_str(lonlatTransf));
        });

        map.events.register('moveend', map, function(e) {
            changeFieldAttrs(map, field);
        });

        lonlat_field.change(function () {
            var current = str_to_lonlat(lonlat_field.val());
            var markerlayer = map.getLayer('Markers');

            if (markerlayer.markers.length > 0) {
                markerlayer.clearMarkers();
            }

            if (current) {
                var bounds = map.calculateBounds(map.getCenter(), map.getResolution());
                var currentTransf = new OpenLayers.LonLat(current.lon, current.lat).transform(fromProjection, toProjection);

                if (!bounds.contains(currentTransf.lon, currentTransf.lat)) {
                    map.setCenter(currentTransf, map.getZoom());
                }
                markerlayer.addMarker(new OpenLayers.Marker(currentTransf));
                field.val(point_to_str(current));
            } else {
                field.val('');
            }
        });

    });

    $('.openstreetmap_view').each(function () {
        var field = $(this);
        var field_id = field.attr('id');
        var map_id = 'map_for_' + field_id;
        var url = $(this).attr('url');

        $('<div id="' + map_id + '" style="width:100%;height:350px;"></div>' +
            '<a id="handler_' + map_id + '" class="btn btn-primary map-handler"><i class="fa fa-search"> </i> ' + gettext('Enlarge') + '</a>').insertAfter($(this));

        var map = openMap(map_id);
        var vectors = new OpenLayers.Layer.Vector("Vectors");
        var markers = new OpenLayers.Layer.Markers('Markers');
        var center = point_to_lonlat(field.attr('point'));
        var centerTransf = new OpenLayers.LonLat(center.lon, center.lat).transform(fromProjection, toProjection);
        var zoom = field.attr('zoom') ? field.attr('zoom') : defaultOpts.zoom;
        var point = center;
        var show_in_map = field.children('input[type=hidden]');

        map.addLayer(new OpenLayers.Layer.OSM());
        map.addLayer(vectors);
        map.addLayer(markers);
        map.setCenter(centerTransf, zoom);
        markers.addMarker(new OpenLayers.Marker(centerTransf));

        function createPopup(feature) {
            feature.popup = new OpenLayers.Popup.FramedCloud("pop",
                feature.geometry.getBounds().getCenterLonLat(),
                null,
                '<div class="markerContent">'+feature.attributes.description+'</div>',
                null,
                true,
                function() { controls['selector'].unselectAll(); }
            );
            //feature.popup.closeOnMove = true;
            map.addPopup(feature.popup);
        }

        function destroyPopup(feature) {
            feature.popup.destroy();
            feature.popup = null;
        }

        var controls = {
          selector: new OpenLayers.Control.SelectFeature(vectors, { onSelect: createPopup, onUnselect: destroyPopup })
        };

        map.addControl(controls['selector']);
        controls['selector'].activate();

        showPoints(map, vectors, point, show_in_map);

        map.events.register('moveend', map, function(e) {
            changeFieldAttrs(map, field);
            showPoints(map, vectors, point, show_in_map);
        });

    });

    $(document).on('click', '.map-handler', function (e) {
        e.preventDefault();
        var modal = $('#map-modal-id');
        var map_id = $(this).attr('id').substr(8);
        var modal_map_id = 'modal_' + map_id;
        var field_id = map_id.substr(8);
        var field = $('#' + field_id);
        var zoom = field.attr('zoom');
        var center = str_to_lonlat(field.attr('center'));
        var centerTransf = new OpenLayers.LonLat(center.lon, center.lat).transform(fromProjection, toProjection);

        var is_readonly = field.prop('tagName') == 'INPUT' ? false : true;

        if (is_readonly) {
            var show_in_map = field.children('input[type=hidden]');
            var point = point_to_lonlat(field.attr('point'));
            var pointTransf = new OpenLayers.LonLat(point.lon, point.lat).transform(fromProjection, toProjection);
            var label = field.parent().parent().prev('.control-label').html();

            if(!modal.length){
              modal = $('<div id="map-modal-id" class="modal fade map-modal" role="dialog"><div class="modal-dialog"><div class="modal-content">'+
                '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h4 class="modal-title">'+
                label +'</h4></div><div class="modal-body"></div>'+
                '<div class="modal-footer"><button class="btn btn-default" data-dismiss="modal"> ' + gettext('Close') + '</button>'+
                '</div></div></div></div>');
              $('body').append(modal);
            } else {
                $('#map-modal-id .modal-title').html(label);
            }

            var map_h = $(window).height() - 300;
            var map_w = Math.floor($(window).width() * 0.95) - 48;
            modal.find('.modal-body').html('<div id="' + modal_map_id + '" style="width:' + map_w + 'px;height:' + map_h + 'px;"></div>'+
                '<script> $(window).resize(function() {$("#' + modal_map_id + '").css("width",Math.floor($(window).width() * 0.95) - 48);}); </script>');

            var map = openMap(modal_map_id);
            var vectors = new OpenLayers.Layer.Vector("Vectors");
            var markers = new OpenLayers.Layer.Markers('Markers');

            map.addLayer(new OpenLayers.Layer.OSM());
            map.addLayer(vectors);
            map.addLayer(markers);
            map.setCenter(centerTransf, zoom);
            markers.addMarker(new OpenLayers.Marker(pointTransf));

            function createPopup(feature) {
                feature.popup = new OpenLayers.Popup.FramedCloud("pop",
                    feature.geometry.getBounds().getCenterLonLat(),
                    null,
                    '<div class="markerContent">'+feature.attributes.description+'</div>',
                    null,
                    true,
                    function() { controls['selector'].unselectAll(); }
                );
                //feature.popup.closeOnMove = true;
                map.addPopup(feature.popup);
            }

            function destroyPopup(feature) {
                feature.popup.destroy();
                feature.popup = null;
            }

            var controls = {
              selector: new OpenLayers.Control.SelectFeature(vectors, { onSelect: createPopup, onUnselect: destroyPopup })
            };

            map.addControl(controls['selector']);
            controls['selector'].activate();

            showPoints(map, vectors, point, show_in_map);

            map.events.register('moveend', map, function(e) {
                showPoints(map, vectors, point, show_in_map);
            });

        } else {

            var lonlat_field = $('#lonlat_' + field_id);
            var tmp_field_id = 'tmp_' + field_id;
            var label = $('label[for="' + field_id + '"]').html();

            if(!modal.length){
              modal = $('<div id="map-modal-id" class="modal fade map-modal" role="dialog"><div class="modal-dialog"><div class="modal-content">'+
                '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h4 class="modal-title">'+
                label +'</h4></div><div class="modal-body"></div>'+
                '<div class="modal-footer"><button class="btn btn-default" data-dismiss="modal"> ' + gettext('Cancel') + '</button>'+
                '<button id="map_modal_choose" class="btn btn-primary"> ' + gettext('Choose') + '</button>'+
                '</div></div></div></div>');
              $('body').append(modal);
            } else {
                $('#map-modal-id .modal-title').html(label);
            }

            var map_h = $(window).height() - 300;
            var map_w = Math.floor($(window).width() * 0.95) - 48;
            modal.find('.modal-body').html('<input id="' + tmp_field_id + '" class="form-control" type="text" maxlength="40">' +
                '<div id="' + modal_map_id + '" style="width:' + map_w + 'px;height:' + map_h + 'px;"></div>' +
                '<script> $(window).resize(function() {$("#' + modal_map_id + '").css("width",Math.floor($(window).width() * 0.95) - 48);}); </script>');

            var tmp_field = $('#' + tmp_field_id);

            var map = openMap(modal_map_id);
            var markers = new OpenLayers.Layer.Markers('Markers');
            markers.id = 'Markers';

            map.addLayer(new OpenLayers.Layer.OSM());
            map.setCenter(centerTransf, zoom);
            map.addLayer(markers);

            if (field.val()) {
                tmp_field.val(lonlat_field.val());
                var marked = str_to_lonlat(tmp_field.val());
                var markedTransf = new OpenLayers.LonLat(marked.lon, marked.lat).transform(fromProjection, toProjection);
                markers.addMarker(new OpenLayers.Marker(markedTransf));
            }

            map.events.register("click", map, function(e) {
                var lonlat = this.getLonLatFromPixel(e.xy);
                var lonlatTransf = new OpenLayers.LonLat(lonlat.lon,lonlat.lat).transform(toProjection,fromProjection);
                var markerlayer = this.getLayer('Markers');

                if (markerlayer.markers.length > 0) {
                    markerlayer.clearMarkers();
                }

                markerlayer.addMarker(new OpenLayers.Marker(lonlat));
                tmp_field.val(lonlat_to_str(lonlatTransf));
            });

            $(document).on('change', tmp_field, function () {
                var current = str_to_lonlat(tmp_field.val());
                var markerlayer = map.getLayer('Markers');

                if (markerlayer.markers.length > 0) {
                    markerlayer.clearMarkers();
                }

                if (current) {
                    var bounds = map.calculateBounds(map.getCenter(), map.getResolution());
                    var currentTransf = new OpenLayers.LonLat(current.lon, current.lat).transform(fromProjection, toProjection);

                    if (!bounds.contains(currentTransf.lon, currentTransf.lat)) {
                        map.setCenter(currentTransf, map.getZoom());
                    }

                    markerlayer.addMarker(new OpenLayers.Marker(currentTransf));
                }
            });

            $(document).on('click', '#map_modal_choose', function(e){
                lonlat_field.val(tmp_field.val());
                lonlat_field.trigger("change");
                $('#map-modal-id').modal('hide');
            });
        }

        modal.modal();
    });

})(jQuery)
