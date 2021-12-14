const logErrorTrace = (...data) => {
	let trace = (new Error).stack.split('\n');
	trace.shift();
	console.error(...data, ...trace.map(v => `\n${v}`));
};
const isObject = v => typeof v === 'object' && v !== null && !Array.isArray(v);
class TypeStore {
	/* ncp = Null Check is Post = Null Check to be done Post checking current types */
	static #store = {
		'null': {
			ncp: true,
			handler: function (value) {
				if(value === null) {
					return [true, null];
				}
				value = (new String(value)).toLowerCase();
				if(value === '' || value === 'null') {
					return [true, null];
				}
				return [false];
			}
		},
		'any': {
			ncp: false,
			handler: function (value) {
				return [true, value];
			}
		},
		'float': {
			ncp: false,
			handler: function(value) {
				switch(typeof value) {
					case "bigint":
						return [true, value];
					case "boolean":
						return [true, value ? 1 : 0];
					case "object":
						value = String(value);
					case "string":
						value = (Number(value)).valueOf();
					case "number":
						if(!Number.isNaN(value)) {
							return [true, value];
						}
						break;
					case "function":
					case "symbol":
					case "undefined":
					default:
						break;
				}
				return [false];
			}
		},
		'num': {
			ncp: false,
			handler: function (value) {
				return TypeStore.check('float', value);
			}
		},
		'int': {
			ncp: false,
			handler: function (value) {
				const [valid, val] = TypeStore.check('float', value);
				if(valid && Number.isInteger(val)) {
					return [true, val];
				}
				return [false];
			}
		},
		'unsigned': {
			ncp: false,
			handler: function (value) {
				const [valid, val] = TypeStore.check('int', value);
				if(valid && val >= 0) {
					return [true, val];
				}
				return [false];
			}
		},
		'bool': {
			ncp: false,
			handler: function(value) {
				return [true, (Boolean(value)).valueOf()];
			}
		},
		'string': {
			ncp: false,
			handler: function(value) {
				return [true, (new String(value)).valueOf()];
			}
		},
		'email': {
			ncp: false,
			handler: function(value) {
				[,value] = TypeStore.check('string', value);
				const node = document?.createElement('input');
				if(node !== null) {
					node.type = 'email';
					node.value = value;
					return node.checkValidity() ? [true, value] : [false];
				} else {
					return (/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(value)) ? [true, value] : [false]; 
				}
			}
		},
		'hex': {
			ncp: false,
			handler: function(value) {
				[,value] = TypeStore.check('string', value);
				return /^[0-9a-f]+$/i.test(value) ? [true, Number(value).valueOf()] : [false];
			}
		},
		'object': {
			ncp: false,
			handler: function(value) {
				switch(typeof value) {
					case 'object':
						if(value !== null) {
							return [true, value];
						}
						break;
					default:
						try {
							value = JSON.parse(String(value));
							if(typeof value === 'object' && value !== null) {
								return [true, value];
							}
						} catch (error) {
							return [false];
						}
						break;
				}
				return [false];
			}
		},
		'timestamp': {
			ncp: false,
			handler: function(value) {
				[,value] = TypeStore.check('string', value);
				let val = (new Date(value)).valueOf();
				if(val === NaN) {
					val = Date.parse(value)
				}
				return val === NaN ? [false] : [true, val];
			}
		},
		'url': {
			ncp: false,
			handler: function(value) {
				[,value] = TypeStore.check('string', value);
				try {
					value = new URL(value);
					return [true, value.valueOf()];
				} catch (error) {
					return [false];
				}
			}
		}
	};
	static has(name) {
		return TypeStore.#store.hasOwnProperty(name);
	}
	static add(name, handler, nullCheckIsPost = true) {
		if(typeof name !== 'string') {
			logErrorTrace('Type name must be a string');
			return false;
		}
		if(typeof handler === 'function') {
			TypeStore.#store[name] = {
				ncp : !!nullCheckIsPost,
				handler: handler
			};
			return true;
		} else {
			logErrorTrace('handler must be a function');
			return false;
		}
	}
	// static get(name) {
	// 	if(TypeStore.has(name)) {
	// 		return TypeStore.#store[name];
	// 	}
	// 	return null;
	// }
	static getNcp(name) {
		if(TypeStore.has(name)) {
			return TypeStore.#store[name].ncp ?? true;
		}
		return null;
	}
	static check(name, value) {
		if(!TypeStore.has(name)) {
			return [false, `Unknown type '${name}'`];
		}
		const handler = TypeStore.#store[name].handler;
		if(typeof handler !== 'function') {
			return [false, `Handler for type '${name}' not found`];
		}
		const v = handler(value);
		if(!Array.isArray(v)) {
			return [false, `Handler for type '${name}' returned incompatible value`];
		}
		const [valid = false, val = null] = v;
		return [valid, val];
	}
	static multiCheck(value, ...types) {
		for(let t of types) {
			const [valid, val] = TypeStore.check(t, value);
			if(valid) {
				return [valid, val];
			}
		}
		return [false, `Expected: ${types.join('|')}; Received: ${JSON.stringify(value)}`];
	}
	static checkNull(value) {
		const [valid,] = TypeStore.check('null', value);
		return valid;
	}
}
class RngFmtStore {
	static #store = {
		'num_range': class {
			static isStatic = false;
			#min;
			#max;
			setup(...args) {
				const nullableFloat = value => TypeStore.multiCheck(value, 'null', 'float');
				let validMin, validMax;
				[validMin, this.#min] = nullableFloat(args[0] ?? null);
				[validMax, this.#max] = nullableFloat(args[1] ?? null);
				if(
					!validMin ||
					!validMax ||
					(this.#min === null && this.#max === null) ||
					(this.#min !== null && this.#max !== null && this.#min > this.#max)
				) {
					this.#min = null;
					this.#max = null;
					return 'Invalid NumRange range values';
				}
				return true;
			}
			exec(value) {
				if(Number.isNaN(value)) {
					return [false, 'NumRange expects a numeric value'];
				}
				if(
					(this.#min !== null && value < this.#min) ||
					(this.#max !== null && value > this.#max)
				) {
					return [false, `Expected range [${this.#min ?? 'null'}, ${this.#max ?? 'null'}]`];
				}
				return [true, value];
			}
		},
		'str_range': class {
			static isStatic = false;
			#min;
			#max;
			setup(...args) {
				const nullableUnsigned = value => TypeStore.multiCheck(value, 'null', 'unsigned');
				let validMin, validMax;
				[validMin, this.#min] = nullableUnsigned(args[0] ?? null);
				[validMax, this.#max] = nullableUnsigned(args[1] ?? null);
				if(
					!validMin ||
					!validMax ||
					(this.#min === null && this.#max === null) ||
					(this.#min !== null && this.#max !== null && this.#min > this.#max)
				) {
					this.#min = null;
					this.#max = null;
					return 'Invalid StrRange range values';
				}
				return true;
			}
			exec(value) {
				if(typeof value !== 'string' && !(value instanceof String)) {
					return [false, 'StrRange expects a string value'];
				}
				const len = value.length;
				if(
					(this.#min !== null && len < this.#min) ||
					(this.#max !== null && len > this.#max)
				) {
					return [false, `Expected strlen [${this.#min ?? 'null'}, ${this.#max ?? 'null'}]`];
				}
				return [true, value];
			}
		},
		'str_lower': class {
			static isStatic = true;
			static exec(value) {
				if(typeof value !== 'string' && !(value instanceof String)) {
					return [false, 'StrLower expects a string value'];
				}
				return [true, value.toLowerCase()];
			}
		},
		'str_upper': class {
			static isStatic = true;
			static exec(value) {
				if(typeof value !== 'string' && !(value instanceof String)) {
					return [false, 'StrUpper expects a string value'];
				}
				return [true, value.toUpperCase()];
			}
		},
		'str_title': class {
			static isStatic = true;
			static toTitleCase(value) {
				return value.replace(/\w\S*/g, txt => `${txt.charAt(0).toUpperCase()}${txt.substr(1).toLowerCase()}`);
			}
			static exec(value) {
				if(typeof value !== 'string' && !(value instanceof String)) {
					return [false, 'StrTitle expects a string value'];
				}
				return [true, this.toTitleCase(value)];
			}
		},
		'to_str': class {
			static isStatic = true;
			static exec(value) {
				if(typeof value === 'symbol') {
					return [true, value.toString()];
				}
				return [true, String(value)];
			}
		}
	};
	static add(name, handlerClass) {
		if(typeof name !== 'string') {
			logErrorTrace('Type name must be a string');
			return false;
		}
		if(typeof handlerClass === 'function') {
			TypeStore.#store[name] = handlerClass;
			return true;
		} else {
			logErrorTrace('handler must be a function');
			return false;
		}
	}
	static has(name) {
		return RngFmtStore.#store.hasOwnProperty(name);
	}
	static gen(nameAndArgs) {
		if(typeof nameAndArgs !== 'string') {
			return `Invalid ranger-formatter expression; ${nameAndArgs}`;
		}
		let name, args = [];
		if(nameAndArgs.slice(-1) === ')') {
			const idx = nameAndArgs.indexOf('(');
			if(idx === -1) {
				return `Invalid ranger-formatter expression; ${nameAndArgs}`;
			}
			try {
				name = nameAndArgs.slice(0, idx);
				args = nameAndArgs.slice(idx + 1, -1).split(',');	
			} catch (error) {
				return `Invalid ranger-formatter expression; ${nameAndArgs}`;
			}
		} else {
			name = nameAndArgs;
		}
		if(!RngFmtStore.has(name)) {
			return `Unknown ranger-formatter: ${name}`;
		}
		let obj;
		if(typeof RngFmtStore.#store[name].isStatic === 'boolean' && RngFmtStore.#store[name].isStatic === true) {
			obj = RngFmtStore.#store[name];
		} else {
			obj = new RngFmtStore.#store[name]();
		}
		if(typeof obj.exec !== "function") {
			return `Ranger-formatter '${name}' has invalid interface`;
		}
		if(typeof obj.setup === "function") {
			const setupstate =  obj.setup(...args);
			if(setupstate !== true) {
				return setupstate;
			}
		}
		return obj;
	}
}
class ErrorManager {
	#errStore = [];
	get hasErrors() {
		return this.#errStore.length > 0;
	}
	get errors() {
		return (this.#errStore.length === 0) ? null : this.#errStore;
	}
	set errors(value) {
		if(value === null) {
			this.#errStore = [];
		} else {
			if(isObject(value)) {
				const {prefix = null, msg= null} = value;
					this.#errStore.push({
						prefix: prefix ?? [],
						msg: msg
					})
			} else {
				this.#errStore.push({
					prefix: [],
					msg: `${value}`
				});
			}
		}
	}
	static makePrefix(prefix) {
		prefix = prefix ?? [];
		if(!Array.isArray(prefix)) {
			prefix = [prefix];
		}
		if(prefix.length === 0) {
			return '';
		}
		return `${prefix.map(p=>`[${p}]`).join('')}: `;
	}
	get errorString() {
		return this.errors?.map(e => `${ErrorManager.makePrefix(e.prefix)}${e.msg}`).join('\n') ?? 'null';
	}
	__inheritErrors__(source, prefix = null) {
		const errors = source.errors;
		if(errors === null) {
			return;
		}
		for(let e of errors) {
			if(prefix !== null) {
				if(Array.isArray(prefix)) {
					e.prefix = [...prefix, ...e.prefix];
				} else {
					e.prefix = [prefix, ...e.prefix];
				}
			}
			this.errors = e;
		}
		source.errors = null;
	}
}
class DataValidator extends ErrorManager {
	#handler = null;
	constructor(struct) {
		super();
		let handler = null;
		if(Array.isArray(struct)) {
			handler = new ArrayHandler(struct);
		} else if(isObject(struct)) {
			handler = new ObjectHandler(struct);
		}
		if(handler === null) {
			this.errors = 'Invalid structure';
			return;
		}
		if(handler.hasErrors) {
			this.__inheritErrors__(handler);
			return;
		}
		this.#handler = handler;
	}
	validate(value) {
		this.errors = null;
		if(this.#handler === null) {
			this.errors = `Validator has not been initialised`;
			return null;
		}
		const val = this.#handler.validate(value);
		if(this.#handler.hasErrors) {
			this.__inheritErrors__(this.#handler);
			return null;
		}
		return val;
	}
	static addType(name, handler, nullCheckIsPost = true) {
		return TypeStore.add(name, handler, nullCheckIsPost);
	}
	static addRngFmt(name, handlerClass) {
		return RngFmtStore.add(name, handlerClass);
	}
}

class ObjectHandler extends ErrorManager {
	static #key_parser(k) {
		return ((k[0] ?? '') === '?') ? [k.substring(1), true] : [k, false];
	}
	#info = null;
	constructor(struct) {
		super();
		// if(!isObject(struct)) {
		// 	this.errors = `Expected: object; Received: ${JSON.stringify(struct)}`;
		// 	return;
		// }
		const info = {};
		for(let objkey of Object.keys(struct)) {
			const [key, opt] = ObjectHandler.#key_parser(objkey);
			let handler = null;
			const item = struct[objkey];
			if(typeof item  === "string") {
				handler = new TypeHandler(item);
			} else if(isObject(item)) {
				handler = new ObjectHandler(item);
			} else if(Array.isArray(item)) {
				handler = new ArrayHandler(item);
			} else {
				this.errors = `Invalid value; {${item}}`;
			}
			if(handler !== null) {
				if(handler.hasErrors) {
					this.__inheritErrors__(handler, key);
					continue;
				}
				info[key] = {
					handler: handler,
					opt: opt
				};
			}
		}
		if(!this.hasErrors) {
			this.#info = info;
		}
	}
	validate(value) {
		this.errors = null;
		if(this.#info === null) {
			this.errors = `Validator has not been initialised`;
			return null;
		}
		if(!isObject(value)) {
			this.errors = `Expected: object; Received: ${JSON.stringify(value)}`;
			return null;
		}
		const ret = {}, skeys = Object.keys(this.#info), ikeys = new Set(Object.keys(value));
		for(let k of skeys) {
			const {handler, opt} = this.#info[k];
			if(ikeys.has(k)) {
				ikeys.delete(k);
				const val = handler.validate(value[k]);
				if(handler.hasErrors) {
					this.__inheritErrors__(handler, k);
				} else {
					ret[k] = val;
				}
			} else if(opt) {
				continue;
			} else {
				this.errors = {
					prefix: k,
					msg: 'Missing'
				};
			}
		}
		if(ikeys.size > 0) {
			for(let k of Array.from(ikeys)) {
				this.errors = {
					prefix: k,
					msg: 'Out of bound'
				};
			}
		}
		if(this.hasErrors) {
			return null;
		}
		return ret;
	}
}

class ArrayHandler extends ErrorManager {
	#single;
	#list = null;
	constructor(struct, prefix) {
		super();
		// if(!Array.isArray(struct)) {
		// 	this.errors = `Expected: array; Received: ${JSON.stringify(struct)}`;
		// 	return;
		// }
		if(struct.length === 0) {
			struct = ['any'];
		}
		this.#single = struct.length === 1;
		const list = [];
		let i = -1;
		for(let item of struct) {
			i++;
			let handler = null;
			if(typeof item  === "string") {
				handler = new TypeHandler(item);
			} else if(isObject(item)) {
				handler = new ObjectHandler(item);
			} else if(Array.isArray(item)) {
				handler = new ArrayHandler(item);
			} else {
				this.errors = `Invalid value; {${item}}`;
			}
			if(handler !== null) {
				if(handler.hasErrors) {
					this.__inheritErrors__(handler, i);
					continue;
				}
				list.push(handler);
			}
		}
		if(!this.hasErrors) {
			this.#list = list;
		}
	}
	validate(value) {
		this.errors = null;
		if(this.#list === null) {
			this.errors = `Validator has not been initialised`;
			return null;
		}
		if(!Array.isArray(value)) {
			this.errors = `Expected: array; Received: ${JSON.stringify(value)}`;
			return null;
		}
		const ret = [];
		for(let i in value) {
			let item = value[i];
			const handler = this.#list[this.#single ? 0 : i] ?? false;
			if(handler === false) {
				this.errors = {
					prefix: i,
					msg: 'Out of bound'
				};
				continue;
			}
			item = handler.validate(item);
			if(handler.hasErrors) {
				this.__inheritErrors__(handler, i);
			} else {
				ret[i] = item;
				// ret.push(item);
			}
		}
		if(this.hasErrors) {
			return null;
		}
		return ret;
	}
}

class TypeHandler extends ErrorManager {
	#handlers = null;
	#nullable;
	#rng_fmt;
	#expected;
	constructor(struct) {
		super();
		this.#rng_fmt = struct.split('@');
		let types = new Set(this.#rng_fmt.shift().split('|'));
		types.delete('');
		this.#nullable = types.delete('null');
		this.#expected = Array.from(types);
		if(this.#nullable) {
			this.#expected.push('null');
		}
		this.#expected = `Expected type: ${this.#expected.join('|')}`;
		types = (types.size > 0) ? Array.from(types) : (this.#nullable ? ['null'] : []);
		if(types.length === 0) {
			this.errors = 'Type is missing';
			return;
		}
		if(this.#rng_fmt.length === 0) {
			this.#rng_fmt = null;
		} else {
			this.#rng_fmt = this.#rng_fmt.map(rf => {
				const obj = RngFmtStore.gen(rf);
				if(typeof obj === 'string') {
					this.errors = obj;
					return rf;
				}
				return obj;
			});
		}
		this.#handlers = [];
		for(let ty of types) {
			if(TypeStore.has(ty)) {
				this.#handlers.push(ty);
			} else {
				this.errors = `Unknown type '${ty}'`;
			}
		}
		if(this.hasErrors) {
			this.#handlers = null;
		}
	}
	validate(value) {
		if(this.#handlers === null) {
			this.errors = `Validator has not been initialised`;
			return null;
		}
		let valid, val;
		for(let ty of this.#handlers) {
			const ncp = TypeStore.getNcp(ty);
			if(this.#nullable && !ncp && TypeStore.checkNull(value)) {
				valid = true, val = null;
				break;
			}
			[valid, val] = TypeStore.check(ty, value);
			if(valid) {
				break;
			}
			if(this.#nullable && ncp && TypeStore.checkNull(value)) {
				valid = false, val = null;
				break;
			}
		}
		if(valid && this.#rng_fmt !== null) {
			for(let rf of this.#rng_fmt) {
				[valid, val] = rf.exec(val);
				if(!valid) {
					this.errors = val;
					return null;
				}
			}
		}
		if(valid) {
			return val;
		}
		this.errors = `${this.#expected}; Received: ${JSON.stringify(value)}`;
		return null;
	}
}
export {DataValidator, logErrorTrace, TypeStore, RngFmtStore};