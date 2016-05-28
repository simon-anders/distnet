// color bar

function colorBar( svgElement ) {

  var that = {};

  that.group = svgElement.append( "g" )
      .classed( "colorbar", true );

  that.group.append( "rect" )
      .attr( "width", "100%" )
      .attr( "height", "100%" )
      .style( "stoke", "none" )
      .style( "fill", "none" )
      .classed( "dummy", true );
  
  that.scale = d3.scale.linear()
    .domain( [ 0, 1 ] )
    .range( [ "white", "black" ] );

  that.update = function() {
    var width = this.group.node().getBBox().width;
    var height = this.group.node().getBBox().height;
    var numRects = 100;
    sel = this.group.selectAll( "rect:not(.dummy)" )
      .data( d3.range( numRects ) );
    sel.enter()
      .append( "rect" )
      .style( "stroke", "none" )
      .attr( "y", 0 );
    sel.exit()
      .remove();
    sel
      .attr( "x", function( d, i ) { return width * i / numRects } )
      .attr( "width", width/numRects+0.5 )
      .attr( "height", height )
      .style( "fill", function( d, i ) { return that.scale( (i+0.5) / numRects ) } );
  }

  return that;
}