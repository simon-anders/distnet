"use strict";

function distnet( graphNodeSelector, sliderNodeSelector, distMatrix, points2D ) {


  var dark = d3.rgb( 0, 0, 90 )

  var pacer = call_pacer( 20 );

  var slider = d3.sigmoidColorSlider()
     .straightColorScale( d3.scaleLinear()
        .range( [ dark, "white" ] )
        .domain( [ 0, d3.max( d3.max( distMatrix ) ) ] ) )
     .on_drag( function() {
        pacer.do( chart.update_edge_opacity )
     })
     .place( sliderNodeSelector );

  var chart = simpleGraph( "graph" )
     .npoints( points2D.length )
     .x( function(i) { return points2D[i][0] } )
     .y( function(i) { return points2D[i][1] } )
     .transitionDuration( 0 )
     .edge_present( function( i, j ) { return slider.the_sigmoid( distMatrix[i][j] ) < .9 } )
     .edge_dresser( function( sel ) { 
        sel.style( "stroke", dark )
        sel.style( "stroke-opacity", function(d) { 
          return 1 - slider.the_sigmoid( distMatrix[d[0]][d[1]] ); } )
     } )
     .place( graphNodeSelector )
    
  chart.update_edge_opacity = function() {
     d3.selectAll(".graph_edge")
        .style( "stroke-opacity", function(d) { 
           return 1 - slider.the_sigmoid( distMatrix[d[0]][d[1]] ); } );   
  }

  return obj;

} 

