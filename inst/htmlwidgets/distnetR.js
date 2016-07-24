HTMLWidgets.widget({

  name: "distnetR",
  
  type: "output",
  
  factory: function( el, width, height ) {
  
    d3.select(el).html(
      "<table>" +
      "  <tr><td><svg id=\"distnetSvg\"></svg></td></tr>" +
      "  <tr><td><div id=\"labelDiv\">&nbsp;</div></td></tr>" +
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

      obj.net = distnet( 
        d3.select(obj.widgetElement).select("#distnetSvg"), 
        x.pointpos.map( function(a) { return { x: a[0], y: a[1] } } ), 
        x.distmat,
        obj.slider.scale );
      obj.net.colors( x.colors );
      console.log( obj.net.colors() );

      obj.slider.on( "change.distnetR", obj.net.update, obj.net );

      obj.net.on( "mouseover_node", function( d, i ) { 
        d3.select(obj.widgetElement).select("#labelDiv")
          .html( x.labels[i] );
      } );

      obj.net.on( "mouseout_node", function( d, i ) { 
        d3.select(obj.widgetElement).select("#labelDiv")
          .html( "&nbsp;" );
      } );


      obj.net.update()

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

