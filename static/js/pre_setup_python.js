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
