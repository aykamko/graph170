// CursorMorph /////////////////////////////////////////////////////////

// I am a String/Text editing widget

// CursorMorph: referenced constructors

var CursorMorph;

// CursorMorph inherits from BlinkerMorph:

CursorMorph.prototype = new BlinkerMorph();
CursorMorph.prototype.constructor = CursorMorph;
CursorMorph.uber = BlinkerMorph.prototype;

// CursorMorph preferences settings:

CursorMorph.prototype.viewPadding = 1;

// CursorMorph instance creation:

function CursorMorph(aStringOrTextMorph) {
    this.init(aStringOrTextMorph);
}

CursorMorph.prototype.init = function (aStringOrTextMorph) {
    var ls;

    // additional properties:
    this.keyDownEventUsed = false;
    this.target = aStringOrTextMorph;
    this.originalContents = this.target.text;
    this.originalAlignment = this.target.alignment;
    this.slot = this.target.text.length;
    CursorMorph.uber.init.call(this);
    ls = fontHeight(this.target.fontSize);
    this.setExtent(new Point(Math.max(Math.floor(ls / 20), 1), ls));
    this.drawNew();
    this.image.getContext('2d').font = this.target.font();
    if (this.target instanceof TextMorph &&
            (this.target.alignment !== 'left')) {
        this.target.setAlignmentToLeft();
    }
    this.gotoSlot(this.slot);
};

// CursorMorph event processing:

CursorMorph.prototype.processKeyPress = function (event) {
    // this.inspectKeyEvent(event);
    if (this.keyDownEventUsed) {
        this.keyDownEventUsed = false;
        return null;
    }
    if ((event.keyCode === 40) || event.charCode === 40) {
        this.insert('(');
        return null;
    }
    if ((event.keyCode === 37) || event.charCode === 37) {
        this.insert('%');
        return null;
    }
    if (event.keyCode) { // Opera doesn't support charCode
        if (event.ctrlKey) {
            this.ctrl(event.keyCode);
        } else if (event.metaKey) {
            this.cmd(event.keyCode);
        } else {
            this.insert(
                String.fromCharCode(event.keyCode),
                event.shiftKey
            );
        }
    } else if (event.charCode) { // all other browsers
        if (event.ctrlKey) {
            this.ctrl(event.charCode);
        } else if (event.metaKey) {
            this.cmd(event.keyCode);
        } else {
            this.insert(
                String.fromCharCode(event.charCode),
                event.shiftKey
            );
        }
    }
    // notify target's parent of key event
    this.target.escalateEvent('reactToKeystroke', event);
};

CursorMorph.prototype.processKeyDown = function (event) {
    // this.inspectKeyEvent(event);
    var shift = event.shiftKey;
    this.keyDownEventUsed = false;
    if (event.ctrlKey) {
        this.ctrl(event.keyCode);
        // notify target's parent of key event
        this.target.escalateEvent('reactToKeystroke', event);
        return;
    }
    if (event.metaKey) {
        this.cmd(event.keyCode);
        // notify target's parent of key event
        this.target.escalateEvent('reactToKeystroke', event);
        return;
    }

    switch (event.keyCode) {
    case 37:
        this.goLeft(shift);
        this.keyDownEventUsed = true;
        break;
    case 39:
        this.goRight(shift);
        this.keyDownEventUsed = true;
        break;
    case 38:
        this.goUp(shift);
        this.keyDownEventUsed = true;
        break;
    case 40:
        this.goDown(shift);
        this.keyDownEventUsed = true;
        break;
    case 36:
        this.goHome(shift);
        this.keyDownEventUsed = true;
        break;
    case 35:
        this.goEnd(shift);
        this.keyDownEventUsed = true;
        break;
    case 46:
        this.deleteRight();
        this.keyDownEventUsed = true;
        break;
    case 8:
        this.deleteLeft();
        this.keyDownEventUsed = true;
        break;
    case 13:
        if (this.target instanceof StringMorph) {
            this.accept();
        } else {
            this.insert('\n');
        }
        this.keyDownEventUsed = true;
        break;
    case 27:
        this.cancel();
        this.keyDownEventUsed = true;
        break;
    default:
        nop();
        // this.inspectKeyEvent(event);
    }
    // notify target's parent of key event
    this.target.escalateEvent('reactToKeystroke', event);
};

// CursorMorph navigation:

/*
// original non-scrolling code, commented out in case we need to fall back:

CursorMorph.prototype.gotoSlot = function (newSlot) {
    this.setPosition(this.target.slotPosition(newSlot));
    this.slot = Math.max(newSlot, 0);
};
*/

CursorMorph.prototype.gotoSlot = function (slot) {
    var length = this.target.text.length,
        pos = this.target.slotPosition(slot),
        right,
        left;
    this.slot = slot < 0 ? 0 : slot > length ? length : slot;
    if (this.parent && this.target.isScrollable) {
        right = this.parent.right() - this.viewPadding;
        left = this.parent.left() + this.viewPadding;
        if (pos.x > right) {
            this.target.setLeft(this.target.left() + right - pos.x);
            pos.x = right;
        }
        if (pos.x < left) {
            left = Math.min(this.parent.left(), left);
            this.target.setLeft(this.target.left() + left - pos.x);
            pos.x = left;
        }
        if (this.target.right() < right &&
                right - this.target.width() < left) {
            pos.x += right - this.target.right();
            this.target.setRight(right);
        }
    }
    this.show();
    this.setPosition(pos);
    if (this.parent
            && this.parent.parent instanceof ScrollFrameMorph
            && this.target.isScrollable) {
        this.parent.parent.scrollCursorIntoView(this);
    }
};

