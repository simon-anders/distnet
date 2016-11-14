"use strict";

function simpleGraph( id, chart ) {

  if(chart === undefined)
    chart = d3.axisChartBase();
  if(id === undefined)
    id = "layer" + chart.layers.length;

  var layer = chart.add_layer(id)
    .add_property("x")
    .add_property("y")
    .add_property("edge_dresser", function() {} )
    .add_property("vertex_style", "" )
    .add_property("edge_style", "stroke:black" )
    .add_property("npoints")
    .add_property("dataIds")
    .add_property("size", 4)
    .add_property("groupName", function(i){return i;})
    .add_property("edge_present", function(i,j){return true;});
  chart.setActiveLayer(id);
  
  // Set default for dataIds, namely to return numbers accoring to numPoints
  layer.dataIds( function() { return d3.range( layer.get_npoints() ) } );

  layer.update_not_yet_called = true;
  
  layer.layerDomainX(function() {
    return d3.extent( layer.get_dataIds(), function(k) { return layer.get_x(k) } )
  });
  layer.layerDomainY(function() {
    return d3.extent( layer.get_dataIds(), function(k) { return layer.get_y(k) } )
  });

  layer.update = function() {

    if( layer.update_not_yet_called ) {
      layer.update_not_yet_called = false;   
      layer.g = layer.chart.svg.append("g")
        .attr("class", "chart_g");
    } 
    
    layer.g.transition(layer.chart.transition)
      .attr("transform", "translate(" + 
        layer.get_margin().left + ", " +
        layer.get_margin().top + ")");

    var vertices = layer.get_dataIds();

    // Construct edge list of complete graph
    var edges = [];
    for (var i = 0; i < vertices.length; i++ ) {
      for (var j = i+1; j < vertices.length; j++ ) {
        edges.push( [ vertices[i], vertices[j] ] )
      }
    }

    var sel = layer.g.selectAll( ".graph_edge" )
      .data( edges );
    sel.exit()
      .remove();  
    sel.enter().append( "line" )
      .attr( "class", "graph_edge" )
    .merge( sel )
      .transition(layer.chart.transition)
        .attr( "x1", function(d) { return layer.chart.axes.scale_x( layer.get_x( d[0] ) ) } )
        .attr( "y1", function(d) { return layer.chart.axes.scale_y( layer.get_y( d[0] ) ) } )
        .attr( "x2", function(d) { return layer.chart.axes.scale_x( layer.get_x( d[1] ) ) } )
        .attr( "y2", function(d) { return layer.chart.axes.scale_y( layer.get_y( d[1] ) ) } )
        //.style( "display", function(d) { return layer.get_edge_present(d[0],d[1]) ? "yes" : "none" ; } )
        .call( function(x) { layer.get_edge_dresser(x) } )

    var sel = layer.g.selectAll( ".data_point" )
      .data( vertices );
    sel.exit()
      .remove();  
    sel.enter().append( "circle" )
      .attr( "class", "data_point" )
      .attr( "r", function(d) {return layer.get_size(d)} )
    .merge( sel )
      .transition(layer.chart.transition)
        .attr( "cx", function(d) { return layer.chart.axes.scale_x( layer.get_x(d) ) } )
        .attr( "cy", function(d) { return layer.chart.axes.scale_y( layer.get_y(d) ) } )
        .attr( "style", function(d) { return layer.get_vertex_style(d) } );
;

    return layer;
  };

  return layer;
};