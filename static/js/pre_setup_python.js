var translate_graph = function() {
    var graph_string = "";
    var vertexList = graph.vertexList();
    var i;
    for (i = 0; i < vertexList.length; i++) {
        graph_string += "G.add_vertex(" + vertexList[i].label + ")\n";
    }
    var edgeList = graph.edgeList();
    var edge, edgeStr;
    for (i = 0; i < edgeList.length; i++) {
        edge = edgeList[i];
        edgeStr = "G.add_edge(" + edge.sourceLabel() + ", " + edge.targetLabel();
        if (weightsEnabled) {
            edgeStr += ", " + edge.weight + ")\n";
        } else {
            edgeStr += ")\n";
        }
        graph_string += edgeStr;
    }
    return graph_string;
}
