"use strict";

function simpleGraph( svgElement, nodePos, edgeList ) {

  var obj = {}

  // append to svgElement
  obj.groupNode = svgElement.append( "g" )
    .classed( "graph", true )
    .style( "stroke", "black");

  // scales
  (function(){
    var mm = minmax( nodePos.map( function(a) { return a.x } ) );
    obj.scaleX = d3.scale.linear()
      .domain( [ mm[0] - 0.05 * (mm[1]-mm[0]), mm[1] + 0.05 * (mm[1]-mm[0]) ] )
      .range( [ 0, parseFloat( svgElement.attr("width") ) ] );
    mm = minmax( nodePos.map( function(a) { return a.y } ) );
    obj.scaleY = d3.scale.linear()
      .domain( [ mm[0] - 0.05 * (mm[1]-mm[0]), mm[1] + 0.05 * (mm[1]-mm[0]) ] )
      .range( [ 0, parseFloat( svgElement.attr("height") ) ] );
    fix_aspect_ratio( obj.scaleX, obj.scaleY, 1 );      
    obj.scaleX.clamp( true );
    obj.scaleY.clamp( true );
  })();

  // construct drag behavior, added in 'update'
  var drag = d3.behavior.drag()
    .on( "drag", function( d, i ) {
       d.x = obj.scaleX.invert( obj.scaleX(d.x) + d3.event.dx )
       d.y = obj.scaleY.invert( obj.scaleY(d.y) + d3.event.dy )
       obj.update() 
     } )

  // event handling
  obj.dispatch = d3.dispatch( "mouseover_node", "mouseout_node" );
  obj.on = function() { obj.dispatch.on.apply( obj.dispatch, arguments ); }

  obj.update = function( ) {

    // edges
    var sel = obj.groupNode.selectAll("line")
      .data( edgeList );
    sel.enter().append("line")
    sel.exit().remove()
    sel
      .attr( "x1", function(d) { return obj.scaleX( nodePos[d.p1].x ) } )
      .attr( "y1", function(d) { return obj.scaleY( nodePos[d.p1].y ) } )
      .attr( "x2", function(d) { return obj.scaleX( nodePos[d.p2].x ) } )
      .attr( "y2", function(d) { return obj.scaleY( nodePos[d.p2].y ) } )
      .call( obj.dressEdges )

    // points
    var sel = obj.groupNode.selectAll("circle")
      .data( nodePos );
    sel.enter().append("circle")
      .attr( "r", 6 )
      .call( drag )
      .on( "mouseover", obj.dispatch.mouseover_node )
      .on( "mouseout", obj.dispatch.mouseout_node );
    sel.exit().remove()
    sel
      .attr( "cx", function(d) { return obj.scaleX( d.x ) } )
      .attr( "cy", function(d) { return obj.scaleY( d.y ) } )
      .call( obj.dressNodes )

  }
  
  obj.dressEdges = function( edgesSelection ) {
  }

  obj.dressNodes = function( nodesSelection ) {
  }

  return obj  
}

// This function takes two linear scales, and extends the domain of one of them to get 
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

// A convenience functions
function minmax( x ) {
   return [ d3.min(x), d3.max(x) ]
}

