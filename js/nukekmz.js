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

function init_kmzmenu() {
    $("#kmzmenu_detlist").html(dets.length+ " detonation"+(dets.length==1?"":"s")+" to export");
}

function kmzadv_showhide() {
    if(document.getElementById("kmzmenu_adv").style.display != "block") {
        document.getElementById("kmzmenu_adv").style.display = "block";
        document.getElementById("kmzadv_showhide").innerHTML = "[&minus;]";
    } else {
        document.getElementById("kmzmenu_adv").style.display = "none";    
        document.getElementById("kmzadv_showhide").innerHTML = "[&plus;]";
    }
}

function exportKMZ() {
    if(dets.length<1) {
        alert("No detonation settings are detected, so they cannot yet be exported. Please click 'Detonate' and try again.");
        $("#kmzmenu").fadeOut(300);
        return false;
    }
    if(!($("#render_fireball_sphere").prop("checked") ||
         $("#render_rings").prop("checked") ||
         $("#render_cloud").prop("checked") ||
         $("#render_fallout").prop("checked") ||
         $("#render_animated_cloud").prop("checked")
         )) 
    {
        alert("You haven't selected anything to render.");
        return false;
    }
    var kmz_opt = {
        "render_fireball_sphere":$("#render_fireball_sphere").prop("checked")?1:0,
        "render_rings":$("#render_rings").prop("checked")?1:0,
        "render_cloud":$("#render_cloud").prop("checked")?1:0,
        "render_fallout":$("#render_fallout").prop("checked")?1:0,
        "render_animated_cloud":$("#render_animated_cloud").prop("checked")?1:0,
        "ring_mode":$("#ring_mode").val(), //0 = simple, 1 = donut, 2 = no fill, 3 = all fill
        "fallout_mode":$("#fallout_mode").val(), //0 = simple, 1 = donut (not supported currently), 2 = no fill, 3 = all fill
        "ring_altitude_mode":$("#ring_altitude_mode").val(), //0 = all rings rendered at same altitude over ground, 1 = all rings rendered in stacked altitude
        "ring_altitude_base":$("#ring_altitude_base").val(), //the base ring altitude (bottom-most ring if stacked)
        "ring_altitude_stack":$("#ring_altitude_stack").val(), //if ring_altitude_mode = 1, it is the distance over which each ring is stacked from the next below it -- in meters
        "ring_KMLaltitudeMode":$("#ring_KMLaltitudeMode").val(), //specific KML mode to use for altitude for rings
        "ring_fill_alpha":$("#ring_fill_alpha").val(), //alpha for ring fill
        "ring_line_width":$("#ring_line_width").val(), //width of lines used for rings (if they are used)
        "ring_line_alpha":$("#ring_line_alpha").val(), //alpha of lines for rings
        "fallout_fill_alpha":$("#fallout_fill_alpha").val(), //alpha for fill for fallout
        "fallout_line_alpha":$("#fallout_line_alpha").val(), //alpha of lines for fallout
        "fallout_line_width":$("#fallout_line_width").val(), //width of lines used for fallout (if they are used)
        "circle_steps":$("#circle_steps").val(), //global setting for circle fidelity
        "force_kml":$("#force_kml").prop("checked")?1:0,
        "remote_dae":$("#remote_dae").prop("checked")?1:0,
    }
    var kdets = [];
    for(i in dets) {
        var d = dets[i];
        switch(MODE) {
        	case GMAP: dposlat = d.pos.lat(); dposlng = d.pos.lng(); break;
        	case LLET: dposlat = d.pos.lat; dposlng = d.pos.lng; break;
        }
        kdets.push({
            airburst: d.airburst?1:0,
            hob: d.hob,
            hob_opt: d.hob_opt,
            hob_opt_psi: d.hob_opt_psi,
            fireball: d.fireball?1:0,
            psi: d.psi,
            rem: d.rem,
            therm: d.therm,
            fallout: d.fallout?1:0,
            fallout_wind: d.fallout_wind,
            ff: d.ff,
            fallout_angle: d.fallout_angle,
            fallout_rad_doses: d.fallout_rad_doses,
            kt: d.kt,
            lat: dposlat,
            lng: dposlng,            
        });
    }

    //add fields to form and then submit it
    $("#kmzForm").html("");
    for(i in kmz_opt) {
        addHidden("kmz_opt["+i+"]",kmz_opt[i])
    }
    for(x in kdets) {
        for(i in kdets[x]) {
            addHidden("dets["+x+"]["+i+"]",kdets[x][i]);
        }
    }
    $("#kmzForm").submit();
}

function addHidden (name, value) {
    var input = $("<input>").attr("type", "hidden").attr("name", name).val(value);
    $("#kmzForm").append($(input));
};


}
/*
     FILE ARCHIVED ON 01:06:24 Feb 04, 2022 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 16:51:47 Feb 27, 2022.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 100.68
  exclusion.robots: 0.224
  exclusion.robots.policy: 0.206
  RedisCDXSource: 1.022
  esindex: 0.029
  LoadShardBlock: 66.18 (3)
  PetaboxLoader3.datanode: 101.933 (5)
  CDXLines.iter: 18.448 (3)
  load_resource: 125.192 (2)
  PetaboxLoader3.resolve: 79.947 (2)
*/