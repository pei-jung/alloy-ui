/**
* Provides keyboard accessibility to the Drag and Drop interface.
*
* @module dd
* @submodule dd-keyboard
*/

var DDM = A.DD.DDM,

    KEY_ARROW_LEFT = 37,
    KEY_ARROW_RIGHT = 39,
    KEY_SHIFT = 16,

    Keyboard = function() {
        Keyboard.superclass.constructor.apply(this, arguments);
    };

Keyboard.ATTRS = {
    /**
    * Keys to be used for drag and drop.
    * 
    * `trigger` is the key used to trigger the drag operation.
    * `next` and `prev` are keys used to cycle through the drop targets.
    *
    * @attribute keys
    * @type Object
    */
    keys: {
        value: {
            next: KEY_ARROW_RIGHT,
            prev: KEY_ARROW_LEFT,
            trigger: KEY_SHIFT
        }
    },

    /**
    * The CSS class name used to define which nodes are draggable.
    * @attribute nodes
    * @type A.NodeList
    */
    nodes: {
        value: '.dd-draggable',
        setter: function(val) {
            return this._setNodes(val);
        }
    }
};

A.extend(Keyboard, A.Base, {
    /**
    * Index of current drop target in `_targets`
    * @type Number
    */
    _currentTarget: null,

    /**
    * Index of previous drop target in `_targets`
    * @type Number
    */
    _prevTarget: null,

    /**
    * An array of valid drop targets for the dragging object
    * @type A.NodeList
    */
    _targets: null,

    /**
     * Constructor for `DD.Keyboard`.
     *
     * @method initializer
     */
    initializer: function() {
        this._initDragNodes();
    },

    /**
     * Ends the drag operation.
     *
     * @method _end
     * @protected
     */
    _end: function(event) {
        var instance = this,
            target = event.target;

        target.simulate('mouseup');
        target.once('key', instance._start, 'down:' + instance.get('keys.trigger'), instance);

        if (instance._handle) {
            instance._handle.detach();
        }

        target.focus();
    },

    /**
     * Gets a list of valid drop targets for the drag object.
     *
     * @method _getDropTargets
     * @protected
     * @return {A.NodeList}
     */
    _getDropTargets: function() {
        // activate drop targets so that all drop targets have the yui3-drop-active-valid class
        // calling the method directly here to prevent delay
        DDM._activateTargets();
        
        return A.all('.' + DDM.CSS_PREFIX + '-drop-active-valid');      
    },

    /**
     * Sets the current drop target to the next available target in targets.
     *
     * @method _nextTarget
     * @protected
     */
    _getNextTarget: function() {
        var instance = this,
            currentTarget = instance._currentTarget + 1;

        return currentTarget < instance._targets.size() ? currentTarget : 0;
    },

    /**
     * Sets the current drop target to the previous target in targets.
     *
     * @method _prevTarget
     * @protected
     */
    _getPrevTarget: function() {
        var instance = this,
            currentTarget = instance._currentTarget - 1;

        return currentTarget >= 0 ? currentTarget : instance._targets.size() - 1;
    },

    /**
     * Handles previous drop target. Derives from _handleOut in dd-drop.js
     *
     * @method _handleOut
     * @protected
     */
    _handleOut: function(dropNode) {
        var drop = DDM.getDrop(dropNode);

        if (drop.overTarget) {
            drop.overTarget = false;
            DDM._removeActiveShim(drop);
            dropNode.removeClass(DDM.CSS_PREFIX + '-drop-over');
            DDM.activeDrag.get('node').removeClass(DDM.CSS_PREFIX + '-drag-over');
            drop.fire('drop:exit', { drop: drop, drag: DDM.activeDrag });
            DDM.activeDrag.fire('drag:exit', { drop: drop, drag: DDM.activeDrag });
        }
    },

    /**
     * Handles current drop target. Derives from _handleTargetOver in dd-drop.js
     *
     * @method _handleTargetOver
     * @protected
     */
    _handleTargetOver: function(dropNode) {
        var drop = DDM.getDrop(dropNode);

        dropNode.addClass(DDM.CSS_PREFIX + '-drop-over');
        DDM.activeDrop = drop;

        if (DDM.activeDrag.get('dragging')) {
            drop.overTarget = true;
            drop.fire('drop:enter', { drop: drop, drag: DDM.activeDrag });
            DDM.activeDrag.fire('drag:enter', { drop: drop, drag: DDM.activeDrag });
            DDM.activeDrag.get('node').addClass(DDM.CSS_PREFIX + '-drag-over');

            DDM.activeDrag.fire('drag:over', { drop: drop, drag: DDM.activeDrag });
            drop.fire('drop:over', { drop: drop, drag: DDM.activeDrag });
        }
/*
        if (drop.overTarget) {
            DDM.activeDrag.fire('drag:over', { drop: drop, drag: DDM.activeDrag });
            drop.fire('drop:over', { drop: drop, drag: DDM.activeDrag });
        } else {
            //Prevent an enter before a start..
            if (DDM.activeDrag.get('dragging')) {
                drop.overTarget = true;
                drop.fire('drop:enter', { drop: drop, drag: DDM.activeDrag });
                DDM.activeDrag.fire('drag:enter', { drop: drop, drag: DDM.activeDrag });
                DDM.activeDrag.get('node').addClass(DDM.CSS_PREFIX + '-drag-over');
            }
        }
*/
    },

    /**
     * Initializes draggable nodes.
     *
     * @method _initDragNodes
     * @protected
     */
    _initDragNodes: function() {
        var instance = this,
            dragNodes = instance.get('nodes');

        // add all draggable nodes to the tab order
        dragNodes.set('tabIndex', 0);

        dragNodes.once('key', instance._start, 'down:' + instance.get('keys.trigger'), instance);
        dragNodes.on('key', instance._end, 'up:' + instance.get('keys.trigger'), instance);
    },

    /**
     * Sets the nodes attribute based on its type.
     *
     * @method _setNodes
     * @param v
     * @protected
     * @return {NodeList}
     */
    _setNodes: function(val) {
        if (val instanceof A.NodeList) {
            return val;
        }
        else if (A.Lang.isString(val)) {
            return A.all(val);
        }

        return new A.NodeList([val]);
    },

    /**
     * Sets the current drop target.
     *
     * @method _setTarget
     * @protected
     */
    _setTarget: function(event) {
        var instance = this,
            key = event.charCode;

        instance._prevTarget = instance._currentTarget;

        if (key === 37) {
            instance._currentTarget = instance._getPrevTarget();
        }
        else if (key === 39) {
            instance._currentTarget = instance._getNextTarget();
        }

        var prevDrop = instance._targets.item(instance._prevTarget),
            currentDrop = instance._targets.item(instance._currentTarget);

        instance._handleOut(prevDrop);
        instance._handleTargetOver(currentDrop);
    },

    /**
     * Starts the drag operation.
     *
     * @method _start
     * @protected
     */
    _start: function(event) {
        var instance = this,
            target = event.target;

        target.simulate('mousedown');

        instance._targets = instance._getDropTargets();

        console.log(instance._targets);

        instance._currentTarget = instance._targets.indexOf(target);

        var keySpec = 'down:' + instance.get('keys.next') + ',' + instance.get('keys.prev');

        instance._handle = target.on('key', instance._setTarget, keySpec, instance);
    }
});

// Overrides the _activateShim method in dd-drop.js
A.DD.Drop.prototype._activateShim = function() {
    if (!DDM.activeDrag) {
        return false;
    }
    // Comments out the conditional check here so that the current drag node can be
    // treated as a valid drop target
    /*
    if (this.get('node') === DDM.activeDrag.get('node')) {
        return false;
    }
    */
    if (this.get('lock')) {
        return false;
    }
    var node = this.get('node');

    if (this.inGroup(DDM.activeDrag.get('groups'))) {
        node.removeClass(DDM.CSS_PREFIX + '-drop-active-invalid');
        node.addClass(DDM.CSS_PREFIX + '-drop-active-valid');
        DDM._addValid(this);
        this.overTarget = false;
        if (!this.get('useShim')) {
            this.shim = this.get('node');
        }
        this.sizeShim();
    } else {
        DDM._removeValid(this);
        node.removeClass(DDM.CSS_PREFIX + '-drop-active-valid');
        node.addClass(DDM.CSS_PREFIX + '-drop-active-invalid');
    }
};

A.namespace('DD');
A.DD.Keyboard = Keyboard;