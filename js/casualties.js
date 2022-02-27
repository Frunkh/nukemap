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

var changeInterval = 20;
var totalTime = 1000*5;
var odometer = true;
var popDebug = false;
var hideCasualtiesProgress = false;
var totalInjuries=0;
var totalFatalities=0;
var currentNumber;

var popTimerTimeout = 1000*60*2; //2 minutes

var popTimerInProgress = false;
var popTimer;

var waiting_for_pop = [];

var faq_link = "https://web.archive.org/web/20220204010625/http://nuclearsecrecy.com/nukemap/faq/#casualties";

var total_injuries = 0;
var total_fatalities = 0;
var unlimited = "";

var casualty_cache = [];
var casualty_results = [];
var casualty_query_id = undefined;
var casualty_index = 0;
var overlapping_dets = [];
var overlapping_det_caches = [];
var cancel_casualties = false;
var casualty_info_div = "";


/* to do


*/

//new function -- does all dets as one big request
//updated -- now breaks it into smaller requests of overlapping detonations. should speed things up and keep MySQL from getting overloaded.
function get_casualties_multi(dets, div) {
	/*
	timeout option -- not sure this is useful anymore? if it times out, it should tell the user.
	
	if(popTimerInProgress) {
		//keeps them from clicking it while an existing calculation is being run
		$("#slowdown").html("<b>Please wait until the existing calculation is finished before running another one.</b> ");
		return false;
	} else {
		popTimerInProgress = true;
		popTimer = window.setTimeout(function() {
			if(popTimerInProgress) {
				$("#"+div).html("<hr>Casualty calculation appears to have timed out. Please try again later. Sorry!");
				popTimerInProgress = false;
			}
		},popTimerTimeout)
	}*/
	casualty_info_div = div;

	if(typeof casualty_query_id != "undefined") {
		query_modal(header="Cancel the current query?",contents="<p>There is a query to the casualty database already running. Cancel it and start a new one?</p>",buttons=["OK","Cancel"],end_function=function(c) {
			if(c===0) {
				casualty_query_id = undefined;
				get_casualties(dets,div);
			}
		});
		return;
	}
	
	popTimerInProgress = false;
	
	var cd = new Date();
	cqid = hashCode(cd.getDate() + "/"
			+ (cd.getMonth()+1)  + "/" 
			+ cd.getFullYear() + " @ "  
			+ cd.getHours() + ":"  
			+ cd.getMinutes() + ":" 
			+ cd.getSeconds() 
	);
	if(casualty_query_id == cqid) { //they hit it twice or something		
		return; 
	} else {
		casualty_query_id = cqid;
	}
	casualty_results = [];

	url = "../";
	if(!admin) admin = 0;
	c_dets = [];
	for(var i in dets) {
		c_dets.push({
			lat: Math.round(lat(dets[i].pos),3),
			lng: Math.round(lng(dets[i].pos),3),
			kt: dets[i].kt,
			airburst: (dets[i].airburst?1:0),
			hob_opt: (dets[i].hob_opt?dets[i].hob_opt:2),
			hob_ft: dets[i].hob_ft,
			det: i
		});
	}
	overlapping_dets = [];
	overlapping_dets_caches = [];
	if(c_dets.length>1) { 
		var d_group = det_groups(c_dets);
		for(var i in d_group) {
			overlapping_dets[i] = [];
			for(var z in d_group[i]) {
				overlapping_dets[i].push(c_dets[d_group[i][z]]);
			}
			//casualty_results[i] = unde;
		}
	} else {
		overlapping_dets[0] = [c_dets[0]];
		//casualty_results[0] = undefined;
	}
	
	for(var i in overlapping_dets) {
		let str = "";
		for(let d of overlapping_dets[i]) {
			str+=d.lat.toString()+d.lng.toString()+d.kt.toString()+d.airburst.toString()+d.hob_opt.toString()+d.hob_ft.toString(); //this is not an appropriate hashing function
		}
		let hash = "_"+hashCode(str);
		if(is_set(()=>casualty_cache[hash])) {
			casualty_results[i] = casualty_cache[hash];
		} else {
			casualty_cache[hash] = {};
			overlapping_dets_caches[i] = hash;
		}
	}
	casualty_index = 0;

	cancel_casualties = false;

	get_next_casualties();
}

