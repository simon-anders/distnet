"use strict";

function scatterPlot( svgElement, data ) {

  var obj = { 
    svgElement: svgElement,
    data: data
  };

  obj.update = function() {

    // scales
    (function(){
      function minmax( x ) { return [ d3.min(x), d3.max(x) ] };
      var mm = minmax( obj.data.map( function(a) { return a.x } ) );
      obj.scaleX = d3.scale.linear()
        .domain( [ mm[0] - 0.05 * (mm[1]-mm[0]), mm[1] + 0.05 * (mm[1]-mm[0]) ] )
        .range( [ 0, parseFloat( svgElement.attr("width") ) ] );
      mm = minmax( obj.data.map( function(a) { return a.y } ) );
      obj.scaleY = d3.scale.linear()
        .domain( [ mm[0] - 0.05 * (mm[1]-mm[0]), mm[1] + 0.05 * (mm[1]-mm[0]) ] )
        .range( [ 0, parseFloat( svgElement.attr("height") ) ] );
    }());

    var sel = obj.svgElement.selectAll("circle")
      .data( data );
    sel.enter().append("circle")
      .attr( "r", 6 )
    sel.exit().remove()
    sel
      .attr( "cx", function(d) { return obj.scaleX( d.x ) } )
      .attr( "cy", function(d) { return obj.scaleY( d.y ) } )
  }

  return obj;

}
