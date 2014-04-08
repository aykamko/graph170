var graph;

$(document).ready(function() {

// set up SVG for D3
var colors = d3.scale.category10();

var terminal = $('.CodeMirror')[0];
var terWidth = $(terminal).width();
var windowWidth = $(window).width();
var windowHeight = $(window).height();

var svgWidth = windowWidth - terWidth;

var svg = d3.select('#body-container').append('svg')
            .attr('class', 'graph')
            .attr('width', svgWidth + 'px');

var resizeTimeout;
$(window).resize( function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeD3, 250);
});

var resizeD3 = function() {
    windowWidth = $(window).width();
    windowHeight = $(window).height();
    svgWidth = $(window).width() - terWidth;
    svg.attr('width', svgWidth + 'px');
    force.size([svgWidth + 'px', windowHeight + 'px']).resume();
}

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - links are always source < target; edge directions are set by 'left' and 'right'.

graph = new Graph();
for (var i = 0; i < 3; i++) {
    graph.addVertex(null, false);
}
graph.addEdge(0, 1, false);
graph.addEdge(1, 2, false);

// init D3 force layout
var force = d3.layout.force()
    .nodes(graph.vertexList())
    .links(graph.edgeList())
    .size([svgWidth, windowHeight])
    .linkDistance(200)
    .charge(-800)
    .on('tick', tick)

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0');

// handles to link and node element groups
var path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');

// mouse event vars
var selected_node = null,
    selected_link = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseup_node = null;

function resetMouseVars() {
  mousedown_node = null;
  mouseup_node = null;
  mousedown_link = null;
}

// update force layout (called automatically each iteration)
function tick() {
  // draw directed edges with proper padding from node centers
  path.attr('d', function(link) {
    var deltaX = link.target.x - link.source.x,
        deltaY = link.target.y - link.source.y,
        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY) + 0.00001,
        normX = deltaX / dist,
        normY = deltaY / dist,
        sourcePadding = 30,
        targetPadding = 35,
        sourceX = link.source.x + (sourcePadding * normX),
        sourceY = link.source.y + (sourcePadding * normY),
        targetX = link.target.x - (targetPadding * normX),
        targetY = link.target.y - (targetPadding * normY);
    return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
  });

  circle.attr('transform', function(d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  });
}

// update graph (called when needed)
function restart() {
  // path (link) group
  path = path.data(graph.edgeList());

  // update existing links
  path.classed('selected', function(d) { return d === selected_link; })
    .style('marker-start', function(d) { return ''; })
    .style('marker-end', function(d) { return 'url(#end-arrow)'; });

  // add new links
  path.enter().append('svg:path')
    .attr('class', 'link')
    .classed('selected', function(d) { return d === selected_link; })
    .style('marker-start', function(d) { return ''; })
    .style('marker-end', function(d) { return 'url(#end-arrow)'; })
    .on('mousedown', function(d) {
      if(d3.event.shiftKey) return;

      // select link
      mousedown_link = d;
      if(mousedown_link === selected_link) selected_link = null;
      else selected_link = mousedown_link;
      selected_node = null;
      restart();
    });

  // remove old links
  path.exit().remove();

  // circle (node) group
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(graph.vertexList(), function(d) { return d.label });

  // update existing nodes
  circle.selectAll('circle')
    .style('fill', function(d) { return (d === selected_node) ? 'lightgray' : 'white'; });

  // add new nodes
  var g = circle.enter().append('svg:g');

  g.append('svg:circle')
    .attr('class', 'node')
    .attr('r', 30)
    .style('fill', function(d) { return (d === selected_node) ? 'lightgray' : 'white'; })
    .on('mouseover', function(d) {
      if(!mousedown_node || d === mousedown_node) return;
      // enlarge target node
      d3.select(this).attr('transform', 'scale(1.1)');
    })
    .on('mouseout', function(d) {
      if(!mousedown_node || d === mousedown_node) return;
      // unenlarge target node
      d3.select(this).attr('transform', '');
    })
    .on('mousedown', function(d) {
      if(d3.event.shiftKey) return;

      // select node
      mousedown_node = d;
      if(mousedown_node === selected_node) selected_node = null;
      else selected_node = mousedown_node;
      selected_link = null;

      // reposition drag line
      drag_line
        .style('marker-end', 'url(#end-arrow)')
        .classed('hidden', false)
        .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);

      restart();
    })
    .on('mouseup', function(d) {
      if(!mousedown_node) return;

      // needed by FF
      drag_line
        .classed('hidden', true)
        .style('marker-end', '');

      // check for drag-to-self
      mouseup_node = d;
      if(mouseup_node === mousedown_node) { resetMouseVars(); return; }

      // unenlarge target node
      d3.select(this).attr('transform', '');

      // add link to graph (update if exists)
      // NB: links are strictly source < target; arrows separately specified by booleans
      var source, target, direction;
      source = mousedown_node;
      target = mouseup_node;

      var link = graph.addEdge(source.label, target.label, false);

      // select new link
      selected_link = link;
      selected_node = null;
      restart();
    });
  
  // show node IDs
  g.append('svg:text')
      .attr('x', 0)
      .attr('y', 11)
      .attr('class', 'id')
      .text(function(d) { return d.label; });

  // set stroke for all nodes
  circle.select('circle').style('stroke', 
          function(d) { return (d.stroke != null) ? d.stroke : 'black'; })

  // remove old nodes
  circle.exit().remove();

  // set the graph in motion
  force.start();
}

