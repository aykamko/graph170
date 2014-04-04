var setup_code="class Vertex:\n\n    def __init__(self, label):\n        self.label = label\n        self.incoming = {}\n        self.outgoing = {}\n\n    def add_incoming(self, edge):\n        self.incoming[edge.source_label] = edge\n\n    def remove_incoming(self, edge):\n        del self.incoming[edge.source_label]\n\n    def add_outgoing(self, edge):\n        self.outgoing[edge.target_label] = edge\n\n    def remove_outgoing(self, edge):\n        del self.outgoing[edge.source_label]\n\n    def __repr__(self):\n        return 'Vertex[' + self.label + ']'\n\nclass Edge:\n\n    def __init__(self, source, target, weight = 1):\n        self.source = source\n        self.target = target\n        self.source_label = source.label\n        self.target_label = target.label\n        self.label = self.source_label + ',' + self.target_label\n        self.weight = weight\n        source.add_outgoing(self)\n        target.add_incoming(self)\n\n    def other(self, vertex):\n        if vertex == self.source:\n            return self.target\n        elif vertex == self.target:\n            return self.source\n\n    def __repr__(self):\n        return 'Edge[' + self.label + ']'\n\n\nclass Graph:\n    \n    def __init__(self, name='G'):\n        self.name = name\n        self.vertices = {}\n        self.edges = {}\n\n    def V(self):\n        return self.vertices.values()\n\n    def E(self):\n        return self.edges.values()\n\n    def add_vertex(self, label):\n        label = str(label)\n        newVertex = Vertex(label)\n        self._add_vertex_internal(newVertex)\n\n    def _add_vertex_internal(self, vertex):\n        self.vertices[vertex.label] = vertex\n\n    def add_edge(self, sourceLabel, targetLabel):\n        sourceLabel, targetLabel = str(sourceLabel), str(targetLabel)\n        source = self.vertices.get(sourceLabel)\n        target = self.vertices.get(targetLabel)\n        if not source or not target:\n            return\n        newEdge = Edge(source, target)\n        self._add_edge_internal(newEdge)\n\n    def _add_edge_internal(self, edge):\n        self.edges[edge.label] = edge\n\nG = Graph()\nfrom graph import *\n"

var translate_graph = function() {
    var graph_string = "";
    var vertex = graph.vertexList().first;
    while (vertex) {
        graph_string += "G.add_vertex(" + vertex.label + ")\n";
        vertex = vertex.next;
    }
    var edge = graph.edgeList().first;
    while (edge) {
        graph_string += "G.add_edge(" + edge.sourceLabel() + ", " + edge.targetLabel() + ")\n";
        edge = edge.next;
    }
    return graph_string;
}
