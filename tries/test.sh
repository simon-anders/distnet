#!/bin/bash

R CMD INSTALL ~/work/repos/distnetR
R --interactive --vanilla <<EOT
library( distnetR )
distnet( dist(matrix(rnorm(200),ncol=10)) )
Sys.sleep( 1 )
EOT