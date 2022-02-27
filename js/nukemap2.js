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

/* 

TO DO:

- Places API conversion? 

*/
var dets = [];
var det_index = 0;
var legends = [];

var sample_marker;
var sample_drag_listener;

var marker_event_dragend;
var marker_event_zoomchanged;

var casualties_delayed = false;

var normal_style = [  {    "featureType": "poi.business",    "stylers": [      {        "visibility": "off"      }    ]  },  {    "featureType": "poi.park",    "elementType": "labels.text",    "stylers": [      {        "visibility": "off"      }    ]  }];

var allowhuge = false;

var default_det = {
	airburst: true,
	hob: 200,
	hob_opt: 1,
	hob_opt_psi: 5,
	fireball: true,
	psi: ["20","5"],
	rem: ["500"],
	therm: ["_3rd-100"],
	crater: false,
	casualties: false,
	humanitarian: false,	
	fallout: false,
	fallout_wind: 15,
	ff: 100,
	fallout_angle: 225,
	fallout_rad_doses: ["1","10","100","1000"],
	erw: false,
	linked: false,
	cep: false,
	cep_ft: 0,
	cloud: false,
};

var det_min = 0;

var map; 
var marker;
var logo;
var circle_stroke = 0;

var service;
var geocoder;
var clientLocation;

var c_radii = [];
var highlightcircle; 
var local = false; if(window.location.toString().substring(0,("https://web.archive.org/web/20220204010623/http://localhost").length)=="https://web.archive.org/web/20220204010623/http://localhost") local=true;
var debug = false;
var user_country;
var user_location;
var basepath = window.location.protocol+"//"+location.hostname+window.location.pathname;
var grayscale = false;

var admin = 0;

var pi = Math.PI;
var background_color = "e0e0e0";

var waitingforlink = false;

//This is apparently needed to make the iPad click jQuery events work
var ua = navigator.userAgent, click_event = (ua.match(/iPad/i)) ? "touchstart" : "click";

var hide_legend_hr;

function start() {

	$('#version').delay(1000).fadeIn('slow'); 

	$("#advanced-options-header").html($("#advanced-options-header").html()+"<span class='hider-arrow' id='hider-arrow' expanded='0'> &#9654;</span>");

	//hider arrows for sections
	$(document).on(click_event,'.hider-arrow',function() { 
		if($(this).attr("expanded") == "1") {
			$(this).html(" &#9654;");
			$(this).attr("expanded","0");
			if($(this).parent().parent().children("#collapsed-content").attr("id")) {
				$(this).parent().parent().children("#collapsed-content").slideUp();
			} else if($(this).parent().children("#collapsed-content")) {
				$(this).parent().children("#collapsed-content").slideUp();
			}
		} else {
			$(this).html(" &#9660;");
			$(this).attr("expanded","1");
			if($(this).parent().parent().children("#collapsed-content").attr("id")) {
				$(this).parent().parent().children("#collapsed-content").slideDown();
			} else if($(this).parent().children("#collapsed-content")) {
				$(this).parent().children("#collapsed-content").slideDown();
			}
		}
	})
	
	switch(MODE) {
		case GMAP:	
		$('#option_gray').bind(click_event, function () {
			toggle_grayscale($("#option_gray").prop("checked"));
		})
		break;
		case LLET: 
			$('#option_gray').hide();
			$('#option_gray_caption').hide();
		break;
	}
	
	//minimize interface
	$('#minimize_interface').bind(click_event, function () {
		$('#topFrame').hide();
		$('#bottomFrame').hide();
		$('#theSettings').addClass('settingsMin');
		$('#theMap').addClass('mapMax');
		$('#hiddenFrame').show();
		triggerResize(map);
		map_logo(0);
	})

	$(document).bind('webkitfullscreenchange mozfullscreenchange fullscreenchange', function() {
		var isFullScreen = document.fullScreen ||
			document.mozFullScreen ||
			document.webkitIsFullScreen;
		if (isFullScreen) {
			map_logo(false);
		} else {
			map_logo(true);
		}
	});
	
	$(document).on(click_event,"#logo",function () {
		$('#restore_interface').click();
	})
	
	//clickable abbreviations
	$(".def").on(click_event,function() {
		alert($(this).attr("title"));
	})
	
	//restore interface
	$('#restore_interface').bind(click_event, function () {
		$('#theMap').removeClass('mapMax');
		$('#theSettings').removeClass('settingsMin');
		$('#topFrame').show();
		$('#bottomFrame').show();
		$('#hiddenFrame').hide();
		triggerResize(map);
		map_logo(1);
	})
	
	//make the fallout go away on unclick -- otherwise it can be annoying and persistent
	$('.fallout_check').bind(click_event, function () {
		if($(this).prop("checked")==false) {
			clear_fallout();
			stop_fallout();
			if(dets[det_index]) dets[det_index].fallout = false;
			update_permalink();
		}
	})
	
	$('#casualties_check').bind(click_event, function () {
		if($(this).prop("checked")==false) {
			$("#theLegendCasualties").html("");
		}
	})
	
	$("#fallout_angle").on('change',function() {
		update_fallout();
	})
	$("#fallout_wind").on('change', function() {
		update_fallout();
	})
	$("#fallout_fission").on('change', function() {
		update_fallout();
	})
	
	$(document).on('mouseenter','.legendkey',function() { 
		if($(this).attr("radius")&&$(this).attr("index")) {
			if(highlightcircle) highlightcircle = remove(highlightcircle);
			highlightcircle = newCircle({
				map:map,
				radius: parseFloat($(this).attr("radius")),
				fill: false,
				fillOpacity: 0,
				stroke: true,
				color: "#ffffff",
				opacity: 1,
				weight: 4,
				zIndex: (det_index+1)*100
			},undefined,LatLng(latval(dets[parseInt($(this).attr("index"))].pos), lngval(dets[parseInt($(this).attr("index"))].pos)));			
		}
	 });

	$(document).on('mouseleave','.legendkey',function() { 
		if(highlightcircle) highlightcircle = remove(highlightcircle);
	 });
		
	//load from permalinks
	var u = getUrlVars();
	if(u!=window.location.href) {
		loadingDiv(true);
		if(typeof u["gl"] !="undefined") {
			if(u["gl"]==1) {
				MAPBOX_GL = true;
			} else {
				MAPBOX_GL = false;
			}
		}
		if(u["admin"]) admin = u["admin"];
		if(u["lite"]) applyLite(u["lite"]);
		if(u["unlimited"]) unlimited = u["unlimited"];
		if(u["load"]) {
			loadExternalDets(u["load"]);
			return;
		}
		if(u["t"]) {
			hash_request(u["t"]);
		} else {
			permalinks_to_det(u);
			if(dets.length) {
				init(dets[dets.length-1].pos,parseInt(u["zm"]));
				for(var i = 0; i<dets.length;i++) {
					launch(true,dets[i],i,true);
					if(i<dets.length-1) {
						detach(true);
					}
				}
				document.getElementById('theKt').value = dets[det_index].kt;
				if(casualties_delayed) { //only run casualties after last det has been added
					casualties_delayed = false;
					get_casualties_multi(dets,"theLegendCasualties");
				}
				loadingDiv(false);
			} else {
				init();
				loadingDiv(false);		
			}
		}
	} else {
		init();
	}
}

//uses css filters to toggle grayscale background
function toggle_grayscale(toggle) {
	var gray = [{ "stylers": [ { "visibility": "off" } ] },{ "featureType": "administrative", "stylers": [ { "visibility": "on" } ] },{ "featureType": "landscape", "stylers": [ { "visibility": "on" } ] },{ "featureType": "poi", "stylers": [ { "visibility": "on" } ] },{ "featureType": "road", "stylers": [ { "visibility": "on" } ] },{ "featureType": "water", "stylers": [ { "visibility": "on" } ] },{ "featureType": "transit", "stylers": [ { "visibility": "on" } ] },{"featureType":"all","elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#000000"},{"lightness":60}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":30},{"weight":1.2}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":0}]},{"featureType": "transit", "elementType": "labels", "stylers": [ { "visibility": "off" }]}];


	if(toggle) {
		map.setOptions({styles:gray});
		/*
		var gs = "grayscale(100%)";
		var ffgs =  "filter: url(\"data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\'><filter id=\'grayscale\'><feColorMatrix type=\'matrix\' values=\'0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0\'/></filter></svg>#grayscale\");"; //firefox
		insertRule(['.gm-style img'], '-webkit-filter:'+gs+';-moz-filter:'+gs+';-ms-filter:'+gs+';-o-filter:'+gs+';filter:'+gs+';'+ffgs+'filter: gray;');
		*/
		//filter: url(grayscale.svg);
		grayscale = true;
	} else {
		map.setOptions({styles:normal_style});

		/*var gs = "none";
		insertRule(['.gm-style img'], '-webkit-filter:'+gs+';-moz-filter:'+gs+';-ms-filter:'+gs+';-o-filter:'+gs+';filter:'+gs+';');
		*/
		grayscale = false;
	}
	//fixmarkercolor();
}

function insertRule (selector,rules,contxt) {
	var context=contxt||document,stylesheet;
	if(typeof context.styleSheets=='object') {
	  if(context.styleSheets.length) {
		stylesheet=context.styleSheets[context.styleSheets.length-1];
	  }
	  if(context.styleSheets.length) {
		if(context.createStyleSheet) {
		  stylesheet=context.createStyleSheet();
		} else {
		  context.getElementsByTagName('head')[0].appendChild(context.createElement('style'));
		  stylesheet=context.styleSheets[context.styleSheets.length-1];
		}
	  }
	  if(stylesheet.addRule) {
		for(var i=0;i<selector.length;++i) {
		  stylesheet.addRule(selector[i],rules);
		}
	  } else {
		stylesheet.insertRule(selector.join(',') + '{' + rules + '}', stylesheet.cssRules.length);  
	  }
	}
}

