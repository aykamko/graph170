/// <reference path="array-extension.ts"/>

class Graph {
  private adjacencyList:Graph.AdjacencyList = new Graph.AdjacencyList();

  public vertex(key:any):Vertex {
    return this.adjacencyList.vertex(key);
  }

  public addVertex(label:any):Vertex {
    return this.adjacencyList.addVertex(label);
  }
  
  public removeVertex(key:any):void {
    this.adjacencyList.removeVertex(key);
  }

  public vertices():Vertex[] {
    return this.adjacencyList.vertices();
  }

  public edge(sourceKey:any, targetKey?:any):Edge {
    return this.adjacencyList.edge(sourceKey, targetKey);
  }

  public addEdge(sourceKey:any, targetKey?:any):Edge {
    return this.adjacencyList.addEdge(sourceKey, targetKey);
  }

  public removeEdge(sourceKey:any, targetKey?:any):boolean {
    return this.adjacencyList.removeEdge(sourceKey, targetKey);
  }

  public edges():Edge[] {
    return this.adjacencyList.edges();
  }
}

module Graph {
  export class AdjacencyList {
    private static maxIds = 150;
    private freeIdList:AdjacencyList.FreeIdList;
    private usedIds:number;

    private vertexMap:{ [label:string]:Vertex };
    private vertexArray:Vertex[];
    private edgeArray:Edge[];

    constructor() {
      this.freeIdList = new AdjacencyList.FreeIdList(AdjacencyList.maxIds);

      this.vertexMap = {};
      this.vertexArray = [];
      this.edgeArray = [];
    }

    public vertex(labelOrVertex:any):Vertex {
      var retVertex:Vertex;
      if (!(labelOrVertex instanceof Object)) { // label
        retVertex = this.vertexMap[labelOrVertex.toString()];
        if (!retVertex) { return; }
      } else if (labelOrVertex instanceof Vertex) { // vertex
        retVertex = this.vertexMap[labelOrVertex.label];
        if (!retVertex) { return; }
      }
      return retVertex;
    }

    public addVertex(label:any):Vertex {
      if (label && this.vertex(label)) { return; }
      if (this.vertexArray.length >= AdjacencyList.maxIds) {
        throw "Error: Exceeded maximum number of vertices: " + AdjacencyList.maxIds;
      }
      var newVertex:Vertex;
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
    }

    public removeVertex(labelOrVertex:any):void {
      var markedVertex:Vertex = this.vertex(labelOrVertex);
      if (!markedVertex) { return; }
      var edges:Edge[] = markedVertex.outgoingEdges().extend(markedVertex.incomingEdges());
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
    }

    public edge(sourceOrEdge:any, target?:any):Edge {
      var self = this;
      var edgeForSourceLabel = function(sourceLabel:string, target:any):Edge {
        if (!target) { return; }
        var source:Vertex = self.vertex(sourceLabel);
        if (!source) { return; }
        var retEdge:Edge = source.outgoingEdge(target);
        if (!retEdge) { return; }
        return retEdge;
      };

      var retEdge:Edge;
      if (!(sourceOrEdge instanceof Object)) { // label -> (label|vertex)
        return edgeForSourceLabel(sourceOrEdge.toString(), target);
      } else if (sourceOrEdge instanceof Vertex) { // vertex -> (label|vertex)
        return edgeForSourceLabel(sourceOrEdge.label, target);
      } else if (sourceOrEdge instanceof Edge) { // edge
        var sourceVertex = this.vertex(sourceOrEdge.source),
            targetVertex = this.vertex(sourceOrEdge.target);
        if (!sourceVertex || !targetVertex) { return; }
        if (sourceVertex.outgoingEdge(targetVertex) && 
            targetVertex.incomingEdge(sourceVertex)) { 
          return sourceOrEdge;
        }
      }
    }

    public addEdge(sourceKey:any, targetKey:any):Edge {
      if (this.edge(sourceKey, targetKey)) { return; } // edge already exists
      var source:Vertex = this.vertex(sourceKey),
          target:Vertex = this.vertex(targetKey);
      if (!source || !target) { return; }
      var newEdge:Edge = new Edge(source, target);
      if (!source.addOutgoingEdge(newEdge) || !target.addIncomingEdge(newEdge)) {
        source.removeOutgoingEdge(newEdge);
        target.removeIncomingEdge(newEdge);
        delete newEdge;
        return;
      }
      this.edgeArray.push(newEdge);
      return newEdge;
    }