function casualty_cancel() {
	query_modal(header="Cancel the current query?",contents="<p>A casualty query is currently running. Are you sure you want to cancel it?</p>",buttons=["OK","Cancel"],end_function=function(c) {
		if(c===0) {
			cancel_casualties = true;
			casualty_query_id = undefined;
			$("#"+casualty_info_div).html("<hr>Casualty calculation cancelled by user. Any received results have been locally cached. <button onclick='clear_casualty_div();'>OK</button>");
		}
	});
}

function clear_casualty_div() {
	$("#"+casualty_info_div).html("");
}

function get_next_casualties() {
	if(popDebug) console.log("get_next_casualties", casualty_index);
	if(cancel_casualties) return;

	if(is_set(()=>casualty_results[casualty_index])) {
		if(popDebug) console.log("Already have results", casualty_results[casualty_index]);
		//add to counter
		if(casualty_index<overlapping_dets.length-1) {
			casualty_index++;
			get_next_casualties();
			return;
		} else {
			// all done, show results	
			casualty_index = false;
			casualty_query_id = undefined;
			show_casualty_results();
			return;
		}
	}

	var c_dets = overlapping_dets[casualty_index];

	var request = { dets: c_dets, admin: admin, id: casualty_query_id, index:casualty_index, unlimited: unlimited, hash: overlapping_dets_caches[casualty_index] };

	if(overlapping_dets.length>1) {
		if(!hideCasualtiesProgress) $("#"+casualty_info_div).html("<hr>Calculating casualties (sending query "+(casualty_index+1)+" of "+overlapping_dets.length+")... <span id='slowdown'></span><span id='progress'></span> <button onclick='casualty_cancel()'>Cancel</button>");
	} else {
		if(!hideCasualtiesProgress) $("#"+casualty_info_div).html("<hr>Calculating casualties... <span id='slowdown'></span><span id='progress'></span> <button onclick='casualty_cancel()'>Cancel</button>");	
	}


	if(popDebug) console.log("Making Ajax call...", request, overlapping_dets);


	$.ajax({
		type:"POST",
		dataType: "jsonp",
		url:url+"nukemap_shared/casualties.php",
		data: request,
	})
	.done(function(result) {

		var r = result;
		if(popDebug) console.log(r);
		
		if(r.id != casualty_query_id) {
			//this is an old response, but let's keep the info anyway
			if(r.hash) {
				casualty_cache[r.hash] = r;
			}
			return;
		}
		if(r.status == "SUCCESS") {
			if(r.hash) {
				casualty_cache[r.hash] = r;
			}
			if(r.index) {
				casualty_results[r.index] = r;
			}
			get_next_casualties();
		} else if(r.status=="ERROR") {	
			var err_msg;
			switch(r.error) {
				case "BAD_REQUEST": err_msg = "Bad request (invalid detonation parameters)."; break;
				case "DISABLED": err_msg = "The casualty calculation is temporarily disabled (possibly because of high amounts of traffic). Please try again later."; break;
				case "MAX_DETS": err_msg = "Because of high traffic, the maximum number of detonations that casualties will be calculated for has been temporarily limited to "+r.max+" detonation(s)."; break;
				case "MAX_OVERLAPPING_DETS": err_msg = "Your casualty query has too many overlapping detonations to be processed. Currently, the server is set to only allow "+r.max+" overlapping detonation(s). This may be because the server is under a lot of strain at the moment. If you have a legitimate reason for needing the results of queries of this complexity, If you have a good reason for running such intensive calculations, <a href='https://web.archive.org/web/20220204010625/https://nuclearsecrecy.com/faq/#contact'>get in touch</a>."; break;
				case "OVER_TIME": err_msg = "Your casualty calculation took too many server resources and was cancelled. Please reduce the number of overlapping detonations (which are what cause it to do this). If you have a legitimate reason for needing the results of queries of this complexity, If you have a good reason for running such intensive calculations, <a href='https://web.archive.org/web/20220204010625/https://nuclearsecrecy.com/faq/#contact'>get in touch</a>."; break;
				default: err_msg = "An unknown error was returned."; break;
			}
			
			var o = "<hr><div id='casualty_info'><b>Error calculating casualties:</b> "+err_msg+"</div>";
			casualty_query_id = undefined;
			$("#"+casualty_info_div).html(o);
		}
	})
	.error(function(jqxhr,textStatus,errorThrown) {
		if(errorThrown) {
			$("#"+casualty_info_div).html("<hr>Sorry, casualties could not be estimated. Error message: AJAX request error \""+htmlEntities(errorThrown)+"\"");
			console.log(jqxhr,textStatus,errorThrown);
			if(popDebug) {
				var output = '';
				for (property in jqxhr) {
				  output += property + ': ' + jqxhr[property]+'; ';
				}
				console.log(output);	
			}
		} else {
			$("#"+casualty_info_div).html("<hr>Sorry, the request to the casualty database timed out, probably a lot of other people are making requests of it at the moment. Please feel free to try again, though.");		
			if(popDebug) console.log(jqxhr,textStatus,errorThrown);
			if(popDebug) {
				var output = '';
				for (property in jqxhr) {
				  output += property + ': ' + jqxhr[property]+'; ';
				}
				console.log(output);	
			}
		}

	})

}

