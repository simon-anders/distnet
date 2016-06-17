distnet <- function( dists, conf = NULL, labels = NULL ) {
  
  if( inherits( dists, "dist") ) 
    dists <- as.matrix(dists)

  if( !is.matrix(dists) )
    stop( "'dists' must be a square matrix or a 'dist' object.")
  if( nrow(dists) != ncol(dists) )
    stop( "Distance matrix 'dists' is not square.")

  if( is.null(conf) )
    conf <- MASS::isoMDS( dists )$points

  stopifnot( ncol(conf) == 2 )
  stopifnot( nrow(conf) == nrow(dists) )
  colnames( conf ) <- c( "x", "y" )

  if( is.null(labels) )
    labels <- rownames( dists )
  stopifnot( length(labels) == nrow(dists) )

  htmlwidgets::createWidget( "distnet", 
    list( distmat=dists, pointpos=conf, labels=labels ) )

}



