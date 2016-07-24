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

  return obj;

} 

function sigmoidColorSlider( divElement, maxVal, minColor, maxColor ) {

  var obj = {}

  obj.maxVal = maxVal===undefined ? 1 : maxVal;
  obj.minColor = minColor===undefined ? "darkblue" : maxVal;
  obj.maxColor = maxColor===undefined ? "white" : maxVal;

  var table = divElement.append("table")
    .style( "width", "100%" )
    .style( "table-layout", "fixed" );
  var td1 = table.append("tr").append("td");
  var td2 = table.append("tr").append("td");
  var td3 = table.append("tr").append("td");
  
  var colorBarContainer = td1.append( "svg" )
    .attr( "width", "100%")
    .style( "height", "30px" );
  var theColorBar = colorBar( colorBarContainer );

  var threshSlider = d3.slider()
    .axis( true )
    .max( obj.maxVal )
    .value( obj.maxVal / 4 );
  td2.call( threshSlider )

  var slopeSlider = d3.slider()
    .max( 200 / threshSlider.max() )
    .value( 50 / threshSlider.max() );
  td3.call( slopeSlider )      

  obj.dispatch = d3.dispatch( "change" );

  obj.on = function() { obj.dispatch.on.apply( obj.dispatch, arguments ); }

  obj.update = function( ) {
    
    obj.scale = function( x ) { return sigmoid( x, threshSlider.value(), -slopeSlider.value(), .05 ) }; 
    
    var linColorScale = d3.scale.linear()
      .domain( [ 1, 0 ] )
      .range( [ obj.minColor, obj.maxColor ] );

    obj.colorScale = function(x) { return linColorScale( obj.scale( x ) ) }

    theColorBar.scale = function(x) { return obj.colorScale( x * threshSlider.max() ) };

    theColorBar.update();

  }

  threshSlider.on( "slide", function() { obj.update(); obj.dispatch.change(); } );
  slopeSlider.on( "slide", function() { obj.update(); obj.dispatch.change(); } );

  obj.update();

  return obj;

}


// The sigmoid function:
function sigmoid( x, threshold, slope, threshVal ) {
   var midpoint = threshold + Math.log( 1/threshVal - 1 ) / slope
   return 1 / ( 1 + Math.exp( -slope * ( x - midpoint ) ) )
}
