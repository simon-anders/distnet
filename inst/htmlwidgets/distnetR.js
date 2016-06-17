HTMLWidgets.widget({

  name: "distnetR",
  
  type: "output",
  
  factory: function( el, width, height ) {
  
    var widgetElement = el;

    d3.select(el).html(
      "<table>" +
      "  <tr><td><svg id=\"distnetSvg\"></svg></td></tr>" +
      "  <tr><td><div id=\"sliderDiv\"></div></td></tr>" +
      "</table>"
    )

    var svgNode = d3.select(el).select( "svg" )
      .attr( "width", width )
      .attr( "height", height );

    var slider;

    return {

      renderValue: function( x ) {

        var slider = sigmoidColorSlider( 
           d3.select("#sliderDiv"), 
           d3.max( d3.max( x.distmat ) ) );

        var theNet = distnet( svgNode, 
          x.pointpos.map( function(a) { return { x: a[0], y: a[1] } } ), 
          x.distmat,
          slider.scale );

        slider.onChange( theNet.update, theNet );

        theNet.update()

      },

      resize: function( width, height ) {
        svgNode
          .attr( "width", width )
          .attr( "height", height )
        // render update missing?
      },

      svgNode: svgNode
    };

  }

});



// Auxiliary functions

function rmpx( s ) {
  return parseInt( s.replace("px", "") );
}

