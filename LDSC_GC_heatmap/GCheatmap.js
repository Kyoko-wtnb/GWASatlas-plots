var domain_col = {"Activities":"#ffa1ba","Aging":"#bf0058","Body Functions":"#f3136f",
"Body Structures":"#ff978f","Cardiovascular":"#8a1b22","Cell":"#ff6b63",
"Cognitive":"#be6100","Connective tissue":"#884500","Dermatological":"#fe9617",
"Ear, Nose, Throat":"#968900","Endocrine":"#ceca59","Environment":"#a8d538",
"Gastrointestinal":"#5ad754","Hematological":"#75db8d","Immunological":"#00532e",
"Infection":"#02a58b","Metabolic":"#78d7c6","Mortality":"#3ac7ff",
"Muscular":"#009cf8","Neoplasms":"#0261dd","Neurological":"#344382",
"Nutritional":"#9262ec","Ophthalmological":"#deb7fb","Psychiatric":"#6c179f",
"Reproduction":"#f790ff","Respiratory":"#d73fbf","Skeletal":"#930075",
"Social Interactions":"#772c50"};

$(document).ready(function(){
	d3.json("GC.json", function(data){
		gcPlot(data);
	});
})

Array.prototype.unique = function() {
  return this.filter(function (value, index, self) {
    return self.indexOf(value) === index;
  });
}