//displays the results
function show_casualty_results() {

//process all results
	if(popDebug) console.log("Showing results------");

	if(popDebug) console.log(casualty_results);

		popTimerInProgress = false;
		window.clearTimeout(popTimer);

		var info_div = "<div id='casualty_info'>";

		var total_injuries = 0;
		var total_fatalities = 0;
		var psi_1 = 0;
		var total_dets = 0;
		var od = "";
		
		for(var z in casualty_results) {
			r = casualty_results[z];
			
			if(r.status=="SUCCESS") {

				total_injuries+= r.injuries;
				total_fatalities+= r.fatalities;
				psi_1+= r.psi_1;
				
				var has_errors = false;
				var error_count = 0;
			
				for(var i in r.dets) {
					if(typeof r.dets[i].error != "undefined") {
						has_errors = true;
						error_count++;
					}
				}
				total_dets+=(+r.dets[0].count);
		
				for(var i in r.dets) {
					od+="<p class='det_group'><small><b>CASUALTY QUERY "+(+z+1)+"</b></small>";
					if(typeof r.dets[i].error != "undefined") {
						if(r.dets[i].error=="OVER_TIME") {
							od+="<ul>This detonation group took too many server resources to calculate and the calculation was halted. Try using less overlapping detonations, or a smaller yields. If you have a good reason for running such intensive calculations, <a href='https://web.archive.org/web/20220204010625/https://nuclearsecrecy.com/faq/#contact'>get in touch</a>.</ul>";
						} else {
							od+="<ul>This detonation group triggered an unknown database error. You can try it again. If it persists, please <a href='https://web.archive.org/web/20220204010625/https://nuclearsecrecy.com/faq/#contact'>get in touch</a> and send me the permalink to your detonation settings and the following information: Error #"+r.dets[i].error_no+": &quot;"+htmlEntities(r.dets[i].error_desc)+".&quot;</ul>";	
						}
					} else {
						for(var x=0;x<r.dets[i].count;x++) {
							var dr = r.det_request[r.det_index[i][x]];
							od+="<ul><b>Detonation #"+(+dr.det+1)+"</b>, "+ktOrMt(dets[dr.det].kt,true)+" (<a href='#' onclick='jump_to_latlng(["+dets[dr.det].pos.lat+","+dets[dr.det].pos.lng+"]); return false;'>"+Math.round(dets[dr.det].pos.lat,3)+", "+Math.round(dets[dr.det].pos.lng,3)+"</a>)";
							od+="<ul>";
							od+="<li>Fatalities: "+addCommas(r.dets[i]["running_total_fatalities_by_det_"+x]);
							od+="<li>Injuries: "+addCommas(r.dets[i]["running_total_injuries_by_det_"+x]);
							od+="</ul></ul>";
						}
					}
				}

			}
		}

		if(error_count<casualty_results.length) {

			if(psi_1>=0) {
				info_div+= "In any given 24-hour period, there are on average "+addCommas(Math.round(psi_1))+" people in the light (1 psi) blast range of the simulated detonation"+(total_dets>1?"s":"")+". ";
			}
			info_div+= "<hr>Modeling casualties from a nuclear attack is difficult. These numbers should be seen as evocative, not definitive. Fallout effects are deliberately ignored, because they can depend on what actions people take after the detonation. For more information about the model, <a href='"+faq_link+"'>click here</a>.";
			info_div+="</div>";

			if(odometer) {
				var o = "<hr>";
					o+="Estimated fatalities: <span class='casualty' id='fatalities'>0</span>Estimated injuries: <span class='casualty' id='injuries'>0</span>";
					if(total_dets>1) {
						o+="<hr>";
						if(has_errors) {
							o+="The numbers shown are the sum totals of multiple detonations. <b>Some of the detonation settings produced errors and could not be calculated.</b> To see them broken down detonation-by-detonation, <a href='#' onclick='$(\"#casualties_detail\").show(); return false;'>click here</a>.";
						} else {
							o+="The numbers shown are the sum totals of multiple detonations. To see them broken down detonation-by-detonation, <a href='#' onclick='$(\"#casualties_detail\").show(); return false;'>click here</a>.";
						}
						o+="<div id='casualties_detail'>";
						o+="<p><small>The results below are for "+(total_dets)+" detonations. These are grouped into several different queries (based on whether they overlap), and then processed in a sequential order, to avoid &quot;double-counting&quot; of casualties. The numbers for each detonation group should be understood as a &quot;running total&quot; of sequential detonations.</small>";
						o+=od;
						o+="<p><a href='#' onclick='$(\"#casualties_detail\").hide(); return false;'>Hide these details</a>";
						o+="</div><hr>";
					}
				o+= info_div;
				$("#"+casualty_info_div).html(o);
				countThem(Math.round(total_fatalities,-1), changeInterval, totalTime, $('#fatalities'));    
				countThem(Math.round(total_injuries,-1), changeInterval, totalTime, $('#injuries')); 
			} else {
				$("#"+casualty_info_div).html("<hr>Estimated fatalities: <span id='fatalities'>"+addCommas(total_fatalities)+"</span>Estimated injuries: <span id='injuries'>"+addCommas(total_injuries)+"</span>"+info_div);
			}
		} else {
			var o = "<hr><div id='casualty_info'><b>Error calculating casualties:</b> "+od+"</div>";
			$("#"+casualty_info_div).html(o);
		}

}


