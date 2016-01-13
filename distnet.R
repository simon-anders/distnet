library( Rook )
library( jsonlite )
library( MASS )

.distnet_webserver <- Rhttpd$new()
.distnet_webserver$start() 

distnet <- function( dists, points2D, tags, info ) {

   distnet.app <- function( env ) {
      
      htmlpage <- readLines( "distnet.html" )
      
      inputLine <- grep( "<!--INPUTDATA-->", htmlpage )[1]
      
      json <- toJSON( list( 
         distmat = as.matrix(dists), 
         points2D = as.matrix(points2D), 
         tags = tags, 
         info = info ) )

      htmlpage[inputLine] <- paste0( "<script>\ninputdata = JSON.parse(\n'", json, "')\n</script>\n")

      list(
         status = 200L,
         headers = list( 'Content-Type' = 'text/html' ),
         body = paste( htmlpage, collapse="\n" ) )
   }

   .distnet_webserver$remove( "distnet" )
   .distnet_webserver$add( app=distnet.app, "distnet" )
   .distnet_webserver$browse( "distnet" )
}


# Usage example follows:

m <- matrix( rnorm( 200 ), 20 )
dists <- dist(m)
points2D <- isoMDS(dists)$points
tags <- paste0( "Point ", 1:20 )
info <- paste0( "Point <b>", 1:20, "</b>")

distnet( dists, points2D, tags, info )