function gcPlot(data){
	$('#gcPlot').html("");
	if(data.data.id == undefined || data.data.id == null || data.data.id.length==0){
		$('#gcPlot').html('<span style="color:red;padding-top:20px;">No genetic correlatioin is available for selected GWAS.<span>');
	}else if(data.data.id.length > 100){
		$('#gcPlot').html('<span style="color:red;padding-top:20px;">The heatmap is too large to display. Please download data in json format and create the plot on your local server.<span>');
	}else{
		var ids = data.data["id"];
		var n = ids.length;
		var cellsize = 12;
		if(n < 20){cellsize = 20;}
		else if(n < 50){cellsize = 15;}
		data.data.rg.forEach(function(d){
			d[0] = +d[0]; //id1
			d[1] = +d[1]; //id2
			d[2] = +d[2]; //rg
			d[3] = +d[3]; //p
			d[4] = +d[4]; //pbon
		});

		var maxTrait = 0;
		ids.forEach(function(d){
			if(data.data.Trait[d].length > maxTrait){
				maxTrait = data.data.Trait[d].length;
			}
		});

		var margin = {bottom: maxTrait*5.5+5, right: 250, top: 20, left: maxTrait*5.5+5},
			width = cellsize*n,
			height = cellsize*n;
		var svg = d3.select('#gcPlot').append('svg')
			.attr("width", width+margin.left+margin.right)
			.attr("height", height+margin.top+margin.bottom)
			.append("g").attr("transform", "translate("+margin.left+","+margin.top+")");
		var colorScale = d3.scale.linear().domain([-1.25, 0, 1.25]).range(["#000099", "#fff", "#b30000"]);
		var sizeScale = d3.scale.linear().domain([0.05, 1]).range([1, 0]);

		// legened for heatmap color
		var t = [];
		for(var i =0; i<26; i++){t.push(i);}
		var legendRect = svg.selectAll(".legend").data(t).enter().append("g")
			.append("rect")
			.attr("class", 'legendRect')
			.attr("x", width+15)
			.attr("y", function(d){return (25-d)*3})
			.attr("width", 15)
			.attr("height", 3)
			.attr("fill", function(d){return colorScale(d*0.1-1.25)});
		var legendText = svg.selectAll("text.legend").data([0,12.5,25]).enter().append("g")
			.append("text")
			.attr("text-anchor", "start")
			.attr("class", "legenedText")
			.attr("x", width+32)
			.attr("y", function(d){return (25-d)*3+5})
			.text(function(d){return d*0.1-1.25})
			.style("font-size", "12px");

		// legend for domain color
		var cur_height = 0;
		var domains = d3.set(data.data.id.map(function(d){return data.data.Domain[d];})).values()
		domains.sort();
		domains.forEach(function(d){
			svg.append('rect')
				.attr('x', width+70)
				.attr('y', cur_height)
				.attr('width', 4)
				.attr("height", 12)
				.style("fill", domain_col[d]);
			svg.append('text')
				.attr('x', width+76)
				.attr('y', cur_height+10)
				.text(d)
				.attr('text-anchor', 'start')
				.style('font-size', '12px');
			cur_height += 20;
		});

		// y axis label
		var rowLabels = svg.append("g").selectAll(".rowLabel")
			.data(ids).enter().append("text")
			.text(function(d){return data.data.Trait[d];})
			.attr("x", -7)
			.attr("y", function(d){return data.data.order.alph[d]*cellsize+(cellsize-1)/2;})
			.style("font-size", "10px")
			.style("text-anchor", "end")
			.attr('dy', function(){if(cellsize==20){return ".1em"}else{return ".2em"}});
		// x axis label
		var colLabels = svg.append("g").selectAll(".colLabel")
			.data(ids).enter().append("text")
			.text(function(d){return data.data.Trait[d];})
			.style("text-anchor", "start")
			.style("font-size", "10px")
			.attr("transform", function(d){
				return "translate("+(data.data.order.alph[d]*cellsize+(cellsize-1)/2)+","+(height+7)+")rotate(90)";
			})
			.attr('dy', function(){if(cellsize==20){return ".4em"}else{return ".35em"}});

		// heatmap for significant rg
		var heatMapSig = svg.append("g").attr("class", "cell heatmapcell")
			.selectAll("rect.cell").data(data.data.rg.filter(function(d){if(d[3]<0.05){return d}})).enter()
			.append("rect")
			.attr("width", cellsize-1).attr("height", cellsize-1)
			.attr('x', function(d){return data.data.order.alph[d[0]]*cellsize})
			.attr('y', function(d){return data.data.order.alph[d[1]]*cellsize})
			.attr('fill', function(d){
				if(d[2]>1.25){return colorScale(1.25)}
				else if(d[2] < -1.25){return colorScale(-1.25)}
				else{return colorScale(d[2])}
			});
		// stars for significant rg after bon correction
		var stars = svg.append("g").attr("class", "cell star")
			.selectAll("star").data(data.data.rg.filter(function(d){if(d[4]<0.05 && d[0] != d[1]){return d}})).enter()
			.append("text")
			.attr('x', function(d){return data.data.order.alph[d[0]]*cellsize+(cellsize-1)/2})
			.attr('y', function(d){return data.data.order.alph[d[1]]*cellsize+cellsize*0.75})
			.text("*")
			.style("text-anchor", "middle")
			.attr('dy', function(){if(cellsize==20){return ".1em"}else{return ".2em"}});
		// heatmap for non-significant rg
		var heatMapNonsig = svg.append("g").attr("class", "cell heatmapcell")
			.selectAll("rect.cell.nonsig").data(data.data.rg.filter(function(d){if(d[3]>=0.05){return d}})).enter()
			.append("rect")
			.attr("width", function(d){return (cellsize-1)*sizeScale(d[3])})
			.attr("height", function(d){return (cellsize-1)*sizeScale(d[3])})
			.attr("x", function(d){return data.data.order.alph[d[0]]*cellsize+((1-sizeScale(d[3]))/2)*(cellsize-1)})
			.attr("y", function(d){return data.data.order.alph[d[1]]*cellsize+((1-sizeScale(d[3]))/2)*(cellsize-1)})
			.attr('fill', function(d){return colorScale(d[2])});
		// Domain labels col
		var colDomain = svg.append("g").attr("class", "colDomain")
			.selectAll("rect.colDomain").data(data.data.id).enter()
			.append("rect")
			.attr('x', function(d){return data.data.order.alph[d]*cellsize})
			.attr('y', height+1)
			.attr("width", cellsize-1)
			.attr("height", 3)
			// .attr("fill", function(d){return domain_col(domains.indexOf(data.data.Domain[d]))});
			.attr("fill", function(d){return domain_col[data.data.Domain[d]]});
		// Domain labels row
		var rowDomain = svg.append("g").attr("class", "rowDomain")
			.selectAll("rect.rowDomain").data(data.data.id).enter()
			.append("rect")
			.attr('x', -4)
			.attr('y', function(d){return data.data.order.alph[d]*cellsize})
			.attr("width", 3)
			.attr("height", cellsize-1)
			// .attr("fill", function(d){return domain_col(domains.indexOf(data.data.Domain[d]))});
			.attr("fill", function(d){return domain_col[data.data.Domain[d]]});
		svg.selectAll("text").style("font-family", "sans-serif");

		// reordering labels
		function sortOptions(type){
			if(type == "alph"){
				heatMapSig.transition().duration(1000)
					.attr("x", function(d){return data.data.order.alph[d[0]]*cellsize})
					.attr("y", function(d){return data.data.order.alph[d[1]]*cellsize});
				stars.transition().duration(1000)
					.attr("x", function(d){return data.data.order.alph[d[0]]*cellsize+(cellsize-1)/2})
					.attr("y", function(d){return data.data.order.alph[d[1]]*cellsize+cellsize*0.75});
				heatMapNonsig.transition().duration(1000)
					.attr("x", function(d){return data.data.order.alph[d[0]]*cellsize+((1-sizeScale(d[3]))/2)*(cellsize-1)})
					.attr("y", function(d){return data.data.order.alph[d[1]]*cellsize+((1-sizeScale(d[3]))/2)*(cellsize-1)});
				rowLabels.transition().duration(1000)
					.attr("y", function(d){return data.data.order.alph[d]*cellsize+(cellsize-1)/2;});
				colLabels.transition().duration(1000)
					.attr("transform", function(d){
						return "translate("+(data.data.order.alph[d]*cellsize+(cellsize-1)/2)+","+(height+7)+")rotate(90)";
					});
				colDomain.transition().duration(1000)
					.attr("x", function(d){return data.data.order.alph[d]*cellsize});
				rowDomain.transition().duration(1000)
					.attr("y", function(d){return data.data.order.alph[d]*cellsize});
			}else if(type == "domain"){
				heatMapSig.transition().duration(1000)
					.attr("x", function(d){return data.data.order.domain[d[0]]*cellsize})
					.attr("y", function(d){return data.data.order.domain[d[1]]*cellsize});
				stars.transition().duration(1000)
					.attr("x", function(d){return data.data.order.domain[d[0]]*cellsize+(cellsize-1)/2})
					.attr("y", function(d){return data.data.order.domain[d[1]]*cellsize+cellsize*0.75});
				heatMapNonsig.transition().duration(1000)
					.attr("x", function(d){return data.data.order.domain[d[0]]*cellsize+((1-sizeScale(d[3]))/2)*(cellsize-1)})
					.attr("y", function(d){return data.data.order.domain[d[1]]*cellsize+((1-sizeScale(d[3]))/2)*(cellsize-1)});
				rowLabels.transition().duration(1000)
					.attr("y", function(d){return data.data.order.domain[d]*cellsize+(cellsize-1)/2;});
				colLabels.transition().duration(1000)
					.attr("transform", function(d){
						return "translate("+(data.data.order.domain[d]*cellsize+(cellsize-1)/2)+","+(height+7)+")rotate(90)";
					});
				colDomain.transition().duration(1000)
					.attr("x", function(d){return data.data.order.domain[d]*cellsize});
				rowDomain.transition().duration(1000)
					.attr("y", function(d){return data.data.order.domain[d]*cellsize});
			}else if(type == "clst"){
				heatMapSig.transition().duration(1000)
					.attr("x", function(d){return data.data.order.clst[d[0]]*cellsize})
					.attr("y", function(d){return data.data.order.clst[d[1]]*cellsize});
				stars.transition().duration(1000)
					.attr("x", function(d){return data.data.order.clst[d[0]]*cellsize+(cellsize-1)/2})
					.attr("y", function(d){return data.data.order.clst[d[1]]*cellsize+cellsize*0.75});
				heatMapNonsig.transition().duration(1000)
					.attr("x", function(d){return data.data.order.clst[d[0]]*cellsize+((1-sizeScale(d[3]))/2)*(cellsize-1)})
					.attr("y", function(d){return data.data.order.clst[d[1]]*cellsize+((1-sizeScale(d[3]))/2)*(cellsize-1)});
				rowLabels.transition().duration(1000)
					.attr("y", function(d){return data.data.order.clst[d]*cellsize+(cellsize-1)/2;});
				colLabels.transition().duration(1000)
					.attr("transform", function(d){
						return "translate("+(data.data.order.clst[d]*cellsize+(cellsize-1)/2)+","+(height+7)+")rotate(90)";
					});
				colDomain.transition().duration(1000)
					.attr("x", function(d){return data.data.order.clst[d]*cellsize});
				rowDomain.transition().duration(1000)
					.attr("y", function(d){return data.data.order.clst[d]*cellsize});
			}
		}

		$('#gcOrder').on("change", function(){
			var type = $('#gcOrder').val();
			sortOptions(type);
		});
	}
}
