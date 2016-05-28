"use strict";

function simpleGraph( svgElement, nodePos, edgeList ) {

  var that = {}

  // append to svgElement
  that.groupNode = svgElement.append( "g" )
    .classed( "graph", true )
    .style( "stroke", "black");

  // scales
  (function(){
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
  })();

  // construct drag behavior, added in 'update'
  var drag = d3.behavior.drag()
    .on( "drag", function( d, i ) {
       d.x = that.scaleX.invert( that.scaleX(d.x) + d3.event.dx )
       d.y = that.scaleY.invert( that.scaleY(d.y) + d3.event.dy )
       that.update() 
     } )

  
  that.update = function( ) {

    var that = this

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

  }
  
  that.dressEdges = function( edgesSelection ) {
  }

  that.dressNodes = function( nodesSelection ) {
  }

  return that  
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


function distnet( svgElement, nodePos, distMatrix, colorScale ) {

  var edgeList = []
  for( var i = 0; i < nodePos.length; i++ ) {
    for( var j = i+1; j < nodePos.length; j++ ) {
      edgeList.push( { p1: i, p2: j, dist: distMatrix[i][j] } )
    }
  }

  var that = simpleGraph( svgElement, nodePos, edgeList )

  that.dressEdges = function( edgesSelection ) {
     edgesSelection
       .style( "display", function(d) { return d.dist < .3 ? null : "none" } )
       .style( "stroke", function(d) { return colorScale( d.dist ) } )
  }

  return that;

} 

function sigmoidColorSlider( divElement, maxVal ) {

  var that = {}

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
    .max( maxVal )
    .value( maxVal / 4 );
  td2.call( threshSlider )

  var slopeSlider = d3.slider()
    .max( threshSlider.max() * 150 )   // <- FIX this factor
    .value( threshSlider.max() * 50 );
  td3.call( slopeSlider )      

  that.update = function( ) {
    
    //var that = this;

    var mysigmoid = function( x ) { return sigmoid( x, threshSlider.value(), -slopeSlider.value(), .05 ) }; 
    
    var linColorScale = d3.scale.linear()
      .domain( [ 1, 0 ] )
      .range( [ "blue", "white" ]);

    that.colorScale = function(x) { return linColorScale( mysigmoid( x ) ) }

    theColorBar.scale = function(x) { return that.colorScale( x * threshSlider.max() ) };

    theColorBar.update();

    console.log(that.net);
    if( that.net ) {
      that.net.update();   // <- TESTING ONLY
    }

  }

  threshSlider.on( "slide", that.update );
  slopeSlider.on( "slide", that.update );

  that.update();

  return that;

}


// The sigmoid function:
function sigmoid( x, threshold, slope, threshVal ) {
   var midpoint = threshold + Math.log( 1/threshVal - 1 ) / slope
   return 1 / ( 1 + Math.exp( -slope * ( x - midpoint ) ) )
}


// Test

/*
var g = simpleGraph( d3.select("#mySvg"),
   [ { x:20, y:10 },
     { x:45, y:25 },
     { x:30, y:15 },
     { x: 8, y:55 } ],
   [ { p1: 0, p2: 1},
     { p1: 0, p2: 2},
     { p1: 1, p2: 3} ] );

var oldDresser = g.dressNodes;
g.dressNodes = function( nodesSelection ) {
  nodesSelection.style( "fill", function( d, i ) { return i == 1 ? "red" : "black" } )
  oldDresser();
}

g.update();
*/

var slider = sigmoidColorSlider( d3.select("#sliderDiv"), d3.max( d3.max( inputdata.distmat ) ) );

var theNet = distnet( d3.select("#mySvg"), 
  inputdata.points2D.map( function(a) { return { x: a[0], y: a[1] } } ), 
  inputdata.distmat,
  slider.colorScale );

console.log("A",slider.net);
slider.net = theNet;  // testing only
console.log("A",slider.net);

theNet.update()
