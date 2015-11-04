Array.prototype.remove = function (elem) {
    var elemIndex = this.indexOf(elem);
    if (elemIndex > -1) {
        this.slice(elemIndex, 1);
        return true;
    }
    return false;
};
Array.prototype.clone = function () {
    return this.slice(0);
};
Array.prototype.extend = function (other) {
    return Array.prototype.push.apply(this, other);
};