function launch(override_autozoom,params,d_index,delay_casualties = false) {
	var fireball = false;
	var crater = false;
	var casualties = false;
	var humanitarian = false;
	var humanitarian_show = false;
	var fallout = false;
	var collapser = false;
	var cep = false;
	var cep_ft = 0;
	var erw = false;
	var cloud = false;

	var c = [];
	var psi = [];
	var rem = [];
	var therm = [];

	var errs = [];

	if(!params) {

		ktInput = document.getElementById("theKt").value;

		if(ktInput=='') {
			if(document.getElementById("preset").value>0) {
				ktInput = document.getElementById("preset").value;
				document.getElementById("theKt").value = ktInput;
			}
		}

		if(ktInput=='') {
			$("#detonate_error").html("Please specify a <b>yield</b> above.")
			$("#detonate_error").slideDown(100).delay(2000).slideUp(100);
			$("#yield_div").fadeIn(100).fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
			return false;
		} 
	
		kt = parseFloat(ktInput);

		if(kt<=0) {
			$("#detonate_error").html("Please specify a <b>yield</b> above.")
			$("#detonate_error").slideDown(100).delay(2000).slideUp(100);
			$("#yield_div").fadeIn(100).fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
			return false;
		}
		$("#detonate_error").hide();
		
		pos = getPosition(marker);
	
		if(parseFloat(ktInput)>100000&&!allowhuge) {
			alert("The NUKEMAP effects models only scale up to 100,000 kt (100 megatons). Sorry!");
			return false;
		}

		var opt = document.forms["options"];

		var hob_ft = 0;
		if(opt["hob"][0].checked) {
			var airburst = true;
			if(opt["hob_option"][1].checked) {
				var hob_opt = 1;
				var hob_opt_psi = parseFloat(opt["hob_psi"].value);
				if(hob_opt_psi<1||hob_opt_psi>10000) {
					errs.push("Range of psi for choosing an optimum height is 1 to 10,000.");
					var hob_opt = 0;
				} else {
					hob_ft = Math.round(bc.opt_height_for_psi(kt,parseFloat(hob_opt_psi)));
				}
			} else if(opt["hob_option"][2].checked) {
				var hob_opt = 2;
				var hob_opt_psi = 5; //default
				switch(parseInt(opt["hob_h_u"].value)) {
					case 1: //m
						hob_ft = Math.round(parseFloat(opt["hob_h"].value)*m2ft);
					break;
					case 2: //mi
						hob_ft = Math.round(parseFloat(opt["hob_h"].value)*mi2ft);
					break;
					case 3: //km
						hob_ft = Math.round(parseFloat(opt["hob_h"].value)*km2ft);				
					break;
					default: //ft
						hob_ft = Math.round(parseFloat(opt["hob_h"].value));
					break;
				}
			} else {
				var hob_opt = 0;
			}
		} else {
			var airburst = false;
		}

		for(var i=0; i<opt["psi"].length;i++) {
			if(opt["psi"][i].checked) {
				if(opt["psi"][i].value>0) {
					psi.push(opt["psi"][i].value);
				} else if(opt["psi"][i].value<0) {
					var other = parseFloat(opt["psi_other_"+(parseInt(opt["psi"][i].value)*-1)].value);
					if((other>=1)&&(other<=10000)) {
						psi.push(parseFloat(other));
					} else {
						errs.push("Range for overpressure is 1-10,000 psi; entry of "+other+" skipped.");
					}
				}
			}
		}
		
		for(var i=0; i<opt["rem"].length;i++) {
			if(opt["rem"][i].checked) {
				if(opt["rem"][i].value>0) {
					rem.push(opt["rem"][i].value);
				} else if(opt["rem"][i].value < 0){
					var other = parseFloat(opt["rem_other_"+(parseInt(opt["rem"][i].value)*-1)].value);
					if(other>=1&&other<=Math.pow(10,8)) {
						rem.push(other);
					} else {
						errs.push("Range for initial nuclear radiation is 1-10^8 rem; entry of "+other+" skipped.");
					}
				}
			}
		}

		for(var i=0; i<opt["therm"].length;i++) {
			if(opt["therm"][i].checked) {
				if(opt["therm"][i].value>0||opt["therm"][i].value[0]=="_") {
					therm.push(opt["therm"][i].value);
				} else if (opt["therm"][i].value<0) {
					var other = parseFloat(opt["therm_other_"+(parseInt(opt["therm"][i].value)*-1)].value);
					if(other>0) {
						therm.push(other);
					}
				}
			}
		}
	
		if(opt["other"][0].checked) casualties = true;
		if(opt["other"][1].checked) fireball = true;
		if(opt["other"][2].checked) crater = true;
		if(opt["other"][3].checked) humanitarian = true;
		if(opt["other"][4].checked) humanitarian_show = true;
		if(opt["other"][5].checked) fallout = true;
		if(opt["other"][6].checked) cep = true;
		if(opt["other"][7].checked) cloud = true;	

		var fallout_wind = parseInt(document.getElementById("fallout_wind").value);
		if(fallout_wind<0) { //bind the wind speed to respectable options
			fallout_wind = 0;
			document.getElementById("fallout_wind").value = fallout_wind;
		} else if(fallout_wind>50) { 
			fallout_wind = 50;
			document.getElementById("fallout_wind").value = fallout_wind;
		}
	
		var ff = parseInt(document.getElementById("fallout_fission").value);
		if(ff<=0) {
			ff = 1;
			document.getElementById("fallout_fission").value = ff;
		} else if (ff>100) {
			ff = 100;
			document.getElementById("fallout_fission").value = ff;
		}

        if(document.getElementById("fallout_angle").value) {
            var fallout_angle = document.getElementById("fallout_angle").value;
        } else if(windsock_marker) {
			markerpos = getPosition(marker);
			windsockpos = getPosition(windsock_marker);
			var fallout_angle = fallout_bearing(markerpos,windsockpos);
        } else {
            var fallout_angle = null;
        }

		if(opt["collapser"]!=undefined) {
			if(opt["collapser"].checked) collapser = true;
		}

		dets[det_index] = {
			kt: kt,
			pos: pos,
			airburst: airburst,
			hob_opt: hob_opt,
			hob_psi: hob_opt_psi,
			hob_ft: hob_ft,
			fireball: fireball,
			crater: crater,
			casualties: casualties,
			humanitarian: humanitarian,
			fallout: fallout,
			fallout_wind: fallout_wind,
			ff: ff,
			fallout_angle: fallout_angle,
			erw: erw,
			psi: psi,
			rem: rem,
			therm: therm,
			cep: cep,
			cep_ft: cep_ft,
			cloud: cloud
		};

	} else {
		var opt = document.forms["options"];
		if(!params.pos) return false;
		det_index = d_index;
		if(params.kt) {
			kt = params.kt; document.getElementById("theKt").value = kt;
		}
		if(params.pos) { 
			pos = params.pos; 
			setPosition(marker,pos);
		}
		if(params.airburst!=undefined)	{
			airburst = params.airburst;
			if(airburst) { 
				opt["hob"][0].checked = true;
			} else {
				opt["hob"][1].checked = true;
			}
		}

		if(params.hob_opt!=undefined) {
			hob_opt = params.hob_opt;
			hob_opt_psi = params.hob_psi;
			hob_ft = params.hob_ft;
			opt["hob_option"][hob_opt].checked = true;
			if(hob_opt_psi) opt["hob_psi"].value = hob_opt_psi;
			if(hob_ft||params.hob_ft!=undefined) opt["hob_h"].value = hob_ft;
			if(!hob_ft&&hob_opt_psi&&hob_opt==1) {
				hob_ft = Math.round(bc.opt_height_for_psi(kt,parseFloat(hob_opt_psi)));
			}
		}

		if(params.fireball!=undefined) { 
			fireball = params.fireball;
			opt["other"][1].checked = fireball;
		}
		
		if(params.crater) { 
			crater = params.crater;
			opt["other"][2].checked = crater;
		}
		if(params.casualties) { 
			casualties = params.casualties;
			opt["other"][0].checked = casualties;
		}
		if(params.humanitarian) { 
			humanitarian = params.humanitarian;
			opt["other"][3].checked = humanitarian;
		}
		if(params.humanitarian_show) { 
			humanitarian = params.humanitarian_show;
			opt["other"][4].checked = humanitarian_show;
		}
		if(params.fallout) { 
			fallout = params.fallout;
			opt["other"][5].checked = fallout;
			document.getElementById("fallout_check_2").checked = opt["other"][5].checked;
		}
		if(params.cloud) {
			cloud = params.cloud;
			opt["other"][7].checked = cloud;
		}
		
		if(params.fallout_wind!=undefined) {
			fallout_wind = params.fallout_wind;
			document.getElementById("fallout_wind").value = fallout_wind;
		}

		if(params.ff) {
			ff = params.ff;
			document.getElementById("fallout_fission").value = ff;
		}	

		if(params.fallout_angle!==undefined) {
			fallout_angle = params.fallout_angle;
			document.getElementById("fallout_angle").value = fallout_angle;
		}
		
		if(params.fallout_rad_doses) {
			rad_doses = params.fallout_rad_doses;
		}
		
		if(params.cep) {
			cep = params.cep;
			opt["other"][6].checked = cep;
		}
		
		if(params.cep_ft) {
			cep_ft = params.cep_ft;
			opt["cep"].value = cep_ft;
		}
		
		if(params.erw) { 
			erw = params.erw;
			//opt["other"][7].checked = erw;
		}
		
		if(params.psi&&!isEmptyArray(params.psi)) { 
			psi = params.psi;
			document.getElementById("addrow_psi").innerHTML="";
			opt["psi_other_1"].value = "";
			document.getElementById("psi_other_check_1").checked = false;
			
			for(var i=0; i<opt["psi"].length;i++) {
				if(inArray(opt["psi"][i].value,psi)) {
					opt["psi"][i].checked = true;
				} else {
					opt["psi"][i].checked = false;
				}
			}
			for(var i=0;i<psi.length;i++) {
				switch(psi[i]){
					case "3000": case "200": case "20": case "5": case "1":
						//do nothing, these are already in the controls
					break;
					default:
						var p = 1;
						while(opt["psi_other_"+p].value) {
							addrow('psi');
							p++;
						}
						opt["psi_other_"+p].value = psi[i];
						document.getElementById("psi_other_check_"+p).checked = true;
					break;
				}
			}
		} else {
			for(var i=0; i<opt["psi"].length;i++) {
				opt["psi"][i].checked = false;
			}		
		}
		if(params.rem&&!isEmptyArray(params.rem)) { 

			rem = params.rem;
			document.getElementById("addrow_rem").innerHTML="";
			opt["rem_other_1"].value = "";
			document.getElementById("rem_other_check_1").checked = false;
			
			for(var i=0; i<opt["rem"].length;i++) {
				if(inArray(opt["rem"][i].value,rem)) {
					opt["rem"][i].checked = true;
				} else {
					opt["rem"][i].checked = false;
				}
			}
			for(var i=0;i<rem.length;i++) {
				switch(rem[i]){
					case "100": case "500": case "600": case "1000": case "5000":
						//do nothing, these are already in the controls
					break;
					default:
						var p = 1;
						while(opt["rem_other_"+p].value) {
							addrow('rem');
							p++;
						}
						opt["rem_other_"+p].value = rem[i];
						document.getElementById("rem_other_check_"+p).checked = true;
					break;
				}
			}
		} else {
			for(var i=0; i<opt["rem"].length;i++) {
				opt["rem"][i].checked = false;
			}		
		}
		if(params.therm&&!isEmptyArray(params.therm)) { 
			therm = params.therm;
			document.getElementById("addrow_therm").innerHTML="";
			opt["therm_other_1"].value = "";
			document.getElementById("therm_other_check_1").checked = false;
			
			for(var i=0; i<opt["therm"].length;i++) {
				if(inArray(opt["therm"][i].value,therm)) {
					opt["therm"][i].checked = true;
				} else {
					opt["therm"][i].checked = false;
				}
			}
			for(var i=0;i<therm.length;i++) {
				switch(therm[i]){
					case "_3rd-100": case "_3rd-50": case "_2nd-50": case "_1st-50": case "_noharm-100": case "35":
						//do nothing, these are already in the controls
					break;
					default:
						var p = 1;
						while(opt["therm_other_"+p].value) {
							addrow('therm');
							p++;
						}
						opt["therm_other_"+p].value = therm[i];
						document.getElementById("therm_other_check_"+p).checked = true;
					break;
				}
			}
		} else {
			for(var i=0; i<opt["therm"].length;i++) {
				opt["therm"][i].checked = false;
			}		
		}
	}
	if(typeof params !=="undefined") {
		if(params.nd==1) return;
	}

	pos_lat = latval(pos);
	pos_lng = lngval(pos);
	
	if(humanitarian) {
		get_places(pos_lat,pos_lng, bc.distance_from_scaled_range(bc.maximum_overpressure_range(10,airburst),kt)*mi2m,humanitarian_show,"theLegendPlaces"); 
	}
	
	if(casualties) {
		if(delay_casualties) {
			casualties_delayed = true;
		} else {
			get_casualties_multi(dets,"theLegendCasualties");
		}
	} else {
		$("#theLegendCasualties").html("");
	}
	
	if(fallout) {
		if(hob_ft&&airburst) {
			do_fallout(kt,fallout_wind,ff,fallout_angle,"theLegendFallout",airburst,hob_ft);
		} else {
			do_fallout(kt,fallout_wind,ff,fallout_angle,"theLegendFallout",airburst);		
		}
	}

	if(cep==true) {
		switch(parseInt(opt["cep_unit"].value)) {
			case 1: //m
				cep_ft = Math.round(parseFloat(opt["cep"].value)*m2ft);
			break;
			case 2: //mi
				cep_ft = Math.round(parseFloat(opt["cep"].value)*mi2ft);
			break;
			case 3: //km
				cep_ft = Math.round(parseFloat(opt["cep"].value)*km2ft);				
			break;
			default: //ft
				cep_ft = Math.round(parseFloat(opt["cep"].value));
			break;
		}
		if(cep_ft>0) {
			c.push([cep_ft*ft2mi,"cep",50]);
			c.push([cep_ft*2*ft2mi,"cep",43]);
			c.push([cep_ft*3*ft2mi,"cep",7]);			
		} else {
			errs.push("The Circular Error Probable given is an invalid value. CEP must be greater than zero to display.");	
		}
	}

	if(c_radii[det_index]) {
		for(var i=0;i<c_radii[det_index].length;i++) {
			c_radii[det_index][i] = remove(c_radii[det_index][i]);
		}
		c_radii[det_index] = [];
	}

	for(var i=0;i<psi.length;i++) {
		if(airburst==true) {
			if(!hob_opt) {
				var t = bc.psi_distance(kt,psi[i],airburst);
			} else {
				var t = bc.range_from_psi_hob(kt,psi[i],hob_ft)*ft2mi;
			}
		} else {
			var t = bc.range_from_psi_hob(kt,psi[i],0)*ft2mi;
			//var t = bc.psi_distance(kt,psi[i],airburst);
		}
		if(t>0) {
			c.push([t,"psi",psi[i]]);	
		} else {
			var err = "The blast pressure equation for "+psi[i]+" psi failed to give a result for the given yield and height settings.";
			if(hob_ft&&airburst&&hob_opt) {
				err+=" The maximum detonation height for this effect to be felt on the ground is "+distance(bc.max_height_for_psi(kt,psi[i])*ft2km)+".";
			}
			errs.push(err);
		}
	}

	for(var i=0;i<rem.length;i++) {
		if(erw) {
			var r_kt = kt*10;
		} else {
			var r_kt = kt;
		}
		var t = bc.initial_nuclear_radiation_distance(r_kt,rem[i]);
		var t1 = t;
		if(hob_ft&&airburst) {
			t = bc.ground_range_from_slant_range(t,hob_ft*ft2mi);
		}
		if(t>0) {
			c.push([t,"rem",rem[i]]);
		} else {
			var err = "The initial nuclear radiation equation for "+rem[i]+" rem failed to give a result for the given yield and height settings.";
			if(hob_ft&&airburst) {
				if(hob_ft*ft2mi > t1) {
					err+=" The maximum detonation height for this effect to be felt on the ground is "+distance(t1*mi2km)+".";
				}
			}
			errs.push(err);
		}
	}

	for(var i=0;i<therm.length;i++) {		
		var t = bc.thermal_distance(kt,therm[i],airburst);
		var t1 = t;
		if(hob_ft&&airburst) {
			t = bc.ground_range_from_slant_range(t,hob_ft*ft2mi);
		}
		if(t>0) {
			c.push([t,"therm",therm[i]]);
		} else {
			if(therm[i][0]=="_") {
				switch(therm[i]) {
				case "_3rd-100":
					var t_text = "3rd degree burns";
				break;
				case "_3rd-50":
					var t_text = "3rd degree burns (50%)";
				break;
				case "_2nd-50":
					var t_text = "2nd degree burns (50%)";
				break;
				case "_1st-50":
					var t_text = "1st degree burns (50%)";
				break;
				case "_noharm-100":
					var t_text = "no harm";
				break;	
				}
				var err = "Thermal radiation ("+t_text+") equation failed to give a result for the given yield and height."
				if(hob_ft&&airburst) {
					if(hob_ft*ft2mi > t1) {
						err+=" The maximum detonation height for this effect to be felt on the ground is "+distance(t1*mi2km)+".";
					}
				}
				errs.push(err);				
			} else {
				var err = "Thermal radiation ("+therm[i]+" cal/cm&sup2;) equation failed to give a result for the given yield and height.";
				if(hob_ft&&airburst) {
					if(hob_ft*ft2mi > t1) {
						err+=" The maximum detonation height for this effect to be felt on the ground is "+distance(t1*mi2km)+".";
					}
				}
				errs.push(err);							
			}
		}
	}
	
	if(fireball) {
		var t = bc.fireball_radius(kt,airburst);
		if(t>0) {
			c.push([t,"fireball",""]);
		} else {
			errs.push("The fireball size equation failed to give a result for the given yield.");				
		}
	}

	var cr = bc.crater(kt,true);
	if(crater) {
		if((cr[0]>0)&&(cr[1]>0)) {
			c.push([cr[0],"crater_lip",""]);
			c.push([cr[1],"crater_apparent",""]);
		} else {
			errs.push("The crater size equation failed to give a result for the given yield.");
		}
	}

	if(collapser) {
		if($('.hider-arrow').attr("expanded") == "1") {
			$('.hider-arrow').click();
		}
	}

	var legend ="";
	if(!hide_legend_hr) legend = "<hr>";
	legend+= "<b>Effect distances for a "+ ktOrMt(kt,false,true) + " "+(airburst?"airburst*":"surface burst")+"</b>:";
	legend+= "<span class='hider-arrow' expanded='1'> &#9660;</span>"
	legend+= "<div id='collapsed-content'>";

 	c.sort(function(a,b){return b[0]-a[0]});

	legend1 = ""; //this is a separate variable because we are going to be adding to it from the bottom up

	c_radii[det_index] = [];

	var circs=0;
	for(rec in c) {
		switch (c[rec][1]) {		
			case "therm":
				switch(c[rec][2]) {
					case "_3rd-100":
						var t_text = "3rd degree burns";
						var t_extra = "100% probability for 3rd degree burns at this yield is "+Math.round(bc.thermal_radiation_param_q(kt,c[rec][2]),1)+" cal/cm<sup>2</sup>.";
						var caption = "Third degree burns extend throughout the layers of skin, and are often painless because they destroy the pain nerves. They can cause severe scarring or disablement, and can require amputation.";
					break;
					case "_3rd-50":
						var t_text = "3rd degree burns (50%)";
						var t_extra = "50% probability for 3rd degree burns at this yield is "+Math.round(bc.thermal_radiation_param_q(kt,c[rec][2]),1)+" cal/cm<sup>2</sup>.";				
						var caption = "Third degree burns extend throughout the layers of skin, and are often painless because they destroy the pain nerves. They can cause severe scarring or disablement, and can require amputation.";

					break;
					case "_2nd-50":
						var t_text = "2nd degree burns (50%)";
						var t_extra = "50% probability for 2nd degree burns at this yield is "+Math.round(bc.thermal_radiation_param_q(kt,c[rec][2]),1)+" cal/cm<sup>2</sup>.";				
						var caption = "Second degree burns are deeper burns to several layers of the skin. They are very painful and require several weeks to heal. Extreme second degree burns can produce scarring or require grafting.";
					break;
					case "_1st-50":
						var t_text = "1st degree burns (50%)";
						var t_extra = "50% probability for 1st degree burns at this yield is "+Math.round(bc.thermal_radiation_param_q(kt,c[rec][2]),1)+" cal/cm<sup>2</sup>.";				
						var caption = "First degree burns are superficial burns to the outer layers of the skin. They are painful but heal in 5-10 days. They are more or less the same thing as a sunburn.";
					break;
					case "_noharm-100":
						var t_text = "no harm";
						var t_extra = "100% probability of no significant thermal damage at this yield is "+Math.round(bc.thermal_radiation_param_q(kt,c[rec][2]),1)+" cal/cm<sup>2</sup>.";				
						var caption = "The distance at which anybody beyond would definitely suffer no damage from thermal radiation (heat).";
					break;	
					default:
						var t_text = "";
						var t_extra = "";
						var caption = "";
					break;	
				}
				if(t_text) {
					legend1 = "<p><div class='legendkey' index='"+det_index+"' radius='"+(c[rec][0]*mi2m)+"' style='background-color: #"+blend_colors("FFA500",background_color,.3)+"; border: 1px solid #FFA500;'></div> Thermal radiation radius ("+t_text+"): "+distance(c[rec][0]*mi2km,true)+"<br><small class='caption'>"+caption+" "+t_extra+"</small>"+legend1;
				} else {
					legend1 = "<p><div class='legendkey' index='"+det_index+"' radius='"+(c[rec][0]*mi2m)+"' style='background-color: #"+blend_colors("FFA500",background_color,.3)+"; border: 1px solid #FFA500;'></div> Thermal radiation radius ("+c[rec][2]+" cal/cm<sup>2</sup>): "+distance(c[rec][0]*mi2km,true)+(caption?"<br><small class='caption'>"+caption+"</small>":"")+legend1;
				}
	
				c_radii[det_index][circs] = newCircle({
					map: map,
					radius:  c[rec][0]*mi2m,
					fill: true,
					fillColor: "#FFA500",
					fillOpacity: .3,
					stroke: true,
					color: "#FFA500",
					opacity: 1,
					weight: 1,
					zIndex: (circs+1)+(det_index+1)*10,
					title: (t_text?"Thermal radiation radius ("+t_text+")":"Thermal radiation radius ("+c[rec][2]+" cal/cm<sup>2</sup>)"),		
				},marker,pos);

			break;

			case "psi":
				var p = parseInt(c[rec][2]);

				c_radii[det_index][circs] = newCircle({
					map: map,
					radius:  c[rec][0]*mi2m,
					fill: true,
					fillColor: "#"+colorStep(p-5,20,"808080","FF0000","800000","800000"),
					fillOpacity: p>=5?.3:lerp(.3,5,.2,1,p),
					stroke: true,
					color: "#"+colorStep(p-5,20,"808080","FF0000","800000","800000"),
					opacity: p>=5?1:lerp(1,5,.5,1,p),
					weight: p<5?1:2,
					zIndex: (circs+1)+(det_index+1)*10,
					title: "Air blast radius ("+addCommas(p)+" psi)",
				},marker,pos);

				switch(true) {
					case (p == 10000):  
						var caption = "10,000 psi is approximately the pressure felt at 4 miles under the ocean. Not much can withstand this.";
					break;
					case (p == 7000):
						var caption = "7,000 psi is supposedly the maximum amount of pressure that super-hardened American missile silos can withstand.";
					break;
					case (p<10000&&p>1000):
						var caption = "Missile silos can be blast hardened to survive many thousand psi of pressure, but not much else can.";
					break;
					case (p == 200):
						var caption = "200 psi is approximately the pressure felt inside of a steam boiler on a locomotive. Extreme damage to all civilian structures, some damage to even &quot;hardened&quot; structures.";
					break;
					case (p == 20):
						var caption = "At 20 psi overpressure, heavily built concrete buildings are severely damaged or demolished; fatalities approach 100%. Often used as a benchmark for <b>heavy</b> damage in cities.";
					break;
					case (p < 20 && p > 5):
						var caption = "Between moderate and heavy damage in cities.";
					break;
					case (p == 5):
						var caption = "At 5 psi overpressure, most residential buildings collapse, injuries are universal, fatalities are widespread. The chances of a fire starting in commercial and residential damage are high, and buildings so damaged are at high risk of spreading fire. Often used as a benchmark for <b>moderate</b> damage in cities.";
					break;
					case (p < 5 && p > 1):
						var caption = "Between light and moderate damage in cities. Buildings damaged with between 2 and 5 psi of blast are considered a major risk for fire spread (because they are damaged but still standing).";
					break;
					case (p == 1):
						var caption = "At a around 1 psi overpressure, glass windows can be expected to break. This can cause many injuries in a surrounding population who comes to a window after seeing the flash of a nuclear explosion (which travels faster than the pressure wave). Often used as a benchmark for <b>light</b> damage in cities.";
					break;
					default:
						var caption = "";
					break;				
				}
				if(airburst) {
					caption+=" Optimal height of burst to maximize this effect is "+distance(bc.opt_height_for_psi(kt,c[rec][2])*ft2km)+".";
				}
				var legend2 = "<p><div class='legendkey' index='"+det_index+"' radius='"+(c[rec][0]*mi2m)+"' style='background-color: #"+blend_colors(colorStep(c[rec][2]-5,20,"808080","FF8080","800000","800000"),background_color,.3)+"; border: 1px solid #808080;'></div> ";
				switch(p) {
					case 20: legend2+="Heavy blast damage radius (20 psi):"; break;
					case 5: legend2+="Moderate blast damage radius (5 psi):"; break;
					case 1: legend2+="Light blast damage radius (1 psi):"; break;
					default: legend2+= "Air blast radius ("+addCommas(c[rec][2])+" psi):";
				}
				legend1 = legend2+" "+distance(c[rec][0]*mi2km,true)+(caption?"<br><small class='caption'>"+caption+"</small>":"")+legend1;
			break;
			
			case "rem":
				c_radii[det_index][circs] = newCircle({
					map: map,
					radius:  c[rec][0]*mi2m,
					fill: true,
					fillColor: "#00FF00",
					fillOpacity: .3,
					stroke: true,
					color: "#00FF00",
					opacity: 1,
					weight: 1,
					zIndex: (circs+1)+(det_index+1)*10,
					title: "Radiation radius ("+(c[rec][2])+" rem)",
				},marker,pos);


				//linear fit to NAPB-90 data, table B-2, which is just LNT. cancer risk.
				var c_risk =0.0303*(c[rec][2])-0.2065;
				if(c_risk<1) {
					c_risk = "less than 1%";
				} else if(c_risk>100) {
					c_risk = "100%";
				} else {
					c_risk = Math.round(c_risk)+"%";
				}

				//incapacitation and death info comes from Jorma K. Miettinen, "Enhanced Radiation Warfare," BAS 33, no. 7 (1977), 32-37.
				var caption = addCommas(c[rec][2])+" rem ionizing radiation dose; ";
				if(c[rec][2]>=17000) {
					caption+="fatal, incapacitating within five minutes, death within one day."; //no need to talk about survivors		
				} else if(c[rec][2]>=7000) {
					caption+="fatal, incapacitating within five minutes, death within one to two days."; //no need to talk about survivors		
				} else if (c[rec][2]>=1000) {
					caption+="fatal, incapacitating within five minutes with recovery period, death within four to six days."; //no need to talk about survivors		
				} else if (c[rec][2]>=1000) {
					caption+="fatal, in two weeks or less."; //no need to talk about survivors
				} else if(c[rec][2]>=500) {
					caption+="likely fatal, in about 1 month; "+c_risk+" of survivors will eventually die of cancer as a result of exposure.";
				} else if(c[rec][2]>=250) {
					caption+="sickness inducing, medical care would be required, some deaths in 30-60 days; "+c_risk+" of survivors will eventually die of cancer as a result of exposure.";
				} else if(c[rec][2]>=100) {
					caption+="sickness inducing, less than 5% chance of death in 60 days; "+c_risk+" of survivors will die of cancer as a result of exposure.";
				} else if(c[rec][2]>0) {
					caption+="no immediate symptoms; "+c_risk+" of survivors will die of cancer as a result of exposure.";
				}
	
				legend1 = "<p><div class='legendkey' index='"+det_index+"' radius='"+(c[rec][0]*mi2m)+"' style='background-color: #"+blend_colors("00ff00",background_color,.3)+"; border: 1px solid #00FF00;'></div> Radiation radius ("+(c[rec][2])+" rem): "+distance(c[rec][0]*mi2km,true)+(caption?"<br><small class='caption'>"+caption+"</small>":"")+legend1;
			break;
			
			case "fireball":
				c_radii[det_index][circs] = newCircle({
					map: map,
					radius:  c[rec][0]*mi2m,
					fill: true,
					fillColor: "#FFA500",
					fillOpacity: airburst?.3:.5,
					stroke: true,
					color: "#FFFF00",
					opacity: airburst?.8:1,
					weight: airburst?1:2,
					zIndex: (circs+1)+(det_index+1)*10,
					title: "Fireball radius",
				},marker,pos);

				var caption = "Maximum size of the nuclear fireball; relevance to damage on the ground depends on the height of detonation. If it touches the ground, the amount of radioactive fallout is significantly increased. Anything inside the fireball is effectively vaporized. ";
				if(airburst) caption+=" Minimum burst height for negligible fallout: "+distance(bc.minimum_height_for_negligible_fallout(kt)*mi2km)+".";
				legend1 = "<p><div class='legendkey' index='"+det_index+"' radius='"+(c[rec][0]*mi2m)+"' style='background-color: #"+blend_colors("FFA500",background_color,.3)+"; border: 1px solid #FFFF00;'></div> Fireball radius: "+distance(c[rec][0]*mi2km,true) + "<br><small class='caption'>"+caption+"</small>"+legend1;
			break;

			case "crater_lip":
				c_radii[det_index][circs] = newCircle({
					map: map,
					radius:  c[rec][0]*mi2m,
					fill: true,
					fillColor: "#2E2E2E",
					fillOpacity: .5,
					stroke: true,
					color: "#2E2E2E",
					opacity: 1,
					weight: 1,
					zIndex: (circs+1)+(det_index+1)*10,
					title: "Crater lip radius",
				},marker,pos);
			    legend1 = "<p><div class='legendkey' index='"+det_index+"' radius='"+(c[rec][0]*mi2m)+"' style='background-color: #"+blend_colors("2e2e2e",background_color,.8)+"; border: 1px solid #2E2E2E;'></div> Crater lip radius: "+distance(c[rec][0]*mi2km,true) + legend1;
			break;

			case "crater_apparent":
				c_radii[det_index][circs] = newCircle({
					map: map, 
					radius:  c[rec][0]*mi2m,
					fill: true,
					fillColor: "#2E2E2E",
					fillOpacity: .5,
					stroke: true,
					color: "#2E2E2E",
					opacity: 1,
					weight: 1,
					zIndex: (circs+1)+(det_index+1)*10,
					title: "Crater inner radius",
				},marker,pos);
			    legend1 = "<p>"+"<a href='images/craterdiagram.png' title='Open the crater diagram image in a new window' target='_blank'><img src='images/craterdiagram.png' width='200' style='float:right;'></a>"+"<div class='legendkey' index='"+det_index+"' radius='"+(c[rec][0]*mi2m)+"' style='background-color: #"+blend_colors("2e2e2e",background_color,.5)+"; border: 1px solid #2E2E2E;'></div> Crater inside radius: "+distance(c[rec][0]*mi2km,true) +"<p><div class='legendkey' style='padding-left: 1px; padding-right: 1px;text-align: center; display: inline-block;'>&darr;</div> Crater depth: "+  distance(cr[2]*5280*ft2km,false) + legend1;
			break;
			
			case "cep":
				c_radii[det_index][circs] = newCircle({
					map: map,
					radius:  c[rec][0]*mi2m,
					fill: false,
					fillColor: "#0000FF",
					fillOpacity: 0,
					stroke: true,
					color: "#"+colorStep(c[rec][0],50,"8080FF","0000FF"),
					opacity: .8,
					weight: 1,
					zIndex: (circs+1)+(det_index+1)*10,
					title: "Circular Error Probable ("+c[rec][2]+"%)",
				},marker,pos);
				var caption ="The radius (based on the user-defined CEP of "+distance(cep_ft*ft2km,false)+") where the bomb or warhead has a "+c[rec][2]+"% chance of landing.";
				legend1 = "<p><div class='legendkey' index='"+det_index+"' radius='"+(c[rec][0]*mi2m)+"' style='background-color: #"+background_color+"; border: 1px solid #"+colorStep(c[rec][0],50,"8080FF","0000FF")+";'></div> Circular Error Probable ("+c[rec][2]+"%): "+distance(c[rec][0]*mi2km,true) + "<br><small class='caption'>"+caption+"</small>"+legend1;			
			break;
			
		};
		circs++;
	};
		
	var big_bounds = LatLngBounds();
	
	if(c_radii[det_index].length) {	
		big_bounds = getBounds(c_radii[det_index][0]);	
		if((document.getElementById("option_autozoom").checked == true) && (override_autozoom != true)) fitBounds(map, big_bounds);
	}

	if(cloud) {
		//all of these are in FEET
		var cloud_final_horizontal_semiaxis   = bc.cloud_final_horizontal_semiaxis(kt); 
		var cloud_final_height = bc.cloud_top(kt);
		var cloud_final_vertical_semiaxis = (cloud_final_height-bc.cloud_bottom(kt))/2;

		top_altitude = cloud_final_height;
		head_diameter = cloud_final_horizontal_semiaxis*2;
		head_height = cloud_final_vertical_semiaxis*2;
		var legend2="";
		legend2+= "<p>"+"<a href='images/clouddiagram.png' title='Open the cloud diagram image in a new window' target='_blank'><img src='images/clouddiagram.png' width='200' style='float:right;'></a>";
		legend2+= "<div class='legendkey' style='padding-left: 1px; padding-right: 1px;text-align: center; display: inline-block;'>&uarr;</div> ";
		legend2+= "Mushroom cloud altitude: "+distance(top_altitude*ft2km,false);
		legend2+= "<p><div class='legendkey' style='padding-left: 1px; padding-right: 1px;text-align: center; display: inline-block;'>&harr;</div> ";
		legend2+= "Mushroom cloud head diameter: "+  distance(head_diameter*ft2km,false);
		legend2+= "<p><div class='legendkey' style='padding-left: 1px; padding-right: 1px;text-align: center; display: inline-block;'>&varr;</div> ";
		legend2+= "Mushroom cloud head height: "+  distance(head_height*ft2km,false);
		legend2+= "<br clear='both'>";
		legend1=legend1+legend2;
	}

	if(airburst) {
		legend1+="<p><small>";
		if(hob_ft||hob_ft===0) {
			legend1+= "*Detonation altitude: "+distance(hob_ft*ft2km,false,false,true)+".";
			if(hob_opt==1) {
				legend1+=" (Chosen to maximize the "+addCommas(hob_opt_psi)+" psi range.)";
			}
		} else {
			legend1+= "*Effects shown for multiple, different detonation altitudes.";
		}
		legend1+="</small></p>";
	}

	legend = legend + legend1;
		
	if(errs.length) {
		legend+="<hr>The following errors were encountered trying to implement these settings:";
		legend+="<ul>";
		for(var i=0;i<errs.length;i++) {
			legend+="<li>"+errs[i]+"</li>";		
		}
		legend+="</ul>";
	}

	legend = legend + "<hr><small>Note: Rounding accounts for any inconsistencies in the above numbers."
	if(kt>20000) legend = legend + " Also, yields above 20 Mt are derived from a scaling of 20 Mt yields, and are not as validated as those under 20 Mt."
	if(kt<1) legend = legend + " Also, yields under 1 kt are derived from a scaling of 1 kt yields, and are not as validated as those over 1 kt."
	legend = legend + "</small>";

	legend = "<div id='legend-text'>"+legend+"</div>";
	legend+= "</div>"; //collapsable content div

	legends[det_index] = legend;


	if(det_index>0) {
		legend+="<hr><small>This map has multiple detonations. The above information is for detonation #<span id='current_legend_det'>"+(det_index+1)+"</span> only.";
		legend+=" View other detonation information: "
		legend+="<select id='legend_changer' onchange='change_legend(this.value);'>";
		for(var i=0;i<=det_index;i++) {
			if(i==det_index) {
				var chk = " selected";
			} else {
				var chk = "";
			}
			legend+="<option value='"+(i)+"'"+chk+">"+(i+1)+"</option>";
		}
		legend+="</select>";
		legend+=" <a href='#' onclick='edit_dets(); return false;'>Click here</a> to edit the detonation order.";
		legend+="</small><span id='det_editor'></span>";
	}

	document.getElementById("theLegend").innerHTML = legend;

	document.getElementById("thePermalink").innerHTML = "<hr><big>&nbsp;&raquo; <span id='permalink'>"+permalink()+"</span> &laquo;</big></small>";

	if(document.getElementById("option_logdata").checked != true) {
		pos_lat = latval(dets[det_index].pos);
		pos_lng = lngval(dets[det_index].pos);
		var log_obj = {
			ver: 2,
			target_lat: pos_lat,
			target_lng: pos_lng,
			kt: dets[det_index].kt,
			airburst: dets[det_index].airburst==true?1:0,
			casualties: dets[det_index].casualties==true?1:0,
			fallout: dets[det_index].fallout==true?1:0,
			linked: dets[det_index].linked==true?1:0,
			active_dets: (det_index+1),
		};
		if(MODE == GMAP) {
			if(google.loader.ClientLocation) {
				log_obj.user_country = user_country;
				log_obj.user_lat = google.loader.ClientLocation.latitude;
				log_obj.user_lng = google.loader.ClientLocation.longitude;
			}
		}
		if(MODE == LLET) {
			if(clientLocation) {
				log.obj.user_lat = clientLocation.latitude;
				log.obj.user_lng = clientLocation.longitude;
			}
		}
		log_det(log_obj);
	}
	
	if(collapser) {
		$("#bottomFrame").scrollTop(1000);
	}
	
}

