"use strict";

function graph( svgElement, nodePos, edgeList ) {

  return {

    update: function( ) {

      // points
      var sel = svgElement.selectAll("circle")
        .data( nodePos );
      sel.enter().append("circle")
        .attr( "r", 3 );
      sel.exit().remove()
      sel
        .attr( "cx", function(d) { return d.x } )
        .attr( "cy", function(d) { return d.y } )

      // edges
      var sel = svgElement.selectAll("line")
        .data( edgeList );
      sel.enter().append("line")
      sel.exit().remove()
      sel
        .attr( "x1", function(d) { return nodePos[d.p1].x } )
        .attr( "y1", function(d) { return nodePos[d.p1].y } )
        .attr( "x2", function(d) { return nodePos[d.p2].x } )
        .attr( "y2", function(d) { return nodePos[d.p2].y } )
        .call( this.dressEdges )
    },

    dressEdges: function( edgesSelection ) {
      edgesSelection
        .style( "stroke", "black" )
    }

  }
   
}

var g = graph( d3.select("#mySvg"),
   [ { x:20, y:10 },
     { x:45, y:25 },
     { x:30, y:15 },
     { x: 8, y:55 } ],
   [ { p1: 0, p2: 1},
     { p1: 0, p2: 2},
     { p1: 1, p2: 3} ] );

g.update();


