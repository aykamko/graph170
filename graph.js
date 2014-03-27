function LinkedList() {
    LinkedList.prototype.length = 0;
    LinkedList.prototype.first = null;
}

function NodeLL(label) {
    this.label = label.toString();
    this.firstLink = null;
    this.lastLink = null;
    this.prev = null;
    this.next = null;

    this.__neighbors__ = {};

    this.addLinkToNode = function(node) {
        if (this.__neighbors__[node.label]) {
            return;
        }
        var newLink = new LinkLL(this, node);
        if (this.lastLink) {
            this.lastLink.nextInNode = newLink;
            newLink.prevInNode = this.lastLink;
        } else {
            this.firstLink = newLink;
        }
        this.lastLink = newLink;
        this.__neighbors__[node.label] = newLink;
        return newLink;
    }

    this.removeLinkToNode = function(node) {
        var markedLink = this.__neighbors__[node.label];
        if (!markedLink) {
            return false;
        }
        var prevLink = markedLink.prevInNode;
        var nextLink = markedLink.nextInNode;
        if (prevLink) {
            prevLink.nextInNode = markedLink.nextInNode;
        } else {
            nextLink = this.firstLink;
        }
        if (nextLink) {
            nextLink.prevInNode = markedLink.prevInNode;
        } else {
            prevLink = this.lastLink;
        }
        delete this.__neighbors__[node.label];
        return markedLink;
    }

    this.markForRemoval = function() {
        this.__neighbors__ = null;
        this.firstLink = null;
        this.lastLink = null;
        this.prev = null;
        this.next = null;
    }
}

function LinkLL(source, target) {
    this.source = source;
    this.target = target;
    this.prev = null;
    this.prevInNode = null;
    this.next = null;
    this.nextInNode = null;
    
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
        this.prev = null;
        this.prevInNode = null;
        this.next = null;
        this.nextInNode = null;
        this.source = null;
        this.target = null;
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

    this.removeNode = function(id) {
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
        markedNode.markForRemoval();
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
        newLink = source.addLinkToNode(target);
        if (!newLink) {
            return;
        }

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

    this.removeLink = function(sourceId, targetId) {
        var source = this.nodes[sourceId];
        var target = this.nodes[targetId];
        var markedLink = null;
        if (!source || !target || !(markedLink = source.removeLinkToNode(target))); {
            return;
        }
        var prevLink = markedLink.prev,
            nextLink = markedLink.next;
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
        markedLink.markForRemoval();
        delete markedLink;
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
