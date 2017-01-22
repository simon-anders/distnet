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
         .attr( "id", "slider" );

      obj.distnet = distnet( "#chart", "#slider", width, height, x.distmat, x.pointpos );

    }

    obj.resize = function( width, height ) {

       obj.distnet.resize( width, height );

    }

    return obj;

  }

});



// Auxiliary functions

function rmpx( s ) {
  return parseInt( s.replace("px", "") );
}

