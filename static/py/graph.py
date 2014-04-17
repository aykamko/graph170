class Vertex:

    def __init__(self, graph, label):
        self.graph = graph
        self.label = label
        self.incoming = {}
        self.outgoing = {}


    def add_incoming(self, edge):
        self.incoming[edge.source_label] = edge

    def get_incoming(self, edge_or_source):
        if edge_or_source.__class__.__name__ != 'Edge':
            return self.incoming.get(str(edge_or_source))
        if self.incoming.get(edge_or_source.source_label):
            return edge_or_source

    def remove_incoming(self, edge):
        edge = self.get_incoming(edge)
        if edge:
            del self.incoming[edge.source_label]

    def incoming_edges(self):
        return self.incoming.values()


    def add_outgoing(self, edge):
        self.outgoing[edge.target_label] = edge

    def get_outgoing(self, edge_or_target):
        if edge_or_target.__class__.__name__ != 'Edge':
            return self.outgoing.get(str(edge_or_target))
        if self.outgoing.get(edge_or_target.target_label):
            return edge_or_target

    def remove_outgoing(self, edge):
        edge = self.get_outgoing(edge)
        if edge:
            del self.outgoing[edge.target_label]

    def outgoing_edges(self):
        return self.outgoing.values()


    def __repr__(self):
        return 'Vertex[' + self.label + ']'

class Edge:

    def __init__(self, graph, source, target, weight = 1):
        self.graph = graph
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


    def get_vertex(self, vertex_or_label):
        if vertex_or_label.__class__.__name__ != 'Vertex':
            return self.vertices.get(str(vertex_or_label))
        if self.vertices.get(vertex_or_label.label):
            return vertex_or_label

    def add_vertex(self, label):
        label = str(label)
        newVertex = Vertex(self, label)
        self.vertices[newVertex.label] = newVertex

    def remove_vertex(self, vertex):
        vertex = self.get_vertex(vertex)
        if not vertex:
            return
        for inc in vertex.incoming_edges():
            self.remove_edge(inc)
        for out in vertex.outgoing_edges():
            self.remove_edge(out)
        del self.vertices[vertex.label]
        del vertex


    def get_edge(self, edge_or_source, target_label):
        if edge_or_source.__class__.__name__ != 'Edge':
            return self.edges.get((str(edge_or_source), str(target_label)))
        if self.edges.get((edge_or_source.source_label, 
                edge_or_source.target_label)):
            return edge_or_source

    def add_edge(self, source_label, target_label, weight = 1):
        source_label, target_label = str(source_label), str(target_label)
        source = self.vertices.get(source_label)
        target = self.vertices.get(target_label)
        if not source or not target:
            return
        newEdge = Edge(self, source, target, weight)
        self.edges[(newEdge.source_label, newEdge.target_label)] = newEdge

    def remove_edge(self, edge, target_label = None):
        edge = self.get_edge(edge, target_label)
        if not edge:
            return
        edge.source.remove_outgoing(edge)
        edge.target.remove_incoming(edge)
        del self.edges[(edge.source_label, edge.target_label)]
        del edge


# constants and imports
inf = float('inf')
G = Graph()
from graph import *
