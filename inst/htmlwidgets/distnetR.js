HTMLWidgets.widget({

  name: "distnetR",
  
  type: "output",
  
  factory: function( el, width, height ) {
  
    d3.select(el).html(
      "<table>" +
      "  <tr><td><svg id=\"distnetSvg\"></svg></td></tr>" +
      "  <tr><td><div id=\"labelDiv\"></div></td></tr>" +
      "  <tr><td><div id=\"sliderDiv\"></div></td></tr>" +
      "</table>"
    )

    var obj = {};

    obj.widgetElement = el;

    obj.renderValue = function( x ) {

      obj.slider = sigmoidColorSlider( 
         d3.select(obj.widgetElement).select("#sliderDiv"), 
         d3.max( d3.max( x.distmat ) ) );

      obj.resize( width, height );

      var theNet = distnet( 
        d3.select(obj.widgetElement).select("#distnetSvg"), 
        x.pointpos.map( function(a) { return { x: a[0], y: a[1] } } ), 
        x.distmat,
        obj.slider.scale );

      obj.slider.on( "change.distnetR", theNet.update );

      theNet.update()

    }

    obj.resize = function( width, height ) {
      var sliderHeight = d3.select(obj.widgetElement).select("#sliderDiv")
        .node().getBoundingClientRect().height; 
      d3.select(obj.widgetElement).select("#distnetSvg")
        .attr( "width", width )
        .attr( "height", d3.max([ 100, height - sliderHeight ]) );
      obj.slider.update();
    }

    return obj;

  }

});



// Auxiliary functions

function rmpx( s ) {
  return parseInt( s.replace("px", "") );
}