//old function -- does individual requests. deprecated!
function get_casualties(lat,lng,kt,airburst,hob_opt,hob_ft,div,index) {
	if(!hideCasualtiesProgress) $("#"+div).html("<hr>Calculating casualties... this can take upwards of a minute or two depending on how many people are using this site. Thank you for your patience! <span id='progress'></span>");
	if(!index) {
		if(det_index>1) {
			for(var i=det_min;i<det_index;i++) {
				if(dets[i].fatalities==undefined||dets[i].casualties==undefined) {
					get_casualties(dets[i].lat,dets[i].lng,dets[i].kt,dets[i].airburst,dets[i].hob_opt,dets[i].hob_ft,div,i);
				}
			}
		}
	}
	
	if(!index) index = det_index;
	if(!admin) admin = 0;
	
	totalInjured = 0;
	totalFatalities = 0;
	var pop_request = {lat:lat,lng:lng,kt:kt,airburst:airburst?1:0,hob_opt:hob_opt?1:0,hob_ft:hob_ft,div:div,index:index, admin:admin};
	if(popDebug) console.log("Making casualty request",pop_request);
	waiting_for_pop[index] = true;
	var poptimeout = window.setTimeout(pop_timer,popTimerTimeout,index,pop_request);
	url = "../";
	if(popDebug) console.log("Requesting to "+url+"nukemap_shared/casualties.php");
	$.ajax({
		type:"GET",
		dataType: "jsonp",
		url:url+"nukemap_shared/casualties.php",
		data: { lat: lat, lng: lng, kt: kt, airburst: airburst?1:0,hob_opt:hob_opt?1:0,hob_ft:hob_ft, index: index, admin:admin },
		complete: function () {
				console.log(this.url);
		}
	})
	.done(function(result) {
		waiting_for_pop[index] = false;
		var r = result;
		if(popDebug) console.log(r);
		console.log(r);
		if(r.status=="SUCCESS") {
			totalInjuries = Math.round(r.injuries);
			totalFatalities = Math.round(r.fatalities);
			if(popDebug) { 
				if(r[1]!==undefined) {
					if(r[1].data!==undefined) {
						dots(r[1].data); 
					}
				}
			}
			dets[r.index].fatalities = totalFatalities;
			dets[r.index].injuries = totalInjuries;
			dets[r.index].psi_1 = r.psi_1;

			currentNumber = 0;
			var info_div = "<div id='casualty_info'>";
				if(dets[det_index].psi_1) {
					info_div+= "In any given 24-hour period, there are approximately "+addCommas(Math.round(dets[det_index].psi_1))+" people in the 1 psi range of the most recent detonation. ";
				}
				info_div+= "<hr>Modeling casualties from a nuclear attack is difficult. These numbers should be seen as evocative, not definitive. Fallout effects are ignored. For more information about the model, <a href='"+faq_link+"'>click here</a>.";
				info_div+="</div>";

			if(det_index>det_min) {
			var running_total = "";
				running_total+="<div id='running_total'><small>RUNNING TOTAL FOR "+(det_index+1-det_min)+" DETONATIONS</small><br>";
				running_total+="Estimated fatalities: <span class='casualty' id='fatalities_total'>0</span>Estimated injuries: <span class='casualty'  id='injuries_total'>0</span>";
				running_total+="</div>";
				running_total+="<small>MOST RECENT DETONATION</small><br>";
				var runningFatalities = 0;
				var runningInjuries = 0;
				for(var i=det_min;i<=det_index;i++) {
					if(dets[i].fatalities) {
						runningFatalities+=dets[i].fatalities;
					}
					if(dets[i].injuries) {
						runningInjuries+=dets[i].injuries;
					}
				}
			} else {
				running_total = "";
			}

			if(odometer) {
				var o = "<hr>"+running_total;
					if(dets[det_index].fatalities==undefined) {
						o+="Still calculating...";
					} else {
						o+="Estimated fatalities: <span class='casualty' id='fatalities'>0</span>Estimated injuries: <span class='casualty' id='injuries'>0</span>";
					}
					o+= info_div;
					
				$("#"+div).html(o);
				if(dets[det_index].fatalities!==undefined) {
					countThem(Math.round(dets[det_index].fatalities,-1), changeInterval, totalTime, $('#fatalities'));    
					countThem(Math.round(dets[det_index].injuries,-1), changeInterval, totalTime, $('#injuries')); 
				}
				if(runningFatalities) countThem(Math.round(runningFatalities,-1),changeInterval,totalTime,$("#fatalities_total"));
				if(runningInjuries) countThem(Math.round(runningInjuries,-1),changeInterval,totalTime,$("#injuries_total"));
			} else {
				$("#"+div).html("<hr>Estimated fatalities: <span id='fatalities'>"+addCommas(totalFatalities)+"</span>Estimated injuries: <span id='injuries'>"+addCommas(totalInjuries)+"</span>"+info_div);
			}
		} else {
			var msg = "<hr>Sorry, casualties could not be estimated.";
			if(r!=undefined) {
				if(r.error!=undefined) {
					msg+=" Error message: " + htmlEntities(r.error);
				} else {
					msg+=" There was no further error message to report. The population database may be down. Try again later.";
				}
			} else {
				msg+=" There was no further error message to report. The population database may be down. Try again later.";
				
			}
			$("#"+div).html(msg);
		}
	}).error(function(jqxhr,textStatus,errorThrown) {
		if(errorThrown) {
			$("#"+div).html("<hr>Sorry, casualties could not be estimated. Error message: AJAX request error \""+errorThrown+"\"");
			if(popDebug) console.log(jqxhr,textStatus,errorThrown);
			if(popDebug) {
				var output = '';
				for (property in jqxhr) {
				  output += property + ': ' + jqxhr[property]+'; ';
				}
				console.log(output);	
			}

		} else {
			$("#"+div).html("<hr>Sorry, the request to the casualty database timed out, probably a lot of other people are making requests of it at the moment. Please feel free to try again, though.");		
			if(popDebug) console.log(jqxhr,textStatus,errorThrown);
			if(popDebug) {
				var output = '';
				for (property in jqxhr) {
				  output += property + ': ' + jqxhr[property]+'; ';
				}
				console.log(output);	
			}
		}
	});
}

