/**
 * The Modal Component
 *
 * @module aui-modal
 */

var Lang = A.Lang,
    UA = A.UA,

    StdMod = A.WidgetStdMod,

    getClassName = A.getClassName,

    CSS_MODAL_BD = getClassName('modal-body'),
    CSS_MODAL_FT = getClassName('modal-footer'),
    CSS_MODAL_HD = getClassName('modal-header');

/**
 * A base class for Modal.
 *
 * Check the [live demo](http://alloyui.com/examples/modal/).
 *
 * @class A.Modal
 * @extends Widget
 * @uses A.WidgetPosition, A.WidgetStdMod, A.WidgetAutohide, A.WidgetToolbars,
 *     A.WidgetModality, A.WidgetPositionAlign, A.WidgetPositionConstrain,
 *     A.WidgetStack
 * @param {Object} config Object literal specifying widget configuration
 *     properties.
 * @constructor
 * @include http://alloyui.com/examples/modal/basic-markup.html
 * @include http://alloyui.com/examples/modal/basic.js
 */
A.Modal = A.Base.create('modal', A.Widget, [
    A.WidgetCssClass,
    A.WidgetPosition,
    A.WidgetStdMod,
    A.WidgetToggle,
    A.WidgetAutohide,
    A.WidgetToolbars,
    A.WidgetModality,
    A.WidgetPositionAlign,
    A.WidgetPositionConstrain,
    A.WidgetStack
], {
    CONTENT_TEMPLATE: '<div class="modal-content"></div>',

    /**
     * Construction logic executed during Modal instantiation. Lifecycle.
     *
     * @method initializer
     * @protected
     */
    initializer: function() {
        var instance = this,
            eventHandles;

        eventHandles = [
            A.after(instance._afterFillHeight, instance, 'fillHeight'),
            instance.after('resize:end', A.bind(instance._syncResizeDimensions, instance)),
            instance.after('draggableChange', instance._afterDraggableChange),
            instance.after('resizableChange', instance._afterResizableChange),
            instance.after('visibleChange', instance._afterVisibleChange)
        ];

        instance._applyPlugin(instance._onUserInitInteraction);

        instance._eventHandles = eventHandles;

        instance._toggleParentScrollClass(instance.get('visible'));
    },

    /**
     * Destructor lifecycle implementation for the `Modal` class.
     *
     * @method destructor
     * @protected
     */
    destructor: function() {
        var instance = this;

        (new A.EventHandle(instance._eventHandles)).detach();

        if (instance._userInteractionHandle) {
            instance._userInteractionHandle.detach();
        }
    },

    /**
     * Add `bubbleTargets` to config object.
     *
     * @method _addBubbleTargets
     * @param config
     * @protected
     */
    _addBubbleTargets: function(config) {
        var instance = this;

        if (!Lang.isObject(config)) {
            config = {};
        }
        return A.mix(config, {
            bubbleTargets: instance
        });
    },

    /**
     * Fire after `maxHeight` CSS property changes.
     *
     * @method _afterFillHeight
     * @param event
     * @protected
     */
    _afterFillHeight: function() {
        var instance = this;

        instance._fillMaxHeight(instance.get('height'));
    },

    /**
     * Fire after drag changes.
     *
     * @method _afterDraggableChange
     * @param event
     * @protected
     */
    _afterDraggableChange: function(event) {
        var instance = this;

        if (event.newVal) {
            instance._applyPlugin(instance._plugDrag);
        }
        else {
            instance.unplug(A.Plugin.Drag);
        }
    },

    /**
     * Fire after resize changes.
     *
     * @method _afterResizableChange
     * @param event
     * @protected
     */
    _afterResizableChange: function(event) {
        var instance = this;

        if (event.newVal) {
            instance._applyPlugin(instance._plugResize);
        }
        else {
            instance.unplug(A.Plugin.Resize);
        }
    },

    /**
     * Fire after visibility changes.
     *
     * @method _afterVisibleChange
     * @param event
     * @protected
     */
    _afterVisibleChange: function(event) {
        var instance = this,
            newVal = event.newVal;

        instance._toggleParentScrollClass(newVal);

        if (!newVal && instance.get('destroyOnHide')) {
            A.soon(A.bind('destroy', instance));
        }
    },

    /**
     * Applies a plugin to the modal instance.
     *
     * @method _applyPlugin
     * @param pluginFn
     * @protected
     */
    _applyPlugin: function(pluginFn) {
        var instance = this;

        if (UA.touchEnabled) {
            pluginFn.call(instance);
        }
        else if (!instance._userInteractionHandle) {
            instance._userInteractionHandle = instance.once(
                ['click', 'mousemove'], instance._onUserInitInteraction, instance);
        }
    },

    /**
     * Set `maxHeight` CSS property.
     *
     * @method _fillMaxHeight
     * @param height
     * @protected
     */
    _fillMaxHeight: function(height) {
        var instance = this,
            fillHeight = instance.get('fillHeight'),
            node = instance.getStdModNode(fillHeight, true);

        if (node) {
            node.setStyle('maxHeight', height);
        }
    },

    /**
     * Create node using predefined templates.
     *
     * @method _getStdModTemplate
     * @param section
     * @protected
     */
    _getStdModTemplate: function(section) {
        return A.Node.create(A.Modal.TEMPLATES[section], this._stdModNode.get('ownerDocument'));
    },

    /**
     * Fire before resizing to the correct dimensions.
     *
     * @method _beforeResizeCorrectDimensions
     * @param event
     * @protected
     */
    _beforeResizeCorrectDimensions: function() {
        var instance = this;

        if (instance.resize.proxy) {
            return new A.Do.Prevent();
        }
    },

    /**
     * Plug draggable/resizable if enable.
     *
     * @method _onUserInitInteraction
     * @protected
     */
    _onUserInitInteraction: function() {
        var instance = this,
            draggable = instance.get('draggable'),
            resizable = instance.get('resizable');

        instance._userInteractionHandle = null;

        if (draggable) {
            instance._plugDrag();
        }

        if (resizable) {
            instance._plugResize();
        }
    },

    /**
     * Plug the drag Plugin
     *
     * @method _plugDrag
     * @protected
     */
    _plugDrag: function() {
        var instance = this,
            draggable = instance.get('draggable');

        instance.plug(A.Plugin.Drag, instance._addBubbleTargets(draggable));
    },

    /**
     * Plug the resize Plugin
     *
     * @method _plugResize
     * @protected
     */
    _plugResize: function() {
        var instance = this,
            resizable = instance.get('resizable');

        instance.plug(A.Plugin.Resize, instance._addBubbleTargets(resizable));

        A.before(instance._beforeResizeCorrectDimensions, instance.resize, '_correctDimensions', instance);
    },

    /**
     * Sets a CSS class to the html and body element to disable scrolling in parent window.
     *
     * @method _setParentScrollClass
     * @param set
     * @protected
     */
    _toggleParentScrollClass: function(force) {
        var instance = this;

        if (!instance.get('parentScrollable')) {
            var body = instance._bodyEl,
                documentEl = instance._documentEl;

            if (!body) {
                body = A.getBody();

                instance._bodyEl = body;
            }

            if (!documentEl) {
                documentEl = A.getDoc().get('documentElement');

                instance._documentEl = documentEl;
            }

            body.toggleClass('scroll-disabled', force);
            documentEl.toggleClass('scroll-disabled', force);
        }
    },

    /**
     * Sync width/height dimensions on resize.
     *
     * @method _syncResizeDimensions
     * @param event
     * @protected
     */
    _syncResizeDimensions: function(event) {
        var instance = this,
            resize = event.info;

        instance.set('width', resize.offsetWidth);
        instance.set('height', resize.offsetHeight);
    }
}, {

    /**
     * Static property provides a string to identify the CSS prefix.
     *
     * @property CSS_PREFIX
     * @type String
     * @static
     */
    CSS_PREFIX: getClassName('modal-dialog'),

    /**
     * Static property used to define the default attribute
     * configuration for the Modal.
     *
     * @property ATTRS
     * @type Object
     * @static
     */
    ATTRS: {

        /**
         * Determine the content of Modal's body section.
         *
         * Temporary fix for widget-stdmod bug when bodyContent initializes
         * empty. this._currFillNode is never updated if _uiSetFillHeight is not
         * called.
         *
         * @attribute bodyContent
         * @default ''
         * @type String
         */
        bodyContent: {
            value: ''
        },

        /**
         * Determine if Modal should be destroyed when hidden.
         *
         * @attribute destroyOnHide
         * @default false
         * @type Boolean
         */
        destroyOnHide: {
            validator: Lang.isBoolean,
            value: false
        },

        /**
         * Determine if Modal should be draggable or not.
         *
         * @attribute draggable
         * @type Object
         * @writeOnce
         */
        draggable: {
            value: {
                handles: ['.' + CSS_MODAL_HD],
                plugins: [
                    {
                        fn: A.Plugin.DDConstrained
                    }
                ]
            }
        },

        /**
         * Determine if parent window should be scrollable or not.
         *
         * @attribute parentScrollable
         * @default true
         * @type Boolean
         */
        parentScrollable: {
            validator: Lang.isBoolean,
            value: true
        },

        /**
         * Determine if Modal should be resizable or not.
         *
         * @attribute resizable
         * @type Object
         * @writeOnce
         */
        resizable: {
            value: {
                handles: 'br'
            }
        },

        /**
         * Determine the content of Modal's header section.
         *
         * @attribute toolbars
         * @type Function
         */
        toolbars: {
            valueFn: function() {
                var instance = this;

                return {
                    header: [
                        {
                            cssClass: 'close',
                            label: '\u00D7',
                            on: {
                                click: function(event) {
                                    instance.hide();

                                    event.domEvent.stopPropagation();
                                }
                            },
                            render: true
                        }
                    ]
                };
            }
        },

        /**
         * Determine the css classes of Modal's sections.
         *
         * @attribute toolbarCssClass
         * @type Object
         */
        toolbarCssClass: {
            value: {
                header: 'pull-right'
            }
        }
    },

    /**
     * Static property provides a set of reusable templates.
     *
     * @property TEMPLATES
     * @type Object
     * @static
     */
    TEMPLATES: {
        header: '<div class="' + StdMod.SECTION_CLASS_NAMES[StdMod.HEADER] + ' ' + CSS_MODAL_HD + '"></div>',
        body: '<div class="' + StdMod.SECTION_CLASS_NAMES[StdMod.BODY] + ' ' + CSS_MODAL_BD + '"></div>',
        footer: '<div class="' + StdMod.SECTION_CLASS_NAMES[StdMod.FOOTER] + ' ' + CSS_MODAL_FT + '"></div>'
    }
});