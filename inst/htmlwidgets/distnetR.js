HTMLWidgets.widget({

  name: "distnetR",
  
  type: "output",
  
  factory: function( el, width, height ) {
  
    var obj = {};

    obj.widgetSel = d3.select( el );

    obj.renderValue = function( x ) {

      obj.widgetSel.append("div")
         .attr( "id", "chart" );

      obj.widgetSel.append("div")
         .text("Slider");

      distnet( "#chart", "#slider", x.distmat, x.pointpos );

    }

    obj.resize = function( width, height ) {
    }

    return obj;

  }

});



// Auxiliary functions

function rmpx( s ) {
  return parseInt( s.replace("px", "") );
}

