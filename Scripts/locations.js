/// <reference path="../typings/mustache/mustache.d.ts"/>
/// <reference path="../typings/jquery/jquery.d.ts"/>
$(document).ready(function () {

    var target = $("#target");

    // Place read more
    target.on("click", ".place", function () {
        var $this = $(this);
        var titel = $this.attr("data-title");
        var geo = $this.attr("data-geo").split(",");
        var icon = $this.attr("data-icon");

        target.find(".place").removeClass("show");
        $this.addClass("show");

        $('html, body').animate({
            scrollTop: $this.offset().top
        }, 300);

        mapOptions.center = new google.maps.LatLng(geo[0], geo[1]);
        initializeMap($this.find(".map")[0], titel, icon);
    });

    // Google maps
    var initialLocation;
    var browserSupportFlag = new Boolean();

    function initializeMap(thisMap, titel, icon) {
        var map = new google.maps.Map(thisMap, mapOptions);

        var ctaLayer = new google.maps.KmlLayer({
            // Kvarterer.kmz is also in the assets folder
            url: 'https://dl.dropboxusercontent.com/u/14093460/Kvarterer.kmz',
            preserveViewport: true
        });
        ctaLayer.setMap(map);

        var image = "/content/images/" + icon + ".png";
        var marker = new google.maps.Marker({
            position: mapOptions.center,
            map: map,
            animation: google.maps.Animation.DROP,
            title: titel,
            icon: image
        });

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function (position) {

                var user = new google.maps.Marker({
                    position: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
                    map: map,
                    title: 'You are here'
                });
            });
        } else {
            console.log("Geolocation not available");/* geolocation IS NOT available */
        }
    }

    var mapOptions = {
        zoom: 15,
        center: new google.maps.LatLng(55.395558, 10.383385),
        disableDefaultUI: true,
        styles: [
          { "featureType": "all", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
          { "featureType": "landscape.man_made", "elementType": "geometry.stroke", "stylers": [{ "color": "#c7c7c7" }] },
          { "featureType": "landscape", "elementType": "geometry.fill", "stylers": [{ "visibility": "on" }, { "color": "#efe2d9" }] },
          { "featureType": "landscape.natural", "elementType": "geometry.fill", "stylers": [{ "visibility": "on" }, { "color": "#d2e1be" }] },
          { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] },
          { "featureType": "poi.business", "elementType": "all", "stylers": [{ "visibility": "off" }] },
          { "featureType": "poi.business", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
          { "featureType": "poi.medical", "elementType": "all", "stylers": [{ "visibility": "on" }] },
          { "featureType": "poi.medical", "elementType": "geometry.fill", "stylers": [{ "color": "#f2dccd" }] },
          { "featureType": "poi.medical", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
          { "featureType": "poi.park", "elementType": "all", "stylers": [{ "visibility": "on" }] },
          { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#2db15e" }] },
          { "featureType": "poi.sports_complex", "elementType": "all", "stylers": [{ "visibility": "on" }, { "color": "#2db05d" }] },
          { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "saturation": -100 }, { "lightness": 99 }, { "color": "#fbf9ec" }] },
          { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#fbf9ec" }, { "lightness": 54 }] },
          { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#767676" }] },
          { "featureType": "road", "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }] },
          { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#fbf9ec" }] },
          { "featureType": "road.highway", "elementType": "labels.icon", "stylers": [{ "visibility": "on" }] },
          { "featureType": "road.highway.controlled_access", "elementType": "geometry.fill", "stylers": [{ "color": "#e7e7e7" }] },
          { "featureType": "water", "elementType": "all", "stylers": [{ "saturation": 43 }, { "lightness": -11 }, { "hue": "#0088ff" }] },
          { "featureType": "water", "elementType": "geometry.stroke", "stylers": [{ "color": "#000" }] },
          { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#2ba47e" }] }
        ]
    };
});