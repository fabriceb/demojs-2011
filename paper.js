/***
 *
 * Paper.js
 *
 * A JavaScript Vector Graphics Library, based on Scriptographer.org and
 * designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 *
 ***
 *
 * Bootstrap.js JavaScript Framework.
 * http://bootstrapjs.org/
 *
 * Copyright (c) 2006 - 2011 Juerg Lehni
 * http://lehni.org/
 *
 * Distributed under the MIT license.
 *
 ***
 *
 * Parse-js
 *
 * A JavaScript tokenizer / parser / generator, originally written in Lisp.
 * Copyright (c) Marijn Haverbeke <marijnh@gmail.com>
 * http://marijn.haverbeke.nl/parse-js/
 *
 * Ported by to JavaScript by Mihai Bazon
 * Copyright (c) 2010, Mihai Bazon <mihai.bazon@gmail.com>
 * http://mihai.bazon.net/blog/
 *
 * Modifications and adaptions to browser (c) 2011, Juerg Lehni
 * http://lehni.org/
 *
 * Distributed under the BSD license.
 *
 ***/

/**
 * The global PaperScope object
 * @name paper
 * @ignore
 */
var paper = new function() {
// Inline Bootstrap core (the Base class) inside the paper scope first:
/**
 * Bootstrap JavaScript Library
 * (c) 2006 - 2011 Juerg Lehni, http://lehni.org/
 * 
 * Bootstrap is released under the MIT license
 * http://bootstrapjs.org/
 * 
 * Inspirations:
 * http://dean.edwards.name/weblog/2006/03/base/
 * http://dev.helma.org/Wiki/JavaScript+Inheritance+Sugar/
 * http://prototypejs.org/
 */

var Base = new function() { // Bootstrap scope
	// Fix __proto__ for browsers where it is not implemented (IE and Opera).
	var fix = !this.__proto__,
		hidden = /^(statics|generics|preserve|enumerable|prototype|__proto__|toString|valueOf)$/,
		proto = Object.prototype,
		/**
		 * Private function that checks if an object contains a given property.
		 * Naming it 'has' causes problems on Opera when defining
		 * Object.prototype.has, as the local version then seems to be overriden
		 * by that. Giving it a idfferent name fixes it.
		 */
		has = fix
			? function(name) {
				return name !== '__proto__' && this.hasOwnProperty(name);
			}
			: proto.hasOwnProperty,
		toString = proto.toString,
		proto = Array.prototype,
		isArray = Array.isArray = Array.isArray || function(obj) {
			return toString.call(obj) === '[object Array]';
		},
		slice = proto.slice,
		forEach = proto.forEach = proto.forEach || function(iter, bind) {
			for (var i = 0, l = this.length; i < l; i++)
				iter.call(bind, this[i], i, this);
		},
		forIn = function(iter, bind) {
			// Do not use Object.keys for iteration as iterators might modify
			// the object we're iterating over, making the hasOwnProperty still
			// necessary.
			for (var i in this)
				if (this.hasOwnProperty(i))
					iter.call(bind, this[i], i, this);
		},
		_define = Object.defineProperty,
		_describe = Object.getOwnPropertyDescriptor;

	// Support a mixed environment of some ECMAScript 5 features present,
	// along with __defineGetter/Setter__ functions, as found in browsers today.
	function define(obj, name, desc) {
		// Unfortunately Safari seems to ignore configurable: true and
		// does not override existing properties, so we need to delete
		// first:
		if (_define) {
			try {
				delete obj[name];
				return _define(obj, name, desc);
			} catch (e) {}
		}
		if ((desc.get || desc.set) && obj.__defineGetter__) {
			desc.get && obj.__defineGetter__(name, desc.get);
			desc.set && obj.__defineSetter__(name, desc.set);
		} else {
			obj[name] = desc.value;
		}
		return obj;
	}

	function describe(obj, name) {
		if (_describe) {
			try {
				return _describe(obj, name);
			} catch (e) {}
		}
		var get = obj.__lookupGetter__ && obj.__lookupGetter__(name);
		return get
			? { get: get, set: obj.__lookupSetter__(name), enumerable: true,
					configurable: true }
			: has.call(obj, name)
				? { value: obj[name], enumerable: true, configurable: true,
						writable: true }
				: null;
	}

	/**
	 * Private function that injects functions from src into dest, overriding
	 * (and inherinting from) base.
	 */
	function inject(dest, src, enumerable, base, preserve, generics) {
		var beans, bean;

		/**
		 * Private function that injects one field with given name and checks if
		 * the field is a function that needs to be wrapped for calls of base().
		 * This is only needed if the function in base is different from the one
		 * in src, and if the one in src is actually calling base through base.
		 * The string of the function is parsed for this.base to detect calls.
		 */
		function field(name, val, dontCheck, generics) {
			// This does even work for prop: 0, as it will just be looked up
			// again through describe.
			var val = val || (val = describe(src, name))
					&& (val.get ? val : val.value),
				func = typeof val === 'function',
				res = val,
				// Only lookup previous value if we preserve or define a
				// function that might need it for this.base(). If we're
				// defining a getter, don't lookup previous value, but look if
				// the property exists (name in dest) and store result in prev
				prev = preserve || func
					? (val && val.get ? name in dest : dest[name]) : null;
			// Make generics first, as we might jump out bellow in the
			// val !== (src.__proto__ || Object.prototype)[name] check,
			// e.g. when explicitely reinjecting Array.prototype methods
			// to produce generics of them.
			if (generics && func && (!preserve || !generics[name])) {
				generics[name] = function(bind) {
					// Do not call Array.slice generic here, as on Safari,
					// this seems to confuse scopes (calling another
					// generic from generic-producing code).
					return bind && dest[name].apply(bind,
							slice.call(arguments, 1));
				}
			}
			if ((dontCheck || val !== undefined && has.call(src, name))
					&& (!preserve || !prev)) {
				if (func) {
					if (prev && /\bthis\.base\b/.test(val)) {
						var fromBase = base && base[name] == prev;
						res = function() {
							// Look up the base function each time if we can,
							// to reflect changes to the base class after
							// inheritance.
							var tmp = describe(this, 'base');
							define(this, 'base', { value: fromBase
								? base[name] : prev, configurable: true });
							try {
								return val.apply(this, arguments);
							} finally {
								tmp ? define(this, 'base', tmp)
									: delete this.base;
							}
						};
						// Make wrapping closure pretend to be the original
						// function on inspection
						res.toString = function() {
							return val.toString();
						}
						res.valueOf = function() {
							return val.valueOf();
						}
					}
					// Produce bean properties if getters are specified. This
					// does not produce properties for setter-only properties.
					// Just collect beans for now, and look them up in dest at
					// the end of fields injection. This ensures this.base()
					// works in beans too, and inherits setters for redefined
					// getters in subclasses. Only add getter beans if they do
					// not expect arguments. Functions that should function both
					// with optional arguments and as beans should not declare
					// the parameters and use the arguments array internally
					// instead.
					if (beans && val.length == 0
							&& (bean = name.match(/^(get|is)(([A-Z])(.*))$/)))
						beans.push([ bean[3].toLowerCase() + bean[4], bean[2] ]);
				}
				// No need to look up getter if this is a function already.
				if (!res || func || !res.get && !res.set)
					res = { value: res, writable: true };
				// Only set/change configurable and enumerable if this field is
				// configurable
				if ((describe(dest, name)
						|| { configurable: true }).configurable) {
					res.configurable = true;
					res.enumerable = enumerable;
				}
				define(dest, name, res);
			}
		}
		// Iterate through all definitions in src now and call field() for each.
		if (src) {
			beans = [];
			for (var name in src)
				if (has.call(src, name) && !hidden.test(name))
					field(name, null, true, generics);
			// IE (and some other browsers?) never enumerate these, even  if
			// they are simply set on an object. Force their creation. Do not
			// create generics for these, and check them for not being defined
			// (by passing undefined for dontCheck).
			field('toString');
			field('valueOf');
			// Now finally define beans as well. Look up methods on dest, for
			// support of this.base() (See above).
			for (var i = 0, l = beans && beans.length; i < l; i++)
				try {
					var bean = beans[i], part = bean[1];
					field(bean[0], {
						get: dest['get' + part] || dest['is' + part],
						set: dest['set' + part]
					}, true);
				} catch (e) {}
		}
		return dest;
	}

	/**
	 * Private function that creates a constructor to extend the given object.
	 * When this constructor is called through new, a new object is craeted
	 * that inherits all from obj.
	 */
	function extend(obj) {
		// Create the constructor for the new prototype that calls initialize
		// if it is defined.
		var ctor = function(dont) {
			// Fix __proto__
			if (fix) define(this, '__proto__', { value: obj });
			// Call the constructor function, if defined and we are not
			// inheriting, in which case ctor.dont would be set, see bellow.
			if (this.initialize && dont !== ctor.dont)
				return this.initialize.apply(this, arguments);
		}
		ctor.prototype = obj;
		// Add a toString function that delegates to initialize if possible
		ctor.toString = function() {
			return (this.prototype.initialize || function() {}).toString();
		}
		return ctor;
	}

	/**
	 * Converts the argument to an iterator function. If none is specified, the
	 * identity function is returned.
	 * This supports normal functions, which are returned unmodified, and values
	 * to compare to. Wherever this function is used in the Enumerable
	 * functions, a value, a Function or null may be passed.
	 */
	function iterator(iter) {
		return !iter
			? function(val) { return val }
			: typeof iter !== 'function'
				? function(val) { return val == iter }
				: iter;
	}

	function each(obj, iter, bind, asArray) {
		try {
			if (obj)
				(asArray || asArray === undefined && isArray(obj)
					? forEach : forIn).call(obj, iterator(iter),
						bind = bind || obj);
		} catch (e) {
			if (e !== Base.stop) throw e;
		}
		return bind;
	}

	function clone(obj) {
		return each(obj, function(val, i) {
			this[i] = val;
		}, new obj.constructor());
	}

	// Inject into new ctor object that's passed to inject(), and then returned
	return inject(function() {}, {
		inject: function(src/*, ... */) {
			if (src) {
				var proto = this.prototype,
					base = proto.__proto__ && proto.__proto__.constructor,
					// Allow the whole scope to just define statics by defining
					// statics: true.
					statics = src.statics == true ? src : src.statics;
				if (statics != src)
					inject(proto, src, src.enumerable, base && base.prototype,
							src.preserve, src.generics && this);
				// Define new static fields as enumerable, and inherit from
				// base. enumerable is necessary so they can be copied over from
				// base, and it does not harm to have enumerable properties in
				// the constructor. Use the preserve setting in src.preserve for
				// statics too, not their own.
				inject(this, statics, true, base, src.preserve);
			}
			// If there are more than one argument, loop through them and call
			// inject again. Do not simple inline the above code in one loop,
			// since each of the passed objects might override this.inject.
			for (var i = 1, l = arguments.length; i < l; i++)
				this.inject(arguments[i]);
			return this;
		},

		extend: function(src/* , ... */) {
			// The new prototype extends the constructor on which extend is
			// called. Fix constructor.
			// TODO: Consider using Object.create instead of using this.dont if
			// available?
			var proto = new this(this.dont),
				ctor = extend(proto);
			define(proto, 'constructor',
					{ value: ctor, writable: true, configurable: true });
			// Define an object to be passed as the first parameter in
			// constructors when initialize should not be called.
			ctor.dont = {};
			// Copy over static fields, as prototype-like inheritance
			// is not possible for static fields. Mark them as enumerable
			// so they can be copied over again.
			inject(ctor, this, true);
			// Inject all the definitions in src. Use the new inject instead of
			// the one in ctor, in case it was overriden. this is needed when
			// overriding the static .inject(). But only inject if there's
			// something to actually inject.
			return arguments.length ? this.inject.apply(ctor, arguments) : ctor;
		}
		// Pass true for enumerable, so inject() and extend() can be passed on
		// to subclasses of Base through Base.inject() / extend().
	}, true).inject({
		/**
		 * Returns true if the object contains a property with the given name,
		 * false otherwise.
		 * Just like in .each, objects only contained in the prototype(s) are
		 * filtered.
		 */
		has: has,
		each: each,

		/**
		 * Injects the fields from the given object, adding this.base()
		 * functionality
		 */
		inject: function(/* src, ... */) {
			for (var i = 0, l = arguments.length; i < l; i++)
				inject(this, arguments[i]);
			return this;
		},

		/**
		 * Returns a new object that inherits all properties from "this",
		 * through proper JS inheritance, not copying.
		 * Optionally, src and hide parameters can be passed to fill in the
		 * newly created object just like in inject(), to copy the behavior
		 * of Function.prototype.extend.
		 */
		extend: function(/* src, ... */) {
			// Notice the "new" here: the private extend returns a constructor
			// as it's used for Function.prototype.extend as well. But when
			// extending objects, we want to return a new object that inherits
			// from "this". In that case, the constructor is never used again,
			// its just created to create a new object with the proper
			// inheritance set and is garbage collected right after.
			var res = new (extend(this));
			return res.inject.apply(res, arguments);
		},

		each: function(iter, bind) {
			return each(this, iter, bind);
		},

		/**
		 * Creates a new object of the same type and copies over all
		 * name / value pairs from this object.
		 */
		clone: function() {
			return clone(this);
		},

		statics: {
			// Expose some local privates as Base generics.
			each: each,
			clone: clone,
			define: define,
			describe: describe,
			iterator: iterator,

			has: function(obj, name) {
				return has.call(obj, name);
			},

			type: function(obj) {
				return (obj || obj === 0) && (obj._type || typeof obj) || null;
			},

			check: function(obj) {
				return !!(obj || obj === 0);
			},

			/**
			 * Returns the first argument that is defined.
			 * Null is counted as defined too, since !== undefined is used for
			 * comparisons. In this it differs from Mootools!
			 */
			pick: function() {
				for (var i = 0, l = arguments.length; i < l; i++)
					if (arguments[i] !== undefined)
						return arguments[i];
				return null;
			},

			/**
			 * A special constant, to be thrown by closures passed to each()
			 * 
			 * $continue / Base.next is not implemented, as the same
			 * functionality can achieved by using return in the closure.
			 * In prototype, the implementation of $continue also leads to a
			 * huge speed decrease, as the closure is wrapped in another closure
			 * that does nothing else than handling $continue.
			 */
			stop: {}
		}
	});
}

/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

// Extend Base with utility functions used across the library. Also set
// this.Base on the injection scope, since bootstrap.js ommits that.
/**
 * @name Base
 * @class
 * @private
 */
this.Base = Base.inject(/** @lends Base# */{
	/**
	 * General purpose clone function that delegates cloning to the constructor
	 * that receives the object to be cloned as the first argument.
	 * Note: #clone() needs to be overridden in any class that requires other
	 * cloning behavior.
	 */
	clone: function() {
		return new this.constructor(this);
	},

	statics: /** @lends Base */{
		/**
		 * Reads arguments of the type of the class on which it is called on
		 * from the passed arguments list or array, at the given index, up to
		 * the specified length. This is used in argument conversion, e.g. by
		 * all basic types (Point, Size, Rectangle) and also higher classes such
		 * as Color and Segment.
		 */
		read: function(list, start, length) {
			var start = start || 0,
				length = length || list.length - start;
			var obj = list[start];
			if (obj instanceof this
					// If the class defines _readNull, return null when nothing
					// was provided
					|| this.prototype._readNull && obj == null && length <= 1)
				return obj;
			obj = new this(this.dont);
			return obj.initialize.apply(obj, start > 0 || length < list.length
				? Array.prototype.slice.call(list, start, start + length)
				: list) || obj;
		},

		/**
		 * Reads all readable arguments from the list, handling nested arrays
		 * seperately.
		 */
		readAll: function(list, start) {
			var res = [], entry;
			for (var i = start || 0, l = list.length; i < l; i++) {
				res.push(Array.isArray(entry = list[i])
					? this.read(entry, 0)
					: this.read(list, i, 1));
			}
			return res;
		},

		/**
		 * Utility function for adding and removing items from a list of which
		 * each entry keeps a reference to its index in the list in the private
		 * _index property. Used for PaperScope#projects and Item#children.
		 */
		splice: function(list, items, index, remove) {
			var amount = items && items.length,
				append = index === undefined;
			index = append ? list.length : index;
			// Update _index on the items to be added first.
			for (var i = 0; i < amount; i++)
				items[i]._index = index + i;
			if (append) {
				// Append them all at the end by using push
				list.push.apply(list, items);
				// Nothing removed, and nothing to adjust above
				return [];
			} else {
				// Insert somewhere else and/or remove
				var args = [index, remove];
				if (items)
					args.push.apply(args, items);
				var removed = list.splice.apply(list, args);
				// Delete the indices of the removed items
				for (var i = 0, l = removed.length; i < l; i++)
					delete removed[i]._index;
				// Adjust the indices of the items above.
				for (var i = index + amount, l = list.length; i < l; i++)
					list[i]._index = i;
				return removed;
			}
		},

		merge: function() {
			return Base.each(arguments, function(hash) {
				Base.each(hash, function(value, key) {
					this[key] = value;
				}, this);
			}, {}, true); // Pass true for asArray.
		},

		/**
		 * Capitalizes the passed string: hello world -> Hello World
		 */
		capitalize: function(str) {
			return str.replace(/\b[a-z]/g, function(match) {
				return match.toUpperCase();
			});
		},

		/**
		 * Camelizes the passed string: caps-lock -> capsLock
		 */
		camelize: function(str) {
			return str.replace(/-(\w)/g, function(all, chr) {
				return chr.toUpperCase();
			});
		},

		hyphenate: function(str) {
			return str.replace(/[a-z][A-Z0-9]|[0-9][a-zA-Z]|[A-Z]{2}[a-z]/g,
				function(match) {
					return match.charAt(0) + '-' + match.substring(1);
				}
			);
		},

		/**
		 * Utility function for rendering numbers to strings at a precision of
		 * up to 5 fractional digits.
		 */
		formatNumber: function(num) {
			return (Math.round(num * 100000) / 100000).toString();
		},

		/**
		 * Utility function for rendering objects to strings, in object literal
		 * notation.
		 */
		formatObject: function(obj) {
			return '{ ' + Base.each(obj, function(value, key) {
				this.push(key + ': ' + value);
			}, []).join(', ') + ' }';
		}
	}
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name PaperScope
 *
 * @class Internal PaperScope class that handles all the fields available on the
 * global paper object, which simply is a pointer to the currently active scope.
 *
 * @private
 */
var PaperScope = this.PaperScope = Base.extend(/** @scope _global_ */{
	/**
	 * The version of Paper.js, as a float number.
	 *
	 * @type Number
	 */
	version: 0.1,

	initialize: function(id) {
		/** @lends _global_# */

		/**
		 * The currently active project.
		 * @type Project
		 */
		this.project = null;

		/**
		 * The list of all open projects within the current Paper.js context.
		 * @type Project[]
		 */
		this.projects = [];

		/**
		 * The active view of the active project.
		 * @type View
		 */
		this.view = null;

		/**
		 * The active view of the active project.
		 * @type View
		 */
		this.views = [];

		/**
		 * The reference to the tool object.
		 * @type Tool
		 */
		this.tool = null;
		this.tools = [];
		this.id = id;
		PaperScope._scopes[id] = this;

		// DOCS: should the different event handlers be in here?
		/**
		 * {@grouptitle View Event Handlers}
		 * A reference to the {@link View#onFrame} handler function.
		 *
		 * @name onFrame
		 * @property
		 * @type Function
		 */

		/**
		 * A reference to the {@link View#onResize} handler function.
		 *
		 * @name onResize
		 * @property
		 * @type Function
		 */

		/**
		 * {@grouptitle Mouse Event Handlers}
		 * A reference to the {@link Tool#onMouseDown} handler function.
		 * @name onMouseDown
		 * @property
		 * @type Function
		 */

		/**
		 * A reference to the {@link Tool#onMouseDrag} handler function.
		 *
		 * @name onMouseDrag
		 * @property
		 * @type Function
		 */

		/**
		 * A reference to the {@link Tool#onMouseMove} handler function.
		 *
		 * @name onMouseMove
		 * @property
		 * @type Function
		 */

		/**
		 * A reference to the {@link Tool#onMouseUp} handler function.
		 *
		 * @name onMouseUp
		 * @property
		 * @type Function
		 */

		/**
		 * {@grouptitle Keyboard Event Handlers}
		 * A reference to the {@link Tool#onKeyDown} handler function.
		 *
		 * @name onKeyDown
		 * @property
		 * @type Function
		 */

		/**
		 * A reference to the {@link Tool#onKeyUp} handler function.
		 *
		 * @name onKeyUp
		 * @property
		 * @type Function
		 */
	},

	evaluate: function(code) {
		var res = PaperScript.evaluate(code, this);
		View.updateFocus();
		return res;
	},

	/**
	 * Installs the paper scope into any other given scope. Can be used for
	 * examle to inject the currently active PaperScope into the window's global
	 * scope, to emulate PaperScript-style globally accessible Paper classes:
	 *
	 * paper.install(window);
	 * @ignore
	 */
	install: function(scope) {
		// Use scope as side-car (= 'this' inside iterator), and have it
		// returned at the end.
		return Base.each(this, function(value, key) {
			this[key] = value;
		}, scope);
	},

	clear: function() {
		// Remove all projects, views and tools.
		for (var i = this.projects.length - 1; i >= 0; i--)
			this.projects[i].remove();
		// This also removes the installed event handlers.
		for (var i = this.views.length - 1; i >= 0; i--)
			this.views[i].remove();
		for (var i = this.tools.length - 1; i >= 0; i--)
			this.tools[i].remove();
	},

	remove: function() {
		this.clear();
		delete PaperScope._scopes[this.id];
	},

	_needsRedraw: function() {
		// Make sure we're not looping through the view list each time...
		if (!this._redrawNotified) {
			for (var i = this.views.length - 1; i >= 0; i--)
				this.views[i]._redrawNeeded = true;
			this._redrawNotified = true;
		}
	},

	statics: {
		_scopes: {},

		/**
		 * Retrieves a PaperScope object with the given id or associated with
		 * the passed canvas element.
		 *
		 * @param id
		 * @ignore
		 */
		get: function(id) {
			// If a script tag is passed, get the id from it.
			if (typeof id === 'object')
				id = id.getAttribute('id');
			return this._scopes[id] || null;
		},

		/**
		 * A way to iterate over all active scopes without accessing _scopes
		 *
		 * @param iter
		 * @ignore
		 */
		each: function(iter) {
			Base.each(this._scopes, iter);
		}
	}
});

// Include Paper classes, which are later injected into PaperScope by setting
// them on the 'this' object, e.g.:
// var Point = this.Point = Base.extend(...);

/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Point
 *
 * @class The Point object represents a point in the two dimensional space
 * of the Paper.js project. It is also used to represent two dimensional
 * vector objects.
 *
 * @classexample
 * // Create a point at x: 10, y: 5
 * var point = new Point(10, 5);
 * console.log(point.x); // 10
 * console.log(point.y); // 5
 */
var Point = this.Point = Base.extend(/** @lends Point# */{
	/**
	 * Creates a Point object with the given x and y coordinates.
	 *
	 * @name Point#initialize
	 * @param {Number} x the x coordinate
	 * @param {Number} y the y coordinate
	 *
	 * @example
	 * // Create a point at x: 10, y: 5
	 * var point = new Point(10, 5);
	 * console.log(point.x); // 10
	 * console.log(point.y); // 5
	 */
	/**
	 * Creates a Point object using the numbers in the given array as
	 * coordinates.
	 *
	 * @name Point#initialize
	 * @param {array} array
	 *
	 * @example
	 * // Creating a point at x: 10, y: 5 using an array of numbers:
	 * var array = [10, 5];
	 * var point = new Point(array);
	 * console.log(point.x); // 10
	 * console.log(point.y); // 5
	 *
	 * @example
	 * // Passing an array to a functionality that expects a point:
	 *
	 * // Create a circle shaped path at x: 50, y: 50
	 * // with a radius of 30:
	 * var path = new Path.Circle([50, 50], 30);
	 * path.fillColor = 'red';
	 *
	 * // Which is the same as doing:
	 * var path = new Path.Circle(new Point(50, 50), 30);
	 * path.fillColor = 'red';
	 */
	/**
	 * Creates a Point object using the properties in the given object.
	 *
	 * @name Point#initialize
	 * @param {object} object
	 *
	 * @example
	 * // Creating a point using an object literal with length and angle
	 * // properties:
	 *
	 * var point = new Point({
	 * 	length: 10,
	 * 	angle: 90
	 * });
	 * console.log(point.length); // 10
	 * console.log(point.angle); // 90
	 *
	 * @example
	 * // Creating a point at x: 10, y: 20 using an object literal:
	 *
	 * var point = new Point({
	 * 	x: 10,
	 * 	y: 20
	 * });
	 * console.log(point.x); // 10
	 * console.log(point.y); // 20
	 *
	 * @example
	 * // Passing an object to a functionality that expects a point:
	 *
	 * var center = {
	 * 	x: 50,
	 * 	y: 50
	 * };
	 *
	 * // Creates a circle shaped path at x: 50, y: 50
	 * // with a radius of 30:
	 * var path = new Path.Circle(center, 30);
	 * path.fillColor = 'red';
	 */
	/**
	 * Creates a Point object using the width and height values of the given
	 * Size object.
	 *
	 * @name Point#initialize
	 * @param {Size} size
	 *
	 * @example
	 * // Creating a point using a size object.
	 *
	 * // Create a Size with a width of 100pt and a height of 50pt
	 * var size = new Size(100, 50);
	 * console.log(size); // { width: 100, height: 50 }
	 * var point = new Point(size);
	 * console.log(point); // { x: 100, y: 50 }
	 */
	/**
	 * Creates a Point object using the coordinates of the given Point object.
	 *
	 * @param {Point} point
	 * @name Point#initialize
	 */
	initialize: function(arg0, arg1) {
		if (arg1 !== undefined) {
			this.x = arg0;
			this.y = arg1;
		} else if (arg0 !== undefined) {
			if (arg0 == null) {
				this.x = this.y = 0;
			} else if (arg0.x !== undefined) {
				this.x = arg0.x;
				this.y = arg0.y;
			} else if (arg0.width !== undefined) {
				this.x = arg0.width;
				this.y = arg0.height;
			} else if (Array.isArray(arg0)) {
				this.x = arg0[0];
				this.y = arg0.length > 1 ? arg0[1] : arg0[0];
			} else if (arg0.angle !== undefined) {
				this.x = arg0.length;
				this.y = 0;
				this.setAngle(arg0.angle);
			} else if (typeof arg0 === 'number') {
				this.x = this.y = arg0;
			} else {
				this.x = this.y = 0;
			}
		} else {
			this.x = this.y = 0;
		}
	},

	/**
	 * The x coordinate of the point
	 *
	 * @name Point#x
	 * @type Number
	 */

	/**
	 * The y coordinate of the point
	 *
	 * @name Point#y
	 * @type Number
	 */

	set: function(x, y) {
		this.x = x;
		this.y = y;
		return this;
	},

	/**
	 * Returns a copy of the point.
	 *
	 * @example
	 * var point1 = new Point();
	 * var point2 = point1;
	 * point2.x = 1; // also changes point1.x
	 *
	 * var point2 = point1.clone();
	 * point2.x = 1; // doesn't change point1.x
	 *
	 * @returns {Point} the cloned point
	 */
	clone: function() {
		return Point.create(this.x, this.y);
	},

	/**
	 * @return {String} A string representation of the point.
	 */
	toString: function() {
		var format = Base.formatNumber;
		return '{ x: ' + format(this.x) + ', y: ' + format(this.y) + ' }';
	},

	/**
	 * Returns the addition of the supplied value to both coordinates of
	 * the point as a new point.
	 * The object itself is not modified!
	 *
	 * @name Point#add
	 * @function
	 * @param {Number} number the number to add
	 * @return {Point} the addition of the point and the value as a new point
	 *
	 * @example
	 * var point = new Point(5, 10);
	 * var result = point + 20;
	 * console.log(result); // {x: 25, y: 30}
	 */
	/**
	 * Returns the addition of the supplied point to the point as a new
	 * point.
	 * The object itself is not modified!
	 *
	 * @name Point#add
	 * @function
	 * @param {Point} point the point to add
	 * @return {Point} the addition of the two points as a new point
	 *
	 * @example
	 * var point1 = new Point(5, 10);
	 * var point2 = new Point(10, 20);
	 * var result = point1 + point2;
	 * console.log(result); // {x: 15, y: 30}
	 */
	add: function(point) {
		point = Point.read(arguments);
		return Point.create(this.x + point.x, this.y + point.y);
	},

	/**
	 * Returns the subtraction of the supplied value to both coordinates of
	 * the point as a new point.
	 * The object itself is not modified!
	 *
	 * @name Point#subtract
	 * @function
	 * @param {Number} number the number to subtract
	 * @return {Point} the subtraction of the point and the value as a new point
	 *
	 * @example
	 * var point = new Point(10, 20);
	 * var result = point - 5;
	 * console.log(result); // {x: 5, y: 15}
	 */
	/**
	 * Returns the subtraction of the supplied point to the point as a new
	 * point.
	 * The object itself is not modified!
	 *
	 * @name Point#subtract
	 * @function
	 * @param {Point} point the point to subtract
	 * @return {Point} the subtraction of the two points as a new point
	 *
	 * @example
	 * var firstPoint = new Point(10, 20);
	 * var secondPoint = new Point(5, 5);
	 * var result = firstPoint - secondPoint;
	 * console.log(result); // {x: 5, y: 15}
	 */
	subtract: function(point) {
		point = Point.read(arguments);
		return Point.create(this.x - point.x, this.y - point.y);
	},

	/**
	 * Returns the multiplication of the supplied value to both coordinates of
	 * the point as a new point.
	 * The object itself is not modified!
	 *
	 * @name Point#multiply
	 * @function
	 * @param {Number} number the number to multiply by
	 * @return {Point} the multiplication of the point and the value as a new point
	 *
	 * @example
	 * var point = new Point(10, 20);
	 * var result = point * 2;
	 * console.log(result); // {x: 20, y: 40}
	 */
	/**
	 * Returns the multiplication of the supplied point to the point as a new
	 * point.
	 * The object itself is not modified!
	 *
	 * @name Point#multiply
	 * @function
	 * @param {Point} point the point to multiply by
	 * @return {Point} the multiplication of the two points as a new point
	 *
	 * @example
	 * var firstPoint = new Point(5, 10);
	 * var secondPoint = new Point(4, 2);
	 * var result = firstPoint * secondPoint;
	 * console.log(result); // {x: 20, y: 20}
	 */
	multiply: function(point) {
		point = Point.read(arguments);
		return Point.create(this.x * point.x, this.y * point.y);
	},

	/**
	 * Returns the division of the supplied value to both coordinates of
	 * the point as a new point.
	 * The object itself is not modified!
	 *
	 * @name Point#divide
	 * @function
	 * @param {Number} number the number to divide by
	 * @return {Point} the division of the point and the value as a new point
	 *
	 * @example
	 * var point = new Point(10, 20);
	 * var result = point / 2;
	 * console.log(result); // {x: 5, y: 10}
	 */
	/**
	 * Returns the division of the supplied point to the point as a new
	 * point.
	 * The object itself is not modified!
	 *
	 * @name Point#divide
	 * @function
	 * @param {Point} point the point to divide by
	 * @return {Point} the division of the two points as a new point
	 *
	 * @example
	 * var firstPoint = new Point(8, 10);
	 * var secondPoint = new Point(2, 5);
	 * var result = firstPoint / secondPoint;
	 * console.log(result); // {x: 4, y: 2}
	 */
	divide: function(point) {
		point = Point.read(arguments);
		return Point.create(this.x / point.x, this.y / point.y);
	},

	/**
	 * The modulo operator returns the integer remainders of dividing the point
	 * by the supplied value as a new point.
	 *
	 * @name Point#modulo
	 * @function
	 * @param {Number} value
	 * @return {Point} the integer remainders of dividing the point by the value
	 *                 as a new point
	 *
	 * @example
	 * var point = new Point(12, 6);
	 * console.log(point % 5); // {x: 2, y: 1}
	 */
	/**
	 * The modulo operator returns the integer remainders of dividing the point
	 * by the supplied value as a new point.
	 *
	 * @name Point#modulo
	 * @function
	 * @param {Point} point
	 * @return {Point} the integer remainders of dividing the points by each
	 *                 other as a new point
	 *
	 * @example
	 * var point = new Point(12, 6);
	 * console.log(point % new Point(5, 2)); // {x: 2, y: 0}
	 */
	modulo: function(point) {
		point = Point.read(arguments);
		return Point.create(this.x % point.x, this.y % point.y);
	},

	negate: function() {
		return Point.create(-this.x, -this.y);
	},

	/**
	 * Transforms the point by the matrix as a new point. The object itself
	 * is not modified!
	 *
	 * @param {Matrix} matrix
	 * @return {Point} the transformed point
	 */
	transform: function(matrix) {
		return matrix._transformPoint(this);
	},

	/**
	 * {@grouptitle Distance & Length}
	 *
	 * Returns the distance between the point and another point.
	 *
	 * @param {Point} point
	 * @return {Number}
	 */
	getDistance: function(point) {
		point = Point.read(arguments);
		var x = point.x - this.x,
			y = point.y - this.y;
		return Math.sqrt(x * x + y * y);
	},

	/**
	 * The length of the vector that is represented by this point's coordinates.
	 * Each point can be interpreted as a vector that points from the origin
	 * ({@code x = 0}, {@code y = 0}) to the point's location.
	 * Setting the length changes the location but keeps the vector's angle.
	 *
	 * @type Number
	 * @bean
	 */
	getLength: function() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	},

	setLength: function(length) {
		// Whenever setting x/y, use #set() instead of direct assignment,
		// so LinkedPoint does not report changes twice.
		if (this.isZero()) {
			var angle = this._angle || 0;
			this.set(
				Math.cos(angle) * length,
				Math.sin(angle) * length
			);
		} else {
			var scale = length / this.getLength();
			// Force calculation of angle now, so it will be preserved even when
			// x and y are 0
			if (scale == 0)
				this.getAngle();
			this.set(
				this.x * scale,
				this.y * scale
			);
		}
		return this;
	},

	/**
	 * Normalize modifies the {@link #length} of the vector to {@code 1} without
	 * changing its angle and returns it as a new point. The optional
	 * {@code length} parameter defines the length to normalize to.
	 * The object itself is not modified!
	 *
	 * @param {Number} [length=1] the length of the normalized vector
	 * @return {Point} the normalized vector of the vector that is represented
	 *                 by this point's coordinates.
	 */
	normalize: function(length) {
		if (length === undefined)
			length = 1;
		var current = this.getLength(),
			scale = current != 0 ? length / current : 0,
			point = Point.create(this.x * scale, this.y * scale);
		// Preserve angle.
		point._angle = this._angle;
		return point;
	},

	/**
	 * {@grouptitle Angle & Rotation}
	 * Returns the smaller angle between two vectors. The angle is unsigned, no
	 * information about rotational direction is given.
	 *
	 * @name Point#getAngle
	 * @function
	 * @param {Point} point
	 * @return {Number} the angle in degrees
	 */
	/**
	 * The vector's angle in degrees, measured from the x-axis to the vector.
	 *
	 * The angle is unsigned, no information about rotational direction is
	 * given.
	 *
	 * @name Point#getAngle
	 * @bean
	 * @type Number
	 */
	getAngle: function(/* point */) {
		// Hide parameters from Bootstrap so it injects bean too
		return this.getAngleInRadians(arguments[0]) * 180 / Math.PI;
	},

	setAngle: function(angle) {
		angle = this._angle = angle * Math.PI / 180;
		if (!this.isZero()) {
			var length = this.getLength();
			// Use #set() instead of direct assignment of x/y, so LinkedPoint
			// does not report changes twice.
			this.set(
				Math.cos(angle) * length,
				Math.sin(angle) * length
			);
		}
		return this;
	},

	/**
	 * Returns the smaller angle between two vectors in radians. The angle is
	 * unsigned, no information about rotational direction is given.
	 *
	 * @name Point#getAngleInRadians
	 * @function
	 * @param {Point} point
	 * @return {Number} the angle in radians
	 */
	/**
	 * The vector's angle in radians, measured from the x-axis to the vector.
	 *
	 * The angle is unsigned, no information about rotational direction is
	 * given.
	 *
	 * @name Point#getAngleInRadians
	 * @bean
	 * @type Number
	 */
	getAngleInRadians: function(/* point */) {
		// Hide parameters from Bootstrap so it injects bean too
		if (arguments[0] === undefined) {
			if (this._angle == null)
				this._angle = Math.atan2(this.y, this.x);
			return this._angle;
		} else {
			var point = Point.read(arguments),
				div = this.getLength() * point.getLength();
			if (div == 0) {
				return NaN;
			} else {
				return Math.acos(this.dot(point) / div);
			}
		}
	},

	getAngleInDegrees: function(/* point */) {
		return this.getAngle(arguments[0]);
	},

	/**
	 * The quadrant of the {@link #angle} of the point.
	 *
	 * Angles between 0 and 90 degrees are in quadrant {@code 1}. Angles between
	 * 90 and 180 degrees are in quadrant {@code 2}, angles between 180 and 270
	 * degrees are in quadrant {@code 3} and angles between 270 and 360 degrees
	 * are in quadrant {@code 4}.
	 *
	 * @type Number
	 * @bean
	 *
	 * @example
	 * var point = new Point({
	 * 	angle: 10,
	 * 	length: 20
	 * });
	 * console.log(point.quadrant); // 1
	 *
	 * point.angle = 100;
	 * console.log(point.quadrant); // 2
	 *
	 * point.angle = 190;
	 * console.log(point.quadrant); // 3
	 *
	 * point.angle = 280;
	 * console.log(point.quadrant); // 4
	 */
	getQuadrant: function() {
		return this.x >= 0 ? this.y >= 0 ? 1 : 4 : this.y >= 0 ? 2 : 3;
	},

	/**
	 * Returns the angle between two vectors. The angle is directional and
	 * signed, giving information about the rotational direction.
	 *
	 * Read more about angle units and orientation in the description of the
	 * {@link #angle} property.
	 *
	 * @param {Point} point
	 * @return {Number} the angle between the two vectors
	 */
	getDirectedAngle: function(point) {
		point = Point.read(arguments);
		return Math.atan2(this.cross(point), this.dot(point)) * 180 / Math.PI;
	},

	/**
	 * Rotates the point by the given angle around an optional center point.
	 * The object itself is not modified.
	 *
	 * Read more about angle units and orientation in the description of the
	 * {@link #angle} property.
	 *
	 * @param {Number} angle the rotation angle
	 * @param {Point} center the center point of the rotation
	 * @returns {Point} the rotated point
	 */
	rotate: function(angle, center) {
		angle = angle * Math.PI / 180;
		var point = center ? this.subtract(center) : this,
			s = Math.sin(angle),
			c = Math.cos(angle);
		point = Point.create(
			point.x * c - point.y * s,
			point.y * c + point.x * s
		);
		return center ? point.add(center) : point;
	},

	/**
	 * Checks whether the coordinates of the point are equal to that of the
	 * supplied point.
	 *
	 * @param {Point} point
	 * @return {Boolean} {@true if the points are equal}
	 *
	 * @example
	 * var point = new Point(5, 10);
	 * console.log(point == new Point(5, 10)); // true
	 * console.log(point == new Point(1, 1)); // false
	 * console.log(point != new Point(1, 1)); // true
	 */
	equals: function(point) {
		point = Point.read(arguments);
		return this.x == point.x && this.y == point.y;
	},

	/**
	 * {@grouptitle Tests}
	 *
	 * Checks whether the point is inside the boundaries of the rectangle.
	 *
	 * @param {Rectangle} rect the rectangle to check against
	 * @returns {Boolean} {@true if the point is inside the rectangle}
	 */
	isInside: function(rect) {
		return rect.contains(this);
	},

	/**
	 * Checks if the point is within a given distance of another point.
	 *
	 * @param {Point} point the point to check against
	 * @param {Number} tolerance the maximum distance allowed
	 * @returns {Boolean} {@true if it is within the given distance}
	 */
	isClose: function(point, tolerance) {
		return this.getDistance(point) < tolerance;
	},

	/**
	 * Checks if the vector represented by this point is colinear (parallel) to
	 * another vector.
	 *
	 * @param {Point} point the vector to check against
	 * @returns {Boolean} {@true it is parallel}
	 */
	isColinear: function(point) {
		return this.cross(point) < Numerical.TOLERANCE;
	},

	/**
	 * Checks if the vector represented by this point is orthogonal
	 * (perpendicular) to another vector.
	 *
	 * @param {Point} point the vector to check against
	 * @returns {Boolean} {@true it is orthogonal}
	 */
	isOrthogonal: function(point) {
		return this.dot(point) < Numerical.TOLERANCE;
	},

	/**
	 * Checks if this point has both the x and y coordinate set to 0.
	 *
	 * @returns {Boolean} {@true both x and y are 0}
	 */
	isZero: function() {
		return this.x == 0 && this.y == 0;
	},

	/**
	 * Checks if this point has an undefined value for at least one of its
	 * coordinates.
	 *
	 * @returns {Boolean} {@true if either x or y are not a number}
	 */
	isNaN: function() {
		return isNaN(this.x) || isNaN(this.y);
	},

	/**
	 * {@grouptitle Vector Math Functions}
	 * Returns the dot product of the point and another point.
	 *
	 * @param {Point} point
	 * @returns {Number} the dot product of the two points
	 */
	dot: function(point) {
		point = Point.read(arguments);
		return this.x * point.x + this.y * point.y;
	},

	/**
	 * Returns the cross product of the point and another point.
	 *
	 * @param {Point} point
	 * @returns {Number} the cross product of the two points
	 */
	cross: function(point) {
		point = Point.read(arguments);
		return this.x * point.y - this.y * point.x;
	},

	/**
	 * Returns the projection of the point on another point.
	 * Both points are interpreted as vectors.
	 *
	 * @param {Point} point
	 * @returns {Point} the projection of the point on another point
	 */
	project: function(point) {
		point = Point.read(arguments);
		if (point.isZero()) {
			return Point.create(0, 0);
		} else {
			var scale = this.dot(point) / point.dot(point);
			return Point.create(
				point.x * scale,
				point.y * scale
			);
		}
	},

	/**
	 * This property is only present if the point is an anchor or control point
	 * of a {@link Segment} or a {@link Curve}. In this case, it returns
	 * {@true it is selected}
	 *
	 * @name Point#selected
	 * @property
	 * @return {Boolean} {@true the point is selected}
	 */

	statics: /** @lends Point */{
		/**
		 * Provide a faster creator for Points out of two coordinates that
		 * does not rely on Point#initialize at all. This speeds up all math
		 * operations a lot.
		 *
		 * @ignore
		 */
		create: function(x, y) {
			// Don't use the shorter form as we want absolute maximum
			// performance here:
			// return new Point(Point.dont).set(x, y);
			// TODO: Benchmark and decide
			var point = new Point(Point.dont);
			point.x = x;
			point.y = y;
			return point;
		},

		/**
		 * Returns a new point object with the smallest {@link #x} and
		 * {@link #y} of the supplied points.
		 *
		 * @static
		 * @param {Point} point1
		 * @param {Point} point2
		 * @returns {Point} The newly created point object
		 *
		 * @example
		 * var point1 = new Point(10, 100);
		 * var point2 = new Point(200, 5);
		 * var minPoint = Point.min(point1, point2);
		 * console.log(minPoint); // {x: 10, y: 5}
		 */
		min: function(point1, point2) {
			point1 = Point.read(arguments, 0, 1);
			point2 = Point.read(arguments, 1, 1);
			return Point.create(
				Math.min(point1.x, point2.x),
				Math.min(point1.y, point2.y)
			);
		},

		/**
		 * Returns a new point object with the largest {@link #x} and
		 * {@link #y} of the supplied points.
		 *
		 * @static
		 * @param {Point} point1
		 * @param {Point} point2
		 * @returns {Point} The newly created point object
		 *
		 * @example
		 * var point1 = new Point(10, 100);
		 * var point2 = new Point(200, 5);
		 * var maxPoint = Point.max(point1, point2);
		 * console.log(maxPoint); // {x: 200, y: 100}
		 */
		max: function(point1, point2) {
			point1 = Point.read(arguments, 0, 1);
			point2 = Point.read(arguments, 1, 1);
			return Point.create(
				Math.max(point1.x, point2.x),
				Math.max(point1.y, point2.y)
			);
		},

		/**
		 * Returns a point object with random {@link #x} and {@link #y} values
		 * between {@code 0} and {@code 1}.
		 *
		 * @returns {Point} The newly created point object
		 * @static
		 *
		 * @example
		 * var maxPoint = new Point(100, 100);
		 * var randomPoint = Point.random();
		 *
		 * // A point between {x:0, y:0} and {x:100, y:100}:
		 * var point = maxPoint * randomPoint;
		 */
		random: function() {
			return Point.create(Math.random(), Math.random());
		}
	}
}, new function() { // Scope for injecting round, ceil, floor, abs:
	/**
	 * {@grouptitle Math Functions}
	 *
	 * Returns a new point with rounded {@link #x} and {@link #y} values. The
	 * object itself is not modified!
	 *
	 * @name Point#round
	 * @function
	 * @return {Point}
	 *
	 * @example
	 * var point = new Point(10.2, 10.9);
	 * var roundPoint = point.round();
	 * console.log(roundPoint); // {x: 10, y: 11}
	 */

	/**
	 * Returns a new point with the nearest greater non-fractional values to the
	 * specified {@link #x} and {@link #y} values. The object itself is not
	 * modified!
	 *
	 * @name Point#ceil
	 * @function
	 * @return {Point}
	 *
	 * @example
	 * var point = new Point(10.2, 10.9);
	 * var ceilPoint = point.ceil();
	 * console.log(ceilPoint); // {x: 11, y: 11}
	 */

	/**
	 * Returns a new point with the nearest smaller non-fractional values to the
	 * specified {@link #x} and {@link #y} values. The object itself is not
	 * modified!
	 *
	 * @name Point#floor
	 * @function
	 * @return {Point}
	 *
	 * @example
	 * var point = new Point(10.2, 10.9);
	 * var floorPoint = point.floor();
	 * console.log(floorPoint); // {x: 10, y: 10}
	 */

	/**
	 * Returns a new point with the absolute values of the specified {@link #x}
	 * and {@link #y} values. The object itself is not modified!
	 *
	 * @name Point#abs
	 * @function
	 * @return {Point}
	 *
	 * @example
	 * var point = new Point(-5, 10);
	 * var absPoint = point.abs();
	 * console.log(absPoint); // {x: 5, y: 10}
	 */

	return Base.each(['round', 'ceil', 'floor', 'abs'], function(name) {
		var op = Math[name];
		this[name] = function() {
			return Point.create(op(this.x), op(this.y));
		};
	}, {});
});

/**
 * @name LinkedPoint
 *
 * @class An internal version of Point that notifies its owner of each change
 * through setting itself again on the setter that corresponds to the getter
 * that produced this LinkedPoint. See uses of LinkedPoint.create()
 * Note: This prototype is not exported.
 *
 * @ignore
 */
var LinkedPoint = Point.extend({
	set: function(x, y, dontNotify) {
		this._x = x;
		this._y = y;
		if (!dontNotify)
			this._owner[this._setter](this);
		return this;
	},

	getX: function() {
		return this._x;
	},

	setX: function(x) {
		this._x = x;
		this._owner[this._setter](this);
	},

	getY: function() {
		return this._y;
	},

	setY: function(y) {
		this._y = y;
		this._owner[this._setter](this);
	},

	statics: {
		create: function(owner, setter, x, y) {
			var point = new LinkedPoint(LinkedPoint.dont);
			point._x = x;
			point._y = y;
			point._owner = owner;
			point._setter = setter;
			return point;
		}
	}
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Size
 *
 * @class The Size object is used to describe the size of something, through
 * its {@link #width} and {@link #height} properties.
 *
 * @classexample
 * // Create a size that is 10pt wide and 5pt high
 * var size = new Size(10, 5);
 * console.log(size.width); // 10
 * console.log(size.height); // 5
 */
var Size = this.Size = Base.extend(/** @lends Size# */{
	// DOCS: improve Size class description
	/**
	 * Creates a Size object with the given width and height values.
	 *
	 * @name Size#initialize
	 * @param {Number} width the width
	 * @param {Number} height the height
	 *
	 * @example
	 * // Create a size that is 10pt wide and 5pt high
	 * var size = new Size(10, 5);
	 * console.log(size.width); // 10
	 * console.log(size.height); // 5
	 *
	/**
	 * Creates a Size object using the numbers in the given array as
	 * dimensions.
	 *
	 * @name Size#initialize
	 * @param {array} array
	 *
	 * @example
	 * // Creating a size of width: 320, height: 240 using an array of numbers:
	 * var array = [320, 240];
	 * var size = new Size(array);
	 * console.log(size.width); // 320
	 * console.log(size.height); // 240
	 */
	/**
	 * Creates a Size object using the properties in the given object.
	 *
	 * @name Size#initialize
	 * @param {object} object
	 *
	 * @example
	 * // Creating a size of width: 10, height: 20 using an object literal:
	 *
	 * var size = new Size({
	 * 	width: 10,
	 * 	height: 20
	 * });
	 * console.log(size.width); // 10
	 * console.log(size.height); // 20
	 */
	/**
	 * Creates a Size object using the coordinates of the given Size object.
	 *
	 * @name Size#initialize
	 * @param {Size} size
	 */
	/**
	 * Creates a Size object using the {@link Point#x} and {@link Point#y}
	 * values of the given Point object.
	 *
	 * @name Size#initialize
	 * @param {Point} point
	 *
	 * @example
	 * var point = new Point(50, 50);
	 * var size = new Size(point);
	 * console.log(size.width); // 50
	 * console.log(size.height); // 50
	 */
	initialize: function(arg0, arg1) {
		if (arg1 !== undefined) {
			this.width = arg0;
			this.height = arg1;
		} else if (arg0 !== undefined) {
			if (arg0 == null) {
				this.width = this.height = 0;
			} else if (arg0.width !== undefined) {
				this.width = arg0.width;
				this.height = arg0.height;
			} else if (arg0.x !== undefined) {
				this.width = arg0.x;
				this.height = arg0.y;
			} else if (Array.isArray(arg0)) {
				this.width = arg0[0];
				this.height = arg0.length > 1 ? arg0[1] : arg0[0];
			} else if (typeof arg0 === 'number') {
				this.width = this.height = arg0;
			} else {
				this.width = this.height = 0;
			}
		} else {
			this.width = this.height = 0;
		}
	},

	/**
	 * @return {String} A string representation of the size.
	 */
	toString: function() {
		var format = Base.formatNumber;
		return '{ width: ' + format(this.width)
				+ ', height: ' + format(this.height) + ' }';
	},

	/**
	 * The width of the size
	 *
	 * @name Size#width
	 * @type Number
	 */

	/**
	 * The height of the size
	 *
	 * @name Size#height
	 * @type Number
	 */

	set: function(width, height) {
		this.width = width;
		this.height = height;
		return this;
	},

	/**
	 * Returns a copy of the size.
	 */
	clone: function() {
		return Size.create(this.width, this.height);
	},

	/**
	 * Returns the addition of the supplied value to the width and height of the
	 * size as a new size. The object itself is not modified!
	 *
	 * @name Size#add
	 * @function
	 * @param {Number} number the number to add
	 * @return {Size} the addition of the size and the value as a new size
	 *
	 * @example
	 * var size = new Size(5, 10);
	 * var result = size + 20;
	 * console.log(result); // {width: 25, height: 30}
	 */
	/**
	 * Returns the addition of the width and height of the supplied size to the
	 * size as a new size. The object itself is not modified!
	 *
	 * @name Size#add
	 * @function
	 * @param {Size} size the size to add
	 * @return {Size} the addition of the two sizes as a new size
	 *
	 * @example
	 * var size1 = new Size(5, 10);
	 * var size2 = new Size(10, 20);
	 * var result = size1 + size2;
	 * console.log(result); // {width: 15, height: 30}
	 */
	add: function(size) {
		size = Size.read(arguments);
		return Size.create(this.width + size.width, this.height + size.height);
	},

	/**
	 * Returns the subtraction of the supplied value from the width and height
	 * of the size as a new size. The object itself is not modified!
	 * The object itself is not modified!
	 *
	 * @name Size#subtract
	 * @function
	 * @param {Number} number the number to subtract
	 * @return {Size} the subtraction of the size and the value as a new size
	 *
	 * @example
	 * var size = new Size(10, 20);
	 * var result = size - 5;
	 * console.log(result); // {width: 5, height: 15}
	 */
	/**
	 * Returns the subtraction of the width and height of the supplied size from
	 * the size as a new size. The object itself is not modified!
	 *
	 * @name Size#subtract
	 * @function
	 * @param {Size} size the size to subtract
	 * @return {Size} the subtraction of the two sizes as a new size
	 *
	 * @example
	 * var firstSize = new Size(10, 20);
	 * var secondSize = new Size(5, 5);
	 * var result = firstSize - secondSize;
	 * console.log(result); // {width: 5, height: 15}
	 */
	subtract: function(size) {
		size = Size.read(arguments);
		return Size.create(this.width - size.width, this.height - size.height);
	},

	/**
	 * Returns the multiplication of the supplied value with the width and
	 * height of the size as a new size. The object itself is not modified!
	 *
	 * @name Size#multiply
	 * @function
	 * @param {Number} number the number to multiply by
	 * @return {Size} the multiplication of the size and the value as a new size
	 *
	 * @example
	 * var size = new Size(10, 20);
	 * var result = size * 2;
	 * console.log(result); // {width: 20, height: 40}
	 */
	/**
	 * Returns the multiplication of the width and height of the supplied size
	 * with the size as a new size. The object itself is not modified!
	 *
	 * @name Size#multiply
	 * @function
	 * @param {Size} size the size to multiply by
	 * @return {Size} the multiplication of the two sizes as a new size
	 *
	 * @example
	 * var firstSize = new Size(5, 10);
	 * var secondSize = new Size(4, 2);
	 * var result = firstSize * secondSize;
	 * console.log(result); // {width: 20, height: 20}
	 */
	multiply: function(size) {
		size = Size.read(arguments);
		return Size.create(this.width * size.width, this.height * size.height);
	},

	/**
	 * Returns the division of the supplied value by the width and height of the
	 * size as a new size. The object itself is not modified!
	 *
	 * @name Size#divide
	 * @function
	 * @param {Number} number the number to divide by
	 * @return {Size} the division of the size and the value as a new size
	 *
	 * @example
	 * var size = new Size(10, 20);
	 * var result = size / 2;
	 * console.log(result); // {width: 5, height: 10}
	 */
	/**
	 * Returns the division of the width and height of the supplied size by the
	 * size as a new size. The object itself is not modified!
	 *
	 * @name Size#divide
	 * @function
	 * @param {Size} size the size to divide by
	 * @return {Size} the division of the two sizes as a new size
	 *
	 * @example
	 * var firstSize = new Size(8, 10);
	 * var secondSize = new Size(2, 5);
	 * var result = firstSize / secondSize;
	 * console.log(result); // {width: 4, height: 2}
	 */
	divide: function(size) {
		size = Size.read(arguments);
		return Size.create(this.width / size.width, this.height / size.height);
	},

	/**
	 * The modulo operator returns the integer remainders of dividing the size
	 * by the supplied value as a new size.
	 *
	 * @name Size#modulo
	 * @function
	 * @param {Number} value
	 * @return {Size} the integer remainders of dividing the size by the value
	 *                 as a new size
	 *
	 * @example
	 * var size = new Size(12, 6);
	 * console.log(size % 5); // {width: 2, height: 1}
	 */
	/**
	 * The modulo operator returns the integer remainders of dividing the size
	 * by the supplied size as a new size.
	 *
	 * @name Size#modulo
	 * @function
	 * @param {Size} size
	 * @return {Size} the integer remainders of dividing the sizes by each
	 *                 other as a new size
	 *
	 * @example
	 * var size = new Size(12, 6);
	 * console.log(size % new Size(5, 2)); // {width: 2, height: 0}
	 */
	modulo: function(size) {
		size = Size.read(arguments);
		return Size.create(this.width % size.width, this.height % size.height);
	},

	negate: function() {
		return Size.create(-this.width, -this.height);
	},

	/**
	 * Checks whether the width and height of the size are equal to those of the
	 * supplied size.
	 *
	 * @param {Size}
	 * @return {Boolean}
	 *
	 * @example
	 * var size = new Size(5, 10);
	 * console.log(size == new Size(5, 10)); // true
	 * console.log(size == new Size(1, 1)); // false
	 * console.log(size != new Size(1, 1)); // true
	 */
	equals: function(size) {
		size = Size.read(arguments);
		return this.width == size.width && this.height == size.height;
	},

	/**
	 * {@grouptitle Tests}
	 * Checks if this size has both the width and height set to 0.
	 *
	 * @return {Boolean} {@true both width and height are 0}
	 */
	isZero: function() {
		return this.width == 0 && this.width == 0;
	},

	/**
	 * Checks if the width or the height of the size are NaN.
	 *
	 * @return {Boolean} {@true if the width or height of the size are NaN}
	 */
	isNaN: function() {
		return isNaN(this.width) || isNaN(this.height);
	},

	statics: /** @lends Size */{
		// See Point.create()
		create: function(width, height) {
			return new Size(Size.dont).set(width, height);
		},

		/**
		 * Returns a new size object with the smallest {@link #width} and
		 * {@link #height} of the supplied sizes.
		 *
		 * @static
		 * @param {Size} size1
		 * @param {Size} size2
		 * @returns {Size} The newly created size object
		 *
		 * @example
		 * var size1 = new Size(10, 100);
		 * var size2 = new Size(200, 5);
		 * var minSize = Size.min(size1, size2);
		 * console.log(minSize); // {width: 10, height: 5}
		 */
		min: function(size1, size2) {
			return Size.create(
				Math.min(size1.width, size2.width),
				Math.min(size1.height, size2.height));
		},

		/**
		 * Returns a new size object with the largest {@link #width} and
		 * {@link #height} of the supplied sizes.
		 *
		 * @static
		 * @param {Size} size1
		 * @param {Size} size2
		 * @returns {Size} The newly created size object
		 *
		 * @example
		 * var size1 = new Size(10, 100);
		 * var size2 = new Size(200, 5);
		 * var maxSize = Size.max(size1, size2);
		 * console.log(maxSize); // {width: 200, height: 100}
		 */
		max: function(size1, size2) {
			return Size.create(
				Math.max(size1.width, size2.width),
				Math.max(size1.height, size2.height));
		},

		/**
		 * Returns a size object with random {@link #width} and {@link #height}
		 * values between {@code 0} and {@code 1}.
		 *
		 * @returns {Size} The newly created size object
		 * @static
		 *
		 * @example
		 * var maxSize = new Size(100, 100);
		 * var randomSize = Size.random();
		 * var size = maxSize * randomSize;
		 */
		random: function() {
			return Size.create(Math.random(), Math.random());
		}
	}
}, new function() { // Scope for injecting round, ceil, floor, abs:

	/**
	 * {@grouptitle Math Functions}
	 *
	 * Returns a new size with rounded {@link #width} and {@link #height} values.
	 * The object itself is not modified!
	 *
	 * @name Size#round
	 * @function
	 * @return {Size}
	 *
	 * @example
	 * var size = new Size(10.2, 10.9);
	 * var roundSize = size.round();
	 * console.log(roundSize); // {x: 10, y: 11}
	 */

	/**
	 * Returns a new size with the nearest greater non-fractional values to the
	 * specified {@link #width} and {@link #height} values. The object itself is not
	 * modified!
	 *
	 * @name Size#ceil
	 * @function
	 * @return {Size}
	 *
	 * @example
	 * var size = new Size(10.2, 10.9);
	 * var ceilSize = size.ceil();
	 * console.log(ceilSize); // {x: 11, y: 11}
	 */

	/**
	 * Returns a new size with the nearest smaller non-fractional values to the
	 * specified {@link #width} and {@link #height} values. The object itself is not
	 * modified!
	 *
	 * @name Size#floor
	 * @function
	 * @return {Size}
	 *
	 * @example
	 * var size = new Size(10.2, 10.9);
	 * var floorSize = size.floor();
	 * console.log(floorSize); // {x: 10, y: 10}
	 */

	/**
	 * Returns a new size with the absolute values of the specified {@link #width}
	 * and {@link #height} values. The object itself is not modified!
	 *
	 * @name Size#abs
	 * @function
	 * @return {Size}
	 *
	 * @example
	 * var size = new Size(-5, 10);
	 * var absSize = size.abs();
	 * console.log(absSize); // {x: 5, y: 10}
	 */

	return Base.each(['round', 'ceil', 'floor', 'abs'], function(name) {
		var op = Math[name];
		this[name] = function() {
			return Size.create(op(this.width), op(this.height));
		};
	}, {});
});

/**
 * @name LinkedSize
 *
 * @class An internal version of Size that notifies its owner of each change
 * through setting itself again on the setter that corresponds to the getter
 * that produced this LinkedSize. See uses of LinkedSize.create()
 * Note: This prototype is not exported.
 *
 * @private
 */
var LinkedSize = Size.extend({
	set: function(width, height, dontNotify) {
		this._width = width;
		this._height = height;
		if (!dontNotify)
			this._owner[this._setter](this);
		return this;
	},

	getWidth: function() {
		return this._width;
	},

	setWidth: function(width) {
		this._width = width;
		this._owner[this._setter](this);
	},

	getHeight: function() {
		return this._height;
	},

	setHeight: function(height) {
		this._height = height;
		this._owner[this._setter](this);
	},

	statics: {
		create: function(owner, setter, width, height) {
			var point = new LinkedSize(LinkedSize.dont);
			point._width = width;
			point._height = height;
			point._owner = owner;
			point._setter = setter;
			return point;
		}
	}
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Rectangle
 *
 * @class A Rectangle specifies an area that is enclosed by it's top-left
 * point (x, y), its width, and its height. It should not be confused with a
 * rectangular path, it is not an item.
 */
var Rectangle = this.Rectangle = Base.extend(/** @lends Rectangle# */{
	/**
	 * Creates a Rectangle object.
	 *
	 * @name Rectangle#initialize
	 * @param {Point} point the top-left point of the rectangle
	 * @param {Size} size the size of the rectangle
	 */
	/**
	 * Creates a rectangle object.
	 *
	 * @name Rectangle#initialize
	 * @param {Number} x the left coordinate
	 * @param {Number} y the top coordinate
	 * @param {Number} width
	 * @param {Number} height
	 */
	/**
	 * Creates a rectangle object from the passed points. These do not
	 * necessarily need to be the top left and bottom right corners, the
	 * constructor figures out how to fit a rectangle between them.
	 *
	 * @name Rectangle#initialize
	 * @param {Point} point1 The first point defining the rectangle
	 * @param {Point} point2 The second point defining the rectangle
	 */
	/**
	 * Creates a new rectangle object from the passed rectangle object.
	 *
	 * @name Rectangle#initialize
	 * @param {Rectangle} rt
	 */
	initialize: function(arg0, arg1, arg2, arg3) {
		if (arguments.length == 4) {
			// new Rectangle(x, y, width, height)
			this.x = arg0;
			this.y = arg1;
			this.width = arg2;
			this.height = arg3;
		} else if (arguments.length == 2) {
			if (arg1 && arg1.x !== undefined) {
				// new Rectangle(point1, point2)
				var point1 = Point.read(arguments, 0, 1);
				var point2 = Point.read(arguments, 1, 1);
				this.x = point1.x;
				this.y = point1.y;
				this.width = point2.x - point1.x;
				this.height = point2.y - point1.y;
				if (this.width < 0) {
					this.x = point2.x;
					this.width = -this.width;
				}
				if (this.height < 0) {
					this.y = point2.y;
					this.height = -this.height;
				}
			} else {
				// new Rectangle(point, size)
				var point = Point.read(arguments, 0, 1);
				var size = Size.read(arguments, 1, 1);
				this.x = point.x;
				this.y = point.y;
				this.width = size.width;
				this.height = size.height;
			}
		} else if (arg0) {
			// Use 0 as defaults, in case we're reading from a Point or Size
			this.x = arg0.x || 0;
			this.y = arg0.y || 0;
			this.width = arg0.width || 0;
			this.height = arg0.height || 0;
		} else {
			// new Rectangle()
			this.x = this.y = this.width = this.height = 0;
		}
	},

	/**
	 * The x position of the rectangle.
	 *
	 * @name Rectangle#x
	 * @type Number
	 */

	/**
	 * The y position of the rectangle.
	 *
	 * @name Rectangle#y
	 * @type Number
	 */

	/**
	 * The width of the rectangle.
	 *
	 * @name Rectangle#width
	 * @type Number
	 */

	/**
	 * The height of the rectangle.
	 *
	 * @name Rectangle#height
	 * @type Number
	 */

	// DOCS: why does jsdocs document this function, when there are no comments?
	/**
	 * @ignore
	 */
	set: function(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		return this;
	},

	/**
	 * The top-left point of the rectangle
	 *
	 * @type Point
	 * @bean
	 */
	getPoint: function() {
		return LinkedPoint.create(this, 'setPoint', this.x, this.y);
	},

	setPoint: function(point) {
		point = Point.read(arguments);
		this.x = point.x;
		this.y = point.y;
		return this;
	},

	/**
	 * The size of the rectangle
	 *
	 * @type Size
	 * @bean
	 */
	getSize: function() {
		return LinkedSize.create(this, 'setSize', this.width, this.height);
	},

	setSize: function(size) {
		size = Size.read(arguments);
		this.width = size.width;
		this.height = size.height;
		return this;
	},

	/**
	 * {@grouptitle Side Positions}
	 *
	 * The position of the left hand side of the rectangle. Note that this
	 * doesn't move the whole rectangle; the right hand side stays where it was.
	 *
	 * @type Number
	 * @bean
	 */
	getLeft: function() {
		return this.x;
	},

	setLeft: function(left) {
		this.width -= left - this.x;
		this.x = left;
		return this;
	},

	/**
	 * The top coordinate of the rectangle. Note that this doesn't move the
	 * whole rectangle: the bottom won't move.
	 *
	 * @type Number
	 * @bean
	 */
	getTop: function() {
		return this.y;
	},

	setTop: function(top) {
		this.height -= top - this.y;
		this.y = top;
		return this;
	},

	/**
	 * The position of the right hand side of the rectangle. Note that this
	 * doesn't move the whole rectangle; the left hand side stays where it was.
	 *
	 * @type Number
	 * @bean
	 */
	getRight: function() {
		return this.x + this.width;
	},

	setRight: function(right) {
		this.width = right - this.x;
		return this;
	},

	/**
	 * The bottom coordinate of the rectangle. Note that this doesn't move the
	 * whole rectangle: the top won't move.
	 *
	 * @type Number
	 * @bean
	 */
	getBottom: function() {
		return this.y + this.height;
	},

	setBottom: function(bottom) {
		this.height = bottom - this.y;
		return this;
	},

	/**
	 * The center-x coordinate of the rectangle.
	 *
	 * @type Number
	 * @bean
	 * @ignore
	 */
	getCenterX: function() {
		return this.x + this.width * 0.5;
	},

	setCenterX: function(x) {
		this.x = x - this.width * 0.5;
		return this;
	},

	/**
	 * The center-y coordinate of the rectangle.
	 *
	 * @type Number
	 * @bean
	 * @ignore
	 */
	getCenterY: function() {
		return this.y + this.height * 0.5;
	},

	setCenterY: function(y) {
		this.y = y - this.height * 0.5;
		return this;
	},

	/**
	 * {@grouptitle Corner and Center Point Positions}
	 *
	 * The center point of the rectangle.
	 *
	 * @type Point
	 * @bean
	 */
	getCenter: function() {
		return LinkedPoint.create(this, 'setCenter',
				this.getCenterX(), this.getCenterY());
	},

	setCenter: function(point) {
		point = Point.read(arguments);
		return this.setCenterX(point.x).setCenterY(point.y);
	},

	/**
	 * The top-left point of the rectangle.
	 *
	 * @name Rectangle#topLeft
	 * @type Point
	 */

	/**
	 * The top-right point of the rectangle.
	 *
	 * @name Rectangle#topRight
	 * @type Point
	 */

	/**
	 * The bottom-left point of the rectangle.
	 *
	 * @name Rectangle#bottomLeft
	 * @type Point
	 */

	/**
	 * The bottom-right point of the rectangle.
	 *
	 * @name Rectangle#bottomRight
	 * @type Point
	 */

	/**
	 * The left-center point of the rectangle.
	 *
	 * @name Rectangle#leftCenter
	 * @type Point
	 */

	/**
	 * The top-center point of the rectangle.
	 *
	 * @name Rectangle#topCenter
	 * @type Point
	 */

	/**
	 * The right-center point of the rectangle.
	 *
	 * @name Rectangle#rightCenter
	 * @type Point
	 */

	/**
	 * The bottom-center point of the rectangle.
	 *
	 * @name Rectangle#bottomCenter
	 * @type Point
	 */

	/**
	 * Checks whether the coordinates and size of the rectangle are equal to
	 * that of the supplied rectangle.
	 *
	 * @param {Rectangle} rect
	 * @return {Boolean} {@true if the rectangles are equal}
	 */
	equals: function(rect) {
		rect = Rectangle.read(arguments);
		return this.x == rect.x && this.y == rect.y
				&& this.width == rect.width && this.height == rect.height;
	},

	/**
	 * @return {Boolean} {@true the rectangle is empty}
	 */
	isEmpty: function() {
		return this.width == 0 || this.height == 0;
	},

	/**
	 * @return {String} A string representation of this rectangle.
	 */
	toString: function() {
		var format = Base.formatNumber;
		return '{ x: ' + format(this.x)
				+ ', y: ' + format(this.y)
				+ ', width: ' + format(this.width)
				+ ', height: ' + format(this.height)
				+ ' }';
	},

	/**
	 * {@grouptitle Geometric Tests}
	 *
	 * Tests if the specified point is inside the boundary of the rectangle.
	 *
	 * @name Rectangle#contains
	 * @function
	 * @param {Point} point the specified point
	 * @return {Boolean} {@true if the point is inside the rectangle's boundary}
	 *
	 * @example {@paperscript}
	 * // Checking whether the mouse position falls within the bounding
	 * // rectangle of an item:
	 *
	 * // Create a circle shaped path at {x: 80, y: 50}
	 * // with a radius of 30.
	 * var circle = new Path.Circle(new Point(80, 50), 30);
	 * circle.fillColor = 'red';
	 *
	 * function onMouseMove(event) {
	 * 	// Check whether the mouse position intersects with the
	 * 	// bounding box of the item:
	 * 	if (circle.bounds.contains(event.point)) {
	 * 		// If it intersects, fill it with green:
	 * 		circle.fillColor = 'green';
	 * 	} else {
	 * 		// If it doesn't intersect, fill it with red:
	 * 		circle.fillColor = 'red';
	 * 	}
	 * }
	 */
	/**
	 * Tests if the interior of the rectangle entirely contains the specified
	 * rectangle.
	 *
	 * @name Rectangle#contains
	 * @function
	 * @param {Rectangle} rect The specified rectangle
	 * @return {Boolean} {@true if the rectangle entirely contains the specified
	 *                   rectangle}
	 *
	 * @example {@paperscript}
	 * // Checking whether the bounding box of one item is contained within
	 * // that of another item:
	 *
	 * // All newly created paths will inherit these styles:
	 * project.currentStyle = {
	 * 	fillColor: 'green',
	 * 	strokeColor: 'black'
	 * };
	 *
	 * // Create a circle shaped path at {x: 80, y: 50}
	 * // with a radius of 45.
	 * var largeCircle = new Path.Circle(new Point(80, 50), 45);
	 *
	 * // Create a smaller circle shaped path in the same position
	 * // with a radius of 30.
	 * var circle = new Path.Circle(new Point(80, 50), 30);
	 *
	 * function onMouseMove(event) {
	 * 	// Move the circle to the position of the mouse:
	 * 	circle.position = event.point;
	 *
	 * 	// Check whether the bounding box of the smaller circle
	 * 	// is contained within the bounding box of the larger item:
	 * 	if (largeCircle.bounds.contains(circle.bounds)) {
	 * 		// If it does, fill it with green:
	 * 		circle.fillColor = 'green';
	 * 		largeCircle.fillColor = 'green';
	 * 	} else {
	 * 		// If doesn't, fill it with red:
	 * 		circle.fillColor = 'red';
	 * 		largeCircle.fillColor = 'red';
	 * 	}
	 * }
	 */
	contains: function(rect) {
		if (rect.width !== undefined) {
			return rect.x >= this.x && rect.y >= this.y
					&& rect.x + rect.width <= this.x + this.width
					&& rect.y + rect.height <= this.y + this.height;
		} else {
			var point = Point.read(arguments);
			return point.x >= this.x && point.y >= this.y
					&& point.x <= this.x + this.width
					&& point.y <= this.y + this.height;
		}
	},

	/**
	 * Tests if the interior of this rectangle intersects the interior of
	 * another rectangle.
	 *
	 * @param {Rectangle} rect the specified rectangle
	 * @return {Boolean} {@true if the rectangle and the specified rectangle
	 *                   intersect each other}
	 *
	 * @example {@paperscript}
	 * // Checking whether the bounding box of one item intersects with
	 * // that of another item:
	 *
	 * // All newly created paths will inherit these styles:
	 * project.currentStyle = {
	 * 	fillColor: 'green',
	 * 	strokeColor: 'black'
	 * };
	 *
	 * // Create a circle shaped path at {x: 80, y: 50}
	 * // with a radius of 45.
	 * var largeCircle = new Path.Circle(new Point(80, 50), 45);
	 *
	 * // Create a smaller circle shaped path in the same position
	 * // with a radius of 30.
	 * var circle = new Path.Circle(new Point(80, 50), 30);
	 *
	 * function onMouseMove(event) {
	 * 	// Move the circle to the position of the mouse:
	 * 	circle.position = event.point;
	 *
	 * 	// Check whether the bounding box of the two circle
	 * 	// shaped paths intersect:
	 * 	if (largeCircle.bounds.intersects(circle.bounds)) {
	 * 		// If it does, fill it with green:
	 * 		circle.fillColor = 'green';
	 * 		largeCircle.fillColor = 'green';
	 * 	} else {
	 * 		// If doesn't, fill it with red:
	 * 		circle.fillColor = 'red';
	 * 		largeCircle.fillColor = 'red';
	 * 	}
	 * }
	 */
	intersects: function(rect) {
		rect = Rectangle.read(arguments);
		return rect.x + rect.width > this.x
				&& rect.y + rect.height > this.y
				&& rect.x < this.x + this.width
				&& rect.y < this.y + this.height;
	},

	/**
	 * {@grouptitle Boolean Operations}
	 *
	 * Returns a new rectangle representing the intersection of this rectangle
	 * with the specified rectangle.
	 *
	 * @param {Rectangle} rect The rectangle to be intersected with this
	 *                         rectangle
	 * @return {Rectangle} The largest rectangle contained in both the specified
	 *                     rectangle and in this rectangle.
	 *
	 * @example {@paperscript}
	 * // Intersecting two rectangles and visualizing the result using rectangle
	 * // shaped paths:
	 *
	 * // Create two rectangles that overlap each other
	 * var size = new Size(50, 50);
	 * var rectangle1 = new Rectangle(new Point(25, 15), size);
	 * var rectangle2 = new Rectangle(new Point(50, 40), size);
	 *
	 * // The rectangle that represents the intersection of the
	 * // two rectangles:
	 * var intersected = rectangle1.intersect(rectangle2);
	 *
	 * // To visualize the intersecting of the rectangles, we will
	 * // create rectangle shaped paths using the Path.Rectangle
	 * // constructor.
	 *
	 * // Have all newly created paths inherit a black stroke:
	 * project.currentStyle.strokeColor = 'black';
	 *
	 * // Create two rectangle shaped paths using the abstract rectangles
	 * // we created before:
	 * new Path.Rectangle(rectangle1);
	 * new Path.Rectangle(rectangle2);
	 *
	 * // Create a path that represents the intersected rectangle,
	 * // and fill it with red:
	 * var intersectionPath = new Path.Rectangle(intersected);
	 * intersectionPath.fillColor = 'red';
	 */
	intersect: function(rect) {
		rect = Rectangle.read(arguments);
		var x1 = Math.max(this.x, rect.x),
			y1 = Math.max(this.y, rect.y),
			x2 = Math.min(this.x + this.width, rect.x + rect.width),
			y2 = Math.min(this.y + this.height, rect.y + rect.height);
		return Rectangle.create(x1, y1, x2 - x1, y2 - y1);
	},

	/**
	 * Returns a new rectangle representing the union of this rectangle with the
	 * specified rectangle.
	 *
	 * @param {Rectangle} rect the rectangle to be combined with this rectangle
	 * @return {Rectangle} the smallest rectangle containing both the specified
	 *                     rectangle and this rectangle.
	 */
	unite: function(rect) {
		rect = Rectangle.read(arguments);
		var x1 = Math.min(this.x, rect.x),
			y1 = Math.min(this.y, rect.y),
			x2 = Math.max(this.x + this.width, rect.x + rect.width),
			y2 = Math.max(this.y + this.height, rect.y + rect.height);
		return Rectangle.create(x1, y1, x2 - x1, y2 - y1);
	},

	/**
	 * Adds a point to this rectangle. The resulting rectangle is the
	 * smallest rectangle that contains both the original rectangle and the
	 * specified point.
	 *
	 * After adding a point, a call to {@link #contains(point)} with the added
	 * point as an argument does not necessarily return {@code true}.
	 * The {@link Rectangle#contains(point)} method does not return {@code true}
	 * for points on the right or bottom edges of a rectangle. Therefore, if the
	 * added point falls on the left or bottom edge of the enlarged rectangle,
	 * {@link Rectangle#contains(point)} returns {@code false} for that point.
	 *
	 * @param {Point} point
	 */
	include: function(point) {
		point = Point.read(arguments);
		var x1 = Math.min(this.x, point.x),
			y1 = Math.min(this.y, point.y),
			x2 = Math.max(this.x + this.width, point.x),
			y2 = Math.max(this.y + this.height, point.y);
		return Rectangle.create(x1, y1, x2 - x1, y2 - y1);
	},

	statics: {
		// See Point.create()
		create: function(x, y, width, height) {
			return new Rectangle(Rectangle.dont).set(x, y, width, height);
		}
	}
}, new function() {
	return Base.each([
			['Top', 'Left'], ['Top', 'Right'],
			['Bottom', 'Left'], ['Bottom', 'Right'],
			['Left', 'Center'], ['Top', 'Center'],
			['Right', 'Center'], ['Bottom', 'Center']
		],
		function(parts, index) {
			var part = parts.join('');
			// find out if the first of the pair is an x or y property,
			// by checking the first character for [R]ight or [L]eft;
			var xFirst = /^[RL]/.test(part);
			// Rename Center to CenterX or CenterY:
			if (index >= 4)
				parts[1] += xFirst ? 'Y' : 'X';
			var x = parts[xFirst ? 0 : 1],
				y = parts[xFirst ? 1 : 0],
				getX = 'get' + x,
				getY = 'get' + y,
				setX = 'set' + x,
				setY = 'set' + y,
				get = 'get' + part,
				set = 'set' + part;
			this[get] = function() {
				return LinkedPoint.create(this, set,
						this[getX](), this[getY]());
			};
			this[set] = function(point) {
				point = Point.read(arguments);
				// Note: call chaining happens here.
				return this[setX](point.x)[setY](point.y);
			};
		}, {});
});

/**
 * @name LinkedRectangle
 *
 * @class An internal version of Rectangle that notifies its owner of each
 * change through setting itself again on the setter that corresponds to the
 * getter that produced this LinkedRectangle.
 * See uses of LinkedRectangle.create()
 * Note: This prototype is not exported.
 *
 * @private
 */
var LinkedRectangle = Rectangle.extend({
	set: function(x, y, width, height, dontNotify) {
		this._x = x;
		this._y = y;
		this._width = width;
		this._height = height;
		if (!dontNotify)
			this._owner[this._setter](this);
		return this;
	},

	statics: {
		/**
		 * Provide a faster creator for Points out of two coordinates that
		 * does not rely on Point#initialize at all. This speeds up all math
		 * operations a lot.
		 *
		 * @ignore
		 */
		create: function(owner, setter, x, y, width, height) {
			var rect = new LinkedRectangle(LinkedRectangle.dont).set(
					x, y, width, height, true);
			rect._owner = owner;
			rect._setter = setter;
			return rect;
		}
	}
}, new function() {
	var proto = Rectangle.prototype;

	return Base.each(['x', 'y', 'width', 'height'], function(key) {
		var part = Base.capitalize(key);
		var internal = '_' + key;
		this['get' + part] = function() {
			return this[internal];
		};

		this['set' + part] = function(value) {
			this[internal] = value;
			// Check if this setter is called from another one which sets
			// _dontNotify, as it will notify itself
			if (!this._dontNotify)
				this._owner[this._setter](this);
		};
	}, Base.each(['Point', 'Size', 'Center',
			'Left', 'Top', 'Right', 'Bottom', 'CenterX', 'CenterY',
			'TopLeft', 'TopRight', 'BottomLeft', 'BottomRight',
			'LeftCenter', 'TopCenter', 'RightCenter', 'BottomCenter'],
		function(key) {
			var name = 'set' + key;
			this[name] = function(value) {
				// Make sure the above setters of x, y, width, height do not
				// each notify the owner, as we're going to take care of this
				// afterwards here, only once per change.
				this._dontNotify = true;
				proto[name].apply(this, arguments);
				delete this._dontNotify;
				this._owner[this._setter](this);
				return this;
			};
		}, {})
	);
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

// Based on goog.graphics.AffineTransform, as part of the Closure Library.
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");

/**
 * @name Matrix
 *
 * @class An affine transform performs a linear mapping from 2D coordinates
 * to other 2D coordinates that preserves the "straightness" and
 * "parallelness" of lines.
 *
 * Such a coordinate transformation can be represented by a 3 row by 3
 * column matrix with an implied last row of [ 0 0 1 ]. This matrix
 * transforms source coordinates (x,y) into destination coordinates (x',y')
 * by considering them to be a column vector and multiplying the coordinate
 * vector by the matrix according to the following process:
 * <pre>
 *      [ x']   [  m00  m01  m02  ] [ x ]   [ m00x + m01y + m02 ]
 *      [ y'] = [  m10  m11  m12  ] [ y ] = [ m10x + m11y + m12 ]
 *      [ 1 ]   [   0    0    1   ] [ 1 ]   [         1         ]
 * </pre>
 *
 * This class is optimized for speed and minimizes calculations based on its
 * knowledge of the underlying matrix (as opposed to say simply performing
 * matrix multiplication).
 */
var Matrix = this.Matrix = Base.extend(/** @lends Matrix# */{
	/**
	 * Creates a 2D affine transform.
	 *
	 * @param {Number} m00 The m00 coordinate of the transform.
	 * @param {Number} m10 The m10 coordinate of the transform.
	 * @param {Number} m01 The m01 coordinate of the transform.
	 * @param {Number} m11 The m11 coordinate of the transform.
	 * @param {Number} m02 The m02 coordinate of the transform.
	 * @param {Number} m12 The m12 coordinate of the transform.
	 */
	initialize: function(m00, m10, m01, m11, m02, m12) {
		var ok = true;
		if (arguments.length == 6) {
			this.set(m00, m10, m01, m11, m02, m12);
		} else if (arguments.length == 1) {
			if (m00 instanceof Matrix) {
				this.set(m00._m00, m00._m10, m00._m01,
						m00._m11, m00._m02, m00._m12);
			} else if (Array.isArray(m00)) {
				this.set.apply(this, m00);
			} else {
				ok = false;
			}
		} else if (arguments.length > 0) {
			ok = false;
		} else {
			this._m00 = this._m11 = 1;
			this._m10 = this._m01 = this._m02 = this._m12 = 0;
		}
		if (!ok)
			throw new Error('Unsupported matrix parameters');
	},

	/**
	 * @return {Matrix} A copy of this transform.
	 */
	clone: function() {
		return Matrix.create(this._m00, this._m10, this._m01,
				this._m11, this._m02, this._m12);
	},

	/**
	 * Sets this transform to the matrix specified by the 6 values.
	 *
	 * @param {Number} m00 The m00 coordinate of the transform.
	 * @param {Number} m10 The m10 coordinate of the transform.
	 * @param {Number} m01 The m01 coordinate of the transform.
	 * @param {Number} m11 The m11 coordinate of the transform.
	 * @param {Number} m02 The m02 coordinate of the transform.
	 * @param {Number} m12 The m12 coordinate of the transform.
	 * @return {Matrix} This affine transform.
	 */
	set: function(m00, m10, m01, m11, m02, m12) {
		this._m00 = m00;
		this._m10 = m10;
		this._m01 = m01;
		this._m11 = m11;
		this._m02 = m02;
		this._m12 = m12;
		return this;
	},

	/**
	 * Concatentates this transform with a scaling transformation.
	 *
	 * @name Matrix#scale
	 * @function
	 * @param {Number} scale The scaling factor.
	 * @param {Point} [center] The center for the scaling
	 * transformation.
	 * @return {Matrix} This affine transform.
	 */
	/**
	 * Concatentates this transform with a scaling transformation.
	 *
	 * @name Matrix#scale
	 * @function
	 * @param {Number} hor The horizontal scaling factor.
	 * @param {Number} ver The vertical scaling factor.
	 * @param {Point} [center] The center for the scaling
	 * transformation.
	 * @return {Matrix} This affine transform.
	 */
	scale: function(hor, ver /* | scale */, center) {
		if (arguments.length < 2 || typeof ver === 'object') {
			// hor is the single scale parameter, representing both hor and ver
			// Read center first from argument 1, then set ver = hor (thus
			// modifing the content of argument 1!)
			center = Point.read(arguments, 1);
			ver = hor;
		} else {
			center = Point.read(arguments, 2);
		}
		if (center)
			this.translate(center);
		this._m00 *= hor;
		this._m10 *= hor;
		this._m01 *= ver;
		this._m11 *= ver;
		if (center)
			this.translate(center.negate());
		return this;
	},

	/**
	 * Concatentates this transform with a translate transformation.
	 *
	 * @name Matrix#translate
	 * @function
	 * @param {Point} point The vector to translate by.
	 * @return {Matrix} This affine transform.
	 */
	/**
	 * Concatentates this transform with a translate transformation.
	 *
	 * @name Matrix#translate
	 * @function
	 * @param {Number} dx The distance to translate in the x direction.
	 * @param {Number} dy The distance to translate in the y direction.
	 * @return {Matrix} This affine transform.
	 */
	translate: function(point) {
		point = Point.read(arguments);
		var x = point.x, y = point.y;
		this._m02 += x * this._m00 + y * this._m01;
		this._m12 += x * this._m10 + y * this._m11;
		return this;
	},

	/**
	 * Concatentates this transform with a rotation transformation around an
	 * anchor point.
	 *
	 * @name Matrix#rotate
	 * @function
	 * @param {Number} angle The angle of rotation measured in degrees.
	 * @param {Point} center The anchor point to rotate around.
	 * @return {Matrix} This affine transform.
	 */
	/**
	 * Concatentates this transform with a rotation transformation around an
	 * anchor point.
	 *
	 * @name Matrix#rotate
	 * @function
	 * @param {Number} angle The angle of rotation measured in degrees.
	 * @param {Number} x The x coordinate of the anchor point.
	 * @param {Number} y The y coordinate of the anchor point.
	 * @return {Matrix} This affine transform.
	 */
	rotate: function(angle, center) {
		return this.concatenate(
				Matrix.getRotateInstance.apply(Matrix, arguments));
	},

	/**
	 * Concatentates this transform with a shear transformation.
	 *
	 * @name Matrix#shear
	 * @function
	 * @param {Point} point The shear factor in x and y direction.
	 * @param {Point} [center] The center for the shear transformation.
	 * @return {Matrix} This affine transform.
	 */
	/**
	 * Concatentates this transform with a shear transformation.
	 *
	 * @name Matrix#shear
	 * @function
	 * @param {Number} hor The horizontal shear factor.
	 * @param {Number} ver The vertical shear factor.
	 * @param {Point} [center] The center for the shear transformation.
	 * @return {Matrix} This affine transform.
	 */
	shear: function(hor, ver, center) {
		// See #scale() for explanation of this:
		if (arguments.length < 2 || typeof ver === 'object') {
			center = Point.read(arguments, 1);
			ver = hor;
		} else {
			center = Point.read(arguments, 2);
		}
		if (center)
			this.translate(center);
		var m00 = this._m00;
		var m10 = this._m10;
		this._m00 += ver * this._m01;
		this._m10 += ver * this._m11;
		this._m01 += hor * m00;
		this._m11 += hor * m10;
		if (center)
			this.translate(center.negate());
		return this;
	},

	/**
	 * @return {String} A string representation of this transform.
	 */
	toString: function() {
		var format = Base.formatNumber;
		return '[[' + [format(this._m00), format(this._m01),
					format(this._m02)].join(', ') + '], ['
				+ [format(this._m10), format(this._m11),
					format(this._m12)].join(', ') + ']]';
	},

	/**
	 * @return {Number} The scaling factor in the x-direction (m00).
	 */
	// scaleX

	/**
	 * @return {Number} The scaling factor in the y-direction (m11).
	 */
	// scaleY

	/**
	 * @return {Number} The translation in the x-direction (m02).
	 */
	// translateX

	/**
	 * @return {Number} The translation in the y-direction (m12).
	 */
	// translateY

	/**
	 * @return {Number} The shear factor in the x-direction (m01).
	 */
	// shearX

	/**
	 * @return {Number} The shear factor in the y-direction (m10).
	 */
	// shearY

	/**
	 * Concatenates an affine transform to this transform.
	 *
	 * @param {Matrix} mx The transform to concatenate.
	 * @return {Matrix} This affine transform.
	 */
	concatenate: function(mx) {
		var m0 = this._m00,
			m1 = this._m01;
		this._m00 = mx._m00 * m0 + mx._m10 * m1;
		this._m01 = mx._m01 * m0 + mx._m11 * m1;
		this._m02 += mx._m02 * m0 + mx._m12 * m1;

		m0 = this._m10;
		m1 = this._m11;
		this._m10 = mx._m00 * m0 + mx._m10 * m1;
		this._m11 = mx._m01 * m0 + mx._m11 * m1;
		this._m12 += mx._m02 * m0 + mx._m12 * m1;
		return this;
	},

	/**
	 * Pre-concatenates an affine transform to this transform.
	 *
	 * @param {Matrix} mx The transform to preconcatenate.
	 * @return {Matrix} This affine transform.
	 */
	preConcatenate: function(mx) {
		var m0 = this._m00,
			m1 = this._m10;
		this._m00 = mx._m00 * m0 + mx._m01 * m1;
		this._m10 = mx._m10 * m0 + mx._m11 * m1;

		m0 = this._m01;
		m1 = this._m11;
		this._m01 = mx._m00 * m0 + mx._m01 * m1;
		this._m11 = mx._m10 * m0 + mx._m11 * m1;

		m0 = this._m02;
		m1 = this._m12;
		this._m02 = mx._m00 * m0 + mx._m01 * m1 + mx._m02;
		this._m12 = mx._m10 * m0 + mx._m11 * m1 + mx._m12;
		return this;
	},

	/**
	 * Transforms a point or an array of coordinates by this matrix and returns
	 * the result. If an array is transformed, the the result is stored into a
	 * destination array.
	 *
	 * @param {Point} point The point to be transformed.
	 *
	 * @param {Number[]} src The array containing the source points
	 *        as x, y value pairs.
	 * @param {Number} srcOff The offset to the first point to be transformed.
	 * @param {Number[]} dst The array into which to store the transformed
	 *        point pairs.
	 * @param {Number} dstOff The offset of the location of the first
	 *        transformed point in the destination array.
	 * @param {Number} numPts The number of points to tranform.
	 */
	transform: function(/* point | */ src, srcOff, dst, dstOff, numPts) {
		return arguments.length < 5
			// TODO: Check for rectangle and use _tranformBounds?
			? this._transformPoint(Point.read(arguments))
			: this._transformCoordinates(src, srcOff, dst, dstOff, numPts);
	},

	/**
	 * A faster version of transform that only takes one point and does not
	 * attempt to convert it.
	 */
	_transformPoint: function(point, dest, dontNotify) {
		var x = point.x,
			y = point.y;
		if (!dest)
			dest = new Point(Point.dont);
		return dest.set(
			x * this._m00 + y * this._m01 + this._m02,
			x * this._m10 + y * this._m11 + this._m12,
			dontNotify
		);
	},

	_transformCoordinates: function(src, srcOff, dst, dstOff, numPts) {
		var i = srcOff, j = dstOff,
			srcEnd = srcOff + 2 * numPts;
		while (i < srcEnd) {
			var x = src[i++];
			var y = src[i++];
			dst[j++] = x * this._m00 + y * this._m01 + this._m02;
			dst[j++] = x * this._m10 + y * this._m11 + this._m12;
		}
		return dst;
	},

	_transformCorners: function(rect) {
		var x1 = rect.x,
			y1 = rect.y,
			x2 = x1 + rect.width,
			y2 = y1 + rect.height,
			coords = [ x1, y1, x2, y1, x2, y2, x1, y2 ];
		return this._transformCoordinates(coords, 0, coords, 0, 4);
	},

	/**
	 * Returns the 'transformed' bounds rectangle by transforming each corner
	 * point and finding the new bounding box to these points. This is not
	 * really the transformed reactangle!
	 */
	_transformBounds: function(bounds) {
		var coords = this._transformCorners(bounds),
			min = coords.slice(0, 2),
			max = coords.slice(0);
		for (var i = 2; i < 8; i++) {
			var val = coords[i],
				j = i & 1;
			if (val < min[j])
				min[j] = val;
			else if (val > max[j])
				max[j] = val;
		}
		return Rectangle.create(min[0], min[1],
				max[0] - min[0], max[1] - min[1]);
	},

	/**
	 * @return {Number} The determinant of this transform.
	 */
	getDeterminant: function() {
		return this._m00 * this._m11 - this._m01 * this._m10;
	},

	getTranslation: function() {
		return new Point(this._m02, this._m12);
	},

	getScaling: function() {
		var hor = Math.sqrt(this._m00 * this._m00 + this._m10 * this._m10),
			ver = Math.sqrt(this._m01 * this._m01 + this._m11 * this._m11);
		return new Point(this._m00 < 0 ? -hor : hor, this._m01 < 0 ? -ver : ver);
	},

	/**
	 * @return {Number} The rotation angle of the matrix. If a non-uniform
	 * rotation is applied as a result of a shear() or scale() command,
	 * undefined is returned, as the resulting transformation cannot be
	 * expressed in one rotation angle.
	 */
	getRotation: function() {
		var angle1 = -Math.atan2(this._m01, this._m11),
			angle2 = Math.atan2(this._m10, this._m00);
		return Math.abs(angle1 - angle2) < Numerical.TOLERANCE
				? angle1 * 180 / Math.PI : undefined;
	},

	/**
	 * @return {Boolean} Whether this transform is the identity transform.
	 */
	isIdentity: function() {
		return this._m00 == 1 && this._m10 == 0 && this._m01 == 0 &&
				this._m11 == 1 && this._m02 == 0 && this._m12 == 0;
	},

	/**
	 * Returns whether the transform is invertible. A transform is not
	 * invertible if the determinant is 0 or any value is non-finite or NaN.
	 *
	 * @return {Boolean} Whether the transform is invertible.
	 */
	isInvertible: function() {
		var det = this.getDeterminant();
		return isFinite(det) && det != 0 && isFinite(this._m02)
				&& isFinite(this._m12);
	},

	/**
	 * Checks whether the matrix is singular or not. Singular matrices cannot be
	 * inverted.
	 *
	 * @return {Boolean} Whether the matrix is singular.
	 */
	isSingular: function() {
		return !this.isInvertible();
	},

	/**
	 * @return {Matrix} An Matrix object representing the inverse
	 *         transformation.
	 */
	createInverse: function() {
		var det = this.getDeterminant();
		if (isFinite(det) && det != 0 && isFinite(this._m02)
				&& isFinite(this._m12)) {
			return Matrix.create(
				this._m11 / det,
				-this._m10 / det,
				-this._m01 / det,
				this._m00 / det,
				(this._m01 * this._m12 - this._m11 * this._m02) / det,
				(this._m10 * this._m02 - this._m00 * this._m12) / det);
		}
		return null;
	},

	createShiftless: function() {
		return Matrix.create(this._m00, this._m10, this._m01, this._m11, 0, 0);
	},

	/**
	 * Sets this transform to a scaling transformation.
	 *
	 * @param {Number} hor The horizontal scaling factor.
	 * @param {Number} ver The vertical scaling factor.
	 * @return {Matrix} This affine transform.
	 */
	setToScale: function(hor, ver) {
		return this.set(hor, 0, 0, ver, 0, 0);
	},

	/**
	 * Sets this transform to a translation transformation.
	 *
	 * @param {Number} dx The distance to translate in the x direction.
	 * @param {Number} dy The distance to translate in the y direction.
	 * @return {Matrix} This affine transform.
	 */
	setToTranslation: function(delta) {
		delta = Point.read(arguments);
		return this.set(1, 0, 0, 1, delta.x, delta.y);
	},

	/**
	 * Sets this transform to a shearing transformation.
	 *
	 * @param {Number} hor The horizontal shear factor.
	 * @param {Number} ver The vertical shear factor.
	 * @return {Matrix} This affine transform.
	 */
	setToShear: function(hor, ver) {
		return this.set(1, ver, hor, 1, 0, 0);
	},

	/**
	 * Sets this transform to a rotation transformation.
	 *
	 * @param {Number} angle The angle of rotation measured in degrees.
	 * @param {Number} x The x coordinate of the anchor point.
	 * @param {Number} y The y coordinate of the anchor point.
	 * @return {Matrix} This affine transform.
	 */
	setToRotation: function(angle, center) {
		center = Point.read(arguments, 1);
		angle = angle * Math.PI / 180;
		var x = center.x,
			y = center.y,
			cos = Math.cos(angle),
			sin = Math.sin(angle);
		return this.set(cos, sin, -sin, cos,
				x - x * cos + y * sin,
				y - x * sin - y * cos);
	},

	/**
	 * Applies this matrix to the specified Canvas Context.
	 *
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {Boolean} [reset=false]
	 */
	applyToContext: function(ctx, reset) {
		ctx[reset ? 'setTransform' : 'transform'](
			this._m00, this._m10, this._m01,
			this._m11, this._m02, this._m12
		);
		return this;
	},

	statics: /** @lends Matrix */{
		// See Point.create()
		create: function(m00, m10, m01, m11, m02, m12) {
			return new Matrix(Matrix.dont).set(m00, m10, m01, m11, m02, m12);
		},

		/**
		 * Creates a transform representing a scaling transformation.
		 *
		 * @param {Number} hor The horizontal scaling factor.
		 * @param {Number} ver The vertical scaling factor.
		 * @return {Matrix} A transform representing a scaling
		 *         transformation.
		 */
		getScaleInstance: function(hor, ver) {
			var mx = new Matrix();
			return mx.setToScale.apply(mx, arguments);
		},

		/**
		 * Creates a transform representing a translation transformation.
		 *
		 * @param {Number} dx The distance to translate in the x direction.
		 * @param {Number} dy The distance to translate in the y direction.
		 * @return {Matrix} A transform representing a translation
		 *         transformation.
		 */
		getTranslateInstance: function(delta) {
			var mx = new Matrix();
			return mx.setToTranslation.apply(mx, arguments);
		},

		/**
		 * Creates a transform representing a shearing transformation.
		 *
		 * @param {Number} hor The horizontal shear factor.
		 * @param {Number} ver The vertical shear factor.
		 * @return {Matrix} A transform representing a shearing transformation.
		 */
		getShearInstance: function(hor, ver, center) {
			var mx = new Matrix();
			return mx.setToShear.apply(mx, arguments);
		},

		/**
		 * Creates a transform representing a rotation transformation.
		 *
		 * @param {Number} angle The angle of rotation measured in degrees.
		 * @param {Number} x The x coordinate of the anchor point.
		 * @param {Number} y The y coordinate of the anchor point.
		 * @return {Matrix} A transform representing a rotation transformation.
		 */
		getRotateInstance: function(angle, center) {
			var mx = new Matrix();
			return mx.setToRotation.apply(mx, arguments);
		}
	}
}, new function() {
	return Base.each({
		scaleX: '_m00',
		scaleY: '_m11',
		translateX: '_m02',
		translateY: '_m12',
		shearX: '_m01',
		shearY: '_m10'
	}, function(prop, name) {
		name = Base.capitalize(name);
		this['get' + name] = function() {
			return this[prop];
		};
		this['set' + name] = function(value) {
			this[prop] = value;
		};
	}, {});
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Line
 *
 * @class The Line object represents..
 */
var Line = this.Line = Base.extend(/** @lends Line# */{
	// DOCS: document Line class and constructor
	/**
	 * Creates a Line object.
	 *
	 * @param {Point} point1
	 * @param {Point} point2
	 * @param {Boolean} [infinite=true]
	 */
	initialize: function(point1, point2, infinite) {
		// Convention: With 3 parameters, both points are absolute, and infinite
		// controls wether the line extends beyond the defining points, meaning
		// intersection outside the line segment are allowed.
		// With two parameters, the 2nd parameter is a direction, and infinite
		// is automatially true, since we're describing an infinite line.
		point1 = Point.read(arguments, 0, 1);
		point2 = Point.read(arguments, 1, 1);
		if (arguments.length == 3) {
			this.point = point1;
			this.vector = point2.subtract(point1);
			this.infinite = infinite;
		} else {
			this.point = point1;
			this.vector = point2;
			this.infinite = true;
		}
	},

	/**
	 * The starting point of the line
	 *
	 * @name Line#point
	 * @type Point
	 */

	/**
	 * The vector of the line
	 *
	 * @name Line#vector
	 * @type Point
	 */

	/**
	 * Specifies whether the line extends infinitely
	 *
	 * @name Line#infinite
	 * @type Boolean
	 */

	/**
	 * @param {Line} line
	 * @return {Point} the intersection point of the lines
	 */
	intersect: function(line) {
		var cross = this.vector.cross(line.vector);
		if (Math.abs(cross) <= Numerical.TOLERANCE)
			return null;
		var v = line.point.subtract(this.point),
			t1 = v.cross(line.vector) / cross,
			t2 = v.cross(this.vector) / cross;
		// Check the ranges of t parameters if the line is not allowed to
		// extend beyond the definition points.
		return (this.infinite || 0 <= t1 && t1 <= 1)
				&& (line.infinite || 0 <= t2 && t2 <= 1)
			? this.point.add(this.vector.multiply(t1)) : null;
	},

	// DOCS: document Line#getSide(point)
	/**
	 * @param {Point} point
	 * @return {Number}
	 */
	getSide: function(point) {
		var v1 = this.vector,
			v2 = point.subtract(this.point),
			ccw = v2.cross(v1);
		if (ccw == 0) {
			ccw = v2.dot(v1);
			if (ccw > 0) {
				ccw = v2.subtract(v1).dot(v1);
				if (ccw < 0)
				    ccw = 0;
			}
		}
		return ccw < 0 ? -1 : ccw > 0 ? 1 : 0;
	},

	// DOCS: document Line#getDistance(point)
	/**
	 * @param {Point} point
	 * @return {Number}
	 */
	getDistance: function(point) {
		var m = this.vector.y / this.vector.x, // slope
			b = this.point.y - (m * this.point.x); // y offset
		// Distance to the linear equation
		var dist = Math.abs(point.y - (m * point.x) - b) / Math.sqrt(m * m + 1);
		return this.infinite ? dist : Math.min(dist,
				point.getDistance(this.point),
				point.getDistance(this.point.add(this.vector)));
	}
});

/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Project
 *
 * @class A Project object in Paper.js is what usually is refered to as the
 * document: The top level object that holds all the items contained in the
 * scene graph. As the term document is already taken in the browser context,
 * it is called Project.
 *
 * Projects allow the manipluation of the styles that are applied to all newly
 * created items, give access to the selected items, and will in future versions
 * offer ways to query for items in the scene graph defining specific
 * requirements, and means to persist and load from different formats, such as
 * SVG and PDF.
 *
 * The currently active project can be accessed through the global
 * {@see _global_#project} variable.
 *
 * An array of all open projects is accessible through the global
 * {@see _global_#projects} variable.
 */
var Project = this.Project = Base.extend(/** @lends Project# */{
	// TODO: Add arguments to define pages
	/**
	 * Creates a Paper.js project.
	 *
	 * When working with PaperScript, a project is automatically created for us
	 * and the global {@see _global_#project} variable points to it.
	 */
	initialize: function() {
		// Store reference to the currently active global paper scope:
		this._scope = paper;
		// Push it onto this._scope.projects and set index:
		this._index = this._scope.projects.push(this) - 1;
		this._currentStyle = new PathStyle();
		this._selectedItems = {};
		this._selectedItemCount = 0;
		// Activate straight away so paper.project is set, as required by
		// Layer and DoumentView constructors.
		this.activate();
		this.layers = [];
		this.symbols = [];
		this.activeLayer = new Layer();
	},

	_needsRedraw: function() {
		if (this._scope)
			this._scope._needsRedraw();
	},

	/**
	 * The currently active path style. All selected items and newly
	 * created items will be styled with this style.
	 *
	 * @type PathStyle
	 * @bean
	 *
	 * @example {@paperscript}
	 * project.currentStyle = {
	 * 	fillColor: 'red',
	 * 	strokeColor: 'black',
	 * 	strokeWidth: 5
	 * }
	 *
	 * // The following paths will take over all style properties of
	 * // the current style:
	 * var path = new Path.Circle(new Point(75, 50), 30);
	 * var path2 = new Path.Circle(new Point(175, 50), 20);
	 *
	 * @example {@paperscript}
	 * project.currentStyle.fillColor = 'red';
	 *
	 * // The following path will take over the fill color we just set:
	 * var path = new Path.Circle(new Point(75, 50), 30);
	 * var path2 = new Path.Circle(new Point(175, 50), 20);
	 */
	getCurrentStyle: function() {
		return this._currentStyle;
	},

	setCurrentStyle: function(style) {
		// TODO: Style selected items with the style:
		this._currentStyle.initialize(style);
	},

	/**
	 * Activates this project, so all newly created items will be placed
	 * in it.
	 */
	activate: function() {
		if (this._scope) {
			this._scope.project = this;
			return true;
		}
		return false;
	},

	/**
	 * Removes this project from the global {@see _global_#projects} list.
	 */
	remove: function() {
		if (this._scope) {
			Base.splice(this._scope.projects, null, this._index, 1);
			// Clear the active project reference if it was pointint to this.
			if (this._scope.project == this)
				this._scope.project = null;
			this._scope = null;
			return true;
		}
		return false;
	},

	/**
	 * The index of the project in the global projects array.
	 *
	 * @type Number
	 * @bean
	 */
	getIndex: function() {
		return this._index;
	},

	/**
	 * The selected items contained within the project.
	 *
	 * @type Item[]
	 * @bean
	 */
	getSelectedItems: function() {
		// TODO: Return groups if their children are all selected,
		// and filter out their children from the list.
		// TODO: The order of these items should be that of their
		// drawing order.
		var items = [];
		Base.each(this._selectedItems, function(item) {
			items.push(item);
		});
		return items;
	},

	// TODO: Implement setSelectedItems?

	_updateSelection: function(item) {
		if (item._selected) {
			this._selectedItemCount++;
			this._selectedItems[item.getId()] = item;
		} else {
			this._selectedItemCount--;
			delete this._selectedItems[item.getId()];
		}
	},

	/**
	 * Selects all items in the project.
	 */
	selectAll: function() {
		for (var i = 0, l = this.layers.length; i < l; i++)
			this.layers[i].setSelected(true);
	},

	/**
	 * Deselects all selected items in the project.
	 */
	deselectAll: function() {
		for (var i in this._selectedItems)
			this._selectedItems[i].setSelected(false);
	},

	/**
	 * {@grouptitle Project Hierarchy}
	 *
	 * The layers contained within the project.
	 *
	 * @name Project#layers
	 * @type Layer[]
	 */

	/**
	 * The layer which is currently active. New items will be created on this
	 * layer by default.
	 *
	 * @name Project#activeLayer
	 * @type Layer
	 */

	/**
	 * The symbols contained within the project.
	 *
	 * @name Project#symbols
	 * @type Symbol[]
	 */

	/**
	 * The views contained within the project.
	 *
	 * @name Project#views
	 * @type View[]
	 */

	/**
	 * The view which is currently active.
	 *
	 * @name Project#activeView
	 * @type View
	 */

	draw: function(ctx) {
		ctx.save();
		var param = { offset: new Point(0, 0) };
		for (var i = 0, l = this.layers.length; i < l; i++)
			Item.draw(this.layers[i], ctx, param);
		ctx.restore();

		// Draw the selection of the selected items in the project:
		if (this._selectedItemCount > 0) {
			ctx.save();
			ctx.strokeWidth = 1;
			// TODO: use Layer#color
			ctx.strokeStyle = ctx.fillStyle = '#009dec';
			param = { selection: true };
			Base.each(this._selectedItems, function(item) {
				item.draw(ctx, param);
			});
			ctx.restore();
		}
	}
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Symbol
 *
 * @class Symbols allow you to place multiple instances of an item in your
 * project. This can save memory, since all instances of a symbol simply refer
 * to the original item and it can speed up moving around complex objects, since
 * internal properties such as segment lists and gradient positions don't need
 * to be updated with every transformation.
 */
var Symbol = this.Symbol = Base.extend(/** @lends Symbol# */{
	/**
	 * Creates a Symbol item.
	 *
	 * @param {Item} item the source item which is copied as the definition of
	 *               the symbol
	 *
	 * @example {@paperscript split=true height=240}
	 * // Placing 100 instances of a symbol:
	 * var path = new Path.Star(new Point(0, 0), 6, 5, 13);
	 * path.style = {
	 *     fillColor: 'white',
	 *     strokeColor: 'black'
	 * };
     *
	 * // Create a symbol from the path:
	 * var symbol = new Symbol(path);
	 *
	 * // Remove the path:
	 * path.remove();
     *
	 * // Place 100 instances of the symbol:
	 * for (var i = 0; i < 100; i++) {
	 *     // Place an instance of the symbol in the project:
	 *     var instance = symbol.place();
     *
	 *     // Move the instance to a random position within the view:
	 *     instance.position = Point.random() * view.size;
     *
	 *     // Rotate the instance by a random amount between
	 *     // 0 and 360 degrees:
	 *     instance.rotate(Math.random() * 360);
     *
	 *     // Scale the instance between 0.25 and 1:
	 *     instance.scale(0.25 + Math.random() * 0.75);
	 * }
	 */
	initialize: function(item) {
		this.project = paper.project;
		this.project.symbols.push(this);
		this.setDefinition(item);
	},

	// TODO: Symbol#remove()
	// TODO: Symbol#name (accessible by name through project#symbols)

	/**
	 * The project that this symbol belongs to.
	 *
	 * @type Project
	 * @readonly
	 * @name Symbol#project
	 */

	/**
	 * The symbol definition.
	 *
	 * @type Item
	 * @bean
	 */
	getDefinition: function() {
		return this._definition;
	},

	setDefinition: function(item) {
		this._definition = item;
		// Remove item from DOM, as it's embedded in Symbol now.
		item.remove();
		// Move position to 0, 0. TODO: Why?
		item.setPosition(new Point());
	},

	/**
	 * Places in instance of the symbol in the project.
	 *
	 * @param [position] The position of the placed symbol.
	 * @return {PlacedSymbol}
	 */
	place: function(position) {
		return new PlacedSymbol(this, position);
	},

	/**
	 * Returns a copy of the symbol.
	 *
	 * @return {Symbol}
	 */
	clone: function() {
	 	return new Symbol(this._definition.clone());
	}
});

/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

var ChangeFlag = {
	// Anything affecting the appearance of an item, including GEOMETRY,
	// STROKE, STYLE and ATTRIBUTE (except for the invisible ones: locked, name)
	APPEARANCE: 1,
	// Change in item hierarchy
	HIERARCHY: 2,
	// Item geometry (path, bounds)
	GEOMETRY: 4,
	// Stroke geometry (excluding color)
	STROKE: 8,
	// Fill style or stroke color / dash
	STYLE: 16,
	// Item attributes: visible, blendMode, locked, name, opacity, clipMask ...
	ATTRIBUTE: 32,
	// Text content
	CONTENT: 64,
	// Raster pixels
	PIXELS: 128,
	// Clipping in one of the child items
	CLIPPING: 256
};

// Shortcuts to often used ChangeFlag values including APPEARANCE
var Change = {
	HIERARCHY: ChangeFlag.HIERARCHY | ChangeFlag.APPEARANCE,
	GEOMETRY: ChangeFlag.GEOMETRY | ChangeFlag.APPEARANCE,
	STROKE: ChangeFlag.STROKE | ChangeFlag.STYLE | ChangeFlag.APPEARANCE,
	STYLE: ChangeFlag.STYLE | ChangeFlag.APPEARANCE,
	ATTRIBUTE: ChangeFlag.ATTRIBUTE | ChangeFlag.APPEARANCE,
	CONTENT: ChangeFlag.CONTENT | ChangeFlag.APPEARANCE,
	PIXELS: ChangeFlag.PIXELS | ChangeFlag.APPEARANCE
};
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Item
 *
 * @class The Item type allows you to access and modify the items in
 * Paper.js projects. Its functionality is inherited by different project
 * item types such as {@link Path}, {@link CompoundPath}, {@link Group},
 * {@link Layer} and {@link Raster}. They each add a layer of functionality that
 * is unique to their type, but share the underlying properties and functions
 * that they inherit from Item.
 */
var Item = this.Item = Base.extend(/** @lends Item# */{
	initialize: function() {
		// If _project is already set, the item was already moved into the DOM
		// hierarchy. Used by Layer, where it's added to project.layers instead
		if (!this._project)
			paper.project.activeLayer.addChild(this);
		this._style = PathStyle.create(this);
		this.setStyle(this._project.getCurrentStyle());
	},

	/**
	 * Private notifier that is called whenever a change occurs in this item or
	 * its sub-elements, such as Segments, Curves, PathStyles, etc.
	 *
	 * @param {ChangeFlag} flags describes what exactly has changed.
	 */
	_changed: function(flags) {
		if (flags & ChangeFlag.GEOMETRY) {
			// Clear cached bounds and position whenever geometry changes
			delete this._bounds;
			delete this._position;
		}
		if (flags & ChangeFlag.APPEARANCE) {
			if (this._project)
				this._project._needsRedraw();
		}
	},

	/**
	 * The unique id of the item.
	 *
	 * @type Number
	 * @bean
	 */
	getId: function() {
		if (this._id == null)
			this._id = Item._id = (Item._id || 0) + 1;
		return this._id;
	},

	/**
	 * The name of the item. If the item has a name, it can be accessed by name
	 * through its parent's children list.
	 *
	 * @type String
	 * @bean
	 *
	 * @example {@paperscript}
	 * var path = new Path.Circle(new Point(80, 50), 35);
	 * // Set the name of the path:
	 * path.name = 'example';
	 *
	 * // Create a group and add path to it as a child:
	 * var group = new Group();
	 * group.addChild(path);
	 *
	 * // The path can be accessed by name:
	 * group.children['example'].fillColor = 'red';
	 */
	getName: function() {
		return this._name;
	},

	setName: function(name) {
		// Note: Don't check if the name has changed and bail out if it has not,
		// because setName is used internally also to update internal structures
		// when an item is moved from one parent to another.

		// If the item already had a name, remove the reference to it from the
		// parent's children object:
		if (this._name)
			this._removeFromNamed();
		this._name = name || undefined;
		if (name) {
			var children = this._parent._children,
				namedChildren = this._parent._namedChildren;
			(namedChildren[name] = namedChildren[name] || []).push(this);
			children[name] = this;
		}
		this._changed(ChangeFlag.ATTRIBUTE);
	},

	/**
	 * The item's position within the project. This is the
	 * {@link Rectangle#center} of the item's {@link #bounds} rectangle.
	 *
	 * @type Point
	 * @bean
	 *
	 * @example {@paperscript}
	 * // Changing the position of a path:
	 *
	 * // Create a circle at position { x: 10, y: 10 }
	 * var circle = new Path.Circle(new Point(10, 10), 10);
	 * circle.fillColor = 'red';
	 *
	 * // Move the circle to { x: 20, y: 20 }
	 * circle.position = new Point(20, 20);
	 *
	 * // Move the circle 100 points to the right and 50 points down
	 * circle.position += new Point(100, 50);
	 *
	 * @example {@paperscript split=true height=100}
	 * // Changing the x coordinate of an item's position:
	 *
	 * // Create a circle at position { x: 20, y: 20 }
	 * var circle = new Path.Circle(new Point(20, 20), 10);
	 * circle.fillColor = 'red';
	 *
	 * // Move the circle 100 points to the right
	 * circle.position.x += 100;
	 */
	getPosition: function() {
		// Cache position value
		var pos = this._position
				|| (this._position = this.getBounds().getCenter());
		// this._position is a LinkedPoint as well, so we can use _x and _y.
		// Do not cache LinkedPoints directly, since we would not be able to
		// use them to calculate the difference in #setPosition, as when it is
		// modified, it would hold new values already and only then cause the
		// calling of #setPosition.
		return LinkedPoint.create(this, 'setPosition', pos._x, pos._y);
	},

	setPosition: function(point) {
		this.translate(Point.read(arguments).subtract(this.getPosition()));
	},

	/**
	 * The path style of the item.
	 *
	 * @type PathStyle
	 * @bean
	 *
	 * @example {@paperscript}
	 * // Applying several styles to an item in one go, by passing an object
	 * // to its style property:
	 * var circle = new Path.Circle(new Point(80, 50), 30);
	 * circle.style = {
	 * 	fillColor: 'blue',
	 * 	strokeColor: 'red',
	 * 	strokeWidth: 5
	 * };
	 *
	 * @example {@paperscript split=true height=100}
	 * // Copying the style of another item:
	 * var path = new Path.Circle(new Point(50, 50), 30);
	 * path.fillColor = 'red';
	 *
	 * var path2 = new Path.Circle(new Point(180, 50), 20);
	 * // Copy the path style of path:
	 * path2.style = path.style;
	 *
	 * @example {@paperscript}
	 * // Applying the same style object to multiple items:
	 * var myStyle = {
	 * 	fillColor: 'red',
	 * 	strokeColor: 'blue',
	 * 	strokeWidth: 4
	 * };
	 *
	 * var path = new Path.Circle(new Point(80, 50), 30);
	 * path.style = myStyle;
	 *
	 * var path2 = new Path.Circle(new Point(150, 50), 20);
	 * path2.style = myStyle;
	 */
	getStyle: function() {
		return this._style;
	},

	setStyle: function(style) {
		this._style.initialize(style);
	}

}, new function() { // Injection scope to produce getter setters for properties
	// We need setters because we want to call _changed() if a property was
	// modified.
	return Base.each(['locked', 'visible', 'blendMode', 'opacity'],
		function(name) {
			var part = Base.capitalize(name),
				name = '_' + name;
			this['get' + part] = function() {
				return this[name];
			};
			this['set' + part] = function(value) {
				if (value != this[name]) {
					this[name] = value;
					// #locked does not change appearance, all others do:
					this._changed(name === '_locked'
							? ChangeFlag.ATTRIBUTE : Change.ATTRIBUTE);
				}
			};
		}, {});
}, /** @lends Item# */{
	// Note: These properties have their getter / setters produced in the
	// injection scope above.

	/**
	 * Specifies whether the item is locked.
	 *
	 * @name Item#locked
	 * @type Boolean
	 * @default false
	 * @ignore
	 */
	_locked: false,

	/**
	 * Specifies whether the item is visible. When set to {@code false}, the
	 * item won't be drawn.
	 *
	 * @name Item#visible
	 * @type Boolean
	 * @default true
	 *
	 * @example {@paperscript}
	 * // Hiding an item:
	 * var path = new Path.Circle(new Point(50, 50), 20);
	 * path.fillColor = 'red';
	 *
	 * // Hide the path:
	 * path.visible = false;
	 */
	_visible: true,

	/**
	 * The blend mode of the item.
	 *
	 * @name Item#blendMode
	 * @type String('normal', 'multiply', 'screen', 'overlay', 'soft-light',
	 * 'hard-light', 'color-dodge', 'color-burn', 'darken', 'lighten',
	 * 'difference', 'exclusion', 'hue', 'saturation', 'luminosity', 'color',
	 * 'add', 'subtract', 'average', 'pin-light', 'negation')
	 * @default 'normal'
	 *
	 * @example {@paperscript}
	 * // Setting an item's blend mode:
	 *
	 * // Create a white rectangle in the background
	 * // with the same dimensions as the view:
	 * var background = new Path.Rectangle(view.bounds);
	 * background.fillColor = 'white';
	 *
	 * var circle = new Path.Circle(new Point(80, 50), 35);
	 * circle.fillColor = 'red';
	 *
	 * var circle2 = new Path.Circle(new Point(120, 50), 35);
	 * circle2.fillColor = 'blue';
	 *
	 * // Set the blend mode of circle2:
	 * circle2.blendMode = 'multiply';
	 */
	_blendMode: 'normal',

	/**
	 * The opacity of the item as a value between {@code 0} and {@code 1}.
	 *
	 * @name Item#opacity
	 * @type Number
	 * @default 1
	 *
	 * @example {@paperscript}
	 * // Making an item 50% transparent:
	 * var circle = new Path.Circle(new Point(80, 50), 35);
	 * circle.fillColor = 'red';
     *
	 * var circle2 = new Path.Circle(new Point(120, 50), 35);
	 * circle2.style = {
	 * 	fillColor: 'blue',
	 * 	strokeColor: 'green',
	 * 	strokeWidth: 10
	 * };
	 *
	 * // Make circle2 50% transparent:
	 * circle2.opacity = 0.5;
	 */
	_opacity: 1,

	/**
	 * Specifies whether an item is selected and will also return {@code true}
	 * if the item is partially selected (groups with some selected or partially
	 * selected paths).
	 *
	 * Paper.js draws the visual outlines of selected items on top of your
	 * project. This can be useful for debugging, as it allows you to see the
	 * construction of paths, position of path curves, individual segment points
	 * and bounding boxes of symbol and raster items.
	 *
	 * @type Boolean
	 * @default false
	 * @bean
	 * @see Project#selectedItems
	 * @see Segment#selected
	 * @see Point#selected
	 *
	 * @example {@paperscript}
	 * // Selecting an item:
	 * var path = new Path.Circle(new Size(80, 50), 35);
	 * path.selected = true; // Select the path
	 */
	isSelected: function() {
		if (this._children) {
			for (var i = 0, l = this._children.length; i < l; i++)
				if (this._children[i].isSelected())
					return true;
		}
		return this._selected;
	},

	setSelected: function(selected) {
		if (this._children) {
			for (var i = 0, l = this._children.length; i < l; i++) {
				this._children[i].setSelected(selected);
			}
		} else if ((selected = !!selected) != this._selected) {
			this._selected = selected;
			this._project._updateSelection(this);
			this._changed(Change.ATTRIBUTE);
		}
	},

	_selected: false,

	// TODO: isFullySelected / setFullySelected

	/**
	 * Specifies whether the item defines a clip mask. This can only be set on
	 * paths, compound paths, and text frame objects, and only if the item is
	 * already contained within a clipping group.
	 *
	 * @type Boolean
	 * @default false
	 * @bean
	 */
	isClipMask: function() {
		return this._clipMask;
	},

	setClipMask: function(clipMask) {
		// On-the-fly conversion to boolean:
		if (this._clipMask != (clipMask = !!clipMask)) {
			this._clipMask = clipMask;
			if (clipMask) {
				this.setFillColor(null);
				this.setStrokeColor(null);
			}
			this._changed(Change.ATTRIBUTE);
			// Tell the parent the clipping mask has changed
			if (this._parent)
				this._parent._changed(ChangeFlag.CLIPPING);
		}
	},

	_clipMask: false,

	// TODO: get/setIsolated (print specific feature)
	// TODO: get/setKnockout (print specific feature)
	// TODO: get/setAlphaIsShape
	// TODO: get/setData

	/**
	 * {@grouptitle Project Hierarchy}
	 * The project that this item belongs to.
	 *
	 * @type Project
	 * @bean
	 */
	getProject: function() {
		return this._project;
	},

	_setProject: function(project) {
		if (this._project != project) {
			this._project = project;
			if (this._children) {
				for (var i = 0, l = this._children.length; i < l; i++) {
					this._children[i]._setProject(project);
				}
			}
		}
	},

	// TODO: #getLayer()

	/**
	 * The item that this item is contained within.
	 *
	 * @type Item
	 * @bean
	 *
	 * @example
	 * var path = new Path();
	 *
	 * // New items are placed in the active layer:
	 * console.log(path.parent == project.activeLayer); // true
	 *
	 * var group = new Group();
	 * group.addChild(path);
	 *
	 * // Now the parent of the path has become the group:
	 * console.log(path.parent == group); // true
	 */
	getParent: function() {
		return this._parent;
	},

	// DOCS: add comment to Item#children about not playing around with the
	// array directly - use addChild etc instead.
	/**
	 * The children items contained within this item. Items that define a
	 * {@link #name} can also be accessed by name.
	 *
	 * <b>Please note:</b> The children array should not be modified directly
	 * using array functions. To remove single items from the children list, use
	 * {@link Item#remove()}, to remove all items from the children list, use
	 * {@link Item#removeChildren()}. To add items to the children list, use
	 * {@link Item#addChild(item)} or {@link Item#insertChild(index,item)}.
	 *
	 * @type Item[]
	 * @bean
	 *
	 * @example {@paperscript}
	 * // Accessing items in the children array:
	 * var path = new Path.Circle(new Point(80, 50), 35);
	 *
	 * // Create a group and move the path into it:
	 * var group = new Group();
	 * group.addChild(path);
	 *
	 * // Access the path through the group's children array:
	 * group.children[0].fillColor = 'red';
	 *
	 * @example {@paperscript}
	 * // Accessing children by name:
	 * var path = new Path.Circle(new Point(80, 50), 35);
	 * // Set the name of the path:
	 * path.name = 'example';
	 *
	 * // Create a group and move the path into it:
	 * var group = new Group();
	 * group.addChild(path);
	 *
	 * // The path can be accessed by name:
	 * group.children['example'].fillColor = 'orange';
	 *
	 * @example {@paperscript}
	 * // Passing an array of items to item.children:
	 * var path = new Path.Circle(new Point(80, 50), 35);
	 *
	 * var group = new Group();
	 * group.children = [path];
	 *
	 * // The path is the first child of the group:
	 * group.firstChild.fillColor = 'green';
	 */
	getChildren: function() {
		return this._children;
	},

	setChildren: function(items) {
		this.removeChildren();
		this.addChildren(items);
	},

	/**
	 * The first item contained within this item. This is a shortcut for
	 * accessing {@code item.children[0]}.
	 *
	 * @type Item
	 * @bean
	 */
	getFirstChild: function() {
		return this._children && this._children[0] || null;
	},

	/**
	 * The last item contained within this item.This is a shortcut for
	 * accessing {@code item.children[item.children.length - 1]}.
	 *
	 * @type Item
	 * @bean
	 */
	getLastChild: function() {
		return this._children && this._children[this._children.length - 1]
				|| null;
	},

	/**
	 * The next item on the same level as this item.
	 *
	 * @type Item
	 * @bean
	 */
	getNextSibling: function() {
		return this._parent && this._parent._children[this._index + 1] || null;
	},

	/**
	 * The previous item on the same level as this item.
	 *
	 * @type Item
	 * @bean
	 */
	getPreviousSibling: function() {
		return this._parent && this._parent._children[this._index - 1] || null;
	},

	/**
	 * The index of this item within the list of its parent's children.
	 *
	 * @type Number
	 * @bean
	 */
	getIndex: function() {
		return this._index;
	},

	/**
	 * Clones the item within the same project and places the copy above the
	 * item.
	 *
	 * @return {Item} the newly cloned item
	 *
	 * @example {@paperscript}
	 * // Cloning items:
	 * var circle = new Path.Circle(new Point(50, 50), 10);
	 * circle.fillColor = 'red';
	 *
	 * // Make 20 copies of the circle:
	 * for (var i = 0; i < 20; i++) {
	 * 	var copy = circle.clone();
	 *
	 * 	// Distribute the copies horizontally, so we can see them:
	 * 	copy.position.x += i * copy.bounds.width;
	 * }
	 */
	clone: function() {
		return this._clone(new this.constructor());
	},

	_clone: function(copy) {
		// Copy over style
		copy.setStyle(this._style);
		// If this item has children, clone and append each of them:
		if (this._children) {
			for (var i = 0, l = this._children.length; i < l; i++)
				copy.addChild(this._children[i].clone());
		}
		// Only copy over these fields if they are actually defined in 'this'
		// TODO: Consider moving this to Base once it's useful in more than one
		// place
		var keys = ['_locked', '_visible', '_opacity', '_blendMode',
				'_clipMask'];
		for (var i = 0, l = keys.length; i < l; i++) {
			var key = keys[i];
			if (this.hasOwnProperty(key))
				copy[key] = this[key];
		}
		// Copy over the selection state, use setSelected so the item
		// is also added to Project#selectedItems if it is selected.
		copy.setSelected(this._selected);
		// Only set name once the copy is moved, to avoid setting and unsettting
		// name related structures.
		if (this._name)
			copy.setName(this._name);
		return copy;
	},

	/**
	 * When passed a project, copies the item to the project,
	 * or duplicates it within the same project. When passed an item,
	 * copies the item into the specified item.
	 *
	 * @param {Project|Layer|Group|CompoundPath} item the item or project to
	 * copy the item to
	 * @return {Item} the new copy of the item
	 */
	copyTo: function(itemOrProject) {
		var copy = this.clone();
		if (itemOrProject.layers) {
			itemOrProject.activeLayer.addChild(copy);
		} else {
			itemOrProject.addChild(copy);
		}
		return copy;
	},

	/**
	 * Rasterizes the item into a newly created Raster object. The item itself
	 * is not removed after rasterization.
	 *
	 * @param {Number} [resolution=72] the resolution of the raster in dpi
	 * @return {Raster} the newly created raster item
	 *
	 * @example {@paperscript}
	 * // Rasterizing an item:
	 * var circle = new Path.Circle(new Point(80, 50), 5);
	 * circle.fillColor = 'red';
	 *
	 * // Create a rasterized version of the path:
	 * var raster = circle.rasterize();
	 *
	 * // Move it 100pt to the right:
	 * raster.position.x += 100;
	 *
	 * // Scale the path and the raster by 300%, so we can compare them:
	 * circle.scale(5);
	 * raster.scale(5);
	 */
	rasterize: function(resolution) {
		// TODO: why would we want to pass a size to rasterize? Seems to produce
		// weird results on Scriptographer. Also we can't use antialiasing, since
		// Canvas doesn't support it yet. Project colorMode is also out of the
		// question for now.
		var bounds = this.getStrokeBounds(),
			scale = (resolution || 72) / 72,
			canvas = CanvasProvider.getCanvas(bounds.getSize().multiply(scale)),
			ctx = canvas.getContext('2d'),
			matrix = new Matrix().scale(scale).translate(-bounds.x, -bounds.y);
		matrix.applyToContext(ctx);
		this.draw(ctx, {});
		var raster = new Raster(canvas);
		raster.setPosition(this.getPosition());
		raster.scale(1 / scale);
		return raster;
	},

	/**
	 * {@grouptitle Hierarchy Operations}
	 * Adds the specified item as a child of this item at the end of the
	 * its children list. You can use this function for groups, compound
	 * paths and layers.
	 *
	 * @param {Item} item The item to be added as a child
	 */
	addChild: function(item) {
		return this.insertChild(undefined, item);
	},

	/**
	 * Inserts the specified item as a child of this item at the specified
	 * index in its {@link #children} list. You can use this function for
	 * groups, compound paths and layers.
	 *
	 * @param {Number} index
	 * @param {Item} item The item to be appended as a child
	 */
	insertChild: function(index, item) {
		if (this._children) {
			item._remove(false, true);
			Base.splice(this._children, [item], index, 0);
			item._parent = this;
			item._setProject(this._project);
			if (item._name)
				item.setName(item._name);
			this._changed(Change.HIERARCHY);
			return true;
		}
		return false;
	},

	/**
	 * Adds the specified items as children of this item at the end of the
	 * its children list. You can use this function for groups, compound
	 * paths and layers.
	 *
	 * @param {item[]} items The items to be added as children
	 */
	addChildren: function(items) {
		for (var i = 0, l = items && items.length; i < l; i++)
			this.insertChild(undefined, items[i]);
	},

	/**
	 * Inserts the specified items as children of this item at the specified
	 * index in its {@link #children} list. You can use this function for
	 * groups, compound paths and layers.
	 *
	 * @param {Number} index
	 * @param {Item[]} items The items to be appended as children
	 */
	insertChildren: function(index, items) {
		for (var i = 0, l = items && items.length; i < l; i++) {
			if (this.insertChild(index, items[i]))
				index++;
		}
	},

	/**
	 * Inserts this item above the specified item.
	 *
	 * @param {Item} item The item above which it should be moved
	 * @return {Boolean} {@true it was inserted}
	 */
	insertAbove: function(item) {
		return item._parent && item._parent.insertChild(
				item._index + 1, this);
	},

	/**
	 * Inserts this item below the specified item.
	 *
	 * @param {Item} item The item above which it should be moved
	 * @return {Boolean} {@true it was inserted}
	 */
	insertBelow: function(item) {
		return item._parent && item._parent.insertChild(
				item._index - 1, this);
	},

	/**
	 * Inserts the specified item as a child of this item by appending it to
	 * the list of children and moving it above all other children. You can
	 * use this function for groups, compound paths and layers.
	 *
	 * @param {Item} item The item to be appended as a child
	 * @deprecated use {@link #addChild(item)} instead.
	 */
	appendTop: function(item) {
		return this.addChild(item);
	},

	/**
	 * Inserts the specified item as a child of this item by appending it to
	 * the list of children and moving it below all other children. You can
	 * use this function for groups, compound paths and layers.
	 *
	 * @param {Item} item The item to be appended as a child
	 * @deprecated use {@link #insertChild(index, item)} instead.
	 */
	appendBottom: function(item) {
		return this.insertChild(0, item);
	},

	/**
	 * Moves this item above the specified item.
	 *
	 * @param {Item} item The item above which it should be moved
	 * @return {Boolean} {@true it was moved}
	 * @deprecated use {@link #insertAbove(item)} instead.
	 */
	moveAbove: function(item) {
		return this.insertAbove(item);
	},

	/**
	 * Moves the item below the specified item.
	 *
	 * @param {Item} item the item below which it should be moved
	 * @return {Boolean} {@true it was moved}
	 * @deprecated use {@link #insertBelow(item)} instead.
	 */
	moveBelow: function(item) {
		return this.insertBelow(item);
	},

	/**
	* Removes the item from its parent's named children list.
	*/
	_removeFromNamed: function() {
		var children = this._parent._children,
			namedChildren = this._parent._namedChildren,
			name = this._name,
			namedArray = namedChildren[name],
			index = namedArray ? namedArray.indexOf(this) : -1;
		if (index == -1)
			return;
		// Remove the named reference
		if (children[name] == this)
			delete children[name];
		// Remove this entry
		namedArray.splice(index, 1);
		// If there are any items left in the named array, set
		// the last of them to be this.parent.children[this.name]
		if (namedArray.length) {
			children[name] = namedArray[namedArray.length - 1];
		} else {
			// Otherwise delete the empty array
			delete namedChildren[name];
		}
	},

	/**
	* Removes the item from its parent's children list.
	*/
	_remove: function(deselect, notify) {
		if (this._parent) {
			if (deselect)
				this.setSelected(false);
			if (this._name)
				this._removeFromNamed();
			Base.splice(this._parent._children, null, this._index, 1);
			// Notify parent of changed hierarchy
			if (notify)
				this._parent._changed(Change.HIERARCHY);
			this._parent = null;
			return true;
		}
		return false;
	},

	/**
	* Removes the item from the project. If the item has children, they are also
	* removed.
	*
	* @return {Boolean} {@true the item was removed}
	*/
	remove: function() {
		return this._remove(true, true);
	},

	/**
	 * Removes all of the item's {@link #children} (if any).
	 *
	 * @name Item#removeChildren
	 * @function
	 * @return {Item[]} an array containing the removed items
	 */
	/**
	 * Removes all of the item's {@link #children} (if any).
	 *
	 * @return {Item[]} an array containing the removed items
	 */
	/**
	 * Removes the children from the specified {@code from} index to the
	 * {@code to} index from the parent's {@link #children} array.
	 *
	 * @param {Number} from the beginning index, inclusive
	 * @param {Number} [to=children.length] the ending index, exclusive
	 * @return {Item[]} an array containing the removed items
	 */
	removeChildren: function(from, to) {
		if (!this._children)
			return null;
		from = from || 0;
	 	to = Base.pick(to, this._children.length);
		var removed = this._children.splice(from, to - from);
		for (var i = removed.length - 1; i >= 0; i--)
			removed[i]._remove(true, false);
		if (removed.length > 0)
			this._changed(Change.HIERARCHY);
		return removed;
	},

	/**
	 * Reverses the order of the item's children
	 */
	reverseChildren: function() {
		if (this._children) {
			this._children.reverse();
			// Adjust inidces
			for (var i = 0, l = this._children.length; i < l; i++)
				this._children[i]._index = i;
			this._changed(Change.HIERARCHY);
		}
	},

	// TODO: Item#isEditable is currently ignored in the documentation, as
	// locking an item currently has no effect
	/**
	 * {@grouptitle Tests}
	 * Checks whether the item is editable.
	 *
	 * @return {Boolean} {@true when neither the item, nor its parents are
	 * locked or hidden}
	 * @ignore
	 */
	isEditable: function() {
		var item = this;
		while (item) {
			if (!item._visible || item._locked)
				return false;
			item = item._parent;
		}
		return true;
	},

	/**
	 * Checks whether the item is valid, i.e. it hasn't been removed.
	 *
	 * @return {Boolean} {@true the item is valid}
	 */
	// TODO: isValid / checkValid

	/**
	 * Returns -1 if 'this' is above 'item', 1 if below, 0 if their order is not
	 * defined in such a way, e.g. if one is a descendant of the other.
	 */
	_getOrder: function(item) {
		// Private method that produces a list of anchestors, starting with the
		// root and ending with the actual element as the last entry.
		function getList(item) {
			var list = [];
			do {
				list.unshift(item);
			} while (item = item._parent)
			return list;
		}
		var list1 = getList(this),
			list2 = getList(item);
		for (var i = 0, l = Math.min(list1.length, list2.length); i < l; i++) {
			if (list1[i] != list2[i]) {
				// Found the position in the parents list where the two start
				// to differ. Look at who's above who.
				return list1[i]._index < list2[i]._index ? 1 : -1;
			}
		}
		return 0;
	},

	/**
	 * {@grouptitle Hierarchy Tests}
	 *
	 * Checks if the item contains any children items.
	 *
	 * @return {Boolean} {@true it has one or more children}
	 */
	hasChildren: function() {
		return this._children && this._children.length > 0;
	},

	/**
	 * Checks if this item is above the specified item in the stacking order
	 * of the project.
	 *
	 * @param {Item} item The item to check against
	 * @return {Boolean} {@true if it is above the specified item}
	 */
	isAbove: function(item) {
		return this._getOrder(item) == -1;
	},

	/**
	 * Checks if the item is below the specified item in the stacking order of
	 * the project.
	 *
	 * @param {Item} item The item to check against
	 * @return {Boolean} {@true if it is below the specified item}
	 */
	isBelow: function(item) {
		return this._getOrder(item) == 1;
	},

	/**
	 * Checks whether the specified item is the parent of the item.
	 *
	 * @param {Item} item The item to check against
	 * @return {Boolean} {@true if it is the parent of the item}
	 */
	isParent: function(item) {
		return this._parent == item;
	},

	/**
	 * Checks whether the specified item is a child of the item.
	 *
	 * @param {Item} item The item to check against
	 * @return {Boolean} {@true it is a child of the item}
	 */
	isChild: function(item) {
		return item && item._parent == this;
	},

	/**
	 * Checks if the item is contained within the specified item.
	 *
	 * @param {Item} item The item to check against
	 * @return {Boolean} {@true if it is inside the specified item}
	 */
	isDescendant: function(item) {
		var parent = this;
		while (parent = parent._parent) {
			if (parent == item)
				return true;
		}
		return false;
	},

	/**
	 * Checks if the item is an ancestor of the specified item.
	 *
	 * @param {Item} item the item to check against
	 * @return {Boolean} {@true if the item is an ancestor of the specified
	 * item}
	 */
	isAncestor: function(item) {
		return item ? item.isDescendant(this) : false;
	},

	/**
	 * Checks whether the item is grouped with the specified item.
	 *
	 * @param {Item} item
	 * @return {Boolean} {@true if the items are grouped together}
	 */
	isGroupedWith: function(item) {
		var parent = this._parent;
		while (parent) {
			// Find group parents. Check for parent._parent, since don't want
			// top level layers, because they also inherit from Group
			if (parent._parent
				&& (parent instanceof Group || parent instanceof CompoundPath)
				&& item.isDescendant(parent))
					return true;
			// Keep walking up otherwise
			parent = parent._parent;
		}
		return false;
	},

	/**
	 * {@grouptitle Bounding Rectangles}
	 *
	 * The bounding rectangle of the item excluding stroke width.
	 * @type Rectangle
	 * @bean
	 */
	getBounds: function() {
		return this._getBounds('getBounds');
	},

	setBounds: function(rect) {
		rect = Rectangle.read(arguments);
		var bounds = this.getBounds(),
			matrix = new Matrix(),
			center = rect.getCenter();
		// Read this from bottom to top:
		// Translate to new center:
		matrix.translate(center);
		// Scale to new Size, if size changes and avoid divisions by 0:
		if (rect.width != bounds.width || rect.height != bounds.height) {
			matrix.scale(
					bounds.width != 0 ? rect.width / bounds.width : 1,
					bounds.height != 0 ? rect.height / bounds.height : 1);
		}
		// Translate to center:
		center = bounds.getCenter();
		matrix.translate(-center.x, -center.y);
		// Now execute the transformation:
		this.transform(matrix);
	},

	/**
	 * The bounding rectangle of the item including stroke width.
	 *
	 * @type Rectangle
	 * @bean
	 */
	getStrokeBounds: function() {
		return this._getBounds('getStrokeBounds');
	},

	/**
	 * The bounding rectangle of the item including handles.
	 *
	 * @type Rectangle
	 * @bean
	 */
	getHandleBounds: function() {
		return this._getBounds('getHandleBounds');
	},

	/**
	 * Loops through all children, gets their bounds and finds the bounds around
	 * all of them.
	 */
	_getBounds: function(getter) {
		var children = this._children;
		// TODO: What to return if nothing is defined, e.g. empty Groups?
		// Scriptographer behaves weirdly then too.
		if (!children || children.length == 0)
			return new Rectangle();
		var x1 = Infinity,
			x2 = -Infinity,
			y1 = x1,
			y2 = x2;
		for (var i = 0, l = children.length; i < l; i++) {
			var child = children[i];
			if (child._visible) {
				var rect = child[getter]();
				x1 = Math.min(rect.x, x1);
				y1 = Math.min(rect.y, y1);
				x2 = Math.max(rect.x + rect.width, x2);
				y2 = Math.max(rect.y + rect.height, y2);
			}
		}
		var bounds = Rectangle.create(x1, y1, x2 - x1, y2 - y1);
		return getter == 'getBounds' ? this._createBounds(bounds) : bounds;
	},

	/**
	 * Creates a LinkedRectangle that when modified calls #setBounds().
	 */
	_createBounds: function(rect) {
		return LinkedRectangle.create(this, 'setBounds',
				rect.x, rect.y, rect.width, rect.height);
	},

	/**
	 * {@grouptitle Stroke Style}
	 *
	 * The color of the stroke.
	 *
	 * @property
	 * @name Item#strokeColor
	 * @type RGBColor|HSBColor|GrayColor
	 *
	 * @example {@paperscript}
	 * // Setting the stroke color of a path:
	 *
	 * // Create a circle shaped path at { x: 80, y: 50 }
	 * // with a radius of 35:
	 * var circle = new Path.Circle(new Point(80, 50), 35);
	 *
	 * // Set its stroke color to RGB red:
	 * circle.strokeColor = new RGBColor(1, 0, 0);
	 */

	/**
	 * The width of the stroke.
	 *
	 * @property
	 * @name Item#strokeWidth
	 * @type Number
	 *
	 * @example {@paperscript}
	 * // Setting an item's stroke width:
	 *
	 * // Create a circle shaped path at { x: 80, y: 50 }
	 * // with a radius of 35:
	 * var circle = new Path.Circle(new Point(80, 50), 35);
	 *
	 * // Set its stroke color to black:
	 * circle.strokeColor = 'black';
	 *
	 * // Set its stroke width to 10:
	 * circle.strokeWidth = 10;
	 */

	/**
	 * The shape to be used at the end of open {@link Path} items, when they
	 * have a stroke.
	 *
	 * @property
	 * @name Item#strokeCap
	 * @default 'butt'
	 * @type String('round', 'square', 'butt')
	 *
	 * @example {@paperscript height=200}
	 * // A look at the different stroke caps:
	 *
	 * var line = new Path(new Point(80, 50), new Point(420, 50));
	 * line.strokeColor = 'black';
	 * line.strokeWidth = 20;
	 *
	 * // Select the path, so we can see where the stroke is formed:
	 * line.selected = true;
	 *
	 * // Set the stroke cap of the line to be round:
	 * line.strokeCap = 'round';
	 *
	 * // Copy the path and set its stroke cap to be square:
	 * var line2 = line.clone();
	 * line2.position.y += 50;
	 * line2.strokeCap = 'square';
	 *
	 * // Make another copy and set its stroke cap to be butt:
	 * var line2 = line.clone();
	 * line2.position.y += 100;
	 * line2.strokeCap = 'butt';
	 */

	/**
	 * The shape to be used at the corners of paths when they have a stroke.
	 *
	 * @property
	 * @name Item#strokeJoin
	 * @default 'miter'
	 * @type String ('miter', 'round', 'bevel')
	 *
	 *
	 * @example {@paperscript height=120}
	 * // A look at the different stroke joins:
	 * var path = new Path();
	 * path.add(new Point(80, 100));
	 * path.add(new Point(120, 40));
	 * path.add(new Point(160, 100));
	 * path.strokeColor = 'black';
	 * path.strokeWidth = 20;
	 *
	 * // Select the path, so we can see where the stroke is formed:
	 * path.selected = true;
     *
	 * var path2 = path.clone();
	 * path2.position.x += path2.bounds.width * 1.5;
	 * path2.strokeJoin = 'round';
     *
	 * var path3 = path2.clone();
	 * path3.position.x += path3.bounds.width * 1.5;
	 * path3.strokeJoin = 'bevel';
	 */

	/**
	 * The dash offset of the stroke.
	 *
	 * @property
	 * @name Item#dashOffset
	 * @default 0
	 * @type Number
	 */

	/**
	 * Specifies an array containing the dash and gap lengths of the stroke.
	 *
	 * @example {@paperscript}
	 * var path = new Path.Circle(new Point(80, 50), 40);
	 * path.strokeWidth = 2;
	 * path.strokeColor = 'black';
	 *
	 * // Set the dashed stroke to [10pt dash, 4pt gap]:
	 * path.dashArray = [10, 4];
	 *
	 * @property
	 * @name Item#dashArray
	 * @default []
	 * @type Array
	 */

	/**
	 * The miter limit of the stroke.
	 * When two line segments meet at a sharp angle and miter joins have been
	 * specified for {@link Item#strokeJoin}, it is possible for the miter to
	 * extend far beyond the {@link Item#strokeWidth} of the path. The
	 * miterLimit imposes a limit on the ratio of the miter length to the
	 * {@link Item#strokeWidth}.
	 *
	 * @property
	 * @default 10
	 * @name Item#miterLimit
	 * @type Number
	 */

	/**
	 * {@grouptitle Fill Style}
	 *
	 * The fill color of the item.
	 *
	 * @property
	 * @name Item#fillColor
	 * @type RGBColor|HSBColor|GrayColor
	 *
	 * @example {@paperscript}
	 * // Setting the fill color of a path to red:
	 *
	 * // Create a circle shaped path at { x: 80, y: 50 }
	 * // with a radius of 35:
	 * var circle = new Path.Circle(new Point(80, 50), 35);
	 *
	 * // Set the fill color of the circle to RGB red:
	 * circle.fillColor = new RGBColor(1, 0, 0);
	 */

	// DOCS: document the different arguments that this function can receive.
	/**
	 * {@grouptitle Transform Functions}
	 *
	 * Scales the item by the given value from its center point, or optionally
	 * from a supplied point.
	 *
	 * @name Item#scale
	 * @function
	 * @param {Number} scale the scale factor
	 * @param {Point} [center={@link Item#position}]
	 *
	 * @example {@paperscript}
	 * // Scaling an item from its center point:
	 *
	 * // Create a circle shaped path at { x: 80, y: 50 }
	 * // with a radius of 20:
	 * var circle = new Path.Circle(new Point(80, 50), 20);
	 * circle.fillColor = 'red';
	 *
	 * // Scale the path by 150% from its center point
	 * circle.scale(1.5);
	 *
	 * @example {@paperscript}
	 * // Scaling an item from a specific point:
	 *
	 * // Create a circle shaped path at { x: 80, y: 50 }
	 * // with a radius of 20:
	 * var circle = new Path.Circle(new Point(80, 50), 20);
	 * circle.fillColor = 'red';
	 *
	 * // Scale the path 150% from its bottom left corner
	 * circle.scale(1.5, circle.bounds.bottomLeft);
	 */
	/**
	 * Scales the item by the given values from its center point, or optionally
	 * from a supplied point.
	 *
	 * @name Item#scale
	 * @function
	 * @param {Number} hor the horizontal scale factor
	 * @param {Number} ver the vertical scale factor
	 * @param {Point} [center={@link Item#position}]
	 *
	 * @example {@paperscript}
	 * // Scaling an item horizontally by 300%:
	 *
	 * // Create a circle shaped path at { x: 100, y: 50 }
	 * // with a radius of 20:
	 * var circle = new Path.Circle(new Point(100, 50), 20);
	 * circle.fillColor = 'red';
     *
	 * // Scale the path horizontally by 300%
	 * circle.scale(3, 1);
	 */
	scale: function(hor, ver /* | scale */, center) {
		// See Matrix#scale for explanation of this:
		if (arguments.length < 2 || typeof ver === 'object') {
			center = ver;
			ver = hor;
		}
		return this.transform(new Matrix().scale(hor, ver,
				center || this.getPosition()));
	},

	/**
	 * Translates (moves) the item by the given offset point.
	 *
	 * @param {Point} delta the offset to translate the item by
	 */
	translate: function(delta) {
		var mx = new Matrix();
		return this.transform(mx.translate.apply(mx, arguments));
	},

	/**
	 * Rotates the item by a given angle around the given point.
	 *
	 * Angles are oriented clockwise and measured in degrees.
	 *
	 * @param {Number} angle the rotation angle
	 * @param {Point} [center={@link Item#position}]
	 * @see Matrix#rotate
	 *
	 * @example {@paperscript}
	 * // Rotating an item:
	 *
	 * // Create a rectangle shaped path with its top left
	 * // point at {x: 80, y: 25} and a size of {width: 50, height: 50}:
	 * var path = new Path.Rectangle(new Point(80, 25), new Size(50, 50));
	 * path.fillColor = 'black';
     *
	 * // Rotate the path by 30 degrees:
	 * path.rotate(30);
	 *
	 * @example {@paperscript height=200}
	 * // Rotating an item around a specific point:
	 *
	 * // Create a rectangle shaped path with its top left
	 * // point at {x: 175, y: 50} and a size of {width: 100, height: 100}:
	 * var topLeft = new Point(175, 50);
	 * var size = new Size(100, 100);
	 * var path = new Path.Rectangle(topLeft, size);
	 * path.fillColor = 'black';
	 *
	 * // Draw a circle shaped path in the center of the view,
	 * // to show the rotation point:
	 * var circle = new Path.Circle(view.center, 5);
	 * circle.fillColor = 'white';
	 *
	 * // Each frame rotate the path 3 degrees around the center point
	 * // of the view:
	 * function onFrame(event) {
	 * 	path.rotate(3, view.center);
	 * }
	 */
	rotate: function(angle, center) {
		return this.transform(new Matrix().rotate(angle,
				center || this.getPosition()));
	},

	// TODO: Add test for item shearing, as it might be behaving oddly.
	/**
	 * Shears the item by the given value from its center point, or optionally
	 * by a supplied point.
	 *
	 * @name Item#shear
	 * @function
	 * @param {Point} point
	 * @param {Point} [center={@link Item#position}]
	 * @see Matrix#shear
	 */
	/**
	 * Shears the item by the given values from its center point, or optionally
	 * by a supplied point.
	 *
	 * @name Item#shear
	 * @function
	 * @param {Number} hor the horizontal shear factor.
	 * @param {Number} ver the vertical shear factor.
	 * @param {Point} [center={@link Item#position}]
	 * @see Matrix#shear
	 */
	shear: function(hor, ver, center) {
		// PORT: Add support for center back to Scriptographer too!
		// See Matrix#scale for explanation of this:
		if (arguments.length < 2 || typeof ver === 'object') {
			center = ver;
			ver = hor;
		}
		return this.transform(new Matrix().shear(hor, ver,
				center || this.getPosition()));
	},

	/**
	 * Transform the item.
	 *
	 * @param {Matrix} matrix
	 */
	// Remove this for now:
	// @param {String[]} flags Array of any of the following: 'objects',
	//        'children', 'fill-gradients', 'fill-patterns', 'stroke-patterns',
	//        'lines'. Default: ['objects', 'children']
	transform: function(matrix, flags) {
		// TODO: Handle flags, add TransformFlag class and convert to bit mask
		// for quicker checking.
		// TODO: Call transform on chidren only if 'children' flag is provided.
		// Calling _changed will clear _bounds and _position, but depending
		// on matrix we can calculate and set them again.
		var bounds = this._bounds,
			position = this._position;
		if (this._transform) {
			this._transform(matrix, flags);
			this._changed(Change.GEOMETRY);
		}
		// Detect matrices that contain only translations and scaling
		// and transform the cached _bounds and _position without having to
		// fully recalculate each time.
		if (bounds && matrix.getRotation() % 90 === 0) {
			this._bounds = this._createBounds(
					matrix._transformBounds(bounds));
			this._position = this._bounds.getCenter();
		} else if (position) {
			// Transform position as well. Do not notify _position of
			// changes, since it's a LinkedPoint and would cause recursion!
			this._position = matrix._transformPoint(position, position, true);
		}
		for (var i = 0, l = this._children && this._children.length; i < l; i++)
			this._children[i].transform(matrix, flags);
		// PORT: Return 'this' in all chainable commands
		return this;
	},

	/**
	 * Transform the item so that its {@link #bounds} fit within the specified
	 * rectangle, without changing its aspect ratio.
	 *
	 * @param {Rectangle} rectangle
	 * @param {Boolean} [fill=false]
	 *
	 * @example {@paperscript height=100}
	 * // Fitting an item to the bounding rectangle of another item's bounding
	 * // rectangle:
	 *
	 * // Create a rectangle shaped path with its top left corner
	 * // at {x: 80, y: 25} and a size of {width: 75, height: 50}:
	 * var size = new Size(75, 50);
	 * var path = new Path.Rectangle(new Point(80, 25), size);
	 * path.fillColor = 'black';
	 *
	 * // Create a circle shaped path with its center at {x: 80, y: 50}
	 * // and a radius of 30.
	 * var circlePath = new Path.Circle(new Point(80, 50), 30);
	 * circlePath.fillColor = 'red';
	 *
	 * // Fit the circlePath to the bounding rectangle of
	 * // the rectangular path:
	 * circlePath.fitBounds(path.bounds);
	 *
	 * @example {@paperscript height=100}
	 * // Fitting an item to the bounding rectangle of another item's bounding
	 * // rectangle with the fill parameter set to true:
	 *
	 * // Create a rectangle shaped path with its top left corner
	 * // at {x: 80, y: 25} and a size of {width: 75, height: 50}:
	 * var size = new Size(75, 50);
	 * var path = new Path.Rectangle(new Point(80, 25), size);
	 * path.fillColor = 'black';
	 *
	 * // Create a circle shaped path with its center at {x: 80, y: 50}
	 * // and a radius of 30.
	 * var circlePath = new Path.Circle(new Point(80, 50), 30);
	 * circlePath.fillColor = 'red';
	 *
	 * // Fit the circlePath to the bounding rectangle of
	 * // the rectangular path:
	 * circlePath.fitBounds(path.bounds, true);
	 *
	 * @example {@paperscript height=200}
	 * // Fitting an item to the bounding rectangle of the view
	 * var path = new Path.Circle(new Point(80, 50), 30);
	 * path.fillColor = 'red';
	 *
	 * // Fit the path to the bounding rectangle of the view:
	 * path.fitBounds(view.bounds);
	 */
	fitBounds: function(rectangle, fill) {
		rectangle = Rectangle.read(arguments);
		var bounds = this.getBounds(),
			itemRatio = bounds.height / bounds.width,
			rectRatio = rectangle.height / rectangle.width,
			scale = (fill ? itemRatio > rectRatio : itemRatio < rectRatio)
					? rectangle.width / bounds.width
					: rectangle.height / bounds.height,
			delta = rectangle.getCenter().subtract(bounds.getCenter()),
			newBounds = new Rectangle(new Point(),
					new Size(bounds.width * scale, bounds.height * scale));
		newBounds.setCenter(rectangle.getCenter());
		this.setBounds(newBounds);
	},

	/*
		_transform: function(matrix, flags) {
			// The code that performs the actual transformation of content,
			// if defined. Item itself does not define this.
		},
	*/

	// TODO: toString

	statics: {
		drawSelectedBounds: function(bounds, ctx, matrix) {
			var coords = matrix._transformCorners(bounds);
			ctx.beginPath();
			for (var i = 0; i < 8; i++)
				ctx[i == 0 ? 'moveTo' : 'lineTo'](coords[i], coords[++i]);
			ctx.closePath();
			ctx.stroke();
			for (var i = 0; i < 8; i++) {
				ctx.beginPath();
				ctx.rect(coords[i] - 2, coords[++i] - 2, 4, 4);
				ctx.fill();
			}
		},

		// TODO: Implement View into the drawing.
		// TODO: Optimize temporary canvas drawing to ignore parts that are
		// outside of the visible view.
		draw: function(item, ctx, param) {
			if (!item._visible || item._opacity == 0)
				return;

			var tempCanvas, parentCtx;
			// If the item has a blendMode or is defining an opacity, draw it on
			// a temporary canvas first and composite the canvas afterwards.
			// Paths with an opacity < 1 that both define a fillColor
			// and strokeColor also need to be drawn on a temporary canvas first,
			// since otherwise their stroke is drawn half transparent over their
			// fill.
			if (item._blendMode !== 'normal'
					|| item._opacity < 1
					&& !(item._segments && (!item.getFillColor()
							|| !item.getStrokeColor()))) {
				var bounds = item.getStrokeBounds() || item.getBounds();
				if (!bounds.width || !bounds.height)
					return;

				// Floor the offset and ceil the size, so we don't cut off any
				// antialiased pixels when drawing onto the temporary canvas.
				var itemOffset = bounds.getTopLeft().floor(),
					size = bounds.getSize().ceil().add(new Size(1, 1));
				tempCanvas = CanvasProvider.getCanvas(size);

				// Save the parent context, so we can draw onto it later
				parentCtx = ctx;

				// Set ctx to the context of the temporary canvas,
				// so we draw onto it, instead of the parentCtx
				ctx = tempCanvas.getContext('2d');
				ctx.save();

				// Translate the context so the topLeft of the item is at (0, 0)
				// on the temporary canvas.
				ctx.translate(-itemOffset.x, -itemOffset.y);
			}
			var savedOffset;
			if (itemOffset) {
				savedOffset = param.offset;
				param.offset = itemOffset;
			}
			item.draw(ctx, param);
			if (itemOffset)
				param.offset = savedOffset;

			// If we created a temporary canvas before, composite it onto the
			// parent canvas:
			if (tempCanvas) {

				// Restore the temporary canvas to its state before the
				// translation matrix was applied above.
				ctx.restore();

				// If the item has a blendMode, use BlendMode#process to
				// composite its canvas on the parentCanvas.
				if (item._blendMode !== 'normal') {
					// The pixel offset of the temporary canvas to the parent
					// canvas.
					var pixelOffset = itemOffset.subtract(param.offset);
					BlendMode.process(item._blendMode, ctx, parentCtx,
						item._opacity, pixelOffset);
				} else {
				// Otherwise we just need to set the globalAlpha before drawing
				// the temporary canvas on the parent canvas.
					parentCtx.save();
					parentCtx.globalAlpha = item._opacity;
					parentCtx.drawImage(tempCanvas,
							itemOffset.x, itemOffset.y);
					parentCtx.restore();
				}

				// Return the temporary canvas, so it can be reused
				CanvasProvider.returnCanvas(tempCanvas);
			}
		}
	}
}, new function() {
	/**
	 * {@grouptitle Remove On Event}
	 *
	 * Removes the item when the events specified in the passed object literal
	 * occur.
	 * The object literal can contain the following values:
	 * Remove the item when the next {@link Tool#onMouseMove} event is
	 * fired: {@code object.move = true}
	 *
	 * Remove the item when the next {@link Tool#onMouseDrag} event is
	 * fired: {@code object.drag = true}
	 *
	 * Remove the item when the next {@link Tool#onMouseDown} event is
	 * fired: {@code object.down = true}
	 *
	 * Remove the item when the next {@link Tool#onMouseUp} event is
	 * fired: {@code object.up = true}
	 *
	 * @name Item#removeOn
	 * @function
	 * @param {Object} object
	 *
	 * @example {@paperscript height=200}
	 * // Click and drag below:
	 * function onMouseDrag(event) {
	 * 	// Create a circle shaped path at the mouse position,
	 * 	// with a radius of 10:
	 * 	var path = new Path.Circle(event.point, 10);
	 * 	path.fillColor = 'black';
	 *
	 * 	// Remove the path on the next onMouseDrag or onMouseDown event:
	 * 	path.removeOn({
	 * 		drag: true,
	 * 		down: true
	 * 	});
	 * }
	 */

	/**
	 * Removes the item when the next {@link Tool#onMouseMove} event is fired.
	 *
	 * @name Item#removeOnMove
	 * @function
	 *
	 * @example {@paperscript height=200}
	 * // Move your mouse below:
	 * function onMouseMove(event) {
	 * 	// Create a circle shaped path at the mouse position,
	 * 	// with a radius of 10:
	 * 	var path = new Path.Circle(event.point, 10);
	 * 	path.fillColor = 'black';
	 *
	 * 	// On the next move event, automatically remove the path:
	 * 	path.removeOnMove();
	 * }
	 */

	/**
	 * Removes the item when the next {@link Tool#onMouseDown} event is fired.
	 *
	 * @name Item#removeOnDown
	 * @function
	 *
	 * @example {@paperscript height=200}
	 * // Click a few times below:
	 * function onMouseDown(event) {
	 * 	// Create a circle shaped path at the mouse position,
	 * 	// with a radius of 10:
	 * 	var path = new Path.Circle(event.point, 10);
	 * 	path.fillColor = 'black';
	 *
	 * 	// Remove the path, next time the mouse is pressed:
	 * 	path.removeOnDown();
	 * }
	 */

	/**
	 * Removes the item when the next {@link Tool#onMouseDrag} event is fired.
	 *
	 * @name Item#removeOnDrag
	 * @function
	 *
	 * @example {@paperscript height=200}
	 * // Click and drag below:
	 * function onMouseDrag(event) {
	 * 	// Create a circle shaped path at the mouse position,
	 * 	// with a radius of 10:
	 * 	var path = new Path.Circle(event.point, 10);
	 * 	path.fillColor = 'black';
	 *
	 * 	// On the next drag event, automatically remove the path:
	 * 	path.removeOnDrag();
	 * }
	 */

	/**
	 * Removes the item when the next {@link Tool#onMouseUp} event is fired.
	 *
	 * @name Item#removeOnUp
	 * @function
	 *
	 * @example {@paperscript height=200}
	 * // Click a few times below:
	 * function onMouseDown(event) {
	 * 	// Create a circle shaped path at the mouse position,
	 * 	// with a radius of 10:
	 * 	var path = new Path.Circle(event.point, 10);
	 * 	path.fillColor = 'black';
	 *
	 * 	// Remove the path, when the mouse is released:
	 * 	path.removeOnUp();
	 * }
	 */

	var sets = {
		down: {}, drag: {}, up: {}, move: {}
	};

	function removeAll(set) {
		for (var id in set) {
			var item = set[id];
			item.remove();
			for (var type in sets) {
				var other = sets[type];
				if (other != set && other[item.getId()])
					delete other[item.getId()];
			}
		}
	}

	function installHandler(name) {
		var handler = 'onMouse' + Base.capitalize(name);
		// Inject a onMouse handler that performs all the behind the scene magic
		// and calls the script's handler at the end, if defined.
		var func = paper.tool[handler];
		if (!func || !func._installed) {
			var hash = {};
			hash[handler] = function(event) {
				// Always clear the drag set on mouseup
				if (name === 'up')
					sets.drag = {};
				removeAll(sets[name]);
				sets[name] = {};
				// Call the script's overridden handler, if defined
				if (this.base)
					this.base(event);
			};
			paper.tool.inject(hash);
			// Only install this handler once, and mark it as installed,
			// to prevent repeated installing.
			paper.tool[handler]._installed = true;
		}
	}

	// TODO: implement Item#removeOnFrame
	return Base.each(['down', 'drag', 'up', 'move'], function(name) {
		this['removeOn' + Base.capitalize(name)] = function() {
			var hash = {};
			hash[name] = true;
			return this.removeOn(hash);
		};
	}, {
		removeOn: function(obj) {
			for (var name in obj) {
				if (obj[name]) {
					sets[name][this.getId()] = this;
					// Since the drag set gets cleared in up, we need to make
					// sure it's installed too
					if (name === 'drag')
						installHandler('up');
					installHandler(name);
				}
			}
			return this;
		}
	});
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Group
 *
 * @class A Group is a collection of items. When you transform a Group, its
 * children are treated as a single unit without changing their relative
 * positions.
 *
 * @extends Item
 */
var Group = this.Group = Item.extend(/** @lends Group# */{
	// DOCS: document new Group(item, item...);
	/**
	 * Creates a new Group item and places it at the top of the active layer.
	 *
	 * @param {Item[]} [children] An array of children that will be added to the
	 * newly created group.
	 *
	 * @example {@paperscript split=true height=200}
	 * // Create a group containing two paths:
	 * var path = new Path(new Point(100, 100), new Point(100, 200));
	 * var path2 = new Path(new Point(50, 150), new Point(150, 150));
	 *
	 * // Create a group from the two paths:
	 * var group = new Group([path, path2]);
	 *
	 * // Set the stroke color of all items in the group:
	 * group.strokeColor = 'black';
	 *
	 * // Move the group to the center of the view:
	 * group.position = view.center;
	 *
	 * @example {@paperscript split=true height=320}
	 * // Click in the view to add a path to the group, which in turn is rotated
	 * // every frame:
	 * var group = new Group();
	 *
	 * function onMouseDown(event) {
	 * 	// Create a new circle shaped path at the position
	 * 	// of the mouse:
	 * 	var path = new Path.Circle(event.point, 5);
	 * 	path.fillColor = 'black';
	 *
	 * 	// Add the path to the group's children list:
	 * 	group.addChild(path);
	 * }
	 *
	 * function onFrame(event) {
	 * 	// Rotate the group by 1 degree from
	 * 	// the centerpoint of the view:
	 * 	group.rotate(1, view.center);
	 * }
	 */
	initialize: function(items) {
		this.base();
		// Allow Group to have children and named children
		this._children = [];
		this._namedChildren = {};
		this.addChildren(!items || !Array.isArray(items)
				|| typeof items[0] !== 'object' ? arguments : items);
	},

	_changed: function(flags) {
		// Don't use base() for reasons of performance.
		Item.prototype._changed.call(this, flags);
		if (flags & (ChangeFlag.HIERARCHY | ChangeFlag.CLIPPING)) {
			// Clear cached clip item whenever hierarchy changes
			delete this._clipItem;
		}
	},

	_getClipItem: function() {
		// Allow us to set _clipItem to null when none is found and still return
		// it as a defined value without searching again
		if (this._clipItem !== undefined)
			return this._clipItem;
		for (var i = 0, l = this._children.length; i < l; i++) {
			var child = this._children[i];
			if (child._clipMask)
				return this._clipItem = child;
		}
		// Make sure we're setting _clipItem to null so it won't be searched for
		// nex time.
		return this._clipItem = null;
	},

	/**
	 * Specifies whether the group item is to be clipped.
	 * When setting to {@code true}, the first child in the group is
	 * automatically defined as the clipping mask.
	 *
	 * @type Boolean
	 * @bean
	 */
	isClipped: function() {
		return !!this._getClipItem();
	},

	setClipped: function(clipped) {
		var child = this.getFirstChild();
		if (child)
			child.setClipMask(clipped);
		return this;
	},

	draw: function(ctx, param) {
		var clipItem = this._getClipItem();
		if (clipItem)
			Item.draw(clipItem, ctx, param);
		for (var i = 0, l = this._children.length; i < l; i++) {
			var item = this._children[i];
			if (item != clipItem)
				Item.draw(item, ctx, param);
		}
	}
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Layer
 *
 * @class The Layer item represents a layer in a Paper.js project.
 *
 * The layer which is currently active can be accessed through
 * {@link Project#activeLayer}.
 * An array of all layers in a project can be accessed through
 * {@link Project#layers}.
 *
 * @extends Group
 */
var Layer = this.Layer = Group.extend(/** @lends Layer# */{
	// DOCS: improve constructor code example.
	/**
	 * Creates a new Layer item and places it at the end of the
	 * {@link Project#layers} array. The newly created layer will be activated,
	 * so all newly created items will be placed within it.
	 *
	 * @param {Item[]} [children] An array of items that will be added to the
	 * newly created layer.
	 *
	 * @example
	 * var layer = new Layer();
	 */
	initialize: function(items) {
		this._project = paper.project;
		// Push it onto project.layers and set index:
		this._index = this._project.layers.push(this) - 1;
		this.base.apply(this, arguments);
		this.activate();
	},

	/**
	* Removes the layer from its project's layers list
	* or its parent's children list.
	*/
	_remove: function(deselect, notify) {
		if (this._parent)
			return this.base(deselect, notify);
		if (this._index != null) {
			if (deselect)
				this.setSelected(false);
			Base.splice(this._project.layers, null, this._index, 1);
			// Tell project we need a redraw. This is similar to _changed()
			// mechanism.
			this._project._needsRedraw();
			return true;
		}
		return false;
	},

	getNextSibling: function() {
		return this._parent ? this.base()
				: this._project.layers[this._index + 1] || null;
	},

	getPreviousSibling: function() {
		return this._parent ? this.base()
				: this._project.layers[this._index - 1] || null;
	},

	// DOCS: improve Layer#activate() example.
	/**
	 * Activates the layer.
	 *
	 * @example
	 * var layer = new Layer();
	 * layer.activate();
	 * console.log(project.activeLayer == layer); // true
	 */
	activate: function() {
		this._project.activeLayer = this;
	}
}, new function () {
	function insert(above) {
		return function(item) {
			// If the item is a layer and contained within Project#layers, use
			// our own version of move().
			if (item instanceof Layer && !item._parent
						&& this._remove(false, true)) {
				Base.splice(item._project.layers, [this],
						item._index + (above ? 1 : -1), 0);
				this._setProject(item._project);
				return true;
			}
			return this.base(item);
		};
	}

	return {
		insertAbove: insert(true),

		insertBelow: insert(false)
	};
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name PlacedItem
 *
 * @class The PlacedItem class is the base for any items that have a matrix
 * associated with them, describing their placement in the project, such as
 * {@link Raster} and {@link PlacedSymbol}.
 *
 * @extends Item
 */
var PlacedItem = this.PlacedItem = Item.extend(/** @lends PlacedItem# */{

	_transform: function(matrix, flags) {
		// In order to set the right context transformation when drawing the
		// raster, simply preconcatenate the internal matrix with the provided
		// one.
		this._matrix.preConcatenate(matrix);
	},

	/**
	 * The item's transformation matrix, defining position and dimensions in the
	 * document.
	 *
	 * @type Matrix
	 * @bean
	 */
	getMatrix: function() {
		return this._matrix;
	},

	setMatrix: function(matrix) {
		this._matrix = matrix.clone();
		this._changed(Change.GEOMETRY);
	},

	getStrokeBounds: function() {
		return this.getBounds();
	}
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Raster
 *
 * @class The Raster item represents an image in a Paper.js project.
 *
 * @extends PlacedItem
 */
var Raster = this.Raster = PlacedItem.extend(/** @lends Raster# */{
	// TODO: Implement url / type, width, height.
	// TODO: Have PlacedSymbol & Raster inherit from a shared class?
	// DOCS: Document Raster constructor.
	/**
	 * Creates a new raster item and places it in the active layer.
	 *
	 * @param {HTMLImageElement|Canvas|string} [object]
	 */
	initialize: function(object) {
		this.base();
		if (object.getContext) {
			this.setCanvas(object);
		} else {
			// If it's a string, get the element with this id first.
			if (typeof object === 'string')
				object = document.getElementById(object);
			this.setImage(object);
		}
		this._matrix = new Matrix();
	},

	clone: function() {
		var image = this._image;
		if (!image) {
			// If the Raster contains a Canvas object, we need to create
			// a new one and draw this raster's canvas on it.
			image = CanvasProvider.getCanvas(this._size);
			image.getContext('2d').drawImage(this._canvas, 0, 0);
		}
		var copy = new Raster(image);
		copy._matrix = this._matrix.clone();
		return this._clone(copy);
	},

	/**
	 * The size of the raster in pixels.
	 *
	 * @type Size
	 * @bean
	 */
	getSize: function() {
		return this._size;
	},

	setSize: function() {
		var size = Size.read(arguments),
			// Get reference to image before changing canvas
			image = this.getImage();
		// Setting canvas internally sets _size
		this.setCanvas(CanvasProvider.getCanvas(size));
		// Draw image back onto new canvas
		this.getContext(true).drawImage(image, 0, 0, size.width, size.height);
	},

	/**
	 * The width of the raster in pixels.
	 *
	 * @type Number
	 * @bean
	 */
	getWidth: function() {
		return this._size.width;
	},

	/**
	 * The height of the raster in pixels.
	 *
	 * @type Number
	 * @bean
	 */
	getHeight: function() {
		return this._size.height;
	},

	/**
	 * Pixels per inch of the raster at its current size.
	 *
	 * @type Size
	 * @bean
	 */
	getPpi: function() {
		var matrix = this._matrix,
			orig = new Point(0, 0).transform(matrix),
			u = new Point(1, 0).transform(matrix).subtract(orig),
			v = new Point(0, 1).transform(matrix).subtract(orig);
		return new Size(
			72 / u.getLength(),
			72 / v.getLength()
		);
	},

	/**
	 * The Canvas 2d drawing context of the raster.
	 *
	 * @type Context
	 * @bean
	 */
	getContext: function() {
		if (!this._context)
			this._context = this.getCanvas().getContext('2d');
		// Support a hidden parameter that indicates if the context will be used
		// to modify the Raster object. We can notify such changes ahead since
		// they are only used afterwards for redrawing.
		if (arguments[0])
			this._changed(Change.PIXELS);
		return this._context;
	},

	setContext: function(context) {
		this._context = context;
	},

	getCanvas: function() {
		if (!this._canvas) {
			this._canvas = CanvasProvider.getCanvas(this._size);
			if (this._image)
				this.getContext(true).drawImage(this._image, 0, 0);
		}
		return this._canvas;
	},

	setCanvas: function(canvas) {
		if (this._canvas)
			CanvasProvider.returnCanvas(this._canvas);
		this._canvas = canvas;
		this._size = new Size(canvas.width, canvas.height);
		this._image = null;
		this._context = null;
		this._changed(Change.GEOMETRY);
	},

	/**
	 * The HTMLImageElement or Canvas of the raster.
	 *
	 * @type HTMLImageElement|Canvas
	 * @bean
	 */
	getImage: function() {
		return this._image || this.getCanvas();
	},

	// TODO: Support string id of image element.
	setImage: function(image) {
		if (this._canvas)
			CanvasProvider.returnCanvas(this._canvas);
		this._image = image;
		// TODO: Cross browser compatible?
		this._size = new Size(image.naturalWidth, image.naturalHeight);
		this._canvas = null;
		this._context = null;
		this._changed(Change.GEOMETRY);
	},

	// DOCS: document Raster#getSubImage
	/**
	 * @param {Rectangle} rect the boundaries of the sub image in pixel
	 * coordinates
	 *
	 * @return {Canvas}
	 */
	getSubImage: function(rect) {
		rect = Rectangle.read(arguments);
		var canvas = CanvasProvider.getCanvas(rect.getSize());
		canvas.getContext('2d').drawImage(this.getCanvas(), rect.x, rect.y,
				canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
		return canvas;
	},

	/**
	 * Draws an image on the raster.
	 *
	 * @param {HTMLImageELement|Canvas} image
	 * @param {Point} point the offset of the image as a point in pixel
	 * coordinates
	 */
	drawImage: function(image, point) {
		point = Point.read(arguments, 1);
		this.getContext(true).drawImage(image, point.x, point.y);
	},

	/**
	 * Calculates the average color of the image within the given path,
	 * rectangle or point. This can be used for creating raster image
	 * effects.
	 *
	 * @param {Path|Rectangle|Point} object
	 * @return {RGBColor} the average color contained in the area covered by the
	 * specified path, rectangle or point.
	 */
	getAverageColor: function(object) {
		if (!object)
			object = this.getBounds();
		var bounds, path;
		if (object instanceof PathItem) {
			// TODO: What if the path is smaller than 1 px?
			// TODO: How about rounding of bounds.size?
			path = object;
			bounds = object.getBounds();
		} else if (object.width) {
			bounds = new Rectangle(object);
		} else if (object.x) {
			bounds = Rectangle.create(object.x - 0.5, object.y - 0.5, 1, 1);
		}
		// Use a sample size of max 32 x 32 pixels, into which the path is
		// scaled as a clipping path, and then the actual image is drawn in and
		// sampled.
		var sampleSize = 32,
			width = Math.min(bounds.width, sampleSize),
			height = Math.min(bounds.height, sampleSize);
		// Reuse the same sample context for speed. Memory consumption is low
		// since it's only 32 x 32 pixels.
		var ctx = Raster._sampleContext;
		if (!ctx) {
			ctx = Raster._sampleContext = CanvasProvider.getCanvas(
					new Size(sampleSize)).getContext('2d');
		} else {
			// Clear the sample canvas:
			ctx.clearRect(0, 0, sampleSize, sampleSize);
		}
		ctx.save();
		// Scale the context so that the bounds ends up at the given sample size
		ctx.scale(width / bounds.width, height / bounds.height);
		ctx.translate(-bounds.x, -bounds.y);
		// If a path was passed, draw it as a clipping mask:
		if (path)
			path.draw(ctx, { clip: true });
		// Now draw the image clipped into it.
		this._matrix.applyToContext(ctx);
		ctx.drawImage(this._canvas || this._image,
				-this._size.width / 2, -this._size.height / 2);
		ctx.restore();
		// Get pixel data from the context and calculate the average color value
		// from it, taking alpha into account.
		var pixels = ctx.getImageData(0.5, 0.5, Math.ceil(width),
				Math.ceil(height)).data,
			channels = [0, 0, 0],
			total = 0;
		for (var i = 0, l = pixels.length; i < l; i += 4) {
			var alpha = pixels[i + 3];
			total += alpha;
			alpha /= 255;
			channels[0] += pixels[i] * alpha;
			channels[1] += pixels[i + 1] * alpha;
			channels[2] += pixels[i + 2] * alpha;
		}
		for (var i = 0; i < 3; i++)
			channels[i] /= total;
		return total ? Color.read(channels) : null;
	},

	/**
	 * {@grouptitle Pixels}
	 * Gets the color of a pixel in the raster.
	 *
	 * @name Raster#getPixel
	 * @function
	 * @param x the x offset of the pixel in pixel coordinates
	 * @param y the y offset of the pixel in pixel coordinates
	 * @return {RGBColor} the color of the pixel
	 */
	/**
	 * Gets the color of a pixel in the raster.
	 *
	 * @name Raster#getPixel
	 * @function
	 * @param point the offset of the pixel as a point in pixel coordinates
	 * @return {RGBColor} the color of the pixel
	 */
	getPixel: function(point) {
		point = Point.read(arguments);
		var pixels = this.getContext().getImageData(point.x, point.y, 1, 1).data,
			channels = new Array(4);
		for (var i = 0; i < 4; i++)
			channels[i] = pixels[i] / 255;
		return RGBColor.read(channels);
	},

	/**
	 * Sets the color of the specified pixel to the specified color.
	 *
	 * @name Raster#setPixel
	 * @function
	 * @param x the x offset of the pixel in pixel coordinates
	 * @param y the y offset of the pixel in pixel coordinates
	 * @param color the color that the pixel will be set to
	 */
	/**
	 * Sets the color of the specified pixel to the specified color.
	 *
	 * @name Raster#setPixel
	 * @function
	 * @param point the offset of the pixel as a point in pixel coordinates
	 * @param color the color that the pixel will be set to
	 */
	setPixel: function(point, color) {
		var hasPoint = arguments.length == 2;
		point = Point.read(arguments, 0, hasPoint ? 1 : 2);
		color = Color.read(arguments, hasPoint ? 1 : 2);
		var ctx = this.getContext(true),
			imageData = ctx.createImageData(1, 1),
			alpha = color.getAlpha();
		imageData.data[0] = color.getRed() * 255;
		imageData.data[1] = color.getGreen() * 255;
		imageData.data[2] = color.getBlue() * 255;
		imageData.data[3] = alpha != null ? alpha * 255 : 255;
		ctx.putImageData(imageData, point.x, point.y);
	},

	// DOCS: document Raster#createData
	/**
	 * {@grouptitle Image Data}
	 * @param {Size} size
	 * @return {ImageData}
	 */
	createData: function(size) {
		size = Size.read(arguments);
		return this.getContext().createImageData(size.width, size.height);
	},

	// TODO: Rename to #get/setImageData, as it will conflict with Item#getData
	// DOCS: document Raster#getData
	/**
	 * @param {Rectangle} rect
	 * @return {ImageData}
	 */
	getData: function(rect) {
		rect = Rectangle.read(arguments);
		if (rect.isEmpty())
			rect = new Rectangle(this.getSize());
		return this.getContext().getImageData(rect.x, rect.y,
				rect.width, rect.height);
	},

	// DOCS: document Raster#setData
	/**
	 * @param {ImageData} data
	 * @param {Point} point
	 * @return {ImageData}
	 */
	setData: function(data, point) {
		point = Point.read(arguments, 1);
		this.getContext(true).putImageData(data, point.x, point.y);
	},

	getBounds: function() {
		if (!this._bounds)
			this._bounds = this._createBounds(this._matrix._transformBounds(
					new Rectangle(this._size).setCenter(0, 0)));
		return this._bounds;
	},

	draw: function(ctx, param) {
		if (param.selection) {
			var bounds = new Rectangle(this._size).setCenter(0, 0);
			Item.drawSelectedBounds(bounds, ctx, this._matrix);
		} else {
			ctx.save();
			this._matrix.applyToContext(ctx);
			ctx.drawImage(this._canvas || this._image,
					-this._size.width / 2, -this._size.height / 2);
			ctx.restore();
		}
	}
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name PlacedSymbol
 *
 * @class A PlacedSymbol represents an instance of a symbol which has been
 * placed in a Paper.js project.
 *
 * @extends PlacedItem
 */
var PlacedSymbol = this.PlacedSymbol = PlacedItem.extend(/** @lends PlacedSymbol# */{
	/**
	 * Creates a new PlacedSymbol Item.
	 *
	 * @param {Symbol} symbol the symbol to place
	 * @param {Point|Matrix} [matrixOrOffset] the center point of the placed
	 * symbol or a {@link Matrix} transformation to transform the placed symbol
	 * with.
	 *
	 * @example {@paperscript split=true height=240}
	 * // Placing 100 instances of a symbol:
	 * var path = new Path.Star(new Point(0, 0), 6, 5, 13);
	 * path.style = {
	 *     fillColor: 'white',
	 *     strokeColor: 'black'
	 * };
     *
	 * // Create a symbol from the path:
	 * var symbol = new Symbol(path);
	 *
	 * // Remove the path:
	 * path.remove();
     *
	 * // Place 100 instances of the symbol:
	 * for (var i = 0; i < 100; i++) {
	 *     // Place an instance of the symbol in the project:
	 *     var instance = new PlacedSymbol(symbol);
     *
	 *     // Move the instance to a random position within the view:
	 *     instance.position = Point.random() * view.size;
     *
	 *     // Rotate the instance by a random amount between
	 *     // 0 and 360 degrees:
	 *     instance.rotate(Math.random() * 360);
     *
	 *     // Scale the instance between 0.25 and 1:
	 *     instance.scale(0.25 + Math.random() * 0.75);
	 * }
	 */
	initialize: function(symbol, matrixOrOffset) {
		this.base();
		this.symbol = symbol instanceof Symbol ? symbol : new Symbol(symbol);
		this._matrix = matrixOrOffset !== undefined
			? matrixOrOffset instanceof Matrix
				? matrixOrOffset
				: new Matrix().translate(Point.read(arguments, 1))
			: new Matrix();
	},

	/**
	 * The symbol that the placed symbol refers to:
	 *
	 * @name PlacedSymbol#symbol
	 * @type Symbol
	 */

	clone: function() {
		return this._clone(new PlacedSymbol(this.symbol, this._matrix.clone()));
	},

	getBounds: function() {
		if (!this._bounds)
			this._bounds = this._createBounds(
					this.symbol._definition.getStrokeBounds(this._matrix))
		return this._bounds;
	},

	draw: function(ctx, param) {
		if (param.selection) {
			Item.drawSelectedBounds(this.symbol._definition.getStrokeBounds(),
					ctx, this._matrix);
		} else {
			ctx.save();
			this._matrix.applyToContext(ctx);
			Item.draw(this.symbol.getDefinition(), ctx, param);
			ctx.restore();
		}
	}

	// TODO: PlacedSymbol#embed()
});

/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Segment
 *
 * @class The Segment object represents the points of a path through which its
 * {@link Curve} objects pass. The segments of a path can be accessed through
 * its {@link Path#segments} array.
 *
 * Each segment consists of an anchor point ({@link Segment#point}) and
 * optionaly an incoming and an outgoing handle ({@link Segment#handleIn} and
 * {@link Segment#handleOut}), describing the tangents of the two {@link Curve}
 * objects that are connected by this segment.
 */
var Segment = this.Segment = Base.extend(/** @lends Segment# */{
	/**
	 * Creates a new Segment object.
	 *
	 * @param {Point} [point={x: 0, y: 0}] the anchor point of the segment
	 * @param {Point} [handleIn={x: 0, y: 0}] the handle point relative to the
	 *        anchor point of the segment that describes the in tangent of the
	 *        segment.
	 * @param {Point} [handleOut={x: 0, y: 0}] the handle point relative to the
	 *        anchor point of the segment that describes the out tangent of the
	 *        segment.
	 *
	 * @example {@paperscript}
	 * var handleIn = new Point(-80, -100);
	 * var handleOut = new Point(80, 100);
	 *
	 * var firstPoint = new Point(100, 50);
	 * var firstSegment = new Segment(firstPoint, null, handleOut);
	 *
	 * var secondPoint = new Point(300, 50);
	 * var secondSegment = new Segment(secondPoint, handleIn, null);
	 *
	 * var path = new Path(firstSegment, secondSegment);
	 * path.strokeColor = 'black';
	 */
	initialize: function(arg0, arg1, arg2, arg3, arg4, arg5) {
		var count = arguments.length,
			createPoint = SegmentPoint.create,
			point, handleIn, handleOut;
		if (count == 0) {
			// Nothing
		} else if (count == 1) {
			// TODO: If beans are not activated, this won't copy from existing
			// segments. OK?
			if (arg0.point) {
				point = arg0.point;
				handleIn = arg0.handleIn;
				handleOut = arg0.handleOut;
			} else {
				point = arg0;
			}
		} else if (count < 6) {
			if (count == 2 && arg1.x === undefined) {
				point = [ arg0, arg1 ];
			} else {
				point = arg0;
				// Doesn't matter if these arguments exist, SegmentPointcreate
				// produces creates points with (0, 0) otherwise
				handleIn = arg1;
				handleOut = arg2;
			}
		} else if (count == 6) {
			point = [ arg0, arg1 ];
			handleIn = [ arg2, arg3 ];
			handleOut = [ arg4, arg5 ];
		}
		createPoint(this, '_point', point);
		createPoint(this, '_handleIn', handleIn);
		createPoint(this, '_handleOut', handleOut);
	},

	_changed: function(point) {
		if (!this._path)
			return;
		// Delegate changes to affected curves if they exist
		var curve = this._path._curves && this.getCurve(), other;
		if (curve) {
			curve._changed();
			// Get the other affected curve, which is the previous one for
			// _point or _handleIn changing when this segment is _segment1 of
			// the curve, for all other cases it's the next (e.g. _handleOut
			// when this segment is _segment2)
			if (other = (curve[point == this._point
					|| point == this._handleIn && curve._segment1 == this
					? 'getPrevious' : 'getNext']())) {
				other._changed();
			}
		}
		this._path._changed(Change.GEOMETRY);
	},

	/**
	 * The anchor point of the segment.
	 *
	 * @type Point
	 * @bean
	 */
	getPoint: function() {
		return this._point;
	},

	setPoint: function(point) {
		point = Point.read(arguments);
		// Do not replace the internal object but update it instead, so
		// references to it are kept alive.
		this._point.set(point.x, point.y);
	},

	/**
	 * The handle point relative to the anchor point of the segment that
	 * describes the in tangent of the segment.
	 *
	 * @type Point
	 * @bean
	 */
	getHandleIn: function() {
		return this._handleIn;
	},

	setHandleIn: function(point) {
		point = Point.read(arguments);
		// See #setPoint:
		this._handleIn.set(point.x, point.y);
		// Update corner accordingly
		// this.corner = !this._handleIn.isColinear(this._handleOut);
	},

	/**
	 * The handle point relative to the anchor point of the segment that
	 * describes the out tangent of the segment.
	 *
	 * @type Point
	 * @bean
	 */
	getHandleOut: function() {
		return this._handleOut;
	},

	setHandleOut: function(point) {
		point = Point.read(arguments);
		// See #setPoint:
		this._handleOut.set(point.x, point.y);
		// Update corner accordingly
		// this.corner = !this._handleIn.isColinear(this._handleOut);
	},

	_isSelected: function(point) {
		var state = this._selectionState;
		return point == this._point ? !!(state & SelectionState.POINT)
			: point == this._handleIn ? !!(state & SelectionState.HANDLE_IN)
			: point == this._handleOut ? !!(state & SelectionState.HANDLE_OUT)
			: false;
	},

	_setSelected: function(point, selected) {
		var path = this._path,
			selected = !!selected, // convert to boolean
			state = this._selectionState || 0,
			// For performance reasons use array indices to access the various
			// selection states: 0 = point, 1 = handleIn, 2 = handleOut
			selection = [
				!!(state & SelectionState.POINT),
				!!(state & SelectionState.HANDLE_IN),
				!!(state & SelectionState.HANDLE_OUT)
			];
		if (point == this._point) {
			if (selected) {
				// We're selecting point, deselect the handles
				selection[1] = selection[2] = false;
			} else {
				var previous = this.getPrevious(),
					next = this.getNext();
				// When deselecting a point, the handles get selected instead
				// depending on the selection state of their neighbors.
				selection[1] = previous && (previous._point.isSelected()
						|| previous._handleOut.isSelected());
				selection[2] = next && (next._point.isSelected()
						|| next._handleIn.isSelected());
			}
			selection[0] = selected;
		} else {
			var index = point == this._handleIn ? 1 : 2;
			if (selection[index] != selected) {
				// When selecting handles, the point get deselected.
				if (selected)
					selection[0] = false;
				selection[index] = selected;
			}
		}
		this._selectionState = (selection[0] ? SelectionState.POINT : 0)
				| (selection[1] ? SelectionState.HANDLE_IN : 0)
				| (selection[2] ? SelectionState.HANDLE_OUT : 0);
		// If the selection state of the segment has changed, we need to let
		// it's path know and possibly add or remove it from
		// project._selectedItems
		if (path && state != this._selectionState)
			path._updateSelection(this, state, this._selectionState);
	},

	/**
	 * Specifies whether the {@link #point} of the segment is selected.
	 * @type Boolean
	 * @bean
	 */
	isSelected: function() {
		return this._isSelected(this._point);
	},

	setSelected: function(selected) {
		this._setSelected(this._point, selected);
	},

	/**
	 * {@grouptitle Hierarchy}
	 *
	 * The index of the segment in the {@link Path#segments} array that the
	 * segment belongs to.
	 *
	 * @type Number
	 * @bean
	 */
	getIndex: function() {
		return this._index !== undefined ? this._index : null;
	},

	/**
	 * The path that the segment belongs to.
	 *
	 * @type Path
	 * @bean
	 */
	getPath: function() {
		return this._path || null;
	},

	/**
	 * The curve that the segment belongs to.
	 *
	 * @type Curve
	 * @bean
	 */
	getCurve: function() {
		if (this._path) {
			var index = this._index;
			// The last segment of an open path belongs to the last curve
			if (!this._path._closed && index == this._path._segments.length - 1)
				index--;
			return this._path.getCurves()[index] || null;
		}
		return null;
	},

	/**
	 * {@grouptitle Sibling Segments}
	 *
	 * The next segment in the {@link Path#segments} array that the segment
	 * belongs to. If the segments belongs to a closed path, the first segment
	 * is returned for the last segment of the path.
	 *
	 * @type Segment
	 * @bean
	 */
	getNext: function() {
		var segments = this._path && this._path._segments;
		return segments && (segments[this._index + 1]
				|| this._path._closed && segments[0]) || null;
	},

	/**
	 * The previous segment in the {@link Path#segments} array that the
	 * segment belongs to. If the segments belongs to a closed path, the last
	 * segment is returned for the first segment of the path.
	 *
	 * @type Segment
	 * @bean
	 */
	getPrevious: function() {
		var segments = this._path && this._path._segments;
		return segments && (segments[this._index - 1]
				|| this._path._closed && segments[segments.length - 1]) || null;
	},

	/**
	 * Returns the reversed the segment, without modifying the segment itself.
	 * @return {Segment} the reversed segment
	 */
	reverse: function() {
		return new Segment(this._point, this._handleOut, this._handleIn);
	},

	/**
	 * Removes the segment from the path that it belongs to.
	 */
	remove: function() {
		return this._path ? !!this._path.removeSegment(this._index) : false;
	},

	/**
	 * @return {String} A string representation of the segment.
	 */
	toString: function() {
		var parts = [ 'point: ' + this._point ];
		if (!this._handleIn.isZero())
			parts.push('handleIn: ' + this._handleIn);
		if (!this._handleOut.isZero())
			parts.push('handleOut: ' + this._handleOut);
		return '{ ' + parts.join(', ') + ' }';
	},

	_transformCoordinates: function(matrix, coords, change) {
		// Use matrix.transform version() that takes arrays of multiple
		// points for largely improved performance, as no calls to
		// Point.read() and Point constructors are necessary.
		var point = this._point,
			// If a matrix is defined, only transform handles if they are set.
			// This saves some computation time. If no matrix is set, always
			// use the real handles, as we just want to receive a filled
			// coords array for getBounds().
			handleIn =  !matrix || !this._handleIn.isZero()
					? this._handleIn : null,
			handleOut = !matrix || !this._handleOut.isZero()
					? this._handleOut : null,
			x = point._x,
			y = point._y,
			i = 2;
		coords[0] = x;
		coords[1] = y;
		// We need to convert handles to absolute coordinates in order
		// to transform them.
		if (handleIn) {
			coords[i++] = handleIn._x + x;
			coords[i++] = handleIn._y + y;
		}
		if (handleOut) {
			coords[i++] = handleOut._x + x;
			coords[i++] = handleOut._y + y;
		}
		if (matrix) {
			matrix._transformCoordinates(coords, 0, coords, 0, i / 2);
			x = coords[0];
			y = coords[1];
			if (change) {
				// If change is true, we need to set the new values back
				point._x = x;
				point._y = y;
				i  = 2;
				if (handleIn) {
					handleIn._x = coords[i++] - x;
					handleIn._y = coords[i++] - y;
				}
				if (handleOut) {
					handleOut._x = coords[i++] - x;
					handleOut._y = coords[i++] - y;
				}
			} else {
				// We want to receive the results in coords, so make sure
				// handleIn and out are defined too, even if they're 0
				if (!handleIn) {
					coords[i++] = x;
					coords[i++] = y;
				}
				if (!handleOut) {
					coords[i++] = x;
					coords[i++] = y;
				}
			}
		}
	}
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name SegmentPoint
 * @class An internal version of Point that notifies its segment of each change
 * Note: This prototype is not exported.
 *
 * @private
 */
var SegmentPoint = Point.extend({
	set: function(x, y) {
		this._x = x;
		this._y = y;
		this._owner._changed(this);
		return this;
	},

	getX: function() {
		return this._x;
	},

	setX: function(x) {
		this._x = x;
		this._owner._changed(this);
	},

	getY: function() {
		return this._y;
	},

	setY: function(y) {
		this._y = y;
		this._owner._changed(this);
	},

	setSelected: function(selected) {
		this._owner._setSelected(this, selected);
	},

	isSelected: function() {
		return this._owner._isSelected(this);
	},

	statics: {
		create: function(segment, key, pt) {
			var point = new SegmentPoint(SegmentPoint.dont),
				x, y, selected;
			if (!pt) {
				x = y = 0;
			} else if (pt.x !== undefined) {
				x = pt.x;
				y = pt.y;
				selected = pt.selected;
			} else {
				x = pt[0];
				y = pt[1];
			}
			point._x = x;
			point._y = y;
			point._owner = segment;
			// We need to set the point on the segment before copying over the
			// selected state, as otherwise this won't actually select it.
			segment[key] = point;
			if (selected)
				point.setSelected(true);
			return point;
		}
	}
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

// These values are ordered so that SelectionState.POINT has the highest value.
// As Path#_selectedSegmentState is the addition of all segment's states, and is
// used to see if all segments are fully selected, meaning they are set to
// SelectionState.POINT.
var SelectionState = {
	HANDLE_IN: 1,
	HANDLE_OUT: 2,
	POINT: 4
};
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Curve
 *
 * @class The Curve object represents the parts of a path that are connected by
 * two following {@link Segment} objects. The curves of a path can be accessed
 * through its {@link Path#curves} array.
 *
 * While a segment describe the anchor point and its incoming and outgoing
 * handles, a Curve object describes the curve passing between two such
 * segments. Curves and segments represent two different ways of looking at the
 * same thing, but focusing on different aspects. Curves for example offer many
 * convenient ways to work with parts of the path, finding lengths, positions or
 * tangents at given offsets.
 */
var Curve = this.Curve = Base.extend(/** @lends Curve# */{
	/**
	 * Creates a new curve object.
	 *
	 * @param {Segment} segment1
	 * @param {Segment} segment2
	 */
	initialize: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
		var count = arguments.length;
		if (count == 0) {
			this._segment1 = new Segment();
			this._segment2 = new Segment();
		} else if (count == 1) {
			// TODO: If beans are not activated, this won't copy from
			// an existing segment. OK?
			this._segment1 = new Segment(arg0.segment1);
			this._segment2 = new Segment(arg0.segment2);
		} else if (count == 2) {
			this._segment1 = new Segment(arg0);
			this._segment2 = new Segment(arg1);
		} else if (count == 4) {
			this._segment1 = new Segment(arg0, null, arg1);
			this._segment2 = new Segment(arg3, arg2, null);
		} else if (count == 8) {
			// An array as returned by getValues
			var p1 = Point.create(arg0, arg1),
				p2 = Point.create(arg6, arg7);
			this._segment1 = new Segment(p1, null,
					Point.create(arg2, arg3).subtract(p1));
			this._segment2 = new Segment(p2,
					Point.create(arg4, arg5).subtract(p2), null);
		}
	},

	_changed: function() {
		// Clear cached values.
		delete this._length;
	},

	/**
	 * The first anchor point of the curve.
	 *
	 * @type Point
	 * @bean
	 */
	getPoint1: function() {
		return this._segment1._point;
	},

	setPoint1: function(point) {
		point = Point.read(arguments);
		this._segment1._point.set(point.x, point.y);
	},

	/**
	 * The second anchor point of the curve.
	 *
	 * @type Point
	 * @bean
	 */
	getPoint2: function() {
		return this._segment2._point;
	},

	setPoint2: function(point) {
		point = Point.read(arguments);
		this._segment2._point.set(point.x, point.y);
	},

	/**
	 * The handle point that describes the tangent in the first anchor point.
	 *
	 * @type Point
	 * @bean
	 */
	getHandle1: function() {
		return this._segment1._handleOut;
	},

	setHandle1: function(point) {
		point = Point.read(arguments);
		this._segment1._handleOut.set(point.x, point.y);
	},

	/**
	 * The handle point that describes the tangent in the second anchor point.
	 *
	 * @type Point
	 * @bean
	 */
	getHandle2: function() {
		return this._segment2._handleIn;
	},

	setHandle2: function(point) {
		point = Point.read(arguments);
		this._segment2._handleIn.set(point.x, point.y);
	},

	/**
	 * The first segment of the curve.
	 *
	 * @type Segment
	 * @bean
	 */
	getSegment1: function() {
		return this._segment1;
	},

	/**
	 * The second segment of the curve.
	 *
	 * @type Segment
	 * @bean
	 */
	getSegment2: function() {
		return this._segment2;
	},

	/**
	 * The path that the curve belongs to.
	 *
	 * @type Path
	 * @bean
	 */
	getPath: function() {
		return this._path;
	},

	/**
	 * The index of the curve in the {@link Path#curves} array.
	 *
	 * @type Number
	 * @bean
	 */
	getIndex: function() {
		return this._segment1._index;
	},

	/**
	 * The next curve in the {@link Path#curves} array that the curve
	 * belongs to.
	 *
	 * @type Curve
	 * @bean
	 */
	getNext: function() {
		var curves = this._path && this._path._curves;
		return curves && (curves[this._segment1._index + 1]
				|| this._path._closed && curves[0]) || null;
	},

	/**
	 * The previous curve in the {@link Path#curves} array that the curve
	 * belongs to.
	 *
	 * @type Curve
	 * @bean
	 */
	getPrevious: function() {
		var curves = this._path && this._path._curves;
		return curves && (curves[this._segment1._index - 1]
				|| this._path._closed && curves[curves.length - 1]) || null;
	},

	/**
	 * Specifies whether the handles of the curve are selected.
	 *
	 * @type Boolean
	 * @bean
	 */
	isSelected: function() {
		return this.getHandle1().isSelected() && this.getHandle2().isSelected();
	},

	setSelected: function(selected) {
		this.getHandle1().setSelected(selected);
		this.getHandle2().setSelected(selected);
	},

	getValues: function() {
		return Curve.getValues(this._segment1, this._segment2);
	},

	// DOCS: document Curve#getLength(from, to)
	/**
	 * The approximated length of the curve in points.
	 *
	 * @type Number
	 * @bean
	 */
	getLength: function(/* from, to */) {
		var from = arguments[0],
			to = arguments[1];
			fullLength = arguments.length == 0 || from == 0 && to == 1;
		if (fullLength && this._length != null)
			return this._length;
		// Hide parameters from Bootstrap so it injects bean too
		var args = this.getValues();
		if (!fullLength)
			args.push(from, to);
		var length = Curve.getLength.apply(Curve, args);
		if (fullLength)
			this._length = length;
		return length;
	},

	getPart: function(from, to) {
		var args = this.getValues();
		args.push(from, to);
		return new Curve(Curve.getPart.apply(Curve, args));
	},

	/**
	 * Checks if this curve is linear, meaning it does not define any curve
	 * handle.

	 * @return {Boolean} {@true the curve is linear}
	 */
	isLinear: function() {
		return this._segment1._handleOut.isZero()
				&& this._segment2._handleIn.isZero();
	},

	// PORT: Add support for start parameter to Sg
	// DOCS: document Curve#getParameter(length, start)
	/**
	 * @param {Number} length
	 * @param {Number} [start]
	 * @return {Boolean} {@true the curve is linear}
	 */
	getParameter: function(length, start) {
		var args = this.getValues();
		args.push(length, start !== undefined ? start : length < 0 ? 1 : 0);
		return Curve.getParameter.apply(Curve, args);
	},

	_evaluate: function(parameter, type) {
		var args = this.getValues();
		args.push(parameter, type);
		return Curve.evaluate.apply(Curve, args);
	},

	/**
	 * Returns the point on the curve at the specified position.
	 *
	 * @param {Number} parameter the position at which to find the point as
	 *                 a value between {@code 0} and {@code 1}.
	 * @return {Point}
	 */
	getPoint: function(parameter) {
		return this._evaluate(parameter, 0);
	},

	/**
	 * Returns the tangent point on the curve at the specified position.
	 *
	 * @param {Number} parameter the position at which to find the tangent
	 *                 point as a value between {@code 0} and {@code 1}.
	 */
	getTangent: function(parameter) {
		return this._evaluate(parameter, 1);
	},

	/**
	 * Returns the normal point on the curve at the specified position.
	 *
	 * @param {Number} parameter the position at which to find the normal
	 *                 point as a value between {@code 0} and {@code 1}.
	 */
	getNormal: function(parameter) {
		return this._evaluate(parameter, 2);
	},

	// TODO: getParameter(point, precision)
	// TODO: getLocation
	// TODO: getIntersections
	// TODO: adjustThroughPoint

	/**
	 * Returns a reversed version of the curve, without modifying the curve
	 * itself.
	 *
	 * @return {Curve} a reversed version of the curve
	 */
	reverse: function() {
		return new Curve(this._segment2.reverse(), this._segment1.reverse());
	},

	// TODO: divide
	// TODO: split

	/**
	 * Returns a copy of the curve.
	 *
	 * @return {Curve}
	 */
	clone: function() {
		return new Curve(this._segment1, this._segment2);
	},

	/**
	 * @return {String} A string representation of the curve.
	 */
	toString: function() {
		var parts = [ 'point1: ' + this._segment1._point ];
		if (!this._segment1._handleOut.isZero())
			parts.push('handle1: ' + this._segment1._handleOut);
		if (!this._segment2._handleIn.isZero())
			parts.push('handle2: ' + this._segment2._handleIn);
		parts.push('point2: ' + this._segment2._point);
		return '{ ' + parts.join(', ') + ' }';
	},

	statics: {
		create: function(path, segment1, segment2) {
			var curve = new Curve(Curve.dont);
			curve._path = path;
			curve._segment1 = segment1;
			curve._segment2 = segment2;
			return curve;
		},

		getValues: function(segment1, segment2) {
			var p1 = segment1._point,
				h1 = segment1._handleOut,
				h2 = segment2._handleIn,
				p2 = segment2._point;
			return [
				p1._x, p1._y,
				p1._x + h1._x, p1._y + h1._y,
				p2._x + h2._x, p2._y + h2._y,
				p2._x, p2._y
			];
		},

		evaluate: function(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t, type) {
			var x, y;

			// Handle special case at beginning / end of curve
			// PORT: Change in Sg too, so 0.000000000001 won't be
			// required anymore
			if (t == 0 || t == 1) {
				var point;
				switch (type) {
				case 0: // point
					x = t == 0 ? p1x : p2x;
					y = t == 0 ? p1y : p2y;
					break;
				case 1: // tangent
				case 2: // normal
					var px, py;
					if (t == 0) {
						if (c1x == p1x && c1y == p1y) { // handle1 = 0
							if (c2x == p2x && c2y == p2y) { // handle2 = 0
								px = p2x; py = p2y; // p2
							} else {
								px = c2x; py = c2y; // c2
							}
						} else {
							px = c1x; py = c1y; // handle1
						}
						x = px - p1x;
						y = py - p1y;
					} else {
						if (c2x == p2x && c2y == p2y) { // handle2 = 0
							if (c1x == p1x && c1y == p1y) { // handle1 = 0
								px = p1x; py = p1y; // p1
							} else {
								px = c1x; py = c1y; // c1
							}
						} else { // handle2
							px = c2x; py = c2y;
						}
						x = p2x - px;
						y = p2y - py;
					}
					break;
				}
			} else {
				// Calculate the polynomial coefficients.
				var cx = 3 * (c1x - p1x),
					bx = 3 * (c2x - c1x) - cx,
					ax = p2x - p1x - cx - bx,

					cy = 3 * (c1y - p1y),
					by = 3 * (c2y - c1y) - cy,
					ay = p2y - p1y - cy - by;

				switch (type) {
				case 0: // point
					// Calculate the curve point at parameter value t
					x = ((ax * t + bx) * t + cx) * t + p1x;
					y = ((ay * t + by) * t + cy) * t + p1y;
					break;
				case 1: // tangent
				case 2: // normal
					// Simply use the derivation of the bezier function for both
					// the x and y coordinates:
					x = (3 * ax * t + 2 * bx) * t + cx;
					y = (3 * ay * t + 2 * by) * t + cy;
					break;
				}
			}
			// The normal is simply the rotated tangent:
			// TODO: Rotate normals the other way in Scriptographer too?
			// (Depending on orientation, I guess?)
			return type == 2 ? new Point(y, -x) : new Point(x, y);
		},

		subdivide: function(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
			if (t === undefined)
				t = 0.5;
			var u = 1 - t,
				// Interpolate from 4 to 3 points
				p3x = u * p1x + t * c1x,
				p3y = u * p1y + t * c1y,
				p4x = u * c1x + t * c2x,
				p4y = u * c1y + t * c2y,
				p5x = u * c2x + t * p2x,
				p5y = u * c2y + t * p2y,
				// Interpolate from 3 to 2 points
				p6x = u * p3x + t * p4x,
				p6y = u * p3y + t * p4y,
				p7x = u * p4x + t * p5x,
				p7y = u * p4y + t * p5y,
				// Interpolate from 2 points to 1 point
				p8x = u * p6x + t * p7x,
				p8y = u * p6y + t * p7y;
			// We now have all the values we need to build the subcurves:
			return [
				[p1x, p1y, p3x, p3y, p6x, p6y, p8x, p8y], // left
				[p8x, p8y, p7x, p7y, p5x, p5y, p2x, p2y] // right
			];
		},

		// TODO: Find better name
		getPart: function(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, from, to) {
			var curve = [p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y];
			if (from > 0) {
				// 8th argument of Curve.subdivide() == t, and values can be
				// directly used as arguments list for apply().
				curve[8] = from;
				curve = Curve.subdivide.apply(Curve, curve)[1]; // right
			}
			if (to < 1) {
				// Se above about curve[8].
				// Interpolate the  parameter at 'to' in the new curve and
				// cut there
				curve[8] = (to - from) / (1 - from);
				curve = Curve.subdivide.apply(Curve, curve)[0]; // left
			}
			return curve;
		},

		isSufficientlyFlat: function(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
			// Inspired by Skia, but to be tested:
			// Calculate 1/3 (m1) and 2/3 (m2) along the line between start (p1)
			// and end (p2), measure distance from there the control points and
			// see if they are further away than 1/2.
			// Seems all very inaccurate, especially since the distance
			// measurement is just the bigger one of x / y...
			// TODO: Find a more accurate and still fast way to determine this.
			var vx = (p2x - p1x) / 3,
				vy = (p2y - p1y) / 3,
				m1x = p1x + vx,
				m1y = p1y + vy,
				m2x = p2x - vx,
				m2y = p2y - vy;
			return Math.max(
					Math.abs(m1x - c1x), Math.abs(m1y - c1y),
					Math.abs(m2x - c1x), Math.abs(m1y - c1y)) < 1 / 2;
			/*
			// Thanks to Kaspar Fischer for the following:
			// http://www.inf.ethz.ch/personal/fischerk/pubs/bez.pdf
			var ux = 3 * c1x - 2 * p1x - p2x;
			ux *= ux;
			var uy = 3 * c1y - 2 * p1y - p2y;
			uy *= uy;
			var vx = 3 * c2x - 2 * p2x - p1x;
			vx *= vx;
			var vy = 3 * c2y - 2 * p2y - p1y;
			vy *= vy;
			if (ux < vx)
				ux = vx;
			if (uy < vy)
				uy = vy;
			// Tolerance is 16 * tol ^ 2
			return ux + uy <= 16 * Numerical.TOLERNACE * Numerical.TOLERNACE;
			*/
		}
	}
}, new function() { // Scope for methods that require numerical integration

	function getLengthIntegrand(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
		// Calculate the coefficients of a Bezier derivative.
		var ax = 9 * (c1x - c2x) + 3 * (p2x - p1x),
			bx = 6 * (p1x + c2x) - 12 * c1x,
			cx = 3 * (c1x - p1x),

			ay = 9 * (c1y - c2y) + 3 * (p2y - p1y),
			by = 6 * (p1y + c2y) - 12 * c1y,
			cy = 3 * (c1y - p1y);

		return function(t) {
			// Calculate quadratic equations of derivatives for x and y
			var dx = (ax * t + bx) * t + cx,
				dy = (ay * t + by) * t + cy;
			return Math.sqrt(dx * dx + dy * dy);
		};
	}

	// Amount of integral evaluations for the interval 0 <= a < b <= 1
	function getIterations(a, b) {
		// Guess required precision based and size of range...
		// TODO: There should be much better educated guesses for
		// this. Also, what does this depend on? Required precision?
		return Math.max(2, Math.min(16, Math.ceil(Math.abs(b - a) * 32)));
	}

	return {
		statics: true,

		getLength: function(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, a, b) {
			if (a === undefined)
				a = 0;
			if (b === undefined)
				b = 1;
			if (p1x == c1x && p1y == c1y && p2x == c2x && p2y == c2y) {
				// Straight line
				var dx = p2x - p1x,
					dy = p2y - p1y;
				return (b - a) * Math.sqrt(dx * dx + dy * dy);
			}
			var ds = getLengthIntegrand(
					p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y);
			return Numerical.integrate(ds, a, b, getIterations(a, b));
		},

		getParameter: function(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y,
				length, start) {
			if (length == 0)
				return start;
			// See if we're going forward or backward, and handle cases
			// differently
			var forward = length > 0,
				a = forward ? start : 0,
				b = forward ? 1 : start,
				length = Math.abs(length),
				// Use integrand to calculate both range length and part
				// lengths in f(t) below.
				ds = getLengthIntegrand(
						p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y),
				// Get length of total range
				rangeLength = Numerical.integrate(ds, a, b,
						getIterations(a, b));
			if (length >= rangeLength)
				return forward ? b : a;
			// Use length / rangeLength for an initial guess for t, to
			// bring us closer:
			var guess = length / rangeLength,
				len = 0;
			// Iteratively calculate curve range lengths, and add them up,
			// using integration precision depending on the size of the
			// range. This is much faster and also more precise than not
			// modifing start and calculating total length each time.
			function f(t) {
				var count = getIterations(start, t);
				if (start < t) {
					len += Numerical.integrate(ds, start, t, count);
				} else {
					len -= Numerical.integrate(ds, t, start, count);
				}
				start = t;
				return len - length;
			}
			return Numerical.findRoot(f, ds,
					forward ? a + guess : b - guess, // Initial guess for x
					a, b, 16, Numerical.TOLERANCE);
		}
	};
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name CurveLocation
 *
 * @class CurveLocation objects describe a location on {@link Curve}
 * objects, as defined by the curve {@link #parameter}, a value between
 * {@code 0} (beginning of the curve) and {@code 1} (end of the curve). If
 * the curve is part of a {@link Path} item, its {@link #index} inside the
 * {@link Path#curves} array is also provided.
 */
CurveLocation = Base.extend(/** @lends CurveLocation# */{
	// DOCS: CurveLocation class description: add this comment back when the
	// mentioned functioned have been added:
	// The class is in use in many places, such as {@link Path#getLocationAt(offset)},
	// {@link Path#getLength(CurveLocation)}, {@link Path#getPoint(length)},
	// {@link Path#split(CurveLocation)},
	// {@link PathItem#getIntersections(PathItem)}, etc.
	/**
	 * Creates a new CurveLocation object.
	 *
	 * @param {Curve} curve
	 * @param {Number} parameter
	 * @param {Point} point
	 */
	initialize: function(curve, parameter, point) {
		this._curve = curve;
		this._parameter = parameter;
		this._point = point;
	},

	/**
	 * The segment of the curve which is closer to the described location.
	 *
	 * @type Segment
	 * @bean
	 */
	getSegment: function() {
		if (!this._segment) {
			var parameter = this.getParameter();
			if (parameter == 0) {
				this._segment = curve._segment1;
			} else if (parameter == 1) {
				this._segment = curve._segment2;
			} else if (parameter == null) {
				return null;
			} else {
				// Determine the closest segment by comparing curve lengths
				this._segment = curve.getLength(0, parameter)
					< curve.getLength(parameter, 1)
						? curve._segment1
						: curve._segment2;
			}
		}
		return this._segment;
	},

	/**
	 * The curve by which the location is defined.
	 *
	 * @type Curve
	 * @bean
	 */
	getCurve: function() {
		return this._curve;
	},

	/**
	 * The item this curve belongs to, if any.
	 *
	 * @type Item
	 * @bean
	 */
	getItem: function() {
		return this._curve && this._curve._path;
	},

	/**
	 * The index of the curve within the {@link Path#curves} list, if the
	 * curve is part of a {@link Path} item.
	 *
	 * @type Index
	 * @bean
	 */
	getIndex: function() {
		return this._curve && this._curve.getIndex();
	},

	/**
	 * The length of the path from its beginning up to the location described
	 * by this object.
	 *
	 * @type Number
	 * @bean
	 */
	getOffset: function() {
		var path = this._curve && this._curve._path;
		return path && path._getOffset(this);
	},

	/**
	 * The length of the curve from its beginning up to the location described
	 * by this object.
	 *
	 * @type Number
	 * @bean
	 */
	getCurveOffset: function() {
		var parameter = this._curve && this.getParameter();
		return parameter != null ? this._curve.getLength(0, parameter) : null;
	},

	/**
	 * The curve parameter, as used by various bezier curve calculations. It is
	 * value between {@code 0} (beginning of the curve) and {@code 1} (end of
	 * the curve).
	 *
	 * @type Number
	 * @bean
	 */
	getParameter: function() {
		if (this._parameter == null && this._point)
			this._parameter = this._curve.getParameter(this._point);
		return this._parameter;
	},

	/**
	 * The point which is defined by the {@link #curve} and
	 * {@link #parameter}.
	 *
	 * @type Point
	 * @bean
	 */
	getPoint: function() {
		if (!this._point && this._curve) {
			var parameter = this.getParameter();
			if (parameter != null)
				this._point = this._curve.getPoint(parameter);
		}
		return this._point;
	},

	/**
	 * The tangential vector to the {@link #curve} at the given location.
	 *
	 * @type Point
	 * @bean
	 */
	getTangent: function() {
		var parameter = this.getParameter();
		return parameter != null && this._curve
				&& this._curve.getTangent(parameter);
	},

	/**
	 * The normal vector to the {@link #curve} at the given location.
	 *
	 * @type Point
	 * @bean
	 */
	getNormal: function() {
		var parameter = this.getParameter();
		return parameter != null && this._curve
				&& this._curve.getNormal(parameter);
	},

	/**
	 * @return {String} A string representation of the curve location.
	 */
	toString: function() {
		var parts = [],
			point = this.getPoint();
		if (point)
			parts.push('point: ' + point);
		var index = this.getIndex();
		if (index != null)
			parts.push('index: ' + index);
		var parameter = this.getParameter();
		if (parameter != null)
			parts.push('parameter: ' + Base.formatNumber(parameter));
		return '{ ' + parts.join(', ') + ' }';
	}
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name PathItem
 *
 * @class The PathItem class is the base for any items that describe paths
 * and offer standardised methods for drawing and path manipulation, such as
 * {@link Path} and {@link CompoundPath}.
 *
 * @extends Item
 */
var PathItem = this.PathItem = Item.extend(/** @lends PathItem# */{
	// Note: The PathItem class is currently empty but holds the documentation
	// for all the methods that exist both on Path and CompoundPath.
	/**
	 * Smooth bezier curves without changing the amount of segments or their
	 * points, by only smoothing and adjusting their handle points, for both
	 * open ended and closed paths.
	 *
	 * @name PathItem#smooth
	 * @function
	 *
	 * @example {@paperscript}
	 * // Smoothing a closed shape:
	 *
	 * // Create a rectangular path with its top-left point at
	 * // {x: 30, y: 25} and a size of {width: 50, height: 50}:
	 * var path = new Path.Rectangle(new Point(30, 25), new Size(50, 50));
	 * path.strokeColor = 'black';
	 *
	 * // Select the path, so we can see its handles:
	 * path.selected = true;
	 *
	 * // Create a copy of the path and move it 100pt to the right:
	 * var copy = path.clone();
	 * copy.position.x += 100;
	 *
	 * // Smooth the segments of the copy:
	 * copy.smooth();
	 *
	 * @example {@paperscript height=220}
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 *
	 * path.add(new Point(30, 50));
	 *
	 * var y = 5;
	 * var x = 3;
	 *
	 * for (var i = 0; i < 28; i++) {
	 *     y *= -1.1;
	 *     x *= 1.1;
	 *     path.lineBy(x, y);
	 * }
	 *
	 * // Create a copy of the path and move it 100pt down:
	 * var copy = path.clone();
	 * copy.position.y += 120;
	 *
	 * // Set its stroke color to red:
	 * copy.strokeColor = 'red';
	 *
	 * // Smooth the segments of the copy:
	 * copy.smooth();
	 */

	/**
	 * {@grouptitle Postscript Style Drawing Commands}
	 *
	 * If called on a {@link CompoundPath}, a new {@link Path} is created as a
	 * child and the point is added as its first segment. On a normal empty
	 * {@link Path}, the point is simply added as its first segment.
	 *
	 * @name PathItem#moveTo
	 * @function
	 * @param {Point} point
	 */

	// DOCS: Document lineTo
	/**
	 * @name PathItem#lineTo
	 * @function
	 * @param {Point} point
	 */

	/**
	 * Adds a cubic bezier curve to the path, defined by two handles and a to
	 * point.
	 *
	 * @name PathItem#cubicCurveTo
	 * @function
	 * @param {Point} handle1
	 * @param {Point} handle2
	 * @param {Point} to
	 */

	/**
	 * Adds a quadratic bezier curve to the path, defined by a handle and a to
	 * point.
	 *
	 * @name PathItem#quadraticCurveTo
	 * @function
	 * @param {Point} handle
	 * @param {Point} to
	 */

	// DOCS: Document PathItem#curveTo 'paramater' param.
	/**
	 * Draws a curve from the position of the last segment point in the path
	 * that goes through the specified {@code through} point, to the specified
	 * {@code to} point by adding one segment to the path.
	 *
	 * @name PathItem#curveTo
	 * @function
	 * @param {Point} through the point through which the curve should go
	 * @param {Point} to the point where the curve should end
	 * @param {Number} [parameter=0.5]
	 *
	 * @example {@paperscript height=300}
	 * // Interactive example. Click and drag in the view below:
	 *
	 * var myPath;
	 * function onMouseDrag(event) {
	 * 	// If we created a path before, remove it:
	 * 	if (myPath) {
	 * 	    myPath.remove();
	 * 	}
	 *
	 * 	// Create a new path and add a segment point to it
	 * 	// at {x: 150, y: 150):
	 * 	myPath = new Path();
	 * 	myPath.add(150, 150);
	 *
	 * 	// Draw a curve through the position of the mouse to 'toPoint'
	 * 	var toPoint = new Point(350, 150);
	 * 	myPath.curveTo(event.point, toPoint);
	 *
	 * 	// Select the path, so we can see its segments:
	 * 	myPath.selected = true;
	 * }
     *
	 * // When the mouse is released, deselect the path
	 * // and set its stroke-color to black:
	 * function onMouseUp(event) {
	 * 	myPath.selected = false;
	 * 	myPath.strokeColor = 'black';
	 * }
	 */

	/**
	 * Draws an arc from the position of the last segment point in the path that
	 * goes through the specified {@code through} point, to the specified
	 * {@code to} point by adding one or more segments to the path.
	 *
	 * @name PathItem#arcTo
	 * @function
	 * @param {Point} through the point where the arc should pass through
	 * @param {Point} to the point where the arc should end
	 *
	 * @example {@paperscript}
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 *
	 * var firstPoint = new Point(30, 75);
	 * path.add(firstPoint);
	 *
	 * // The point through which we will create the arc:
	 * var throughPoint = new Point(40, 40);
	 *
	 * // The point at which the arc will end:
	 * var toPoint = new Point(130, 75);
	 *
	 * // Draw an arc through 'throughPoint' to 'toPoint'
	 * path.arcTo(throughPoint, toPoint);
	 *
	 * // Add a red circle shaped path at the position of 'throughPoint':
	 * var circle = new Path.Circle(throughPoint, 3);
	 * circle.fillColor = 'red';
	 *
	 * @example {@paperscript height=300}
	 * // Interactive example. Click and drag in the view below:
	 *
	 * var myPath;
	 * function onMouseDrag(event) {
	 * 	// If we created a path before, remove it:
	 * 	if (myPath) {
	 * 	    myPath.remove();
	 * 	}
	 *
	 * 	// Create a new path and add a segment point to it
	 * 	// at {x: 150, y: 150):
	 * 	myPath = new Path();
	 * 	myPath.add(150, 150);
	 *
	 * 	// Draw an arc through the position of the mouse to 'toPoint'
	 * 	var toPoint = new Point(350, 150);
	 * 	myPath.arcTo(event.point, toPoint);
	 *
	 * 	// Select the path, so we can see its segments:
	 * 	myPath.selected = true;
	 * }
	 *
	 * // When the mouse is released, deselect the path
	 * // and fill it with black.
	 * function onMouseUp(event) {
	 * 	myPath.selected = false;
	 * 	myPath.fillColor = 'black';
	 * }
	 */
	/**
	 * Draws an arc from the position of the last segment point in the path to
	 * the specified point by adding one or more segments to the path.
	 *
	 * @name PathItem#arcTo
	 * @function
	 * @param {Point} to the point where the arc should end
	 * @param {Boolean} [clockwise=true] specifies whether the arc should be
	 *        drawn in clockwise direction.
	 *
	 * @example {@paperscript}
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 *
	 * path.add(new Point(30, 75));
	 * path.arcTo(new Point(130, 75));
	 *
	 * var path2 = new Path();
	 * path2.strokeColor = 'red';
	 * path2.add(new Point(180, 25));
	 *
	 * // To draw an arc in anticlockwise direction,
	 * // we pass 'false' as the second argument to arcTo:
	 * path2.arcTo(new Point(280, 25), false);
	 *
	 * @example {@paperscript height=300}
	 * // Interactive example. Click and drag in the view below:
	 * var myPath;
	 *
	 * // The mouse has to move at least 20 points before
	 * // the next mouse drag event is fired:
	 * tool.minDistance = 20;
	 *
	 * // When the user clicks, create a new path and add
	 * // the current mouse position to it as its first segment:
	 * function onMouseDown(event) {
	 * 	myPath = new Path();
	 * 	myPath.strokeColor = 'black';
	 * 	myPath.add(event.point);
	 * }
	 *
	 * // On each mouse drag event, draw an arc to the current
	 * // position of the mouse:
	 * function onMouseDrag(event) {
	 * 	myPath.arcTo(event.point);
	 * }
	 */

	/**
	 * Closes the path. When closed, Paper.js connects the first and last
	 * segments.
	 *
	 * @name PathItem#closePath
	 * @function
	 * @see Path#closed
	 */

	/**
	 * {@grouptitle Relative Drawing Commands}
	 *
	 * If called on a {@link CompoundPath}, a new {@link Path} is created as a
	 * child and the point is added as its first segment relative to the
	 * position of the last segment of the current path.
	 *
	 * @name PathItem#moveBy
	 * @function
	 * @param {Point} point
	 */

	/**
	 * Adds a segment relative to the last segment point of the path.
	 *
	 * @name PathItem#lineBy
	 * @function
	 * @param {Point} vector The vector which is added to the position of the
	 *        last segment of the path, to become the new segment.
	 *
	 * @example {@paperscript}
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 *
	 * // Add a segment at {x: 50, y: 50}
	 * path.add(25, 25);
	 *
	 * // Add a segment relative to the last segment of the path.
	 * // 50 in x direction and 0 in y direction, becomes {x: 75, y: 25}
	 * path.lineBy(50, 0);
	 *
	 * // 0 in x direction and 50 in y direction, becomes {x: 75, y: 75}
	 * path.lineBy(0, 50);
	 *
	 * @example {@paperscript height=300}
	 * // Drawing a spiral using lineBy:
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 *
	 * // Add the first segment at {x: 50, y: 50}
	 * path.add(view.center);
	 *
	 * // Loop 500 times:
	 * for (var i = 0; i < 500; i++) {
	 * 	// Create a vector with an ever increasing length
	 * 	// and an angle in increments of 45 degrees
	 * 	var vector = new Point({
	 * 	    angle: i * 45,
	 * 	    length: i / 2
	 * 	});
	 * 	// Add the vector relatively to the last segment point:
	 * 	path.lineBy(vector);
	 * }
	 *
	 * // Smooth the handles of the path:
	 * path.smooth();
	 *
	 * // Uncomment the following line and click on 'run' to see
	 * // the construction of the path:
	 * // path.selected = true;
	 */

	// DOCS: Document Path#curveBy
	/**
	 * @name PathItem#curveBy
	 * @function
	 * @param {Point} throughVector
	 * @param {Point} toVector
	 * @param {Number} [parameter=0.5]
	 */

	// DOCS: Document Path#arcBy
	/**
	 * @name PathItem#arcBy
	 * @function
	 * @param {Point} throughVector
	 * @param {Point} toVector
	 */
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Path
 *
 * @class The Path item represents a path in a Paper.js project.
 *
 * @extends PathItem
 */
var Path = this.Path = PathItem.extend(/** @lends Path# */{
	/**
	 * Creates a new Path item and places it at the top of the active layer.
	 *
	 * @param {Segment[]} [segments] An array of segments (or points to be
	 * converted to segments) that will be added to the path.
	 *
	 * @example
	 * // Create an empty path and add segments to it:
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 * path.add(new Point(30, 30));
	 * path.add(new Point(100, 100));
	 *
	 * @example
	 * // Create a path with two segments:
	 * var segments = [new Point(30, 30), new Point(100, 100)];
	 * var path = new Path(segments);
	 * path.strokeColor = 'black';
	 */
	initialize: function(segments) {
		this.base();
		this._closed = false;
		this._selectedSegmentState = 0;
		// Support both passing of segments as array or arguments
		// If it is an array, it can also be a description of a point, so
		// check its first entry for object as well
		this.setSegments(!segments || !Array.isArray(segments)
				|| typeof segments[0] !== 'object' ? arguments : segments);
	},

	clone: function() {
		var copy = this._clone(new Path(this._segments));
		copy._closed = this._closed;
		if (this._clockwise !== undefined)
			copy._clockwise = this._clockwise;
		return copy;
	},

	_changed: function(flags) {
		// Don't use base() for reasons of performance.
		Item.prototype._changed.call(this, flags);
		if (flags & ChangeFlag.GEOMETRY) {
			delete this._strokeBounds;
			delete this._length;
			// Clockwise state becomes undefined as soon as geometry changes.
			delete this._clockwise;
		} else if (flags & ChangeFlag.STROKE) {
			delete this._strokeBounds;
		}
	},

	/**
	 * The segments contained within the path.
	 *
	 * @type Segment[]
	 * @bean
	 */
	getSegments: function() {
		return this._segments;
	},

	setSegments: function(segments) {
		if (!this._segments) {
			this._segments = [];
		} else {
			this._selectedSegmentState = 0;
			this._segments.length = 0;
			// Make sure new curves are calculated next time we call getCurves()
			if (this._curves)
				delete this._curves;
		}
		this._add(Segment.readAll(segments));
	},

	/**
	 * The first Segment contained within the path.
	 *
	 * @type Segment
	 * @bean
	 */
	getFirstSegment: function() {
		return this._segments[0];
	},

	/**
	 * The last Segment contained within the path.
	 *
	 * @type Segment
	 * @bean
	 */
	getLastSegment: function() {
		return this._segments[this._segments.length - 1];
	},

	/**
	 * The curves contained within the path.
	 *
	 * @type Curve[]
	 * @bean
	 */
	getCurves: function() {
		if (!this._curves) {
			var segments = this._segments,
				length = segments.length;
			// Reduce length by one if it's an open path:
			if (!this._closed && length > 0)
				length--;
			this._curves = new Array(length);
			for (var i = 0; i < length; i++)
				this._curves[i] = Curve.create(this, segments[i],
					// Use first segment for segment2 of closing curve
					segments[i + 1] || segments[0]);
		}
		return this._curves;
	},

	/**
	 * The first Curve contained within the path.
	 *
	 * @type Curve
	 * @bean
	 */
	getFirstCurve: function() {
		return this.getCurves()[0];
	},

	/**
	 * The last Curve contained within the path.
	 *
	 * @type Curve
	 * @bean
	 */
	getLastCurve: function() {
		var curves = this.getCurves();
		return curves[curves.length - 1];
	},

	/**
	 * Specifies whether the path is closed. If it is closed, Paper.js connects
	 * the first and last segments.
	 *
	 * @type Boolean
	 * @bean
	 *
	 * @example {@paperscript}
	 * var myPath = new Path();
	 * myPath.strokeColor = 'black';
	 * myPath.add(new Point(50, 75));
	 * myPath.add(new Point(100, 25));
	 * myPath.add(new Point(150, 75));
	 *
	 * // Close the path:
	 * myPath.closed = true;
	 */
	getClosed: function() {
		return this._closed;
	},

	setClosed: function(closed) {
		// On-the-fly conversion to boolean:
		if (this._closed != (closed = !!closed)) {
			this._closed = closed;
			// Update _curves length
			if (this._curves) {
				var length = this._segments.length,
					i;
				// Reduce length by one if it's an open path:
				if (!closed && length > 0)
					length--;
				this._curves.length = length;
				// If we were closing this path, we need to add a new curve now
				if (closed)
					this._curves[i = length - 1] = Curve.create(this,
						this._segments[i], this._segments[0]);
			}
			this._changed(Change.GEOMETRY);
		}
	},

	// TODO: Consider adding getSubPath(a, b), returning a part of the current
	// path, with the added benefit that b can be < a, and closed looping is
	// taken into account.

	_transform: function(matrix, flags) {
		if (!matrix.isIdentity()) {
			var coords = new Array(6);
			for (var i = 0, l = this._segments.length; i < l; i++) {
				this._segments[i]._transformCoordinates(matrix, coords, true);
			}
			var fillColor = this.getFillColor(),
				strokeColor = this.getStrokeColor();
			if (fillColor && fillColor.transform)
				fillColor.transform(matrix);
			if (strokeColor && strokeColor.transform)
				strokeColor.transform(matrix);
		}
	},

	/**
	 * Private method that adds a segment to the segment list. It assumes that
	 * the passed object is a segment already and does not perform any checks.
	 * If a curves list was requested, it will kept in sync with the segments
	 * list automatically.
	 */
	_add: function(segs, index) {
		// Local short-cuts:
		var segments = this._segments,
			curves = this._curves,
			amount = segs.length,
			append = index == null,
			index = append ? segments.length : index,
			fullySelected = this.isFullySelected();
		// Scan through segments to add first, convert if necessary and set
		// _path and _index references on them.
		for (var i = 0; i < amount; i++) {
			var segment = segs[i];
			// If the segments belong to another path already, clone them before
			// adding:
			if (segment._path) {
				segment = segs[i] = new Segment(segment);
			}
			segment._path = this;
			segment._index = index + i;
			// Select newly added segments if path was fully selected before
			if (fullySelected)
				segment._selectionState = SelectionState.POINT;
			// If parts of this segment are selected, adjust the internal
			// _selectedSegmentState now
			if (segment._selectionState)
				this._updateSelection(segment, 0, segment._selectionState);
		}
		if (append) {
			// Append them all at the end by using push
			segments.push.apply(segments, segs);
		} else {
			// Insert somewhere else
			segments.splice.apply(segments, [index, 0].concat(segs));
			// Adjust the indices of the segments above.
			for (var i = index + amount, l = segments.length; i < l; i++) {
				segments[i]._index = i;
			}
		}
		// Keep the curves list in sync all the time in case it as requested
		// already. We need to step one index down from the inserted segment to
		// get its curve:
		if (curves && --index >= 0) {
			// Insert a new curve as well and update the curves above
			curves.splice(index, 0, Curve.create(this, segments[index],
				segments[index + 1]));
			// Adjust segment1 now for the curves above the inserted one
			var curve = curves[index + amount];
			if (curve) {
				curve._segment1 = segments[index + amount];
			}
		}
		this._changed(Change.GEOMETRY);
		return segs;
	},

	// PORT: Add support for adding multiple segments at once to Scriptographer
	// DOCS: find a way to document the variable segment parameters of Path#add
	/**
	 * Adds one or more segments to the end of the {@link #segments} array of
	 * this path.
	 *
	 * @param {Segment|Point} segment the segment or point to be added.
	 * @return {Segment} the added segment. This is not necessarily the same
	 * object, e.g. if the segment to be added already belongs to another path.
	 * @operator none
	 *
	 * @example {@paperscript}
	 * // Adding segments to a path using point objects:
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 *
	 * // Add a segment at {x: 30, y: 75}
	 * path.add(new Point(30, 75));
	 *
	 * // Add two segments in one go at {x: 100, y: 20}
	 * // and {x: 170, y: 75}:
	 * path.add(new Point(100, 20), new Point(170, 75));
	 *
	 * @example {@paperscript}
	 * // Adding segments to a path using arrays containing number pairs:
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 *
	 * // Add a segment at {x: 30, y: 75}
	 * path.add([30, 75]);
	 *
	 * // Add two segments in one go at {x: 100, y: 20}
	 * // and {x: 170, y: 75}:
	 * path.add([100, 20], [170, 75]);
	 *
	 * @example {@paperscript}
	 * // Adding segments to a path using objects:
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 *
	 * // Add a segment at {x: 30, y: 75}
	 * path.add({x: 30, y: 75});
	 *
	 * // Add two segments in one go at {x: 100, y: 20}
	 * // and {x: 170, y: 75}:
	 * path.add({x: 100, y: 20}, {x: 170, y: 75});
	 *
	 * @example {@paperscript}
	 * // Adding a segment with handles to a path:
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 *
	 * path.add(new Point(30, 75));
	 *
	 * // Add a segment with handles:
	 * var point = new Point(100, 20);
	 * var handleIn = new Point(-50, 0);
	 * var handleOut = new Point(50, 0);
	 * var added = path.add(new Segment(point, handleIn, handleOut));
	 *
	 * // Select the added segment, so we can see its handles:
	 * added.selected = true;
	 *
	 * path.add(new Point(170, 75));
	 */
	add: function(segment1 /*, segment2, ... */) {
		return arguments.length > 1 && typeof segment1 !== 'number'
			// addSegments
			? this._add(Segment.readAll(arguments))
			// addSegment
			: this._add([ Segment.read(arguments) ])[0];
	},

	// PORT: Add support for adding multiple segments at once to Scriptographer
	/**
	 * Inserts one or more segments at a given index in the list of this path's
	 * segments.
	 *
	 * @param {Number} index the index at which to insert the segment.
	 * @param {Segment|Point} segment the segment or point to be inserted.
	 * @return {Segment} the added segment. This is not necessarily the same
	 * object, e.g. if the segment to be added already belongs to another path.
	 *
	 * @example {@paperscript}
	 * // Inserting a segment:
	 * var myPath = new Path();
	 * myPath.strokeColor = 'black';
	 * myPath.add(new Point(50, 75));
	 * myPath.add(new Point(150, 75));
	 *
	 * // Insert a new segment into myPath at index 1:
	 * myPath.insert(1, new Point(100, 25));
	 *
	 * // Select the segment which we just inserted:
	 * myPath.segments[1].selected = true;
	 *
	 * @example {@paperscript}
	 * // Inserting multiple segments:
	 * var myPath = new Path();
	 * myPath.strokeColor = 'black';
	 * myPath.add(new Point(50, 75));
	 * myPath.add(new Point(150, 75));
	 *
	 * // Insert two segments into myPath at index 1:
	 * myPath.insert(1, [80, 25], [120, 25]);
	 *
	 * // Select the segments which we just inserted:
	 * myPath.segments[1].selected = true;
	 * myPath.segments[2].selected = true;
	 */
	insert: function(index, segment1 /*, segment2, ... */) {
		return arguments.length > 2 && typeof segment1 !== 'number'
			// insertSegments
			? this._add(Segment.readAll(arguments, 1), index)
			// insertSegment
			: this._add([ Segment.read(arguments, 1) ], index)[0];
	},

	// PORT: Add to Scriptographer
	addSegment: function(segment) {
		return this._add([ Segment.read(arguments) ])[0];
	},

	// PORT: Add to Scriptographer
	insertSegment: function(index, segment) {
		return this._add([ Segment.read(arguments, 1) ], index)[0];
	},

	// PORT: Add to Scriptographer
	/**
	 * Adds an array of segments (or types that can be converted to segments)
	 * to the end of the {@link #segments} array.
	 *
	 * @param {Segment[]} segments
	 * @return {Segment[]} an array of the added segments. These segments are
	 * not necessarily the same objects, e.g. if the segment to be added already
	 * belongs to another path.
	 *
	 * @example {@paperscript}
	 * // Adding an array of Point objects:
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 * var points = [new Point(30, 50), new Point(170, 50)];
	 * path.addSegments(points);
	 *
	 * @example {@paperscript}
	 * // Adding an array of [x, y] arrays:
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 * var array = [[30, 75], [100, 20], [170, 75]];
	 * path.addSegments(array);
	 *
	 * @example {@paperscript}
	 * // Adding segments from one path to another:
	 *
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 * path.addSegments([[30, 75], [100, 20], [170, 75]]);
	 *
	 * var path2 = new Path();
	 * path2.strokeColor = 'red';
	 *
	 * // Add the second and third segments of path to path2:
	 * path2.add(path.segments[1], path.segments[2]);
	 *
	 * // Move path2 30pt to the right:
	 * path2.position.x += 30;
	 */
	addSegments: function(segments) {
		return this._add(Segment.readAll(segments));
	},

	// PORT: Add to Scriptographer
	/**
	 * Inserts an array of segments at a given index in the path's
	 * {@link #segments} array.
	 *
	 * @param {Number} index the index at which to insert the segments.
	 * @param {Segment[]} segments the segments to be inserted.
	 * @return {Segment[]} an array of the added segments. These segments are
	 * not necessarily the same objects, e.g. if the segment to be added already
	 * belongs to another path.
	 */
	insertSegments: function(index, segments) {
		return this._add(Segment.readAll(segments), index);
	},

	// PORT: Add to Scriptographer
	/**
	 * Removes the segment at the specified index of the path's
	 * {@link #segments} array.
	 *
	 * @param {Number} index the index of the segment to be removed
	 * @return {Segment} the removed segment
	 *
	 * @example {@paperscript}
	 * // Removing a segment from a path:
	 *
	 * // Create a circle shaped path at { x: 80, y: 50 }
	 * // with a radius of 35:
	 * var path = new Path.Circle(new Point(80, 50), 35);
	 * path.strokeColor = 'black';
	 *
	 * // Remove its second segment:
	 * path.removeSegment(1);
	 *
	 * // Select the path, so we can see its segments:
	 * path.selected = true;
	 */
	removeSegment: function(index) {
		var segments = this.removeSegments(index, index + 1);
		return segments[0] || null;
	},

	// PORT: Add to Scriptographer
	/**
	 * Removes all segments from the path's {@link #segments} array.
	 *
	 * @name Path#removeSegments
	 * @function
	 * @return {Segment[]} an array containing the removed segments
	 */
	/**
	 * Removes the segments from the specified {@code from} index to the
	 * {@code to} index from the path's {@link #segments} array.
	 *
	 * @param {Number} from the beginning index, inclusive
	 * @param {Number} [to=segments.length] the ending index, exclusive
	 * @return {Segment[]} an array containing the removed segments
	 *
	 * @example {@paperscript}
	 * // Removing segments from a path:
	 *
	 * // Create a circle shaped path at { x: 80, y: 50 }
	 * // with a radius of 35:
	 * var path = new Path.Circle(new Point(80, 50), 35);
	 * path.strokeColor = 'black';
	 *
	 * // Remove the segments from index 1 till index 2:
	 * path.removeSegments(1, 2);
	 *
	 * // Select the path, so we can see its segments:
	 * path.selected = true;
	 */
	removeSegments: function(from, to) {
		from = from || 0;
	 	to = Base.pick(to, this._segments.length);
		var segments = this._segments,
			curves = this._curves,
			last = to >= segments.length,
			removed = segments.splice(from, to - from),
			amount = removed.length;
		if (!amount)
			return removed;
		// Update selection state accordingly
		for (var i = 0; i < amount; i++) {
			var segment = removed[i];
			if (segment._selectionState)
				this._updateSelection(segment, segment._selectionState, 0);
			// Clear the indices and path references of the removed segments
			removed._index = removed._path = undefined;
		}
		// Adjust the indices of the segments above.
		for (var i = from, l = segments.length; i < l; i++)
			segments[i]._index = i;
		// Keep curves in sync
		if (curves) {
			curves.splice(from, amount);
			// Adjust segments for the curves before and after the removed ones
			var curve;
			if (curve = curves[from - 1])
				curve._segment2 = segments[from];
			if (curve = curves[from])
				curve._segment1 = segments[from];
			// If the last segment of a closing path was removed, we need to
			// readjust the last curve of the list now.
			if (last && this._closed && (curve = curves[curves.length - 1]))
				curve._segment2 = segments[0];
		}
		this._changed(Change.GEOMETRY);
		return removed;
	},

	/**
	 * Specifies whether an path is selected and will also return {@code true}
	 * if the path is partially selected, i.e. one or more of its segments is
	 * selected.
	 *
	 * Paper.js draws the visual outlines of selected items on top of your
	 * project. This can be useful for debugging, as it allows you to see the
	 * construction of paths, position of path curves, individual segment points
	 * and bounding boxes of symbol and raster items.
	 *
	 * @type Boolean
	 * @bean
	 * @see Project#selectedItems
	 * @see Segment#selected
	 * @see Point#selected
	 *
	 * @example {@paperscript}
	 * // Selecting an item:
	 * var path = new Path.Circle(new Size(80, 50), 35);
	 * path.selected = true; // Select the path
	 *
	 * @example {@paperscript}
	 * // A path is selected, if one or more of its segments is selected:
	 * var path = new Path.Circle(new Size(80, 50), 35);
	 *
	 * // Select the second segment of the path:
	 * path.segments[1].selected = true;
	 *
	 * // If the path is selected (which it is), set its fill color to red:
	 * if (path.selected) {
	 * 	path.fillColor = 'red';
	 * }
	 *
	 */
	/**
	 * Specifies whether the path and all its segments are selected.
	 *
	 * @type Boolean
	 * @bean
	 *
	 * @example {@paperscript}
	 * // A path is fully selected, if all of its segments are selected:
	 * var path = new Path.Circle(new Size(80, 50), 35);
	 * path.fullySelected = true;
	 *
	 * var path2 = new Path.Circle(new Size(180, 50), 35);
	 * path2.fullySelected = true;
	 *
	 * // Deselect the second segment of the second path:
	 * path2.segments[1].selected = false;
	 *
	 * // If the path is fully selected (which it is),
	 * // set its fill color to red:
	 * if (path.fullySelected) {
	 * 	path.fillColor = 'red';
	 * }
	 *
	 * // If the second path is fully selected (which it isn't, since we just
	 * // deselected its second segment),
	 * // set its fill color to red:
	 * if (path2.fullySelected) {
	 * 	path2.fillColor = 'red';
	 * }
	 */
	isFullySelected: function() {
		return this._selected && this._selectedSegmentState
				== this._segments.length * SelectionState.POINT;
	},

	setFullySelected: function(selected) {
		var length = this._segments.length;
		this._selectedSegmentState = selected
				? length * SelectionState.POINT : 0;
		for (var i = 0; i < length; i++)
			this._segments[i]._selectionState = selected
					? SelectionState.POINT : 0;
		this.setSelected(selected);
	},

	_updateSelection: function(segment, oldState, newState) {
		segment._selectionState = newState;
		var total = this._selectedSegmentState += newState - oldState;
		// Set this path as selected in case we have selected segments. Do not
		// unselect if we're down to 0, as the path itself can still remain
		// selected even when empty.
		if (total > 0)
			this.setSelected(true);
	},

	/**
	 * Converts the curves in a path to straight lines with an even distribution
	 * of points. The distance between the produced segments is as close as
	 * possible to the value specified by the {@code maxDistance} parameter.
	 *
	 * @param {Number} maxDistance the maximum distance between the points
	 *
	 * @example {@paperscript}
	 * // Flattening a circle shaped path:
	 *
	 * // Create a circle shaped path at { x: 80, y: 50 }
	 * // with a radius of 35:
	 * var path = new Path.Circle(new Size(80, 50), 35);
	 *
	 * // Select the path, so we can inspect its segments:
	 * path.selected = true;
	 *
	 * // Create a copy of the path and move it 150 points to the right:
	 * var copy = path.clone();
	 * copy.position.x += 150;
	 *
	 * // Convert its curves to points, with a max distance of 20:
	 * copy.flatten(20);
	 *
	 * // Select the copy, so we can inspect its segments:
	 * copy.selected = true;
	 */
	flatten: function(maxDistance) {
		var flattener = new PathFlattener(this),
			pos = 0,
			// Adapt step = maxDistance so the points distribute evenly.
			step = flattener.length / Math.ceil(flattener.length / maxDistance),
			// Add half of step to end, so imprecisions are ok too.
			end = flattener.length + step / 2;
		// Iterate over path and evaluate and add points at given offsets
		var segments = [];
		while (pos <= end) {
			segments.push(new Segment(flattener.evaluate(pos, 0)));
			pos += step;
		}
		this.setSegments(segments);
	},

	/**
	 * Smooths a path by simplifying it. The {@link Path#segments} array is
	 * analyzed and replaced by a more optimal set of segments, reducing memory
	 * usage and speeding up drawing.
	 *
	 * @param {Number} [tolerance=2.5]
	 *
	 * @example {@paperscript height=300}
	 * // Click and drag below to draw to draw a line, when you release the
	 * // mouse, the is made smooth using path.simplify():
	 *
	 * var path;
	 * function onMouseDown(event) {
	 * 	// If we already made a path before, deselect it:
	 * 	if (path) {
	 * 		path.selected = false;
	 * 	}
	 *
	 * 	// Create a new path and add the position of the mouse
	 * 	// as its first segment. Select it, so we can see the
	 * 	// segment points:
	 * 	path = new Path();
	 * 	path.strokeColor = 'black';
	 * 	path.add(event.point);
	 * 	path.selected = true;
	 * }
	 *
	 * function onMouseDrag(event) {
	 * 	// On every drag event, add a segment to the path
	 * 	// at the position of the mouse:
	 * 	path.add(event.point);
	 * }
	 *
	 * function onMouseUp(event) {
	 * 	// When the mouse is released, simplify the path:
	 * 	path.simplify();
	 * 	path.selected = true;
	 * }
	 */
	simplify: function(tolerance) {
		if (this._segments.length > 2) {
			var fitter = new PathFitter(this, tolerance || 2.5);
			this.setSegments(fitter.fit());
		}
	},

	// TODO: reduceSegments([flatness])
	// TODO: split(offset) / split(location) / split(index[, parameter])

	/**
	 * Specifies whether the path is oriented clock-wise.
	 *
	 * @type Boolean
	 * @bean
	 */
	isClockwise: function() {
		if (this._clockwise !== undefined)
			return this._clockwise;
		var sum = 0,
			xPre, yPre;
		function edge(x, y) {
			if (xPre !== undefined)
				sum += (xPre - x) * (y + yPre);
			xPre = x;
			yPre = y;
		}
		// Method derived from:
		// http://stackoverflow.com/questions/1165647
		// We treat the curve points and handles as the outline of a polygon of
		// which we determine the orientation using the method of calculating
		// the sum over the edges. This will work even with non-convex polygons,
		// telling you whether it's mostly clockwise
		for (var i = 0, l = this._segments.length; i < l; i++) {
			var seg1 = this._segments[i],
				seg2 = this._segments[i + 1 < l ? i + 1 : 0],
				point1 = seg1._point,
				handle1 = seg1._handleOut,
				handle2 = seg2._handleIn,
				point2 = seg2._point;
			edge(point1._x, point1._y);
			edge(point1._x + handle1._x, point1._y + handle1._y);
			edge(point2._x + handle2._x, point2._y + handle2._y);
			edge(point2._x, point2._y);
		}
		return sum > 0;
	},

	setClockwise: function(clockwise) {
		// On-the-fly conversion to boolean:
		if (this.isClockwise() != (clockwise = !!clockwise)) {
			// Only revers the path if its clockwise orientation is not the same
			// as what it is now demanded to be.
			this.reverse();
			this._clockwise = clockwise;
		}
	},

	/**
	 * Reverses the segments of the path.
	 */
	reverse: function() {
		this._segments.reverse();
		// Reverse the handles:
		for (var i = 0, l = this._segments.length; i < l; i++) {
			var segment = this._segments[i];
			var handleIn = segment._handleIn;
			segment._handleIn = segment._handleOut;
			segment._handleOut = handleIn;
		}
		// Flip clockwise state if it's defined
		if (this._clockwise !== undefined)
			this._clockwise = !this._clockwise;
	},

	// DOCS: document Path#join in more detail.
	/**
	 * Joins the path with the specified path, which will be removed in the
	 * process.
	 *
	 * @param {Path} path
	 *
	 * @example {@paperscript}
	 * // Joining two paths:
	 * var path = new Path([30, 25], [30, 75]);
	 * path.strokeColor = 'black';
	 *
	 * var path2 = new Path([200, 25], [200, 75]);
	 * path2.strokeColor = 'black';
	 *
	 * // Join the paths:
	 * path.join(path2);
	 *
	 * @example {@paperscript}
	 * // Joining two paths that share a point at the start or end of their
	 * // segments array:
	 * var path = new Path([30, 25], [30, 75]);
	 * path.strokeColor = 'black';
	 *
	 * var path2 = new Path([30, 25], [80, 25]);
	 * path2.strokeColor = 'black';
	 *
	 * // Join the paths:
	 * path.join(path2);
	 *
	 * // After joining, path with have 3 segments, since it
	 * // shared its first segment point with the first
	 * // segment point of path2.
	 *
	 * // Select the path to show that they have joined:
	 * path.selected = true;
	 *
	 * @example {@paperscript}
	 * // Joining two paths that connect at two points:
	 * var path = new Path([30, 25], [80, 25], [80, 75]);
	 * path.strokeColor = 'black';
	 *
	 * var path2 = new Path([30, 25], [30, 75], [80, 75]);
	 * path2.strokeColor = 'black';
	 *
	 * // Join the paths:
	 * path.join(path2);
	 *
	 * // Because the paths were joined at two points, the path is closed
	 * // and has 4 segments.
	 *
	 * // Select the path to show that they have joined:
	 * path.selected = true;
	 */
	join: function(path) {
		if (path) {
			var segments = path._segments,
				last1 = this.getLastSegment(),
				last2 = path.getLastSegment();
			if (last1._point.equals(last2._point))
				path.reverse();
			var first2 = path.getFirstSegment();
			if (last1._point.equals(first2._point)) {
				last1.setHandleOut(first2._handleOut);
				this._add(segments.slice(1));
			} else {
				var first1 = this.getFirstSegment();
				if (first1._point.equals(first2._point))
					path.reverse();
				last2 = path.getLastSegment();
				if (first1._point.equals(last2._point)) {
					first1.setHandleIn(last2._handleIn);
					// Prepend all segments from path except the last one
					this._add(segments.slice(0, segments.length - 1), 0);
				} else {
					this._add(segments.slice(0));
				}
			}
			path.remove();
			// Close if they touch in both places
			var first1 = this.getFirstSegment();
			last1 = this.getLastSegment();
			if (last1._point.equals(first1._point)) {
				first1.setHandleIn(last1._handleIn);
				last1.remove();
				this.setClosed(true);
			}
			this._changed(Change.GEOMETRY);
			return true;
		}
		return false;
	},

	/**
	 * The length of the perimeter of the path.
	 *
	 * @type Number
	 * @bean
	 */
	getLength: function() {
		if (this._length == null) {
			var curves = this.getCurves();
			this._length = 0;
			for (var i = 0, l = curves.length; i < l; i++)
				this._length += curves[i].getLength();
		}
		return this._length;
	},

	_getOffset: function(location) {
		var index = location && location.getIndex();
		if (index != null) {
			var curves = this.getCurves(),
				offset = 0;
			for (var i = 0; i < index; i++)
				offset += curves[i].getLength();
			var curve = curves[index];
			return offset + curve.getLength(0, location.getParameter());
		}
		return null;
	},

	// TODO: getLocationAt(point, precision)
	// PORT: Rename functions and add new isParameter argument in Scriptographer
	// DOCS: document Path#getLocationAt
	/**
	 * {@grouptitle Positions on Paths and Curves}
	 *
	 * @param {Number} offset
	 * @param {Boolean} [isParameter=false]
	 * @return {CurveLocation}
	 */
	getLocationAt: function(offset, isParameter) {
		var curves = this.getCurves(),
			length = 0;
		if (isParameter) {
			// offset consists of curve index and curve parameter, before and
			// after the fractional digit.
			var index = ~~offset; // = Math.floor()
			return new CurveLocation(curves[index], offset - index);
		}
		for (var i = 0, l = curves.length; i < l; i++) {
			var start = length,
				curve = curves[i];
			length += curve.getLength();
			if (length >= offset) {
				// Found the segment within which the length lies
				return new CurveLocation(curve,
						curve.getParameter(offset - start));
			}
		}
		// It may be that through impreciseness of getLength, that the end
		// of the curves was missed:
		if (offset <= this.getLength())
			return new CurveLocation(curves[curves.length - 1], 1);
		return null;
	},

	// DOCS: improve Path#getPointAt documenation.
	/**
	 * Get the point on the path at the given offset.
	 *
	 * @param {Number} offset
	 * @param {Boolean} [isParameter=false]
	 * @return {Point} the point at the given offset
	 *
	 * @example {@paperscript height=150}
	 * // Finding the point on a path at a given offset:
	 *
	 * // Create an arc shaped path:
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 * path.add(new Point(40, 100));
	 * path.arcTo(new Point(150, 100));
	 *
	 * // We're going to be working with a third of the length
	 * // of the path as the offset:
	 * var offset = path.length / 3;
	 *
	 * // Find the point on the path:
	 * var point = path.getPointAt(offset);
	 *
	 * // Create a small circle shaped path at the point:
	 * var circle = new Path.Circle(point, 3);
	 * circle.fillColor = 'red';
	 *
	 * @example {@paperscript height=150}
	 * // Iterating over the length of a path:
	 *
	 * // Create an arc shaped path:
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 * path.add(new Point(40, 100));
	 * path.arcTo(new Point(150, 100));
	 *
	 * var amount = 5;
	 * var length = path.length;
	 * for (var i = 0; i < amount + 1; i++) {
	 * 	var offset = i / amount * length;
	 *
	 * 	// Find the point on the path at the given offset:
	 * 	var point = path.getPointAt(offset);
	 *
	 * 	// Create a small circle shaped path at the point:
	 * 	var circle = new Path.Circle(point, 3);
	 * 	circle.fillColor = 'red';
	 * }
	 */
	getPointAt: function(offset, isParameter) {
		var loc = this.getLocationAt(offset, isParameter);
		return loc && loc.getPoint();
	},

	/**
	 * Get the tangent to the path at the given offset as a vector
	 * point.
	 *
	 * @param {Number} offset
	 * @param {Boolean} [isParameter=false]
	 * @return {Point} the tangent vector at the given offset
	 *
	 * @example {@paperscript height=150}
	 * // Working with the tangent vector at a given offset:
	 *
	 * // Create an arc shaped path:
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 * path.add(new Point(40, 100));
	 * path.arcTo(new Point(150, 100));
	 *
	 * // We're going to be working with a third of the length
	 * // of the path as the offset:
	 * var offset = path.length / 3;
	 *
	 * // Find the point on the path:
	 * var point = path.getPointAt(offset);
	 *
	 * // Find the tangent vector at the given offset:
	 * var tangent = path.getTangentAt(offset);
	 *
	 * // Make the tangent vector 60pt long:
	 * tangent.length = 60;
	 *
	 * var path = new Path();
	 * path.strokeColor = 'red';
	 * path.add(point);
	 * path.add(point + tangent);
	 *
	 * @example {@paperscript height=200}
	 * // Iterating over the length of a path:
	 *
	 * // Create an arc shaped path:
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 * path.add(new Point(40, 100));
	 * path.arcTo(new Point(150, 100));
	 *
	 * var amount = 6;
	 * var length = path.length;
	 * for (var i = 0; i < amount + 1; i++) {
	 * 	var offset = i / amount * length;
	 *
	 * 	// Find the point on the path at the given offset:
	 * 	var point = path.getPointAt(offset);
	 *
	 * 	// Find the normal vector on the path at the given offset:
	 * 	var tangent = path.getTangentAt(offset);
	 *
	 * 	// Make the tangent vector 60pt long:
	 * 	tangent.length = 60;
	 *
	 * 	var line = new Path();
	 * 	line.strokeColor = 'red';
	 * 	line.add(point);
	 * 	line.add(point + tangent);
	 * }
	 */
	getTangentAt: function(offset, isParameter) {
		var loc = this.getLocationAt(offset, isParameter);
		return loc && loc.getTangent();
	},

	/**
	 * Get the normal to the path at the given offset as a vector point.
	 *
	 * @param {Number} offset
	 * @param {Boolean} [isParameter=false]
	 * @return {Point} the normal vector at the given offset
	 *
	 * @example {@paperscript height=150}
	 * // Working with the normal vector at a given offset:
	 *
	 * // Create an arc shaped path:
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 * path.add(new Point(40, 100));
	 * path.arcTo(new Point(150, 100));
	 *
	 * // We're going to be working with a third of the length
	 * // of the path as the offset:
	 * var offset = path.length / 3;
	 *
	 * // Find the point on the path:
	 * var point = path.getPointAt(offset);
	 *
	 * // Find the normal vector at the given offset:
	 * var normal = path.getNormalAt(offset);
	 *
	 * // Make the normal vector 30pt long:
	 * normal.length = 30;
	 *
	 * var path = new Path();
	 * path.strokeColor = 'red';
	 * path.add(point);
	 * path.add(point + normal);
	 *
	 * @example {@paperscript height=200}
	 * // Iterating over the length of a path:
	 *
	 * // Create an arc shaped path:
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 * path.add(new Point(40, 100));
	 * path.arcTo(new Point(150, 100));
	 *
	 * var amount = 10;
	 * var length = path.length;
	 * for (var i = 0; i < amount + 1; i++) {
	 * 	var offset = i / amount * length;
	 *
	 * 	// Find the point on the path at the given offset:
	 * 	var point = path.getPointAt(offset);
	 *
	 * 	// Find the normal vector on the path at the given offset:
	 * 	var normal = path.getNormalAt(offset);
	 *
	 * 	// Make the normal vector 30pt long:
	 * 	normal.length = 30;
	 *
	 * 	var line = new Path();
	 * 	line.strokeColor = 'red';
	 * 	line.add(point);
	 * 	line.add(point + normal);
	 * }
	 */
	getNormalAt: function(offset, isParameter) {
		var loc = this.getLocationAt(offset, isParameter);
		return loc && loc.getNormal();
	}

	// TODO: intersects(item)
	// TODO: contains(item)
	// TODO: contains(point)
	// TODO: intersect(item)
	// TODO: unite(item)
	// TODO: exclude(item)
	// TODO: getIntersections(path)
}, new function() { // Scope for drawing

	// Note that in the code below we're often accessing _x and _y on point
	// objects that were read from segments. This is because the SegmentPoint
	// class overrides the plain x / y properties with getter / setters and
	// stores the values in these private properties internally. To avoid
	// of getter functions all the time we directly access these private
	// properties here. The distinction between normal Point objects and
	// SegmentPoint objects maybe seem a bit tedious but is worth the
	// performance benefit.

	function drawHandles(ctx, segments) {
		for (var i = 0, l = segments.length; i < l; i++) {
			var segment = segments[i],
				point = segment._point,
				state = segment._selectionState,
				selected = state & SelectionState.POINT;
			if (selected || (state & SelectionState.HANDLE_IN))
				drawHandle(ctx, point, segment._handleIn);
			if (selected || (state & SelectionState.HANDLE_OUT))
				drawHandle(ctx, point, segment._handleOut);
			// Draw a rectangle at segment.point:
			ctx.save();
			ctx.beginPath();
			ctx.rect(point._x - 2, point._y - 2, 4, 4);
			ctx.fill();
			// If the point is not selected, draw a white square that is 1 px
			// smaller on all sides:
			if (!selected) {
				ctx.beginPath();
				ctx.rect(point._x - 1, point._y - 1, 2, 2);
				ctx.fillStyle = '#ffffff';
				ctx.fill();
				ctx.restore();
			}
		}
	}

	function drawHandle(ctx, point, handle) {
		if (!handle.isZero()) {
			var handleX = point._x + handle._x,
				handleY = point._y + handle._y;
			ctx.beginPath();
			ctx.moveTo(point._x, point._y);
			ctx.lineTo(handleX, handleY);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(handleX, handleY, 1.75, 0, Math.PI * 2, true);
			ctx.fill();
		}
	}

	function drawSegments(ctx, path) {
		var segments = path._segments,
			length = segments.length,
			handleOut, outX, outY;

		function drawSegment(i) {
			var segment = segments[i],
				point = segment._point,
				x = point._x,
				y = point._y,
				handleIn = segment._handleIn;
			if (!handleOut) {
				ctx.moveTo(x, y);
			} else {
				if (handleIn.isZero() && handleOut.isZero()) {
					ctx.lineTo(x, y);
				} else {
					ctx.bezierCurveTo(outX, outY,
							handleIn._x + x, handleIn._y + y, x, y);
				}
			}
			handleOut = segment._handleOut;
			outX = handleOut._x + x;
			outY = handleOut._y + y;
		}

		for (var i = 0; i < length; i++)
			drawSegment(i);
		// Close path by drawing first segment again
		if (path._closed && length > 1)
			drawSegment(0);
	}

	function drawDashes(ctx, path, dashArray, dashOffset) {
		var flattener = new PathFlattener(path),
			from = dashOffset, to,
			i = 0;
		while (from < flattener.length) {
			to = from + dashArray[(i++) % dashArray.length];
			flattener.drawPart(ctx, from, to);
			from = to + dashArray[(i++) % dashArray.length];
		}
	}

	return {
		draw: function(ctx, param) {
			if (!param.compound)
				ctx.beginPath();

			var fillColor = this.getFillColor(),
				strokeColor = this.getStrokeColor(),
				dashArray = this.getDashArray() || [], // TODO: Always defined?
				hasDash = !!dashArray.length;

			if (param.compound || param.selection || this._clipMask || fillColor
					|| strokeColor && !hasDash) {
				drawSegments(ctx, this);
			}

			// If we are drawing the selection of a path, stroke it and draw
			// its handles:
			if (param.selection) {
				ctx.stroke();
				drawHandles(ctx, this._segments);
			} else if (this._clipMask) {
				ctx.clip();
			} else if (!param.compound && (fillColor || strokeColor)) {
				// If the path is part of a compound path or doesn't have a fill
				// or stroke, there is no need to continue.
				ctx.save();
				this._setStyles(ctx);
				// If the path only defines a strokeColor or a fillColor,
				// draw it directly with the globalAlpha set, otherwise
				// we will do it later when we composite the temporary
				// canvas.
				if (!fillColor || !strokeColor)
					ctx.globalAlpha = this._opacity;
				if (fillColor) {
					ctx.fillStyle = fillColor.getCanvasStyle(ctx);
					ctx.fill();
				}
				if (strokeColor) {
					ctx.strokeStyle = strokeColor.getCanvasStyle(ctx);
					if (hasDash) {
						// We cannot use the path created by drawSegments above
						// Use CurveFlatteners to draw dashed paths:
						ctx.beginPath();
						drawDashes(ctx, this, dashArray, this.getDashOffset());
					}
					ctx.stroke();
				}
				ctx.restore();
			}
		}
	};
}, new function() { // Inject methods that require scoped privates

	/**
	 * Solves a tri-diagonal system for one of coordinates (x or y) of first
	 * bezier control points.
	 *
	 * @param rhs right hand side vector.
	 * @return Solution vector.
	 */
	function getFirstControlPoints(rhs) {
		var n = rhs.length,
			x = [], // Solution vector.
			tmp = [], // Temporary workspace.
			b = 2;
		x[0] = rhs[0] / b;
		// Decomposition and forward substitution.
		for (var i = 1; i < n; i++) {
			tmp[i] = 1 / b;
			b = (i < n - 1 ? 4 : 2) - tmp[i];
			x[i] = (rhs[i] - x[i - 1]) / b;
		}
		// Back-substitution.
		for (var i = 1; i < n; i++) {
			x[n - i - 1] -= tmp[n - i] * x[n - i];
		}
		return x;
	};

	var styles = {
		getStrokeWidth: 'lineWidth',
		getStrokeJoin: 'lineJoin',
		getStrokeCap: 'lineCap',
		getMiterLimit: 'miterLimit'
	};

	return {
		_setStyles: function(ctx) {
			for (var i in styles) {
				var style = this._style[i]();
				if (style)
					ctx[styles[i]] = style;
			}
		},

		// Note: Documentation for smooth() is in PathItem
		smooth: function() {
			// This code is based on the work by Oleg V. Polikarpotchkin,
			// http://ov-p.spaces.live.com/blog/cns!39D56F0C7A08D703!147.entry
			// It was extended to support closed paths by averaging overlapping
			// beginnings and ends. The result of this approach is very close to
			// Polikarpotchkin's closed curve solution, but reuses the same
			// algorithm as for open paths, and is probably executing faster as
			// well, so it is preferred.
			var segments = this._segments,
				size = segments.length,
				n = size,
				// Add overlapping ends for averaging handles in closed paths
				overlap;

			if (size <= 2)
				return;

			if (this._closed) {
				// Overlap up to 4 points since averaging beziers affect the 4
				// neighboring points
				overlap = Math.min(size, 4);
				n += Math.min(size, overlap) * 2;
			} else {
				overlap = 0;
			}
			var knots = [];
			for (var i = 0; i < size; i++)
				knots[i + overlap] = segments[i]._point;
			if (this._closed) {
				// If we're averaging, add the 4 last points again at the
				// beginning, and the 4 first ones at the end.
				for (var i = 0; i < overlap; i++) {
					knots[i] = segments[i + size - overlap]._point;
					knots[i + size + overlap] = segments[i]._point;
				}
			} else {
				n--;
			}
			// Calculate first Bezier control points
			// Right hand side vector
			var rhs = [];

			// Set right hand side X values
			for (var i = 1; i < n - 1; i++)
				rhs[i] = 4 * knots[i]._x + 2 * knots[i + 1]._x;
			rhs[0] = knots[0]._x + 2 * knots[1]._x;
			rhs[n - 1] = 3 * knots[n - 1]._x;
			// Get first control points X-values
			var x = getFirstControlPoints(rhs);

			// Set right hand side Y values
			for (var i = 1; i < n - 1; i++)
				rhs[i] = 4 * knots[i]._y + 2 * knots[i + 1]._y;
			rhs[0] = knots[0]._y + 2 * knots[1]._y;
			rhs[n - 1] = 3 * knots[n - 1]._y;
			// Get first control points Y-values
			var y = getFirstControlPoints(rhs);

			if (this._closed) {
				// Do the actual averaging simply by linearly fading between the
				// overlapping values.
				for (var i = 0, j = size; i < overlap; i++, j++) {
					var f1 = (i / overlap);
					var f2 = 1 - f1;
					// Beginning
					x[j] = x[i] * f1 + x[j] * f2;
					y[j] = y[i] * f1 + y[j] * f2;
					// End
					var ie = i + overlap, je = j + overlap;
					x[je] = x[ie] * f2 + x[je] * f1;
					y[je] = y[ie] * f2 + y[je] * f1;
				}
				n--;
			}
			var handleIn = null;
			// Now set the calculated handles
			for (var i = overlap; i <= n - overlap; i++) {
				var segment = segments[i - overlap];
				if (handleIn)
					segment.setHandleIn(handleIn.subtract(segment._point));
				if (i < n) {
					segment.setHandleOut(
							new Point(x[i], y[i]).subtract(segment._point));
					if (i < n - 1)
						handleIn = new Point(
								2 * knots[i + 1]._x - x[i + 1],
								2 * knots[i + 1]._y - y[i + 1]);
					else
						handleIn = new Point(
								(knots[n]._x + x[n - 1]) / 2,
								(knots[n]._y + y[n - 1]) / 2);
				}
			}
			if (this._closed && handleIn) {
				var segment = this._segments[0];
				segment.setHandleIn(handleIn.subtract(segment._point));
			}
		}
	};
}, new function() { // PostScript-style drawing commands
	/**
	 * Helper method that returns the current segment and checks if a moveTo()
	 * command is required first.
	 */
	function getCurrentSegment(that) {
		var segments = that._segments;
		if (segments.length == 0)
			throw new Error('Use a moveTo() command first');
		return segments[segments.length - 1];
	}

	return {
		// Note: Documentation for these methods is found in PathItem, as they
		// are considered abstract methods of PathItem and need to be defined in
		// all implementing classes.
		moveTo: function(point) {
			// Let's not be picky about calling moveTo() when not at the
			// beginning of a path, just bail out:
			if (!this._segments.length)
				this._add([ new Segment(Point.read(arguments)) ]);
		},

		moveBy: function(point) {
			throw new Error('moveBy() is unsupported on Path items.');
		},

		lineTo: function(point) {
			// Let's not be picky about calling moveTo() first:
			this._add([ new Segment(Point.read(arguments)) ]);
		},

		cubicCurveTo: function(handle1, handle2, to) {
			handle1 = Point.read(arguments, 0, 1);
			handle2 = Point.read(arguments, 1, 1);
			to = Point.read(arguments, 2, 1);
			// First modify the current segment:
			var current = getCurrentSegment(this);
			// Convert to relative values:
			current.setHandleOut(handle1.subtract(current._point));
			// And add the new segment, with handleIn set to c2
			this._add([ new Segment(to, handle2.subtract(to)) ]);
		},

		quadraticCurveTo: function(handle, to) {
			handle = Point.read(arguments, 0, 1);
			to = Point.read(arguments, 1, 1);
			// This is exact:
			// If we have the three quad points: A E D,
			// and the cubic is A B C D,
			// B = E + 1/3 (A - E)
			// C = E + 1/3 (D - E)
			var current = getCurrentSegment(this)._point;
			this.cubicCurveTo(
				handle.add(current.subtract(handle).multiply(1/3)),
				handle.add(to.subtract(handle).multiply(1/3)),
				to
			);
		},

		curveTo: function(through, to, parameter) {
			through = Point.read(arguments, 0, 1);
			to = Point.read(arguments, 1, 1);
			var t = Base.pick(parameter, 0.5),
				t1 = 1 - t,
				current = getCurrentSegment(this)._point,
				// handle = (through - (1 - t)^2 * current - t^2 * to) /
				// (2 * (1 - t) * t)
				handle = through.subtract(current.multiply(t1 * t1))
					.subtract(to.multiply(t * t)).divide(2 * t * t1);
			if (handle.isNaN())
				throw new Error(
					'Cannot put a curve through points with parameter = ' + t);
			this.quadraticCurveTo(handle, to);
		},

		// PORT: New implementation back to Scriptographer
		arcTo: function(to, clockwise /* | through, to */) {
			// Get the start point:
			var current = getCurrentSegment(this),
				from = current._point,
				through;
			if (clockwise === undefined)
				clockwise = true;
			if (typeof clockwise === 'boolean') {
				to = Point.read(arguments, 0, 1);
				var middle = from.add(to).divide(2),
				through = middle.add(middle.subtract(from).rotate(
						clockwise ? -90 : 90));
			} else {
				through = Point.read(arguments, 0, 1);
				to = Point.read(arguments, 1, 1);
			}
			// Construct the two perpendicular middle lines to (from, through)
			// and (through, to), and intersect them to get the center
			var l1 = new Line(from.add(through).divide(2),
					through.subtract(from).rotate(90)),
			 	l2 = new Line(through.add(to).divide(2),
					to.subtract(through).rotate(90)),
				center = l1.intersect(l2),
				line = new Line(from, to, true),
				throughSide = line.getSide(through);
			if (!center) {
				// If the two lines are colinear, there cannot be an arc as the
				// circle is infinitely big and has no center point. If side is
				// 0, the connecting arc line of this huge circle is a line
				// between the two points, so we can use #lineTo instead.
				// Otherwise we bail out:
				if (!throughSide)
					return this.lineTo(to);
				throw new Error("Cannot put an arc through the given points: "
					+ [from, through, to]);
			}
			var vector = from.subtract(center),
				radius = vector.getLength(),
				extent = vector.getDirectedAngle(to.subtract(center)),
				centerSide = line.getSide(center);
			if (centerSide == 0) {
				// If the center is lying on the line, we might have gotten the
				// wrong sign for extent above. Use the sign of the side of the
				// through point.
				extent = throughSide * Math.abs(extent);
			} else if (throughSide == centerSide) {
				// If the center is on the same side of the line (from, to) as
				// the through point, we're extending bellow 180 degrees and
				// need to adapt extent.
				extent -= 360 * (extent < 0 ? -1 : 1);
			}
			var ext = Math.abs(extent),
				count =  ext >= 360 ? 4 : Math.ceil(ext / 90),
				inc = extent / count,
				half = inc * Math.PI / 360,
				z = 4 / 3 * Math.sin(half) / (1 + Math.cos(half)),
				segments = [];
			for (var i = 0; i <= count; i++) {
				// Explicitely use to point for last segment, since depending
				// on values the calculation adds imprecision:
				var pt = i < count ? center.add(vector) : to;
				var out = i < count ? vector.rotate(90).multiply(z) : null;
				if (i == 0) {
					// Modify startSegment
					current.setHandleOut(out);
				} else {
					// Add new Segment
					segments.push(
						new Segment(pt, vector.rotate(-90).multiply(z), out));
				}
				vector = vector.rotate(inc);
			}
			// Add all segments at once at the end for higher performance
			this._add(segments);
		},

		lineBy: function(vector) {
			vector = Point.read(arguments);
			var current = getCurrentSegment(this);
			this.lineTo(current._point.add(vector));
		},

		curveBy: function(throughVector, toVector, parameter) {
			throughVector = Point.read(throughVector);
			toVector = Point.read(toVector);
			var current = getCurrentSegment(this)._point;
			this.curveTo(current.add(throughVector), current.add(toVector),
					parameter);
		},

		arcBy: function(throughVector, toVector) {
			throughVector = Point.read(throughVector);
			toVector = Point.read(toVector);
			var current = getCurrentSegment(this)._point;
			this.arcBy(current.add(throughVector), current.add(toVector));
		},

		closePath: function() {
			this.setClosed(true);
		}
	};
}, new function() { // A dedicated scope for the tricky bounds calculations

	function getBounds(that, matrix, strokePadding) {
		// Code ported and further optimised from:
		// http://blog.hackers-cafe.net/2009/06/how-to-calculate-bezier-curves-bounding.html
		var segments = that._segments,
			first = segments[0];
		if (!first)
			return null;
		var coords = new Array(6),
			prevCoords = new Array(6);
		// Make coordinates for first segment available in prevCoords.
		if (matrix && matrix.isIdentity())
			matrix = null;
		first._transformCoordinates(matrix, prevCoords, false);
		var min = prevCoords.slice(0, 2),
			max = min.slice(0), // clone
			// Add some tolerance for good roots, as t = 0 / 1 are added
			// seperately anyhow, and we don't want joins to be added with
			// radiuses in getStrokeBounds()
			tMin = Numerical.TOLERANCE,
			tMax = 1 - tMin;
		function processSegment(segment) {
			segment._transformCoordinates(matrix, coords, false);

			for (var i = 0; i < 2; i++) {
				var v0 = prevCoords[i], // prev.point
					v1 = prevCoords[i + 4], // prev.handleOut
					v2 = coords[i + 2], // segment.handleIn
					v3 = coords[i]; // segment.point

				function add(value, t) {
					var padding = 0;
					if (value == null) {
						// Calculate bezier polynomial at t
						var u = 1 - t;
						value = u * u * u * v0
								+ 3 * u * u * t * v1
								+ 3 * u * t * t * v2
								+ t * t * t * v3;
						// Only add strokeWidth to bounds for points which lie
						// within 0 < t < 1. The corner cases for cap and join
						// are handled in getStrokeBounds()
						padding = strokePadding ? strokePadding[i] : 0;
					}
					var left = value - padding,
						right = value + padding;
					if (left < min[i])
						min[i] = left;
					if (right > max[i])
						max[i] = right;

				}
				add(v3, null);

				// Calculate derivative of our bezier polynomial, divided by 3.
				// Dividing by 3 allows for simpler calculations of a, b, c and
				// leads to the same quadratic roots below.
				var a = 3 * (v1 - v2) - v0 + v3,
					b = 2 * (v0 + v2) - 4 * v1,
					c = v1 - v0;

				// Solve for derivative for quadratic roots. Each good root
				// (meaning a solution 0 < t < 1) is an extrema in the cubic
				// polynomial and thus a potential point defining the bounds
				if (a == 0) {
					if (b == 0)
					    continue;
					var t = -c / b;
					// Test for good root and add to bounds if good (same below)
					if (tMin < t && t < tMax)
						add(null, t);
					continue;
				}

				var b2ac = b * b - 4 * a * c;
				if (b2ac < 0)
					continue;
				var sqrt = Math.sqrt(b2ac),
					f = 1 / (a * -2),
				 	t1 = (b - sqrt) * f,
					t2 = (b + sqrt) * f;
				if (tMin < t1 && t1 < tMax)
					add(null, t1);
				if (tMin < t2 && t2 < tMax)
					add(null, t2);
			}
			// Swap coordinate buffers
			var tmp = prevCoords;
			prevCoords = coords;
			coords = tmp;
		}
		for (var i = 1, l = segments.length; i < l; i++)
			processSegment(segments[i]);
		if (that._closed)
			processSegment(first);
		return Rectangle.create(min[0], min[1],
					max[0] - min[0], max[1] - min[1]);
	}

	function getPenPadding(radius, matrix) {
		if (!matrix)
			return [radius, radius];
		// If a matrix is provided, we need to rotate the stroke circle
		// and calculate the bounding box of the resulting rotated elipse:
		// Get rotated hor and ver vectors, and determine rotation angle
		// and elipse values from them:
		var mx = matrix.createShiftless(),
			hor = mx.transform(new Point(radius, 0)),
			ver = mx.transform(new Point(0, radius)),
			phi = hor.getAngleInRadians(),
			a = hor.getLength(),
			b = ver.getLength();
		// Formula for rotated ellipses:
		// x = cx + a*cos(t)*cos(phi) - b*sin(t)*sin(phi)
		// y = cy + b*sin(t)*cos(phi) + a*cos(t)*sin(phi)
		// Derivates (by Wolfram Alpha):
		// derivative of x = cx + a*cos(t)*cos(phi) - b*sin(t)*sin(phi)
		// dx/dt = a sin(t) cos(phi) + b cos(t) sin(phi) = 0
		// derivative of y = cy + b*sin(t)*cos(phi) + a*cos(t)*sin(phi)
		// dy/dt = b cos(t) cos(phi) - a sin(t) sin(phi) = 0
		// this can be simplified to:
		// tan(t) = -b * tan(phi) / a // x
		// tan(t) = b * cot(phi) / a // y
		// Solving for t gives:
		// t = pi * n - arctan(b tan(phi)) // x
		// t = pi * n + arctan(b cot(phi)) // y
		var tx = - Math.atan(b * Math.tan(phi)),
			ty = + Math.atan(b / Math.tan(phi)),
			// Due to symetry, we don't need to cycle through pi * n
			// solutions:
			x = a * Math.cos(tx) * Math.cos(phi)
				- b * Math.sin(tx) * Math.sin(phi),
			y = b * Math.sin(ty) * Math.cos(phi)
				+ a * Math.cos(ty) * Math.sin(phi);
		// Now update the join / round padding, as required by
		// getBounds() and code below.
		return [Math.abs(x), Math.abs(y)];
	}

	return {
		/**
		 * The bounding rectangle of the item excluding stroke width.
		 * @param matrix optional
		 */
		getBounds: function(/* matrix */) {
			var useCache = arguments.length == 0;
			// Pass the matrix hidden from Bootstrap, so it still inject
			// getBounds as bean too.
			if (!useCache || !this._bounds) {
				var bounds = this._createBounds(getBounds(this, arguments[0]));
				if (useCache)
					this._bounds = bounds;
				return bounds;
			}
			return this._bounds;
		},

		/**
		 * The bounding rectangle of the item including stroke width.
		 */
		getStrokeBounds: function(/* matrix */) {
			if (!this._style._strokeColor || !this._style._strokeWidth)
				return this.getBounds.apply(this, arguments);
			var useCache = arguments.length == 0;
			if (this._strokeBounds && useCache)
				return this._strokeBounds;
			var matrix = arguments[0], // set #getBounds()
				width = this.getStrokeWidth(),
				radius = width / 2,
				padding = getPenPadding(radius, matrix),
				join = this.getStrokeJoin(),
				cap = this.getStrokeCap(),
				// miter is relative to width. Divide it by 2 since we're
				// measuring half the distance below
				miter = this.getMiterLimit() * width / 2,
				segments = this._segments,
				length = segments.length,
				// It seems to be compatible with Ai we need to pass pen padding
				// untransformed to getBounds()
				bounds = getBounds(this, matrix, getPenPadding(radius));
			// Create a rectangle of padding size, used for union with bounds
			// further down
			var joinBounds = new Rectangle(new Size(padding).multiply(2));

			function add(point) {
				bounds = bounds.include(matrix
					? matrix.transform(point) : point);
			}

			function addBevelJoin(curve, t) {
				var point = curve.getPoint(t),
					normal = curve.getNormal(t).normalize(radius);
				add(point.add(normal));
				add(point.subtract(normal));
			}

			function addJoin(segment, join) {
				// When both handles are set in a segment, the join setting is
				// ignored and round is always used.
				if (join === 'round' || !segment._handleIn.isZero()
						&& !segment._handleOut.isZero()) {
					bounds = bounds.unite(joinBounds.setCenter(matrix
						? matrix.transform(segment._point) : segment._point));
				} else if (join == 'bevel') {
					var curve = segment.getCurve();
					addBevelJoin(curve, 0);
					addBevelJoin(curve.getPrevious(), 1);
				} else if (join == 'miter') {
					var curve2 = segment.getCurve(),
						curve1 = curve2.getPrevious(),
						point = curve2.getPoint(0),
						normal1 = curve1.getNormal(1).normalize(radius),
						normal2 = curve2.getNormal(0).normalize(radius),
						// Intersect the two lines
						line1 = new Line(point.subtract(normal1),
								new Point(-normal1.y, normal1.x)),
						line2 = new Line(point.subtract(normal2),
								new Point(-normal2.y, normal2.x)),
						corner = line1.intersect(line2);
					// Now measure the distance from the segment to the
					// intersection, which his half of the miter distance
					if (!corner || point.getDistance(corner) > miter) {
						addJoin(segment, 'bevel');
					} else {
						add(corner);
					}
				}
			}

			function addCap(segment, cap, t) {
				switch (cap) {
				case 'round':
					return addJoin(segment, cap);
				case 'butt':
				case 'square':
					// Calculate the corner points of butt and square caps
					var curve = segment.getCurve(),
						point = curve.getPoint(t),
						normal = curve.getNormal(t).normalize(radius);
					// For square caps, we need to step away from point in the
					// direction of the tangent, which is the rotated normal
					if (cap === 'square')
						point = point.add(normal.y, -normal.x);
					add(point.add(normal));
					add(point.subtract(normal));
					break;
				}
			}

			for (var i = 1, l = length - (this._closed ? 0 : 1); i < l; i++) {
				addJoin(segments[i], join);
			}
			if (this._closed) {
				addJoin(segments[0], join);
			} else {
				addCap(segments[0], cap, 0);
				addCap(segments[length - 1], cap, 1);
			}
			if (useCache)
				this._strokeBounds = bounds;
			return bounds;
		},

		/**
		 * The bounding rectangle of the item including handles.
		 *
		 * @type Rectangle
		 * @bean
		 */
		getHandleBounds: function() {
			var x1 = Infinity,
				x2 = -Infinity,
				y1 = x1,
				y2 = x2;

			function add(point, handle) {
				var x = point._x,
					y = point._y;
				if (handle) {
					x += handle._x;
					y += handle._y;
				}
				if (x < x1) x1 = x;
				if (x > x2) x2 = x;
				if (y < y1) y1 = y;
				if (y > y2) y2 = y;
			}

			for (var i = 0, l = this._segments.length; i < l; i++) {
				var segment = this._segments[i],
					point = segment._point;
				add(point);
				add(point, segment._handleIn);
				add(point, segment._handleOut);
			}
			return Rectangle.create(x1, y1, x2 - x1, y2 - y1);
		}

	};
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name CompoundPath
 *
 * @class A compound path contains two or more paths, holes are drawn
 * where the paths overlap. All the paths in a compound path take on the
 * style of the backmost path and can be accessed through its
 * {@link Item#children} list.
 *
 * @extends PathItem
 */
var CompoundPath = this.CompoundPath = PathItem.extend(/** @lends CompoundPath# */{
	/**
	 * Creates a new compound path item and places it in the active layer.
	 *
	 * @param {Path[]} [paths] the paths to place within the compound path.
	 *
	 * @example {@paperscript}
	 * // Create a circle shaped path with a hole in it:
	 * var circle = new Path.Circle(new Point(50, 50), 30);
	 * var innerCircle = new Path.Circle(new Point(50, 50), 10);
	 * var compoundPath = new CompoundPath([circle, innerCircle]);
	 * compoundPath.fillColor = 'red';
	 *
	 * // Move the inner circle 5pt to the right:
	 * compoundPath.children[1].position.x += 5;
	 */
	initialize: function(paths) {
		this.base();
		// Allow CompoundPath to have children and named children.
		this._children = [];
		this._namedChildren = {};
		// Do not reassign to paths, since arguments would get modified, which
		// we potentially use as array, depending on what is passed.
		var items = !paths || !Array.isArray(paths)
				|| typeof paths[0] !== 'object' ? arguments : paths;
		for (var i = 0, l = items.length; i < l; i++) {
			var path = items[i];
			// All paths except for the top one (last one in list) are set to
			// clockwise orientation when creating a compound path, so that they
			// appear as holes, but only if their orientation was not already
			// specified before (= _clockwise is defined).
			// TODO: Should this be handled in appendTop / Bottom instead?
			if (path._clockwise === undefined)
				path.setClockwise(i < l - 1);
			this.addChild(path);
		}
	},

	/**
	 * If this is a compound path with only one path inside,
	 * the path is moved outside and the compound path is erased.
	 * Otherwise, the compound path is returned unmodified.
	 *
	 * @return {CompoundPath|Path} the simplified compound path
	 */
	simplify: function() {
		if (this._children.length == 1) {
			var child = this._children[0];
			child.insertAbove(this);
			this.remove();
			return child;
		}
		return this;
	},

	smooth: function() {
		for (var i = 0, l = this._children.length; i < l; i++)
			this._children[i].smooth();
	},

	draw: function(ctx, param) {
		var firstChild = this._children[0];
		ctx.beginPath();
		param.compound = true;
		for (var i = 0, l = this._children.length; i < l; i++)
			Item.draw(this._children[i], ctx, param);
		firstChild._setStyles(ctx);
		var fillColor = firstChild.getFillColor(),
			strokeColor = firstChild.getStrokeColor();
		if (fillColor) {
			ctx.fillStyle = fillColor.getCanvasStyle(ctx);
			ctx.fill();
		}
		if (strokeColor) {
			ctx.strokeStyle = strokeColor.getCanvasStyle(ctx);
			ctx.stroke();
		}
		param.compound = false;
	}
}, new function() { // Injection scope for PostScript-like drawing functions
	/**
	 * Helper method that returns the current path and checks if a moveTo()
	 * command is required first.
	 */
	function getCurrentPath(that) {
		if (!that._children.length)
			throw new Error('Use a moveTo() command first');
		return that._children[that._children.length - 1];
	}

	var fields = {
		// Note: Documentation for these methods is found in PathItem, as they
		// are considered abstract methods of PathItem and need to be defined in
		// all implementing classes.
		moveTo: function(point) {
			var path = new Path();
			this.addChild(path);
			path.moveTo.apply(path, arguments);
		},

		moveBy: function(point) {
			this.moveTo(getCurrentPath(this).getLastSegment()._point.add(
					Point.read(arguments)));
		},

		closePath: function() {
			getCurrentPath(this).setClosed(true);
		}
	};

	// Redirect all other drawing commands to the current path
	Base.each(['lineTo', 'cubicCurveTo', 'quadraticCurveTo', 'curveTo',
			'arcTo', 'lineBy', 'curveBy', 'arcBy'], function(key) {
		fields[key] = function() {
			var path = getCurrentPath(this);
			path[key].apply(path, arguments);
		};
	});

	return fields;
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

Path.inject({ statics: new function() {
	var kappa = 2 / 3 * (Math.sqrt(2) - 1);

	var ovalSegments = [
		new Segment([0, 0.5], [0, kappa ], [0, -kappa]),
		new Segment([0.5, 0], [-kappa, 0], [kappa, 0 ]),
		new Segment([1, 0.5], [0, -kappa], [0, kappa ]),
		new Segment([0.5, 1], [kappa, 0 ], [-kappa, 0])
	];

	return /** @lends Path */{
		/**
		 * {@grouptitle Shaped Paths}
		 *
		 * Creates a Path Item with two anchor points forming a line.
		 *
		 * @param {Point} pt1 the first anchor point of the path
		 * @param {Point} pt2 the second anchor point of the path
		 * @return {Path} the newly created path
		 *
		 * @example
		 * var from = new Point(20, 20);
		 * var to = new Point(100, 100);
		 * var path = new Path.Line(from, to);
		 * path.strokeColor = 'black';
		 */
		Line: function() {
			var step = Math.floor(arguments.length / 2);
			return new Path(
				Segment.read(arguments, 0, step),
				Segment.read(arguments, step, step)
			);
		},

		/**
		 * Creates a rectangle shaped Path Item from the passed point and size.
		 *
		 * @name Path.Rectangle
		 * @param {Point} point
		 * @param {Size} size
		 * @return {Path} the newly created path
		 *
		 * @example
		 * var point = new Point(100, 100);
		 * var size = new Size(100, 100);
		 * var rectangle = new Rectangle(point, size);
		 * var path = new Path.Rectangle(rectangle);
		 * path.strokeColor = 'black';
		 */
		/**
		 * Creates a rectangle shaped Path Item from the passed points. These do not
		 * necessarily need to be the top left and bottom right corners, the
		 * constructor figures out how to fit a rectangle between them.
		 *
		 * @name Path.Rectangle
		 * @param {Point} point1 The first point defining the rectangle
		 * @param {Point} point2 The second point defining the rectangle
		 * @return {Path} the newly created path
		 *
		 * @example
		 * var point = new Point(100, 100);
		 * var point2 = new Point(200, 300);
		 * var path = new Path.Rectangle(point, point2);
		 * path.strokeColor = 'black';
		 */
		/**
		 * Creates a rectangle shaped Path Item from the passed abstract
		 * {@link Rectangle}.
		 *
		 * @param {Rectangle} rect
		 * @return {Path} the newly created path
		 *
		 * @example
		 * var point = new Point(100, 100);
		 * var size = new Size(100, 100);
		 * var rectangle = new Rectangle(point, size);
		 * var path = new Path.Rectangle(rectangle);
		 * path.strokeColor = 'black';
		 */
		Rectangle: function(rect) {
			rect = Rectangle.read(arguments);
			var path = new Path(),
				corners = ['getBottomLeft', 'getTopLeft', 'getTopRight',
					'getBottomRight'],
				segments = new Array(4);
			for (var i = 0; i < 4; i++)
				segments[i] = new Segment(rect[corners[i]]());
			path._add(segments);
			path._closed = true;
			return path;
		},

		/**
	 	* Creates a rectangular Path Item with rounded corners.
		 *
		 * @param {Rectangle} rect
		 * @param {Size} size the size of the rounded corners
		 * @return {Path} the newly created path
		 *
		 * @example
		 * var point = new Point(100, 100);
		 * var size = new Size(100, 100);
		 * var rectangle = new Rectangle(point, size);
		 * var cornerSize = new Size(30, 30);
		 * var path = new Path.RoundRectangle(rectangle, cornerSize);
		 */
		RoundRectangle: function(rect, size) {
			if (arguments.length == 2) {
				rect = Rectangle.read(arguments, 0, 1);
				size = Size.read(arguments, 1, 1);
			} else if (arguments.length == 6) {
				rect = Rectangle.read(arguments, 0, 4);
				size = Size.read(arguments, 4, 2);
			}
			size = Size.min(size, rect.getSize().divide(2));
			var path = new Path(),
				uSize = size.multiply(kappa * 2),
				bl = rect.getBottomLeft(),
				tl = rect.getTopLeft(),
				tr = rect.getTopRight(),
				br = rect.getBottomRight();
			path._add([
				new Segment(bl.add(size.width, 0), null, [-uSize.width, 0]),
				new Segment(bl.subtract(0, size.height), [0, uSize.height], null),

				new Segment(tl.add(0, size.height), null, [0, -uSize.height]),
				new Segment(tl.add(size.width, 0), [-uSize.width, 0], null),

				new Segment(tr.subtract(size.width, 0), null, [uSize.width, 0]),
				new Segment(tr.add(0, size.height), [0, -uSize.height], null),

				new Segment(br.subtract(0, size.height), null, [0, uSize.height]),
				new Segment(br.subtract(size.width, 0), [uSize.width, 0], null)
			]);
			path._closed = true;
			return path;
		},

		/**
		* Creates an oval shaped Path Item.
		 *
		 * @param {Rectangle} rect
		 * @param {Boolean} [circumscribed=false] when set to {@code true} the
		 *        oval shaped path will be created so the rectangle fits into
		 *        it. When set to {@code false} the oval path will fit within
		 *        the rectangle.
		 * @return {Path} the newly created path
		 *
		 * @example
		 * var topLeft = new Point(100, 100);
		 * var size = new Size(150, 100);
		 * var rectangle = new Rectangle(topLeft, size);
		 * var path = new Path.Oval(rectangle);
		 * path.fillColor = 'black';
		 */
		Oval: function(rect) {
			rect = Rectangle.read(arguments);
			var path = new Path(),
				topLeft = rect.getTopLeft(),
				size = new Size(rect.width, rect.height),
				segments = new Array(4);
			for (var i = 0; i < 4; i++) {
				var segment = ovalSegments[i];
				segments[i] = new Segment(
					segment._point.multiply(size).add(topLeft),
					segment._handleIn.multiply(size),
					segment._handleOut.multiply(size)
				);
			}
			path._add(segments);
			path._closed = true;
			return path;
		},

		/**
		 * Creates a circle shaped Path Item.
		 *
		 * @param {Point} center the center point of the circle
		 * @param {Number} radius the radius of the circle
		 * @return {Path} the newly created path
		 *
		 * @example
		 * var path = new Path.Circle(new Point(100, 100), 50);
		 */
		Circle: function(center, radius) {
			if (arguments.length == 3) {
				center = Point.read(arguments, 0, 2);
				radius = arguments[2];
			} else {
				center = Point.read(arguments, 0, 1);
			}
			return Path.Oval(new Rectangle(center.subtract(radius),
					new Size(radius * 2, radius * 2)));
		},

		/**
		 * Creates a circular arc shaped Path Item.
		 *
		 * @param {Point} from the starting point of the circular arc
		 * @param {Point} through the point the arc passes through
		 * @param {Point} to the end point of the arc
		 * @return {Path} the newly created path
		 *
		 * @example
		 * var start = new Point(0, 0);
		 * var through = new Point(100, 100);
		 * var to = new Point(200, 150);
		 * var path = new Path.Arc(start, through, to);
		 * path.strokeColor = 'black';
		 */
		Arc: function(from, through, to) {
			var path = new Path();
			path.moveTo(from);
			path.arcTo(through, to);
			return path;
		},

		/**
		 * Creates a regular polygon shaped Path Item.
		 *
		 * @param {Point} center the center point of the polygon
		 * @param {Number} numSides the number of sides of the polygon
		 * @param {Number} radius the radius of the polygon
		 * @return {Path} the newly created path
		 *
		 * @example
		 * // Create a triangle shaped path
		 * var center = new Point(100, 100);
		 * var sides = 3;
		 * var radius = 50;
		 * var triangle = new Path.RegularPolygon(center, sides, radius);
		 * triangle.fillColor = 'black';
		 *
		 * @example
		 * // Create a decahedron shaped path
		 * var center = new Point(100, 100);
		 * var sides = 10;
		 * var radius = 50;
		 * var decahedron = new Path.RegularPolygon(center, sides, radius);
		 * decahedron.fillColor = 'black';
		 */
		RegularPolygon: function(center, numSides, radius) {
			center = Point.read(arguments, 0, 1);
			var path = new Path(),
				step = 360 / numSides,
				three = !(numSides % 3),
				vector = new Point(0, three ? -radius : radius),
				offset = three ? -1 : 0.5,
				segments = new Array(numSides);
			for (var i = 0; i < numSides; i++) {
				segments[i] = new Segment(center.add(
					vector.rotate((i + offset) * step)));
			}
			path._add(segments);
			path._closed = true;
			return path;
		},

		/**
		 * Creates a star shaped Path Item.
		 *
		 * The largest of {@code radius1} and {@code radius2} will be the outer
		 * radius of the star. The smallest of radius1 and radius2 will be the
		 * inner radius.
		 *
		 * @param {Point} center the center point of the star
		 * @param {Number} numPoints the number of points of the star
		 * @param {Number} radius1
		 * @param {Number} radius2
		 * @return {Path} the newly created path
		 *
		 * @example
		 * var center = new Point(100, 100);
		 * var points = 6;
		 * var radius1 = 20;
		 * var radius2 = 50;
		 * var path = new Path.Star(center, points, radius1, radius2);
		 * path.fillColor = 'black';
		 */
		Star: function(center, numPoints, radius1, radius2) {
			center = Point.read(arguments, 0, 1);
			numPoints *= 2;
			var path = new Path(),
				step = 360 / numPoints,
				vector = new Point(0, -1),
				segments = new Array(numPoints);
			for (var i = 0; i < numPoints; i++) {
				segments[i] = new Segment(center.add(
					vector.rotate(step * i).multiply(i % 2 ? radius2 : radius1)));
			}
			path._add(segments);
			path._closed = true;
			return path;
		}
	};
}});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

var PathFlattener = Base.extend({
	initialize: function(path) {
		this.curves = []; // The curve values as returned by getValues()
		this.parts = []; // The calculated, subdivided parts of the path
		this.length = 0; // The total length of the path
		// Keep a current index from the part where we last where in
		// getParameter(), to optimise for iterator-like usage of the flattener.
		this.index = 0;

		// Instead of relying on path.curves, we only use segments here and
		// get the curve values from them.

		// Now walk through all curves and compute the parts for each of them,
		// by recursively calling _computeParts().
		var segments = path._segments,
			segment1 = segments[0],
			segment2,
			that = this;

		function addCurve(segment1, segment2) {
			var curve = Curve.getValues(segment1, segment2);
			that.curves.push(curve);
			that._computeParts(curve, segment1._index, 0, 1);
		}

		for (var i = 1, l = segments.length; i < l; i++) {
			segment2 = segments[i];
			addCurve(segment1, segment2);
			segment1 = segment2;
		}
		if (path._closed)
			addCurve(segment2, segments[0]);
	},

	_computeParts: function(curve, index, minT, maxT) {
		// Check if the t-span is big enough for subdivision.
		// We're not subdividing more than 32 times...
		if ((maxT - minT) > 1 / 32
				&& !Curve.isSufficientlyFlat.apply(Curve, curve)) {
			var curves = Curve.subdivide.apply(Curve, curve);
			var halfT = (minT + maxT) / 2;
			// Recursively subdive and compute parts again.
			this._computeParts(curves[0], index, minT, halfT);
			this._computeParts(curves[1], index, halfT, maxT);
		} else {
			// Calculate distance between p1 and p2
			var x = curve[6] - curve[0],
				y = curve[7] - curve[1],
				dist = Math.sqrt(x * x + y * y);
			if (dist > Numerical.TOLERANCE) {
				this.length += dist;
				this.parts.push({
					offset: this.length,
					value: maxT,
					index: index
				});
			}
		}
	},

	getParameter: function(offset) {
		// Make sure we're not beyond the requested offset already. Search the
		// start position backwards from where to then process the loop below.
		var i, j = this.index;
		for (;;) {
			i = j;
			if (j == 0 || this.parts[--j].offset < offset)
				break;
		}
		// Find the part that succeeds the given offset, then interpolate
		// with the previous part
		for (var l = this.parts.length; i < l; i++) {
			var part = this.parts[i];
			if (part.offset >= offset) {
				// Found the right part, remember current position
				this.index = i;
				// Now get the previous part so we can linearly interpolate
				// the curve parameter
				var prev = this.parts[i - 1];
				// Make sure we only use the previous parameter value if its
				// for the same curve, by checking index. Use 0 otherwise.
				var prevVal = prev && prev.index == part.index ? prev.value : 0,
					prevLen = prev ? prev.offset : 0;
				return {
					// Interpolate
					value: prevVal + (part.value - prevVal)
						* (offset - prevLen) /  (part.offset - prevLen),
					index: part.index
				};
			}
		}
		// Return last one
		var part = this.parts[this.parts.length - 1];
		return {
			value: 1,
			index: part.index
		};
	},

	evaluate: function(offset, type) {
		var param = this.getParameter(offset);
		return Curve.evaluate.apply(Curve,
				this.curves[param.index].concat([param.value, type]));
	},

	drawPart: function(ctx, from, to) {
		from = this.getParameter(from);
		to = this.getParameter(to);
		for (var i = from.index; i <= to.index; i++) {
			var curve = Curve.getPart.apply(Curve, this.curves[i].concat(
					i == from.index ? from.value : 0,
					i == to.index ? to.value : 1));
			if (i == from.index)
				ctx.moveTo(curve[0], curve[1]);
			ctx.bezierCurveTo.apply(ctx, curve.slice(2));
		}
	}
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

// An Algorithm for Automatically Fitting Digitized Curves
// by Philip J. Schneider
// from "Graphics Gems", Academic Press, 1990
var PathFitter = Base.extend({
	initialize: function(path, error) {
		this.points = [];
		var segments = path._segments,
			prev;
		// Copy over points from path and filter out adjacent duplicates.
		for (var i = 0, l = segments.length; i < l; i++) {
			var point = segments[i].point.clone();
			if (!prev || !prev.equals(point)) {
				this.points.push(point);
				prev = point;
			}
		}
		this.error = error;
	},

	fit: function() {
		this.segments = [new Segment(this.points[0])];
		this.fitCubic(0, this.points.length - 1,
				// Left Tangent
				this.points[1].subtract(this.points[0]).normalize(),
				// Right Tangent
				this.points[this.points.length - 2].subtract(
					this.points[this.points.length - 1]).normalize());
		return this.segments;
	},

	// Fit a Bezier curve to a (sub)set of digitized points
	fitCubic: function(first, last, tan1, tan2) {
		//	Use heuristic if region only has two points in it
		if (last - first == 1) {
			var pt1 = this.points[first],
				pt2 = this.points[last],
				dist = pt1.getDistance(pt2) / 3;
			this.addCurve([pt1, pt1.add(tan1.normalize(dist)),
					pt2.add(tan2.normalize(dist)), pt2]);
			return;
		}
		// Parameterize points, and attempt to fit curve
		var uPrime = this.chordLengthParameterize(first, last),
			maxError = Math.max(this.error, this.error * this.error),
			error,
			split;
		// Try 4 iterations
		for (var i = 0; i <= 4; i++) {
			var curve = this.generateBezier(first, last, uPrime, tan1, tan2);
			//	Find max deviation of points to fitted curve
			var max = this.findMaxError(first, last, curve, uPrime);
			if (max.error < this.error) {
				this.addCurve(curve);
				return;
			}
			split = max.index;
			// If error not too large, try reparameterization and iteration
			if (max.error >= maxError)
				break;
			this.reparameterize(first, last, uPrime, curve);
			maxError = max.error;
		}
		// Fitting failed -- split at max error point and fit recursively
		var V1 = this.points[split - 1].subtract(this.points[split]),
			V2 = this.points[split].subtract(this.points[split + 1]),
			tanCenter = V1.add(V2).divide(2).normalize();
		this.fitCubic(first, split, tan1, tanCenter);
		this.fitCubic(split, last, tanCenter.negate(), tan2);
	},

	addCurve: function(curve) {
		var prev = this.segments[this.segments.length - 1];
		prev.setHandleOut(curve[1].subtract(curve[0]));
		this.segments.push(
				new Segment(curve[3], curve[2].subtract(curve[3])));
	},

	// Use least-squares method to find Bezier control points for region.
	generateBezier: function(first, last, uPrime, tan1, tan2) {
		var epsilon = Numerical.TOLERANCE,
			pt1 = this.points[first],
			pt2 = this.points[last],
			// Create the C and X matrices
		 	C = [[0, 0], [0, 0]],
			X = [0, 0];

		for (var i = 0, l = last - first + 1; i < l; i++) {
			var u = uPrime[i],
				t = 1 - u,
				b = 3 * u * t,
				b0 = t * t * t,
				b1 = b * t,
				b2 = b * u,
				b3 = u * u * u,
				a1 = tan1.normalize(b1),
				a2 = tan2.normalize(b2),
				tmp = this.points[first + i]
					.subtract(pt1.multiply(b0 + b1))
					.subtract(pt2.multiply(b2 + b3));
			C[0][0] += a1.dot(a1);
			C[0][1] += a1.dot(a2);
			// C[1][0] += a1.dot(a2);
			C[1][0] = C[0][1];
			C[1][1] += a2.dot(a2);
			X[0] += a1.dot(tmp);
			X[1] += a2.dot(tmp);
		}

		// Compute the determinants of C and X
		var detC0C1 = C[0][0] * C[1][1] - C[1][0] * C[0][1],
			alpha1, alpha2;
		if (Math.abs(detC0C1) > epsilon) {
			// Kramer's rule
			var detC0X  = C[0][0] * X[1]    - C[1][0] * X[0],
				detXC1  = X[0]    * C[1][1] - X[1]    * C[0][1];
			// Derive alpha values
			alpha1 = detXC1 / detC0C1;
			alpha2 = detC0X / detC0C1;
		} else {
			// Matrix is under-determined, try assuming alpha1 == alpha2
			var c0 = C[0][0] + C[0][1],
				c1 = C[1][0] + C[1][1];
			if (Math.abs(c0) > epsilon) {
				alpha1 = alpha2 = X[0] / c0;
			} else if (Math.abs(c0) > epsilon) {
				alpha1 = alpha2 = X[1] / c1;
			} else {
				// Handle below
				alpha1 = alpha2 = 0.;
			}
		}

		// If alpha negative, use the Wu/Barsky heuristic (see text)
		// (if alpha is 0, you get coincident control points that lead to
		// divide by zero in any subsequent NewtonRaphsonRootFind() call.
		var segLength = pt2.getDistance(pt1);
		epsilon *= segLength;
		if (alpha1 < epsilon || alpha2 < epsilon) {
			// fall back on standard (probably inaccurate) formula,
			// and subdivide further if needed.
			alpha1 = alpha2 = segLength / 3;
		}

		// First and last control points of the Bezier curve are
		// positioned exactly at the first and last data points
		// Control points 1 and 2 are positioned an alpha distance out
		// on the tangent vectors, left and right, respectively
		return [pt1, pt1.add(tan1.normalize(alpha1)),
				pt2.add(tan2.normalize(alpha2)), pt2];
	},

	// Given set of points and their parameterization, try to find
	// a better parameterization.
	reparameterize: function(first, last, u, curve) {
		for (var i = first; i <= last; i++) {
			u[i - first] = this.findRoot(curve, this.points[i], u[i - first]);
		}
	},

	// Use Newton-Raphson iteration to find better root.
	findRoot: function(curve, point, u) {
		var curve1 = [],
			curve2 = [];
		// Generate control vertices for Q'
		for (var i = 0; i <= 2; i++) {
			curve1[i] = curve[i + 1].subtract(curve[i]).multiply(3);
		}
		// Generate control vertices for Q''
		for (var i = 0; i <= 1; i++) {
			curve2[i] = curve1[i + 1].subtract(curve1[i]).multiply(2);
		}
		// Compute Q(u), Q'(u) and Q''(u)
		var pt = this.evaluate(3, curve, u),
		 	pt1 = this.evaluate(2, curve1, u),
		 	pt2 = this.evaluate(1, curve2, u),
		 	diff = pt.subtract(point),
			df = pt1.dot(pt1) + diff.dot(pt2);
		// Compute f(u) / f'(u)
		if (Math.abs(df) < Numerical.TOLERANCE)
			return u;
		// u = u - f(u) / f'(u)
		return u - diff.dot(pt1) / df;
	},

	// Evaluate a Bezier curve at a particular parameter value
	evaluate: function(degree, curve, t) {
		// Copy array
		var tmp = curve.slice();
		// Triangle computation
		for (var i = 1; i <= degree; i++) {
			for (var j = 0; j <= degree - i; j++) {
				tmp[j] = tmp[j].multiply(1 - t).add(tmp[j + 1].multiply(t));
			}
		}
		return tmp[0];
	},

	// Assign parameter values to digitized points
	// using relative distances between points.
	chordLengthParameterize: function(first, last) {
		var u = [0];
		for (var i = first + 1; i <= last; i++) {
			u[i - first] = u[i - first - 1]
					+ this.points[i].getDistance(this.points[i - 1]);
		}
		for (var i = 1, m = last - first; i <= m; i++) {
			u[i] /= u[m];
		}
		return u;
	},

	// Find the maximum squared distance of digitized points to fitted curve.
	findMaxError: function(first, last, curve, u) {
		var index = Math.floor((last - first + 1) / 2),
			maxDist = 0;
		for (var i = first + 1; i < last; i++) {
			var P = this.evaluate(3, curve, u[i - first]);
			var v = P.subtract(this.points[i]);
			var dist = v.x * v.x + v.y * v.y; // squared
			if (dist >= maxDist) {
				maxDist = dist;
				index = i;
			}
		}
		return {
			error: maxDist,
			index: index
		};
	}
});

/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name TextItem
 *
 * @class The TextItem type allows you to create typography. Its
 * functionality is inherited by different text item types such as
 * {@link PointText}, and {@link AreaText} (coming soon). They each add a
 * layer of functionality that is unique to their type, but share the
 * underlying properties and functions that they inherit from TextItem.
 *
 * @extends Item
 */
var TextItem = this.TextItem = Item.extend(/** @lends TextItem# */{
	initialize: function() {
		this.base();
		this._content = '';
		this._characterStyle = CharacterStyle.create(this);
		this.setCharacterStyle(this._project.getCurrentStyle());
		this._paragraphStyle = ParagraphStyle.create(this);
		this.setParagraphStyle();
	},

	/**
	 * The text contents of the text item.
	 *
	 * @name TextItem#content
	 * @type String
	 *
	 * @example {@paperscript}
	 * // Setting the content of a PointText item:
	 *
	 * // Create a point-text item at {x: 30, y: 30}:
	 * var text = new PointText(new Point(30, 30));
	 * text.fillColor = 'black';
	 *
	 * // Set the content of the text item:
	 * text.content = 'Hello world';
	 *
	 * @example {@paperscript}
	 * // Interactive example, move your mouse over the view below:
	 *
	 * // Create a point-text item at {x: 30, y: 30}:
	 * var text = new PointText(new Point(30, 30));
	 * text.fillColor = 'black';
	 *
	 * text.content = 'Move your mouse over the view, to see its position';
	 *
	 * function onMouseMove(event) {
	 * 	// Each time the mouse is moved, set the content of
	 * 	// the point text to describe the position of the mouse:
	 * 	text.content = 'Your position is: ' + event.point.toString();
	 * }
	 */

	_clone: function(copy) {
		copy._content = this._content;
		copy.setCharacterStyle(this._characterStyle);
		copy.setParagraphStyle(this._paragraphStyle);
		return this.base(copy);
	},

	getContent: function() {
		return this._content;
	},

	setContent: function(content) {
		this._changed(Change.CONTENT);
		this._content = '' + content;
	},

	/**
	 * {@grouptitle Style Properties}
	 *
	 * The character style of the text item.
	 *
	 * @type CharacterStyle
	 * @bean
	 */
	getCharacterStyle: function() {
		return this._characterStyle;
	},

	setCharacterStyle: function(style) {
		this._characterStyle.initialize(style);
	},

	/**
	 * The paragraph style of the text item.
	 *
	 * @type ParagraphStyle
	 * @bean
	 */
	getParagraphStyle: function() {
		return this._paragraphStyle;
	},

	setParagraphStyle: function(style) {
		this._paragraphStyle.initialize(style);
	}
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name PointText
 *
 * @class A PointText item represents a piece of typography in your Paper.js
 * project which starts from a certain point and extends by the amount of
 * characters contained in it.
 *
 * @extends TextItem
 */
var PointText = this.PointText = TextItem.extend(/** @lends PointText# */{
	/**
	 * Creates a point text item
	 *
	 * @param {Point} point the position where the text will start
	 *
	 * @example
	 * var text = new PointText(new Point(50, 100));
	 * text.justification = 'center';
	 * text.fillColor = 'black';
	 * text.content = 'The contents of the point text';
	 */
	initialize: function(point) {
		this.base();
		var point = Point.read(arguments);
		this._point = LinkedPoint.create(this, 'setPoint', point.x, point.y);
		this._matrix = new Matrix().translate(point);
	},

	clone: function() {
		var copy = this._clone(new PointText(this._point));
		// Use Matrix#initialize to easily copy over values.
		copy._matrix.initialize(this._matrix);
		return copy;
	},

	/**
	 * The PointText's anchor point
	 *
	 * @type Point
	 * @bean
	 */
	getPoint: function() {
		return this._point;
	},

	setPoint: function(point) {
		this._transform(new Matrix().translate(
				Point.read(arguments).subtract(this._point)));
	},

	// TODO: Position should be the center point of the bounds but we currently
	// don't support bounds for PointText.
	getPosition: function() {
		return this._point;
	},

	setPosition: function(point) {
		this.setPoint.apply(this, arguments);
	},

	_transform: function(matrix, flags) {
		this._matrix.preConcatenate(matrix);
		// We need to transform the LinkedPoint, passing true for dontNotify so
		// chaning it won't trigger calls of setPoint(), leading to an endless
		// recursion.
		matrix._transformPoint(this._point, this._point, true);
	},

	draw: function(ctx) {
		if (!this._content)
			return;
		ctx.save();
		ctx.font = this.getFontSize() + 'pt ' + this.getFont();
		ctx.textAlign = this.getJustification();
		this._matrix.applyToContext(ctx);

		var fillColor = this.getFillColor();
		var strokeColor = this.getStrokeColor();
		if (!fillColor || !strokeColor)
			ctx.globalAlpha = this._opacity;
		if (fillColor) {
			ctx.fillStyle = fillColor.getCanvasStyle(ctx);
			ctx.fillText(this._content, 0, 0);
		}
		if (strokeColor) {
			ctx.strokeStyle = strokeColor.getCanvasStyle(ctx);
			ctx.strokeText(this._content, 0, 0);
		}
		ctx.restore();
	}
});

/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * Internal base-class for all style objects, e.g. PathStyle, CharacterStyle,
 * PargraphStyle.
 */
var Style = Item.extend({
	initialize: function(style) {
		// If the passed style object is also a Style, clone its clonable
		// fields rather than simply copying them.
		var clone = style instanceof Style;
		// Note: This relies on bean getters and setters that get implicetly
		// called when getting from style[key] and setting on this[key].
		return Base.each(this._defaults, function(value, key) {
			value = style && style[key] || value;
			this[key] = value && clone && value.clone
					? value.clone() : value;
		}, this);
	},

	statics: {
		create: function(item) {
			var style = new this(this.dont);
			style._item = item;
			return style;
		},

		extend: function(src) {
			// Inject style getters and setters into the 'owning' class, which
			// redirect calls to the linked style objects through their internal
			// property on the instances of that class, as defined by _style.
			var styleKey = src._style,
				flags = src._flags || {};
			src._owner.inject(Base.each(src._defaults, function(value, key) {
				var isColor = !!key.match(/Color$/),
					part = Base.capitalize(key),
					set = 'set' + part,
					get = 'get' + part;
				// Simply extend src with these getters and setters, to be
				// injected into this class using this.base() further down.
				src[set] = function(value) {
					var children = this._item && this._item._children;
					value = isColor ? Color.read(arguments) : value;
					if (children) {
						for (var i = 0, l = children.length; i < l; i++)
							children[i][styleKey][set](value);
					} else {
						var old = this['_' + key];
						if (old != value && !(old && old.equals
									&& old.equals(value))) {
							this['_' + key] = value;
							if (isColor) {
								if (old)
									old._removeOwner(this._item);
								if (value)
									value._addOwner(this._item);
							}
							if (this._item)
								this._item._changed(flags[key] || Change.STYLE);
						}
					}
					return this;
				};
				src[get] = function() {
					var children = this._item && this._item._children,
						style;
					// If this item has children, walk through all of them and
					// see if they all have the same style.
					if (!children)
						return this['_' + key];
					for (var i = 0, l = children.length; i < l; i++) {
						var childStyle = children[i][styleKey][get]();
						if (!style) {
							style = childStyle;
						} else if (style != childStyle && !(style
								&& style.equals && style.equals(childStyle))) {
							// If there is another item with a different
							// style, the style is not defined:
							// PORT: Change this in Scriptographer
							// (currently returns null)
							return undefined;
						}
					}
					return style;
				};
				// Style-getters and setters for owner class:
				// 'this' = the Base.each() side-car = the object that is
				// returned from Base.each and injected into _owner above:
				this[set] = function(value) {
					this[styleKey][set](value);
					return this;
				};
				this[get] = function() {
					return this[styleKey][get]();
				};
			}, {}));
			return this.base(src);
		}
	}
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name PathStyle
 *
 * @class PathStyle is used for changing the visual styles of items
 * contained within a Paper.js project and is returned by
 * {@link Item#style} and {@link Project#currentStyle}.
 *
 * All properties of PathStyle are also reflected directly in {@link Item},
 * i.e.: {@link Item#fillColor}.
 *
 * To set multiple style properties in one go, you can pass an object to
 * {@link Item#style}. This is a convenient way to define a style once and
 * apply it to a series of items:
 *
 * @classexample {@paperscript}
 * var circleStyle = {
 * 	fillColor: new RGBColor(1, 0, 0),
 * 	strokeColor: 'black',
 * 	strokeWidth: 5
 * };
 *
 * var path = new Path.Circle(new Point(80, 50), 30);
 * path.style = circleStyle;
 */
var PathStyle = this.PathStyle = Style.extend(/** @lends PathStyle# */{
	// windingRule / resolution / fillOverprint / strokeOverprint are currently
	// not supported.
	_defaults: {
		fillColor: undefined,
		strokeColor: undefined,
		strokeWidth: 1,
		strokeCap: 'butt',
		strokeJoin: 'miter',
		miterLimit: 10,
		dashOffset: 0,
		dashArray: []
	},
	_flags: {
		strokeWidth: Change.STROKE,
		strokeCap: Change.STROKE,
		strokeJoin: Change.STROKE,
		miterLimit: Change.STROKE
	},
	_owner: Item,
	_style: '_style'

	// DOCS: why isn't the example code showing up?
	/**
	 * PathStyle objects don't need to be created directly. Just pass an
	 * object to {@link Item#style} or {@link Project#currentStyle}, it will
	 * be converted to a PathStyle object internally.
	 *
	 * @name PathStyle#initialize
	 * @param {object} style
	 */

	/**
	 * {@grouptitle Stroke Style}
	 *
	 * The color of the stroke.
	 *
	 * @property
	 * @name PathStyle#strokeColor
	 * @type RGBColor|HSBColor|GrayColor
	 *
	 * @example {@paperscript}
	 * // Setting the stroke color of a path:
	 *
	 * // Create a circle shaped path at { x: 80, y: 50 }
	 * // with a radius of 35:
	 * var circle = new Path.Circle(new Point(80, 50), 35);
	 *
	 * // Set its stroke color to RGB red:
	 * circle.strokeColor = new RGBColor(1, 0, 0);
	 */

	/**
	 * The width of the stroke.
	 *
	 * @property
	 * @name PathStyle#strokeWidth
	 * @default 1
	 * @type Number
	 *
	 * @example {@paperscript}
	 * // Setting an item's stroke width:
	 *
	 * // Create a circle shaped path at { x: 80, y: 50 }
	 * // with a radius of 35:
	 * var circle = new Path.Circle(new Point(80, 50), 35);
	 *
	 * // Set its stroke color to black:
	 * circle.strokeColor = 'black';
	 *
	 * // Set its stroke width to 10:
	 * circle.strokeWidth = 10;
	 */

	/**
	 * The shape to be used at the end of open {@link Path} items, when they
	 * have a stroke.
	 *
	 * @property
	 * @name PathStyle#strokeCap
	 * @default 'butt'
	 * @type String('round', 'square', 'butt')
	 *
	 * @example {@paperscript height=200}
	 * // A look at the different stroke caps:
	 *
	 * var line = new Path(new Point(80, 50), new Point(420, 50));
	 * line.strokeColor = 'black';
	 * line.strokeWidth = 20;
	 *
	 * // Select the path, so we can see where the stroke is formed:
	 * line.selected = true;
	 *
	 * // Set the stroke cap of the line to be round:
	 * line.strokeCap = 'round';
	 *
	 * // Copy the path and set its stroke cap to be square:
	 * var line2 = line.clone();
	 * line2.position.y += 50;
	 * line2.strokeCap = 'square';
	 *
	 * // Make another copy and set its stroke cap to be butt:
	 * var line2 = line.clone();
	 * line2.position.y += 100;
	 * line2.strokeCap = 'butt';
	 */

	/**
	 * The shape to be used at the corners of paths when they have a stroke.
	 *
	 * @property
	 * @name PathStyle#strokeJoin
	 * @default 'miter'
	 * @type String ('miter', 'round', 'bevel')
	 *
	 * @example {@paperscript height=120}
	 * // A look at the different stroke joins:
	 * var path = new Path();
	 * path.add(new Point(80, 100));
	 * path.add(new Point(120, 40));
	 * path.add(new Point(160, 100));
	 * path.strokeColor = 'black';
	 * path.strokeWidth = 20;
	 *
	 * // Select the path, so we can see where the stroke is formed:
	 * path.selected = true;
	 *
	 * var path2 = path.clone();
	 * path2.position.x += path2.bounds.width * 1.5;
	 * path2.strokeJoin = 'round';
	 *
	 * var path3 = path2.clone();
	 * path3.position.x += path3.bounds.width * 1.5;
	 * path3.strokeJoin = 'bevel';
	 */

	/**
	 * The dash offset of the stroke.
	 *
	 * @property
	 * @name PathStyle#dashOffset
	 * @default 0
	 * @type Number
	 */

	/**
	 * Specifies an array containing the dash and gap lengths of the stroke.
	 *
	 * @example {@paperscript}
	 * var path = new Path.Circle(new Point(80, 50), 40);
	 * path.strokeWidth = 2;
	 * path.strokeColor = 'black';
	 *
	 * // Set the dashed stroke to [10pt dash, 4pt gap]:
	 * path.dashArray = [10, 4];
	 *
	 * @property
	 * @name PathStyle#dashArray
	 * @default []
	 * @type Array
	 */

	/**
	 * The miter limit of the stroke.
	 * When two line segments meet at a sharp angle and miter joins have been
	 * specified for {@link #strokeJoin}, it is possible for the miter to extend
	 * far beyond the {@link #strokeWidth} of the path. The miterLimit imposes a
	 * limit on the ratio of the miter length to the {@link #strokeWidth}.
	 *
	 * @property
	 * @default 10
	 * @name PathStyle#miterLimit
	 * @type Number
	 */

	/**
	 * {@grouptitle Fill Style}
	 *
	 * The fill color.
	 *
	 * @property
	 * @name PathStyle#fillColor
	 * @type RGBColor|HSBColor|GrayColor
	 *
	 * @example {@paperscript}
	 * // Setting the fill color of a path to red:
	 *
	 * // Create a circle shaped path at { x: 80, y: 50 }
	 * // with a radius of 35:
	 * var circle = new Path.Circle(new Point(80, 50), 35);
	 *
	 * // Set the fill color of the circle to RGB red:
	 * circle.fillColor = new RGBColor(1, 0, 0);
	 */
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name ParagraphStyle
 *
 * @class The ParagraphStyle object represents the paragraph style of a text
 * item ({@link TextItem#paragraphStyle}).
 *
 * Currently, the ParagraphStyle object may seem a bit empty, with just the
 * {@link #justification} property. Yet, we have lots in store for Paper.js
 * when it comes to typography. Please stay tuned.
 *
 * @classexample
 * var text = new PointText(new Point(0,0));
 * text.fillColor = 'black';
 * text.content = 'Hello world.';
 * text.paragraphStyle.justification = 'center';
 */
var ParagraphStyle = this.ParagraphStyle = Style.extend(/** @lends ParagraphStyle# */{
	_defaults: {
		justification: 'left'
	},
	_owner: TextItem,
	_style: '_paragraphStyle'

	/**
	 * ParagraphStyle objects don't need to be created directly. Just pass an
	 * object to {@link TextItem#paragraphStyle}, it will be converted to a
	 * ParagraphStyle object internally.
	 *
	 * @name ParagraphStyle#initialize
	 * @param {object} style
	 */

	/**
	 * The justification of the paragraph.
	 *
	 * @name ParagraphStyle#justification
	 * @default 'left'
	 * @type String('left', 'right', 'center')
	 */
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name CharacterStyle
 *
 * @class The CharacterStyle object represents the character style of a text
 * item ({@link TextItem#characterStyle})
 *
 * @extends PathStyle
 *
 * @classexample
 * var text = new PointText(new Point(50, 50));
 * text.content = 'Hello world.';
 * text.characterStyle = {
 * 	fontSize: 50,
 * 	fillColor: 'black',
 * };
 */
var CharacterStyle = this.CharacterStyle = PathStyle.extend(/** @lends CharacterStyle# */{
	_defaults: Base.merge(PathStyle.prototype._defaults, {
		// Override default fillColor of CharacterStyle
		fillColor: 'black',
		fontSize: 10,
		font: 'sans-serif'
	}),
	_owner: TextItem,
	_style: '_characterStyle'

	/**
	 * CharacterStyle objects don't need to be created directly. Just pass an
	 * object to {@link TextItem#characterStyle}, it will be converted to a
	 * CharacterStyle object internally.
	 *
	 * @name CharacterStyle#initialize
	 * @param {object} style
	 */

	/**
	 * The font of the character style.
	 *
	 * @name CharacterStyle#font
	 * @default 'sans-serif'
	 * @type String
	 */

	/**
	 * The font size of the character style in points.
	 *
	 * @name CharacterStyle#fontSize
	 * @default 10
	 * @type Number
	 */
});

/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

// DOCS: write Color class documentation.
/**
 * @name Color
 *
 * @class All properties and functions that expect color values accept
 * instances of the different color classes such as {@link RGBColor},
 * {@link HSBColor} and {@link GrayColor}, and also accept named colors
 * and hex values as strings which are then converted to instances of
 * {@link RGBColor} internally.
 *
 * @classexample {@paperscript}
 * // Named color values:
 *
 * // Create a circle shaped path at {x: 80, y: 50}
 * // with a radius of 30.
 * var circle = new Path.Circle(new Point(80, 50), 30);
 *
 * // Pass a color name to the fillColor property, which is internally
 * // converted to an RGBColor.
 * circle.fillColor = 'green';
 *
 * @classexample {@paperscript}
 * // Hex color values:
 *
 * // Create a circle shaped path at {x: 80, y: 50}
 * // with a radius of 30.
 * var circle = new Path.Circle(new Point(80, 50), 30);
 *
 * // Pass a hex string to the fillColor property, which is internally
 * // converted to an RGBColor.
 * circle.fillColor = '#ff0000';
 */
var Color = this.Color = Base.extend(new function() {

	var components = {
		gray: ['gray'],
		rgb: ['red', 'green', 'blue'],
		hsb: ['hue', 'saturation', 'brightness']
	};

	var colorCache = {},
		colorContext;

	function nameToRGBColor(name) {
		var color = colorCache[name];
		if (color)
			return color.clone();
		// Use a canvas to draw to with the given name and then retrieve rgb
		// values from. Build a cache for all the used colors.
		if (!colorContext) {
			var canvas = CanvasProvider.getCanvas(Size.create(1, 1));
			colorContext = canvas.getContext('2d');
			colorContext.globalCompositeOperation = 'copy';
		}
		// Set the current fillStyle to transparent, so that it will be
		// transparent instead of the previously set color in case the new color
		// can not be interpreted.
		colorContext.fillStyle = 'rgba(0,0,0,0)';
		// Set the fillStyle of the context to the passed name and fill the
		// canvas with it, then retrieve the data for the drawn pixel:
		colorContext.fillStyle = name;
		colorContext.fillRect(0, 0, 1, 1);
		var data = colorContext.getImageData(0, 0, 1, 1).data,
			rgb = [data[0] / 255, data[1] / 255, data[2] / 255];
		return (colorCache[name] = RGBColor.read(rgb)).clone();
	}

	function hexToRGBColor(string) {
		var hex = string.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
		if (hex.length >= 4) {
			var rgb = new Array(3);
			for (var i = 0; i < 3; i++) {
				var channel = hex[i + 1];
				rgb[i] = parseInt(channel.length == 1
						? channel + channel : channel, 16) / 255;
			}
			return RGBColor.read(rgb);
		}
	}

	// For hsb-rgb conversion, used to lookup the right parameters in the
	// values array.
	var hsbIndices = [
		[0, 3, 1], // 0
		[2, 0, 1], // 1
		[1, 0, 3], // 2
		[1, 2, 0], // 3
		[3, 1, 0], // 4
		[0, 1, 2]  // 5
	];

	var converters = {
		'rgb-hsb': function(color) {
			var r = color._red,
				g = color._green,
				b = color._blue,
				max = Math.max(r, g, b),
				min = Math.min(r, g, b),
				delta = max - min,
				h,
				s = max == 0 ? 0 : delta / max,
				v = max; // = brightness, also called value
			if (delta == 0) {
				h = 0; // Achromatic
			} else {
				switch (max) {
				case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
				case g: h = (b - r) / delta + 2; break;
				case b: h = (r - g) / delta + 4; break;
				}
				h /= 6;
			}
			return new HSBColor(h * 360, s, v, color._alpha);
		},

		'hsb-rgb': function(color) {
			var h = (color._hue / 60) % 6, // Scale to 0..6
				s = color._saturation,
				b = color._brightness,
				i = Math.floor(h), // 0..5
				f = h - i,
				i = hsbIndices[i],
				v = [
					b, 						// b, index 0
					b * (1 - s),			// p, index 1
					b * (1 - s * f),		// q, index 2
					b * (1 - s * (1 - f))	// t, index 3
				];
			return new RGBColor(v[i[0]], v[i[1]], v[i[2]], color._alpha);
		},

		'rgb-gray': function(color) {
			// Using the standard NTSC conversion formula that is used for
			// calculating the effective luminance of an RGB color:
			// http://www.mathworks.com/support/solutions/en/data/1-1ASCU/index.html?solution=1-1ASCU
			return new GrayColor(1 - (color._red * 0.2989 + color._green * 0.587
					+ color._blue * 0.114), color._alpha);
		},

		'gray-rgb': function(color) {
			var comp = 1 - color._gray;
			return new RGBColor(comp, comp, comp, color._alpha);
		},

		'hsb-gray': function(color) {
			return converters['rgb-gray'](converters['hsb-rgb'](color));
		},

		'gray-hsb': function(color) {
			return new HSBColor(0, 0, 1 - color._gray, color._alpha);
		}
	};

	var fields = /** @lends Color# */{
		_readNull: true,

		initialize: function(arg) {
			var isArray = Array.isArray(arg),
				type = this._colorType;
			if (typeof arg === 'object' && !isArray) {
				if (!type) {
					// Called on the abstract Color class. Guess color type
					// from arg
					return arg.red !== undefined
						? new RGBColor(arg.red, arg.green, arg.blue, arg.alpha)
						: arg.gray !== undefined
						? new GrayColor(arg.gray, arg.alpha)
						: arg.hue !== undefined
						? new HSBColor(arg.hue, arg.saturation, arg.brightness,
								arg.alpha)
						: new RGBColor(); // Fallback
				} else {
					// Called on a subclass instance. Return the converted
					// color.
					return Color.read(arguments).convert(type);
				}
			} else if (typeof arg === 'string') {
				var rgbColor = arg.match(/^#[0-9a-f]{3,6}$/i)
						? hexToRGBColor(arg)
						: nameToRGBColor(arg);
				return type
						? rgbColor.convert(type)
						: rgbColor;
			} else {
				var components = isArray ? arg
						: Array.prototype.slice.call(arguments);
				if (!type) {
					// Called on the abstract Color class. Guess color type
					// from arg
					//if (components.length >= 4)
					//	return new CMYKColor(components);
					if (components.length >= 3)
						return new RGBColor(components);
					return new GrayColor(components);
				} else {
					// Called on a subclass instance. Just copy over
					// components.
					Base.each(this._components,
						function(name, i) {
							var value = components[i];
							// Set internal propery directly
							this['_' + name] = value !== undefined
									? value : null;
						},
					this);
				}
			}
		},

		/**
		 * @return {RGBColor|GrayColor|HSBColor} a copy of the color object
		 */
		clone: function() {
			var ctor = this.constructor,
				copy = new ctor(ctor.dont),
				components = this._components;
			for (var i = 0, l = components.length; i < l; i++) {
				var key = '_' + components[i];
				copy[key] = this[key];
			}
			return copy;
		},

		convert: function(type) {
			return this._colorType == type
				? this.clone()
				: converters[this._colorType + '-' + type](this);
		},

		statics: /** @lends Color */{
			/**
			 * Override Color.extend() to produce getters and setters based
			 * on the component types defined in _components.
			 *
			 * @ignore
			 */
			extend: function(src) {
				src.beans = true;
				if (src._colorType) {
					var comps = components[src._colorType];
					// Automatically produce the _components field, adding alpha
					src._components = comps.concat(['alpha']);
					Base.each(comps, function(name) {
						var isHue = name === 'hue',
							part = Base.capitalize(name),
							name = '_' + name;
						this['get' + part] = function() {
							return this[name];
						};
						this['set' + part] = function(value) {
							this[name] = isHue
								// Keep negative values within modulo 360 too:
								? ((value % 360) + 360) % 360
								// All other values are 0..1
								: Math.min(Math.max(value, 0), 1);
							this._changed();
							return this;
						};
					}, src);
				}
				return this.base(src);
			}
		}
	};

	// Produce conversion methods for the various color components known by the
	// possible color types. Requesting any of these components on any color
	// internally converts the color to the required type and then returns its
	// component, using bean access.
	Base.each(components, function(comps, type) {
		Base.each(comps, function(component) {
			var part = Base.capitalize(component);
			fields['get' + part] = function() {
				return this.convert(type)[component];
			};
			fields['set' + part] = function(value) {
				var color = this.convert(type);
				color[component] = value;
				color = color.convert(this._colorType);
				for (var i = 0, l = this._components.length; i < l; i++) {
					var key = this._components[i];
					this[key] = color[key];
				}
			};
		});
	});

	return fields;
}, /** @lends Color# */{

	/**
	 * Called by various setters whenever a color value changes
	 */
	_changed: function() {
		this._cssString = null;
		// Loop through the items that use this color and notify them about
		// the style change, so they can redraw.
		for (var i = 0, l = this._owners && this._owners.length; i < l; i++)
			this._owners[i]._changed(Change.STYLE);
	},

	/**
	 * Called by PathStyle whenever this color is used to define an item's style
	 * This is required to pass on _changed() notifications to the _owners.
	 */
	_addOwner: function(item) {
		if (!this._owners)
			this._owners = [];
		this._owners.push(item);
	},

	/**
	 * Called by PathStyle whenever this color stops being used to define an
	 * item's style.
	 * TODO: Should we remove owners that are not used anymore for good, e.g.
	 * in a Item#destroy() method?
	 */
	_removeOwner: function(item) {
		var index = this._owners ? this._owners.indexOf(item) : -1;
		if (index != -1) {
			this._owners.splice(index, 1);
			if (this._owners.length == 0)
				delete this._owners;
		}
	},

	/**
	 * Returns the type of the color as a string.
	 *
	 * @type String('rgb', 'hsb', 'gray')
	 * @bean
	 *
	 * @example
	 * var color = new RGBColor(1, 0, 0);
	 * console.log(color.type); // 'rgb'
	 */
	getType: function() {
		return this._colorType;
	},

	getComponents: function() {
		var length = this._components.length;
		var comps = new Array(length);
		for (var i = 0; i < length; i++)
			comps[i] = this['_' + this._components[i]];
		return comps;
	},

	/**
	 * The color's alpha value as a number between {@code 0} and {@code 1}. All
	 * colors of the different subclasses support alpha values.
	 *
	 * @type Number
	 * @bean
	 *
	 * @example {@paperscript}
	 * // A filled path with a half transparent stroke:
	 * var circle = new Path.Circle(new Point(80, 50), 30);
	 *
	 * // Fill the circle with red and give it a 20pt green stroke:
	 * circle.style = {
	 * 	fillColor: 'red',
	 * 	strokeColor: 'green',
	 * 	strokeWidth: 20
	 * };
	 *
	 * // Make the stroke half transparent:
	 * circle.strokeColor.alpha = 0.5;
	 */
	getAlpha: function() {
		return this._alpha != null ? this._alpha : 1;
	},

	setAlpha: function(alpha) {
		this._alpha = alpha == null ? null : Math.min(Math.max(alpha, 0), 1);
		this._changed();
		return this;
	},

	/**
	 * Checks if the color has an alpha value.
	 *
	 * @return {Boolean} {@true if the color has an alpha value}
	 */
	hasAlpha: function() {
		return this._alpha != null;
	},

	/**
	 * Checks if the component color values of the color are the
	 * same as those of the supplied one.
	 *
	 * @param {Color} color the color to compare with
	 * @return {Boolean} {@true if the colors are the same}
	 */
	equals: function(color) {
		if (color && color._colorType === this._colorType) {
			for (var i = 0, l = this._components.length; i < l; i++) {
				var component = '_' + this._components[i];
				if (this[component] !== color[component])
					return false;
			}
			return true;
		}
		return false;
	},

	/**
	 * {@grouptitle String Representations}
	 * @return {String} A string representation of the color.
	 */
	toString: function() {
		var parts = [],
			format = Base.formatNumber;
		for (var i = 0, l = this._components.length; i < l; i++) {
			var component = this._components[i],
				value = this['_' + component];
			if (component === 'alpha' && value == null)
				value = 1;
			parts.push(component + ': ' + format(value));
		}
		return '{ ' + parts.join(', ') + ' }';
	},

	/**
	 * @return {String} A css string representation of the color.
	 */
	toCssString: function() {
		if (!this._cssString) {
			var color = this.convert('rgb'),
				alpha = color.getAlpha(),
				components = [
					Math.round(color._red * 255),
					Math.round(color._green * 255),
					Math.round(color._blue * 255),
					alpha != null ? alpha : 1
				];
			this._cssString = 'rgba(' + components.join(', ') + ')';
		}
		return this._cssString;
	},

	getCanvasStyle: function() {
		return this.toCssString();
	}

	/**
	 * {@grouptitle RGB Components}
	 *
	 * The amount of red in the color as a value between {@code 0} and
	 * {@code 1}.
	 *
	 * @name Color#red
	 * @property
	 * @type Number
	 *
	 * @example {@paperscript}
	 * // Changing the amount of red in a color:
	 * var circle = new Path.Circle(new Point(80, 50), 30);
	 * circle.fillColor = 'blue';
	 *
	 * // Blue + red = purple:
	 * circle.fillColor.red = 1;
	 */

	/**
	 * The amount of green in the color as a value between {@code 0} and
	 * {@code 1}.
	 *
	 * @name Color#green
	 * @property
	 * @type Number
	 *
	 * @example {@paperscript}
	 * // Changing the amount of green in a color:
	 * var circle = new Path.Circle(new Point(80, 50), 30);
	 *
	 * // First we set the fill color to red:
	 * circle.fillColor = 'red';
	 *
	 * // Red + green = yellow:
	 * circle.fillColor.green = 1;
	 */

	/**
	 * The amount of blue in the color as a value between {@code 0} and
	 * {@code 1}.
	 *
	 * @name Color#blue
	 * @property
	 * @type Number
	 *
	 * @example {@paperscript}
	 * // Changing the amount of blue in a color:
	 * var circle = new Path.Circle(new Point(80, 50), 30);
	 *
	 * // First we set the fill color to red:
	 * circle.fillColor = 'red';
	 *
	 * // Red + blue = purple:
	 * circle.fillColor.blue = 1;
	 */

	/**
	 * {@grouptitle Gray Components}
	 *
	 * The amount of gray in the color as a value between {@code 0} and
	 * {@code 1}.
	 *
	 * @name Color#gray
	 * @property
	 * @type Number
	 */

	/**
	 * {@grouptitle HSB Components}
	 *
	 * The hue of the color as a value in degrees between {@code 0} and
	 * {@code 360}.
	 *
	 * @name Color#hue
	 * @property
	 * @type Number
	 *
	 * @example {@paperscript}
	 * // Changing the hue of a color:
	 * var circle = new Path.Circle(new Point(80, 50), 30);
	 * circle.fillColor = 'red';
	 * circle.fillColor.hue += 30;
	 *
	 * @example {@paperscript}
	 * // Hue cycling:
	 *
	 * // Create a rectangle shaped path, using the dimensions
	 * // of the view:
	 * var path = new Path.Rectangle(view.bounds);
	 * path.fillColor = 'red';
	 *
	 * function onFrame(event) {
	 * 	path.fillColor.hue += 0.5;
	 * }
	 */

	/**
	 * The saturation of the color as a value between {@code 0} and {@code 1}.
	 *
	 * @name Color#saturation
	 * @property
	 * @type Number
	 */

	/**
	 * The brightness of the color as a value between {@code 0} and {@code 1}.
	 *
	 * @name Color#brightness
	 * @property
	 * @type Number
	 */

});

/**
 * @name GrayColor
 * @class A GrayColor object is used to represent any gray color value.
 * @extends Color
 */
var GrayColor = this.GrayColor = Color.extend(/** @lends GrayColor# */{
	/**
	 * Creates a GrayColor object
	 *
	 * @name GrayColor#initialize
	 * @param {Number} gray the amount of gray in the color as a value
	 * between {@code 0} and {@code 1}
	 * @param {Number} [alpha] the alpha of the color as a value between
	 * {@code 0} and {@code 1}
	 *
	 * @example {@paperscript}
	 * // Creating a GrayColor:
	 *
	 * // Create a circle shaped path at {x: 80, y: 50}
	 * // with a radius of 30:
	 * var circle = new Path.Circle(new Point(80, 50), 30);
	 *
	 * // Create a GrayColor with 50% gray:
	 * circle.fillColor = new GrayColor(0.5);
	 */

	_colorType: 'gray'
});

/**
 * @name RGBColor
 * @class An RGBColor object is used to represent any RGB color value.
 * @extends Color
 */
var RGBColor = this.RGBColor = Color.extend(/** @lends RGBColor# */{
	/**
	 * Creates an RGBColor object
	 *
	 * @name RGBColor#initialize
	 * @param {Number} red the amount of red in the color as a value
	 * between {@code 0} and {@code 1}
	 * @param {Number} green the amount of green in the color as a value
	 * between {@code 0} and {@code 1}
	 * @param {Number} blue the amount of blue in the color as a value
	 * between {@code 0} and {@code 1}
	 * @param {Number} [alpha] the alpha of the color as a value between
	 * {@code 0} and {@code 1}
	 *
	 * @example {@paperscript}
	 * // Creating an RGBColor:
	 *
	 * // Create a circle shaped path at {x: 80, y: 50}
	 * // with a radius of 30:
	 * var circle = new Path.Circle(new Point(80, 50), 30);
	 *
	 * // 100% red, 0% blue, 50% blue:
	 * circle.fillColor = new RGBColor(1, 0, 0.5);
	 */

	_colorType: 'rgb'
});

/**
 * @name HSBColor
 * @class An HSBColor object is used to represent any HSB color value.
 * @extends Color
 */
var HSBColor = this.HSBColor = Color.extend(/** @lends HSBColor# */{
	/**
	 * Creates an HSBColor object
	 *
	 * @name HSBColor#initialize
	 * @param {Number} hue the hue of the color as a value in degrees between
	 * {@code 0} and {@code 360}.
	 * @param {Number} saturation the saturation of the color as a value
	 * between {@code 0} and {@code 1}
	 * @param {Number} brightness the brightness of the color as a value
	 * between {@code 0} and {@code 1}
	 * @param {Number} [alpha] the alpha of the color as a value between
	 * {@code 0} and {@code 1}
	 *
	 * @example {@paperscript}
	 * // Creating an HSBColor:
	 *
	 * // Create a circle shaped path at {x: 80, y: 50}
	 * // with a radius of 30:
	 * var circle = new Path.Circle(new Point(80, 50), 30);
	 *
	 * // Create an HSBColor with a hue of 90 degrees, a saturation
	 * // 100% and a brightness of 100%:
	 * circle.fillColor = new HSBColor(90, 1, 1);
	 */

	_colorType: 'hsb'
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name GradientColor
 *
 * @class The GradientColor object.
 */
var GradientColor = this.GradientColor = Color.extend(/** @lends GradientColor# */{

	/**
	 * Creates a gradient color object.
	 *
	 * @param {Gradient} gradient
	 * @param {Point} origin
	 * @param {Point} destination
	 * @param {Point} [hilite]
	 *
	 * @example {@paperscript height=200}
	 * // Applying a linear gradient color containing evenly distributed
	 * // color stops:
	 *
	 * // Define two points which we will be using to construct
	 * // the path and to position the gradient color:
	 * var topLeft = view.center - [80, 80];
	 * var bottomRight = view.center + [80, 80];
	 *
	 * // Create a rectangle shaped path between
	 * // the topLeft and bottomRight points:
	 * var path = new Path.Rectangle(topLeft, bottomRight);
	 *
	 * // Create the gradient, passing it an array of colors to be converted
	 * // to evenly distributed color stops:
	 * var gradient = new Gradient(['yellow', 'red', 'blue']);
	 *
	 * // Have the gradient color run between the topLeft and
	 * // bottomRight points we defined earlier:
	 * var gradientColor = new GradientColor(gradient, topLeft, bottomRight);
	 *
	 * // Set the fill color of the path to the gradient color:
	 * path.fillColor = gradientColor;
	 *
	 * @example {@paperscript height=200}
	 * // Applying a radial gradient color containing unevenly distributed
	 * // color stops:
	 *
	 * // Create a circle shaped path at the center of the view
	 * // with a radius of 80:
	 * var path = new Path.Circle(view.center, 80);
	 *
	 * // The stops array: yellow mixes with red between 0 and 15%,
	 * // 15% to 30% is pure red, red mixes with black between 30% to 100%:
	 * var stops = [['yellow', 0], ['red', 0.15], ['red', 0.3], ['black', 0.9]];
	 *
	 * // Create a radial gradient using the color stops array:
	 * var gradient = new Gradient(stops, 'radial');
	 *
	 * // We will use the center point of the circle shaped path as
	 * // the origin point for our gradient color
	 * var from = path.position;
	 *
	 * // The destination point of the gradient color will be the
	 * // center point of the path + 80pt in horizontal direction:
	 * var to = path.position + [80, 0];
	 *
	 * // Create the gradient color:
	 * var gradientColor = new GradientColor(gradient, from, to);
	 *
	 * // Set the fill color of the path to the gradient color:
	 * path.fillColor = gradientColor;
	 */
	initialize: function(gradient, origin, destination, hilite) {
		this.gradient = gradient || new Gradient();
		this.setOrigin(origin);
		this.setDestination(destination);
		if (hilite)
			this.setHilite(hilite);
	},

	/**
	 * @return {GradientColor} a copy of the gradient color
	 */
	clone: function() {
		return new GradientColor(this.gradient, this._origin, this._destination,
				this._hilite);
	},

	/**
	 * The origin point of the gradient.
	 *
	 * @type Point
	 * @bean
	 *
	 * @example {@paperscript height=200}
	 * // Move the origin point of the gradient, by moving your mouse over
	 * // the view below:
	 *
	 * // Create a rectangle shaped path with the same dimensions as
	 * // that of the view and fill it with a gradient color:
	 * var path = new Path.Rectangle(view.bounds);
	 * var gradient = new Gradient(['yellow', 'red', 'blue']);
	 *
	 * // Have the gradient color run from the top left point of the view,
	 * // to the bottom right point of the view:
	 * var from = view.bounds.topLeft;
	 * var to = view.bounds.bottomRight;
	 * var gradientColor = new GradientColor(gradient, from, to);
	 * path.fillColor = gradientColor;
	 *
	 * function onMouseMove(event) {
	 * 	// Set the origin point of the path's gradient color
	 * 	// to the position of the mouse:
	 * 	path.fillColor.origin = event.point;
	 * }
	 *
	 */
	getOrigin: function() {
		return this._origin;
	},

	setOrigin: function(origin) {
		// PORT: Add clone to Scriptographer
		origin = Point.read(arguments).clone();
		this._origin = origin;
		if (this._destination)
			this._radius = this._destination.getDistance(this._origin);
		this._changed();
		return this;
	},

	/**
	 * The destination point of the gradient.
	 *
	 * @type Point
	 * @bean
	 *
	 * @example {@paperscript height=300}
	 * // Move the destination point of the gradient, by moving your mouse over
	 * // the view below:
	 *
	 * // Create a circle shaped path at the center of the view,
	 * // using 40% of the height of the view as its radius
	 * // and fill it with a radial gradient color:
	 * var path = new Path.Circle(view.center, view.bounds.height * 0.4);
	 *
	 * var gradient = new Gradient(['yellow', 'red', 'black'], 'radial');
	 * var from = view.center;
	 * var to = view.bounds.bottomRight;
	 * var gradientColor = new GradientColor(gradient, from, to);
	 * path.fillColor = gradientColor;
	 *
	 * function onMouseMove(event) {
	 * 	// Set the origin point of the path's gradient color
	 * 	// to the position of the mouse:
	 * 	path.fillColor.destination = event.point;
	 * }
	 */
	getDestination: function() {
		return this._destination;
	},

	setDestination: function(destination) {
		// PORT: Add clone to Scriptographer
		destination = Point.read(arguments).clone();
		this._destination = destination;
		this._radius = this._destination.getDistance(this._origin);
		this._changed();
		return this;
	},

	/**
	 * The hilite point of the gradient.
	 *
	 * @type Point
	 * @bean
	 *
	 * @example {@paperscript height=300}
	 * // Move the hilite point of the gradient, by moving your mouse over
	 * // the view below:
	 *
	 * // Create a circle shaped path at the center of the view,
	 * // using 40% of the height of the view as its radius
	 * // and fill it with a radial gradient color:
	 * var path = new Path.Circle(view.center, view.bounds.height * 0.4);
	 * var gradient = new Gradient(['yellow', 'red', 'black'], 'radial');
	 * var from = path.position;
	 * var to = path.bounds.rightCenter;
	 * var gradientColor = new GradientColor(gradient, from, to);
	 * path.fillColor = gradientColor;
	 *
	 * function onMouseMove(event) {
	 * 	// Set the origin hilite of the path's gradient color
	 * 	// to the position of the mouse:
	 * 	path.fillColor.hilite = event.point;
	 * }
	 */
	getHilite: function() {
		return this._hilite;
	},

	setHilite: function(hilite) {
		// PORT: Add clone to Scriptographer
		hilite = Point.read(arguments).clone();
		var vector = hilite.subtract(this._origin);
		if (vector.getLength() > this._radius) {
			this._hilite = this._origin.add(
					vector.normalize(this._radius - 0.1));
		} else {
			this._hilite = hilite;
		}
		this._changed();
		return this;
	},

	getCanvasStyle: function(ctx) {
		var gradient;
		if (this.gradient.type === 'linear') {
			gradient = ctx.createLinearGradient(this._origin.x, this._origin.y,
					this._destination.x, this._destination.y);
		} else {
			var origin = this._hilite || this._origin;
			gradient = ctx.createRadialGradient(origin.x, origin.y,
					0, this._origin.x, this._origin.y, this._radius);
		}
		for (var i = 0, l = this.gradient._stops.length; i < l; i++) {
			var stop = this.gradient._stops[i];
			gradient.addColorStop(stop._rampPoint, stop._color.toCssString());
		}
		return gradient;
	},

	/**
	 * Checks if the gradient color has the same properties as that of the
	 * supplied one.
	 *
	 * @param {GradientColor} color
	 * @return {@true the GradientColor is the same}
	 */
	equals: function(color) {
		return color == this || color && color._colorType === this._colorType
				&& this.gradient.equals(color.gradient)
				&& this._origin.equals(color._origin)
				&& this._destination.equals(color._destination);
	},

	/**
	 * Transform the gradient color by the specified matrix.
	 *
	 * @param {Matrix} matrix the matrix to transform the gradient color by
	 */
	transform: function(matrix) {
		matrix._transformPoint(this._origin, this._origin, true);
		matrix._transformPoint(this._destination, this._destination, true);
		if (this._hilite)
			matrix._transformPoint(this._hilite, this._hilite, true);
		this._radius = this._destination.getDistance(this._origin);
	}
});

/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Gradient
 *
 * @class The Gradient object.
 */
var Gradient = this.Gradient = Base.extend(/** @lends Gradient# */{
	// TODO: Should type here be called 'radial' and have it receive a
	// boolean value?
	/**
	 * Creates a gradient object
	 *
	 * @param {GradientStop[]} stops
	 * @param {String} [type='linear'] 'linear' or 'radial'
	 */
	initialize: function(stops, type) {
		this.setStops(stops || ['white', 'black']);
		this.type = type || 'linear';
	},

	/**
	 * @return {Gradient} a copy of the gradient
	 */
	clone: function() {
		var stops = [];
		for (var i = 0, l = this._stops.length; i < l; i++)
			stops[i] = this._stops[i].clone();
		return new Gradient(stops, this.type);
	},

	/**
	 * The gradient stops on the gradient ramp.
	 *
	 * @type GradientStop[]
	 * @bean
	 */
	getStops: function() {
		return this._stops;
	},

	setStops: function(stops) {
		if (stops.length < 2)
			throw new Error(
					'Gradient stop list needs to contain at least two stops.');
		this._stops = GradientStop.readAll(stops);
		// Now reassign ramp points if they were not specified.
		for (var i = 0, l = this._stops.length; i < l; i++) {
			var stop = this._stops[i];
			if (stop._defaultRamp)
				stop.setRampPoint(i / (l - 1));
		}
	},

	/**
	 * Checks whether the gradient is equal to the supplied gradient.
	 *
	 * @param {Gradient} gradient
	 * @return {Boolean} {@true they are equal}
	 */
	equals: function(gradient) {
		if (gradient.type != this.type)
			return false;
		if (this._stops.length == gradient._stops.length) {
			for (var i = 0, l = this._stops.length; i < l; i++) {
				if (!this._stops[i].equals(gradient._stops[i]))
					return false;
			}
			return true;
		}
		return false;
	}
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

// TODO: Support midPoint? (initial tests didn't look nice)
/**
 * @name GradientStop
 *
 * @class The GradientStop object.
 */
var GradientStop = this.GradientStop = Base.extend(/** @lends GradientStop# */{
	/**
	 * Creates a GradientStop object.
	 *
	 * @param {Color} [color=new RGBColor(0, 0, 0)] the color of the stop
	 * @param {Number} [rampPoint=0] the position of the stop on the gradient
	 *                               ramp {@default 0}
	 */
	initialize: function(arg0, arg1) {
		if (arg1 === undefined && Array.isArray(arg0)) {
			// [color, rampPoint]
			this.setColor(arg0[0]);
			this.setRampPoint(arg0[1]);
		} else if (arg0.color) {
			// stop
			this.setColor(arg0.color);
			this.setRampPoint(arg0.rampPoint);
		} else {
			// color [, rampPoint]
			this.setColor(arg0);
			this.setRampPoint(arg1);
		}
	},

	/**
	 * @return {GradientColor} a copy of the gradient-stop
	 */
	clone: function() {
		return new GradientStop(this._color.clone(), this._rampPoint);
	},

	/**
	 * The ramp-point of the gradient stop as a value between {@code 0} and
	 * {@code 1}.
	 *
	 * @type Number
	 * @bean
	 *
	 * @example {@paperscript height=300}
	 * // Animating a gradient's ramp points:
	 *
	 * // Create a circle shaped path at the center of the view,
	 * // using 40% of the height of the view as its radius
	 * // and fill it with a radial gradient color:
	 * var path = new Path.Circle(view.center, view.bounds.height * 0.4);
	 *
	 * // Prepare the gradient color and apply it to the path:
	 * var colors = [['yellow', 0.05], ['red', 0.2], ['black', 1]];
	 * var gradient = new Gradient(colors, 'radial');
	 * var from = path.position;
	 * var to = path.bounds.rightCenter;
	 * var gradientColor = new GradientColor(gradient, from, to);
	 * path.fillColor = gradientColor;
	 *
	 * // This function is called each frame of the animation:
	 * function onFrame(event) {
	 * 	var blackStop = gradient.stops[2];
	 * 	// Animate the rampPoint between 0.7 and 0.9:
	 * 	blackStop.rampPoint = Math.sin(event.time * 5) * 0.1 + 0.8;
	 *
	 * 	// Animate the rampPoint between 0.2 and 0.4
	 * 	var redStop = gradient.stops[1];
	 * 	redStop.rampPoint = Math.sin(event.time * 3) * 0.1 + 0.3;
	 * }
	 */
	getRampPoint: function() {
		return this._rampPoint;
	},

	setRampPoint: function(rampPoint) {
		this._defaultRamp = rampPoint == null;
		this._rampPoint = rampPoint || 0;
	},

	/**
	 * The color of the gradient stop.
	 *
	 * @type Color
	 * @bean
	 *
	 * @example {@paperscript height=300}
	 * // Animating a gradient's ramp points:
	 *
	 * // Create a circle shaped path at the center of the view,
	 * // using 40% of the height of the view as its radius
	 * // and fill it with a radial gradient color:
	 * var path = new Path.Circle(view.center, view.bounds.height * 0.4);
	 *
	 * // Create a radial gradient that mixes red and black evenly:
	 * var gradient = new Gradient(['red', 'black'], 'radial');
	 *
	 * // Fill the path with a gradient color that runs from its center,
	 * // to the right center of its bounding rectangle:
	 * var from = path.position;
	 * var to = path.bounds.rightCenter;
	 * var gradientColor = new GradientColor(gradient, from, to);
	 * path.fillColor = gradientColor;
	 *
	 * // This function is called each frame of the animation:
	 * function onFrame(event) {
	 * 	// Change the hue of the first stop's color:
	 * 	gradient.stops[0].color.hue += 1;
	 * }
	 */
	getColor: function() {
		return this._color;
	},

	setColor: function(color) {
		this._color = Color.read(arguments);
	},

	equals: function(stop) {
		return stop == this || stop instanceof GradientStop
				&& this._color.equals(stop._color)
				&& this._rampPoint == stop._rampPoint;
	}
});

/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

var DomElement = new function() {
	function cumulateOffset(el, name, parent, test) {
		var left = name + 'Left',
			top = name + 'Top',
			x = 0,
			y = 0,
			style;
		// If we're asked to calculate positioned offset, stop at any parent
		// element that has relative or absolute position.
		while (el && el.style && (!test || !test.test(
					style = DomElement.getComputedStyle(el, 'position')))) {
			x += el[left] || 0;
			y += el[top] || 0;
			el = el[parent];
		}
		return {
			offset: Point.create(x, y),
			element: el,
			style: style
		};
	}

	function getScrollOffset(el, test) {
		return cumulateOffset(el, 'scroll', 'parentNode', test).offset;
	}

	return {
		getOffset: function(el, positioned, viewport) {
			var res = cumulateOffset(el, 'offset', 'offsetParent',
					positioned ? /^(relative|absolute|fixed)$/ : /^fixed$/);
			// We need to handle fixed positioned elements seperately if we're
			// asked to calculate offsets within the page (= not within
			// viewport), by adding their scroll offset to the result.
			if (res.style == 'fixed' && !viewport)
				return res.offset.add(getScrollOffset(res.element));
			// Otherwise remove scrolling from the calculated offset if we asked
			// for viewport coordinates
			return viewport
					? res.offset.subtract(getScrollOffset(el, /^fixed$/))
					: res.offset;
		},

		getSize: function(el) {
			return Size.create(el.offsetWidth, el.offsetHeight);
		},

		getBounds: function(el, positioned, viewport) {
			return new Rectangle(this.getOffset(el, positioned, viewport),
					this.getSize(el));
		},

		/**
		 * Checks if element is invisibile (display: none, ...)
		 */
		isInvisible: function(el) {
			return this.getSize(el).equals([0, 0]);
		},

		/**
		 * Checks if element is visibile in current viewport
		 */
		isVisible: function(el) {
			// See if the viewport bounds intersect with the windows rectangle
			// which always starts at 0, 0
			return !this.isInvisible(el)
					&& new Rectangle([0, 0], this.getViewportSize(el))
						.intersects(this.getBounds(el, false, true));
		},

		getViewport: function(doc) {
			return doc.defaultView || doc.parentWindow;
		},

		getViewportSize: function(el) {
			var doc = el.ownerDocument,
				view = this.getViewport(doc),
				body = doc.getElementsByTagName(
					doc.compatMode === 'CSS1Compat' ? 'html' : 'body')[0];
			return Size.create(
				view.innerWidth || body.clientWidth,
				view.innerHeight || body.clientHeight
			);
		},

		getComputedStyle: function(el, name) {
			if (el.currentStyle)
				return el.currentStyle[Base.camelize(name)];
			var style = this.getViewport(el.ownerDocument)
					.getComputedStyle(el, null);
			return style ? style.getPropertyValue(Base.hyphenate(name)) : null;
		}
	};
};
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

var DomEvent = {
	add: function(el, events) {
		for (var type in events) {
			var func = events[type];
			if (el.addEventListener) {
				el.addEventListener(type, func, false);
			} else if (el.attachEvent) {
				// Make a bound closure that calls on the right object and
				// passes on the global event object as a parameter.
				el.attachEvent('on' + type, func.bound = function() {
					func.call(el, window.event);
				});
			}
		}
	},

	remove: function(el, events) {
		for (var type in events) {
			var func = events[type];
			if (el.removeEventListener) {
				el.removeEventListener(type, func, false);
			} else if (el.detachEvent) {
				// Remove the bound closure instead of func itself
				el.detachEvent('on' + type, func.bound);
			}
		}
	},

	getPoint: function(event) {
		var pos = event.targetTouches
				? event.targetTouches.length
					? event.targetTouches[0]
					: event.changedTouches[0]
				: event;
		return Point.create(
			pos.pageX || pos.clientX + document.documentElement.scrollLeft,
			pos.pageY || pos.clientY + document.documentElement.scrollTop
		);
	},

	getTarget: function(event) {
		return event.target || event.srcElement;
	},

	getOffset: function(event, target) {
		// Remove target offsets from page coordinates
		return DomEvent.getPoint(event).subtract(
				DomElement.getOffset(target || DomEvent.getTarget(event), true));
	},

	preventDefault: function(event) {
		if (event.preventDefault) {
			event.preventDefault();
		} else {
			// IE
			event.returnValue = false;
		}
	},

	stopPropagation: function(event) {
		if (event.stopPropagation) {
			event.stopPropagation();
		} else {
			event.cancelBubble = true;
		}
	},

	stop: function(event) {
		DomEvent.stopPropagation(event);
		DomEvent.preventDefault(event);
	},
};

DomEvent.requestAnimationFrame = new function() {
	var part = 'equestAnimationFrame',
		request = window['r' + part] || window['webkitR' + part]
			|| window['mozR' + part] || window['oR' + part]
			|| window['msR' + part];
	if (request) {
		// Chrome shipped without the time arg in m10. We need to check if time
		// is defined in callbacks, and if not, clear request again so we won't
		// use the faulty method.
		request(function(time) {
			if (time == undefined)
				request = null;
		});
	}

	// So we need to fake it. Define helper functions first:
	var callbacks = [],
		focused = true,
		timer;

	DomEvent.add(window, {
		focus: function() {
			focused = true;
		},
		blur: function() {
			focused = false;
		}
	});

	return function(callback, element) {
		// See if we can handle natively first
		if (request)
			return request(callback, element);
		// If not, do the callback handling ourself:
		callbacks.push([callback, element]);
		if (!timer) {
			// Installs interval timer that checks all callbacks. This results
			// in faster animations than repeatedly installing timout timers.
			timer = window.setInterval(function() {
				// Checks all installed callbacks for element visibility and
				// execute if needed.
				for (var i = callbacks.length - 1; i >= 0; i--) {
					var entry = callbacks[i],
						func = entry[0],
						element = entry[1];
					if (!element || (element.getAttribute('keepalive') == 'true'
							|| focused) && DomElement.isVisible(element)) {
						// Handle callback and remove it from callbacks list.
						callbacks.splice(i, 1);
						func(Date.now());
					}
				}
			}, 1000 / 60);
		}
	};
};

/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name View
 *
 * @class The View object wraps a canvas element and handles drawing and user
 * interaction through mouse and keyboard for it. It offer means to scroll the
 * view, find the currently visible bounds in project coordinates, or the
 * center, both useful for constructing artwork that should appear centered on
 * screen.
 */
var View = this.View = Base.extend(/** @lends View# */{
	/**
	 * Creates a view object
	 * @param {Canvas} canvas
	 */
	initialize: function(canvas) {
		// Associate this view with the active paper scope.
		this._scope = paper;
		// Push it onto project.views and set index:
		this._index = this._scope.views.push(this) - 1;
		// Handle canvas argument
		var size;
		if (canvas && canvas instanceof HTMLCanvasElement) {
			this._canvas = canvas;
			// If the canvas has the resize attribute, resize the it to fill the
			// window and resize it again whenever the user resizes the window.
			if (canvas.attributes.resize) {
				// Subtract canvas' viewport offset from the total size, to
				// stretch it in
				var offset = DomElement.getOffset(canvas, false, true),
					that = this;
				size = DomElement.getViewportSize(canvas).subtract(offset);
				canvas.width = size.width;
				canvas.height = size.height;
				DomEvent.add(window, {
					resize: function(event) {
						// Only update canvas offset if it's not invisible, as
						// otherwise the offset would be wrong.
						if (!DomElement.isInvisible(canvas))
							offset = DomElement.getOffset(canvas, false, true);
						// Set the size now, which internally calls onResize
						// and redraws the view
						that.setViewSize(DomElement.getViewportSize(canvas)
								.subtract(offset));
					}
				});
			} else {
				size = DomElement.isInvisible(canvas)
					? Size.create(parseInt(canvas.getAttribute('width')),
							parseInt(canvas.getAttribute('height')))
					: DomElement.getSize(canvas);
			}
			// TODO: Test this on IE:
			if (canvas.attributes.stats) {
				this._stats = new Stats();
				// Align top-left to the canvas
				var element = this._stats.domElement,
					style = element.style,
					offset = DomElement.getOffset(canvas);
				style.position = 'absolute';
				style.left = offset.x + 'px';
				style.top = offset.y + 'px';
				document.body.appendChild(element);
			}
		} else {
			// 2nd argument onwards could be view size, otherwise use default:
			size = Size.read(arguments, 1);
			if (size.isZero())
				size = new Size(1024, 768);
			this._canvas = CanvasProvider.getCanvas(size);
		}
		// Generate an id for this view / canvas if it does not have one
		this._id = this._canvas.getAttribute('id');
		if (this._id == null)
			this._canvas.setAttribute('id', this._id = 'canvas-' + View._id++);
		// Link this id to our view
		View._views[this._id] = this;
		this._viewSize = LinkedSize.create(this, 'setViewSize',
				size.width, size.height);
		this._context = this._canvas.getContext('2d');
		this._matrix = new Matrix();
		this._zoom = 1;
		this._events = this._createEvents();
		DomEvent.add(this._canvas, this._events);
		// Make sure the first view is focused for keyboard input straight away
		if (!View._focused)
			View._focused = this;
		// As soon as a new view is added we need to mark the redraw as not
		// motified, so the next call loops through all the views again.
		this._scope._redrawNotified = false;
	},

	/**
	 * The underlying native canvas element.
	 *
	 * @type HTMLCanvasElement
	 * @bean
	 */
	getCanvas: function() {
		return this._canvas;
	},

	/**
	 * The size of the view canvas. Changing the view's size will resize it's
	 * underlying canvas.
	 *
	 * @type Size
	 * @bean
	 */
	getViewSize: function() {
		return this._viewSize;
	},

	setViewSize: function(size) {
		size = Size.read(arguments);
		var delta = size.subtract(this._viewSize);
		if (delta.isZero())
			return;
		this._canvas.width = size.width;
		this._canvas.height = size.height;
		// Call onResize handler on any size change
		if (this.onResize) {
			this.onResize({
				size: size,
				delta: delta
			});
		}
		// Update _viewSize but don't notify of change.
		this._viewSize.set(size.width, size.height, true);
		// Force recalculation
		this._bounds = null;
		this._redrawNeeded = true;
		if (this._onFrameCallback) {
			// If there's a _onFrameCallback, call it staight away,
			// but without requesting another animation frame.
			this._onFrameCallback(0, true);
		} else {
			// Otherwise simply redraw the view now
			this.draw(true);
		}
	},

	/**
	 * The bounds of the currently visible area in project coordinates.
	 *
	 * @type Rectangle
	 * @bean
	 */
	getBounds: function() {
		if (!this._bounds)
			this._bounds = this._matrix._transformBounds(
					new Rectangle(new Point(), this._viewSize));
		return this._bounds;
	},

	/**
	 * The size of the visible area in project coordinates.
	 *
	 * @type Size
	 * @bean
	 */
	getSize: function() {
		return this.getBounds().getSize();
	},

	/**
	 * The center of the visible area in project coordinates.
	 *
	 * @type Point
	 * @bean
	 */
	getCenter: function() {
		return this.getBounds().getCenter();
	},

	setCenter: function(center) {
		this.scrollBy(Point.read(arguments).subtract(this.getCenter()));
	},

	/**
	 * The zoom factor by which the project coordinates are magnified.
	 *
	 * @type Number
	 * @bean
	 */
	getZoom: function() {
		return this._zoom;
	},

	setZoom: function(zoom) {
		// TODO: Clamp the view between 1/32 and 64, just like Illustrator?
		this._transform(new Matrix().scale(zoom / this._zoom, this.getCenter()));
		this._zoom = zoom;
	},

	/**
	 * Checks whether the view is currently visible within the current browser
	 * viewport.
	 *
	 * @return {Boolean} Whether the view is visible.
	 */
	isVisible: function() {
		// TODO: Take bounds into account if it's not the full canvas?
		return DomElement.isVisible(this._canvas);
	},

	/**
	 * Scrolls the view by the given vector.
	 *
	 * @param {Point} point
	 */
	scrollBy: function(point) {
		this._transform(new Matrix().translate(Point.read(arguments).negate()));
	},

	_transform: function(matrix, flags) {
		this._matrix.preConcatenate(matrix);
		// Force recalculation of these values next time they are requested.
		this._bounds = null;
		this._inverse = null;
	},

	draw: function(checkRedraw) {
		if (checkRedraw && !this._redrawNeeded)
			return false;
		if (this._stats)
			this._stats.update();
		// Initial tests conclude that clearing the canvas using clearRect
		// is always faster than setting canvas.width = canvas.width
		// http://jsperf.com/clearrect-vs-setting-width/7
		var ctx = this._context,
			size = this._viewSize;
		ctx.clearRect(0, 0, size._width + 1, size._height + 1);

		ctx.save();
		this._matrix.applyToContext(ctx);
		// Just draw the active project for now
		this._scope.project.draw(ctx);
		ctx.restore();
		if (this._redrawNeeded) {
			this._redrawNeeded = false;
			// Update _redrawNotified in PaperScope as soon as a view was drawn
			this._scope._redrawNotified = false;
		}
		return true;
	},

	activate: function() {
		this._scope.view = this;
	},

	remove: function() {
		if (this._index == null)
			return false;
		// Clear focus if removed view had it
		if (View._focused == this)
			View._focused = null;
		delete View._views[this._id];
		Base.splice(this._scope.views, null, this._index, 1);
		// Uninstall event handlers again for this view.
		DomEvent.remove(this._canvas, this._events);
		// Clearing _onFrame makes the frame handler stop automatically.
		this._scope = this._canvas = this._events = this._onFrame = null;
		return true;
	},

	// TODO: getInvalidBounds
	// TODO: invalidate(rect)
	// TODO: style: artwork / preview / raster / opaque / ink
	// TODO: getShowGrid
	// TODO: getMousePoint
	// TODO: projectToView(rect)

	projectToView: function(point) {
		return this._matrix._transformPoint(Point.read(arguments));
	},

	viewToProject: function(point) {
		return this._getInverse()._transformPoint(Point.read(arguments));
	},

	_getInverse: function() {
		if (!this._inverse)
			this._inverse = this._matrix.createInverse();
		return this._inverse;
	},

	/**
	 * {@grouptitle Event Handlers}
	 * Handler function to be called on each frame of an animation.
	 * The function receives an event object which contains information about
	 * the frame event:
	 *
	 * <b>{@code event.count}</b>: the number of times the frame event was fired.
	 * <b>{@code event.time}</b>: the total amount of time passed since the first frame
	 * event in seconds.
	 * <b>{@code event.delta}</b>: the time passed in seconds since the last frame
	 * event.
	 *
	 * @example {@paperscript}
	 * // Creating an animation:
	 *
	 * // Create a rectangle shaped path with its top left point at:
	 * // {x: 50, y: 25} and a size of {width: 50, height: 50}
	 * var path = new Path.Rectangle(new Point(50, 25), new Size(50, 50));
	 * path.fillColor = 'black';
	 *
	 * function onFrame(event) {
	 * 	// Every frame, rotate the path by 3 degrees:
	 * 	path.rotate(3);
	 * }
	 *
	 * @type Function
	 * @bean
	 */
	getOnFrame: function() {
		return this._onFrame;
	},

	setOnFrame: function(onFrame) {
		this._onFrame = onFrame;
		if (!onFrame) {
			delete this._onFrameCallback;
			return;
		}
		var that = this,
			requested = false,
			before,
			time = 0,
			count = 0;
		this._onFrameCallback = function(param, dontRequest) {
			requested = false;
			if (!that._onFrame)
				return;
			// Set the global paper object to the current scope
			paper = that._scope;
			// Request next frame already
			requested = true;
			if (!dontRequest) {
				DomEvent.requestAnimationFrame(that._onFrameCallback,
						that._canvas);
			}
			var now = Date.now() / 1000,
			 	delta = before ? now - before : 0;
			that._onFrame({
				delta: delta, // Time elapsed since last redraw in seconds
				time: time += delta, // Time since first call of frame() in seconds
				count: count++
			});
			before = now;
			// Automatically draw view on each frame.
			that.draw(true);
		};
		// Call the onFrame handler straight away, initializing the sequence
		// of onFrame calls.
		if (!requested)
			this._onFrameCallback();
	},

	/**
	 * Handler function that is called whenever a view is resized.
	 *
	 * @example
	 * // Repositioning items when a view is resized:
	 *
	 * // Create a circle shaped path in the center of the view:
	 * var path = new Path.Circle(view.bounds.center, 30);
	 * path.fillColor = 'red';
	 *
	 * function onResize(event) {
	 * 	// Whenever the view is resized, move the path to its center:
	 * 	path.position = view.center;
	 * }
	 *
	 * @type Function
	 */
	onResize: null
}, new function() { // Injection scope for mouse handlers
	var tool,
		timer,
		curPoint,
		tempFocus,
		dragging = false;

	function viewToProject(view, event) {
		return view.viewToProject(DomEvent.getOffset(event, view._canvas));
	}

	function updateFocus() {
		if (!View._focused || !View._focused.isVisible()) {
			// Find the first visible view in all scopes
			PaperScope.each(function(scope) {
				for (var i = 0, l = scope.views.length; i < l; i++) {
					var view = scope.views[i];
					if (view.isVisible()) {
						View._focused = tempFocus = view;
						throw Base.stop;
					}
				}
			});
		}
	}

	function mousemove(event) {
		var view;
		if (!dragging) {
			// See if we can get the view from the current event target, and
			// handle the mouse move over it.
		 	view = View._views[DomEvent.getTarget(event).getAttribute('id')];
			if (view) {
				// Temporarily focus this view without making it sticky, so
				// Key events are handled too during the mouse over
				View._focused = tempFocus = view;
			} else if (tempFocus && tempFocus == View._focused) {
				// Clear temporary focus again and update it.
				View._focused = null;
				updateFocus();
			}
		}
		if (!(view = view || View._focused) || !(tool = view._scope.tool))
			return;
		var point = event && viewToProject(view, event);
		var onlyMove = !!(!tool.onMouseDrag && tool.onMouseMove);
		if (dragging && !onlyMove) {
			curPoint = point || curPoint;
			if (curPoint && tool.onHandleEvent('mousedrag', curPoint, event)) {
				view.draw(true);
				DomEvent.stop(event);
			}
		// PORT: If there is only an onMouseMove handler, also call it when
		// the user is dragging:
		} else if ((!dragging || onlyMove)
				&& tool.onHandleEvent('mousemove', point, event)) {
			view.draw(true);
			DomEvent.stop(event);
		}
	}

	function mouseup(event) {
		var view = View._focused;
		if (!view || !dragging)
			return;
		dragging = false;
		curPoint = null;
		if (tool) {
			if (timer != null)
				timer = clearInterval(timer);
			if (tool.onHandleEvent('mouseup', viewToProject(view, event), event)) {
				view.draw(true);
				DomEvent.stop(event);
			}
		}
	}

	function selectstart(event) {
		// Only stop this even if we're dragging already, since otherwise no
		// text whatsoever can be selected on the page.
		if (dragging)
			DomEvent.stop(event);
	}

	// mousemove and mouseup events need to be installed on document, not the
	// view canvas, since we want to catch the end of drag events even outside
	// our view. Only the mousedown events are installed on the view, as handled
	// by _createEvents below.

	DomEvent.add(document, {
		mousemove: mousemove,
		mouseup: mouseup,
		touchmove: mousemove,
		touchend: mouseup,
		selectstart: selectstart,
		scroll: updateFocus
	});

	DomEvent.add(window, {
		load: updateFocus
	});

	return {
		_createEvents: function() {
			var view = this;

			function mousedown(event) {
				// Tell the Key class which view should receive keyboard input.
				View._focused = view;
				if (!(tool = view._scope.tool))
					return;
				curPoint = viewToProject(view, event);
				if (tool.onHandleEvent('mousedown', curPoint, event))
					view.draw(true);
				if (tool.eventInterval != null)
					timer = setInterval(mousemove, tool.eventInterval);
				dragging = true;
			}

			return {
				mousedown: mousedown,
				touchstart: mousedown,
				selectstart: selectstart
			};
		},

		statics: {
			_views: {},
			_id: 0,

			/**
			 * Loops through all scopes and their views and sets the focus on
			 * the first active one.
			 */
			updateFocus: updateFocus
		}
	};
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Event
 * @class
 */
var Event = this.Event = Base.extend(/** @lends Event# */{
	initialize: function(event) {
		this.event = event;
	},

	// PORT: Add to Scriptographer
	preventDefault: function() {
		DomEvent.preventDefault(this.event);
	},

	stopPropagation: function() {
		DomEvent.stopPropagation(this.event);
	},

	stop: function() {
		DomEvent.stop(this.event);
	},

	// DOCS: Document Event#modifiers
	/**
	 * @type object
	 * @bean
	 */
	getModifiers: function() {
		return Key.modifiers;
	}
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name KeyEvent
 *
 * @class KeyEvent The KeyEvent object is received by the {@link Tool}'s
 * keyboard handlers {@link Tool#onKeyDown}, {@link Tool#onKeyUp},
 * The KeyEvent object is the only parameter passed to these functions
 * and contains information about the keyboard event.
 *
 * @extends Event
 */
var KeyEvent = this.KeyEvent = Event.extend(new function() {
	return /** @lends KeyEvent# */{
		initialize: function(down, key, character, event) {
			this.base(event);
			this.type = down ? 'keydown' : 'keyup';
			this.key = key;
			this.character = character;
		},

		/**
		 * The type of key event.
		 *
		 * @name KeyEvent#type
		 * @type String('keydown', 'keyup')
		 */

		/**
		 * The string character of the key that caused this key event.
		 *
		 * @name KeyEvent#character
		 * @type String
		 */

		/**
		 * The key that caused this key event.
		 *
		 * @name KeyEvent#key
		 * @type String
		 */

		/**
		 * @return {String} A string representation of the key event.
		 */
		toString: function() {
			return '{ type: ' + this.type
					+ ', key: ' + this.key
					+ ', character: ' + this.character
					+ ', modifiers: ' + this.getModifiers()
					+ ' }';
		}
	};
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Key
 * @namespace
 */
var Key = this.Key = new function() {
	// TODO: Make sure the keys are called the same as in Scriptographer
	// Missing: tab, cancel, clear, page-down, page-up, comma, minus, period,
	// slash, etc etc etc.

	var keys = {
		 8: 'backspace',
		13: 'enter',
		16: 'shift',
		17: 'control',
		18: 'option',
		19: 'pause',
		20: 'caps-lock',
		27: 'escape',
		32: 'space',
		35: 'end',
		36: 'home',
		37: 'left',
		38: 'up',
		39: 'right',
		40: 'down',
		46: 'delete',
		91: 'command'
	},

	modifiers = {
		shift: false,
		control: false,
		option: false,
		command: false,
		capsLock: false,

		toString: function() {
			return Base.formatObject(this);
		}
	},

	// Since only keypress gets proper keyCodes that are actually representing
	// characters, we need to perform a little trickery here to use these codes
	// in onKeyDown/Up: keydown is used to store the downCode and handle
	// modifiers and special keys such as arrows, space, etc, keypress fires the
	// actual onKeyDown event and maps the keydown keyCode to the keypress
	// charCode so keyup can do the right thing too.
	charCodeMap = {}, // keyCode -> charCode mappings for pressed keys
	keyMap = {}, // Map for currently pressed keys
	downCode; // The last keyCode from keydown

	function handleKey(down, keyCode, charCode, event) {
		var character = String.fromCharCode(charCode),
			key = keys[keyCode] || character.toLowerCase(),
			handler = down ? 'onKeyDown' : 'onKeyUp',
			view = View._focused,
			scope = view && view.isVisible() && view._scope,
			tool = scope && scope.tool;
		keyMap[key] = down;
		if (tool && tool[handler]) {
			// Call the onKeyDown or onKeyUp handler if present
			// When the handler function returns false, prevent the
			// default behaviour of the key event:
			// PORT: Add to Sg
			var keyEvent = new KeyEvent(down, key, character, event);
			if (tool[handler](keyEvent) === false)
				keyEvent.preventDefault();
			if (view)
				view.draw(true);
		}
	}

	DomEvent.add(document, {
		keydown: function(event) {
			var code = event.which || event.keyCode;
			// If the keyCode is in keys, it needs to be handled by keydown and
			// not in keypress after (arrows for example wont be triggering
			// a keypress, but space would).
			var key = keys[code], name;
			if (key) {
				// Do not fire handleKey for modifiers, but for other keys such
				// ass arrows, delete, backspace, etc.
				if (modifiers[name = Base.camelize(key)] !== undefined) {
					modifiers[name] = true;
				} else {
					// No char code for special keys, but mark as pressed
					charCodeMap[code] = 0;
					handleKey(true, code, null, event);
				}
				// Do not set downCode as we handled it already. Space would
				// be handled twice otherwise, once here, once in keypress.
			} else {
				downCode = code;
			}
		},

		keypress: function(event) {
			if (downCode != null) {
				var code = event.which || event.keyCode;
				// Link the downCode from keydown with the code form keypress, so
				// keyup can retrieve that code again.
				charCodeMap[downCode] = code;
				handleKey(true, downCode, code, event);
				downCode = null;
			}
		},

		keyup: function(event) {
			var code = event.which || event.keyCode,
				key = keys[code], name;
			if (key && modifiers[name = Base.camelize(key)] !== undefined) {
				modifiers[name] = false;
			} else if (charCodeMap[code] != null) {
				handleKey(false, code, charCodeMap[code], event);
				delete charCodeMap[code];
			}
		}
	});

	return /** @lends Key */{
		modifiers: modifiers,

		/**
		 * Checks whether the specified key is pressed.
		 *
		 * @param {String} key One of: 'backspace', 'enter', 'shift', 'control',
		 * 'option', 'pause', 'caps-lock', 'escape', 'space', 'end', 'home',
		 * 'left', 'up', 'right', 'down', 'delete', 'command'
		 * @return {Boolean} {@true if the key is pressed}
		 *
		 * @example
		 * // Whenever the user clicks, create a circle shaped path. If the
		 * // 'a' key is pressed, fill it with red, otherwise fill it with blue:
		 * function onMouseDown(event) {
		 * 	var path = new Path.Circle(event.point, 10);
		 * 	if(Key.isDown('a')) {
		 * 		path.fillColor = 'red';
		 * 	} else {
		 * 		path.fillColor = 'blue';
		 * 	}
		 * }
		 */
		isDown: function(key) {
			return !!keyMap[key];
		}
	};
};
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name ToolEvent
 *
 * @class ToolEvent The ToolEvent object is received by the {@link Tool}'s mouse
 * event handlers {@link Tool#onMouseDown}, {@link Tool#onMouseDrag},
 * {@link Tool#onMouseMove} and {@link Tool#onMouseUp}. The ToolEvent
 * object is the only parameter passed to these functions and contains
 * information about the mouse event.
 *
 * @extends Event
 */
var ToolEvent = this.ToolEvent = Event.extend(/** @lends ToolEvent# */{
	initialize: function(tool, type, event) {
		this.tool = tool;
		this.type = type;
		this.event = event;
	},

	/**
	 * Convenience method to allow local overrides of point values.
	 * See application below.
	 */
	_choosePoint: function(point, toolPoint) {
		return point ? point : toolPoint ? toolPoint.clone() : null;
	},

	/**
	 * The position of the mouse in project coordinates when the event was
	 * fired.
	 *
	 * @example
	 * function onMouseDrag(event) {
	 * 	// the position of the mouse when it is dragged
	 * 	console.log(event.point);
	 * }
	 *
	 * function onMouseUp(event) {
	 * 	// the position of the mouse when it is released
	 * 	console.log(event.point);
	 * }
	 *
	 * @type Point
	 * @bean
	 */
	getPoint: function() {
		return this._choosePoint(this._point, this.tool._point);
	},

	setPoint: function(point) {
		this._point = point;
	},

	/**
	 * The position of the mouse in project coordinates when the previous
	 * event was fired.
	 *
	 * @type Point
	 * @bean
	 */
	getLastPoint: function() {
		return this._choosePoint(this._lastPoint, this.tool._lastPoint);
	},

	setLastPoint: function(lastPoint) {
		this._lastPoint = lastPoint;
	},

	/**
	 * The position of the mouse in project coordinates when the mouse button
	 * was last clicked.
	 *
	 * @type Point
	 * @bean
	 */
	getDownPoint: function() {
		return this._choosePoint(this._downPoint, this.tool._downPoint);
	},

	setDownPoint: function(downPoint) {
		this._downPoint = downPoint;
	},

	/**
	 * The point in the middle between {@link #lastPoint} and
	 * {@link #point}. This is a useful position to use when creating
	 * artwork based on the moving direction of the mouse, as returned by
	 * {@link #delta}.
	 *
	 * @type Point
	 * @bean
	 */
	getMiddlePoint: function() {
		// For explanations, see getDelta()
		if (!this._middlePoint && this.tool._lastPoint) {
			// (point + lastPoint) / 2
			return this.tool._point.add(this.tool._lastPoint).divide(2);
		}
		return this.middlePoint;
	},

	setMiddlePoint: function(middlePoint) {
		this._middlePoint = middlePoint;
	},

	/**
	 * The difference between the current position and the last position of the
	 * mouse when the event was fired. In case of the mouseup event, the
	 * difference to the mousedown position is returned.
	 *
	 * @type Point
	 * @bean
	 */
	getDelta: function() {
		// Do not put the calculated delta into delta, since this only reserved
		// for overriding event.delta.
		// Instead, keep calculating the delta each time, so the result can be
		// directly modified by the script without changing the internal values.
		// We could cache this and use clone, but this is almost as fast...
		return !this._delta && this.tool._lastPoint
		 		? this.tool._point.subtract(this.tool._lastPoint)
				: this._delta;
	},

	setDelta: function(delta) {
		this._delta = delta;
	},

	/**
	 * The number of times the mouse event was fired.
	 *
	 * @type Number
	 * @bean
	 */
	getCount: function() {
		// Return downCount for both mouse down and up, since
		// the count is the same.
		return /^mouse(down|up)$/.test(this.type)
				? this.tool._downCount
				: this.tool._count;
	},

	setCount: function(count) {
		this.tool[/^mouse(down|up)$/.test(this.type) ? 'downCount' : 'count']
			= count;
	},

	// TODO: Implement hitTest first
	// getItem: function() {
	// 	if (this.item == null) {
	// 		var result = Project.getActiveProject().hitTest(this.getPoint());
	// 		if (result != null) {
	// 			this.item = result.getItem();
	// 			// Find group parent
	// 			var parent = item.getParent();
	// 			while (parent instanceof Group || parent instanceof CompoundPath) {
	// 				item = parent;
	// 				parent = parent.getParent();
	// 			}
	// 		}
	// 	}
	// 	return item;
	// }
	//
	// setItem: function(Item item) {
	// 	this.item = item;
	// }

	/**
	 * @return {String} A string representation of the tool event.
	 */
	toString: function() {
		return '{ type: ' + this.type
				+ ', point: ' + this.getPoint()
				+ ', count: ' + this.getCount()
				+ ', modifiers: ' + this.getModifiers()
				+ ' }';
	}
});
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Tool
 *
 * @class The Tool object refers to a script that the user can interact with
 * by using the mouse and keyboard and can be accessed through the global
 * {@code tool} variable. All its properties are also available in the paper
 * scope.
 *
 * The global {@code tool} variable only exists in scripts that contain mouse
 * handler functions ({@link #onMouseMove}, {@link #onMouseDown},
 * {@link #onMouseDrag}, {@link #onMouseUp}) or a keyboard handler
 * function ({@link #onKeyDown}, {@link #onKeyUp}).
 *
 * @classexample
 * var path;
 *
 * // Only execute onMouseDrag when the mouse
 * // has moved at least 10 points:
 * tool.distanceThreshold = 10;
 *
 * function onMouseDown(event) {
 * 	// Create a new path every time the mouse is clicked
 * 	path = new Path();
 * 	path.add(event.point);
 * 	path.strokeColor = 'black';
 * }
 *
 * function onMouseDrag(event) {
 * 	// Add a point to the path every time the mouse is dragged
 * 	path.add(event.point);
 * }
 */
var Tool = this.Tool = Base.extend(/** @lends Tool# */{
	// DOCS: rewrite Tool constructor explanation
	/**
	 * Initializes the tool's settings, so a new tool can be assigned to it
	 */
	initialize: function(handlers, scope) {
		this._scope = scope;
		this._firstMove = true;
		this._count = 0;
		this._downCount = 0;
		for (var i in handlers)
			this[i] = handlers[i];
	},

	/**
	 * The fixed time delay in milliseconds between each call to the
	 * {@link #onMouseDrag} event. Setting this to an interval means the
	 * {@link #onMouseDrag} event is called repeatedly after the initial
	 * {@link #onMouseDown} until the user releases the mouse.
	 *
	 * @type Number
	 */
	eventInterval: null,

	/**
	 * The minimum distance the mouse has to drag before firing the onMouseDrag
	 * event, since the last onMouseDrag event.
	 *
	 * @type Number
	 * @bean
	 */
	getMinDistance: function() {
		return this._minDistance;
	},

	setMinDistance: function(minDistance) {
		this._minDistance = minDistance;
		if (this._minDistance != null && this._maxDistance != null
				&& this._minDistance > this._maxDistance) {
			this._maxDistance = this._minDistance;
		}
	},

	/**
	 * The maximum distance the mouse has to drag before firing the onMouseDrag
	 * event, since the last onMouseDrag event.
	 *
	 * @type Number
	 * @bean
	 */
	getMaxDistance: function() {
		return this._maxDistance;
	},

	setMaxDistance: function(maxDistance) {
		this._maxDistance = maxDistance;
		if (this._minDistance != null && this._maxDistance != null
				&& this._maxDistance < this._minDistance) {
			this._minDistance = maxDistance;
		}
	},

	// DOCS: document Tool#fixedDistance
	/**
	 * @type Number
	 * @bean
	 */
	getFixedDistance: function() {
		return this._minDistance == this._maxDistance
			? this._minDistance : null;
	},

	setFixedDistance: function(distance) {
		this._minDistance = distance;
		this._maxDistance = distance;
	},

	/**
	 * {@grouptitle Mouse Event Handlers}
	 *
	 * The function to be called when the mouse button is pushed down. The
	 * function receives a {@link ToolEvent} object which contains information
	 * about the mouse event.
	 *
	 * @name Tool#onMouseDown
	 * @property
	 * @type Function
	 *
	 * @example {@paperscript}
	 * // Creating circle shaped paths where the user presses the mouse button:
	 * function onMouseDown(event) {
	 * 	// Create a new circle shaped path with a radius of 10
	 * 	// at the position of the mouse (event.point):
	 * 	var path = new Path.Circle(event.point, 10);
	 * 	path.fillColor = 'black';
	 * }
	 */

	/**
	 * The function to be called when the mouse position changes while the mouse
	 * is being dragged. The function receives a {@link ToolEvent} object which
	 * contains information about the mouse event.
	 *
	 * This function can also be called periodically while the mouse doesn't
	 * move by setting the {@link #eventInterval}
	 *
	 * @name Tool#onMouseDrag
	 * @property
	 * @type Function
	 *
	 * @example {@paperscript}
	 * // Draw a line by adding a segment to a path on every mouse drag event:
	 *
	 * // Create an empty path:
	 * var path = new Path();
	 * path.strokeColor = 'black';
	 *
	 * function onMouseDrag(event) {
	 * 	// Add a segment to the path at the position of the mouse:
	 * 	path.add(event.point);
	 * }
	 */

	/**
	 * The function to be called the mouse moves within the project view. The
	 * function receives a {@link ToolEvent} object which contains information
	 * about the mouse event.
	 *
	 * @name Tool#onMouseMove
	 * @property
	 * @type Function
	 *
	 * @example {@paperscript}
	 * // Moving a path to the position of the mouse:
	 *
	 * // Create a circle shaped path with a radius of 10 at {x: 0, y: 0}:
	 * var path = new Path.Circle([0, 0], 10);
	 * path.fillColor = 'black';
	 *
	 * function onMouseMove(event) {
	 * 	// Whenever the user moves the mouse, move the path
	 * 	// to that position:
	 * 	path.position = event.point;
	 * }
	 */

	/**
	 * The function to be called when the mouse button is released. The function
	 * receives a {@link ToolEvent} object which contains information about the
	 * mouse event.
	 *
	 * @name Tool#onMouseUp
	 * @property
	 * @type Function
	 *
	 * @example {@paperscript}
	 * // Creating circle shaped paths where the user releases the mouse:
	 * function onMouseUp(event) {
	 * 	// Create a new circle shaped path with a radius of 10
	 * 	// at the position of the mouse (event.point):
	 * 	var path = new Path.Circle(event.point, 10);
	 * 	path.fillColor = 'black';
	 * }
	 */

	/**
	 * {@grouptitle Keyboard Event Handlers}
	 *
	 * The function to be called when the user presses a key on the keyboard.
	 * The function receives a {@link KeyEvent} object which contains
	 * information about the keyboard event.
	 * If the function returns {@code false}, the keyboard event will be
	 * prevented from bubbling up. This can be used for example to stop the
	 * window from scrolling, when you need the user to interact with arrow
	 * keys.
	 *
	 * @name Tool#onKeyDown
	 * @property
	 * @type Function
	 *
	 * @example {@paperscript}
	 * // Scaling a path whenever the user presses the space bar:
	 *
	 * // Create a circle shaped path:
	 * var path = new Path.Circle(new Point(50, 50), 30);
	 * path.fillColor = 'red';
	 *
	 * function onKeyDown(event) {
	 * 	if(event.key == 'space') {
	 * 		// Scale the path by 110%:
	 * 		path.scale(1.1);
	 *
	 * 		// Prevent the key event from bubbling
	 * 		return false;
	 * 	}
	 * }
	 */

	/**
	 * The function to be called when the user releases a key on the keyboard.
	 * The function receives a {@link KeyEvent} object which contains
	 * information about the keyboard event.
	 * If the function returns {@code false}, the keyboard event will be
	 * prevented from bubbling up. This can be used for example to stop the
	 * window from scrolling, when you need the user to interact with arrow
	 * keys.
	 *
	 * @name Tool#onKeyUp
	 * @property
	 * @type Function
	 *
	 * @example
	 * function onKeyUp(event) {
	 * 	if(event.key == 'space') {
	 * 		console.log('The spacebar was released!');
	 * 	}
	 * }
	 */

	updateEvent: function(type, pt, minDistance, maxDistance, start,
			needsChange, matchMaxDistance) {
		if (!start) {
			if (minDistance != null || maxDistance != null) {
				var minDist = minDistance != null ? minDistance : 0;
				var vector = pt.subtract(this._point);
				var distance = vector.getLength();
				if (distance < minDist)
					return false;
				// Produce a new point on the way to pt if pt is further away
				// than maxDistance
				var maxDist = maxDistance != null ? maxDistance : 0;
				if (maxDist != 0) {
					if (distance > maxDist) {
						pt = this._point.add(vector.normalize(maxDist));
					} else if (matchMaxDistance) {
						return false;
					}
				}
			}
			if (needsChange && pt.equals(this._point))
				return false;
		}
		// Make sure mousemove events have lastPoint set even for the first move
		// so event.delta is always defined for them.
		// TODO: Decide wether mousedown also should always have delta set.
		this._lastPoint = start && type == 'mousemove' ? pt : this._point;
		this._point = pt;
		switch (type) {
		case 'mousedown':
			this._lastPoint = this._downPoint;
			this._downPoint = this._point;
			this._downCount++;
			break;
		case 'mouseup':
			// Mouse up events return the down point for last point, so delta is
			// spanning over the whole drag.
			this._lastPoint = this._downPoint;
			break;
		}
		this._count = start ? 0 : this._count + 1;
		return true;
	},

	onHandleEvent: function(type, pt, event) {
		// Update global reference to this scope.
		paper = this._scope;
		var called = false;
		switch (type) {
		case 'mousedown':
			this.updateEvent(type, pt, null, null, true, false, false);
			if (this.onMouseDown) {
				this.onMouseDown(new ToolEvent(this, type, event));
				called = true;
			}
			break;
		case 'mousedrag':
			// In order for idleInterval drag events to work, we need to not
			// check the first call for a change of position. Subsequent calls
			// required by min/maxDistance functionality will require it,
			// otherwise this might loop endlessly.
			var needsChange = false,
			// If the mouse is moving faster than maxDistance, do not produce
			// events for what is left after the first event is generated in
			// case it is shorter than maxDistance, as this would produce weird
			// results. matchMaxDistance controls this.
				matchMaxDistance = false;
			while (this.updateEvent(type, pt, this.minDistance,
					this.maxDistance, false, needsChange, matchMaxDistance)) {
				if (this.onMouseDrag) {
					this.onMouseDrag(new ToolEvent(this, type, event));
					called = true;
				}
				needsChange = true;
				matchMaxDistance = true;
			}
			break;
		case 'mouseup':
			// If the last mouse drag happened in a different place, call mouse
			// drag first, then mouse up.
			if ((this._point.x != pt.x || this._point.y != pt.y)
					&& this.updateEvent('mousedrag', pt, this.minDistance,
							this.maxDistance, false, false, false)) {
				if (this.onMouseDrag) {
					this.onMouseDrag(new ToolEvent(this, type, event));
					called = true;
				}
			}
			this.updateEvent(type, pt, null, this.maxDistance, false,
					false, false);
			if (this.onMouseUp) {
				this.onMouseUp(new ToolEvent(this, type, event));
				called = true;
			}
			// Start with new values for 'mousemove'
			this.updateEvent(type, pt, null, null, true, false, false);
			this._firstMove = true;
			break;
		case 'mousemove':
			while (this.updateEvent(type, pt, this.minDistance,
					this.maxDistance, this._firstMove, true, false)) {
				if (this.onMouseMove) {
					this.onMouseMove(new ToolEvent(this, type, event));
					called = true;
				}
				this._firstMove = false;
			}
			break;
		}
		// Return if a callback was called or not.
		return called;
	}
});

/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

// TODO: It might be better to make a ContextProvider class, since you
// can always find the canvas through context.canvas. This saves code and
// speed by not having to do canvas.getContext('2d')
// TODO: Run through the canvas array to find a canvas with the requested
// width / height, so we don't need to resize it?
var CanvasProvider = {
	canvases: [],
	getCanvas: function(size) {
		if (this.canvases.length) {
			var canvas = this.canvases.pop();
			// If they are not the same size, we don't need to clear them
			// using clearRect and visa versa.
			if ((canvas.width != size.width)
					|| (canvas.height != size.height)) {
				canvas.width = size.width;
				canvas.height = size.height;
			} else {
				// +1 is needed on some browsers to really clear the borders
				canvas.getContext('2d').clearRect(0, 0,
						size.width + 1, size.height + 1);
			}
			return canvas;
		} else {
			var canvas = document.createElement('canvas');
			canvas.width = size.width;
			canvas.height = size.height;
			return canvas;
		}
	},

	returnCanvas: function(canvas) {
		this.canvases.push(canvas);
	}
};
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

var Numerical = new function() {

	// Lookup tables for abscissas and weights with values for n = 2 .. 16.
	// As values are symetric, only store half of them and addapt algorithm
	// to factor in symetry.
	var abscissas = [
		[  0.5773502691896257645091488],
		[0,0.7745966692414833770358531],
		[  0.3399810435848562648026658,0.8611363115940525752239465],
		[0,0.5384693101056830910363144,0.9061798459386639927976269],
		[  0.2386191860831969086305017,0.6612093864662645136613996,0.9324695142031520278123016],
		[0,0.4058451513773971669066064,0.7415311855993944398638648,0.9491079123427585245261897],
		[  0.1834346424956498049394761,0.5255324099163289858177390,0.7966664774136267395915539,0.9602898564975362316835609],
		[0,0.3242534234038089290385380,0.6133714327005903973087020,0.8360311073266357942994298,0.9681602395076260898355762],
		[  0.1488743389816312108848260,0.4333953941292471907992659,0.6794095682990244062343274,0.8650633666889845107320967,0.9739065285171717200779640],
		[0,0.2695431559523449723315320,0.5190961292068118159257257,0.7301520055740493240934163,0.8870625997680952990751578,0.9782286581460569928039380],
		[  0.1252334085114689154724414,0.3678314989981801937526915,0.5873179542866174472967024,0.7699026741943046870368938,0.9041172563704748566784659,0.9815606342467192506905491],
		[0,0.2304583159551347940655281,0.4484927510364468528779129,0.6423493394403402206439846,0.8015780907333099127942065,0.9175983992229779652065478,0.9841830547185881494728294],
		[  0.1080549487073436620662447,0.3191123689278897604356718,0.5152486363581540919652907,0.6872929048116854701480198,0.8272013150697649931897947,0.9284348836635735173363911,0.9862838086968123388415973],
		[0,0.2011940939974345223006283,0.3941513470775633698972074,0.5709721726085388475372267,0.7244177313601700474161861,0.8482065834104272162006483,0.9372733924007059043077589,0.9879925180204854284895657],
		[  0.0950125098376374401853193,0.2816035507792589132304605,0.4580167776572273863424194,0.6178762444026437484466718,0.7554044083550030338951012,0.8656312023878317438804679,0.9445750230732325760779884,0.9894009349916499325961542]
	],

	weights = [
		[1],
		[0.8888888888888888888888889,0.5555555555555555555555556],
		[0.6521451548625461426269361,0.3478548451374538573730639],
		[0.5688888888888888888888889,0.4786286704993664680412915,0.2369268850561890875142640],
		[0.4679139345726910473898703,0.3607615730481386075698335,0.1713244923791703450402961],
		[0.4179591836734693877551020,0.3818300505051189449503698,0.2797053914892766679014678,0.1294849661688696932706114],
		[0.3626837833783619829651504,0.3137066458778872873379622,0.2223810344533744705443560,0.1012285362903762591525314],
		[0.3302393550012597631645251,0.3123470770400028400686304,0.2606106964029354623187429,0.1806481606948574040584720,0.0812743883615744119718922],
		[0.2955242247147528701738930,0.2692667193099963550912269,0.2190863625159820439955349,0.1494513491505805931457763,0.0666713443086881375935688],
		[0.2729250867779006307144835,0.2628045445102466621806889,0.2331937645919904799185237,0.1862902109277342514260976,0.1255803694649046246346943,0.0556685671161736664827537],
		[0.2491470458134027850005624,0.2334925365383548087608499,0.2031674267230659217490645,0.1600783285433462263346525,0.1069393259953184309602547,0.0471753363865118271946160],
		[0.2325515532308739101945895,0.2262831802628972384120902,0.2078160475368885023125232,0.1781459807619457382800467,0.1388735102197872384636018,0.0921214998377284479144218,0.0404840047653158795200216],
		[0.2152638534631577901958764,0.2051984637212956039659241,0.1855383974779378137417166,0.1572031671581935345696019,0.1215185706879031846894148,0.0801580871597602098056333,0.0351194603317518630318329],
		[0.2025782419255612728806202,0.1984314853271115764561183,0.1861610000155622110268006,0.1662692058169939335532009,0.1395706779261543144478048,0.1071592204671719350118695,0.0703660474881081247092674,0.0307532419961172683546284],
		[0.1894506104550684962853967,0.1826034150449235888667637,0.1691565193950025381893121,0.1495959888165767320815017,0.1246289712555338720524763,0.0951585116824927848099251,0.0622535239386478928628438,0.0271524594117540948517806]
	];

	return {
		TOLERANCE: 10e-6,

		/**
		 * Gauss-Legendre Numerical Integration
		 */
		integrate: function(f, a, b, n) {
			var x = abscissas[n - 2],
				w = weights[n - 2],
				A = 0.5 * (b - a),
				B = A + a,
				i = 0,
				m = (n + 1) >> 1,
				sum = n & 1 ? w[i++] * f(B) : 0; // Handle odd n
			while (i < m) {
				var Ax = A * x[i];
				sum += w[i++] * (f(B + Ax) + f(B - Ax));
			}
			return A * sum;
		},

		/**
		 * Root finding using Newton-Raphson Method combined with Bisection.
		 */
		findRoot: function(f, df, x, a, b, n, tol) {
			for (var i = 0; i < n; i++) {
				var fx = f(x),
					dx = fx / df(x);
				// See if we can trust the Newton-Raphson result. If not we use
				// bisection to find another candiate for Newton's method.
				if (Math.abs(dx) < tol)
					return x;
				// Generate a candidate for Newton's method.
				var nx = x - dx;
				// Update the root-bounding interval and test for containment of
				// the candidate. If candidate is outside the root-bounding
				// interval, use bisection instead.
				// There is no need to compare to lower / upper because the
				// tangent line has positive slope, guaranteeing that the x-axis
				// intercept is larger than lower / smaller than upper.
				if (fx > 0) {
					b = x;
					x = nx <= a ? 0.5 * (a + b) : nx;
				} else {
					a = x;
					x = nx >= b ? 0.5 * (a + b) : nx;
				}
			}
		}
	};
};
/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

var BlendMode = {
	process: function(blendMode, srcContext, dstContext, alpha, offset) {
		var srcCanvas = srcContext.canvas,
			dstData = dstContext.getImageData(offset.x, offset.y,
					srcCanvas.width, srcCanvas.height),
			dst  = dstData.data,
			src  = srcContext.getImageData(0, 0,
					srcCanvas.width, srcCanvas.height).data,
			min = Math.min,
			max = Math.max,
			abs = Math.abs,
			sr, sg, sb, sa, // source
			br, bg, bb, ba, // backdrop
			dr, dg, db;     // destination

		// Conversion methods for HSL modes, as described by
		// http://www.aiim.org/documents/standards/pdf/blend_modes.pdf
		// The setters modify the variables dr, dg, db directly.

		function getLum(r, g, b) {
			return 0.2989 * r + 0.587 * g + 0.114 * b;
		}

		function setLum(r, g, b, l) {
			var d = l - getLum(r, g, b);
			dr = r + d;
			dg = g + d;
			db = b + d;
			var l = getLum(dr, dg, db),
				mn = min(dr, dg, db),
				mx = max(dr, dg, db);
			if (mn < 0) {
				var lmn = l - mn;
				dr = l + (dr - l) * l / lmn;
				dg = l + (dg - l) * l / lmn;
				db = l + (db - l) * l / lmn;
			}
			if (mx > 255) {
				var ln = 255 - l, mxl = mx - l;
				dr = l + (dr - l) * ln / mxl;
				dg = l + (dg - l) * ln / mxl;
				db = l + (db - l) * ln / mxl;
			}
		}

		function getSat(r, g, b) {
			return max(r, g, b) - min(r, g, b);
		}

		function setSat(r, g, b, s) {
			var col = [r, g, b],
				mx = max(r, g, b), // max
				mn = min(r, g, b), // min
				md; // mid
			// Determine indices for min and max in col:
			mn = mn == r ? 0 : mn == g ? 1 : 2;
			mx = mx == r ? 0 : mx == g ? 1 : 2;
			// Determine the index in col that is not used yet by min and max,
			// and assign it to mid:
			md = min(mn, mx) == 0 ? max(mn, mx) == 1 ? 2 : 1 : 0;
			// Now perform the actual algorithm
			if (col[mx] > col[mn]) {
				col[md] = (col[md] - col[mn]) * s / (col[mx] - col[mn]);
				col[mx] = s;
			} else {
				col[md] = col[mx] = 0;
			}
			col[mn] = 0;
			// Finally write out the values
			dr = col[0];
			dg = col[1];
			db = col[2];
		}

		var modes = {
			multiply: function() {
				dr = br * sr / 255;
				dg = bg * sg / 255;
				db = bb * sb / 255;
			},

			screen: function() {
				dr = 255 - (255 - br) * (255 - sr) / 255;
				dg = 255 - (255 - bg) * (255 - sg) / 255;
				db = 255 - (255 - bb) * (255 - sb) / 255;
			},

			overlay: function() {
				dr = br < 128 ? 2 * br * sr / 255 : 255 - 2 * (255 - br) * (255 - sr) / 255;
				dg = bg < 128 ? 2 * bg * sg / 255 : 255 - 2 * (255 - bg) * (255 - sg) / 255;
				db = bb < 128 ? 2 * bb * sb / 255 : 255 - 2 * (255 - bb) * (255 - sb) / 255;
			},

			'soft-light': function() {
				var t = sr * br / 255;
				dr = t + br * (255 - (255 - br) * (255 - sr) / 255 - t) / 255;
				t = sg * bg / 255;
				dg = t + bg * (255 - (255 - bg) * (255 - sg) / 255 - t) / 255;
				t = sb * bb / 255;
				db = t + bb * (255 - (255 - bb) * (255 - sb) / 255 - t) / 255;
			},

			'hard-light': function() {
				// = Reverse of overlay
				dr = sr < 128 ? 2 * sr * br / 255 : 255 - 2 * (255 - sr) * (255 - br) / 255;
				dg = sg < 128 ? 2 * sg * bg / 255 : 255 - 2 * (255 - sg) * (255 - bg) / 255;
				db = sb < 128 ? 2 * sb * bb / 255 : 255 - 2 * (255 - sb) * (255 - bb) / 255;
			},

			'color-dodge': function() {
				dr = sr == 255 ? sr : min(255, br * 255 / (255 - sr));
				dg = sg == 255 ? sg : min(255, bg * 255 / (255 - sg));
				db = sb == 255 ? sb : min(255, bb * 255 / (255 - sb));
			},

			'color-burn': function() {
				dr = sr == 0 ? 0 : max(255 - ((255 - br) * 255) / sr, 0);
				dg = sg == 0 ? 0 : max(255 - ((255 - bg) * 255) / sg, 0);
				db = sb == 0 ? 0 : max(255 - ((255 - bb) * 255) / sb, 0);
			},

			darken: function() {
				dr = br < sr ? br : sr;
				dg = bg < sg ? bg : sg;
				db = bb < sb ? bb : sb;
			},

			lighten: function() {
				dr = br > sr ? br : sr;
				dg = bg > sg ? bg : sg;
				db = bb > sb ? bb : sb;
			},

			difference: function() {
				dr = br - sr;
				if (dr < 0)
					dr = -dr;
				dg = bg - sg;
				if (dg < 0)
					dg = -dg;
				db = bb - sb;
				if (db < 0)
					db = -db;
			},

			exclusion: function() {
				dr = br + sr * (255 - br - br) / 255;
				dg = bg + sg * (255 - bg - bg) / 255;
				db = bb + sb * (255 - bb - bb) / 255;
			},

			// HSL Modes:
			hue: function() {
				setSat(sr, sg, sb, getSat(br, bg, bb));
				setLum(dr, dg, db, getLum(br, bg, bb));
			},

			saturation: function() {
				setSat(br, bg, bb, getSat(sr, sg, sb));
				setLum(dr, dg, db, getLum(br, bg, bb));
			},

			luminosity: function() {
				setLum(br, bg, bb, getLum(sr, sg, sb));
			},

			color: function() {
				setLum(sr, sg, sb, getLum(br, bg, bb));
			},

			// TODO: Not in Illustrator:
			add: function() {
				dr = min(br + sr, 255);
				dg = min(bg + sg, 255);
				db = min(bb + sb, 255);
			},

			subtract: function() {
				dr = max(br - sr, 0);
				dg = max(bg - sg, 0);
				db = max(bb - sb, 0);
			},

			average: function() {
				dr = (br + sr) / 2;
				dg = (bg + sg) / 2;
				db = (bb + sb) / 2;
			},

			negation: function() {
				dr = 255 - abs(255 - sr - br);
				dg = 255 - abs(255 - sg - bg);
				db = 255 - abs(255 - sb - bb);
			}
		};

		var process = modes[blendMode];
		if (!process)
			return;

		for (var i = 0, l = dst.length; i < l; i += 4) {
			sr = src[i];
			br = dst[i];
			sg = src[i + 1];
			bg = dst[i + 1];
			sb = src[i + 2];
			bb = dst[i + 2];
			sa = src[i + 3];
			ba = dst[i + 3];
			process();
			var a1 = sa * alpha / 255,
				a2 = 1 - a1;
			dst[i] = a1 * dr + a2 * br;
			dst[i + 1] = a1 * dg + a2 * bg;
			dst[i + 2] = a1 * db + a2 * bb;
			dst[i + 3] = sa * alpha + a2 * ba;
		}
		dstContext.putImageData(dstData, offset.x, offset.y);
	}
};

/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

var PaperScript = this.PaperScript = new function() {
/**
 * A JavaScript tokenizer / parser / generator.
 * 
 * Distributed under the BSD license.
 * 
 * Copyright (c) 2010, Mihai Bazon <mihai.bazon@gmail.com>
 * http://mihai.bazon.net/blog/
 * 
 * Modifications and adaption to browser (c) 2011, Juerg Lehni
 * http://lehni.org/
 * 
 * Based on parse-js, (c) Marijn Haverbeke
 * http://marijn.haverbeke.nl/parse-js/
 */var parse_js=new function(){function W(a,b,c){var d=[];for(var e=0;e<a.length;++e)d.push(b.call(c,a[e],e));return d}function V(a,b){return Object.prototype.hasOwnProperty.call(a,b)}function U(c){return/^[a-z_$][a-z0-9_$]*$/i.test(c)&&c!="this"&&!V(d,c)&&!V(b,c)&&!V(a,c)}function T(a,b){var c={};a===!0&&(a={});for(var d in b)V(b,d)&&(c[d]=a&&V(a,d)?a[d]:b[d]);return c}function S(a,b){return b<1?"":Array(b+1).join(a)}function R(a,b){for(var c=b.length;--c>=0;)if(b[c]===a)return!0;return!1}function Q(a){return a.split("")}function P(a,b){return Array.prototype.slice.call(a,b||0)}function O(a){var b={};for(var c=0;c<a.length;++c)b[a[c]]=!0;return b}function N(a){a instanceof Function&&(a=a());for(var b=1,c=arguments.length;--c>0;++b)arguments[b]();return a}function M(a){var b=P(arguments,1);return function(){return a.apply(this,b.concat(P(arguments)))}}function L(a,b){function z(a){var b=a[0],c=r[b];if(!c)throw new Error("Can't find generator for \""+b+'"');y.push(a);var d=c.apply(b,a.slice(1));y.pop();return d}function x(a){var b=a[0],c=a[1];c!=null&&(b=k([g(b),"=",m(c,"seq")]));return b}function w(a){if(!a)return";";if(a.length==0)return"{}";return"{"+e+j(function(){return u(a).join(e)})+e+h("}")}function v(a){var b=a.length;if(b==0)return"{}";return"{"+e+W(a,function(a,d){var f=a[1].length>0,g=j(function(){return h(a[0]?k(["case",z(a[0])+":"]):"default:")},.5)+(f?e+j(function(){return u(a[1]).join(e)}):"");!c&&f&&d<b-1&&(g+=";");return g}).join(e)+e+h("}")}function u(a,b){for(var d=[],e=a.length-1,f=0;f<=e;++f){var g=a[f],i=z(g);i!=";"&&(!c&&f==e&&(g[0]=="while"&&H(g[2])||R(g[0],["for","for-in"])&&H(g[4])||g[0]=="if"&&H(g[2])&&!g[3]||g[0]=="if"&&g[3]&&H(g[3])?i=i.replace(/;*\s*$/,";"):i=i.replace(/;+\s*$/,"")),d.push(i))}return b?d:W(d,h)}function t(a,b,c,d){var e=d||"function";a&&(e+=" "+g(a)),e+="("+l(W(b,g))+")";return k([e,w(c)])}function s(a){if(a[0]=="do")return z(["block",[a]]);var b=a;for(;;){var c=b[0];if(c=="if"){if(!b[3])return z(["block",[a]]);b=b[3]}else if(c=="while"||c=="do")b=b[2];else if(c=="for"||c=="for-in")b=b[4];else break}return z(a)}function q(a){var b=a.toString(10),c=[b.replace(/^0\./,".")],d;Math.floor(a)===a?(c.push("0x"+a.toString(16).toLowerCase(),"0"+a.toString(8)),(d=/^(.*?)(0+)$/.exec(a))&&c.push(d[1]+"e"+d[2].length)):(d=/^0?\.(0+)(.*)$/.exec(a))&&c.push(d[2]+"e-"+(d[1].length+d[2].length),b.substr(b.indexOf(".")));return n(c)}function o(a){if(a[0]=="function"||a[0]=="object"){var b=P(y),c=b.pop(),d=b.pop();while(d){if(d[0]=="stat")return!0;if((d[0]=="seq"||d[0]=="call"||d[0]=="dot"||d[0]=="sub"||d[0]=="conditional")&&d[1]===c||(d[0]=="binary"||d[0]=="assign"||d[0]=="unary-postfix")&&d[2]===c)c=d,d=b.pop();else return!1}}return!V(I,a[0])}function n(a){if(a.length==1)return a[0];if(a.length==2){var b=a[1];a=a[0];return a.length<=b.length?a:b}return n([a[0],n(a.slice(1))])}function m(a){var b=z(a);for(var c=1;c<arguments.length;++c){var d=arguments[c];if(d instanceof Function&&d(a)||a[0]==d)return"("+b+")"}return b}function l(a){return a.join(","+f)}function k(a){if(c)return a.join(" ");var b=[];for(var d=0;d<a.length;++d){var e=a[d+1];b.push(a[d]),e&&(/[a-z0-9_\x24]$/i.test(a[d].toString())&&/^[a-z0-9_\x24]/i.test(e.toString())||/[\+\-]$/.test(a[d].toString())&&/^[\+\-]/.test(e.toString()))&&b.push(" ")}return b.join("")}function j(a,b){b==null&&(b=1),d+=b;try{return a.apply(null,P(arguments,1))}finally{d-=b}}function h(a){a==null&&(a=""),c&&(a=S(" ",b.indent_start+d*b.indent_level)+a);return a}function g(a){return a.toString()}b=T(b,{indent_start:0,indent_level:4,quote_keys:!1,space_colon:!1,beautify:!1});var c=!!b.beautify,d=0,e=c?"\n":"",f=c?" ":"",r={string:J,num:q,name:g,toplevel:function(a){return u(a).join(e+e)},splice:function(a){var b=y[y.length-2][0];return V(K,b)?w.apply(this,arguments):W(u(a,!0),function(a,b){return b>0?h(a):a}).join(e)},block:w,"var":function(a){return"var "+l(W(a,x))+";"},"const":function(a){return"const "+l(W(a,x))+";"},"try":function(a,b,c){var d=["try",w(a)];b&&d.push("catch","("+b[0]+")",w(b[1])),c&&d.push("finally",w(c));return k(d)},"throw":function(a){return k(["throw",z(a)])+";"},"new":function(a,b){b=b.length>0?"("+l(W(b,z))+")":"";return k(["new",m(a,"seq","binary","conditional","assign",function(a){var b=G(),c={};try{b.with_walkers({call:function(){throw c},"function":function(){return this}},function(){b.walk(a)})}catch(d){if(d===c)return!0;throw d}})+b])},"switch":function(a,b){return k(["switch","("+z(a)+")",v(b)])},"break":function(a){var b="break";a!=null&&(b+=" "+g(a));return b+";"},"continue":function(a){var b="continue";a!=null&&(b+=" "+g(a));return b+";"},conditional:function(a,b,c){return k([m(a,"assign","seq","conditional"),"?",m(b,"seq"),":",m(c,"seq")])},assign:function(a,b,c){a&&a!==!0?a+="=":a="=";return k([z(b),a,m(c,"seq")])},dot:function(a){var b=z(a),c=1;a[0]=="num"?/\./.test(a[1])||(b+="."):o(a)&&(b="("+b+")");while(c<arguments.length)b+="."+g(arguments[c++]);return b},call:function(a,b){var c=z(a);o(a)&&(c="("+c+")");return c+"("+l(W(b,function(a){return m(a,"seq")}))+")"},"function":t,defun:t,"if":function(a,b,c){var d=["if","("+z(a)+")",c?s(b):z(b)];c&&d.push("else",z(c));return k(d)},"for":function(a,b,c,d){var e=["for"];a=(a!=null?z(a):"").replace(/;*\s*$/,";"+f),b=(b!=null?z(b):"").replace(/;*\s*$/,";"+f),c=(c!=null?z(c):"").replace(/;*\s*$/,"");var g=a+b+c;g=="; ; "&&(g=";;"),e.push("("+g+")",z(d));return k(e)},"for-in":function(a,b,c,d){return k(["for","("+(a?z(a).replace(/;+$/,""):z(b)),"in",z(c)+")",z(d)])},"while":function(a,b){return k(["while","("+z(a)+")",z(b)])},"do":function(a,b){return k(["do",z(b),"while","("+z(a)+")"])+";"},"return":function(a){var b=["return"];a!=null&&b.push(z(a));return k(b)+";"},binary:function(a,b,c){var d=z(b),e=z(c);if(R(b[0],["assign","conditional","seq"])||b[0]=="binary"&&B[a]>B[b[1]])d="("+d+")";if(R(c[0],["assign","conditional","seq"])||c[0]=="binary"&&B[a]>=B[c[1]]&&(c[1]!=a||!R(a,["&&","||","*"])))e="("+e+")";return k([d,a,e])},"unary-prefix":function(a,b){var c=z(b);b[0]=="num"||b[0]=="unary-prefix"&&!V(i,a+b[1])||!o(b)||(c="("+c+")");return a+(p(a.charAt(0))?" ":"")+c},"unary-postfix":function(a,b){var c=z(b);b[0]=="num"||b[0]=="unary-postfix"&&!V(i,a+b[1])||!o(b)||(c="("+c+")");return c+a},sub:function(a,b){var c=z(a);o(a)&&(c="("+c+")");return c+"["+z(b)+"]"},object:function(a){if(a.length==0)return"{}";return"{"+e+j(function(){return W(a,function(a){if(a.length==3)return h(t(a[0],a[1][2],a[1][3],a[2]));var d=a[0],e=z(a[1]);b.quote_keys?d=J(d):(typeof d=="number"||!c&&+d+""==d)&&parseFloat(d)>=0?d=q(+d):U(d)||(d=J(d));return h(k(c&&b.space_colon?[d,":",e]:[d+":",e]))}).join(","+e)})+e+h("}")},regexp:function(a,b){return"/"+a+"/"+b},array:function(a){if(a.length==0)return"[]";return k(["[",l(W(a,function(a){if(!c&&a[0]=="atom"&&a[1]=="undefined")return"";return m(a,"seq")})),"]"])},stat:function(a){return z(a).replace(/;*\s*$/,";")},seq:function(){return l(W(P(arguments),z))},label:function(a,b){return k([g(a),":",z(b)])},"with":function(a,b){return k(["with","("+z(a)+")",z(b)])},atom:function(a){return g(a)}},y=[];return z(a)}function J(a){var b=0,c=0;a=a.replace(/[\\\b\f\n\r\t\x22\x27]/g,function(a){switch(a){case"\\":return"\\\\";case"\b":return"\\b";case"\f":return"\\f";case"\n":return"\\n";case"\r":return"\\r";case"\t":return"\\t";case'"':++b;return'"';case"'":++c;return"'"}return a});return b>c?"'"+a.replace(/\x27/g,"\\'")+"'":'"'+a.replace(/\x22/g,'\\"')+'"'}function H(a){return!a||a[0]=="block"&&(!a[1]||a[1].length==0)}function G(){function g(a,b){var c={},e;for(e in a)V(a,e)&&(c[e]=d[e],d[e]=a[e]);var f=b();for(e in c)V(c,e)&&(c[e]?d[e]=c[e]:delete d[e]);return f}function f(a){if(a==null)return null;try{e.push(a);var b=a[0],f=d[b];if(f){var g=f.apply(a,a.slice(1));if(g!=null)return g}f=c[b];return f.apply(a,a.slice(1))}finally{e.pop()}}function b(a){var b=[this[0]];a!=null&&b.push(W(a,f));return b}function a(a){return[this[0],W(a,function(a){var b=[a[0]];a.length>1&&(b[1]=f(a[1]));return b})]}var c={string:function(a){return[this[0],a]},num:function(a){return[this[0],a]},name:function(a){return[this[0],a]},toplevel:function(a){return[this[0],W(a,f)]},block:b,splice:b,"var":a,"const":a,"try":function(a,b,c){return[this[0],W(a,f),b!=null?[b[0],W(b[1],f)]:null,c!=null?W(c,f):null]},"throw":function(a){return[this[0],f(a)]},"new":function(a,b){return[this[0],f(a),W(b,f)]},"switch":function(a,b){return[this[0],f(a),W(b,function(a){return[a[0]?f(a[0]):null,W(a[1],f)]})]},"break":function(a){return[this[0],a]},"continue":function(a){return[this[0],a]},conditional:function(a,b,c){return[this[0],f(a),f(b),f(c)]},assign:function(a,b,c){return[this[0],a,f(b),f(c)]},dot:function(a){return[this[0],f(a)].concat(P(arguments,1))},call:function(a,b){return[this[0],f(a),W(b,f)]},"function":function(a,b,c){return[this[0],a,b.slice(),W(c,f)]},defun:function(a,b,c){return[this[0],a,b.slice(),W(c,f)]},"if":function(a,b,c){return[this[0],f(a),f(b),f(c)]},"for":function(a,b,c,d){return[this[0],f(a),f(b),f(c),f(d)]},"for-in":function(a,b,c,d){return[this[0],f(a),f(b),f(c),f(d)]},"while":function(a,b){return[this[0],f(a),f(b)]},"do":function(a,b){return[this[0],f(a),f(b)]},"return":function(a){return[this[0],f(a)]},binary:function(a,b,c){return[this[0],a,f(b),f(c)]},"unary-prefix":function(a,b){return[this[0],a,f(b)]},"unary-postfix":function(a,b){return[this[0],a,f(b)]},sub:function(a,b){return[this[0],f(a),f(b)]},object:function(a){return[this[0],W(a,function(a){return a.length==2?[a[0],f(a[1])]:[a[0],f(a[1]),a[2]]})]},regexp:function(a,b){return[this[0],a,b]},array:function(a){return[this[0],W(a,f)]},stat:function(a){return[this[0],f(a)]},seq:function(){return[this[0]].concat(W(P(arguments),f))},label:function(a,b){return[this[0],a,f(b)]},"with":function(a,b){return[this[0],f(a),f(b)]},atom:function(a){return[this[0],a]}},d={},e=[];return{walk:f,with_walkers:g,parent:function(){return e[e.length-2]},stack:function(){return e}}}function F(a,b,c){function bk(a){try{++d.in_loop;return a()}finally{--d.in_loop}}function bi(a){var b=bg(a),c=d.token.value;if(e("operator")&&V(A,c)){if(bh(b)){g();return p("assign",A[c],b,bi(a))}i("Invalid assignment")}return b}function bh(a){if(!b)return!0;switch(a[0]){case"dot":case"sub":case"new":case"call":return!0;case"name":return a[1]!="this"}}function bg(a){var b=bf(a);if(e("operator","?")){g();var c=bj(!1);m(":");return p("conditional",b,c,bj(!1,a))}return b}function bf(a){return be(Y(!0),0,a)}function be(a,b,c){var f=e("operator")?d.token.value:null;f&&f=="in"&&c&&(f=null);var h=f!=null?B[f]:null;if(h!=null&&h>b){g();var i=be(Y(!0),h,c);return be(p("binary",f,a,i),b,c)}return a}function bd(a,b,c){(b=="++"||b=="--")&&!bh(c)&&i("Invalid use of "+b+" operator");return p(a,b,c)}function bc(a,b){if(e("punc",".")){g();return bc(p("dot",a,bb()),b)}if(e("punc","[")){g();return bc(p("sub",a,N(bj,M(m,"]"))),b)}if(b&&e("punc","(")){g();return bc(p("call",a,Z(")")),!0)}if(b&&e("operator")&&V(z,d.token.value))return N(M(bd,"unary-postfix",d.token.value,a),g);return a}function bb(){switch(d.token.type){case"name":case"operator":case"keyword":case"atom":return N(d.token.value,g);default:k()}}function ba(){switch(d.token.type){case"num":case"string":return N(d.token.value,g)}return bb()}function _(){var a=!0,c=[];while(!e("punc","}")){a?a=!1:m(",");if(!b&&e("punc","}"))break;var f=d.token.type,h=ba();f!="name"||h!="get"&&h!="set"||!!e("punc",":")?(m(":"),c.push([h,bj(!1)])):c.push([bb(),K(!1),h])}g();return p("object",c)}function $(){return p("array",Z("]",!b,!0))}function Z(a,b,c){var d=!0,f=[];while(!e("punc",a)){d?d=!1:m(",");if(b&&e("punc",a))break;e("punc",",")&&c?f.push(["atom","undefined"]):f.push(bj(!1))}g();return f}function X(){var a=Y(!1),b;e("punc","(")?(g(),b=Z(")")):b=[];return bc(p("new",a,b),!0)}function W(){return p("const",T())}function U(a){return p("var",T(a))}function T(a){var b=[];for(;;){e("name")||k();var c=d.token.value;g(),e("operator","=")?(g(),b.push([c,bj(!1,a)])):b.push([c]);if(!e("punc",","))break;g()}return b}function S(){var a=O(),b,c;if(e("keyword","catch")){g(),m("("),e("name")||i("Name expected");var f=d.token.value;g(),m(")"),b=[f,O()]}e("keyword","finally")&&(g(),c=O()),!b&&!c&&i("Missing catch/finally blocks");return p("try",a,b,c)}function O(){m("{");var a=[];while(!e("punc","}"))e("eof")&&k(),a.push(t());g();return a}function L(){var a=q(),b=t(),c;e("keyword","else")&&(g(),c=t());return p("if",a,b,c)}function J(a){var b=a[0]=="var"?p("name",a[1][0]):a;g();var c=bj();m(")");return p("for-in",a,b,c,bk(t))}function I(a){m(";");var b=e("punc",";")?null:bj();m(";");var c=e("punc",")")?null:bj();m(")");return p("for",a,b,c,bk(t))}function H(){m("(");var a=null;if(!e("punc",";")){a=e("keyword","var")?(g(),U(!0)):bj(!0,!0);if(e("operator","in"))return J(a)}return I(a)}function G(a){var b;n()||(b=e("name")?d.token.value:null),b!=null?(g(),R(b,d.labels)||i("Label "+b+" without matching loop or statement")):d.in_loop==0&&i(a+" not inside a loop or switch"),o();return p(a,b)}function F(){return p("stat",N(bj,o))}function w(a){d.labels.push(a);var c=d.token,e=t();b&&!V(C,e[0])&&k(c),d.labels.pop();return p("label",a,e)}function s(a){return c?function(){var b=d.token,c=a.apply(this,arguments);c[0]=r(c[0],b,h());return c}:a}function r(a,b,c){return a instanceof E?a:new E(a,b,c)}function q(){m("(");var a=bj();m(")");return a}function p(){return P(arguments)}function o(){e("punc",";")?g():n()||k()}function n(){return!b&&(d.token.nlb||e("eof")||e("punc","}"))}function m(a){return l("punc",a)}function l(a,b){if(e(a,b))return g();j(d.token,"Unexpected token "+d.token.type+", expected "+a)}function k(a){a==null&&(a=d.token),j(a,"Unexpected token: "+a.type+" ("+a.value+")")}function j(a,b){i(b,a.line,a.col)}function i(a,b,c,e){var f=d.input.context();u(a,b!=null?b:f.tokline,c!=null?c:f.tokcol,e!=null?e:f.tokpos)}function h(){return d.prev}function g(){d.prev=d.token,d.peeked?(d.token=d.peeked,d.peeked=null):d.token=d.input();return d.token}function f(){return d.peeked||(d.peeked=d.input())}function e(a,b){return v(d.token,a,b)}var d={input:typeof a=="string"?x(a,!0):a,token:null,prev:null,peeked:null,in_function:0,in_loop:0,labels:[]};d.token=g();var t=s(function(){e("operator","/")&&(d.peeked=null,d.token=d.input(!0));switch(d.token.type){case"num":case"string":case"regexp":case"operator":case"atom":return F();case"name":return v(f(),"punc",":")?w(N(d.token.value,g,g)):F();case"punc":switch(d.token.value){case"{":return p("block",O());case"[":case"(":return F();case";":g();return p("block");default:k()};case"keyword":switch(N(d.token.value,g)){case"break":return G("break");case"continue":return G("continue");case"debugger":o();return p("debugger");case"do":return function(a){l("keyword","while");return p("do",N(q,o),a)}(bk(t));case"for":return H();case"function":return K(!0);case"if":return L();case"return":d.in_function==0&&i("'return' outside of function");return p("return",e("punc",";")?(g(),null):n()?null:N(bj,o));case"switch":return p("switch",q(),Q());case"throw":return p("throw",N(bj,o));case"try":return S();case"var":return N(U,o);case"const":return N(W,o);case"while":return p("while",q(),bk(t));case"with":return p("with",q(),t());default:k()}}}),K=s(function(a){var b=e("name")?N(d.token.value,g):null;a&&!b&&k(),m("(");return p(a?"defun":"function",b,function(a,b){while(!e("punc",")"))a?a=!1:m(","),e("name")||k(),b.push(d.token.value),g();g();return b}(!0,[]),function(){++d.in_function;var a=d.in_loop;d.in_loop=0;var b=O();--d.in_function,d.in_loop=a;return b}())}),Q=M(bk,function(){m("{");var a=[],b=null;while(!e("punc","}"))e("eof")&&k(),e("keyword","case")?(g(),b=[],a.push([bj(),b]),m(":")):e("keyword","default")?(g(),m(":"),b=[],a.push([null,b])):(b||k(),b.push(t()));g();return a}),Y=s(function(a){if(e("operator","new")){g();return X()}if(e("operator")&&V(y,d.token.value))return bd("unary-prefix",N(d.token.value,g),Y(a));if(e("punc")){switch(d.token.value){case"(":g();return bc(N(bj,M(m,")")),a);case"[":g();return bc($(),a);case"{":g();return bc(_(),a)}k()}if(e("keyword","function")){g();return bc(K(!1),a)}if(V(D,d.token.type)){var b=d.token.type=="regexp"?p("regexp",d.token.value[0],d.token.value[1]):p(d.token.type,d.token.value);return bc(N(b,g),a)}k()}),bj=s(function(a,b){arguments.length==0&&(a=!0);var c=bi(b);if(a&&e("punc",",")){g();return p("seq",c,bj(!0,b))}return c});return p("toplevel",function(a){while(!e("eof"))a.push(t());return a}([]))}function E(a,b,c){this.name=a,this.start=b,this.end=c}function x(b){function O(a){if(a)return I();y(),v();var b=g();if(!b)return x("eof");if(o(b))return C();if(b=='"'||b=="'")return F();if(V(l,b))return x("punc",h());if(b==".")return L();if(b=="/")return K();if(V(e,b))return J();if(b=="\\"||q(b))return M();B("Unexpected character '"+b+"'")}function N(a,b){try{return b()}catch(c){if(c===w)B(a);else throw c}}function M(){var b=A(r);return V(a,b)?V(i,b)?x("operator",b):V(d,b)?x("atom",b):x("keyword",b):x("name",b)}function L(){h();return o(g())?C("."):x("punc",".")}function K(){h();var a=f.regex_allowed;switch(g()){case"/":f.comments_before.push(G()),f.regex_allowed=a;return O();case"*":f.comments_before.push(H()),f.regex_allowed=a;return O()}return f.regex_allowed?I():J("/")}function J(a){function b(a){if(!g())return a;var c=a+g();if(V(i,c)){h();return b(c)}return a}return x("operator",b(a||h()))}function I(){return N("Unterminated regular expression",function(){var a=!1,b="",c,d=!1;while(c=h(!0))if(a)b+="\\"+c,a=!1;else if(c=="[")d=!0,b+=c;else if(c=="]"&&d)d=!1,b+=c;else{if(c=="/"&&!d)break;c=="\\"?a=!0:b+=c}var e=A(function(a){return V(m,a)});return x("regexp",[b,e])})}function H(){h();return N("Unterminated multiline comment",function(){var a=t("*/",!0),b=f.text.substring(f.pos,a),c=x("comment2",b,!0);f.pos=a+2,f.line+=b.split("\n").length-1,f.newline_before=b.indexOf("\n")>=0;return c})}function G(){h();var a=t("\n"),b;a==-1?(b=f.text.substr(f.pos),f.pos=f.text.length):(b=f.text.substring(f.pos,a),f.pos=a);return x("comment1",b,!0)}function F(){return N("Unterminated string constant",function(){var a=h(),b="";for(;;){var c=h(!0);if(c=="\\")c=D();else if(c==a)break;b+=c}return x("string",b)})}function E(a){var b=0;for(;a>0;--a){var c=parseInt(h(!0),16);isNaN(c)&&B("Invalid hex-character pattern in string"),b=b<<4|c}return b}function D(){var a=h(!0);switch(a){case"n":return"\n";case"r":return"\r";case"t":return"\t";case"b":return"\b";case"v":return"";case"f":return"\f";case"0":return" ";case"x":return String.fromCharCode(E(2));case"u":return String.fromCharCode(E(4));default:return a}}function C(a){var b=!1,c=!1,d=!1,e=a==".",f=A(function(f,g){if(f=="x"||f=="X"){if(d)return!1;return d=!0}if(!d&&(f=="E"||f=="e")){if(b)return!1;return b=c=!0}if(f=="-"){if(c||g==0&&!a)return!0;return!1}if(f=="+")return c;c=!1;if(f=="."){if(!e&&!d)return e=!0;return!1}return p(f)});a&&(f=a+f);var g=s(f);if(!isNaN(g))return x("num",g);B("Invalid syntax: "+f)}function B(a){u(a,f.tokline,f.tokcol,f.tokpos)}function A(a){var b="",c=g(),d=0;while(c&&a(c,d++))b+=h(),c=g();return b}function y(){while(V(j,g()))h()}function x(a,b,d){f.regex_allowed=a=="operator"&&!V(z,b)||a=="keyword"&&V(c,b)||a=="punc"&&V(k,b);var e={type:a,value:b,line:f.tokline,col:f.tokcol,pos:f.tokpos,nlb:f.newline_before};d||(e.comments_before=f.comments_before,f.comments_before=[]),f.newline_before=!1;return e}function v(){f.tokline=f.line,f.tokcol=f.col,f.tokpos=f.pos}function t(a,b){var c=f.text.indexOf(a,f.pos);if(b&&c==-1)throw w;return c}function n(){return!f.peek()}function h(a){var b=f.text.charAt(f.pos++);if(a&&!b)throw w;b=="\n"?(f.newline_before=!0,++f.line,f.col=0):++f.col;return b}function g(){return f.text.charAt(f.pos)}var f={text:b.replace(/\r\n?|[\n\u2028\u2029]/g,"\n").replace(/^\uFEFF/,""),pos:0,tokpos:0,line:0,tokline:0,col:0,tokcol:0,newline_before:!1,regex_allowed:!1,comments_before:[]};O.context=function(a){a&&(f=a);return f};return O}function v(a,b,c){return a.type==b&&(c==null||a.value==c)}function u(a,b,c,d){throw new t(a,b,c,d)}function t(a,b,c,d){this.message=a,this.line=b,this.col=c,this.pos=d}function s(a){if(f.test(a))return parseInt(a.substr(2),16);if(g.test(a))return parseInt(a.substr(1),8);if(h.test(a))return parseFloat(a)}function r(a){return q(a)||o(a)}function q(a){return a=="$"||a=="_"||n(a)}function p(a){return o(a)||n(a)}function o(a){a=a.charCodeAt(0);return a>=48&&a<=57}function n(a){a=a.charCodeAt(0);return a>=65&&a<=90||a>=97&&a<=122}var a=O(["break","case","catch","const","continue","default","delete","do","else","finally","for","function","if","in","instanceof","new","return","switch","throw","try","typeof","var","void","while","with"]),b=O(["abstract","boolean","byte","char","class","debugger","double","enum","export","extends","final","float","goto","implements","import","int","interface","long","native","package","private","protected","public","short","static","super","synchronized","throws","transient","volatile"]),c=O(["return","new","delete","throw","else","case"]),d=O(["false","null","true","undefined"]),e=O(Q("+-*&%=<>!?|~^")),f=/^0x[0-9a-f]+$/i,g=/^0[0-7]+$/,h=/^\d*\.?\d*(?:e[+-]?\d*(?:\d\.?|\.?\d)\d*)?$/i,i=O(["in","instanceof","typeof","new","void","delete","++","--","+","-","!","~","&","|","^","*","/","%",">>","<<",">>>","<",">","<=",">=","==","===","!=","!==","?","=","+=","-=","/=","*=","%=",">>=","<<=",">>>=","|=","^=","&=","&&","||"]),j=O(Q(" \n\r\t")),k=O(Q("[{}(,.;:")),l=O(Q("[]{}(),;:")),m=O(Q("gmsiy"));t.prototype.toString=function(){return this.message+" (line: "+this.line+", col: "+this.col+", pos: "+this.pos+")"};var w={},y=O(["typeof","void","delete","--","++","!","~","-","+"]),z=O(["--","++"]),A=function(a,b,c){while(c<a.length)b[a[c]]=a[c].substr(0,a[c].length-1),c++;return b}(["+=","-=","/=","*=","%=",">>=","<<=",">>>=","|=","^=","&="],{"=":!0},0),B=function(a,b){for(var c=0,d=1;c<a.length;++c,++d){var e=a[c];for(var f=0;f<e.length;++f)b[e[f]]=d}return b}([["||"],["&&"],["|"],["^"],["&"],["==","===","!=","!=="],["<",">","<=",">=","in","instanceof"],[">>","<<",">>>"],["+","-"],["*","/","%"]],{}),C=O(["for","do","while","switch"]),D=O(["atom","num","string","regexp","name"]);E.prototype.toString=function(){return this.name};var I=O(["name","array","object","string","dot","sub","call","regexp"]),K=O(["if","while","do","for","for-in","with"]);return{parse:F,gen_code:L,tokenizer:x,ast_walker:G}}
	// Math Operators

	var operators = {
		'+': 'add',
		'-': 'subtract',
		'*': 'multiply',
		'/': 'divide',
		'%': 'modulo',
		'==': 'equals',
		'!=': 'equals'
	};

	function $eval(left, operator, right) {
		var handler = operators[operator];
		if (left && left[handler]) {
			var res = left[handler](right);
			return operator == '!=' ? !res : res;
		}
		switch (operator) {
		case '+': return left + right;
		case '-': return left - right;
		case '*': return left * right;
		case '/': return left / right;
		case '%': return left % right;
		case '==': return left == right;
		case '!=': return left != right;
		default:
			throw new Error('Implement Operator: ' + operator);
		}
	};

	// Sign Operators

	var signOperators = {
		'-': 'negate'
	};

	function $sign(operator, value) {
		var handler = signOperators[operator];
		if (value && value[handler]) {
			return value[handler]();
		}
		switch (operator) {
		case '+': return +value;
		case '-': return -value;
		default:
			throw new Error('Implement Sign Operator: ' + operator);
		}
	}

	// AST Helpers

	function isDynamic(exp) {
		var type = exp[0];
		return type != 'num' && type != 'string';
	}

	function handleOperator(operator, left, right) {
		// Only replace operators with calls to $operator if the left hand side
		// is potentially an object.
		if (operators[operator] && isDynamic(left)) {
			// Replace with call to $operator(left, operator, right):
			return ['call', ['name', '$eval'],
					[left, ['string', operator], right]];
		}
	}

	function compile(code) {
		// Use parse-js to translate the code into a AST structure which is then
		// walked and parsed for operators to overload. The resulting AST is
		// translated back to code and evaluated.
		var ast = parse_js.parse(code, true),
			walker = parse_js.ast_walker(),
			walk = walker.walk;

		ast = walker.with_walkers({
			'binary': function(operator, left, right) {
				// Handle simple mathematical operators here:
				return handleOperator(operator, left = walk(left),
						right = walk(right))
						// Always return something since we're walking left and
						// right for the handleOperator() call already.
						|| [this[0], operator, left, right];
			},

			'assign': function(operator, left, right) {
				// Handle assignments like +=, -=, etc:
				// Check if the assignment operator needs to be handled by paper
				// if so, convert the assignment to a simple = and use result of
				// of handleOperator on the right hand side.
				var res = handleOperator(operator, left = walk(left),
						right = walk(right));
				if (res)
					return [this[0], true, left, res];
				// Always return something for the same reason as in binary
				return [this[0], operator, left, right];
			},

			'unary-prefix': function(operator, exp) {
				if (signOperators[operator] && isDynamic(exp)) {
					return ['call', ['name', '$sign'],
							[['string', operator], walk(exp)]];
				}
			}
		}, function() {
			return walk(ast);
		});

		return parse_js.gen_code(ast, true);
	}

	function evaluate(code, scope) {
		// See if it's a script tag or a string
		if (typeof code !== 'string') {
			// If a canvas id is provided, create a project for it now,
			// so the active project is defined.
			var canvas = code.getAttribute('canvas');
			if (canvas = canvas && document.getElementById(canvas)) {
				// Create an empty Project for this scope, and a view for the
				// canvas, both using the right paper scope
				paper = scope;
				new Project();
				// Activate the newly created view straight away
				new View(canvas).activate();
			}
			if (code.src) {
				// If we're loading from a source, request that first and then
				// run later.
				return request(code.src, scope);
			} else {
				// We can simply get the code form the script tag.
				code = code.innerHTML;
			}
		}
		var view = scope.view,
			// TODO: Add support for multiple tools
			tool = scope.tool = /on(?:Key|Mouse)(?:Up|Down|Move|Drag)/.test(code)
					&& new Tool(null, scope),
			res;
		// Define variables for potential handlers, so eval() calls below to
		// fetch their values do not require try-catch around them.
		// Set currently active scope.
		paper = scope;
		// Use with(){} in order to make the scope the current 'global' scope
		// instead of window.
		with (scope) {
			// Within this, use a function scope, so local variables to not try
			// and set themselves on the scope object.
			(function() {
				var onEditOptions, onSelect, onDeselect, onReselect, onMouseDown,
					onMouseUp, onMouseDrag, onMouseMove, onKeyDown, onKeyUp,
					onFrame, onResize,
					handlers = [ 'onEditOptions', 'onSelect', 'onDeselect',
						'onReselect', 'onMouseDown', 'onMouseUp', 'onMouseDrag',
						'onMouseMove', 'onKeyDown', 'onKeyUp'];
				res = eval(compile(code));
				if (tool) {
					// We could do this instead to avoid eval(), but it's longer
					// tool.onEditOptions = onEditOptions;
					// tool.onSelect = onSelect;
					// tool.onDeselect = onDeselect;
					// tool.onReselect = onReselect;
					// tool.onMouseDown = onMouseDown;
					// tool.onMouseUp = onMouseUp;
					// tool.onMouseDrag = onMouseDrag;
					// tool.onMouseMove = onMouseMove;
					// tool.onKeyDown = onKeyDown;
					// tool.onKeyUp = onKeyUp;
					Base.each(handlers, function(key) {
						tool[key] = eval(key);
					});
				}
				if (view) {
					view.onResize = onResize;
					if (onFrame) {
						view.setOnFrame(onFrame);
					} else {
						// Automatically draw view at the end.
						view.draw();
					}
				}
			}).call(scope);
		}
		return res;
	}

	// Code borrowed from Coffee Script:
	function request(url, scope) {
		var xhr = new (window.ActiveXObject || XMLHttpRequest)(
				'Microsoft.XMLHTTP');
		xhr.open('GET', url, true);
		if (xhr.overrideMimeType) {
			xhr.overrideMimeType('text/plain');
		}
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				return evaluate(xhr.responseText, scope);
			}
		};
		return xhr.send(null);
	}

	function load() {
		var scripts = document.getElementsByTagName('script'),
			count = 0;
		for (var i = 0, l = scripts.length; i < l; i++) {
			var script = scripts[i];
			// Only load this script if it not loaded already.
			// TODO: support 'text/x-paperscript':
			if (script.type === 'text/paperscript'
					&& !script.getAttribute('loaded')) {
				// Produce a new PaperScope for this script now. Scopes are
				// cheap so let's not worry about the initial one that was
				// already created.
				// Define an id for each paperscript, so its scope can be
				// retrieved through PaperScope.get().
				var scope = new PaperScope(script.getAttribute('id')
						|| script.src || ('paperscript-' + (count++)));
				// Make sure the tag also has this id now. If it already had an
				// id, we're not changing it, since it's the first option we're
				// trying to get an id from above.
				script.setAttribute('id', scope.id);
				evaluate(script, scope);
				// Mark script as loaded now.
				script.setAttribute('loaded', true);
			}
		}
	}

	DomEvent.add(window, { load: load });

	return {
		compile: compile,
		evaluate: evaluate,
		load: load
	};

};

// Export load directly:
this.load = PaperScript.load;

// Finally inject the classes set on 'this' into the PaperScope class and create
// the first PaperScope and return it, all in one statement.
return new (PaperScope.inject(this));
};
