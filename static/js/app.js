var graph;
var force;
var forceEnabled;
var toggleForce;

$(document).ready(function() {


// set up SVG for D3
var svg = d3.select('#graph-cell').append('svg')
                .attr('class', 'graph')
                .style('height', windowHeight + 'px')
                .style('width', svgWidth + 'px');

// set up initial graph
graph = new Graph();
for (var i = 0; i < 3; i++) {
    graph.addVertex(null, false);
}
graph.addEdge(0, 1, false);
graph.addEdge(1, 2, false);

// init D3 force layout
force = d3.layout.force()
    .nodes(graph.vertexList())
    .links(graph.edgeList())
    .size([svgWidth, windowHeight])
    .linkDistance(200)
    .charge(-800)
    .on('tick', tick)

// set up resizing behaviour
var terminalWidth = $('.code-cell').width();
var windowHeight, windowWidth, svgWidth;
function resizeD3() {
    windowWidth = $(window).width();
    windowHeight = $(window).height();
    svgWidth = Math.max(0, windowWidth - terminalWidth);
    force.size([svgWidth, windowHeight]).resume();
    svg.style('width', svgWidth + 'px')
        .style('height', windowHeight + 'px');
}

var resizeTimeout;
$(window).resize( function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeD3, 250);
});

// initial resize
resizeD3();

// toggle for force layout
forceEnabled = true;
toggleForce = function() {
    if (forceEnabled) {
        force.stop();
        forceEnabled = false;
        d3.select('.force-toggle').html('Force: OFF');
    } else {
        force.start();
        forceEnabled = true;
        d3.select('.force-toggle').html('Force: ON');
    }
}

d3.select('#graph-cell').append('button')
    .attr('type', 'button')
    .attr('class', 'force-toggle')
    .attr('onclick', 'toggleForce()')
    .html('Force: ON')


// define arrow markers for drag edges
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', 'context-stroke')

// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0');

// handles to link and node element groups
var path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');


// cursor index for edge weight editing
var weight_char_index = null;
function increment_weight_char_index(weightStr) {
    weight_char_index = Math.min(weight_char_index + 1, weightStr.length);
}
function decrement_weight_char_index() {
    weight_char_index = Math.max(0, weight_char_index - 1);
}

// svg:g and cursor for selected weight
var selected_weight_g = null,
    cursor_rect = null;

// mouse event vars
var selected_node = null,
    selected_link = null,
    selected_weight_link = null,
    mousedown_link = null,
    mousedown_node = null,
    mousedown_weight_link = null,
    mouseup_node = null;

function resetMouseVars() {
  mousedown_node = null;
  mouseup_node = null;
  mousedown_link = null;
  mousedown_weight_link = null;
}

function resetUnselectedVars(selected) {
    if (selected == 'node') {
        selected_link = null;
        selected_weight_link = null;
    } if (selected == 'link') {
        selected_node = null;
        selected_weight_link = null;
    } if (selected == 'weight') {
        selected_node = null;
        selected_link = null;
    }
}

// update force layout (called automatically each iteration)
function tick() {

  //update vertices
  circle.attr('transform', function(d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  });

  //update edges
  path.select('path.link').attr('d', function(link) {
    var deltaX = link.target.x - link.source.x,
        deltaY = link.target.y - link.source.y,
        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY) + 0.0000001,
        normX = deltaX / dist,
        normY = deltaY / dist,
        sourcePadding = 30,
        targetPadding = 35,
        sourceX = link.source.x + (sourcePadding * normX),
        sourceY = link.source.y + (sourcePadding * normY),
        targetX = link.target.x - (targetPadding * normX),
        targetY = link.target.y - (targetPadding * normY);
        link.sourceX = sourceX;
        link.sourceY = sourceY;
        link.targetX = targetX;
        link.targetY = targetY;
        link.angle = Math.atan2(targetY - sourceY, targetX - sourceX) * (180 / Math.PI);
        link.d3_path = d3.select(this);
    return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
  })

  //update edge arrows
  path.select('g.translate')
    .attr('transform', function(link) {
       return 'translate(' + link.targetX + ',' + link.targetY + ')';
    });
  path.select('g.rotate')
    .attr('transform', function(link) {
       return 'rotate(' + link.angle + ')';
    });

  //update edge weights
  var weight_g = path.select('g.weight-g')
      .attr('transform', function(link) { 
          var pathNode = link.d3_path.node();
          link.mid = pathNode.getPointAtLength(pathNode.getTotalLength() / 2);
          link.x_perp = 18 * Math.cos((link.angle - 90) * (Math.PI / 180));
          link.y_perp = 18 * Math.sin((link.angle - 90) * (Math.PI / 180));
          link.weight_svg_length =
              d3.select(this).select('text').node().getComputedTextLength();
          return 'translate(' + link.mid['x'] + ',' + link.mid['y'] + ')'; 
      })
  weight_g.select('text')
      .attr('x', function(link) {
          return link.x_perp;
      })
      .attr('y', function(link) {
          return link.y_perp + 8;
      })
  weight_g.select('rect.weight-rect')
      .attr('width', function(link) {
          return link.weight_svg_length + 8;
      })
      .attr('x', function(link) {
          return link.x_perp - ((link.weight_svg_length + 7) / 2);
      })
      .attr('y', function(link) {
          return link.y_perp - 10;
      })

  //update edge weight cursor
  weight_g.select('rect.cursor')
      .attr('x', function(link) {
          var weightStr = link.weight.toString(),
              xAdjust = link.weight_svg_length / (weightStr.length + Number.MIN_VALUE);
          return link.x_perp - (link.weight_svg_length / 2) + (xAdjust * weight_char_index) - 0.5;
      })
      .attr('y', function(link) {
          return link.y_perp - 8;
      })

}

