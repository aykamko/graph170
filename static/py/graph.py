def get_class_or_type(obj):
    if hasattr(obj, '__class__'):
        return obj.__class__
    return type(obj)

class Vertex:

    def __init__(self, graph, label):
        self.graph = graph
        self.label = label
        self.incoming = {}
        self.outgoing = {}


    def add_incoming(self, edge):
        self.incoming[edge.source_label] = edge

    def incoming(self, edge_or_source):
        if get_class_or_type(edge_or_source) != Edge:
            return self.incoming.get(str(edge_or_source))
        if self.incoming.get(edge_or_source.source_label):
            return edge_or_source

    def remove_incoming(self, edge):
        edge = self.incoming(edge)
        if edge:
            del self.incoming[edge.source_label]

    def incoming_edges(self):
        return self.incoming.values()

    def add_outgoing(self, edge):
        self.outgoing[edge.target_label] = edge

    def outgoing(self, edge_or_target):
        if get_class_or_type(edge_or_target) != Edge:
            return self.outgoing.get(str(edge_or_target))
        if self.outgoing.get(edge_or_target.target_label):
            return edge_or_target

    def remove_outgoing(self, edge):
        edge = self.outgoing(edge)
        if edge:
            del self.outgoing[edge.target_label]

    def outgoing_edges(self):
        return self.outgoing.values()


    def __repr__(self):
        return 'Vertex<' + self.label + '>'

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
        return 'Edge<' + self.label + '>'

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

    def vertex(self, vertex_or_label):
        if get_class_or_type(vertex_or_label) != Vertex:
            return self.vertices.get(str(vertex_or_label))
        if self.vertices.get(vertex_or_label.label):
            return vertex_or_label

    def add_vertex(self, label):
        label = str(label)
        newVertex = Vertex(self, label)
        self.vertices[newVertex.label] = newVertex

    def remove_vertex(self, vertex):
        vertex = self.vertex(vertex)
        if not vertex:
            return
        for inc in vertex.incoming_edges():
            self.remove_edge(inc)
        for out in vertex.outgoing_edges():
            self.remove_edge(out)
        del self.vertices[vertex.label]
        del vertex


    def edge(self, edge_or_source, target_label):
        if get_class_or_type(edge_or_source) != Edge:
            return self.edges.get((str(edge_or_source), str(target_label)))
        if self.edges.get((edge_or_source.source_label,
                edge_or_source.target_label)):
            return edge_or_source

    def add_edge(self, source, target, weight = 1):
        if get_class_or_type(source) != Vertex:
            source = self.vertices.get(str(source))
        if get_class_or_type(target) != Vertex:
            target = self.vertices.get(str(target))
        if not source or not target:
            return
        newEdge = Edge(self, source, target, weight)
        self.edges[(newEdge.source_label, newEdge.target_label)] = newEdge

    def remove_edge(self, edge, target_label = None):
        edge = self.edge(edge, target_label)
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
