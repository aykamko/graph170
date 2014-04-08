class Vertex:

    def __init__(self, label):
        self.label = label
        self.incoming = {}
        self.outgoing = {}

    def add_incoming(self, edge):
        self.incoming[edge.source_label] = edge

    def remove_incoming(self, edge):
        del self.incoming[edge.source_label]

    def incoming_edges(self):
        return self.incoming.values()

    def add_outgoing(self, edge):
        self.outgoing[edge.target_label] = edge

    def remove_outgoing(self, edge):
        del self.outgoing[edge.source_label]

    def outgoing_edges(self):
        return self.outgoing.values()

    def __repr__(self):
        return 'Vertex[' + self.label + ']'

class Edge:

    def __init__(self, source, target, weight = 1):
        self.source = source
        self.target = target
        self.source_label = source.label
        self.target_label = target.label
        self.label = self.source_label + ',' + self.target_label
        self.weight = weight
        source.add_outgoing(self)
        target.add_incoming(self)

    def other(self, vertex):
        if vertex == self.source:
            return self.target
        elif vertex == self.target:
            return self.source

    def __repr__(self):
        return 'Edge[' + self.label + ']'

class Graph:
    def __init__(self, name='G'):
        self.name = name
        self.vertices = {}
        self.edges = {}

    def __getattr__(self, attrname):
        attrname = str(attrname)
        if attrname == 'E':
            return self.edges.values()
        elif attrname == 'V':
            return self.vertices.values()
        raise AttributeError('Graph instance has no attribute ' + attrname)

    def vertex(self, label):
        return self.vertices[str(label)]

    def add_vertex(self, label):
        label = str(label)
        newVertex = Vertex(label)
        self._add_vertex_internal(newVertex)

    def _add_vertex_internal(self, vertex):
        self.vertices[vertex.label] = vertex

    def add_edge(self, sourceLabel, targetLabel):
        sourceLabel, targetLabel = str(sourceLabel), str(targetLabel)
        source = self.vertices.get(sourceLabel)
        target = self.vertices.get(targetLabel)
        if not source or not target:
            return
        newEdge = Edge(source, target)
        self._add_edge_internal(newEdge)

    def _add_edge_internal(self, edge):
        self.edges[edge.label] = edge

# constants and imports
inf = float('inf')
G = Graph()
from graph import *
