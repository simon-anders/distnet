"use strict";

function simpleGraph( id, chart ) {

  if(chart === undefined) {
    chart = lc.axisChartBase();
  }
  if(id === undefined)
    id = "layer" + chart.layers.length;

  var inherited_put_static_content = chart.put_static_content;
  chart.put_static_content = function( element ) {
    inherited_put_static_content( element );
    // Remove axes:
    element.selectAll( "g.axis" ).style( "display", "none" );
  }

  var layer = chart.add_layer(id)
    .add_property("x")
    .add_property("y")
    .add_property("edge_dresser", function() {} )
    .add_property("vertex_dresser", function() {} )
    .add_property("edge_style", "stroke:black" )
    .add_property("npoints")
    .add_property("dataIds")
    .add_property("size", 4)
    .add_property("groupName", function(i){return i;})
    .add_property("edge_present", function(i,j){return true;});
  chart.setActiveLayer(id);
  
  // Set default for dataIds, namely to return numbers accoring to numPoints
  layer.dataIds( function() { return d3.range( layer.get_npoints() ) } );
  
  layer.layerDomainX(function() {
    return d3.extent( layer.get_dataIds(), function(k) { return layer.get_x(k) } )
  });
  layer.layerDomainY(function() {
    return d3.extent( layer.get_dataIds(), function(k) { return layer.get_y(k) } )
  });

  layer.update_not_yet_called = true;

  layer.update = function() {

    if( layer.update_not_yet_called ) {
      // layer.update_not_yet_called is set to false further below
      layer.g = layer.chart.svg.append("g")
        .attr("class", "chart_g");
    } 

    var transition_or_selection = 
      layer.get_transitionDuration() > 0 ?
        function( sel ) { return sel.transition( chart.transition ); } :
        function( sel ) { return sel; };
    
    layer.g.call( transition_or_selection )
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
      .data( edges )
      .call( function(x) { layer.get_edge_dresser(x) } );

    if( !layer.update_not_yet_called ) {
      return;
    }
    layer.update_not_yet_called = false;   
      

    var sel = layer.g.selectAll( ".graph_edge" )
      .data( edges );
    sel.exit()
      .remove();  
    sel.enter().append( "line" )
      .attr( "class", "graph_edge" )
    .merge( sel )
      .call( transition_or_selection )
        .attr( "x1", function(d) { return layer.chart.axes.scale_x( layer.get_x( d[0] ) ) } )
        .attr( "y1", function(d) { return layer.chart.axes.scale_y( layer.get_y( d[0] ) ) } )
        .attr( "x2", function(d) { return layer.chart.axes.scale_x( layer.get_x( d[1] ) ) } )
        .attr( "y2", function(d) { return layer.chart.axes.scale_y( layer.get_y( d[1] ) ) } )
        .style( "display", function(d) { return layer.get_edge_present(d[0],d[1]) ? "initial" : "none" ; } )
        .call( function(x) { layer.get_edge_dresser(x) } )

    var sel = layer.g.selectAll( ".graph_vertex" )
      .data( vertices );
    sel.exit()
      .remove();  
    sel.enter().append( "circle" )
      .attr( "class", "graph_vertex" )
      .attr( "r", function(d) {return layer.get_size(d)} )
    .merge( sel )
      .call( transition_or_selection )
        .attr( "cx", function(d) { return layer.chart.axes.scale_x( layer.get_x(d) ) } )
        .attr( "cy", function(d) { return layer.chart.axes.scale_y( layer.get_y(d) ) } )
        .call( function(x) { layer.get_vertex_dresser(x) } );

    return layer;
  };

  return layer;
};