//part of the old function -- deprecated
function pop_timer(d_index,pop_info) {
	if(d_index==det_index&&pop_info.kt==dets[det_index].kt) { //try to cancel out multiple calls
		if(waiting_for_pop[d_index]==true) {
			document.getElementById(pop_info.div).innerHTML = document.getElementById(pop_info.div).innerHTML+" ...Hmm. The casualties estimator request is taking an unusually long time to process. Sorry about that!";
		}
	}
}

//deprecated
function get_casualties_again(lat,lng,kt,airburst,hob_opt,hob_ft,div) {
	get_casualties(lat,lng,kt,airburst,hob_ft,div);
}

//does the "odometer" effect
function countThem(total, delay, totalTime, element, decimals) {
    var number = 0,
    startTime = newTime = new Date();

    decimals = 0;

    element.html(addCommas(number));

    var interval = setInterval(function() {    	
        newTime = new Date();
        number = Math.min(total * ((newTime - startTime) / totalTime), total);

        number = Math.round(number);

		element.html(addCommas(number));
        if(number >= total) {
            clearInterval(interval);
        }
    }, delay);
}

//adds commas to large numbers
function addCommas(nStr) {
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

var popdots = [];


//not really used -- was for debugging. 
function dots(data) {
	if(popdots.length) {
		for(var i=0; i<popdots.length;i++) {
			popdots[i].setMap(null);
		}
		popdots=[];
	}
	for(var i=0;i<data.length;i++) {
		popdots.push(new google.maps.Marker({
			map: map,
			position: new google.maps.LatLng(data[i][0], data[i][1]),
			icon: {
  			  path: google.maps.SymbolPath.CIRCLE,
			  scale: 4,
			  fillColor: "#"+colorStep(data[i][2],15000,"FFFF00","FF0000","800000","000000"), 
			  fillOpacity: 1,
			  strokeColor: '#bd8d2c',
			  strokeWeight: 1
			},
			title: data[i][2],
		}));	
	}

}


//pans the map to [lat,lng]
function jump_to_latlng(pos) {
	panToLatLon(map,pos[0],pos[1]);
}

//for errors
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/*test:


https://localhost/~pluto/nukemap2/?&kt[]=20&lat[]=40.72422&lng[]=-73.99611&airburst[]=0&hob_ft[]=0&psi[]=20,5,1&kt[]=10&lat[]=40.74050577&lng[]=-74.097692&airburst[]=0&hob_ft[]=0&psi[]=20,5,1&kt[]=10&lat[]=40.753816&lng[]=-74.061682&airburst[]=0&hob_ft[]=0&psi[]=20,5,1&kt[]=10&lat[]=40.743355&lng[]=-74.205236&airburst[]=0&hob_ft[]=0&psi[]=20,5,1&zm=13

*/

//sorts detonations into groups on the basis of whether they overlap or not
function det_groups(dets) {


	/* quick pre-processing to get largest radii and assign indexes */
	for(var k in dets) {
		var d = dets[k];
		dets[k]["rad_actual"] = bc.range_from_psi_hob(d["kt"],1,d["hob_ft"])*ft2km; 
		dets[k]["i"] = +k; 
	}

	var dets_combs = [];
	var dets_combs1 = get_combs(array_keys(dets));
	
	for(var i in dets_combs1) {
		d = dets_combs1[i];
		if(d.length==2) {
			dets_combs.push(d);
		}
	}

	/*  then we interate over them. this works by assigning the first det to a bucket,
		and then checking each entry to see if it is in a bucket with another det already.
		if they are in the same bucket, it moves on. if they are in different buckets, it sees if they
		intersect, and if they do, it combines those buckets. if one or neither is not in a bucket,
		it checks if they intersect. if they do intersect, the non-bucket one is put into the existing
		bucket, or, if neither are in buckets, a new bucket is made with both. if they don't intersect,
		then the one that is not in a bucket starts a new bucket.
	*/
	var dets_bucket = [];
	for(var i in dets_combs) {
		d = dets_combs[i];
		var d1 = d[0];
		var d2 = d[1];
		if(i==0) { //initialize on first
			dets_bucket.push([d1]);
		}
		var d1_ib = false; //d1 in current bucket
		var d2_ib = false; //d2 in current bucket
		var d1_d2_sb = false; //d1 & d2 in same bucket
		var d1_d2_db = false; //d1 & d2 in different buckets
		var d1_db = -1; //index of bucket for d1
		var d2_db = -1; //index of bucket for d2

		for(var dbi in dets_bucket) {
			var db = dets_bucket[dbi];
			if(!d1_ib) {
				if(in_array(d1,db)) {
					d1_ib = true;
					d1_db = dbi;
				}
			}
			if(!d2_ib) {
				if(in_array(d2,db)) {
					d2_ib = true;
					d2_db = dbi;
				}
			}
			if(d1_ib && d2_ib && (d1_db==d2_db) ) {
				d1_d2_sb = true;
			} else {
				if(d1_ib && d2_ib) d1_d2_db = true;
			}
		}
		if(!d1_d2_sb) { //if they not in the same bucket (if they are already in the same bucket, do nothing)
			if(d1_d2_db) { //if they are in buckets but not the same
				if(intersects([[dets[d1]["lat"],dets[d1]["lng"],dets[d1]["rad_actual"]],[dets[d2]["lat"],dets[d2]["lng"],dets[d2]["rad_actual"]]])) {
					//if they intersect, then merge these two arrays
					var new_db = array_merge(dets_bucket[d1_db],dets_bucket[d2_db]);
					dets_bucket[d1_db] = new_db;
					dets_bucket.splice(d2_db,1); //kill the old bucket
				}
			} else { //they are not both in bucket
				if(d1_ib) { //if d1 is already in bucket, see if they intersect -- if so, add d2 to bucket, if not, d2 starts new bucket
					if(intersects([[dets[d1]["lat"],dets[d1]["lng"],dets[d1]["rad_actual"]], [dets[d2]["lat"],dets[d2]["lng"],dets[d2]["rad_actual"]]])) {
						dets_bucket[d1_db].push(d2);
					} else {
						dets_bucket.push([d2]);
					}
				} else if (d2_ib) { //if d2 is already in bucket... same as above but switched
					if(intersects([[dets[d1]["lat"],dets[d1]["lng"],dets[d1]["rad_actual"]], [dets[d2]["lat"],dets[d2]["lng"],dets[d2]["rad_actual"]]])) {
						dets_bucket[d2_db].push(d1);
					} else {
						dets_bucket.push([d1]);
					}
				} else { //if neither are in buckets, see if they are the same, if so, add to new bucket, if not, new buckets for each
					if(intersects([[dets[d1]["lat"],dets[d1]["lng"],dets[d1]["rad_actual"]], [dets[d2]["lat"],dets[d2]["lng"],dets[d2]["rad_actual"]]])) {
						dets_bucket.push([d1,d2]);
					} else {
						dets_bucket.push([d1]);
						dets_bucket.push([d2]);
					}                
				}
			}
		}
	}
	return dets_bucket;
}

//gets all possible combinations of an array
function get_combs(arr) {
    arr.sort();  //in case it's not sorted
	var num = arr.length; 

    var total = Math.pow(2, num);
    var result=[];
    var element=[];
    for (i = 0; i < total; i++) {
        for (j = 0; j < num; j++) {                 
            if(Math.pow(2,j) & i) element.push(arr[j]);                 
        }
        result.push(element);
        element=[];
    }
    var out = [];
    for(r in result) {
        if(result[r].length>1) out.push(result[r]);
    }
    return out;
}

/*
function that checks whether any arbitrary number of geo circles intersects -- returns true if they do, false if they don't.
not a true algebraic solution (which is hard to do for n circles), but it seems fast enough.

circles is an array of arrays -- each array within it defines a circle where:
        index 0 is lat (deg)
        index 1 is lng (deg)
        index 2 is radius (km)
this function will iterate over all of them and reject any that don't overlap
*/
function intersects(circles) {
    if(circles.length<2) return false; //if only one circle, or none, then it doesn't intersect
    var checked = []; //this allows us to avoid re-checking combinations already checked
    for(var k1 in circles) { //for each circle 
    	var c1 = circles[k1];
        for(k2 in circles) { //compare against all others
        	var c2 = circles[k2];
            if(k1!=k2) { //but not itself
                if(!is_set(()=>checked[k1][k2])&&!is_set(()=>checked[k2][k1])) { //and not those already compared
                    var dist = distance_between(c1[0],c1[1],c2[0],c2[1]); //distance between lat/lon points -- trig so kind of "expensive"
                    if(dist > c1[2]+c2[2]) { //compare distance with radii
                        return false; //distance is bigger -- just end it now!
                    } else { //otherwise, keep going, but mark this combination as checked
                    	if(!is_set(()=>checked[k1>k2?k2:k1])) checked[k1>k2?k2:k1] = [];
                        checked[k1>k2?k2:k1][k1>k2?k1:k2] = true; 
                    }
                } 
            }
        }
    }
    return true; //made it to the end, must all intersect
}

function array_keys(arr) {
	var arr2 = [];
	const i = arr.keys();
	for(const key of i) {
		arr2.push(key);
	}
	return arr2;
}


function in_array(needle, haystack) {
    var length = haystack.length;
    for(var i = 0; i < length; i++) {
        if(haystack[i] == needle) return true;
    }
    return false;
}


/**
 * Checks to see if a value is set.
 *
 * @param {Function} accessor Function that returns our value
 */
function is_set (accessor) {
  try {
    // Note we're seeing if the returned value of our function is not
    // undefined
    return typeof accessor() !== 'undefined'
  } catch (e) {
    // And we're able to catch the Error it would normally throw for
    // referencing a property of undefined
    return false
  }
}


function array_merge(array1, array2) {
	var array3 = [];
	for(var e of array1) {
		array3.push(e);
	}
	for(var e of array2) {
		array3.push(e);
	}
	return array3;

}

function hashCode(str) {
	var hash = 0;
	if (str.length == 0) return hash;
	for (i = 0; i < str.length; i++) {
		char = str.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}


if (typeof register == 'function') { register("casualties.js"); }

}
/*
     FILE ARCHIVED ON 01:06:25 Feb 04, 2022 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 16:51:47 Feb 27, 2022.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 138.655
  exclusion.robots: 0.092
  exclusion.robots.policy: 0.085
  RedisCDXSource: 1.347
  esindex: 0.01
  LoadShardBlock: 105.519 (3)
  PetaboxLoader3.datanode: 127.638 (5)
  CDXLines.iter: 19.501 (3)
  load_resource: 115.861 (2)
  PetaboxLoader3.resolve: 57.784 (2)
*/