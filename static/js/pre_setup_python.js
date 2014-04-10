var translate_graph = function() {
    var graph_string = "";
    var vertexList = graph.vertexList();
    var i;
    for (i = 0; i < vertexList.length; i++) {
        graph_string += "G.add_vertex(" + vertexList[i].label + ")\n";
    }
    var edgeList = graph.edgeList();
    var curEdge;
    for (i = 0; i < edgeList.length; i++) {
        edge = edgeList[i];
        graph_string += "G.add_edge(" + edge.sourceLabel() + ", " + edge.targetLabel() + ")\n";
    }
    return graph_string;
}
