\name{distnet}
\alias{distnet}

\title{Interactively explore a 2D embedding of a distance matrix}
\description{
Methods such as PCA, MDS, t-SNE or the like are often used to visualize the 
similarity of objects that are described by feature vectors by placing points on
the screen such that the spatial relation between points represents the relatedness
of the objects they represent. However, the unavoidable distortions from reducing
a high-dimensional feature space to 2D can make such depictions highly misleading.
Distnet is a tool to interactively check the appropriateness of such a representation.}
\usage{
distnet(dists, conf = NULL, labels = NULL, colors = NULL)
}
%- maybe also 'usage' for other objects documented here.
\arguments{
  \item{dists}{
  A symmetric square matrix of dissimilarity scores or a \code{dist} object (as, e.g., returned by the \code{dist} function).
  For N objects, this is an N-by-N matrix.
}
  \item{conf}{
  A matrix or data frame with 2 columns and N rows, specifying the configuration, i.e., the 2D coordinates of the points that represent the N objects. 
  If missing, \code{MASS::isoMDS} will be called to get a configuration using Kruskall's non-metric multidimensional scaling.
}
  \item{labels}{
  Optionally, a character vector with N labels can be passed. A point's label will be displayed between chart and color scale when the mouse
  hovers over the point.
}
  \item{colors}{
  Optionally, a character vector with N color specifications. If not specified, all points will be black.
}
}
\details{
The function displays the configuration (i.e., the objects represented as points at their 2D coordinates as given in \code{conf}) in a browser window (or in RStudio's Viewer pane).
A color scale below the chart maps distances in feature space (i.e., according to \code{dists}) to shades of blue of decreasing saturation. The color scale
can be adjusted by dragging the wedges below the bar with the mouse. Lines are drawn between the points to indicate their feature-space distance. Drag the 
wedges and observe how lines appear and vanish, and so get a feel for the true distances between your objects.}
\value{
An invisible \code{htmlwidget} object, representing the chart, is returned.
}
\references{
%% ~put references to the literature/web site here ~
}
\author{
Simon Anders, sanders@fs.tum.de
}
\note{
%%  ~~further notes~~
}

%% ~Make other sections like Warning with \section{Warning }{....} ~

\seealso{
\code{\link{MASS::isoMDS}}, \code{\link{focusedMDS::focusedMDS}}
}
\examples{
m <- matrix(rnorm(200),ncol=10)
m[ 11:20, 1 ] <- m[ 11:20, 1 ] + 4
distnet( dist(m), colors = rep( c( "black", "red" ), each=10 ) )
}
