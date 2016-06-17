library( splines )

tg <- seq( 0, 1, length.out=100 )

# control points

a1 <- .05  # minimum distance between "very close" points
a2 <- .35  # threshold to consider points "close"
a3 <- .5   # threshold to consider points "far"
a4 <- .15  # half width of corridor
a5 <- .95# max dist (plotting size)


cpLo <- data.frame( 
   x = c(  0, a2, a2, a2, a3, a5 ),
   y = c(  a1, a1, a1, a2-a4, a3-a4, a3-a4 ) )

cpHi <- data.frame( 
   x = c(  0, a2-a4, a3-a4, a3-a4, a3-a4, a5 ),
   y = c(  a2, a2, a3, a5, a5, a5 ) )

basis <- bs( tg, knots = c( .33, .66 ), intercept=TRUE )
plot( NULL, xlim=c(0,1), ylim=c(0,1), asp=1 ) 
lines( basis %*% cpLo$x, basis %*% cpLo$y ) 
points( cpLo, col="red" )
boundLo <- splinefun( basis %*% cpLo$x, basis %*% cpLo$y )
lines( tg, boundLo(tg) )

abline( 0, 1 )
rect( 0, 0, 1, 1 )


basis <- bs( tg, knots = c( .33, .66 ), intercept=TRUE )
lines( basis %*% cpHi$x, basis %*% cpHi$y, xlim=c(0,1), ylim=c(0,1), asp=1 ) 
points( cpHi, col="red" )
boundHi <- splinefun( basis %*% cpHi$x, basis %*% cpHi$y )
lines( tg, boundHi(tg) )

kappa <- 10

penality <- function( x, y ) {
   lo <- boundLo( x )
   hi <- boundHi( x )
   kappa <- 10 / ( hi - lo )
   1 / ( 1 + exp( kappa * ( y - lo ) ) ) + 
      1 / ( 1 + exp( -kappa * ( y - hi ) ) ) }

image( -t(
   sapply( tg, function(x)
      sapply( tg, function(y)
         penality( x, y ) ) ) ) )
lines( tg, boundLo(tg) )
lines( tg, boundHi(tg) )