graph.setRestartFunc(restart);

function mousedown() {
  // prevent I-bar on drag
  //d3.event.preventDefault();
  
  // because :active only works in WebKit?
  svg.classed('active', true);

  if(d3.event.shiftKey || mousedown_node || mousedown_link) return;

  // insert new node at point
  var point = d3.mouse(this),
      node = graph.addVertex(null, false);
  node.x = point[0];
  node.y = point[1];

  restart();
}

function mousemove() {
  if(!mousedown_node) return;

  // update drag line
  drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

  restart();
}

function mouseup() {
  if(mousedown_node) {
    // hide drag line
    drag_line
      .classed('hidden', true)
      .style('marker-end', '');
  }

  // because :active only works in WebKit?
  svg.classed('active', false);

  // clear mouse event vars
  resetMouseVars();
}

function spliceLinksForNode(node) {
  var toSplice = links.filter(function(l) {
    return (l.source === node || l.target === node);
  });
  toSplice.map(function(l) {
    links.splice(links.indexOf(l), 1);
  });
}

// only respond once per keydown
var lastKeyDown = -1;

function keydown() {
/*   d3.event.preventDefault(); */

  if(lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;

  // ctrl
  if(d3.event.shiftKey) {
    circle.call(force.drag);
    svg.classed('ctrl', true);
  }

  if(!selected_node && !selected_link) return;
  switch(d3.event.keyCode) {
    case 8: // backspace
    case 46: // delete
      if (selected_node) {
        graph.removeVertex(selected_node);
      } else if (selected_link) {
        graph.removeEdge(selected_link);
      }

      selected_link = null;
      selected_node = null;
      restart();
      break;
    // case 66: // B
    //   if(selected_link) {
    //     // set link direction to both left and right
    //     selected_link.left = true;
    //     selected_link.right = true;
    //   }
    //   restart();
    //   break;
    // case 76: // L
    //   if(selected_link) {
    //     // set link direction to left only
    //     selected_link.left = true;
    //     selected_link.right = false;
    //   }
    //   restart();
    //   break;
  }
}

function keyup() {
  // ctrl
  if(lastKeyDown = 16) {
    circle
      .on('mousedown.drag', null)
      .on('touchstart.drag', null);
    svg.classed('ctrl', false);
  }

  lastKeyDown = -1;
}

// app starts here
svg.on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup);
d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);
restart();
});