function change_legend(index) {
	document.getElementById("legend-text").innerHTML = legends[index];
	document.getElementById("current_legend_det").innerHTML = (parseInt(index)+1);
}

function edit_dets() {
	var o = '';
	o+="<br>";
	o+="<b>Current detonations in the stack	:</b><br>";
	o+="<select id='det_list' size='"+((det_index+1)>8?8:(det_index+1))+"'>";
	for(var i=0;i<=det_index;i++) {	
		o+='<option value="'+i+'">';
		pos_lat = latval(dets[i].pos);
		pos_lng = lngval(dets[i].pos);
		o+="#"+(i+1)+". "+ addCommas(dets[i].kt) +" kt ("+Math.round(pos_lat,6)+", "+Math.round(pos_lng,6)+")";
		o+='</option>';
	}	
	o+='</select>';
	o+='<div style="float:right;">';
	o+='<button onclick="change_det_list(0);">Move up</button>';
	o+='<button onclick="change_det_list(1);">Move down</button><br>';
	o+='<button onclick="change_det_list(2);">Remove detonation</button><br>';
	o+='<button onclick="change_det_list(3);"><b>Apply</b></button>';
	o+='<button onclick="change_det_list(4);">Cancel</button><br>';
	o+="</div>";
	o+='<br clear="both">';
	o+="The last (bottom-most) detonation is always the &quot;active&quot; detonation with the movable marker and changable settings.";
	document.getElementById('det_editor').innerHTML = o;
}