CursorMorph.prototype.goLeft = function (shift) {
    this.updateSelection(shift);
    this.gotoSlot(this.slot - 1);
    this.updateSelection(shift);
};

CursorMorph.prototype.goRight = function (shift, howMany) {
    this.updateSelection(shift);
    this.gotoSlot(this.slot + (howMany || 1));
    this.updateSelection(shift);
};

CursorMorph.prototype.goUp = function (shift) {
    this.updateSelection(shift);
    this.gotoSlot(this.target.upFrom(this.slot));
    this.updateSelection(shift);
};

CursorMorph.prototype.goDown = function (shift) {
    this.updateSelection(shift);
    this.gotoSlot(this.target.downFrom(this.slot));
    this.updateSelection(shift);
};

CursorMorph.prototype.goHome = function (shift) {
    this.updateSelection(shift);
    this.gotoSlot(this.target.startOfLine(this.slot));
    this.updateSelection(shift);
};

CursorMorph.prototype.goEnd = function (shift) {
    this.updateSelection(shift);
    this.gotoSlot(this.target.endOfLine(this.slot));
    this.updateSelection(shift);
};

CursorMorph.prototype.gotoPos = function (aPoint) {
    this.gotoSlot(this.target.slotAt(aPoint));
    this.show();
};

// CursorMorph selecting:

CursorMorph.prototype.updateSelection = function (shift) {
    if (shift) {
        if (!this.target.endMark && !this.target.startMark) {
            this.target.startMark = this.slot;
            this.target.endMark = this.slot;
        } else if (this.target.endMark !== this.slot) {
            this.target.endMark = this.slot;
            this.target.drawNew();
            this.target.changed();
        }
    } else {
        this.target.clearSelection();
    }
};

// CursorMorph editing:

CursorMorph.prototype.accept = function () {
    var world = this.root();
    if (world) {
        world.stopEditing();
    }
    this.escalateEvent('accept', null);
};

CursorMorph.prototype.cancel = function () {
    var world = this.root();
    this.undo();
    if (world) {
        world.stopEditing();
    }
    this.escalateEvent('cancel', null);
};

CursorMorph.prototype.undo = function () {
    this.target.text = this.originalContents;
    this.target.changed();
    this.target.drawNew();
    this.target.changed();
    this.gotoSlot(0);
};

CursorMorph.prototype.insert = function (aChar, shiftKey) {
    var text;
    if (aChar === '\u0009') {
        this.target.escalateEvent('reactToEdit', this.target);
        if (shiftKey) {
            return this.target.backTab(this.target);
        }
        return this.target.tab(this.target);
    }
    if (!this.target.isNumeric ||
            !isNaN(parseFloat(aChar)) ||
            contains(['-', '.'], aChar)) {
        if (this.target.selection() !== '') {
            this.gotoSlot(this.target.selectionStartSlot());
            this.target.deleteSelection();
        }
        text = this.target.text;
        text = text.slice(0, this.slot) +
            aChar +
            text.slice(this.slot);
        this.target.text = text;
        this.target.drawNew();
        this.target.changed();
        this.goRight(false, aChar.length);
    }
};

CursorMorph.prototype.ctrl = function (aChar) {
    if ((aChar === 97) || (aChar === 65)) {
        this.target.selectAll();
    } else if (aChar === 90) {
        this.undo();
    } else if (aChar === 123) {
        this.insert('{');
    } else if (aChar === 125) {
        this.insert('}');
    } else if (aChar === 91) {
        this.insert('[');
    } else if (aChar === 93) {
        this.insert(']');
    } else if (aChar === 64) {
        this.insert('@');
    }

};

CursorMorph.prototype.cmd = function (aChar) {
    if (aChar === 65) {
        this.target.selectAll();
    } else if (aChar === 90) {
        this.undo();
    }
};

CursorMorph.prototype.deleteRight = function () {
    var text;
    if (this.target.selection() !== '') {
        this.gotoSlot(this.target.selectionStartSlot());
        this.target.deleteSelection();
    } else {
        text = this.target.text;
        this.target.changed();
        text = text.slice(0, this.slot) + text.slice(this.slot + 1);
        this.target.text = text;
        this.target.drawNew();
    }
};

CursorMorph.prototype.deleteLeft = function () {
    var text;
    if (this.target.selection()) {
        this.gotoSlot(this.target.selectionStartSlot());
        return this.target.deleteSelection();
    }
    text = this.target.text;
    this.target.changed();
    this.target.text = text.substring(0, this.slot - 1) +
        text.substr(this.slot);
    this.target.drawNew();
    this.goLeft();
};

// CursorMorph destroying:

CursorMorph.prototype.destroy = function () {
    if (this.target.alignment !== this.originalAlignment) {
        this.target.alignment = this.originalAlignment;
        this.target.drawNew();
        this.target.changed();
    }
    CursorMorph.uber.destroy.call(this);
};

// CursorMorph utilities:

CursorMorph.prototype.inspectKeyEvent = function (event) {
    // private
    this.inform(
        'Key pressed: ' +
            String.fromCharCode(event.charCode) +
            '\n------------------------' +
            '\ncharCode: ' +
            event.charCode.toString() +
            '\nkeyCode: ' +
            event.keyCode.toString() +
            '\nshiftKey: ' +
            event.shiftKey.toString() +
            '\naltKey: ' +
            event.altKey.toString() +
            '\nctrlKey: ' +
            event.ctrlKey.toString() +
            '\ncmdKey: ' +
            event.metaKey.toString()
    );
};