function LinkedList() {
    LinkedList.prototype.length = 0;
    LinkedList.prototype.first = null;
}

function NodeLL(label) {
    this.label = label.toString();
    this.x = 0;
    this.y = 0;
    this.firstLink = null;
    this.lastLink = null;
    this.prev = null;
    this.next = null;

    this.__neighbors__ = {};
    this.nodeList = null;

    this.addLinkToNode = function(node) {
        if (this.__neighbors__[node]) {
            return;
        }
        var newLink = new LinkLL(this, node);
        if (this.firstLink) {
            newLink.prev = this.firstLink.prev;
            this.firstLink.prev = newLink;
            this.firstLink.prevInNode = newLink;
            newLink.next = this.firstLink;
            newLink.nextInNode = this.firstLink;
        } else {
            if (this.next) {
                newLink.next = this.next.firstLink;
            }
            if (this.prev) {
                newLink.prev = this.prev.lastLink;
            }
            this.lastLink = newLink;
        }
        this.firstLink = newLink;
        this.__neighbors__[node] = newLink;
        return newLink;
    }

    this.removeLinkToNode = function(node) {
        var markedLink = this.__neighbors__[node];
        if (!markedLink) {
            return;
        }
        var prevLink = markedLink.prev;
        var first = (markedLink === this.firstLink),
            last = (markedLink === this.lastLink);
        if (prevLink) {
            prevLink.next = markedLink.next;
            if (!first) {
                prevLink.nextInNode = markedLink.nextInNode;
            }
            if (last) {
                this.lastLink = prevLink;
            }
        }
        var nextLink = markedLink.next;
        if (nextLink) {
            nextLink.prev = markedLink.prev;
            if (!last) {
                nextLink.prevInNode = markedLink.prevInNode;
            }
            if (first) {
                this.firstLink = nextLink;
            }
        }

        markedLink.markForRemoval();
        // TODO: check for errors in deleting
        delete this.__neighbors__[node];
        delete markedLink;
    }

    this.markForRemoval = function() {
        this.__neighbors__ = null;
        var curLink = this.firstLink;
        this.firstLink = null;
        this.lastLink = null;
        var nextLink = null;
        while (curLink) {
            nextLink = curLink.nextInNode;
            curLink.markForRemoval();
            delete curLink;
            curLink = nextLink;
        }
        this.prev.lastLink.next = this.next.firstLink;
        this.next.firstLink.prev = this.prev.lastLink;
        this.prev = null;
        this.next = null;
    }

    this.links = function() {
        return this.firstLink;
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
    this.nodes = {};
    this.nodeLinkedList = new LinkedList();
    this.linkLinkedList = new LinkedList();
    
    this.addNode = function() {
        var newNode = new NodeLL(++(this.lastNodeId));
        if (this.firstNode) {
            this.firstNode.prev = newNode;
        }
        newNode.next = this.firstNode;
        this.firstNode = newNode;
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
        if (prevNode) {
            prevNode.next = markedNode.next;
        }
        var nextNode = markedNode.next;
        if (nextNode) {
            nextNode.prev = markedNode.prev;
            if (markedNode === this.firstNode) {
                this.firstNode = nextNode;
            }
        }
        markedNode.markForRemoval();
        delete this.nodes[id];
        delete markedNode;
        this.nodeLinkedList.length -= 1;
    }

    this.addLink = function(sourceId, targetId) {
        var source = this.nodes[sourceId];
        var target = this.nodes[targetId];
        var newLink = null;
        if (source && target) {
            newLink = source.addLinkToNode(target);
        }
        this.linkLinkedList.length += 1;
        return newLink;
    }

    this.removeLink = function(sourceId, targetId) {
        var source = this.nodes[sourceId];
        var target = this.nodes[targetId];
        if (source && target) {
            source.removeLinkToNode(target);
        }
        this.linkLinkedList.length -= 1;
    }

    this.nodeLL = function() {
        this.nodeLinkedList.first = this.firstNode;
        return this.nodeLinkedList;
    }

    this.linkLL = function() {
        var fnode = this.firstNode;
        this.linkLinkedList.first = null;
        while (fnode && !this.linkLinkedList.first) {
            this.linkLinkedList.first = fnode.firstLink;
            fnode = fnode.next;
        }
        return this.linkLinkedList;
    }
}
