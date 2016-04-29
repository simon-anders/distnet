"use strict";

function graph( svgElement, nodePos, edgeList ) {

  var that = {

    update: function( ) {

      var that = this

      // points
      var sel = this.groupNode.selectAll("circle")
        .data( nodePos );
      sel.enter().append("circle")
        .attr( "r", 6 )
        .call( drag );
      sel.exit().remove()
      sel
        .attr( "cx", function(d) { return that.scaleX( d.x ) } )
        .attr( "cy", function(d) { return that.scaleY( d.y ) } )
        .call( this.dressNodes )

      // edges
      var sel = this.groupNode.selectAll("line")
        .data( edgeList );
      sel.enter().append("line")
      sel.exit().remove()
      sel
        .attr( "x1", function(d) { return that.scaleX( nodePos[d.p1].x ) } )
        .attr( "y1", function(d) { return that.scaleY( nodePos[d.p1].y ) } )
        .attr( "x2", function(d) { return that.scaleX( nodePos[d.p2].x ) } )
        .attr( "y2", function(d) { return that.scaleY( nodePos[d.p2].y ) } )
        .call( this.dressEdges )
    },
    
    dressEdges: function( edgesSelection ) {
      edgesSelection
        .style( "stroke", "black" )
    },

    dressNodes: function( nodesSelection ) {
    }

  }

  // append to svgElement
  that.groupNode = svgElement.append( "g" )
    .classed( "graph", true )

  // scales
  var mm = minmax( nodePos.map( function(a) { return a.x } ) );
  that.scaleX = d3.scale.linear()
    .domain( [ mm[0] - 0.05 * (mm[1]-mm[0]), mm[1] + 0.05 * (mm[1]-mm[0]) ] )
    .range( [ 0, parseFloat( svgElement.attr("width") ) ] );
  mm = minmax( nodePos.map( function(a) { return a.y } ) );
  that.scaleY = d3.scale.linear()
    .domain( [ mm[0] - 0.05 * (mm[1]-mm[0]), mm[1] + 0.05 * (mm[1]-mm[0]) ] )
    .range( [ 0, parseFloat( svgElement.attr("height") ) ] );
  fix_aspect_ratio( that.scaleX, that.scaleY, 1 );      
  that.scaleX.clamp( true );
  that.scaleY.clamp( true );

  // add drag behavior
  var drag = d3.behavior.drag()
    .on( "drag", function( d, i ) {
       d.x = that.scaleX.invert( that.scaleX(d.x) + d3.event.dx )
       d.y = that.scaleY.invert( that.scaleY(d.y) + d3.event.dy )
       that.update() 
     } )

  
  return that  
}

// This function takes two linear scales, and changes them to get 
// the desired x:y aspect ratio 'asp'.
function fix_aspect_ratio( scaleX, scaleY, asp ) {
   var xfactor = ( scaleX.range()[1] - scaleX.range()[0] ) / 
      ( scaleX.domain()[1] - scaleX.domain()[0] )
   var yfactor = ( scaleY.range()[1] - scaleY.range()[0] ) / 
      ( scaleY.domain()[1] - scaleY.domain()[0] )
   var curasp = xfactor / yfactor  // current aspect ratio
   if( curasp > asp ) {  // x domain has to be expanded
      var cur_dom_length = ( scaleX.domain()[1] - scaleX.domain()[0] )
      var extension = cur_dom_length * ( curasp/asp - 1 ) / 2
      scaleX.domain( [ scaleX.domain()[0] - extension, scaleX.domain()[1] + extension ] )      
   } else { // y domain has to be expanded
      var cur_dom_length = ( scaleY.domain()[1] - scaleY.domain()[0] )
      var extension = cur_dom_length * ( asp/curasp - 1 ) / 2
      scaleY.domain( [ scaleY.domain()[0] - extension, scaleY.domain()[1] + extension ] )            
   }
}

// Two convenience functions

function minmax( x ) {
   return [ d3.min(x), d3.max(x) ]
}

function square( x ) {
   return x * x
}


// Main body

var g = graph( d3.select("#mySvg"),
   [ { x:20, y:10 },
     { x:45, y:25 },
     { x:30, y:15 },
     { x: 8, y:55 } ],
   [ { p1: 0, p2: 1},
     { p1: 0, p2: 2},
     { p1: 1, p2: 3} ] );

g.dressNodes = function( nodesSelection ) {
  nodesSelection.style( "fill", function( d, i ) { return i == 1 ? "red" : "black" } )
}

g.update();


