function LinkedList() {
    LinkedList.prototype.length = 0;
    LinkedList.prototype.first = null;
}

function NodeLL(label) {
    this.label = label.toString();
    this.prev = null;
    this.next = null;

    this.outgoing = {};
    this.outDegree = 0;
    this.incoming = {};
    this.inDegree = 0;

    this.addOutgoingLink = function(link) {
        var success;
        if (!(success = this.outgoing[link.target.label])) {
            this.outgoing[link.target.label] = link;
            this.outDegree += 1;
        }
        return !success;
    }

    this.removeOutgoingLink = function(link) {
        return (delete this.outgoing[link.target.label]);
    }

    this.addIncomingLink = function(link) {
        var success;
        if (!(success = this.incoming[link.source.label])) {
            this.incoming[link.source.label] = link;
            this.inDegree += 1;
        }
        return !success;
    }

    this.removeIncomingLink = function(link) {
        return (delete this.incoming[link.source.label]);
    }

    this.markForRemoval = function(graph) {
        var outgoingKeys = Object.keys(this.outgoing),
            incomingKeys = Object.keys(this.incoming),
            self = this;
        outgoingKeys.forEach( function(key) {
            graph.removeLink(self.outgoing[key]);
        });
        incomingKeys.forEach( function(key) {
            graph.removeLink(self.incoming[key]);
        });
        this.outgoing = null;
        this.incoming = null;
        this.firstLink = null;
        this.lastLink = null;
        this.prev = null;
        this.next = null;
    }
}

function LinkLL(source, target, weight) {
    this.source = source;
    this.target = target;
    this.prev = null;
    this.next = null;
    this.weight = (weight) ? weight : 0;
    
    this.other = function(node) {
        if (node === this.source) {
            return this.target;
        } else if (node === this.target) {
            return this.source;
        } else {
            return null;
        }
    }

    this.markForRemoval = function() {
        this.source = null;
        this.target = null;
        this.prev = null;
        this.next = null;
    }
}

function Graph() {
    this.lastNodeId = -1;
    this.firstNode = null;
    this.lastNode = null;
    this.firstLink = null;
    this.lastLink = null;
    this.nodes = {};
    this.nodeLinkedList = new LinkedList();
    this.linkLinkedList = new LinkedList();
    
    this.addNode = function() {
        var newNode = new NodeLL(++(this.lastNodeId));
        if (this.lastNode) {
            this.lastNode.next = newNode;
        } else {
            this.firstNode = newNode;
        }
        newNode.prev = this.lastNode;
        this.lastNode = newNode;
        this.nodes[this.lastNodeId] = newNode;
        this.nodeLinkedList.length += 1;
        return newNode;
    }

    this.removeNode = function(node) {
        var prevNode = node.prev;
        var nextNode = node.next;
        if (prevNode) {
            prevNode.next = node.next;
        } else {
            this.firstNode = nextNode;
        }
        if (nextNode) {
            nextNode.prev = node.prev;
        } else {
            this.lastNode = prevNode;
        }
        var label = node.label;
        node.markForRemoval(this);
        delete this.nodes[label];
        delete node;
        this.nodeLinkedList.length -= 1;
    }

    this.removeNodeById = function(id) {
        var markedNode = this.nodes[id];
        if (!markedNode) {
            return;
        }
        var prevNode = markedNode.prev;
        var nextNode = markedNode.next;
        if (prevNode) {
            prevNode.next = markedNode.next;
        } else {
            this.firstNode = nextNode;
        }
        if (nextNode) {
            nextNode.prev = markedNode.prev;
        } else {
            this.lastNode = prevNode;
        }
        markedNode.markForRemoval(this);
        delete this.nodes[id];
        delete markedNode;
        this.nodeLinkedList.length -= 1;
    }

    this.addLink = function(sourceId, targetId) {
        var source = this.nodes[sourceId];
        var target = this.nodes[targetId];
        if (!source || !target) {
            return;
        }
        var newLink = new LinkLL(source, target);
        // source.addOutgoingLink(newLink);
        // target.addIncomingLink(newLink);
        if (source.addOutgoingLink(newLink)
                && target.addIncomingLink(newLink)) {

            if (this.lastLink) {
                this.lastLink.next = newLink;
                newLink.prev = this.lastLink;
            } else {
                this.firstLink = newLink;
            }
            this.lastLink = newLink;

            this.linkLinkedList.length += 1;
            return newLink;
        }
    }

    this.removeLink = function(link) {
        link.source.removeOutgoingLink(link);
        link.target.removeIncomingLink(link);
        var prevLink = link.prev,
            nextLink = link.next;
        if (prevLink) {
            prevLink.next = nextLink;
        } else {
            this.firstLink = nextLink;
        }
        if (nextLink) {
            nextLink.prev = prevLink;
        } else {
            this.lastLink = prevLink;
        }
        this.linkLinkedList.length -= 1;
        link.markForRemoval();
        delete link;
    }

    this.nodeLL = function() {
        this.nodeLinkedList.first = this.firstNode;
        return this.nodeLinkedList;
    }

    this.linkLL = function() {
        this.linkLinkedList.first = this.firstLink;
        return this.linkLinkedList;
    }
}
