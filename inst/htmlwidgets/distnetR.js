HTMLWidgets.widget({

  name: "distnetR",
  
  type: "output",
  
  factory: function( el, width, height ) {
  
    var obj = {};

    obj.widgetSel = d3.select( el );

    obj.renderValue = function( x ) {


      obj.distnet = distnet( obj.widgetSel, width, height, x.distmat, x.pointpos, 
         x.labels, x.colors );

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

