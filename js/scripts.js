var ww = $(window).width();

$("#wealth input").keyup(function(){
	var val = $(this).val();
	d3.select("#guess")
			.classed("active", val == "" ? false : true)
			.classed("inactive", val == "" ? true : false)
});

$("#guess").width(d3.min([824 - 40, ww - 40]));

var handle_width = ww <= 480 ? 30 : 50,
	handle_start_val = 50,
	pointer_width = 30,
	slider_height = 20,
	handle_padding = 10,
	result_width = 30;

var setup = d3.marcon()
		.width($("#calculator").width())
		.height(handle_width * 2 + slider_height * 2 + handle_padding + result_width * 2)
		.left(handle_width)
		.right(handle_width)
		.bottom(result_width * 2 + handle_padding)
		.element("#range");

setup.render();

var range_width = setup.innerWidth(), range_height = setup.innerHeight(), range_svg = setup.svg();

var range_x = d3.scaleLinear()
		.range([0, range_width])
		.domain([0, 100]);

// the range scale
range_svg.append("rect")
		.attr("class", "range-body")
		.attr("x", 0)
		.attr("width", range_width)
		.attr("y", range_height - slider_height)
		.attr("height", slider_height);

// the handle
range_svg.append("circle")
		.attr("class", "range-dragger range-handle draggable")
		.attr("cx", range_x(handle_start_val))
		.attr("cy", range_height - handle_width - slider_height - handle_padding)
		.attr("r", handle_width);

// the label
range_svg.append("text")
		.attr("class", "range-label")
		.attr("x", range_x(handle_start_val))
		.attr("y", range_height - handle_width - slider_height - handle_padding)
		.attr("dy", ".3em")
		.text(handle_start_val);

// the pointer
range_svg.append("polygon")
		.attr("class", "range-dragger range-pointer draggable")
		.attr("points", calcPointerPoints(handle_start_val))
		

d3.selectAll(".draggable").call(d3.drag()
	.on("drag", dragged)
);

// the axis
var axis_data = [0, 25, 50, 75, 100];
range_svg.selectAll(".tick")
		.data(axis_data)
	.enter().append("text")
		.attr("class", "tick")
		.attr("x", function(d){ return range_x(d); })
		.attr("y", range_height + slider_height)
		.text(function(d){ return d; });

range_svg.append("text")
		.attr("class", "tick")
		.attr("x", range_width / 2)
		.attr("y", range_height + slider_height + 24)
		.text("Percentile");

function calcPointerPoints(handle_val){
	var point_c = range_x(handle_val) + "," + (range_height - slider_height);
	var point_a = (range_x(handle_val) - (pointer_width / 2)) + "," + (range_height - slider_height - 20);
	var point_b = (range_x(handle_val) + (pointer_width / 2)) + "," + (range_height - slider_height - 20);
	return point_a + " " + point_b + " " + point_c;
}

function dragged(){

	var coordinates = [0, 0];
  coordinates = d3.mouse(this);
  var x = coordinates[0];
  x = x > range_width ? range_width :
  	x < 0 ? 0 :
  	x;

  // find the pct represented by the mouse position
  var pct = Math.round(range_x.invert(x));
  
  range_svg.select(".range-handle")
  		.attr("cx", range_x(pct));

  range_svg.select(".range-label")
  		.attr("x", range_x(pct))
  		.text(pct);

  range_svg.select(".range-pointer")
  		.attr("points", calcPointerPoints(pct));

}

$(".play-again").click(function(){
  $(".hide-after-guess").fadeIn();
  $("#output").fadeOut();

  d3.selectAll(".draggable")
  	.call(d3.drag().on("drag", dragged))
  	.style("cursor", "pointer");

  range_svg.select(".range-handle")
  		.attr("cx", range_x(handle_start_val));

  range_svg.select(".range-label")
  		.attr("x", range_x(handle_start_val))
  		.text(handle_start_val);

  range_svg.select(".range-pointer")
  		.attr("points", calcPointerPoints(handle_start_val));

  $(".result-flag").remove();
  $(".result-flag-label").remove();
  $(".result-rect").remove();

  $("#wealth input").val("");

});