function change_det_list(action) {
	var det_list = document.getElementById('det_list');
	var sel = det_list.selectedIndex;
	switch(action) {
		case 0: //move up
		if(sel>0&&det_list.length>1) {
			var item1 = det_list.item(sel);
			var item2 = det_list.item(sel-1);
			var temp_text = item1.text;
			var temp_value = item1.value;
			item1.text = item2.text;
			item1.value = item2.value;
			item2.text = temp_text;
			item2.value = temp_value;
			item2.selected = true;
		}
		break;
		case 1: //move down
		if(sel>-1&&sel<det_list.length-1&&det_list.length>1) {
			var item1 = det_list.item(sel);
			var item2 = det_list.item(sel+1);
			var temp_text = item1.text;
			var temp_value = item1.value;
			item1.text = item2.text;
			item1.value = item2.value;
			item2.text = temp_text;
			item2.value = temp_value;
			item2.selected = true;
		}
		break;
		case 2: //remove
		if(sel>-1) {
			det_list.remove(sel);
		}
		break;
		case 3: //apply 
		var det_clone = clone(dets);
		clearmap();
		for(var i=0;i<det_list.length;i++) {
			dets[i] = det_clone[det_list.item(i).value];
		}
		for(var i = 0; i<dets.length;i++) {
			launch(true,dets[i],i);
			if(i<dets.length-1) {
				detach(true);
			}
		}
		det_index = dets.length-1;
		document.getElementById('theKt').value = dets[det_index].kt;
		break;
		case 4: //cancel
		document.getElementById('det_editor').innerHTML = "";
		break;
	}
	
}

//adds a row to the input fields
function addrow(what,label) {
	var mcounter = 0;
	var opt = document.forms["options"];
	for(var i=0; i<opt[what].length;i++) {
		if(opt[what][i].value<0) {
			mcounter++;
		}
	}
	var min = (mcounter+1)*-1;
	var ar = document.getElementById("addrow_"+what);
	ar.appendChild(document.createElement('BR'));
	var inp = document.createElement('INPUT');
	inp.type = "checkbox";
	inp.name = what;
	inp.value = min;
	inp.id = what+"_other_check_"+(min*-1);
	ar.appendChild(inp);
	ar.appendChild(document.createTextNode(' Other: '));
	var inp = document.createElement('INPUT');
	inp.type = "text";
	inp.className = "option_input";
	inp.name = what+"_other_"+(min*-1);
	inp.id = what+"_other_"+(min*-1);
	inp.value = "";
	ar.appendChild(inp);
	ar.appendChild(document.createTextNode(' '+(label==undefined?what:label)+' '));
}

function permalink() {
	waitingforlink = false;
	if((dets[0]!=undefined)&&(det_index>0)&&(dets[0].kt!=undefined)) {
		//MULTI PERMALINK
		return "<a href='#' onclick='fetchHash();'>Generate permanent link to these settings</a>";
	} else {
		//SINGLE PERMALINK
		return "<a href='" + window.location.pathname +"?"+object_to_urlstring(dets[0])+"&zm=" + map.getZoom() + "'>Permanent link to these settings</a>";
	}
}

