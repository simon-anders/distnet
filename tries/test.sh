#!/bin/bash

R CMD INSTALL ~/work/repos/distnetR
R --interactive --vanilla <<EOT
library( distnet )
m <- matrix(rnorm(200),ncol=10)
m[ 11:20, 1 ] <- m[ 11:20, 1 ] + 4
distnet( dist(m), colors = rep( c( "black", "red" ), each=10 ) )
Sys.sleep( 1 )
EOT