    public removeEdge(labelOrEdge:any, targetLabel?:any):boolean {
      var markedEdge:Edge = this.edge(labelOrEdge, targetLabel);
      if (!markedEdge) { return false; }
      var sourceVertex:Vertex = markedEdge.source,
          targetVertex:Vertex = markedEdge.target,
          success:boolean = true;
      success = success && this.edgeArray.remove(markedEdge);
      success = success && sourceVertex.removeOutgoingEdge(markedEdge);
      success = success && targetVertex.removeIncomingEdge(markedEdge);
      success = success && (delete markedEdge);
      return success;
    }

    public vertices():Vertex[] {
      return this.vertexArray.clone();
    }

    public edges():Edge[] {
      return this.edgeArray.clone();
    }
  }

  export module AdjacencyList {
    export class FreeIdList {
      private freeList:number[];
      private firstFreeIndex:number;

      constructor(size:number) {
        this.freeList = new Array(size);
        for (var i = 0; i < size; i++) {
          this.freeList[i] = i + 1;
        }
        this.firstFreeIndex = 0;
      }

      public assignNextFree():number {
        if (this.firstFreeIndex == null) { 
          throw "Error: No more free ids."
        }
        var newFree = this.freeList[this.firstFreeIndex];
        this.freeList[this.firstFreeIndex] = undefined;
        this.findNextFreeIndex();

        return newFree;
      }

      public assignId(id:number):boolean {
        if (!this.freeList[id - 1]) { return false; }
        this.freeList[id - 1] = undefined;
        this.findNextFreeIndex();
      }

      public freeId(id:number):boolean {
        if (!this.freeList[id - 1]) {
          this.freeList[id - 1] = id;
          if (!this.firstFreeIndex || id - 1 < this.firstFreeIndex) {
            this.firstFreeIndex = id - 1;
          }
          return true;
        }
        return false;
      }

      private findNextFreeIndex():void {
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
      }
    }
  }
}

class Vertex {
  public label:string;
  private outgoingMap:{ [successor:string]:Edge };
  private outgoingArray:Edge[];
  private incomingMap:{ [predecessor:string]:Edge };
  private incomingArray:Edge[];

  constructor(label: any) {
    this.label = label.toString();
    this.outgoingMap = {};
    this.outgoingArray = [];
    this.incomingMap = {};
    this.incomingArray = [];
  }

  private addEdge(edge:Edge, 
                  map:{ [neighbor:string]:Edge }, 
                  array:Edge[]
                 ):boolean 
  {
    var existing:Edge = map[edge.target.label];
    if (!existing) {
      map[edge.target.label] = edge;
      array.push(edge);
    }
    return !existing;
  }

  private removeEdge(edge:Edge, 
                     map:{ [neighbor:string]:Edge }, 
                     array:Edge[]
                    ):boolean 
  {
    var success:boolean = true;
    success = success && array.remove(edge);
    success = success && (delete map[edge.target.label]);
    return success;
  }

  private edge(key:any, map:{ [neighbor:string]:Edge }):Edge {
    if (key instanceof Vertex) {
      key = key.label;
    }
    if (key instanceof Object) { return; }
    return map[key];
  }

  public addOutgoingEdge(edge:Edge):boolean {
    return this.addEdge(edge, this.outgoingMap, this.outgoingArray);
  }

  public removeOutgoingEdge(edge:Edge):boolean {
    return this.removeEdge(edge, this.outgoingMap, this.outgoingArray);
  }

  public outgoingEdge(target:any):Edge {
    if (target instanceof Edge) {
      target = target.target.label;
    }
    return this.edge(target, this.outgoingMap);
  }

  public outgoingEdges():Edge[] {
    return this.outgoingArray.clone();
  }

  public addIncomingEdge(edge:Edge):boolean {
    return this.addEdge(edge, this.incomingMap, this.incomingArray);
  }

  public removeIncomingEdge(edge:Edge):boolean {
    return this.removeEdge(edge, this.incomingMap, this.incomingArray);
  }

  public incomingEdge(source:any):Edge {
    if (source instanceof Edge) {
      source = source.source.label;
    }
    return this.edge(source, this.incomingMap);
  }

  public incomingEdges():Edge[] {
    return this.incomingArray.clone();
  }
}

class Edge {
  public target:Vertex;
  public source:Vertex;
  public weight:number;
  public label:string;

  constructor(source:Vertex, target:Vertex, weight?:number) {
    this.source = source;
    this.target = target;
    this.weight = weight || 1;
    this.label = this.source.label + "," + this.target.label;
  }

  public otherVertex(vertex:Vertex):Vertex {
    if (vertex === this.source) {
      return this.target;
    } else if (vertex === this.target) {
      return this.source;
    } else {
      throw "Error: Edge (" + this.label + ") not incident to given vertex";
    }
  }
}