function object_to_urlstring(obj,index) {
	var str = '';
	var ind = '';
	if(index!=undefined) ind='['+index+']';
	for(var key in obj) {
		if(key == "pos") {
			pos_lat = latval(obj.pos);
			pos_lng = lngval(obj.pos);
			str+="&lat"+ind+"="+Math.round(pos_lat,7);
			str+="&lng"+ind+"="+Math.round(pos_lng,7);
		} else {
			if(default_det[key]!=undefined) {
				if(isArray(obj[key])) {
					if(arraysEqual(obj[key],default_det[key])==false) {
						str+="&"+key+ind+"="+(obj[key]===true?1:(obj[key]===false?0:obj[key]));		
					}
				} else if((obj[key]!=default_det[key])&&(obj[key]!=null)) {
					str+="&"+key+ind+"="+(obj[key]===true?1:(obj[key]===false?0:obj[key]));
				}
			} else {
				if(obj[key]!=null) {
					str+="&"+key+ind+"="+(obj[key]===true?1:(obj[key]===false?0:obj[key]));			
				}
			}
		}
	}
	return str;
}

function generatelink(linkdata) {
	waitingforlink = true;
	document.getElementById("wait").innerHTML = "<img src='progress.gif'>";
	var generator_window = window.open("","NUKEMAP linker","width=100,height=100,location=0,menubar=0,status=0",false);
	if(!generator_window.opener) generator_window.opener = this.window;
	generator_window.document.write("<html><head><title>NUKEMAP linker</title></head>");
	generator_window.document.write("<body onload=\"document.getElementById('myform').submit();\"><form method=\"POST\" id=\"myform\" action=\"http://nuclearsecrecy.com/nukemap/makelink.php\">");
	generator_window.document.write("<input name=\"link\" type=\"hidden\" value=\""+linkdata+"\"/>");
	generator_window.document.write("</form></body></html>");
	generator_window.document.close();
}

function givelink(hash) {
	waitingforlink = false;
	document.getElementById("genlink").innerHTML = "<a href='" + window.location.pathname +"?t="+hash+"'>Permanent link to these settings</a>";
	document.getElementById("wait").innerHTML = "";
}

function centercursor() {
	setPosition(marker,getCenter(map));
	if(MODE==LLET) {
		setTimeout(function() {
			marker.fire("drag");
			marker.fire("dragend");
		},100);
	}
}

//adds a new target marker
function dropmarker(pos) {
	//remove old markers
	if(marker) {
		removeListener(map,"zoom_end");
		removeListener(marker,"dragend");
		marker = remove(marker);
	}
	
	//make new marker
	marker = newMarker({
		map: map,
		position: pos,
		draggable: true,
		title: 'Drag me to target \n('+Math.round(latval(pos),3)+", "+Math.round(lngval(pos),3)+")",
		animation: "drop",
		icon: newIcon({
				iconUrl: "images/nuke-marker.png",
				iconSize: [24, 40],
				iconAnchor: [12, 40]
		})
	});

	//marker events
	addListener(map,'zoom_end', function() {
		if(document.getElementById("permalink")) document.getElementById("permalink").innerHTML = permalink();
	});
	
	addListener(marker,'dragend', function() {
		var pos = getPosition(marker);
		if(typeof dets[det_index] != "undefined") dets[det_index].pos = pos;
		marker._icon.title = 'Drag me to target \n('+Math.round(latval(pos),3)+", "+Math.round(lngval(pos),3)+")";
		update_permalink();
		move_windsock();
		draw_fallout();
	});
}

//updates the permalink
function update_permalink() {
	if(document.getElementById("permalink")) document.getElementById("permalink").innerHTML = permalink();
	if(sample_marker) update_sample(); //also updates the sampler if it is there
}

//in grayscale mode, makes sure that the interface icons don't go grayscale as well (they default to it, because of how google maps deals with grayscale)
//this is deprecated
function fixmarkercolor() {
	if(grayscale) {
		$("img").each(function() {
			if(this.src.substr(0,basepath.length+7)==basepath+"images/") $(this).addClass("ungrayscale");
		});
	}
}

//"detaches" the current marker from the rings, allows for a new detonation to be attached to a new marker
function detach(preserve_det) {
	pos = getPosition(marker);
	stop_fallout();
	if(preserve_det!==true) {
		if(dets[det_index]!=undefined){ //avoids "phantom" dets with no data in them
			det_index++;
			dets[det_index] = {};
		}
	}
	dropmarker(pos);
}


//goes to a lat/lng (based on string: lat,lng)
function jumpcity(where) {
	var lat = where.substr(0,where.indexOf(","));
	var lng = where.substr(where.indexOf(",")+1,where.length);
	if(lat&&lng) {
		setZoom(map,12);
		setPosition(marker,LatLng(lat,lng)); 
		panTo(map,getPosition(marker));		
		move_windsock();
		draw_fallout();
	}
}

//changes the various weapons fields based on the preset dropdown
function updatefrompreset(data) {
	var d = data.split(",");
	var yield = d[0];
	var airburst = d[1];
	var fission = d[2];
	if(d[3]!=undefined) {
		var hob = d[3];
	}
	document.getElementById("theKt").value = yield;	
	if(airburst=="1") {
		document.forms.options.hob[0].checked = true;
		if(hob) {
			document.getElementById("hob_option_height").checked = true;
			document.getElementById("hob_h").value = hob;
			document.getElementById("hob_h_u").value = 0;
		} else {
			document.getElementById("hob_option_opt").checked = true;
		}
	} else {
		document.forms.options.hob[1].checked = true;
	}
	document.getElementById("fallout_fission").value = fission;	
}


function clearmap() {
	kt = false;
	for(var i=det_index;i>=0;i--) {
		if(c_radii[i]!==undefined) {
			if(c_radii[i].length) {
				for(var c=c_radii[i].length-1;c>=0;c--) {
					remove(c_radii[i][c]);
				}
			}
			c_radii[i] = undefined;
		}
	}
	c_radii = [];
	det_index = 0;
	dets = [];
	
	if(placeMarkers!==undefined) {
		if(placeMarkers.length) {
			for(var i=0; i<placeMarkers.length;i++) {
				remove(placeMarkers[i]);
			}
		}
		placeMarkers = [];
	}
	if(fallout_contours.length) {
		for(var i=0;i<fallout_contours.length;i++) {
			if(fallout_contours[i]) {
				if(fallout_contours[i].length) {
					for(var x=0;x<fallout_contours[i].length;x++) {	
						remove(fallout_contours[i][x]);
					}
				}
				fallout_contours[i] = undefined;
			}
		}
		fallout_contours = [];
		stop_fallout();
	}
}