// update graph (called when needed)
function restart() {

  // circle (node) group
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(graph.vertexList(), function(d) { return d.label });

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
      resetUnselectedVars('node');

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
      resetUnselectedVars('link');
      restart();
    });
  
  // show node IDs
  g.append('svg:text')
      .attr('x', 0)
      .attr('y', 11)
      .attr('class', 'id')
      .text(function(d) { return d.label; });

  // remove old nodes
  circle.exit().remove();

  // update existing nodes
  circle.selectAll('circle')
    .style('fill', function(d) { return (d === selected_node) ? 'lightgray' : 'white'; })
    .style('stroke', function(d) { return (d.stroke != null) ? d.stroke : 'black'; });

  // path (link) group
  path = path.data(graph.edgeList(), function(d) { return d.label });

  // add new links
  var g = path.enter().append('svg:g');
  g.append('svg:path')
    .attr('class', 'link')
    .classed('selected', function(d) { return d === selected_link; })
    .on('mousedown', function(d) {
      if(d3.event.shiftKey) return;

      // select link
      mousedown_link = d;
      if(mousedown_link === selected_link) selected_link = null;
      else selected_link = mousedown_link;
      resetUnselectedVars('link');
      restart();
    })

  var weight_g = g.append('svg:g')
      .attr('class', 'weight-g')
  weight_g.append('svg:g').append('svg:rect')
      .attr('class', 'weight-rect')
      .attr('width', 20)
      .attr('height', 20)
      .attr('rx', '10')
      .attr('ry', '10')
      .on('mousedown', function(d) {
          // select node
          mousedown_weight_link = d;
          selected_weight_link = d;
          resetUnselectedVars('weight');
          selected_weight_g = d3.select(this.parentNode);
          weight_char_index = d.weight.toString().length;

          cursor_rect = selected_weight_g.append('svg:rect')
              .attr('class', 'cursor')
              .attr('height', 16.5)
              .attr('width', 1.5)
          cursor_rect.append('svg:set')
              .attr('id', 'show')
              .attr('attributeName', 'visibility')
              .attr('attributeType', 'CSS')
              .attr('to', 'visible')
              .attr('begin', '0s; hide.end')
              .attr('dur', '1s')
              .attr('fill', 'frozen');
          cursor_rect.append('svg:set')
              .attr('id', 'hide')
              .attr('attributeName', 'visibility')
              .attr('attributeType', 'CSS')
              .attr('to', 'hidden')
              .attr('begin', 'show.end')
              .attr('dur', '1s')
              .attr('fill', 'frozen');

          restart();
      }).on('mouseup', function(d) {
          if (!mousedown_weight_link) return;
          mousedown_weight_link = null;
      })
   weight_g.append('svg:text')
      .attr('class', 'weight')
   
  // adding markers to links
  var marker = g.append('svg:g')
        .attr('class', 'translate')
      .append('svg:g').attr('class', 'rotate')
      .append('svg:g').attr('class', 'scale')
        .attr('transform', 'scale(4)')
      .append('svg:g').attr('class', 'translate2')
        .attr('transform', 'translate(-1.8, -1.5)')
  marker.append('svg:clipPath')
    .attr('id', function(d) { return d.label + '-cpl' })
    .append('svg:rect')
      .attr('x', '0')
      .attr('y', '0')
      .attr('width', '3')
      .attr('height', '3')
  marker.append('svg:g').attr('clip-path', function(d) { return "url(#" + d.label + "-cpl)" })
    .append('svg:g').attr('class', 'scale1')
      .attr('transform', 'scale(0.3)')
    .append('svg:g').attr('class', 'marker-fill')
    .append('svg:path')
      .attr('d', 'M 0 0 L 10 5 L 0 10')

  // remove old links
  path.exit().remove();

  // update existing links and markers
  path.select('path.link')
    .classed('selected', function(d) { return d === selected_link; })
    .style('stroke', function(d) { return (d.stroke != null) ? d.stroke : 'black' })
  path.select('g.marker-fill')
    .style('fill', function(d) { return (d.stroke != null) ? d.stroke : 'black' });
  path.select('text.weight')
    .text(function(d) { return d.weight; });

  // set the graph in motion
  tick();
  if (forceEnabled) {
    force.start();
  }
}

