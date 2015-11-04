interface Array<T> {
  remove: (elem:T) => boolean;
  clone: () => Array<T>;
  extend: (other:Array<T>) => Array<T>;
}
Array.prototype.remove = function(elem:any):boolean {
  var elemIndex:number = this.indexOf(elem);
  if (elemIndex > -1) {
    this.splice(elemIndex, 1);
    return true;
  }
  return false;
}
Array.prototype.clone = function():Array<any> {
  return this.slice(0);
}
Array.prototype.extend = function(other:Array<any>):Array<any> {
  return Array.prototype.push.apply(this, other);
}

