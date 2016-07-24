"use strict";

function distnet( svgElement, nodePos, distMatrix, scale ) {

  var edgeList = []
  for( var i = 0; i < nodePos.length; i++ ) {
    for( var j = i+1; j < nodePos.length; j++ ) {
      edgeList.push( { p1: i, p2: j, dist: distMatrix[i][j] } )
    }
  }

  var obj = simpleGraph( svgElement, nodePos, edgeList )

  obj.dressEdges = function( edgesSelection ) {
     edgesSelection
       .style( "display", function(d) { return scale( d.dist ) > .05 ? null : "none" } )
       .style( "stroke", "darkblue" )
       .style( "stroke-opacity", function(d) { return scale( d.dist ) } );
  }

  obj.colors_ = [];
  for( var i = 0; i < nodePos.length; i++ )
    obj.colors_.push( "black" );

  obj.colors = function( colors ) {
    if( colors === undefined ) { return obj.colors_; }
    obj.colors_ = colors;
  }

  obj.dressNodes = function( nodesSelection ) {
     nodesSelection
       .style( "fill", function( d, i ) { return obj.colors()[i] } );
  }

  return obj;

} 

