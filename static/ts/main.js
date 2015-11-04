Array.prototype.remove = function (elem) {
    var elemIndex = this.indexOf(elem);
    if (elemIndex > -1) {
        this.splice(elemIndex, 1);
        return true;
    }
    return false;
};
Array.prototype.clone = function () {
    return this.slice(0);
};
Array.prototype.extend = function (other) {
    return Array.prototype.push.apply(this, other);
};
/// <reference path="array-extension.ts"/>
var Graph = (function () {
    function Graph() {
        this.adjacencyList = new Graph.AdjacencyList();
    }
    Graph.prototype.vertex = function (key) {
        return this.adjacencyList.vertex(key);
    };
    Graph.prototype.addVertex = function (label) {
        return this.adjacencyList.addVertex(label);
    };
    Graph.prototype.removeVertex = function (key) {
        this.adjacencyList.removeVertex(key);
    };
    Graph.prototype.vertices = function () {
        return this.adjacencyList.vertices();
    };
    Graph.prototype.edge = function (sourceKey, targetKey) {
        return this.adjacencyList.edge(sourceKey, targetKey);
    };
    Graph.prototype.addEdge = function (sourceKey, targetKey) {
        return this.adjacencyList.addEdge(sourceKey, targetKey);
    };
    Graph.prototype.removeEdge = function (sourceKey, targetKey) {
        return this.adjacencyList.removeEdge(sourceKey, targetKey);
    };
    Graph.prototype.edges = function () {
        return this.adjacencyList.edges();
    };
    return Graph;
})();
var Graph;
(function (Graph) {
    var AdjacencyList = (function () {
        function AdjacencyList() {
            this.freeIdList = new AdjacencyList.FreeIdList(AdjacencyList.maxIds);
            this.vertexMap = {};
            this.vertexArray = [];
            this.edgeArray = [];
        }
        AdjacencyList.prototype.vertex = function (labelOrVertex) {
            var retVertex;
            if (!(labelOrVertex instanceof Object)) {
                retVertex = this.vertexMap[labelOrVertex.toString()];
                if (!retVertex) {
                    return;
                }
            }
            else if (labelOrVertex instanceof Vertex) {
                retVertex = this.vertexMap[labelOrVertex.label];
                if (!retVertex) {
                    return;
                }
            }
            return retVertex;
        };
        AdjacencyList.prototype.addVertex = function (label) {
            if (label && this.vertex(label)) {
                return;
            }
            if (this.vertexArray.length >= AdjacencyList.maxIds) {
                throw "Error: Exceeded maximum number of vertices: " + AdjacencyList.maxIds;
            }
            var newVertex;
            var vertexId = parseInt(label);
            if (!isNaN(vertexId)) {
                label = vertexId;
            }
            if (typeof label === 'number' && label <= AdjacencyList.maxIds) {
                this.freeIdList.assignId(label);
            }
            label = label || this.freeIdList.assignNextFree();
            newVertex = new Vertex(label);
            this.vertexMap[label] = newVertex;
            this.vertexArray.push(newVertex);
            return newVertex;
        };
        AdjacencyList.prototype.removeVertex = function (labelOrVertex) {
            var markedVertex = this.vertex(labelOrVertex);
            if (!markedVertex) {
                return;
            }
            var edges = markedVertex.outgoingEdges().extend(markedVertex.incomingEdges());
            for (var e in edges) {
                this.removeEdge(e);
            }
            this.vertexArray.remove(markedVertex);
            delete this.vertexMap[markedVertex.label];
            var vertexId = parseInt(markedVertex.label);
            if (!isNaN(vertexId) && vertexId <= AdjacencyList.maxIds) {
                this.freeIdList.freeId(vertexId);
            }
            delete markedVertex;
        };
        AdjacencyList.prototype.edge = function (sourceOrEdge, target) {
            var self = this;
            var edgeForSourceLabel = function (sourceLabel, target) {
                if (!target) {
                    return;
                }
                var source = self.vertex(sourceLabel);
                if (!source) {
                    return;
                }
                var retEdge = source.outgoingEdge(target);
                if (!retEdge) {
                    return;
                }
                return retEdge;
            };
            var retEdge;
            if (!(sourceOrEdge instanceof Object)) {
                return edgeForSourceLabel(sourceOrEdge.toString(), target);
            }
            else if (sourceOrEdge instanceof Vertex) {
                return edgeForSourceLabel(sourceOrEdge.label, target);
            }
            else if (sourceOrEdge instanceof Edge) {
                var sourceVertex = this.vertex(sourceOrEdge.source), targetVertex = this.vertex(sourceOrEdge.target);
                if (!sourceVertex || !targetVertex) {
                    return;
                }
                if (sourceVertex.outgoingEdge(targetVertex) && targetVertex.incomingEdge(sourceVertex)) {
                    return sourceOrEdge;
                }
            }
        };
        AdjacencyList.prototype.addEdge = function (sourceKey, targetKey) {
            if (this.edge(sourceKey, targetKey)) {
                return;
            } // edge already exists
            var source = this.vertex(sourceKey), target = this.vertex(targetKey);
            if (!source || !target) {
                return;
            }
            var newEdge = new Edge(source, target);
            if (!source.addOutgoingEdge(newEdge) || !target.addIncomingEdge(newEdge)) {
                source.removeOutgoingEdge(newEdge);
                target.removeIncomingEdge(newEdge);
                delete newEdge;
                return;
            }
            this.edgeArray.push(newEdge);
            return newEdge;
        };
        AdjacencyList.prototype.removeEdge = function (labelOrEdge, targetLabel) {
            var markedEdge = this.edge(labelOrEdge, targetLabel);
            if (!markedEdge) {
                return false;
            }
            var sourceVertex = markedEdge.source, targetVertex = markedEdge.target, success = true;
            success = success && this.edgeArray.remove(markedEdge);
            success = success && sourceVertex.removeOutgoingEdge(markedEdge);
            success = success && targetVertex.removeIncomingEdge(markedEdge);
            success = success && (delete markedEdge);
            return success;
        };
        AdjacencyList.prototype.vertices = function () {
            return this.vertexArray.clone();
        };
        AdjacencyList.prototype.edges = function () {
            return this.edgeArray.clone();
        };
        AdjacencyList.maxIds = 150;
        return AdjacencyList;
    })();
    Graph.AdjacencyList = AdjacencyList;
    var AdjacencyList;
    (function (AdjacencyList) {
        var FreeIdList = (function () {
            function FreeIdList(size) {
                this.freeList = new Array(size);
                for (var i = 0; i < size; i++) {
                    this.freeList[i] = i + 1;
                }
                this.firstFreeIndex = 0;
            }
            FreeIdList.prototype.assignNextFree = function () {
                if (this.firstFreeIndex == null) {
                    throw "Error: No more free ids.";
                }
                var newFree = this.freeList[this.firstFreeIndex];
                this.freeList[this.firstFreeIndex] = undefined;
                this.findNextFreeIndex();
                return newFree;
            };
            FreeIdList.prototype.assignId = function (id) {
                if (!this.freeList[id - 1]) {
                    return false;
                }
                this.freeList[id - 1] = undefined;
                this.findNextFreeIndex();
            };
            FreeIdList.prototype.freeId = function (id) {
                if (!this.freeList[id - 1]) {
                    this.freeList[id - 1] = id;
                    if (!this.firstFreeIndex || id - 1 < this.firstFreeIndex) {
                        this.firstFreeIndex = id - 1;
                    }
                    return true;
                }
                return false;
            };
            FreeIdList.prototype.findNextFreeIndex = function () {
                if (this.freeList[this.firstFreeIndex]) {
                    return;
                }
                var nextFreeIndex = this.firstFreeIndex + 1;
                this.firstFreeIndex = null;
                for (; nextFreeIndex < this.freeList.length; nextFreeIndex++) {
                    if (this.freeList[nextFreeIndex]) {
                        this.firstFreeIndex = nextFreeIndex;
                        return;
                    }
                }
            };
            return FreeIdList;
        })();
        AdjacencyList.FreeIdList = FreeIdList;
    })(AdjacencyList = Graph.AdjacencyList || (Graph.AdjacencyList = {}));
})(Graph || (Graph = {}));
var Vertex = (function () {
    function Vertex(label) {
        this.label = label.toString();
        this.outgoingMap = {};
        this.outgoingArray = [];
        this.incomingMap = {};
        this.incomingArray = [];
    }
    Vertex.prototype.addEdge = function (edge, map, array) {
        var existing = map[edge.target.label];
        if (!existing) {
            map[edge.target.label] = edge;
            array.push(edge);
        }
        return !existing;
    };
    Vertex.prototype.removeEdge = function (edge, map, array) {
        var success = true;
        success = success && array.remove(edge);
        success = success && (delete map[edge.target.label]);
        return success;
    };
    Vertex.prototype.edge = function (key, map) {
        if (key instanceof Vertex) {
            key = key.label;
        }
        if (key instanceof Object) {
            return;
        }
        return map[key];
    };
    Vertex.prototype.addOutgoingEdge = function (edge) {
        return this.addEdge(edge, this.outgoingMap, this.outgoingArray);
    };
    Vertex.prototype.removeOutgoingEdge = function (edge) {
        return this.removeEdge(edge, this.outgoingMap, this.outgoingArray);
    };
    Vertex.prototype.outgoingEdge = function (target) {
        if (target instanceof Edge) {
            target = target.target.label;
        }
        return this.edge(target, this.outgoingMap);
    };
    Vertex.prototype.outgoingEdges = function () {
        return this.outgoingArray.clone();
    };
    Vertex.prototype.addIncomingEdge = function (edge) {
        return this.addEdge(edge, this.incomingMap, this.incomingArray);
    };
    Vertex.prototype.removeIncomingEdge = function (edge) {
        return this.removeEdge(edge, this.incomingMap, this.incomingArray);
    };
    Vertex.prototype.incomingEdge = function (source) {
        if (source instanceof Edge) {
            source = source.source.label;
        }
        return this.edge(source, this.incomingMap);
    };
    Vertex.prototype.incomingEdges = function () {
        return this.incomingArray.clone();
    };
    return Vertex;
})();
var Edge = (function () {
    function Edge(source, target, weight) {
        this.source = source;
        this.target = target;
        this.weight = weight || 1;
        this.label = this.source.label + "," + this.target.label;
    }
    Edge.prototype.otherVertex = function (vertex) {
        if (vertex === this.source) {
            return this.target;
        }
        else if (vertex === this.target) {
            return this.source;
        }
        else {
            throw "Error: Edge (" + this.label + ") not incident to given vertex";
        }
    };
    return Edge;
})();
