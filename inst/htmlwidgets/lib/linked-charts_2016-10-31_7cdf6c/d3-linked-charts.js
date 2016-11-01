(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.d3 = global.d3 || {})));
}(this, function (exports) { 'use strict';

	//Basic object that can be chart or layer
	function base() {
		
	  var obj = {};
		obj.properties = [];
		
	  obj.add_property = function( propname, defaultval ) {
	    obj.properties.push(propname);
			
			var getter = "get_" + propname;
	    obj[ propname ] = function( vf ) {
	      if( vf === undefined )
	        throw "No value passed in setter for property '" + propname + "'.";
	      if( typeof(vf) === "function" )
	        obj[ getter ] = vf
	      else
	        obj[ getter ] = function() { return vf };

	      if(obj.chart)
	        if(obj.chart[propname]){
	          obj.chart[propname] = obj[propname];
	          obj.chart[getter] = obj[getter];
	        }
	      if(obj.layers)
	        for(var i in obj.layers)
	          if(obj.layers[i][propname]){
	            obj.layers[i][propname] = obj[propname];
	            obj.layers[i][getter] = obj[getter];
	          }

	      return obj
	    }
	    //Allowing default values to be a function
			if(typeof defaultval === "function")
				obj[ getter ] = defaultval
			else
				obj[ getter ] = function() { return defaultval };
	    return obj;
	  }
		
		return obj;
	}

	function layerBase() {
		
		var layer = base()
			.add_property("layerDomainX")
			.add_property("layerDomainY")
			.add_property("contScaleX", true)
			.add_property("contScaleY", true)
			.add_property("on_click", function() {});

		layer.add_click_listener = function(){

		//THIS IS TEMPORARY
		//TO DO: decide how better to add this functions.

		//adds a vector or a scalar to a vector
		Array.prototype.add = function(b){
		  var s = Array(this.length);
		  for(var i = 0; i < this.length; i++)
		    if(typeof(b) == "number")
		      s[i] = this[i] + b;
		    else
		      s[i] = this[i] + b[i];
		  return s;
		} 

		//multiplies an array by a scalar or performs scalar multiplication of two vectors
		Array.prototype.mult = function(b){
		  var s = Array(this.length);
		  for(var i = 0; i < this.length; i++)
		    if(typeof(b) == "number")
		      s[i] = this[i] * b;
		    else
		      s[i] = this[i] * b[i];
		  return s;
		}
		  
		//returns distance between two points
		Array.prototype.enorm = function(){
		  return Math.sqrt(this.reduce(function(prev, cur) {return prev + cur*cur;}, 0));
		}


		  var wait_dblClick = null, down, wait_click = null,
		    tolerance = 5, click_coord,
		    event = d3.dispatch('click', 'dblclick');

		  layer.g.append("rect")
		    .attr("class", "clickPanel")
		    .attr("fill", "transparent");
		  
		  layer.g
		    .on("mousedown", function() {      
		      down = d3.mouse(document.body);
		      wait_click = window.setTimeout(function() {wait_click = null;}, 500);
		      if(self.onSelection != "doNothing"){
		        if(!d3.event.shiftKey || this.onSelection == "zoom") {
		          layer.chart.svg.selectAll(".data_point").classed("selected",false);
		          layer.chart.svg.selectAll(".label").classed("selected",false);
		        }
		        var p = d3.mouse(this);  //Mouse position on the heatmap
		        layer.g.append("rect")
		          .attr("class", "selection")
		          .attr("rx", 0)
		          .attr("ry", 0)
		          .attr("x", p[0])
		          .attr("y", p[1])
		          .attr("width", 1)
		          .attr("height", 1);
		      }
		    })
		    .on("mousemove", function() {
		      var s = layer.g.select(".selection");
		      
		      if(!s.empty()) {
		        var p = d3.mouse(this),
		          //The latest position and size of the selection rectangle
		          d = {
		            x: parseInt(s.attr("x"), 10),
		            y: parseInt(s.attr("y"), 10),
		            width: parseInt(s.attr("width"), 10),
		            height: parseInt(s.attr("height"), 10)
		          },
		          move = {
		            x: p[0] - d.x,
		            y: p[1] - d.y
		          };
		      
		        if(move.x < 1 || (move.x * 2 < d.width)) {
		          d.x = p[0];
		          d.width -= move.x;
		        } else {
		          d.width = move.x;       
		        }
		      
		        if(move.y < 1 || (move.y * 2 < d.height)) {
		          d.y = p[1];
		          d.height -= move.y;
		        } else {
		          d.height = move.y;       
		        }
		        
		        s.attr("x", d.x)
		          .attr("y", d.y)
		          .attr("width", d.width)
		          .attr("height", d.height);
		      
		        // deselect all temporary selected state objects
		        d3.selectAll('.tmp-selection.selected')
		          .classed("selected", false);

		        var selPoints = layer.findPoints([d.x, d.y], [d.x + d.width, d.y + d.height])
		          .filter(function() {return !d3.select(this).classed("selected")})
		          .classed("selected", true)
		          .classed("tmp-selection", true)
		          .each(function(dp){
		            layer.chart.svg.select(".col").selectAll(".label")
		              .filter(function(label_d) {return label_d == dp.col;})            
		                .classed("tmp-selection", true)
		                .classed("selected", true);

		            layer.chart.svg.select(".row").selectAll(".label")
		              .filter(function(label_d) {return label_d == dp.row;})            
		                .classed("tmp-selection", true)
		                .classed("selected", true);
		          });
		      }
		    })
		    .on("mouseup", function() {
		      // remove selection frame
		      var x = layer.g.selectAll("rect.selection").attr("x") * 1,
		        y = layer.g.selectAll("rect.selection").attr("y") * 1,
		        w = layer.g.selectAll("rect.selection").attr("width") * 1,
		        h = layer.g.selectAll("rect.selection").attr("height") * 1,
		        lu = [x, y], rb = [x + w, y + h],
		        points = d3.select(this),
		        pos = d3.mouse(this);
		      layer.g.selectAll("rect.selection").remove();

		      if(wait_click && down.add(d3.mouse(document.body).mult(-1)).enorm() < tolerance){
		        window.clearTimeout(wait_click);
		        wait_click = null;
		        if(wait_dblClick && click_coord.add(d3.mouse(document.body).mult(-1)).enorm() < tolerance){
		                    //console.log("doubleclick");
		                    window.clearTimeout(wait_dblClick);
		                    wait_dblClick = null;
		                    points.on("dblclick").apply(points);
		        } else {
		          wait_dblClick = window.setTimeout((function(e) {
		                        return function() {
		                            points.on("click").apply(points, [pos]);
		                            wait_dblClick = null;
		                        };
		                    })(d3.event), 300);
		        }
		        click_coord = d3.mouse(document.body);
		        return;
		      }

		      d3.selectAll(".tmp-selection")
		        .classed("tmp-selection",false)
		        .classed("selected", false);
		      
		      // remove temporary selection marker class
		      layer.zoom(lu, rb);
		    } )
		    .on("dblclick", function(){
		      console.log("doubleclick");
		      layer.resetDomain();
		      /*var update = false;
		      if(self.dataPoints.savedColOrder && 
		        self.dataPoints.savedColOrder.length != self.dataPoints.colOrder.length
		      ){
		        self.dataPoints.colOrder = self.dataPoints.savedColOrder.slice();
		        update = true;
		      }
		      if(self.dataPoints.savedRowOrder && 
		        self.dataPoints.savedRowOrder.length != self.dataPoints.rowOrder.length
		      ){
		        self.dataPoints.rowOrder = self.dataPoints.savedRowOrder.slice();
		        update = true;
		      }
		      if(update)
		        self.updatePlot();*/
		    })  

		    .on("click", function(p){

		      console.log("click");
		      console.log(p);
		      var clickedPoint = layer.findPoints(p, p);
		      if(!clickedPoint.empty()){
		      	var click = clickedPoint.on("click");
		      	click.apply(clickedPoint, [clickedPoint.datum()]); 
		      }
		    });

		  return layer;
		}
			
		return layer;
	}

	//basic chart object
	function chartBase() {
		var chart = base()
			.add_property("width", 500)
			.add_property("height", 500)
			.add_property("margin", { top: 20, right: 10, bottom: 50, left: 50 })
			.add_property("transitionDuration", 1000);
		
	  chart.put_static_content = function( element ) {
			chart.container = element.append("div");
			chart.svg = chart.container.append("svg");
		}

	  chart.place = function( element ) {
	    if( element === undefined )
	      element = "body";
	    if( typeof( element ) == "string" ) {
	      element = d3.select( element );
	      if( element.size == 0 )
	        throw "Error in function 'place': DOM selection for string '" +
	          node + "' did not find a node."
	    }

			chart.put_static_content( element );

	    chart.update();
	    return chart;
	  }
		
		chart.update_not_yet_called = true;
		
		chart.update = function(){
			
			var k;
			if(chart.update_not_yet_called){
				chart.update_not_yet_called = false;
				chart.transition = 
					d3.transition().duration(0);
			} else {
				chart.transition = 
					d3.transition().duration(chart.get_transitionDuration());
			}

			chart.svg.transition(chart.transition)
				.attr("width", 
					chart.get_width() + chart.get_margin().left + chart.get_margin().right)
				.attr("height", 
					chart.get_height() + chart.get_margin().top + chart.get_margin().bottom);
			chart.container.transition(chart.transition)
				.style("width", 
					(chart.get_width() + chart.get_margin().left + chart.get_margin().right)
					+ "px")
				.style("height", 
					(chart.get_height() + chart.get_margin().top + chart.get_margin().bottom) 
					+ "px");
			return chart;
		}
		
	  return chart;
	}

	function layerChartBase(){
		var chart = chartBase();
		chart.properties.push("add_layer");
		chart.properties.push("get_layer");
		chart.properties.push("place");
		
		//Basic layer functionality
		chart.layers = {};
		
		chart.get_nlayers = function() {
			return chart.layers.length;
		}
		chart.get_layer = function(k) {
			return chart.layers[k];
		}
		chart.add_layer = function(k) {
			if(typeof k === "undefined")
				k = "layer" + chart.get_nlayers();
			var layer = layerBase();
			chart.layers[k] = {};
			layer.chart = chart;
			chart.layers[k] = layer;
			//Object.assign(chart.layers[k], layer)

			for(var i = 0; i < chart.properties.length; i++){
				layer[chart.properties[i]] = chart[chart.properties[i]];
				layer["get_" + chart.properties[i]] = chart["get_" + chart.properties[i]];
			}
				
			return chart.get_layer(k);
		}
		chart.setActiveLayer = function(id) {
			var layer = chart.layers[id];
			for(var i = 0; i < layer.properties.length; i++){
				chart[layer.properties[i]] = layer[layer.properties[i]];
				chart["get_" + layer.properties[i]] = layer["get_" + layer.properties[i]];
			}
			return chart;
		}
		
	/*	var inherited_put_static_content = chart.put_static_content;
		chart.put_static_content = function(element){
			inherited_put_static_content(element);
		}*/

		var inherited_update = chart.update;
		chart.update = function() {
			inherited_update();

			for(var k in chart.layers)
				chart.get_layer(k).update();
			
			chart.svg.select(".clickPanel")
				.attr("x", chart.get_margin().left)
				.attr("y", chart.get_margin().top)
				.attr("width", chart.get_width())
				.attr("height", chart.get_height());

			return chart;
		}
		return chart;
	}

	function axisChartBase() {
		
		var chart = layerChartBase();
		
		chart.add_property("singleScaleX", true)
			.add_property("singleScaleY", true)
			.add_property("domainX")
			.add_property("domainY")
			.add_property("labelX")
			.add_property("labelY");
		
		//default getter for domainX
		var get_domainX = function() {
			//TODO: add possibility of adding several axises
			//(one for each plot.layer)
			var domain;
			
			if(chart.get_singleScaleX()){
				var contScale = true;
				for(var k in chart.layers)
					contScale = contScale && chart.get_layer(k).get_contScaleX();
				if(contScale){ //if resulting scale is continous, find minimun and maximum values
					for(var k in chart.layers)
						//some of the layers may not have domains at all (such as legends)
						if(typeof chart.get_layer(k).get_layerDomainX() !== "undefined")
							if(typeof domain === "undefined") 
								domain = chart.get_layer(k).get_layerDomainX()
							else {
								domain[0] = d3.min([domain[0], chart.get_layer(k).get_layerDomainX()[0]]);
								domain[1] = d3.min([domain[1], chart.get_layer(k).get_layerDomainX()[1]]);
							}
				} else { //if scale is categorical, find unique values from each layer
					for(var k in chart.layers)
						if(typeof chart.get_layer(k).get_layerDomainX() !== "undefined")
							if(typeof domain === "undefined") 
								domain = chart.get_layer(k).get_layerDomainX()
							else 
								domain = domain.concat(chart.get_layer(k).get_layerDomainX()
									.filter(function(e){
										return domain.indexOf(e) < 0;
									}));
				}
			}
			
			return domain;
		}
		var get_domainY = function() {
			var domain;
			
			if(chart.get_singleScaleY()){
				var contScale = true;
				for(var k in chart.layers)
					contScale = contScale && chart.get_layer(k).get_contScaleY();
				if(contScale){
					for(var k in chart.layers)
						if(typeof chart.get_layer(k).get_layerDomainY() !== "undefined")
							if(typeof domain === "undefined") 
								domain = chart.get_layer(k).get_layerDomainY()
							else {
								domain[0] = d3.min([domain[0], chart.get_layer(k).get_layerDomainY()[0]]);
								domain[1] = d3.min([domain[1], chart.get_layer(k).get_layerDomainY()[1]]);
							}							
				} else { //if scale is categorical, find unique values from each layer
					for(var k in chart.layers)
						if(typeof chart.get_layer(k).get_layerDomainY() !== "undefined")
							if(typeof domain === "undefined") 
								domain = chart.get_layer(k).get_layerDomainY()
							else 
								domain = domain.concat(chart.get_layer(k).get_layerDomainY()
									.filter(function(e){
										return domain.indexOf(e) < 0;
									}));
				}
			}
			
			return domain;
		}

		chart.get_domainX = get_domainX;
		chart.get_domainY = get_domainY;

		//redefine setters for axis domains
		chart.domainX = function(domain){
			//set default getter
			if(domain == "reset"){
				chart.domainX(get_domainX());
				return chart;
			}
			//if user provided function, use this function
			if(typeof domain === "function")
				chart.get_domainX = domain;
			if(domain.length)
				chart.get_domainX = function() {
					return domain;
				};
				
			return chart;
		}
		chart.domainY = function(domain){
			if(domain == "reset"){
				chart.domainY(get_domainY());
				return chart;
			}
			if(typeof domain === "function")
				chart.get_domainY = domain;
			if(domain.length)
				chart.get_domainY = function() {
					return domain;
				};
			
			return chart;
		}
		
	  var inherited_put_static_content = chart.put_static_content;
	  chart.put_static_content = function( element ) {
	    inherited_put_static_content( element );

	    chart.axes = {};
			
			var g = chart.svg.append("g")
				.attr("transform", "translate(" + chart.get_margin().left + 
					", " + chart.get_margin().top + ")");
			
	    chart.axes.x_g = g.append( "g" )
	      .attr( "class", "x axis" )
	      .attr( "transform", "translate(0," + chart.get_height() + ")" );
	    chart.axes.x_label = chart.axes.x_g.append( "text" )
	      .attr( "class", "label" )
	      .style( "text-anchor", "end" );

	    chart.axes.y_g = g.append( "g" )
	      .attr( "class", "y axis" )
	    chart.axes.y_label = chart.axes.y_g.append( "text" )
	      .attr( "class", "label" )
	      .attr( "transform", "rotate(-90)" )
	      .style( "text-anchor", "end" );
	  }	
		
		var inherited_update = chart.update;
		
		chart.update = function() {
		
			//set scales and update axes
			if(chart.get_domainX().length == 2)
				chart.axes.scale_x = d3.scaleLinear()
					.domain( chart.get_domainX() )
					.range( [ 0, chart.get_width() ] )
					.nice()
			else
				chart.axes.scale_x = d3.scaleQuantize()
					.domain( chart.get_domainX() )
					.range( [0, chart.get_width()] )
					.nice();	
			
			if(chart.get_domainY().length == 2)
				chart.axes.scale_y = d3.scaleLinear()
					.domain( chart.get_domainY() )
					.range( [chart.get_height(), 0] )
					.nice()
			else
				chart.axes.scale_x = d3.scaleQuantize()
					.domain( chart.get_domainY() )
					.range( [chart.get_height(), 0] )
					.nice();
			
			inherited_update();
			
	    d3.axisBottom()
	      .scale( chart.axes.scale_x )
	      ( chart.axes.x_g.transition(chart.transition) );

	    d3.axisLeft()
	      .scale( chart.axes.scale_y )
	      ( chart.axes.y_g.transition(chart.transition) );

	    chart.axes.x_label
	      .attr( "x", chart.get_width() )
	      .attr( "y", -6 )
	      .text( chart.get_labelX() );

	    chart.axes.y_label
	      .attr( "y", 6 )
	      .attr( "dy", ".71em" )
	      .text( chart.get_labelY() );
			
			return chart;
		}
		
		return chart;
	}

	function tableChartBase() {
		
		var chart = layerChartBase();
		
		chart.add_property("nrows")
			.add_property("ncols");
		
		chart.add_property("colLabels", function(i) {return i;})
			.add_property("rowLabels", function(i) {return i;})
			.add_property("colIds", function() {return d3.range(chart.get_ncols());})
			.add_property("rowIds", function() {return d3.range(chart.get_nrows());})
			.add_property("heatmapRow", function(rowId) {return chart.get_rowIds().indexOf(rowId);})
			.add_property("heatmapCol", function(colId) {return chart.get_colIds().indexOf(colId);})
			.add_property("labelMouseOver")
			.add_property("labelMouseOut")
			.add_property("colStyle", "")
			.add_property("rowStyle", "");

		//if user specifies column or row Ids, set the number of rows or columns automatically
		/*chart.colIds = function(f) {
			if(f.length) chart.ncols(f.length);
			typeof f == "function" ? chart.get_colIds = f : chart.get_colIds = function() {return f;};
		}
		chart.rowIds = function(f) {
			if(f.length) chart.nrows(f.length);
			typeof f == "function" ? chart.get_rowIds = f : chart.get_rowIds = function() {return f;};
		}
	*/

		//make nrows and ncols protected from recursion
		//if get_colIds and get_rowIds are not using get_ncols
		//and get_nrows, the number of rows and columns will be
		//set equal to the number of Ids
		chart.nrows((function() {
				var inFun = false;
				return function(){
					if(inFun) return undefined;
					inFun = true;
					try {
						return chart.get_rowIds().length;
					} finally {
						inFun = false;
					}
				}
			})())
			.ncols((function() {
				var inFun = false;
				return function(){
					if(inFun) return undefined;
					inFun = true;
					try {
						return chart.get_colIds().length;
					} finally {
						inFun = false;
					}
				}
			})());

		//set default hovering behaviour
		chart.labelMouseOver(function() {
			d3.select(this).classed("hover", true);
		});
		chart.labelMouseOut(function() {
			d3.select(this).classed("hover", false);
		});
		
		chart.reorderRow = function(f){
			if(f == "flip"){
				chart.get_heatmapRow("__flip__");
				return chart;
			}
			var ids = chart.get_rowIds().slice(), ind;
			ids = ids.sort(f);
			chart.heatmapRow(function(rowId){
				if(rowId == "__flip__"){
					ids = ids.reverse();
					return;
				}
				var actIds = chart.get_rowIds(),
					orderedIds = ids.filter(function(e) {
						return actIds.indexOf(e) != -1;
					});
				if(orderedIds.length != actIds.length) {
					orderedIds = actIds.sort(f);
					ids = orderedIds.slice();
				}
				ind = orderedIds.indexOf(rowId);
				if(ind > -1)
					 return ind
				else
					throw "Wrong rowId in chart.get_heatmapRow";
			});
			
			return chart;
		}
		chart.reorderCol = function(f){
			if(f == "flip"){
				chart.get_heatmapCol("__flip__");
				return chart;
			}
			var ids = chart.get_colIds().slice(), ind;
			ids = ids.sort(f);
			chart.heatmapCol(function(colId){
				if(colId == "__flip__"){
					ids = ids.reverse();
					return;
				}

				var actIds = chart.get_colIds(),
					orderedIds = ids.filter(function(e) {
						return actIds.indexOf(e) != -1;
					});
				if(orderedIds.length != actIds.length) {
					orderedIds = actIds.sort(f);
					ids = orderedIds.slice();
				}
				ind = orderedIds.indexOf(colId);
				if(ind > -1)
					 return ind
				else
					throw "Wrong rowId in chart.get_heatmapRow";
			});
			return chart;
		}
		
		
		var inherited_put_static_content = chart.put_static_content;
		chart.put_static_content = function(element){
			
			inherited_put_static_content(element);
			
			//chart.container.style("position", "relative");
			chart.container.append("div")
				.attr("class", "inform hidden")
				.append("p")
					.attr("class", "value");
					
			//create main parts of the heatmap
			chart.svg.append("g")
				.attr("class", "row label_panel");
			chart.svg.append("g")
				.attr("class", "col label_panel");
			
			//delete later if unnecessary
			chart.axes = {};
		}
		
		var inherited_update = chart.update;
		chart.update = function() {
			//update sizes of all parts of the chart
			chart.container.transition(chart.transition)
				.style("width", (chart.get_width() + chart.get_margin().left + chart.get_margin().right) + "px")
				.style("height", (chart.get_height() + chart.get_margin().top + chart.get_margin().bottom) + "px");

			chart.svg.transition(chart.transition)
				.attr("height", chart.get_height() + chart.get_margin().top + chart.get_margin().bottom)
				.attr("width", chart.get_width() + chart.get_margin().left + chart.get_margin().right);
			
			chart.svg.selectAll(".label_panel").transition(chart.transition)
				.attr("transform", "translate(" + chart.get_margin().left + ", " +
					chart.get_margin().top + ")");
				
			//calculate cell size
			chart.cellSize = {
				width: chart.get_width() / chart.get_ncols(),
				height: chart.get_height() / chart.get_nrows()
			}
			
			//create scales
			chart.axes.scale_x = d3.scaleLinear()
				.domain( [0, chart.get_ncols() - 1] )
				.range( [0, chart.get_width() - chart.cellSize.width] )
				.nice();
			chart.axes.scale_y = d3.scaleLinear()
				.domain( [0, chart.get_nrows() - 1] )
				.range( [0, chart.get_height() - chart.cellSize.height] )
				.nice();

			//add column labels
			var colLabels = chart.svg.select(".col").selectAll(".label")
					.data(chart.get_colIds().slice());
			colLabels.exit()
				.remove();
			colLabels.enter()
				.append("text")
					.attr("class", "label")
					.attr("transform", "rotate(-90)")
					.style("text-anchor", "start")
					.on("mouseover", chart.get_labelMouseOver)
					.on("mouseout", chart.get_labelMouseOut)
				.merge(colLabels).transition(chart.transition)
					.attr("font-size", d3.min([chart.cellSize.width, 12]))
					.attr("dy", function(d) {return chart.axes.scale_x(chart.get_heatmapCol(d) + 1);})
					.attr("dx", 2)
					.text(function(d) {return chart.get_colLabels(d);});		
			
			//add row labels
			var rowLabels = chart.svg.select(".row").selectAll(".label")
					.data(chart.get_rowIds().slice());
			rowLabels.exit()
				.remove();
			rowLabels.enter()
				.append("text")
					.attr("class", "label")
					.style("text-anchor", "end")
					.on("mouseover", chart.get_labelMouseOver)
					.on("mouseout", chart.get_labelMouseOut)
				.merge(rowLabels).transition(chart.transition)
					.attr("font-size", d3.min([chart.cellSize.height, 12]))
					.attr("dy", function(d) {return chart.axes.scale_y(chart.get_heatmapRow(d) + 1);})
					.attr("dx", -2)
					.text(function(d) {return chart.get_rowLabels(d)});
			
			inherited_update();

			return chart;
		}		
		
		return chart;
	}

	function scatterChart(id, chart) {

		if(chart === undefined)
			chart = axisChartBase();
		if(id === undefined)
			id = "layer" + chart.layers.length;

	  var layer = chart.add_layer(id)
			.add_property("x")
			.add_property("y")
			.add_property("style", "")
			.add_property("npoints")
			.add_property("dataIds")
	    .add_property("size", 4)
			.add_property("groupName", function(i){return i;});
		chart.setActiveLayer(id);
		
	  // Set default for dataIds, namely to return numbers accoring to numPoints
	  layer.dataIds( function() { return d3.range( layer.get_npoints() ) } );

	  layer.findPoints = function(lu, rb){
	    return layer.g.selectAll(".data_point")
	      .filter(function(d) {
	        var loc = [layer.chart.axes.scale_x(layer.chart.get_x(d)), 
	                  layer.chart.axes.scale_y(layer.get_y(d))]
	        return (loc[0] - layer.get_size(d) <= rb[0]) && 
	          (loc[1] - layer.get_size(d) <= rb[1]) && 
	          (loc[0] + layer.get_size(d) >= lu[0]) && 
	          (loc[1] + layer.get_size(d) >= lu[1]);
	      });
	  }
	  layer.zoom = function(lu, rb){
	    layer.chart.domainX([layer.chart.axes.scale_x.invert(lu[0]), 
	                        layer.chart.axes.scale_x.invert(rb[0])]);
	    layer.chart.domainY([layer.chart.axes.scale_y.invert(rb[1]),
	                        layer.chart.axes.scale_y.invert(lu[1])]);
	    layer.chart.update();
	  }
	  layer.resetDomain = function(){
	    layer.chart.domainX("reset");
	    layer.chart.domainY("reset");
	    layer.chart.update();
	  }

	  // Set default for numPoints, namely to count the data provided for x
	  layer.npoints( function() {
	    var val;
	    for( var i = 0; i < 10000; i++ ) {
	      try {
	        // try to get a value
	        val = layer.get_x(i)
	      } catch( exc ) {
	        // if call failed with exception, report the last successful 
	        // index, if any, otherwise zero
	        return i > 0 ? i-1 : 0;  
	      }
	      if( val === undefined ) {
	        // same again: return last index with defines return, if any,
	        // otherwise zero
	        return i > 0 ? i-1 : 0;  
	      }
	    }
	    // If we exit the loop, there is either something wrong or there are
	    // really many points
	    throw "There seem to be very many data points. Please supply a number via 'numPoints'."
	  })
		
		layer.layerDomainX(function() {
			return d3.extent( layer.get_dataIds(), function(k) { return layer.get_x(k) } )
		});
		layer.layerDomainY(function() {
			return d3.extent( layer.get_dataIds(), function(k) { return layer.get_y(k) } )
		});

		//for now there is no inherited_update for a layer
	  //var inherited_update = obj.update;
	  
		layer.update_not_yet_called = true;
		
	  layer.update = function() {

	    if( layer.update_not_yet_called ) {
	      layer.update_not_yet_called = false;   
	      layer.g = layer.chart.svg.append("g")
					.attr("class", "chart_g");
	      layer.add_click_listener();
	    } 
			
			layer.g.transition(layer.chart.transition)
				.attr("transform", "translate(" + 
					layer.get_margin().left + ", " +
					layer.get_margin().top + ")");

			var sel = layer.g.selectAll( ".data_point" )
	      .data( layer.get_dataIds() );
	    sel.exit()
	      .remove();  
	    sel.enter().append( "circle" )
	      .attr( "class", "data_point" )
	      .attr( "r", function(d) {return layer.get_size(d)} )
	    .merge( sel )
	      .on( "click", layer.get_on_click )
	      .transition(layer.chart.transition)
	        .attr( "cx", function(d) { return layer.chart.axes.scale_x( layer.get_x(d) ) } )
	        .attr( "cy", function(d) { return layer.chart.axes.scale_y( layer.get_y(d) ) } )
	        .attr( "style", function(d) { return layer.get_style(d) } );

	    return layer;
	  };

	  return layer;
	}

	function lineChart(id, chart){
		
		if(chart === undefined)
			chart = axisChartBase();
		if(id === undefined)
			id = "layer" + chart.layers.length;
		
		var layer = chart.add_layer(id)
			.add_property("nlines")
			.add_property("lineIds", function() {return d3.range(layer.get_nlines());})
			.add_property("lineFun")
			.add_property("lineStyle", "")
			.add_property("lineStepNum", 100);
		chart.setActiveLayer(id);
		
		layer.update_not_yet_called = true;
		
		layer.update = function(){
	    
			if( layer.update_not_yet_called ) {
	      layer.update_not_yet_called = false;
	      layer.g = layer.chart.svg.append("g")
					.attr("class", "chart_g");
	    }
			
			layer.g.transition(layer.chart.transition)
				.attr("transform", "translate(" + 
					layer.get_margin().left + ", " +
					layer.get_margin().top + ")");
			
			//define the length of each step
			var lineStep = (layer.chart.axes.scale_x.domain()[1] - 
											layer.chart.axes.scale_x.domain()[0]) / 
											layer.get_lineStepNum();

			var lines = layer.g.selectAll(".line")
				.data(layer.get_lineIds());
			lines.exit()
				.remove();
			lines.enter()
				.append("path")
					.attr("class", "line")
					.attr("fill", "none")
					.attr("stroke", "black")
					.attr("stroke-width", 1.5)
						.merge(lines).transition(layer.chart.transition)
							.attr("style", function(d){
								return layer.get_lineStyle(d);
							})
							.attr("d", function(d){
								var lineData = [];
								
								for(var i = layer.chart.axes.scale_x.domain()[0]; 
										i < layer.chart.axes.scale_x.domain()[1]; i += lineStep)
									lineData.push({
										x: i,
										y: layer.get_lineFun(d, i)
									});
								
								var line = d3.line()
									.x(function(c) {return layer.chart.axes.scale_x(c.x);})
									.y(function(c) {return layer.chart.axes.scale_y(c.y);});
								
								return line(lineData);
							});

				return layer;
			}
				
		return layer;
	}

	function cache( f ) {
	  var the_cache = {}
	  return function() {
	    if( arguments[0] === "clear" ) {
	      the_cache = {}
	      return undefined;
	    }
	    if( !( arguments in Object.keys(the_cache) ) &&
				!(arguments.length == 0 && Object.keys(the_cache).length != 0))
	      the_cache[arguments] = f.apply( undefined, arguments );
	    return the_cache[arguments];
	  }
	}

	function fireEvent(element,event){
		if (document.createEventObject){
			// dispatch for IE
			var evt = document.createEventObject();
			return element.fireEvent('on'+event,evt)
		} else {
	    // dispatch for firefox + others
	    var evt = document.createEvent("HTMLEvents");
	    evt.initEvent(event, true, true ); // event type,bubbling,cancelable
	    return !element.dispatchEvent(evt);
	  }
	}

	function getEuclideanDistance(a, b) {
		if(a.length != b.length)
			throw "Error in getEuclideanDistance: length of the" +
				"input vectors is not the same";
		var sum = 0;
		for(var i = 0; i < a.length; i++)
			sum += (a[i] - b[i]) * (a[i] - b[i]);
		
		return Math.sqrt(sum);
	}

	function heatmapChart(id, chart){

		if(chart === undefined)
			chart = tableChartBase();
		if(id === undefined)
			id = "layer" + chart.layers.length;
		
		//TO DO: See if we need colIds and rowIds to be stored separately for
		//each layer
		
		var layer = chart.add_layer(id)
			.add_property("value")
			.add_property("mode", "default")
			.add_property("colour", function(val) {return layer.colourScale(val);})
			.add_property("palette", d3.interpolateOrRd)
			.add_property("colourRange", function() {return layer.dataRange()})
			.add_property("labelClick", function() {})
			.add_property("cellMouseOver", function() {})
			.add_property("cellMouseOut", function() {})
			.add_property("clusterRowsMetric", getEuclideanDistance)
			.add_property("clusterColsMetric", getEuclideanDistance);
		
		chart.setActiveLayer(id);
		
		//returns maximum and minimum values of the data
		layer.dataRange = function(){
			var i = 0, range, newRange,
				rowIds = layer.get_rowIds(),
				colIds = layer.get_colIds();
			do{
				newRange = d3.extent(colIds, 
					function(col) {return layer.get_value(rowIds[i], col);});
				if(typeof range === "undefined")
					range = newRange;
				if(newRange[0] < range[0])
					range[0] = newRange[0];
				if(newRange[1] > range[1])
					range[1] = newRange[1];
				i++;
			}while (i < layer.get_nrows())
				
			return range;
		}

		//find all the cells inside a rectangle
		layer.findPoints = function(lu, rb){
			return layer.g.selectAll(".data_point")
				.filter(function(d) {
					var loc = [layer.chart.axes.scale_x(layer.chart.get_heatmapCol(d[1])), 
										layer.chart.axes.scale_y(layer.get_heatmapRow(d[0]))]
					return (loc[0] <= rb[0]) && (loc[1] <= rb[1]) && 
						(loc[0] + layer.chart.cellSize.width >= lu[0]) && 
						(loc[1] + layer.chart.cellSize.height>= lu[1]);
				});
		}

		layer.zoom = function(lu, rb){
			

			return layer;
		}
			
		//reset a colourScale
		//by default this function is to be called during each update
		//yet some transformations, such as zooming, will avoid it
		layer.resetColourScale = function(){
		//create colorScale
			var range = layer.get_colourRange();
			var scale = d3.scaleSequential(layer.get_palette).domain(range);
			/*
			layer.colourScale = function(val){
				val = (val - range[0]) / 
					(range[1] - range[0]);
				return scale(val);
			} */
			
			layer.colourScale = scale;
		}	
		
		/*var inherited_put_static_content = layer.put_static_content;
		layer.put_static_content = function(element){	
			inherited_put_static_content(element);
			layer.resetColourScale();
		}
		*/
		
		//some default onmouseover and onmouseout behaviour for cells and labels
		//may be later moved out of the main library
		layer.cellMouseOver(function(d) {
			//change colour and class
			d3.select(this)
				.attr("fill", function(d) {
					return d3.rgb(layer.get_colour(layer.get_value(d[0], d[1]))).darker(0.5);
				})
				.classed("hover", true);		
			//find column and row labels
			layer.chart.svg.select(".col").selectAll(".label")
				.filter(function(dl) {return dl == d[1];})
					.classed("hover", true);
			layer.chart.svg.select(".row").selectAll(".label")
				.filter(function(dl) {return dl == d[0];})
					.classed("hover", true);
			//show label
			layer.chart.container.select(".inform")
					.style("left", (d3.event.pageX + 10) + "px")
					.style("top", (d3.event.pageY - 10) + "px")
					.select(".value")
						.html("Row: <b>" + d[0] + "</b>;<br>" + 
							"Col: <b>" + d[1] + "</b>;<br>" + 
							"value = " + layer.get_value(d[0], d[1]));  
			layer.chart.container.select(".inform")
				.classed("hidden", false);
		});
		layer.cellMouseOut(function() {
			//change colour and class
			d3.select(this)
				.attr("fill", function(d) {
					return layer.get_colour(layer.get_value(d[0], d[1]));
				})
				.classed("hover", false);
			//deselect row and column labels
			layer.chart.svg.selectAll(".label")
				.classed("hover", false);
			layer.chart.container.select(".inform")
				.classed("hidden", true);
		});
		
		//set default clicking behaviour for labels (ordering)
		layer.labelClick(function(d){
			//check whether row or col label has been clicked
			var type;
			d3.select(this.parentNode).classed("row") ? type = "row" : type = "col";
			//if this label is already selected, flip the heatmap
			if(d3.select(this).classed("selected")){
				type == "col" ? layer.chart.reorderRow("flip") : layer.chart.reorderCol("flip");
				layer.chart.update();
			} else {
				//unselect other
				layer.chart.svg.select("." + type).selectAll(".label")
					.classed("selected", false);
				//select new label and chage ordering
				d3.select(this).classed("selected", true);
				if(type == "col")
					layer.chart.reorderRow(function(a, b){
						return layer.get_value(b, d) - layer.get_value(a, d);
					})
				else
					layer.chart.reorderCol(function(a, b){
						return layer.get_value(d, b) - layer.get_value(d, a);
					});
				layer.chart.update();
			}
		});
		
		//layer.update_not_yet_called = true;
		
		layer.updateColour = function() {
			layer.g.selectAll(".data_point")
				.attr("fill", function(d) {
					return layer.get_colour(layer.get_value(d[0], d[1]));
				});
		}
		
		layer.updateSVG = function() {
			
			if(typeof layer.canvas != "undefined")
				layer.canvas.classed("hidden", true);
			if(typeof layer.g == "undefined"){
				layer.g = layer.chart.svg.append("g");
				layer.add_click_listener();
			} else {
				layer.g.classed("hidden", false);
			}
					
			//resize heatmap body
			layer.g.transition(layer.chart.transition)
				.attr("transform", "translate(" + layer.get_margin().left + ", " +
						layer.get_margin().top + ")");
						
			//add rows
			var rows = layer.g.selectAll(".data_row").data(layer.get_rowIds().slice());
			rows.exit()
				.remove();
			rows.enter()
				.append("g")
					.attr("class", "data_row")
				.merge(rows).transition(layer.chart.transition)
					.attr("transform", function(d) {
						return "translate(0, " + 
							layer.chart.axes.scale_y(layer.get_heatmapRow(d)) + ")";
					});
							
			//add cells	
			var cells = layer.g.selectAll(".data_row").selectAll(".data_point")
				.data(function(d) {
					return layer.get_colIds().map(function(e){
						return [d, e];
					})
				});
			cells.exit()
				.remove();
			cells.enter()
				.append("rect")
					.attr("class", "data_point")
					.on("mouseover", layer.get_cellMouseOver)
					.on("mouseout", layer.get_cellMouseOut)
					.on("click", function(d) {
						layer.get_on_click(d[0], d[1]);
					})
				.merge(cells).transition(layer.chart.transition)
					.attr("x", function(d){
						return layer.chart.axes.scale_x(layer.chart.get_heatmapCol(d[1]));
					})
					.attr("width", layer.chart.cellSize.width)
					.attr("height", layer.chart.cellSize.height);
			layer.updateColour();
			//TO DO: See if it's better to do something more clever about having several layers
			layer.chart.svg
				.selectAll(".label")
				.on("click", layer.get_labelClick);
		}
		layer.updateCanvas = function() {
		
			if(typeof layer.g != "undefined")
				layer.g.classed("hidden", true);
			if(typeof layer.canvas == "undefined")
				layer.canvas = layer.chart.container.append("canvas")
			else
				layer.canvas.classed("hidden", false);

			//if there is any canvas, remove it as well
			layer.canvas.remove();
			
			//create a canvas object
			var heatmapBody = layer.chart.container.append("canvas")
				.style("position", "absolute")
				.style("left", layer.get_margin().left + "px")
				.style("top", layer.get_margin().top + "px")
				.property("width", layer.get_width())
				.property("height", layer.get_height())
				.node().getContext("2d");
			var pixelHeatmap = document.createElement("canvas");
			pixelHeatmap.width = layer.get_ncols();
			pixelHeatmap.height = layer.get_nrows();
			
			//store colour of each cell
			var rgbColour, position;
			//create an object to store information on each cell of a heatmap
			var pixelData = new ImageData(layer.get_ncols(), layer.get_nrows());

			for(var i = 0; i < layer.get_rowIds().length; i++)
				for(var j = 0; j < layer.get_colIds().length; j++) {
						rgbColour = d3.rgb(layer.get_colour(layer.get_value(layer.get_rowIds()[i], 
																														layer.get_colIds()[j])));
						position = layer.get_heatmapRow(layer.get_rowIds()[i]) * layer.get_ncols() * 4 +
							layer.get_heatmapCol(layer.get_colIds()[j]) * 4;
						pixelData.data[position] = rgbColour.r;
						pixelData.data[position + 1] = rgbColour.g;
						pixelData.data[position + 2] = rgbColour.b;
				}
			//set opacity of all the pixels to 1
			for(var i = 0; i < layer.get_ncols() * layer.get_nrows(); i++)
				pixelData.data[i * 4 + 3] = 255;
			
			//put a small heatmap on screen and then rescale it
			pixelHeatmap.getContext("2d").putImageData(pixelData, 0 , 0);

			heatmapBody.imageSmoothingEnabled = false;
			//probaly no longer required, but let it stay here just in case
	    //heatmapBody.mozImageSmoothingEnabled = false;
			//heatmapBody.webkitImageSmoothingEnabled = false;
	    //heatmapBody.msImageSmoothingEnabled = false;

			heatmapBody.drawImage(pixelHeatmap, 0, 0, 
				layer.get_colIds().length, layer.get_rowIds().length,
				0, 0,	layer.get_width(), layer.get_height());
		}
		
		layer.update = function() {
			
			//if(layer.update_not_yet_called){
			//	layer.update_not_yet_called = false;
			//	layer.resetColourScale();
			//}
			
			layer.resetColourScale();
		
			if(layer.get_mode() == "default")
				layer.get_ncols() * layer.get_nrows() > 5000 ? layer.mode("canvas") : layer.mode("svg");
			
			if(layer.get_mode() == "canvas") {
				layer.updateCanvas();
				return layer;
			}
			if(layer.get_mode() == "svg") {
				layer.updateSVG();
				return layer;
			}
			
			throw "Error in function 'heatmapChart.update': mode did not correspond to any " +
				"existing type ('canvas', 'svg' or 'default')";
		}
		
		layer.clusterRows = function(){
			var items = {}, it = [],
				rowIds = layer.get_rowIds(),
				colIds = layer.get_colIds();
			
			for(var i = 0; i < rowIds.length; i++) {
				for(var j = 0; j < colIds.length; j++)
					it.push(layer.get_value(rowIds[i], colIds[j]));
				items[rowIds[i]] = it.slice();
				it = [];
			}
			
			var getDistance = function(a, b) {
				return layer.get_clusterRowsMetric(items[a], items[b]);
			}
			
			var newOrder = [];
			var traverse = function(node) {
				if(node.value){
					newOrder.push(node.value);
					return;
				}
				traverse(node.left);
				traverse(node.right);
			}
			
			var clusters = clusterfck.hcluster(rowIds, getDistance, clusterfck.COMPLETE_LINKAGE);
			traverse(clusters);
			
			layer.chart.reorderRow(function(a, b){
				return newOrder.indexOf(a) - newOrder.indexOf(b);
			});
			
			layer.chart.update();
		}
		
		layer.clusterCols = function(){
			var items = {}, it = [],
				rowIds = layer.get_rowIds(),
				colIds = layer.get_colIds();
			
			for(var i = 0; i < colIds.length; i++) {
				for(var j = 0; j < rowIds.length; j++)
					it.push(layer.get_value(rowIds[j], colIds[i]));
				items[colIds[i]] = it.slice();
				it = [];
			}

			
			var getDistance = function(a, b) {
				return layer.get_clusterColsMetric(items[a], items[b]);
			}
			
			var newOrder = [];
			var traverse = function(node) {
				if(node.value){
					newOrder.push(node.value);
					return;
				}
				traverse(node.left);
				traverse(node.right);
			}
			
			var clusters = clusterfck.hcluster(colIds, getDistance, clusterfck.COMPLETE_LINKAGE);
			traverse(clusters);
			
			layer.chart.reorderCol(function(a, b){
				return newOrder.indexOf(a) - newOrder.indexOf(b);
			});
			
			layer.chart.update();
		}
		
		return layer;
	}

	function sigmoid( x, midpoint, slope ) {
	  return 1 / ( 1 + Math.exp( -slope * ( x - midpoint ) ) )
	}

	function make_stretched_sigmoid( midpoint, slope, xl, xr ) {
	  var yl = sigmoid( xl, midpoint, slope, 0, 1 )
	  var yr = sigmoid( xr, midpoint, slope, 0, 1 )
	  var ym = Math.min( yl, yr )
	  return function(x) { return ( sigmoid( x, midpoint, slope, 1 ) - ym ) / Math.abs( yr - yl ) }
	}

	function sigmoidColorSlider() {

	  // for now only horizontal

	  var obj = chartBase()
	    .add_property( "straightColorScale" )
	    .add_property( "midpoint", undefined )
	    .add_property( "slopewidth", undefined )
			.add_property( "on_change", function() {})
	    .height( 50 );    

	  obj.straightColorScale(
	    d3.scaleLinear()
	      .range( [ "white", "darkblue" ] ) );

	  obj.clamp_markers = function() {
	    var min = d3.min( obj.get_straightColorScale.domain() );
	    var max = d3.max( obj.get_straightColorScale.domain() );
	    if( obj.get_midpoint() < min )
	       obj.midpoint( min );
	    if( obj.get_midpoint() > max )
	       obj.midpoint( max );
	    if( obj.get_slopewidth() > (max-min) )
	       obj.slopewidth( max-min );
	    if( obj.get_slopewidth() < (min-max) )
	       obj.slopewidth( min-max );
	  }
		
	  var inherited_put_static_content = obj.put_static_content;
	  obj.put_static_content = function( element ) {
	    inherited_put_static_content( element );

	    var g = obj.svg.append( "g" )
	      .attr( "class", "sigmoidColorSlider" )
	      .attr( "transform", "translate(" + obj.get_margin().left + ", " + 
																		obj.get_margin().top + ")" );  // space for axis

	    obj.axis = g.append( "g" )
	      .attr( "class", "axis" );

	    var defs = g.append( "defs" );

	    obj.gradient = defs.append( "linearGradient" )
	      .attr( "id", "scaleGradient")
	      .attr( "x1", "0%")
	      .attr( "y1", "0%")
	      .attr( "x2", "100%")
	      .attr( "y2", "0%");

	    obj.gradient.selectAll( "stop" )
	      .data( d3.range(100) )
	      .enter().append( "stop" )
	        .attr( "offset", function(d) { return d + "%" } )

	    obj.colorBar = g.append( "rect" )
	      .attr( "x", "0" )
	      .attr( "y", "5" )
	      .attr( "height", 20 )
	      .attr( "fill", "url(#scaleGradient)" )
	      .style( "stroke", "black" )
	      .style( "stroke-width", "1");

	    defs.append( "path" )
	         .attr( "id", "mainMarker" )
	         .attr( "d", "M 0 0 L 8 5 L 8 25 L -8 25 L -8 5 Z")
	         .style( "fill", "gray" )
	         .style( "stroke", "black" )

	    defs.append( "path" )
	         .attr( "id", "rightMarker" )
	         .attr( "d", "M 0 0 L 5 5 L 5 15 L 0 15 Z")
	         .style( "fill", "lightgray" )
	         .style( "stroke", "black" )

	    defs.append( "path" )
	         .attr( "id", "leftMarker" )
	         .attr( "d", "M 0 0 L -5 5 L -5 15 L 0 15 Z")
	         .style( "fill", "lightgray" )
	         .style( "stroke", "black" )

	    obj.mainMarker = g.append( "use" )
	      .attr( "xlink:href", "#mainMarker")
	      .attr( "y", 28 )
	      .call( d3.drag().on( "drag", function() {
	         obj.midpoint( obj.get_midpoint() + obj.pos_scale.invert( d3.event.dx ) );
	         obj.clamp_markers();
	         obj.update();
	      } )
					.on("end", function() {
						obj.get_on_change();
					})
				);

	    obj.rightMarker = g.append( "use" )
	      .attr( "xlink:href", "#rightMarker")
	      .attr( "y", 30 )
	      .call( d3.drag().on( "drag", function() {
	         obj.slopewidth( obj.get_slopewidth() + obj.pos_scale.invert( d3.event.dx ) );
	         obj.clamp_markers();
	         obj.update();        
	      } )
					.on("end", function() {
						obj.get_on_change();
					})
				);

	    obj.leftMarker = g.append( "use" )
	      .attr( "xlink:href", "#leftMarker")
	      .attr( "y", 30 )
	      .call( d3.drag().on( "drag", function() {
	         obj.slopewidth( obj.get_slopewidth() - obj.pos_scale.invert( d3.event.dx ) );
	         obj.clamp_markers();
	         obj.update();        
	      } )
				.on("end", function() {
					obj.get_on_change();
				})
			);

	  }
		
	  var inherited_update = obj.update;
	  obj.update = function() {
	    inherited_update();
			
	    var percent_scale = d3.scaleLinear()
	      .domain( [0, 100] )
	      .range( obj.get_straightColorScale.domain() );

	    if( obj.get_midpoint() == undefined )
	      obj.midpoint( percent_scale( 50 ) );

	    if( obj.get_slopewidth() == undefined )
	      obj.slopewidth( percent_scale( 15 ) );

	    obj.pos_scale = d3.scaleLinear()
	      .range( [ 0, obj.get_width() ] )
	      .domain( obj.get_straightColorScale.domain() )

	    d3.axisTop()
	      .scale( obj.pos_scale )
	      ( obj.axis );

	    obj.colorBar
	      .attr( "width", obj.get_width() );

	    //obj.the_sigmoid = function(x) { return sigmoid( x, obj.get_midpoint(), 1.38 / obj.get_slopewidth(), 0, 1 ) };
	    obj.the_sigmoid = make_stretched_sigmoid( obj.get_midpoint(), 1.38 / obj.get_slopewidth(), 
	      obj.get_straightColorScale.domain()[0], obj.get_straightColorScale.domain()[1] );

	    obj.gradient.selectAll( "stop" )
	      .data( d3.range(100) )
	      .style( "stop-color", function(d) { 
	        return obj.get_straightColorScale( 
	          percent_scale( 100 * obj.the_sigmoid( percent_scale(d) ) ) ) } ) ;

	    obj.mainMarker
	      .attr( "x", obj.pos_scale( obj.get_midpoint() ) );
	    obj.rightMarker
	      .attr( "x", obj.pos_scale( obj.get_midpoint() + obj.get_slopewidth() ) )
	    obj.leftMarker
	      .attr( "x", obj.pos_scale( obj.get_midpoint() - obj.get_slopewidth() ) )

			//obj.get_on_change();

	  }

	  return obj;

	}

	function simpleTable() {

	  obj = d3.chartBase()
	    .add_property( "record", {} )

	  obj.put_static_content = function( element ) {
	    obj.table = element.append( "table" )
	      .attr( "border", 1 );
	  }

	  obj.update = function( ) {

	    var sel = obj.table.selectAll( "tr" )
	      .data( Object.keys( obj.get_record() ) );
	    sel.exit()
	      .remove();  
	    sel.enter().append( "tr" )
	    .merge( sel )
	      .html( function(k) { return "<td>" + k + "</td><td>" 
	         + obj.get_record()[k] + "</td>" } )

	    return obj;
	  };

	  return obj;
	}

	exports.base = base;
	exports.layerBase = layerBase;
	exports.chartBase = chartBase;
	exports.axisChartBase = axisChartBase;
	exports.tableChartBase = tableChartBase;
	exports.scatterChart = scatterChart;
	exports.lineChart = lineChart;
	exports.heatmapChart = heatmapChart;
	exports.cache = cache;
	exports.fireEvent = fireEvent;
	exports.getEuclideanDistance = getEuclideanDistance;
	exports.sigmoidColorSlider = sigmoidColorSlider;
	exports.simpleTable = simpleTable;

	Object.defineProperty(exports, '__esModule', { value: true });

}));