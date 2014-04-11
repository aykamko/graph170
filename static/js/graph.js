var foo1, foo2, foo3;

function Vertex(label) {
    this.label = label.toString();

    this.outgoing = {};
    this.outDegree = 0;
    this.incoming = {};
    this.inDegree = 0;

    this.addOutgoingEdge = function(edge) {
        var success;
        if (!(success = this.outgoing[edge.target.label])) {
            this.outgoing[edge.target.label] = edge;
            this.outDegree += 1;
        }
        return !success;
    }

    this.removeOutgoingEdge = function(edge) {
        return (delete this.outgoing[edge.target.label]);
    }

    this.getOutgoingEdgeByLabel = function(targetLabel) {
        return this.outgoing[targetLabel];
    }

    this.addIncomingEdge = function(edge) {
        var success;
        if (!(success = this.incoming[edge.source.label])) {
            this.incoming[edge.source.label] = edge;
            this.inDegree += 1;
        }
        return !success;
    }

    this.removeIncomingEdge = function(edge) {
        return (delete this.incoming[edge.source.label]);
    }

    this.markForRemoval = function(graph) {
        var outgoingKeys = Object.keys(this.outgoing),
            incomingKeys = Object.keys(this.incoming),
            me = this;
        outgoingKeys.forEach( function(key) {
            graph.removeEdge(me.outgoing[key], null, false);
        });
        incomingKeys.forEach( function(key) {
            graph.removeEdge(me.incoming[key], null, false);
        });
        this.outgoing = null;
        this.incoming = null;
    }
}

function Edge(source, target, weight) {
    this.source = source;
    this.target = target;
    this.weight = (weight) ? weight : 0;

    this.source_label = this.source.label;
    this.target_label = this.target.label;
    this.label = this.source_label + "," + this.target_label;
    
    this.other = function(vertex) {
        if (vertex === this.source) {
            return this.target;
        } else if (vertex === this.target) {
            return this.source;
        } else {
            return null;
        }
    }

    this.sourceLabel = function() {
        return this.source.label;
    }

    this.targetLabel = function() {
        return this.target.label;
    }

    this.markForRemoval = function() {
        this.source = null;
        this.target = null;
    }
}

function Graph(restartFunc) {
    this._restartFunc = restartFunc;
    this.lastVertexLabel = -1;
    this.vertices = {};
    this.vertexArray = [];
    this.edgeArray = [];
    
    this.addVertex = function(label, restart) {
        var newVertex;
        if (label) {
            newVertex = new Vertex(label);
        } else {
            newVertex = new Vertex((label = ++(this.lastVertexLabel)));
        }
        this.vertexArray.push(newVertex);
        this.vertices[label] = newVertex;
        this.restartD3(restart);
        return newVertex;
    }

    this.getVertex = function(vertex) {
        if (typeof vertex !== "object"
                && !(vertex = this.vertices[vertex.toString()])) {
            return;
        } else if (Object.getPrototypeOf(vertex) !== Vertex.prototype) {
            return;
        }
        return vertex;
    }

    this.removeVertex = function(vertex, restart) {
        if (!(vertex = this.getVertex(vertex))) {
            return;
        }
        var markedIndex;
        if ((markedIndex = this.vertexArray.indexOf(vertex)) > -1) {
            this.vertexArray.splice(markedIndex, 1);
        }
        vertex.markForRemoval(this);
        delete this.vertices[vertex.label];
        delete vertex;
        this.restartD3(restart);
    }

    this.colorVertexStroke = function(vertex, color, restart) {
        if (!(vertex = this.getVertex(vertex))) {
            return;
        }
        vertex.stroke = color;
        this.restartD3(restart);
    }

    this.addEdge = function(sourceLabel, targetLabel, restart) {
        var source = this.vertices[sourceLabel],
            target = this.vertices[targetLabel];
        if (!source || !target) {
            return;
        }
        var newEdge = new Edge(source, target);
        if (!source.addOutgoingEdge(newEdge) 
            || !target.addIncomingEdge(newEdge)) {
            return;
        }
        this.edgeArray.push(newEdge);
        this.restartD3(restart);
        console.log(newEdge.label);
        return newEdge;
    }

    this.getEdge = function(edge, targetLabel) {
        if (typeof edge !== "object") {
            var _source = this.vertices[edge];
            if (!(edge = _source.getOutgoingEdgeByLabel(targetLabel))) {
                return;
            }
        } else if (Object.getPrototypeOf(edge) !== Edge.prototype) {
            return;
        }
        return edge;
    }

    this.removeEdge = function(edge, targetLabel, restart) {
        if (!(edge = this.getEdge(edge, targetLabel))) {
            return;
        }
        edge.source.removeOutgoingEdge(edge);
        edge.target.removeIncomingEdge(edge);
        var markedIndex;
        if ((markedIndex = this.edgeArray.indexOf(edge)) > -1) {
            this.edgeArray.splice(markedIndex, 1);
        }
        edge.markForRemoval();
        delete edge;
        this.restartD3(restart);
    }

    this.colorEdgeStroke = function(edge, targetLabel, color, restart) {
        if (!(edge = this.getEdge(edge, targetLabel))) {
            return;
        }
        edge.stroke = color;
        this.restartD3(restart);
    }

    this.setRestartFunc = function(restartFunc) {
        this._restartFunc = restartFunc;
    }

    this.restartD3 = function(restart) {
        if (restart == null) {
            restart = true;
        }
        if (restart && typeof this._restartFunc === "function") {
            this._restartFunc();
        }
    }

    this.vertexList = function() {
        return this.vertexArray;
    }

    this.edgeList = function() {
        return this.edgeArray;
    }
}
