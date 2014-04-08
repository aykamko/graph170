function ActionQueue() {
    this._funcQueue = [];
    this._selfQueue = [];
    this._argQueue = [];
    this._timeout = 500;
    this._running = false;

    this.pushAction = function(func, self, args, startExecution) {
        this._funcQueue.push(func);
        this._selfQueue.push(self);
        this._argQueue.push(args);
        if (!this._running) {
            this.startExecution();
        }
    }

    this.setTimeout = function(timeout) {
        this._timeout = timeout;
    }

    this.funcInterval = null;
    this.startExecution = function() {
        var me = this;
        this._running = true;
        this.funcInterval = setInterval( function() {me._shiftAndCall()}, 
                me._timeout);
    }

    this._shiftAndCall = function() {
        var func = this._funcQueue.shift();
        var self = this._selfQueue.shift();
        var args = this._argQueue.shift();
        if (!func && !self && !args) {
            clearInterval(this.funcInterval);
            this._running = false;
            return;
        }
        func.apply(self, args);
    }
}

var action_queue = new ActionQueue();

/* Test Code
 *
graph.addEdge(0, 2);
action_queue.setTimeout(1000);
action_queue.pushAction(graph.removeEdgeByLabel, graph, [0, 2]);
action_queue.pushAction(graph.removeEdgeByLabel, graph, [1, 2]);
action_queue.pushAction(graph.removeEdgeByLabel, graph, [0, 1]);
action_queue.pushAction(graph.addVertex, graph, null);
action_queue.pushAction(graph.addVertex, graph, null);
action_queue.pushAction(graph.addEdge, graph, [3, 1]);
action_queue.pushAction(graph.addEdge, graph, [4, 2]);
action_queue.startExecution();
*/