graph.setRestartFunc(restart);

function mousedown() {
  // prevent I-bar on drag
  //d3.event.preventDefault();
  
  // because :active only works in WebKit?
  svg.classed('active', true);

  if(d3.event.shiftKey || mousedown_node || mousedown_link || mousedown_weight_link) return;

  //such bad code
  if(selected_weight_link) {
    jQuery.event.trigger({ type : 'keydown', which : 13 }); // simulate press enter
  }

  // insert new node at point
  var point = d3.mouse(this),
      node = graph.addVertex(null, false);
  node.x = point[0];
  node.y = point[1];

  restart();
}

function window_mousedown() {
    if (svg.classed('active')) {
        svg.classed('focused', true);
    } else {
        svg.classed('focused', false);
    }
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

// only respond once per keydown
var lastKeyDown = -1;

function keydown() {

  lastKeyDown = d3.event.keyCode;
  if (lastKeyDown == 8) {
    d3.event.preventDefault();
  }

  // Editing Edge Weights
  if (selected_weight_link) {
      var weightStr = selected_weight_link.weight.toString();
      if ((lastKeyDown > 47 && lastKeyDown < 58)
              || lastKeyDown == 189 || lastKeyDown == 190) {  //number keys, minus dash, and decimal point
          var leftSlice = weightStr.slice(0, weight_char_index),
              rightSlice = weightStr.slice(weight_char_index, weightStr.length),
              lastKeyDown = (lastKeyDown > 188) ? (lastKeyDown - 144) : lastKeyDown,
              newNum = String.fromCharCode(lastKeyDown),
              weightStr = leftSlice + newNum + rightSlice;
          selected_weight_link.weight = weightStr;
          increment_weight_char_index(weightStr);
      } else if (lastKeyDown == 8) {  //backspace
          d3.event.preventDefault();
          var leftSlice = weightStr.slice(0, Math.max(0, weight_char_index - 1)),
              rightSlice = weightStr.slice(weight_char_index, weightStr.length),
              weightStr = leftSlice + rightSlice;
          selected_weight_link.weight = weightStr;
          decrement_weight_char_index(weightStr);
      } else if (lastKeyDown == 37) {  //left arrow
          decrement_weight_char_index(weightStr);
      } else if (lastKeyDown == 39) {  //right arrow
          increment_weight_char_index(weightStr);
      } else if (lastKeyDown == 13) {  //enter
          var newVal = parseFloat(weightStr);
          newVal = (isNaN(newVal)) ? 0 : newVal;
          selected_weight_link.weight = newVal;
          selected_weight_link = null;
          cursor_rect.remove();
      }
      restart();
      return;
  }
 
  // ctrl
  if(d3.event.shiftKey) {
    circle.call(force.drag().on('drag.force', function(node) {
        var x = d3.event.x,
            y = d3.event.y;
        d3.select(this).attr('transform', 'translate(' + x + ',' + y + ')');
        node.px = x;
        node.py = y;
        node.x = x;
        node.y = y;
        if (forceEnabled) {
            force.resume();
        } else {
            tick();
        }
    }));
    svg.classed('ctrl', true);
    return;
  }


  if(!selected_node && !selected_link) return;
  switch(d3.event.keyCode) {
    case 8: // backspace
    case 46: // delete
      d3.event.preventDefault();

      if (!svg.classed('focused')) {
          return;
      }

      if (selected_node) {
        graph.removeVertex(selected_node);
      } else if (selected_link) {
        graph.removeEdge(selected_link);
      }

      selected_link = null;
      selected_node = null;
      restart();
      break;
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
  .on('keyup', keyup)
  .on('mousedown', window_mousedown);
restart();

});
