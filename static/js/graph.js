var foo1, foo2, foo3;

function LinkedList() {
    this.length = 0;
    this.first = null;

    LinkedList.prototype.toArray = function() {
        var arr = new Array(this.length),
            lnk = this.first;
        for (var i = 0; i < this.length; i++) {
            arr[i] = lnk;
            lnk = lnk.next;
        }
        return arr;
    }
}

function VertexLink(label) {
    this.label = label.toString();
    this.prev = null;
    this.next = null;

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
        this.firstEdge = null;
        this.lastEdge = null;
        this.prev = null;
        this.next = null;
    }
}

function EdgeLink(source, target, weight) {
    this.source = source;
    this.target = target;
    this.prev = null;
    this.next = null;
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
        this.prev = null;
        this.next = null;
    }
}

function Graph(restartFunc) {
    this._restartFunc = restartFunc;
    this.lastVertexLabel = -1;
    this.firstVertex = null;
    this.lastVertex = null;
    this.firstEdge = null;
    this.lastEdge = null;
    this.vertices = {};
    this.vertexLinkedList = new LinkedList();
    this.edgeLinkedList = new LinkedList();
    
    this.addVertex = function(label, restart) {
        var newVertex;
        if (label) {
            newVertex = new VertexLink(label);
        } else {
            newVertex = new VertexLink(++(this.lastVertexLabel));
        }
        if (this.lastVertex) {
            this.lastVertex.next = newVertex;
        } else {
            this.firstVertex = newVertex;
        }
        newVertex.prev = this.lastVertex;
        this.lastVertex = newVertex;
        this.vertices[this.lastVertexLabel] = newVertex;
        this.vertexLinkedList.length += 1;
        this.restartD3(restart);
        return newVertex;
    }

    this.getVertex = function(vertex) {
        if (typeof vertex !== "object"
                && !(vertex = this.vertices[vertex.toString()])) {
            return;
        } else if (Object.getPrototypeOf(vertex) !== VertexLink.prototype) {
            return;
        }

        return vertex;
    }

    this.removeVertex = function(vertex, restart) {
        if (!(vertex = this.getVertex(vertex))) {
            return;
        }
        var prevVertex = vertex.prev;
        var nextVertex = vertex.next;
        if (prevVertex) {
            prevVertex.next = vertex.next;
        } else {
            this.firstVertex = nextVertex;
        }
        if (nextVertex) {
            nextVertex.prev = vertex.prev;
        } else {
            this.lastVertex = prevVertex;
        }
        var label = vertex.label;
        vertex.markForRemoval(this);
        delete this.vertices[label];
        delete vertex;
        this.vertexLinkedList.length -= 1;
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
        var source = this.vertices[sourceLabel];
        var target = this.vertices[targetLabel];
        if (!source || !target) {
            return;
        }
        var newEdge = new EdgeLink(source, target);
        if (!source.addOutgoingEdge(newEdge) 
            || !target.addIncomingEdge(newEdge)) {
            return;
        }
        if (this.lastEdge) {
            this.lastEdge.next = newEdge;
            newEdge.prev = this.lastEdge;
        } else {
            this.firstEdge = newEdge;
        }
        this.lastEdge = newEdge;

        this.edgeLinkedList.length += 1;
        this.restartD3(restart);
        return newEdge;
    }

    this.getEdge = function(edge, targetLabel) {
        if (typeof edge !== "object") {
            var _source = this.vertices[edge];
            if (!(edge = _source.getOutgoingEdgeByLabel(targetLabel))) {
                return;
            }
        } else if (Object.getPrototypeOf(edge) !== EdgeLink.prototype) {
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
        var prevEdge = edge.prev,
            nextEdge = edge.next;
        if (prevEdge) {
            prevEdge.next = nextEdge;
        } else {
            this.firstEdge = nextEdge;
        }
        if (nextEdge) {
            nextEdge.prev = prevEdge;
        } else {
            this.lastEdge = prevEdge;
        }
        this.edgeLinkedList.length -= 1;
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
        this.vertexLinkedList.first = this.firstVertex;
        return this.vertexLinkedList;
    }

    this.edgeList = function() {
        this.edgeLinkedList.first = this.firstEdge;
        return this.edgeLinkedList;
    }
}