function isHighDensity(){
    return ((window.matchMedia && (window.matchMedia('only screen and (min-resolution: 124dpi), only screen and (min-resolution: 1.3dppx), only screen and (min-resolution: 48.8dpcm)').matches || window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (min-device-pixel-ratio: 1.3)').matches)) || (window.devicePixelRatio && window.devicePixelRatio > 1.3));
}

var mapLayers = []; var tileLayers = []; var tileLayerList = []; var layerControl;

function init(mapCenter, mapZoom) {
	var default_center = [40.72422, -73.99611];
	switch(GEOCODE_MODE) {
		case GMAP:
			geocoder = new google.maps.Geocoder();
		break;	
		case MBOX:
			geocoder = new MapboxGeocoder({
   			 accessToken: NUKEMAP_TOKEN,
   			 flyTo: false,
   			 trackProximity: false
			});
			$('body').append("<div id='geocoder' style='display: none;'></div>"); //mapquest geocoder needs to be attached to an element, so we just attach it to a non-displayed div
		break;
	}
	switch(MODE) {
		case GMAP:
			if(!mapCenter) {
				/*
				if(google.loader.ClientLocation&&1==2) { //ClientLocation currently giving garbage results
					console.log(google.loader.ClientLocation);
					//searches for closest major city, based on population currently (future: include country capitals, US state capitals)
					var closest = find_closest(google.loader.ClientLocation.latitude,google.loader.ClientLocation.longitude);
					if(closest) {
						mapCenter = new google.maps.LatLng(closest[0],closest[1]);
						if(debug) console.log("Client location chosen from city list");	
					} else {
						mapCenter = new google.maps.LatLng(google.loader.ClientLocation.latitude, google.loader.ClientLocation.longitude);
						if(debug) console.log("Client location from ClientLocation");
					}
				} else { //try http://freegeoip.net/json/{IP} ?
					mapCenter = default_center;;
					if(debug) console.log("Could not geolocate user");
				}*/
				mapCenter = default_center;
			}

			if(google.loader.ClientLocation) {
				user_country = google.loader.ClientLocation.address.country_code;
				user_location = google.loader.ClientLocation.latitude+","+google.loader.ClientLocation.longitude;
			}
			if(user_country=="US") current_unit = "mi";
		
			if(!mapZoom) mapZoom = 12;
	
			map = new google.maps.Map(document.getElementById('theMap'), {
			  'zoom': mapZoom,
			  'center': mapCenter,
			  //'mapTypeId': google.maps.MapTypeId.HYBRID,
			  'mapTypeId': google.maps.MapTypeId.TERRAIN,
			  'styles': normal_style,
			  'scaleControl': true,
			  'streetViewControl': false
			});

			//map.setOptions({styles: [{ "stylers": [ { "saturation": -100 } ] },{ "featureType": "water", "stylers": [ { "lightness": -30 } ] } ]});

			service = new google.maps.places.PlacesService(map);
		break;
		case LLET:
			if(!mapZoom) mapZoom = 12;
			if(!mapCenter) {
				//check if user location (IP based) script has loaded successfully... if not, just go to default
				if(typeof user_location!="undefined") {
					if(typeof user_location.closest!="undefined") {
						mapCenter = {lat:user_location.closest.lat,lng:user_location.closest.lon};
					} else {
						mapCenter = default_center;					
					}
				} else {
					mapCenter = default_center;
				}
			}

			if(MAPBOX_GL) { //test if supported
				mapboxgl.accessToken = MBOXGL_TOKEN;
				if (!mapboxgl.supported()) MAPBOX_GL = false;
			}
			console.log("USING GL? "+(MAPBOX_GL?"YES":"NO"));
			
			//list of layers we want to use - ids + captions + tile or style urls
			//if the id starts with a dash, it is GL layer specified below
			if(MAPBOX_GL) {							
				mapLayers = [
					["_normal","Normal","mapbox://styles/vizsociety/ckh1arm5m0jc119pifurpsrze"],
					["_satellite","Satellite","mapbox://styles/vizsociety/cjqed70dk9p9j2smxkquc7psj"],
					["_dark","Dark","mapbox://styles/vizsociety/cjqed4tmw8d4a2spcilizqv5c"],
				];
			} else {
				mapLayers = [
					["mapbox/outdoors-v11","Normal","//web.archive.org/web/20220204010623/https://api.mapbox.com/styles/v1/vizsociety/ckh1arm5m0jc119pifurpsrze/tiles"],
					["mapbox/satellite-streets-v11","Satellite","//web.archive.org/web/20220204010623/https://api.mapbox.com/styles/v1/vizsociety/cjqed70dk9p9j2smxkquc7psj/tiles"],
					["mapbox/dark-v10","Dark","//web.archive.org/web/20220204010623/https://api.mapbox.com/styles/v1/vizsociety/cjqed4tmw8d4a2spcilizqv5c/tiles"],
				];
			}
			//var tileLayers = [], tileLayerList = {}, 
			var x = 0;
			if(isHighDensity()) {
				var hd = "@2x";
			} else {
				var hd = "";
			}
			var res = 256;
			
			/* maybe this is causing too much loading
			for(var i in mapLayers) {
				if(mapLayers[i][0][0]=="_") {
					tileLayers.push(L.tileLayer('', {
							attribution: 'Map data &copy; <a href="https://web.archive.org/web/20220204010623/https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://web.archive.org/web/20220204010623/https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://web.archive.org/web/20220204010623/https://www.mapbox.com/">Mapbox</a>',
							maxZoom: 18,
							minZoom: 2,
							id: mapLayers[i][0],
							accessToken: MAPBOX_GL?MBOXGL_TOKEN:NUKEMAP_TOKEN,
					}));
				} else {
					if(mapLayers[i][2]) {
						tileURL = mapLayers[i][2];						
					} else {
						tileURL = "//web.archive.org/web/20220204010623/https://api.tiles.mapbox.com/v4/{id}/";
					}
					var layerURL = tileURL + res+'/{z}/{x}/{y}'+hd+(mapLayers[i][2]?"":".png")+'?access_token='+(MAPBOX_GL?MBOXGL_TOKEN:NUKEMAP_TOKEN);
					tileLayers.push(L.tileLayer(layerURL, {
							attribution: 'Map data &copy; <a href="https://web.archive.org/web/20220204010623/https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://web.archive.org/web/20220204010623/https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://web.archive.org/web/20220204010623/https://www.mapbox.com/">Mapbox</a>',
							maxZoom: 18,
							minZoom: 2,
							id: mapLayers[i][0],
							accessToken: MAPBOX_GL?MBOXGL_TOKEN:NUKEMAP_TOKEN,
					}));
				}
				tileLayerList[mapLayers[i][1]] = tileLayers[x];
				x++;
			}*/

			/* new method */

			for(var i in mapLayers) {
				tileLayerList[mapLayers[i][1]] = L.tileLayer("_"+i,{
							attribution: 'Map data &copy; <a href="https://web.archive.org/web/20220204010623/https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://web.archive.org/web/20220204010623/https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://web.archive.org/web/20220204010623/https://www.mapbox.com/">Mapbox</a>',
							maxZoom: 18,
							minZoom: 2,
							id: mapLayers[i][0],
							accessToken: MAPBOX_GL?MBOXGL_TOKEN:NUKEMAP_TOKEN}
				);
			}
			
			//create map
			map = L.map('theMap',{
					zoomControl: false,
					center: mapCenter,
					zoom: mapZoom,
					maxZoom: 18,
					minZoom: 2, //mapbox GL plugin doesn't work if it goes beyond this
				});				

			map.on("zoomend",function() { 
				update_permalink(); 
			});
			
			//create layer control
			if(MAPBOX_GL) {
				layerControl = L.control.layers(tileLayerList,undefined,{position:"topleft"}).addTo(map);
			}
						
			//activate first layer
			if(!MAPBOX_GL) {
				loadTileLayer(0);
				tileLayers[0].addTo(map);

				map.on('baselayerchange', function(e) {
					if(tileLayerList[e.name]._url[0] == "_") {
						console.log(layerControl);
						console.log(tileLayerList[e.name]._url.substr(1,1));
						loadTileLayer(+tileLayerList[e.name]._url.substr(1,1));
						//tileLayerList[e.name].addTo(map);
					}
					console.log(tileLayerList[e.name]);
				});

			} else {
				gl = L.mapboxGL({
					accessToken: MAPBOX_GL?MBOXGL_TOKEN:NUKEMAP_TOKEN,
					style: 'mapbox://styles/vizsociety/ckh1arm5m0jc119pifurpsrze',
					attribution: 'Map data &copy; <a href="https://web.archive.org/web/20220204010623/https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://web.archive.org/web/20220204010623/https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://web.archive.org/web/20220204010623/https://www.mapbox.com/">Mapbox</a>',
				});
				gl.addTo(map);

				map.on('baselayerchange', function(e) {
				  switch(e.name) {
					case "Normal":			  	
						gl._glContainer.style.display = "block";
						gl._glMap.setStyle("mapbox://styles/vizsociety/ckh1arm5m0jc119pifurpsrze");
					break;
					case "Satellite":
						gl._glContainer.style.display = "block";
						gl._glMap.setStyle("mapbox://styles/vizsociety/cjqed70dk9p9j2smxkquc7psj");
					break;
					case "Dark":
						gl._glContainer.style.display = "block";
						gl._glMap.setStyle("mapbox://styles/vizsociety/cjqed4tmw8d4a2spcilizqv5c");
					break;
					default: 
						gl._glContainer.style.display = "none";
					break;
				  }
				});
				
				//console.log(map);
				//console.log(gl);
				window.tiles = 0;
				gl._glMap.on("data",function(e) {
					//console.log(e);
					if(e.dataType=="source") {
						window.tiles++;
						//console.log("NEW TILE ("+window.tiles+")",e);
					}
				})
				
			}
			window.tiles = 0;
			
			//other controls			
			L.control.zoom({position:"bottomright"}).addTo(map);
			L.control.scale({position:"topright"}).addTo(map);

			//add the mapbox wordmark
			$("#theMap").append("<a href='https://web.archive.org/web/20220204010623/http://mapbox.com/about/maps' class='mapbox-wordmark' target='_blank'>Mapbox</a>");

			switch(GEOCODE_MODE) {
				case MBOX:
					document.getElementById('geocoder').appendChild(geocoder.onAdd(map)); //attach geocoder to our hidden div -- this needs to happen after map is initialized, which is why it is down here
				break;
			}
			
		break;
	}
	dropmarker(mapCenter);
}

//not sure if this method works/is worth it
function loadTileLayer(i) {
	if(isHighDensity()) {
		var hd = "@2x";
	} else {
		var hd = "";
	}
	var res = 256;

	if(mapLayers[i][0][0]=="_") {
		tileLayers.push(L.tileLayer('', {
				attribution: 'Map data &copy; <a href="https://web.archive.org/web/20220204010623/https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://web.archive.org/web/20220204010623/https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://web.archive.org/web/20220204010623/https://www.mapbox.com/">Mapbox</a>',
				maxZoom: 18,
				minZoom: 2,
				id: mapLayers[i][0],
				accessToken: MAPBOX_GL?MBOXGL_TOKEN:NUKEMAP_TOKEN,
		}));
	} else {
		if(mapLayers[i][2]) {
			tileURL = mapLayers[i][2];						
		} else {
			//tileURL = "//web.archive.org/web/20220204010623/https://api.tiles.mapbox.com/v4/{id}/";
			tileURL = "//web.archive.org/web/20220204010623/https://api.mapbox.com/styles/v1/{id}/tiles/";
		}
		//var layerURL = tileURL + res+'/{z}/{x}/{y}'+hd+(mapLayers[i][2]?"":".png")+'?access_token='+(MAPBOX_GL?MBOXGL_TOKEN:NUKEMAP_TOKEN);
		var layerURL = tileURL +'/{z}/{x}/{y}'+hd+'?access_token='+(MAPBOX_GL?MBOXGL_TOKEN:NUKEMAP_TOKEN);

		tileLayers.push(L.tileLayer(layerURL, {
				attribution: 'Map data &copy; <a href="https://web.archive.org/web/20220204010623/https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://web.archive.org/web/20220204010623/https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://web.archive.org/web/20220204010623/https://www.mapbox.com/">Mapbox</a>',
				maxZoom: 18,
				minZoom: 2,
				tileSize: 512, zoomOffset: -1,
				id: mapLayers[i][0],
				accessToken: MAPBOX_GL?MBOXGL_TOKEN:NUKEMAP_TOKEN,
		}));
	}
	tileLayerList[mapLayers[i][1]] = tileLayers[i];			
	if(MAPBOX_GL) layerControl._layers[i] = tileLayers[i];
}



function add_sample_marker(button_id) {
	console.log(sample_marker);
	if(sample_marker) {
		removeListener(sample_marker,"dragend");
		sample_marker = remove(sample_marker);
		if(button_id) document.getElementById(button_id).innerHTML = "Probe location";
	} else {
		pos = getPosition(marker);
		zoom = getZoom(map);

		var angle = 45; //default angle
		
		if(dets[det_index].fallout==true) {
			angle = dets[det_index].fallout_angle+180;
		}
		
		
		var R = 6371; // km

		var d = (16-zoom)*2-1; //km

		var lat1 = pos_lat*deg2rad;
		var lon1 = pos_lng*deg2rad;
		var brng = (angle)*deg2rad;
		var lat2 = Math.asin( Math.sin(lat1)*Math.cos(d/R) + 
					  Math.cos(lat1)*Math.sin(d/R)*Math.cos(brng) );
		var lon2 = lon1 + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(lat1), 
							 Math.cos(d/R)-Math.sin(lat1)*Math.sin(lat2));	

		sample_marker = new newMarker({
			map: map,
			draggable: true,
			icon: newIcon({
					iconUrl: 'images/probe.png',
					iconSize: [20, 46],
					iconAnchor: [10, 42],
			}),
			title: 'Drag me to sample conditions at a given position on the map',
			animation: "drop",
			position: LatLng(lat2*rad2deg, lon2*rad2deg)
		});
		addListener(sample_marker,"dragend",function() { update_sample(); });
			

		if(button_id) document.getElementById(button_id).innerHTML = "Remove info marker";
		
		update_sample();
	}
}

//these are set whenever the control is changed -- to keep it consistent when you move things around
var default_pf = 1;
var default_hr = 24;
var arbitrary_hr = 0;
var arbitrary_pf = 0;

var list_hrs = [1,2,3,5,12,24,36,48,72,"-",-1];

var list_pfs = [
	[1,"in the open"],
	[1.5,"in an automobile"],
	[0,"-"],
	[2,"inside a 1-story frame house"],
	[10,"basement of a 1-story frame house"],
	[0,"-"],
	[3,"inside a 2-story brick-veneer house"],
	[20,"basement of a 2-story brick-veneer house"],
	[0,"-"],
	[7,"in the 2nd floor of a 3-story brick building"],
	[50,"basement of a 3-story brick building"],
	[0,"-"],
	[10,"top or ground floors of a multi-story concrete building"],
	[20,"center of a multi-story concrete building"],
	[100,"basement of a multi-story concrete building"],
	[1000,"sub-basement of a multi-story concrete building"],
	[0,"-"],
	[-1,"Custom protection factor..."],
];

function update_sample() {
	var sample_info = document.getElementById("sample_info");
	var o='';
	if(dets[0]&&sample_marker&&dets[0].kt) {	
		o+= "<hr><b>Information at sample point:</b><br>";
		var sample_pos = getPosition(sample_marker);
		var sample_lat = latval(sample_pos);
		var sample_lng = lngval(sample_pos);
			
		o+= "<ul>";	

		if(det_index>5) {
			var only_nonzero = true;
		} else {
			var only_nonzero = false;
		}
		for(var i=0;i<=det_index;i++) {
			oo='';
			var non_zero = false;
			var dets_to_display = 0;
			if(dets[i].kt) {
				det_lat = latval(dets[i].pos);
				det_lng = lngval(dets[i].pos);
				var dist_km = distance_between(det_lat, det_lng, sample_lat,sample_lng);


				var dist_mi = dist_km*km2mi;
				if(dets[i].airburst&&dets[i].hob_opt>0&&dets[i].hob_ft) {
					var slant_dist_mi = Math.sqrt(Math.pow(dets[i].hob_ft*ft2mi,2)+Math.pow(dist_mi,2));
				}
				if(det_index>0) {
					oo+="<li>Sample point is "+distance(dist_km)+ " from ground zero #"+(i+1)+" ("+ktOrMt(dets[i].kt,true);
					if(dets[i].airburst&&dets[i].hob_opt>0&&dets[i].hob_ft) {
						oo+=" (slant range "+distance(slant_dist_mi*mi2km)+")";
					}
					oo+=".";		
					if(dets[i].kt>20000) {
						oo+=" (unreliable for yields >20 Mt!)";
					} else if(dets[i].kt<1) {
						oo+=" (unreliable for yields <1 kt!)";
					}
					oo+="</li>";
				} else {
					oo+="<li>Sample point is "+distance(dist_km)+" from "+(det_index>0?"current":"")+" ground zero"
					if(dets[i].airburst&&dets[i].hob_opt>0&&dets[i].hob_ft) {
						oo+=" (slant range "+distance(slant_dist_mi*mi2km)+")";
					}
					oo+=".";
					if(dets[i].kt>20000) {
						oo+=" (unreliable for yields >20 Mt!)";
					} else if(dets[i].kt<1) {
						oo+=" (unreliable for yields <1 kt!)";
					}
					oo+="</li>";
				}
				oo+="<ul>";
				
				oo+="<li>Overpressure: ";
				if(dets[i].airburst) {
					if(dets[i].hob_ft&&dets[i].hob_opt>0) {
						var psi = bc.psi_at_distance_hob(dist_km*km2ft,dets[i].kt,dets[i].hob_ft);
					} else {
						var psi = bc.maximum_overpressure_psi(bc.scaled_range(dist_mi,dets[i].kt),dets[i].airburst);
					}		
				} else {
					var psi = bc.psi_at_distance_hob(dist_km*km2ft,dets[i].kt,0);
				}
				if(!Math.round(psi)) {
					if(psi[0]=="+") {
						oo+=psi+" psi";
						non_zero = true;
					} else if(dets[i].hob_ft||!dets[i].airburst) {
						oo+="0 psi";
					} else {
						if(dist_mi > bc.psi_distance(dets[i].kt,1,dets[i].airburst)) {
							oo+="0 psi";
						} else { 
							oo+="+200 psi";
							non_zero = true;
						}						
					}
				} else {
					oo+=addCommas(Math.round(psi))+" psi";
					non_zero = true;
				}
				oo+="</li>";
				if(!dets[i].airburst||dets[i].hob_ft===0) { //I have no idea how to translate wind velocity to arbitrary airbursts, so let's just stick to surface
					oo+="<li>Maximum wind velocity: ";
					var mph = bc.maximum_wind_velocity_mph(bc.scaled_range(dist_mi,dets[i].kt),false);
					if(!Math.round(mph)) {
						if(dist_mi > bc.psi_distance(dets[i].kt,1,dets[i].airburst)) {
							oo+="0 mph";
						} else {
							oo+="+3,000 mph";
							non_zero = true;
						}
					} else {
						oo+=Math.round(mph)+" mph";
						non_zero = true;
					}
					oo+="</li>";
				}	
				oo+="<li>Initial radiation dose: ";
				if(dets[i].airburst&&dets[i].hob_ft&&dets[i].hob_opt>0) { //get slant distance
					checkdist = slant_dist_mi;
				} else {
					checkdist = dist_mi;
				}
				if(dets[i].kt>20000) {
					oo+=" <small>cannot calculate for yields greater than 20 Mt</small>"
				} else {
					var rem = bc.initial_nuclear_radiation(checkdist,dets[i].kt,dets[i].airburst);
					if(!Math.round(rem)) {
						if(checkdist > bc.initial_nuclear_radiation_distance(dets[i].kt,1,dets[i].airburst)) {
							oo+="0 rem";
						} else { 
							oo+="<small>too close to ground zero (potentially +20,000 rem)</small>";
							non_zero = true;						
						}
					} else if (rem>20000){ 
						oo+="<small>too close to ground zero (potentially +20,000 rem)</small>";
						non_zero = true;
					} else {
						oo+=addCommas(Math.round(rem))+" rem";
						non_zero = true;
					}
				}
				oo+="</li>";

				oo+="<li>Thermal radiation: ";
				if(dets[i].airburst&&dets[i].hob_ft&&dets[i].hob_opt>0) { //get slant distance
					checkdist = slant_dist_mi;
				} else {
					checkdist = dist_mi;
				}	
				var therm = bc.thermal_radiation_q(checkdist,dets[i].kt,dets[i].airburst);
				if(!Math.round(therm,1)) {
					if(dist_mi > bc.thermal_distance(dets[i].kt,"_1st-50",dets[i].airburst)) {
						oo+="0 cal/cm&sup2;";
					} else { 
					console.log(dist_mi,bc.thermal_distance(dets[i].kt,"_noharm-100",dets[i].airburst),bc.thermal_radiation_q(dist_mi,dets[i].kt,dets[i].airburst));
						oo+="<small>too close to ground zero (potentially +350,000 cal/cm&sup2;)</small>";
						non_zero = true;
					}
				} else {
					oo+=addCommas(Math.round(therm,1))+" cal/cm&sup2;";
					non_zero = true;
				}
				oo+="</li>";
				
				if(fallout_current) {
				
					rad_hr = h1_dose_at_point(sample_lat,sample_lng,det_lat,det_lng);
					oo+="<li>Fallout exposure:<ul>";
					if(!rad_hr) {
						oo+="<li>No significant fallout exposure at position.";
					} else {
						oo+="<li>H+1 dose rate is "+addCommas(rad_hr)+" rad/hr <input type='hidden' id='fallout_exposure_rate_"+i+"' value='"+rad_hr+"'/>";
						oo+="<li>Time of arrival at location is ";
						var toa = (dist_mi/fallout_current.wind); //hours
						var n = new Date(0,0);
						n.setSeconds(toa * 60 * 60);
						oo+=(n.toTimeString().slice(0, 8)) + "<input type='hidden' id='fallout_exposure_toa_"+i+"' value='"+toa+"'/>";;	
						oo+="<li>Dose rate at time of arrival will be "+addCommas(Math.round(rad_hr*Math.pow(toa,-1.2)))+" rad/hr";

						var hr = default_hr, pf = default_pf; 

						oo+="<li>Exposure time: ";
						oo+="<select id='fallout_exposure_hr_"+i+"' onchange=\"update_exposure("+i+");\">";
						var custom_hr = false;
						for(var x in list_hrs) {
							oo+="<option value='"+list_hrs[x]+"'";
							if(list_hrs[x] == default_hr) oo+=" selected"
							if(list_hrs[x]==-1) {
								oo+=">Custom time...</option>";
								custom_hr = true;
							} else if(list_hrs[x]=="-") {
								oo+="<option disabled>──────</option>";
							} else {
								if(custom_hr) {
									oo+=">User-selected time = "+list_hrs[x]+ " hour"+(list_hrs[x]!=1?"s":"")+"</option>";
								} else {
									oo+=">"+list_hrs[x]+" hour"+(list_hrs[x]==1?"":"s")+"</option>";
								}
							}
						}
						oo+="</select><br>";

						oo+="<li>Protection factor: ";
						oo+="<select id='fallout_exposure_pf_"+i+"' style='width: 200px;'  onchange=\"update_exposure("+i+");\">";
						var custom_pf = false;
						for(var x in list_pfs) {
							if(list_pfs[x][0]==0) {
								oo+="<option disabled>────────────────────</option>";
							} else if(list_pfs[x][0]==-1) {
								oo+="<option value='"+list_pfs[x][0]+"'";
								oo+=">"+list_pfs[x][1]+"</option>";	
								custom_pf = true;					
							} else {
								oo+="<option value='"+list_pfs[x][0]+"'";
								if(list_pfs[x][0]==pf) oo+=" selected";
								if(custom_pf) {
									oo+=">"+list_pfs[x][1]+"</option>";
								} else {
									oo+=">"+addCommas(list_pfs[x][0])+" = "+list_pfs[x][1]+"</option>";
								}
							}
						}

						oo+="</select>"
						oo+="<li>Total exposure dose: ";
						oo+="<span id='fallout_exposure_dose_"+i+"'>";
						oo+=exposure_dose(rad_hr,hr,toa,pf);
						oo+="</span>";
						oo+="</ul>";
					}
					oo+="</li>";
				}
				oo+="</ul>";
			}
			if(!only_nonzero) {
				o+=oo;		
				dets_to_display++;	
			} else if (non_zero==true) {
				o+=oo;
				dets_to_display++;	
			} else {
				oo='';
			}
		}
		if(dets_to_display==0) o+="<li>None of your detonations have measurable immediate effects at the selected point.</li>";
		o+="</ul>";
	}
	if(det_index>0) {
		o+="<small>Note: The effects are kept separate here for multiple detonations, because they don't necessarily add up in a linear fashion.";
		if(only_nonzero) o+=" Also, because there are so many detonations in your current simulation, information is only shown when it has non-zero values.";
		o+="</small>";
	}
	sample_info.innerHTML = o;

}

function update_exposure(i) {
	var old_default_hr = default_hr;
	var old_default_pf = default_pf;
	default_hr=$('#fallout_exposure_hr_'+i).val();
	default_pf=$('#fallout_exposure_pf_'+i).val();
	if(default_hr==-1) {
		var input_hr = window.prompt("Enter in the amount of hours you are curious to calculate the exposure for (decimal hours only: e.g., 1.5 hours, not 01:30). Note that the accuracy of the exposure calculation decreases with times significantly greater than 100 hours.");
		if(parseFloat(input_hr)<=0||input_hr==''||input_hr==null) {
			$('#fallout_exposure_hr_'+i).val(old_default_hr);
			default_hr = old_default_hr;
		} else {
			arbitrary_hr = parseFloat(input_hr);
			list_hrs.push(arbitrary_hr);
			default_hr = arbitrary_hr;
			$("#fallout_exposure_hr_"+i).append("<option value='"+arbitrary_hr+"'>User-selected time = "+arbitrary_hr+ " hour"+(arbitrary_hr!=1?"s":"")+"</option>");
			$("#fallout_exposure_hr_"+i).val(arbitrary_hr);
		}
	} 
	if(default_pf==-1) {
		var input_pf = window.prompt("Enter a protection factor (PF) you would like to use. A protection factor of 2 corresponds to a total reduction of radiation exposure by a factor of 2, for example. Protection factors cannot be less than 1.");
		if(parseFloat(input_pf)<=1||input_pf==''||input_pf==null) {
			$('#fallout_exposure_pf_'+i).val(old_default_pf);
			default_pf = old_default_pf;
		} else {
			arbitrary_pf = parseFloat(input_pf);
			list_pfs.push([arbitrary_pf,"User-selected PF = "+addCommas(arbitrary_pf)]);
			default_pf = arbitrary_pf;
			$("#fallout_exposure_pf_"+i).append("<option value='"+arbitrary_pf+"'>User-selected PF = "+addCommas(arbitrary_pf)+"</option>");
			$("#fallout_exposure_pf_"+i).val(arbitrary_pf);
		}
	} 

	$('#fallout_exposure_dose_'+i).html(exposure_dose($('#fallout_exposure_rate_'+i).val(),$('#fallout_exposure_hr_'+i).val(),$('#fallout_exposure_toa_'+i).val(),$('#fallout_exposure_pf_'+i).val()));
}

//gives total exposure (rads) over time given initial activity (rad/hr), duration of exposure (hours), time of arrival (hours), protection factor
//coeff_mode determines which the fission product decay coefficient is used
//coeff_mode = 0 = standard Way and Wigner (1948) t^-1.2 mode for all times. not terrible but also a little inaccurate esp. for long term. (https://link.springer.com/chapter/10.1007%2F978-3-642-77425-6_27)
//coeff_mode = 1 = uses a variable coefficient algorithm derived from Hunter and Ballou, "Fission Product Decay Rates," Nucleonics (November 1951), page C-2
//coeff_mode = 1 = currently not supported!
function exposure_dose(rad_hr,hr,toa,pf, coeff_mode = 0) {
	hr = parseFloat(hr);
	pf = parseFloat(pf);
	toa = parseFloat(toa);
	rad_hr = parseInt(rad_hr);
	if(pf<1) pf = 1;
	oo=""
	if(hr>toa) {
		switch(coeff_mode) {
			default: case 0:
				var rads = Math.round(5*rad_hr*(Math.pow(toa,-0.2)-Math.pow(hr,-0.2))/pf);
			break;/*
			case 1:
				var rads = 0;
				var hrs = hr;
				var rh = rad_hr;
				var rates = [
					[24,-1.11],
					[24*4, -1.25],
					[24*100, -1.03],
					[24*365*3, -1.60];
				]
				for(var i in rates) {
					var ce = rates[i][0];
					if(hrs<=rates[i][0]) {
						rad += Math.round(5*rad_hr*(Math.pow(toa,ce+1)-Math.pow(hrs,ce+1))/pf)
					
					}
				}
							
			
			break;*/
		}
		
		//linear fit to NAPB-90 data, table B-2, which is just LNT. 
		var c_risk =0.0303*rads-0.2065;
		if(c_risk<1) {
			c_risk = "less than 1%";
		} else if(c_risk>100) {
			c_risk = "100%";
		} else {
			c_risk = Math.round(c_risk)+"%";
		}
		
		//incapacitation and death info comes from Jorma K. Miettinen, "Enhanced Radiation Warfare," BAS 33, no. 7 (1977), 32-37.
		oo+= "<b>"+addCommas(rads)+"</b> rads ";
		if(rads>=17000) {
			oo+="<small>(fatal, incapacitating within five minutes, death within one day)</small>"; //no need to talk about survivors		
		} else if(rads>=7000) {
			oo+="<small>(fatal, incapacitating within five minutes, death within one to two days)</small>"; //no need to talk about survivors		
		} else if (rads>=1000) {
			oo+="<small>(fatal, incapacitating within five minutes with recovery period, death within four to six days)</small>"; //no need to talk about survivors		
		} else if (rads>=1000) {
			oo+="<small>(fatal, in two weeks or less)</small>"; //no need to talk about survivors
		} else if(rads>=500) {
			oo+="<small>(likely fatal, in about 1 month; "+c_risk+" of survivors will eventually die of cancer as a result of exposure)</small>";
		} else if(rads>=250) {
			oo+="<small>(sickness inducing, medical care would be required, some deaths in 30-60 days; "+c_risk+" of survivors will eventually die of cancer as a result of exposure)</small>";
		} else if(rads>=100) {
			oo+="<small>(sickness inducing, less than 5% chance of death in 60 days; "+c_risk+" of survivors will die of cancer as a result of exposure)</small>";
		} else if(rads>0) {
			oo+="<small>(no immediate symptoms; "+c_risk+" of survivors will die of cancer as a result of exposure)</small>";
		}
	} else {
		oo+= "0 rads <small>(because fallout has not yet arrived)</small>";
	}
	return oo;
}

function jumpToCoordinates () {
	const lat = document.querySelector('[name="lat"]').value;
	const lng = document.querySelector('[name="lng"]').value;
	setPosition(marker,LatLng(lat,lng));
	panTo(map,getPosition(marker));
	setZoom(map,12);
	move_windsock();
	draw_fallout();

	/*
	marker.options.autopan = false;
	map.setZoom(12);
	marker.setLatLng([lat, lng]);
	map.panTo(marker.getLatLng());
	marker.options.autopan = true;
	setTimeout(function() {
		marker.fire("drag");
		marker.fire("dragend");
	},100);*/
}

function jumptocitytext() {
    var address = document.getElementById("jumptocity").value;
	switch(GEOCODE_MODE) {
		case GMAP:
			geocoder.geocode( { 'address': address}, function(results, status) {
			  if (status == google.maps.GeocoderStatus.OK) {
			  	switch(MODE){	
			  		case GMAP:
						map.setZoom(12);
						marker.setPosition(results[0].geometry.location);
						map.setCenter(marker.getPosition());
					break;
					case LLET:
						marker.options.autopan = false;
						map.setZoom(12);
						marker.setLatLng([results[0].geometry.location.lat(),results[0].geometry.location.lng()]);
						map.panTo(marker.getLatLng());
						marker.options.autopan = true;
						setTimeout(function() {
							marker.fire("drag");
							marker.fire("dragend");
						},100);
					break;
				}
				move_windsock();
				draw_fallout();
			  };
			});
		break;
		case MBOX: 
			var skip_geocode = false;
			var ad = address.split(",");
			if(ad.length==2) {
				if(!isNaN(ad[0])&&!isNaN(ad[1])) { //interpret as lat/lng
					if((+ad[0]<=90||+ad[0]>=-90)&&(+ad[1]<=180||+ad[1]>=-180)) {
						skip_geocode = true;
						marker.options.autopan = false;
						marker.setLatLng([+ad[0],+ad[1]]);
						map.panTo(marker.getLatLng());
						marker.options.autopan = true;
						setTimeout(function() {
							marker.fire("drag");
							marker.fire("dragend");
						},100);
					}
				}
			} 
			if(!skip_geocode) {
				geocoder.on("results",processMBOXresults); //only way to turn this event off is to externalize the function
				geocoder.query(address);
			}
		break;
	}
}

//function to process mapbox geocoding results
function processMBOXresults(results) {
	var pos_lat, pos_lng;
	if(results.type=="FeatureCollection") {
		//console.log(results);
		if(results.features.length) {
			if(results.features[0].center) {
				pos_lat = results.features[0].center[1];
				pos_lng = results.features[0].center[0];
				switch(MODE){	
					case GMAP:
						map.setZoom(12);
						marker.setPosition(new google.LatLng(pos_lat,pos_lng));
						map.setCenter(marker.getPosition());
					break;
					case LLET:
						marker.options.autopan = false;
						marker.setLatLng([pos_lat,pos_lng]);
						map.panTo(marker.getLatLng());
						if(results.features[0].bbox) {
							map.fitBounds([[results.features[0].bbox[1],results.features[0].bbox[0]],[results.features[0].bbox[3],results.features[0].bbox[2]]]);
						}
						marker.options.autopan = true;
						setTimeout(function() {
							marker.fire("drag");
							marker.fire("dragend");
						},100);
					break;
				}
				move_windsock();
				draw_fallout();
			}
		}
	}
	geocoder.off("results",processMBOXresults); //turn off the event firing so it doesn't start exponentially firing
}

//single or multiple
function permalinks_to_det(permalink_array) {
	var p = permalink_array;
	if(p["kt"]==undefined) return false;
	if(isArray(p["kt"])) {
		var pp = [];
		for(var i=0;i<p["kt"].length;i++) {
			for(var key in p) {
				if((p[key][i]!==undefined)&&(key!="zm")) {
					pp[key] = p[key][i];
				}
			}
			permalinks_to_det(pp);
		}
	} else {
		//one
		if(dets[det_index]!=undefined) det_index++;
		var det_obj = clone(default_det);
		for(var i in p) {
			switch(i) {
				case "zm":
					//ignore
				break;
				case "lat": case "lng":
					switch(MODE){
						case GMAP:
							det_obj["pos"] = new google.maps.LatLng(parseFloat(p["lat"]), parseFloat(p["lng"]));
						break;
						case LLET:
							det_obj["pos"] = L.latLng(parseFloat(p["lat"]), parseFloat(p["lng"]));		
						break;
					}
				break;
				case "psi":case "rem": case "therm": case "fallout_rad_doses":
					det_obj[i] = p[i].split(",");
				break;
				default:
					if((default_det[i]===true)||(default_det[i]===false)) {
						det_obj[i] = p[i]=="1"?true:false;
					} else {
						det_obj[i] = parseFloat(p[i]);
					}
				break;
			}
		}
		dets[det_index] = clone(det_obj);
		dets[det_index].linked = true;
	}
}

function loadingDiv(toggle) {
	if(toggle) {
		var d = document.createElement('DIV');
		d.id = "loadingDiv";
		d.innerHTML = "<h2>Loading permalink settings... <img src='images/progress.gif'/></h2><small><a href='https://web.archive.org/web/20220204010623/http://nuclearsecrecy.com/nukemap/'>Click here to cancel.</a>";
		document.getElementById("bottomFrame").appendChild(d);
	} else {
		var d =	document.getElementById("loadingDiv");
		d.parentNode.removeChild(d);
	}
}

function hash_request(hash) {
	$.ajax({
	  type: "POST",
	  dataType: "json",
	  url: "permalink.php",
	  data: { t: hash },
	  success: function(data) {
		if(data.status=="SUCCESS") {
			var u = getUrlVars(data.link);
			permalinks_to_det(u);
			if(dets.length) {
				init(dets[dets.length-1].pos,parseInt(u["zm"]));
				for(var i = 0; i<dets.length;i++) {
					launch(true,dets[i],i);
					if(i<dets.length-1) {
						detach(true);
					}
				}
				document.getElementById('theKt').value = dets[det_index].kt;
				loadingDiv(false);
			} else {
				console.log(data);
				loadingDiv(false);		
				alert("There was an unspecified error loading the link you followed. Sorry.");
				init();
			}
		} else {
			loadingDiv(false);
			alert("There was an error loading the link you followed. Error message: "+data.error);
			init();
		}	  
	  }
	});
}

//generates a permalink hash
function fetchHash() {
	document.getElementById("permalink").innerHTML = "Generating permalink... <img src='images/progress.gif'/>";

	var perms = '';
	for(var i=0;i<=det_index;i++) {
		perms+=object_to_urlstring(dets[i],i);
	}
	perms+="&zm=" + map.getZoom();

	$.ajax({
	  type: "POST",
	  dataType: "json",
	  url: "permalink.php",
	  data: { link: perms },
	  success: function(data) {
		if(data.status=="SUCCESS") {
			document.getElementById("permalink").innerHTML = "<a href='"+window.location.pathname+"?t="+data.hash+"'>Permanent link to these settings</a>";
		} else {	
			document.getElementById("permalink").innerHTML = "<a href='#' onclick='fetchHash();'>Generate permanent link to these settings</a>"
			alert("There was an error creating the link. Please try again. Error message: "+data.error);
		}
	  }
	});	

}

//converts an airburst to a surface burst
function switch_to_surface() {
	dets[det_index].airburst = false;
	launch(true,dets[det_index],det_index);
}

//toggles a map overlay
var logo;
function map_logo(remove_it) {
	switch(MODE) {
		case GMAP:
			if(!remove_it) {
				logoDiv = document.createElement('div');
				var LogoControl = new logoControl(logoDiv, map);
				logoDiv.index = 1;
				map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(logoDiv);
			} else {
				map.controls[google.maps.ControlPosition.BOTTOM_LEFT].clear();
			}
		break;
		case LLET:
			if(!remove_it) {
				L.Control.Watermark = L.Control.extend({
					onAdd: function(map) {
						var logoText = L.DomUtil.create('div');
						logoText.id = 'logo';
						logoText.innerHTML = "<big>NUKEMAP</big><sub>"+ver+"</sub>";
						return logoText;
					},
					onRemove: function(map) {
						
					}
				});

				L.control.watermark = function(opts) {
					return new L.Control.Watermark(opts);
				}

				logo = L.control.watermark({ position: 'bottomleft' }).addTo(map);
			} else {
				logo.remove();
			}	
		break;
	}
}

function logoControl(controlDiv, map) {
  // Set CSS for the control interior
  var logoText = document.createElement('div');
  logoText.id = 'logo';
  logoText.innerHTML = "<big>NUKEMAP</big><sub>"+ver+"</sub>";
  controlDiv.appendChild(logoText);
}




//allows you to disable some aspects of interface so you can embed it
function applyLite(settings) {
	var oSettings = settings.split(",");
	if(oSettings.length>0) {
		$("#endnote").html("<hr><small>You are viewing an embedded version of the NUKEMAP with some of its options or interface limited. For the full NUKEMAP, please <a href='https://web.archive.org/web/20220204010623/http://nuclearsecrecy.com/nukemap/'>visit the NUKEMAP homepage</a>.</small>");
	}
	for(i in oSettings) {
		switch(oSettings[i]) {
			case "city":
				$("#city").hide();
				$("#city_hr").hide();
				$("#numbered_2").html(parseInt($("#numbered_2").html())-1);
				$("#numbered_3").html(parseInt($("#numbered_3").html())-1);
				$("#numbered_4").html(parseInt($("#numbered_4").html())-1);
			break;
			case "city_preset":
				$("#city_preset").hide();
			break;
			case "city_input":
				$("#city_input").hide();
			break;
			case "yield":
				$("#yield_div").hide();
				$("#yield_hr").hide();
				$("#numbered_3").html(parseInt($("#numbered_3").html())-1);
				$("#numbered_4").html(parseInt($("#numbered_4").html())-1);
			break;
			case "yield_preset":
				$("#preset").hide();
				$("#preset_br").hide();
			break;
			case "faq":
				$("#faq_line").hide();
			break;
			case "nm3d":
				$("#nukemap3d").hide();
			break;
			case "options":
				$("#basic_options_hr").hide();
				$("#basic_options").hide();
				$("#numbered_4").html(parseInt($("#numbered_4").html())-1);
			break;
			case "advoptions":
				$("#adv_options_hr").hide();
				$("#adv_options").hide();
			break;
			case "social":
				$("#shares_hr").hide();
				$("#shares").hide();
			break;
			case "otheroptions":
				$("#other_options_hr").hide();
				$("#other_options").hide();
			break;
			case "footer":
				$("#footer_hr").hide();
				$("#footer").hide();
			break;
			case "b_clear":
				$("#button_clear").hide();
			break;
			case "b_probe":
				$("#button_probe").hide();
			break;
			case "b_center":
				$("#button_center").hide();
			break;
			case "b_detach":
				$("#button_detach").hide();
			break;
			case "b_other":
				$("#buttons_other").hide();
			break;
			case "b_note":
				$("#button_note").hide();
			break;
			case "detonate":
				$("#detonate_div").hide();
			break;
			case "permalink":
				$("#thePermalink").hide();
			break;
			case "legend_hr":
				hide_legend_hr = true;
			break;
			case "legend":
				$("#theLegend").hide();
			break;
			case "fallout":
				$("#theLegendFallout").css("display","none");
			break;
			case "places":
				$("#theLegendPlaces").hide();
			break;
			case "small":
				var newWidth = 250;
				$("#topFrame").css("width",newWidth-10);
				$("#theLegend").css("font-size","9pt");
				$("#createdby").css("font-size","10pt");
				$("#theMap").css("right",newWidth+20);
				$("#topFrame").css("width",newWidth-10);
				$("#bottomFrame").css("width",newWidth-10);
				$("#theSettings").css("width",newWidth);
				$("#theSettings").css("width",newWidth);
			break;						
			case "classic":
				$("#classic_link").hide();
				$("#classic_link_hr").hide();
			break;
			case "minify":
				$('#topFrame').hide();
				$('#bottomFrame').hide();
				$('#theSettings').addClass('settingsMin');
				$('#theMap').addClass('mapMax');
				$('#hiddenFrame').show();
				map_logo(0);
			break;
		}
	}
}

//tries to load detonations in an external file
function loadExternalDets(det_file) {
	$.ajax({
	  type: "GET",
	  dataType: "jsonp",
	  url: "../nukemap_shared/loadtxt.php",
	  data: { file: det_file },
	  success: function(data) {
		if(data.status=="SUCCESS") {
			var pt = data.txt;
		} else {
			console.log("Could not load external file -- error: "+data.status);
			var pt = "";
		}
		var u = getUrlVars(pt);
		permalinks_to_det(u);
		if(dets.length) {
			init(dets[dets.length-1].pos,parseInt(u["zm"]));
			for(var i = 0; i<dets.length;i++) {
				launch(true,dets[i],i);
				if(i<dets.length-1) {
					detach(true);
				}
			}
			document.getElementById('theKt').value = dets[det_index].kt;
			loadingDiv(false);
		} else {
			init();
			loadingDiv(false);		
		}
	}
  })
}

function getlocalwind() {
	var loc = getPosition(marker);
	var loc_lat = latval(loc);
	var loc_lng = lngval(loc);
		
	var url = "//web.archive.org/web/20220204010623/https://api.openweathermap.org/data/2.5/weather?lat="+loc_lat+"&lon="+loc_lng+"&units=imperial&appid=8a6e14520bf547360b7885f3d7d3df66";

	$.ajax({
	  url: url
	  })
	  .done(function( data ) {
	  	if(data) {
	  		console.log("OpenWeatherMap",data);
	  		if(data.wind) {
                if(!data.wind.deg) {
                    alert("Could not determine the local wind direction for that position -- sorry. Try again nearby.")
                } else {
    	  			$("#fallout_angle").val(Math.round(data.wind.deg));
    	  		}
    	  		if(!data.wind.speed) {
                    alert("Could not determine the local wind speed -- sorry.")
                } else {
    	  			$("#fallout_wind").val(Math.round(data.wind.speed));
                }
				update_fallout();
	  		} else {
                alert("Sorry, for some reason, the application could not retrieve local wind conditions.");	  		
	  		}
            $("#wind_prog").html("");
            $("#get_local_wind").show();
	  	} else {
	  	    alert("Sorry, for some reason, the application could not retrieve local wind conditions.");
            $("#wind_prog").html("");
            $("#get_local_wind").show();
	  	}
	  });
}

function update_fallout() {
	if(dets[det_index]) {
		dets[det_index].fallout_wind = $("#fallout_wind").val();
		dets[det_index].fallout_angle = $("#fallout_angle").val();
		dets[det_index].ff = $("#fallout_fission").val();
		if(dets[det_index].fallout) {
			if(dets[det_index].hob_ft&&dets[det_index].airburst) {
				do_fallout(dets[det_index].kt,dets[det_index].fallout_wind,dets[det_index].ff,dets[det_index].fallout_angle,"theLegendFallout",dets[det_index].airburst,dets[det_index].hob_ft);
			} else {
				do_fallout(dets[det_index].kt,dets[det_index].fallout_wind,dets[det_index].ff,dets[det_index].fallout_angle,"theLegendFallout",dets[det_index].airburst);
			}
		}
		update_permalink();
	}
}

//simple linear interpolation -- returns x3 for a given y3
function lerp(x1,y1,x2,y2,y3) {
	if(y2==y1) {
		return false; //division by zero avoidance
	} else {
		return ((y2-y3) * x1 + (y3-y1) * x2)/(y2-y1);
	}
}


if (typeof register == 'function') { register("nukemap2.js"); }


}
/*
     FILE ARCHIVED ON 01:06:23 Feb 04, 2022 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 16:51:44 Feb 27, 2022.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 95.104
  exclusion.robots: 0.088
  exclusion.robots.policy: 0.081
  RedisCDXSource: 0.962
  esindex: 0.009
  LoadShardBlock: 67.034 (3)
  PetaboxLoader3.datanode: 274.893 (5)
  CDXLines.iter: 18.094 (3)
  load_resource: 285.442 (2)
  PetaboxLoader3.resolve: 71.574 (2)
*/