$(document).on("click", "#guess.active", function(){

	var wealth = $("#wealth input").val();
	var dollars = wealth * 0.015;
	var pct_actual = calcPct(dollars);
	var pct_guess = +$(".range-label").text();
	var pct_avg = (pct_actual.min_pct_india + pct_actual.max_pct_india) / 2;
	// var pct_diff = pct_avg - pct_guess;
	var result;
	if (pct_guess >= pct_actual.min_pct_india && pct_guess <= pct_actual.max_pct_india) {
		result = "You were in the right range." 
	} else if (pct_guess < pct_actual.min_pct_india) {
		result = "Your guess was too low."
	} else if (pct_guess > pct_actual.max_pct_india) {
		result = "Your guess was too high."
	}
	
  var sentence_a = "<p>You guessed that your wealth of <b>&#8377;" + jz.str.numberLakhs(wealth) + "</b> places you at the <b class='red-color'>" + jz.str.numberOrdinal(pct_guess) + " percentile</b> of all Indians.</p>";

  var sentence_b_conditional;
  if (pct_actual.min_pct_india == 100){
  	sentence_b_conditional = "at the <b class='orange-color'>100th percentile</b>";
  } else {
  	sentence_b_conditional = "between the <b class='orange-color'>" + jz.str.numberOrdinal(pct_actual.min_pct_india) + " and " + jz.str.numberOrdinal(pct_actual.max_pct_india) + " percentiles</b>"
  }
  var sentence_b = "<p>Your actual wealth places you " + sentence_b_conditional + " of all Indians.</p>";
  
  $("#output .output-title").html(result)
  $("#output .output-sentence").html(sentence_a + sentence_b);

  d3.selectAll(".draggable")
	  .style("cursor", "default")
	  .call(d3.drag().on("drag", function(){
	  	// nothing
	  }))

  $(".hide-after-guess").fadeOut();
  $("#output").fadeIn();

  range_svg.append("rect")
  		.attr("class", "result-rect")
  		.attr("x", range_x(pct_actual.min_pct_india))
  		.attr("width", 0)
  		.attr("y", range_height - slider_height)
			.attr("height", slider_height)
  	.transition().delay(500)
  		.attr("width", range_x(pct_actual.max_pct_india - pct_actual.min_pct_india));

  if (pct_actual.min_pct_india == 0){
  	makeResFlag(pct_actual.min_pct_india);
  	makeAnimatedResFlag(pct_actual.max_pct_india);
  } else {
  	makeResFlag(pct_avg);
  }

  function makeResFlag(val){
		range_svg.append("circle")
	  		.attr("class", "result-flag result-circle")
	  		.attr("cx", range_x(val))
	  		.attr("cy", range_height + result_width + handle_padding)
	  		.attr("r", 0)
	  	.transition().delay(500)
	  		.attr("r", result_width);

  	range_svg.append("polygon")
  			.attr("class", "result-flag result-pointer")
				.attr("opacity", 0)
				.attr("transform", "translate(0,20)")
				.attr("points", resTri(val))
			.transition().delay(500)
				.attr("opacity", 1)
				.attr("transform", "translate(0,0)");

		var txt = val == 0 ? (val) : 
			(pct_actual.min_pct_india == 100) ? "100" :
			(pct_actual.min_pct_india + "-" + pct_actual.max_pct_india);

		range_svg.append("text")
				.attr("class", "result-flag-label")
				.attr("x", range_x(val))
				.attr("dy", 5)
				.attr("y", range_height + result_width + handle_padding)
				.text(txt);
  }

  function makeAnimatedResFlag(val){
  	range_svg.append("circle")
	  		.attr("class", "result-flag result-circle")
	  		.attr("cx", range_x(pct_actual.min_pct_india))
	  		.attr("cy", range_height + result_width + handle_padding)
	  		.attr("r", 0)
	  	.transition().delay(500)
		  	.attr("cx", range_x(val))
	  		.attr("r", result_width);

  	range_svg.append("polygon")
  			.attr("class", "result-flag result-pointer")
				.attr("opacity", 0)
				.attr("transform", "translate(0,20)")
				.attr("points", resTri(pct_actual.min_pct_india))
			.transition().delay(500)
				.attr("points", resTri(val))
				.attr("opacity", 1)
				.attr("transform", "translate(0,0)");

		range_svg.append("text")
				.attr("class", "result-flag-label")
				.attr("x", 0)
				.attr("dy", 5)
				.attr("y", range_height + result_width + handle_padding)
				.text(val)
			.transition().delay(500)
				.attr("x", range_x(val))

  }

  function resTri(val){
  	var point_a = range_x(val) + "," + (range_height);
  	var point_b = (range_x(val) + handle_padding / 1.5) + "," + (range_height + handle_padding + 5);
  	var point_c = (range_x(val) - handle_padding / 1.5) + "," + (range_height + handle_padding + 5);
  	return point_a + " " + point_b + " " + point_c;
  }	

  d3.timeout(scrollup, 500);
  function scrollup(){
    $("body, html").animate(function(){
    	scrollTop: 0
    }, 2000);
  }
  
});

function calcPct(dollars){
	var data = [{
			min: 0,
			max: 10000,
			min_pct_india: 0,
			max_pct_india: 92,
			min_pct_china: 0,
			max_pct_china: 63.1
		},{
			min: 10000,
			max: 100000,
			min_pct_india: 92,
			max_pct_india: 99,
			min_pct_china: 63.1,
			max_pct_china: 97.1
		}, {
			min: 100000,
			max: 1000000,
			min_pct_india: 99,
			max_pct_india: 100,
		}, {
			min: 1000000,
			max: Infinity,
			min_pct_india: 100,
			max_pct_india: 100
		}]

	var out = {};
	data.forEach(function(d){
		if (dollars >= d.min && dollars < d.max){
			out = d;
		}
	})

	return out;
}