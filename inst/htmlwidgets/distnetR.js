HTMLWidgets.widget({

  name: "distnetR",
  
  type: "output",
  
  factory: function( el, width, height ) {
  
    var svgNode = d3.select(el).append( "svg" )
      .attr( "width", width )
      .attr( "height", height )
      
    return {

      renderValue: function( x ) {
        console.log( x )
        svgNode.append( "circle" )
          .attr( "cx", rmpx(svgNode.style("width")) / 2 )
          .attr( "cy", rmpx(svgNode.style("height")) / 2 )
          .attr( "r", 20 )
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


// The D3 update function

function update() {


   // points:

   selection = svgNode.selectAll("circle")
      .data( pointsdata )
   selection.enter().append("circle")
      .attr( "r", 9 )
      .call( drag )
      .on( "dblclick", function(d,i) {
          selected_point = i
          update()
      })
      .append("svg:title")
         .text( function(d) { return d.id } )
   selection
      .attr( "cx", function(d) { return scales.x( d.x ) } )
      .attr( "cy", function(d) { return scales.y( d.y ) } )
      .classed( "selected", function(d,i) { return i == selected_point } )


   // color bar:

   var color_bar_height = d3.select("#color_bar").attr("height")
   var line_color = window.getComputedStyle( 
       d3.select("#scatterpanel").selectAll("line:not(.selected)").node() )["stroke"]
   selection = d3.select("#color_bar").selectAll("rect")
      .data( distvalgrid.filter( function(x) { return mysigmoid(x) > alpha_threshold } ) )
   selection.enter().append("rect")
      .attr( "y", "0" )
      .attr( "width", color_bar_scale( distvalgridstep ) )
      .attr( "height", color_bar_height )
      .style( "fill", line_color )
   selection.exit()
      .style( { "fill-opacity": "0" } )
   selection
      .attr( "x", function(d) { return color_bar_scale( d ) } )
      .style( "fill-opacity", function(d) { return mysigmoid( d ) } )

   
   // Point info text

   if( selected_point > 0 ) 
       d3.select("#point_text").html( pointsdata[selected_point].text )
   else
       d3.select("#point_text").html( null )


   var rawstress = 0
   var confsqdistsum = 0
   for( i = 0; i < distslist.length; i++ ) {
      var confdist = Math.sqrt( square( pointsdata[ distslist[i].p2 ].x - pointsdata[ distslist[i].p1 ].x ) + 
         square( pointsdata[ distslist[i].p2 ].y - pointsdata[ distslist[i].p1 ].y ) )
      rawstress += square( confdist - distslist[i].dist )
      confsqdistsum += square( confdist ) 
   }

   d3.select("#bottomtextbox").text( ( rawstress / confsqdistsum ).toPrecision( 5 ) )
}



// Auxiliary functions

function rmpx( s ) {
  return parseInt( s.replace("px", "") );
}

