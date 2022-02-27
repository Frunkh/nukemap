var _____WB$wombat$assign$function_____ = function(name) {return (self._wb_wombat && self._wb_wombat.local_init && self._wb_wombat.local_init(name)) || self[name]; };
if (!self.__WB_pmw) { self.__WB_pmw = function(obj) { this.__WB_source = obj; return this; } }
{
  let window = _____WB$wombat$assign$function_____("window");
  let self = _____WB$wombat$assign$function_____("self");
  let document = _____WB$wombat$assign$function_____("document");
  let location = _____WB$wombat$assign$function_____("location");
  let top = _____WB$wombat$assign$function_____("top");
  let parent = _____WB$wombat$assign$function_____("parent");
  let frames = _____WB$wombat$assign$function_____("frames");
  let opener = _____WB$wombat$assign$function_____("opener");

//just the UI stuff for NUKEMAP -- makes it more platform agnostic



//gets marker position
function getPosition(marker) {
	switch(MODE) {
		case GMAP:
			return marker.getPosition();
		break;
		case LLET:
			return marker.getLatLng();
		break;
	}		
}
function getLatLng(marker) {
	return getPosition(marker);
}

//sets marker position
function setPosition(marker,pos) {
	switch(MODE) {
			case GMAP: 
				marker.setPosition(pos); 
			break;
			case LLET:
				if(marker.options.autopan == true) {
					marker.options.autopan = false; var ap = true;
				}
				marker.setLatLng(pos); 
				if(ap) marker.options.autopan = true; 
			break;
	}
}
function setLatLng(marker,pos) {
	setPosition(marker,pos);
}

//gets lat
function lat(pos) {
	switch(MODE) {
		case GMAP: return pos.lat(); break;
		case LLET: return pos.lat; break;
	}
}
//gets lng
function lng(pos) {
	switch(MODE) {
		case GMAP: return pos.lng(); break;
		case LLET: return pos.lng; break;
	}
}
function lon(pos) {
	return lng(pos);
}
function latval(pos) {
	switch(MODE) {
		case GMAP: return pos.lat(); break;
		case LLET: return pos.lat; break;
	}
}
function lonval(pos) {
	switch(MODE) {
		case GMAP: return pos.lng(); break;
		case LLET: return pos.lng; break;
	}
}
function lngval(pos) {
	switch(MODE) {
		case GMAP: return pos.lng(); break;
		case LLET: return pos.lng; break;
	}
}

//removes an object -- note that you need to set the object to the result of this function to render it undefined
function remove(obj) {
	switch(MODE){
		case GMAP:
			obj.setMap(null);
		break;
		case LLET:
			obj.remove();
		break;
	}
	return undefined;
}
function setNull(obj) {
	return remove(obj);
}

//bounds object
function LatLngBounds() {
	switch(MODE) {
		case GMAP:
			return new google.maps.LatLngBounds();
		break;
		case LLET:
			return new L.LatLngBounds();
		break;
	}
}

//latlng object
function LatLng(lat,lng) {
	switch(MODE) {
		case GMAP:
			return new google.maps.LatLng(lat,lng);
		break;
		case LLET:
			return [lat,lng];
		break;
	}	
}

//set map center
function panTo(map,pos) {
	switch(MODE) {
		case GMAP:
			map.setCenter(pos);
		break;
		case LLET:
			map.panTo(pos);
		break;
	}
}
function setMapCenter(map,pos) {
	panTo(map,pos);
}
function panToLatLon(map,lat,lon) {
	switch(MODE) {
		case GMAP:
			map.setCenter(LatLng(lat, lon));
		break;
		case LLET:
			map.panTo(LatLng(lat, lon));
		break;
	}
}

//get bounds
function getBounds(obj) {
	switch(MODE) {
		case GMAP: case LLET: //works for both
			return obj.getBounds();	
		break;
	}
}

//fit bounds
function fitBounds(map,bounds) {
	switch(MODE) {
		case GMAP: case LLET: //works for both
			return map.fitBounds(bounds);	
		break;
	}
}

//get center of map
function getCenter(map) {
	switch(MODE) {
		case GMAP: case LLET: //works for both
			return map.getCenter();	
		break;
	}
}

//get zoom of map
function getZoom(map) {
	switch(MODE) {
		case GMAP: case LLET: //works for both
			return map.getZoom();	
		break;
	}
}

//set zoom of map
function setZoom(map,zoom) {
	switch(MODE) {
		case GMAP: case LLET: //works for both
			return map.setZoom(zoom);	
		break;
	}
}


//create a new circle
//uses Leaflet options (even if Google). make sure that the position is indicated for Leaflet.
function newCircle(options,bindMarker = undefined, position = undefined) {
	var circ;
	switch(MODE) {
		case GMAP:
			if(isset(options.color)) options.strokeColor = options.color;
			if(isset(options.weight)) options.strokeWeight = options.weight;
			if(isset(options.opacity)) options.strokeOpacity = options.opacity;
			if(isset(position)) options.center = position;
			circ = new google.maps.Circle(options);
			if(isset(bindMarker)) circ.bindTo('center',bindMarker,'position');
		break;
		case LLET:
			circ = new L.greatCircle(position,options);
			if(isset(options.map)) circ.addTo(options.map);
			if(isset(bindMarker)) {
				circ.bindTo(bindMarker);
			}
		break;
	}
	return circ;
}

//create a new marker

function newMarker(options) {
	switch(MODE) {
		case GMAP:
			if(isset(options.animation)) {
				if(options.animation == "drop") options.animation = google.maps.Animation.DROP;
			}
			var marker = new google.maps.Marker(options);
			return marker;
		break;
		case LLET:
			var marker = new L.marker(options.position,options);
			if(isset(options.map)) marker.addTo(options.map);
			if(isset(options.animation)) {
				if(options.animation == "drop") {
					//sort of a cobbled together "drop" animation
					var trans_to = $(marker._icon).css("transform");
					var trans_from = trans_to.substr(0,trans_to.lastIndexOf(","))+", 0)";
					var final_height = trans_to.substr(trans_to.lastIndexOf(",")+1,trans_to.length);
					final_height = parseInt(final_height.substr(0,final_height.length-1));
					$(marker._icon).css("top",-final_height);
					setTimeout(function() {
						$(marker._icon).animate({"top":0},"fast");
					},300);				
				}
			}
			return marker;
		break;
	}
}

function newIcon(options) {
	switch(MODE) {
		case LLET:
			return L.icon(options);
		break;
		case GMAP:
			var icon = {};
			icon.origin = new google.maps.Point(0,0);
			if(isset(options.iconUrl)) icon.url = options.iconUrl;
			if(isset(options.iconSize)) icon.scaledSize = new google.maps.Size(options.iconSize[0], options.iconSize[1]);
			if(isset(options.iconAnchor)) icon.anchor = new google.maps.point(options.iconAnchor[0], options.iconAnchor[1]);
			return icon;
		break;
	}
}

//events
function addListener(obj,event_name,func) {
	event_name = eventName(event_name);
	switch(MODE) {
		case GMAP:
			var obj_event = "_event_"+event_name;
			obj[obj_event] = google.maps.event.addListener(obj, event_name,func);
		break;
		case LLET:
			obj.on(event_name,func);
		break;
	}
}

function removeListener(obj,event_name) {
	event_name = eventName(event_name);
	switch(MODE) {
		case GMAP:
			var obj_event = "_event_"+event_name;
			if(isset(obj[obj_event])) {
				google.maps.event.removeListener(obj[obj_event]);
				obj[obj_event] = undefined;
			}
		break;
		case LLET:
			obj.off(event_name);
		break;
	}
}

//tells the map it is resized, forces a redraw
function triggerResize(map) {
	switch(MODE) {
		case GMAP: google.maps.event.trigger(map, "resize"); break;
		case LLET: map.invalidateSize(); map.fire("resize"); break;
	}
}


var gmapTollet = [
	["zoom_changed","zoom_end"],
];
function eventName(name) {
	switch(MODE) {
		case GMAP:
			for(var i in gmapTollet) {
				if(name == gmapTollet[i][1]) {
					return gmapTollet[i][0];
				}
			}
			return name;
		break;
		case LLET:
			for(var i in gmapTollet) {
				if(name == gmapTollet[i][0]) {
					return gmapTollet[i][1];
				}
			}
			return name;
		break;
	}
}


//just a quick undefined check
function isset(prop = undefined) {
	if(typeof prop !="undefined") {
		return true;
	} else {
		return false;
	}
}

}
/*
     FILE ARCHIVED ON 01:06:23 Feb 04, 2022 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 16:52:02 Feb 27, 2022.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 14384.075
  exclusion.robots: 0.091
  exclusion.robots.policy: 0.083
  RedisCDXSource: 149.58
  esindex: 0.019
  LoadShardBlock: 14206.749 (3)
  PetaboxLoader3.datanode: 14421.312 (5)
  CDXLines.iter: 17.432 (3)
  load_resource: 1073.652 (2)
  PetaboxLoader3.resolve: 571.082 (2)
*/