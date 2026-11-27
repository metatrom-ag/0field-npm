// @ts-self-types="./0field.d.ts"
//#region dependencies/metatrom-ag/Manu/main/SmartObject.ts
const habitat = globalThis;
const Substrate = habitat.HTMLElement ?? class {};
/**
* The class above, its model's keys typed as its fields: exported as `SmartObject`, which every SmartObject extends,
* while the class keeps the name the Descriptor's Generator recognises; a class generic over its model extends
* {@link SmartObject.Class}, so its subclasses' keys read as fields without their types. A rule over a key
* is the class's own accessor pair: `get key() { return super.key }` beside a setter that calls `super.key = value`, as
* a setter alone hides the read.
*/
const TypedSmartObject = class SmartObject extends Substrate {
	#model;
	static #below = Object.getPrototypeOf(SmartObject.prototype);
	static {
		Object.setPrototypeOf(SmartObject.prototype, new Proxy(Object.create(SmartObject.#below), {
			get: (below, key, receiver) => SmartObject.#holds(receiver, key) ? SmartObject.#view(() => receiver.#model[key], (value) => receiver[key] = value) : Reflect.get(below, key, receiver),
			set: (below, key, value, receiver) => {
				if (typeof key !== "string" || key in below || !(#model in receiver) || !SmartObject.#isRecord(receiver.#model)) return Reflect.set(below, key, value, receiver);
				if (key.startsWith("@")) throw new TypeError(`${receiver.constructor.name}'s ${key} is written only by its class, through update`);
				SmartObject.#replace(receiver, SmartObject.#checked({
					...receiver.#model,
					[key]: value
				}));
				return true;
			}
		}));
	}
	static #loaded = /* @__PURE__ */ new WeakMap();
	#observers = /* @__PURE__ */ new Set();
	/**
	* The class itself, without its model's keys as fields: what a class generic over its model extends,
	* `class JsonObject<M> extends SmartObject.Class<M>`, as its fields are known only once its model is. Typed as
	* SmartObject's class, so a typed export extended this way declares its own, as View's does.
	*/
	static get Class() {
		return this;
	}
	/** Has `by` observe each change to `object`'s model, for as long as anything else holds `by`; a view calls it as it shows `object`. */
	static observe(object, by) {
		object.#observers.add(new WeakRef(by));
	}
	/** Has `by` observe no more of `object`'s changes; a view calls it as it shows another. */
	static unobserve(object, by) {
		for (const each of object.#observers) if (each.deref() === by) object.#observers.delete(each);
	}
	/**
	* Takes `key` out of `object`'s model, telling its observers, where the model holds it: a removal said as one, as a
	* key written `undefined` is refused. Refused for a JSON-LD keyword, which only the class writes, and where the model
	* is no record.
	*/
	static remove(object, key) {
		if (key.startsWith("@")) throw new TypeError(`${object.constructor.name}'s ${key} is written only by its class, through update`);
		const model = object.#model;
		if (!SmartObject.#isRecord(model)) throw new TypeError(`${object.constructor.name}'s model is no record, so it holds no key ${key}`);
		if (!Object.hasOwn(model, key)) return;
		const { [key]: _removed, ...rest } = model;
		SmartObject.#replace(object, SmartObject.#checked(rest));
	}
	/**
	* Records the namespace and version a class was loaded from, so in a browser it registers as
	* `<namespace>.<class>-<version>`; a class no loader recorded registers as `<class>-0.0.0`.
	* Refused for a class already recorded, and for one already registered, as its name is then given.
	*/
	static loaded(type, from) {
		const recorded = SmartObject.#loaded.get(type);
		if (recorded !== void 0) throw new Error(`${type.name} is already recorded as loaded from ${recorded.namespace} ${recorded.version}`);
		const registered = habitat.customElements?.getName(type) ?? null;
		if (registered !== null) throw new Error(`${type.name} is already registered as ${registered}, too late to record where it was loaded from`);
		SmartObject.#loaded.set(type, from);
	}
	/**
	* Takes the model; without one it holds `{}`, where the model's type allows it. In a browser
	* it first registers its class with `customElements`, refusing a name another class holds.
	*/
	constructor(...given) {
		if (habitat.customElements !== void 0) SmartObject.#register(habitat.customElements, new.target);
		super();
		this.#model = SmartObject.#checked(given.length === 0 ? {} : given[0]);
	}
	/** The model, frozen, apart from the object it was given as; a change replaces it through {@link SmartObject.update} or a field, checked as the first. */
	get model() {
		return this.#model;
	}
	/** Replaces the model, checked and frozen like the first. */
	update(model) {
		SmartObject.#replace(this, SmartObject.#checked(model));
	}
	/** Does nothing, until a SmartObject overrides it. */
	start() {}
	/** Does nothing, until a SmartObject overrides it. */
	stop() {}
	/** Does nothing, until a SmartObject overrides it. */
	restored() {}
	/** Does nothing, until a SmartObject overrides it. */
	connected() {}
	/** Does nothing, until a SmartObject overrides it. */
	disconnected() {}
	/** Called by the browser as this element enters a document. */
	connectedCallback() {
		this.connected();
	}
	/** Called by the browser as this element leaves a document. */
	disconnectedCallback() {
		this.disconnected();
	}
	static #register(registry, type) {
		if (registry.getName(type) !== null) return;
		const { namespace, version } = SmartObject.#loaded.get(type) ?? {
			namespace: void 0,
			version: "0.0.0"
		};
		const kebab = type.name.replace(/([a-z0-9])([A-Z])|([A-Z])([A-Z][a-z])/g, "$1$3-$2$4").toLowerCase();
		const name = `${namespace === void 0 ? "" : `${namespace}.`}${kebab}-${version}`;
		const holder = registry.get(name);
		if (holder !== void 0) throw new Error(`${name} is held by the class ${holder.name}, so ${type.name} cannot register under it`);
		registry.define(name, type);
	}
	static #replace(object, model) {
		const before = object.#model;
		object.#model = model;
		const keys = SmartObject.#changed(before, model);
		if (keys.length === 0) return;
		const thrown = [];
		for (const each of object.#observers) {
			const by = each.deref();
			if (by === void 0) object.#observers.delete(each);
			else try {
				by.changed(keys);
			} catch (error) {
				thrown.push(error);
			}
		}
		if (thrown.length > 0) throw new AggregateError(thrown, `${thrown.length} of ${object.constructor.name}'s observers failed on its change to ${keys.join(", ")}; the change stands`);
	}
	static #changed(before, after) {
		if (!SmartObject.#isRecord(before) || !SmartObject.#isRecord(after)) return JSON.stringify(before) === JSON.stringify(after) ? [] : [""];
		return [.../* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(after)])].filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
	}
	static #checked(model) {
		if (!SmartObject.#isSerializable(model)) throw new TypeError("a SmartObject model holds only JSON data");
		return SmartObject.#frozen(JSON.parse(JSON.stringify(model)));
	}
	static #isRecord(model) {
		return typeof model === "object" && model !== null && !Array.isArray(model);
	}
	static #holds(receiver, key) {
		return typeof key === "string" && !key.startsWith("@") && !(key in SmartObject.#below) && #model in receiver && SmartObject.#isRecord(receiver.#model) && Object.hasOwn(receiver.#model, key);
	}
	static #view(read, write) {
		const value = read();
		if (typeof value !== "object" || value === null) return value;
		const at = (key) => read()[key];
		const view = new Proxy(Array.isArray(value) ? [] : {}, {
			get: (_, key) => {
				const current = read();
				if (typeof key === "string" && Object.hasOwn(current, key)) return SmartObject.#view(() => at(key), (inner) => write(SmartObject.#with(read(), key, inner)));
				if (Array.isArray(current) && typeof key === "string" && SmartObject.#changing.has(key)) return (...given) => {
					const copy = [...current];
					const returned = copy[key](...given);
					write(copy);
					return returned === copy ? view : returned;
				};
				return Reflect.get(current, key);
			},
			set: (_, key, inner) => (write(SmartObject.#with(read(), key, inner)), true),
			deleteProperty: (_, key) => (write(SmartObject.#with(read(), key, void 0)), true),
			has: (_, key) => Reflect.has(read(), key),
			ownKeys: () => Reflect.ownKeys(read()),
			getOwnPropertyDescriptor: (target, key) => {
				const descriptor = Reflect.getOwnPropertyDescriptor(read(), key);
				return descriptor && {
					...descriptor,
					writable: true,
					configurable: !(Array.isArray(target) && key === "length")
				};
			}
		});
		return view;
	}
	static #changing = /* @__PURE__ */ new Set([
		"copyWithin",
		"fill",
		"pop",
		"push",
		"reverse",
		"shift",
		"sort",
		"splice",
		"unshift"
	]);
	static #with(value, key, inner) {
		if (Array.isArray(value)) {
			const copy = [...value];
			Reflect.set(copy, key, inner);
			return copy;
		}
		const { [key]: _, ...rest } = value;
		return inner === void 0 ? rest : {
			...rest,
			[key]: inner
		};
	}
	static #isSerializable(value) {
		if (value === null || typeof value === "boolean" || typeof value === "string") return true;
		if (typeof value === "number") return Number.isFinite(value) && !Object.is(value, -0);
		if (Array.isArray(value)) return value.every(SmartObject.#isSerializable);
		if (typeof value !== "object") return false;
		const prototype = Object.getPrototypeOf(value);
		if (prototype !== Object.prototype && prototype !== null) return false;
		return Object.values(value).every(SmartObject.#isSerializable);
	}
	static #frozen(value) {
		if (typeof value === "object" && value !== null) Object.values(value).forEach(SmartObject.#frozen);
		return Object.freeze(value);
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/loading/Program.ts
/**
* Purpose: be one program a realm runs, so whoever started it can await
* its start, find it from its SmartObject, and stop it.
*
* Intention: the kernels make one for each program their realm was started
* with, and `OField` one more for each it runs beside them;
* `OField` hands it out and names it for its SmartObject.
*/
var Program = class extends TypedSmartObject {
	#running;
	#finished = Promise.withResolvers();
	/**
	* Over the file it runs, the words it is given, where its habitat shows what it runs, where it names a place, and the
	* file of the view it shows it in, where it names one.
	*/
	constructor(model) {
		super(model);
		this.#finished.promise.catch(() => {});
	}
	/** The SmartObject it runs, once it has begun; none before. */
	get smartObject() {
		return this.#running?.smartObject;
	}
	/**
	* The words its SmartObject hears: every word given where its file names its model, otherwise those after the
	* model's address; none before it has begun.
	*/
	get heard() {
		return this.#running?.heard ?? [];
	}
	/** Settles once the start of the SmartObject it runs has finished, failing as that start fails. */
	get finished() {
		return this.#finished.promise;
	}
	/** Runs a SmartObject as this program, hearing the words given: starts it, {@link Program.finished} settling with that start. Refused once it runs one. */
	begin(smartObject, heard) {
		if (this.#running !== void 0) throw new Error(`${this.model.address} runs already`);
		this.#running = {
			smartObject,
			heard
		};
		Promise.resolve().then(() => smartObject.start()).then(this.#finished.resolve, this.#finished.reject);
	}
	/** Stops the SmartObject it runs; nothing before it has begun. */
	async stop() {
		await this.#running?.smartObject.stop();
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/file-system/Folder.ts
/** Whether an {@link Entry} is a {@link Folder} — by the member only a `Folder` declares. */
function isFolder(entry) {
	return "entries" in entry;
}
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/file-system/git/GitConfig.ts
/**
* Purpose: make a Git config file's sections and values available as a model.
*
* Intention: {@link GitModules} and {@link GitRepository} use it to read
* `.gitmodules` and `.git/config`; callers can limit which sections and keys
* it accepts.
*/
var GitConfig = class GitConfig extends TypedSmartObject {
	/**
	* Reads Git config sections and keys into a model. A missing file gives an empty model. Throws for invalid UTF-8,
	* malformed syntax, or sections and keys rejected by `refuses`.
	*/
	constructor(file, refuses = () => void 0) {
		super(file.exists ? GitConfig.#read(file, refuses) : {});
	}
	static #read(file, refuses) {
		const bytes = file.read();
		let text;
		try {
			text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
		} catch (error) {
			throw new Error(`not UTF-8: ${file.path}`, { cause: error });
		}
		const sections = /* @__PURE__ */ new Map();
		let named;
		let section;
		const lines = text.split(/\r?\n/);
		for (let index = 0; index < lines.length; index++) {
			const at = index + 1;
			const refuse = (fault) => /* @__PURE__ */ new Error(`${fault}, ${file.path}:${at}: ${lines[index].slice(0, 80)}`);
			const line = lines[index].replace(/^\s+/, "");
			if (line === "" || line.startsWith("#") || line.startsWith(";")) continue;
			if (line.startsWith("[")) {
				const header = /^\[([A-Za-z0-9.-]+)(?:\s+"((?:[^"\\\n]|\\.)*)")?\]\s*(?:[#;].*)?$/.exec(line);
				if (header === null) throw refuse(refuses(void 0) ?? "no section git reads");
				named = {
					name: header[1].toLowerCase(),
					...header[2] === void 0 ? {} : { subsection: header[2].replace(/\\(.)/g, "$1") }
				};
				const fault = refuses(named);
				if (fault !== void 0) throw refuse(fault);
				const key = named.subsection === void 0 ? named.name : `${named.name}.${named.subsection}`;
				section = sections.get(key) ?? /* @__PURE__ */ new Map();
				sections.set(key, section);
				continue;
			}
			const entry = /^([A-Za-z][A-Za-z0-9-]*)\s*(=?)(.*)$/.exec(line);
			if (entry === null) throw refuse(`not a line of ${file.name}`);
			const fault = refuses(named, entry[1]);
			if (fault !== void 0) throw refuse(fault);
			if (section === void 0) throw refuse("a key before any section");
			const key = entry[1].toLowerCase();
			if (entry[2] === "") {
				if (entry[3].trim() !== "" && !/^\s*[#;]/.test(entry[3])) throw refuse(`not a line of ${file.name}`);
				section.set(key, "true");
				continue;
			}
			let raw = entry[3];
			while (/(^|[^\\])(\\\\)*\\$/.test(raw) && index + 1 < lines.length) raw = raw.slice(0, -1) + lines[++index];
			const value = GitConfig.#value(raw);
			if (value === void 0) throw refuse("not a value git reads");
			section.set(key, value);
		}
		return Object.fromEntries([...sections].map(([name, keys]) => [name, Object.fromEntries(keys)]));
	}
	static #value(raw) {
		let value = "";
		let kept = 0;
		let quoted = false;
		const text = raw.replace(/^\s+/, "");
		for (let index = 0; index < text.length; index++) {
			const char = text[index];
			if (char === "\\") {
				const escaped = ESCAPES.get(text[++index]);
				if (escaped === void 0) return void 0;
				value += escaped;
				kept = value.length;
			} else if (char === "\"") {
				quoted = !quoted;
				kept = value.length;
			} else if (!quoted && (char === "#" || char === ";")) break;
			else {
				value += char;
				if (quoted || !/\s/.test(char)) kept = value.length;
			}
		}
		return quoted ? void 0 : value.slice(0, kept);
	}
};
const ESCAPES = /* @__PURE__ */ new Map([
	["\\", "\\"],
	["\"", "\""],
	["n", "\n"],
	["t", "	"],
	["b", "\b"]
]);
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/file-system/git/GitModules.ts
/**
* Purpose: keep what a tree's `.gitmodules` says it takes from other trees.
*
* Intention: git's own file, read as {@link GitConfig}; a `Workbench`
* asks it which dependency sits at which path.
*/
var GitModules = class extends TypedSmartObject {
	/**
	* Reads `.gitmodules` from a file into a model of each submodule's keys, as gitmodules(5) names them; a missing one
	* holds no submodule. A section that is no submodule's, a key a submodule cannot have, and a line git would not read
	* are refused, naming the file and the line; so is a file that is not UTF-8.
	*/
	constructor(file) {
		const sections = new GitConfig(file, submodules).model;
		super(Object.fromEntries(Object.entries(sections).map(([section, keys]) => [section.slice(10), Object.fromEntries(Object.entries(keys).map(([key, value]) => [KEYS.get(key), value]))])));
	}
	/** The path of each submodule that names one. */
	get paths() {
		return Object.values(this.model).flatMap((submodule) => submodule.path === void 0 ? [] : [submodule.path]);
	}
};
const KEYS = new Map([
	"path",
	"url",
	"branch",
	"update",
	"fetchRecurseSubmodules",
	"ignore",
	"shallow"
].map((key) => [key.toLowerCase(), key]));
const submodules = (section, key) => {
	if (key === void 0) return section?.name === "submodule" && section.subsection !== void 0 ? void 0 : "no submodule section";
	if (section === void 0) return "a key before any submodule";
	return KEYS.has(key.toLowerCase()) ? void 0 : `no key a submodule has: ${key}`;
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/file-system/git/GitRepository.ts
/**
* Purpose: read what git keeps for one working tree.
*
* Intention: reads git's own layout, as its documentation describes it,
* and the common dir's config as {@link GitConfig}. It uses the
* {@link Folder} it sits in, which a subclass kept apart from any tree may lack.
*/
var GitRepository = class extends TypedSmartObject.Class {
	#folder;
	/**
	* The working tree at a folder; its model holds the folder's path, unless a subclass's holds more. Without a folder
	* — a subclass's model stored apart from any tree — it is given its model.
	*/
	constructor(folder, model = { path: folder.path }) {
		super(model);
		this.#folder = folder;
	}
	/** The folder of the working tree; refused where this one has none on this host. */
	get folder() {
		if (this.#folder === void 0) throw new Error("no working tree on this host");
		return this.#folder;
	}
	/** The path of the working tree's folder. */
	get path() {
		return this.folder.path;
	}
	/** The branch checked out here, or the sha where its HEAD is detached; none without a HEAD. */
	get head() {
		const head = this.gitDir?.file("HEAD");
		if (head === void 0 || !head.exists) return void 0;
		const text = head.readText().trim();
		return text.startsWith("ref: refs/heads/") ? text.slice(16) : text;
	}
	/** The git dir a `.git` file names, as git wrote it; none where `.git` is a folder or missing. */
	get pointer() {
		const pointer = this.folder.file(".git");
		return pointer.exists ? /^gitdir:\s*(.+)$/m.exec(pointer.readText())?.[1].trim() : void 0;
	}
	/** The URL of a remote, as the common dir's config names it; none where it names none. */
	remote(name) {
		const git = this.commonDir;
		return git === void 0 ? void 0 : new GitConfig(git.file("config")).model[`remote.${name}`]?.url;
	}
	/**
	* The worktrees the common dir keeps a record of — `<common dir>/worktrees/<name>/gitdir` — each by its record's name
	* and the path git wrote for it, its `/.git` dropped.
	*/
	get worktrees() {
		const records = this.commonDir?.folder("worktrees");
		if (records === void 0) return [];
		return records.entries.flatMap((record) => isFolder(record) && record.file("gitdir").exists ? [{
			name: record.name,
			path: record.file("gitdir").readText().trim().replace(/\/\.git$/, "")
		}] : []);
	}
	/** The common dir, which a worktree's git dir names in `commondir`, and is the git dir itself elsewhere; none without one. */
	get commonDir() {
		const gitDir = this.gitDir;
		if (gitDir === void 0) return void 0;
		const common = gitDir.file("commondir");
		return common.exists ? this.#at(common.readText().trim(), gitDir) : gitDir;
	}
	/** The git dir: `.git` itself where it is a folder, the one a `.git` file names, none where there is neither. */
	get gitDir() {
		if (this.folder.folder(".git").exists) return this.folder.folder(".git");
		const named = this.pointer;
		return named === void 0 ? void 0 : this.#at(named, this.folder);
	}
	#at(path, from) {
		const absolute = path.startsWith("/") || /^[A-Za-z]:\//.test(path) ? path : `${from.path}/${path}`;
		const names = [];
		for (const name of absolute.split("/")) {
			if (name === "" || name === ".") continue;
			if (name === "..") names.pop();
			else names.push(name);
		}
		return this.folder.at(/^[A-Za-z]:$/.test(names[0] ?? "") ? names.join("/") : `/${names.join("/")}`);
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/0field/Releases.ts
/**
* Purpose: decide which of a thing's versions or tags a ref names: its
* latest release, or the highest release within a range.
*
* Intention: the oField hook asks it over the names a workbench's `Tags` hold, the npm
* hook over a package's version folders, and `OFieldIri` reads the ranges a
* ref may name from it. It reads a version by SemVer 2.0, a range as npm
* does.
*/
var Releases = class Releases extends TypedSmartObject {
	/** A range a ref may name: `^X[.Y[.Z]]` or `~X.Y[.Z]`, its parts without leading zeros and at most 15 digits. */
	static range = /^(?:\^(0|[1-9]\d{0,14})(?:\.(0|[1-9]\d{0,14})(?:\.(0|[1-9]\d{0,14}))?)?|~(0|[1-9]\d{0,14})\.(0|[1-9]\d{0,14})(?:\.(0|[1-9]\d{0,14}))?)$/;
	/**
	* The highest stable one — `X.Y.Z` or `vX.Y.Z`, each part at most 15 digits, by SemVer 2.0 precedence, as named; a
	* pre-release or any other tag never is.
	*/
	get latest() {
		return this.#highest();
	}
	/**
	* The tag or sha a ref names: the latest release for none or `latest`, the highest within a range for one, the ref
	* itself otherwise; none where no release is there to name.
	*/
	named(ref) {
		if (ref === void 0 || ref === "latest") return this.latest;
		return Releases.range.test(ref) ? this.within(ref) : ref;
	}
	/**
	* The highest stable one within a range, as named — `^X[.Y[.Z]]` up to the next change of its first part that is
	* not zero, or of its last given part where all are zero; `~X.Y[.Z]` up to the next minor. None where none is
	* within it; refused where the range is none of these.
	*/
	within(range) {
		return this.#highest(Releases.#bounds(range));
	}
	#highest(bounds) {
		let highest;
		for (const tag of this.model) {
			const match = STABLE.exec(tag);
			if (match === null) continue;
			const version = match.slice(1).map(Number);
			if (bounds !== void 0 && (Releases.#higher(bounds[0], version) || !Releases.#higher(bounds[1], version))) continue;
			if (highest === void 0 || Releases.#higher(version, highest.version)) highest = {
				tag,
				version
			};
		}
		return highest?.tag;
	}
	static #bounds(range) {
		const match = Releases.range.exec(range);
		if (match === null) throw new Error(`no range: ${range}, but ^X[.Y[.Z]] or ~X.Y[.Z]`);
		const caret = match[1] !== void 0;
		const given = (caret ? match.slice(1, 4) : match.slice(4, 7)).filter((part) => part !== void 0).map(Number);
		const lower = [
			0,
			1,
			2
		].map((index) => given[index] ?? 0);
		const nonZero = given.findIndex((part) => part !== 0);
		const moves = caret ? nonZero === -1 ? given.length - 1 : nonZero : 1;
		return [lower, lower.map((part, index) => index < moves ? part : index === moves ? part + 1 : 0)];
	}
	static #higher(version, than) {
		const at = version.findIndex((part, index) => part !== than[index]);
		return at !== -1 && version[at] > than[at];
	}
};
const STABLE = /^v?(0|[1-9]\d{0,14})\.(0|[1-9]\d{0,14})\.(0|[1-9]\d{0,14})$/;
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/0field/OFieldIri.ts
/**
* Purpose: identify a SmartObject, or a version of it, the same way wherever
* it is stored.
*
* Intention: realizes the IRI of a JSON-LD node's `@id` and `@type`; each
* graph resolves it to its own address, such as a path, a hash or a CID.
*/
var OFieldIri = class OFieldIri extends TypedSmartObject {
	/** Parses an oField IRI, or takes its parts; refuses either when it is not one, naming the fault. */
	constructor(uri) {
		super(typeof uri === "string" ? parts(uri) : uri);
		this.#refuseUnlessCanonical(uri);
	}
	/**
	* The oField IRI an IRI is; none where it is no oField IRI, or none in canonical form. An IRI of the scheme `oasis:`,
	* the one before `ofield:`, is refused, naming `ofield://`.
	*/
	static of(iri) {
		OFieldIri.refuseRetired(iri);
		if (!iri.startsWith(SCHEME)) return void 0;
		try {
			return new OFieldIri(iri);
		} catch {
			return;
		}
	}
	/** Refuses an address of the scheme `oasis:`, the one before `ofield:`, naming `ofield://`; any other passes. */
	static refuseRetired(address) {
		if (address.startsWith(RETIRED)) throw new TypeError(`the scheme is ofield://, not oasis://: ${address}`);
	}
	/** An IRI as it names no ref: an oField IRI without its ref, anything else — no oField IRI — as it stands. */
	static unpinned(iri) {
		const uri = OFieldIri.of(iri);
		if (uri === void 0) return iri;
		const { ref: _ref, ...rest } = uri.model;
		return new OFieldIri(rest).toString();
	}
	/**
	* Whether a ref is a data ref — under `refs/` and no branch — which holds what is stored as data, never code to run;
	* a ref read with what follows it, as a path continues it, is told apart as the ref alone.
	*/
	static isDataRef(ref) {
		return ref !== void 0 && ref.startsWith("refs/") && !ref.startsWith("refs/heads/");
	}
	/** Whether a ref pins what it names — a sha, a version or a range of versions — where any other ref names a head that moves. */
	static isPinned(ref) {
		if (ref === void 0) return false;
		return /^[0-9a-f]{40}$/.test(ref) || Releases.range.test(ref) || new Releases([ref]).latest === ref;
	}
	/**
	* The oField IRI a reference naming no scheme names, read against this one as RFC 3986 resolves it — `//`, `/`, `.`
	* and `..` as they read there — with every part kept as written, a range and what a URL would percent-encode among
	* them. A fragment is cut before it is resolved, as no oField IRI has one; no oField IRI has a query either, so a `?`
	* is part of the path. Refused, naming the fault, where it names no oField IRI in canonical form.
	*/
	resolve(reference) {
		const unfragmented = reference.split("#")[0];
		if (unfragmented === "") return this;
		if (unfragmented.startsWith("//")) {
			const root = unfragmented.indexOf("/", 2);
			return new OFieldIri(root === -1 ? `ofield:${unfragmented}` : `ofield:${unfragmented.slice(0, root)}${join(withoutDotSegments(unfragmented.slice(root).split("/").slice(1).map(plain$1)))}`);
		}
		const printed = this.toString();
		const root = printed.indexOf("/", SCHEME.length);
		if (unfragmented.startsWith("/")) return new OFieldIri(`${printed.slice(0, root)}${join(withoutDotSegments(unfragmented.split("/").slice(1).map(plain$1)))}`);
		const kept = withoutDotSegments([...[{
			text: "",
			head: true
		}, ...this.model.subpath?.split("/").map(plain$1) ?? []].slice(0, -1), ...unfragmented.split("/").map(plain$1)]);
		if (kept[0]?.head !== true) return new OFieldIri(`${printed.slice(0, root)}${join(kept)}`);
		const rest = kept.slice(1).map(({ text }) => text);
		return new OFieldIri({
			...this.model,
			subpath: rest.join("/")
		});
	}
	toString() {
		const { namespace, name, ref, subpath } = this.model;
		const from = this.#from();
		if (ref === void 0) return `${SCHEME}${from}${namespace}/${name}${subpath === void 0 ? "" : `/${subpath}`}`;
		const inside = subpath === void 0 ? ref.includes("/") ? ":" : "" : `:${subpath}`;
		return `${SCHEME}${from}${namespace}/${name}@${ref.replaceAll("%", "%25")}${inside}`;
	}
	#refuseUnlessCanonical(uri) {
		if (typeof this.model !== "object" || this.model === null) throw new TypeError("an oField URI model is an object");
		const printed = this.toString();
		if (typeof uri === "string") {
			if (printed !== uri) throw new TypeError(`not in canonical form, which is ${printed}: ${uri}`);
			return;
		}
		const again = parts(printed);
		const given = this.model;
		const differing = [.../* @__PURE__ */ new Set([...Object.keys(again), ...Object.keys(given)])].find((key) => again[key] !== given[key]);
		if (differing !== void 0) throw new TypeError(`${differing} is not a part as given: ${JSON.stringify(uri)}`);
	}
	#from() {
		const { source } = this.model;
		return source === void 0 ? "" : `${source.replaceAll("%", "%25").replaceAll("/", "%2F")}:`;
	}
};
const SCHEME = "ofield://";
const RETIRED = "oasis:";
const RANGE = /[\^~*\s]/;
function parts(uri) {
	const refuse = (fault) => {
		throw new TypeError(`${fault}: ${uri}`);
	};
	OFieldIri.refuseRetired(uri);
	if (!uri.startsWith(SCHEME)) refuse("not an oField URI");
	const rest = uri.slice(9);
	const slash = rest.indexOf("/");
	if (slash === -1) refuse("no name");
	const authority = rest.slice(0, slash);
	const colon = authority.lastIndexOf(":");
	const source = colon === -1 ? void 0 : decoded(authority.slice(0, colon), refuse);
	const namespace = authority.slice(colon + 1);
	if (source === "") refuse("empty source");
	if (namespace === "") refuse("no namespace");
	const tail = rest.slice(slash + 1);
	const scoped = namespace === "npm" && tail.startsWith("@");
	const scope = scoped ? tail.indexOf("/") : -1;
	if (scoped && scope === -1) refuse("a scope is no name");
	const ends = tail.slice(scope + 1).search(/[@/]/);
	const name = tail.slice(0, ends === -1 ? tail.length : scope + 1 + ends);
	if (name.split("/").some((segment) => segment === "" || segment === "@")) refuse("no name");
	const after = tail.slice(name.length);
	let refText;
	let path;
	if (after.startsWith("/")) path = after.slice(1);
	else if (after !== "") {
		const text = after.slice(1);
		const colon = text.indexOf(":");
		const cut = colon === -1 ? text.indexOf("/") : colon;
		refText = cut === -1 ? text : text.slice(0, cut);
		path = cut === -1 ? void 0 : text.slice(cut + 1);
		if (colon !== -1 && path === "") path = void 0;
	}
	const ref = refText === void 0 ? void 0 : decoded(refText, refuse);
	if (ref === "") refuse("empty ref");
	if (ref?.includes(":")) refuse("a git ref holds no colon");
	if (ref !== void 0 && RANGE.test(ref) && !Releases.range.test(ref)) refuse("a range is a ref only as ^X[.Y[.Z]] or ~X.Y[.Z]");
	if (path?.split("/").some((segment) => segment === "" || segment === "." || segment === "..")) refuse("bad subpath");
	const subpath = path;
	return {
		...source === void 0 ? {} : { source },
		namespace,
		name,
		...ref === void 0 ? {} : { ref },
		...subpath === void 0 ? {} : { subpath }
	};
}
const plain$1 = (text) => ({
	text,
	head: false
});
const join = (segments) => `/${segments.map(({ text }) => text).join("/")}`;
function withoutDotSegments(segments) {
	const kept = [];
	for (const segment of segments) if (segment.text === "..") kept.pop();
	else if (segment.text !== ".") kept.push(segment);
	const last = segments.at(-1)?.text;
	if (last === "." || last === "..") kept.push(plain$1(""));
	return kept;
}
function decoded(part, refuse) {
	try {
		return decodeURIComponent(part);
	} catch {
		return refuse("bad percent-encoding");
	}
}
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/0field/Workbench.ts
/**
* Purpose: say what stands under one SmartObject's name — its domain, in its
* own words — in one stored node that is also the dictionary its nodes name.
*
* Intention: a workbench is all that stands under one name. Its
* model is what is stored — its `@id`, its own `@context`, the dictionary of
* its words, and the descriptors of its `classes`; the working tree it is
* read from on this host is no part of it, so a stored one has none. It is
* the {@link GitRepository} that reads that tree, and uses the
* {@link GitModules} of its submodules; the oField hook asks it for its own
* working tree and a SmartObject's checkout, and a storage that realizes
* one for a persistence names it by an `@id`, so a model relates to it as
* to any SmartObject. `JsonLd` reads and writes it as
* the one node that carries its own `@context`. It is made, checked,
* upgraded, watched and carried by the {@link WorkbenchTools} a program
* registers, Core when it loads.
*/
var Workbench = class Workbench extends GitRepository {
	/** The IRI of the type of a workbench node. */
	static type = "ofield://metatrom-ag/Manu/Workbench";
	static #tools;
	/** Registers the tools {@link Workbench.create} and each workbench's `check`, `upgrade`, `watch`, `carry` and `readToken` delegate to; called by Core when it loads. */
	static useTools(tools) {
		Workbench.#tools = tools;
	}
	/** A new workbench named `name`, from a template where one is named, made by the registered tools; the lines they report. */
	static async create(name, template) {
		return Workbench.#registered().create(name, template);
	}
	static #registered() {
		if (Workbench.#tools === void 0) throw new Error("no tools work on a workbench: load ofield://metatrom-ag/Core, which registers them");
		return Workbench.#tools;
	}
	/** A workbench of the model a node stored it as, or one read from the working tree at a folder. */
	constructor(model = {}, folder) {
		super(folder, model);
	}
	/** The workbench at a folder, named by `id` where a persistence restores it. */
	static at(folder, id) {
		return new Workbench(id === void 0 ? {} : { "@id": id }, folder);
	}
	/** The address of the file a workbench named by an `@id` is stored in: `workbench.jsonld` in the root that `@id` names. */
	static stored(id) {
		const named = OFieldIri.of(id);
		if (named !== void 0) return new OFieldIri({
			...named.model,
			subpath: "workbench.jsonld"
		}).toString();
		return `${id.replace(/\/+$/, "")}/workbench.jsonld`;
	}
	/**
	* The repository of the nearest `.gitmodules` or `.git` at or above a folder, so a dependency answers from its own,
	* as git's recursive submodules do.
	*/
	static above(folder) {
		if (folder === void 0) return void 0;
		const found = [folder, ...folder.ancestors].find((entry) => isFolder(entry) && (entry.file(".gitmodules").exists || entry.folder(".git").exists || entry.file(".git").exists));
		return found === void 0 ? void 0 : Workbench.at(found);
	}
	/**
	* Its own working tree, at whatever its HEAD names — a branch or a detached sha — where a SmartObject is the one
	* the `@id` of its root's `workbench.jsonld` names; none for another.
	*/
	own(id) {
		return id === this.#named ? this.folder : void 0;
	}
	/**
	* Whether this repository is the one a SmartObject, `<namespace>/<Name>`, names: by the `@id` of its root's
	* `workbench.jsonld`, or, where that names none, by its `origin` remote.
	*/
	names(id) {
		return id === (this.#named ?? this.id);
	}
	/** The branch of a SmartObject's one checkout; none where it has none, refused where it has several, so a ref is named. */
	branch(id) {
		const branches = this.#branches(id);
		if (branches.length > 1) throw new Error(`${id} is checked out on ${branches.join(", ")} in ${this.path}: name a ref`);
		return branches[0];
	}
	/**
	* The checkout of a SmartObject's branch: its own working tree for its own SmartObject on the branch checked out
	* here, elsewhere `dependencies/<namespace>/<Name>/<branch>/` where git lists it — as a submodule in `.gitmodules`,
	* or as one of this repository's worktrees, which is how its own hidden refs are checked out; none where git lists
	* it neither.
	*/
	checkout(id, branch) {
		if (id === this.#named && branch === this.head) return this.folder;
		return this.#branches(id).includes(branch) ? this.folder.folder(`dependencies/${id}/${branch}`) : void 0;
	}
	/**
	* Its version: the one its model names, otherwise the one its root's `workbench.jsonld` names, as Descriptor's Generator
	* writes it; none where neither names one as text, and refused, as its working tree is, where its model names none
	* and it has no tree on this host.
	*/
	get version() {
		if (this.model.version !== void 0) return this.model.version;
		const version = this.#node?.version;
		return typeof version === "string" ? version : void 0;
	}
	/**
	* The module hooks its model names, otherwise those its root's `workbench.jsonld` names; none where neither does.
	* Refused, naming the file, where they are no list of addresses.
	*/
	get hooks() {
		const hooks = this.model.hooks ?? this.#node?.hooks;
		if (hooks === void 0) return [];
		if (!Array.isArray(hooks) || !hooks.every((hook) => typeof hook === "string")) throw new Error(`hooks is a list of module addresses: ${this.folder.file("workbench.jsonld").path}`);
		return hooks;
	}
	get #node() {
		const file = this.folder.file("workbench.jsonld");
		return file.exists ? file.readJsonObject() : void 0;
	}
	get #named() {
		const id = this.#node?.["@id"];
		const named = typeof id === "string" ? OFieldIri.of(id)?.model : void 0;
		return named === void 0 ? void 0 : `${named.namespace}/${named.name}`;
	}
	#branches(id) {
		const prefix = `dependencies/${id}/`;
		const paths = [...new GitModules(this.folder.file(".gitmodules")).paths, ...this.#worktrees()].map((path) => path.replace(/^(\.\/)+/, "").replace(/\/+$/, ""));
		return [...new Set(paths.filter((path) => path.startsWith(prefix)).map((path) => path.slice(prefix.length)))];
	}
	/** The lines the registered tools report checking it. */
	async check() {
		return Workbench.#registered().check(this);
	}
	/** The lines the registered tools report upgrading it to what `uri` names. */
	upgrade(uri) {
		return Workbench.#registered().upgrade(this, uri);
	}
	/** Watches it, through the registered tools. */
	watch() {
		Workbench.#registered().watch(this);
	}
	/** Carries the newest `0field.js`, or the one `ref` names, into it through the registered tools; what they carried. */
	async carry(ref) {
		return Workbench.#registered().carry(this, ref);
	}
	/** What the registered tools answer for the read token `token`, passed on to them. */
	async readToken(token) {
		return Workbench.#registered().readToken(token);
	}
	/** The SmartObject this repository develops, `<namespace>/<Name>` as its `origin` remote names it; none without one. */
	get id() {
		const url = this.remote("origin");
		const named = url === void 0 ? null : /[/:]([^/:]+)\/([^/:]+?)(?:\.git)?\/*$/.exec(url);
		return named === null ? void 0 : `${named[1]}/${named[2]}`;
	}
	#worktrees() {
		return this.worktrees.flatMap(({ name, path: worktree }) => {
			const at = worktree.lastIndexOf("/dependencies/");
			if (at === -1) return [];
			const path = worktree.slice(at + 1);
			const named = new GitRepository(this.folder.folder(path)).pointer;
			return named !== void 0 && named.replace(/\/+$/, "").endsWith(`/worktrees/${name}`) ? [path] : [];
		});
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/graphs/GraphNode.ts
/**
* Purpose: give every graph its operations once.
*
* Intention: a graph's node, as graph theory has it, with no node chosen
* as root; asks its realization for only its neighbours, the nodes one
* edge away. A SmartObject, its model the realization's.
*/
var GraphNode = class extends TypedSmartObject.Class {
	/** Whether `other` is this node; realizations that hand out fresh objects for one node compare their identity. */
	is(other) {
		return other === this;
	}
	/** Every other node a path leads to, each once, nearest first; lazy, so a large graph is read only as far as asked. */
	*reachable() {
		const start = this;
		const seen = [start];
		const queue = [start];
		for (let node = queue.shift(); node !== void 0; node = queue.shift()) for (const neighbour of node.neighbours) {
			if (seen.some((known) => known.is(neighbour))) continue;
			seen.push(neighbour);
			queue.push(neighbour);
			yield neighbour;
		}
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/graphs/RootedTreeNode.ts
/**
* Purpose: give every rooted tree its operations once.
*
* Intention: a tree's node, as graph theory has it — a {@link GraphNode}
* with one node chosen as root, so its neighbours are a parent and
* children; asks its realization for only those two.
*/
var RootedTreeNode = class extends GraphNode {
	get neighbours() {
		const parent = this.parent;
		return parent === void 0 ? this.children : [parent, ...this.children];
	}
	/** The parent, then each ancestor up to the root, nearest first. */
	get ancestors() {
		const ancestors = [];
		for (let node = this.parent; node !== void 0; node = node.parent) ancestors.push(node);
		return ancestors;
	}
	get root() {
		return this.ancestors.at(-1) ?? this;
	}
	get siblings() {
		return this.parent?.children.filter((node) => !node.is(this)) ?? [];
	}
	get depth() {
		return this.ancestors.length;
	}
	get isLeaf() {
		return this.children.length === 0;
	}
	/** Every node below, pre-order: a node before its children; lazy, so a large tree is read only as far as asked. */
	*descendants() {
		for (const child of this.children) {
			yield child;
			yield* child.descendants();
		}
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/file-system/Entry.ts
/**
* Purpose: name what a store holds, whatever holds the store.
*
* Intention: a node of the file system's rooted tree — a {@link File} or a
* {@link Folder}, siblings, so neither has to fake a promise of the other;
* each habitat realizes reading them.
*/
var Entry = class extends RootedTreeNode {
	/** The entry at a POSIX path. The model holds only the path, so it can travel; the content is read by the habitat's code. */
	constructor(path) {
		super({ path });
	}
	get path() {
		return this.model.path;
	}
	get name() {
		return this.path.slice(this.path.lastIndexOf("/") + 1);
	}
	get parent() {
		if (this.path === "/") return void 0;
		const at = this.path.lastIndexOf("/");
		if (at === -1) return void 0;
		return this.folderAt(at === 0 ? "/" : this.path.slice(0, at));
	}
	/** Whether another entry has the same path, which makes it the same node. */
	is(other) {
		return other.path === this.path;
	}
	/** The {@link Folder} at an absolute path, of this entry's own realization — on another drive as well, where the host has drives. */
	at(path) {
		return this.folderAt(path);
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/habitats/node/file-system/ReadOnlyNodeFile.ts
/**
* Purpose: read a file on disk.
*
* Intention: realizes {@link File} over `node:fs`, which Node, Deno and Bun
* all implement, so one realization serves all three.
*/
var ReadOnlyNodeFile = class extends Entry {
	get children() {
		return [];
	}
	readText() {
		return new TextDecoder().decode(this.read());
	}
	readJson() {
		try {
			return JSON.parse(this.readText());
		} catch (error) {
			throw new Error(`not JSON: ${this.path}`, { cause: error });
		}
	}
	readJsonObject() {
		const value = this.readJson();
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`not a JSON object: ${this.path}`);
		return value;
	}
	get exists() {
		return fs().lstatSync(this.path, { throwIfNoEntry: false })?.isFile() ?? false;
	}
	read() {
		return fs().readFileSync(this.path);
	}
	head(length) {
		const file = fs().openSync(this.path, "r");
		try {
			const bytes = new Uint8Array(length);
			return bytes.subarray(0, fs().readSync(file, bytes, 0, length, 0));
		} finally {
			fs().closeSync(file);
		}
	}
	folderAt(path) {
		return new ReadOnlyNodeFolder(path);
	}
};
/** `node:fs`, not imported, so this file still loads where node:fs does not exist. */
const fs = () => process.getBuiltinModule("node:fs");
//#endregion
//#region dependencies/metatrom-ag/Manu/main/habitats/node/file-system/ReadOnlyNodeFolder.ts
/**
* Purpose: read a folder on disk.
*
* Intention: realizes {@link Folder} over `node:fs`, which Node, Deno and Bun
* all implement, so one realization serves all three; it speaks the host's
* path notation and the `file:` URL a runtime loads by.
*/
var ReadOnlyNodeFolder = class ReadOnlyNodeFolder extends Entry {
	/**
	* The folder at a path in the host's own notation — relative to the working folder, or absolute — holding the POSIX
	* path every {@link Entry} holds.
	*/
	static native(path) {
		const { resolve, sep } = process.getBuiltinModule("node:path");
		return new ReadOnlyNodeFolder(resolve(path).split(sep).join("/"));
	}
	/** The entry a `file:` URL names, as a folder of this realization — its `parent` is the folder holding it. */
	static fromUrl(url) {
		return ReadOnlyNodeFolder.native(process.getBuiltinModule("node:url").fileURLToPath(url));
	}
	/** The `file:` URL an entry's path is loaded by. */
	static urlOf(entry) {
		return process.getBuiltinModule("node:url").pathToFileURL(entry.path).href;
	}
	get exists() {
		return fs().lstatSync(this.path, { throwIfNoEntry: false })?.isDirectory() ?? false;
	}
	get entries() {
		if (!this.exists) return [];
		return fs().readdirSync(this.path, { withFileTypes: true }).flatMap((entry) => entry.name.includes("\\") ? [] : entry.isDirectory() ? [this.folder(entry.name)] : entry.isFile() ? [this.file(entry.name)] : []);
	}
	get children() {
		return this.entries;
	}
	child(path) {
		const names = path.split("/");
		if (path.startsWith("/") || names.some((name) => name === "" || name === "." || name === "..")) throw new Error(`not a path inside ${this.path}: ${path}`);
		const separating = names.find((name) => name.includes("\\"));
		if (separating !== void 0) throw new Error(`a name holding \\ is no name inside ${this.path}: ${separating}`);
		return this.path === "/" ? `/${path}` : `${this.path}/${path}`;
	}
	/** This folder by its real path, every link on the way followed, so one folder under two paths is one; refused where there is none. */
	get real() {
		return ReadOnlyNodeFolder.native(fs().realpathSync(this.path));
	}
	file(path) {
		return new ReadOnlyNodeFile(this.child(path));
	}
	folder(path) {
		return new ReadOnlyNodeFolder(this.child(path));
	}
	folderAt(path) {
		return new ReadOnlyNodeFolder(path);
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/loading/ModuleHookChain.ts
/**
* Purpose: let loading in any habitat be extended by hooks.
*
* Intention: uses {@link ModuleHook}s; each kernel — Node's, Bun's, the
* browser's — carries one chain and hands each import to it, and
* `OField` hands it to a program as `hooks`.
*/
var ModuleHookChain = class extends TypedSmartObject {
	#hooks = [];
	constructor() {
		super({ hooks: [] });
	}
	/** Puts a hook in use after those already in use, its name kept in the model. */
	use(hook) {
		this.#hooks.push(hook);
		this.update({ hooks: [...this.model.hooks, hook.name] });
	}
	/**
	* The first URL a hook resolves the specifier to, the hooks asked in the order they were put in use; `undefined` where
	* none does. A specifier of the scheme `oasis:`, the one before `ofield:`, is refused before any hook is asked, naming
	* `ofield://`.
	*/
	resolve(specifier, parentURL) {
		OFieldIri.refuseRetired(specifier);
		for (const hook of this.#hooks) {
			const url = hook.resolve?.(specifier, parentURL);
			if (url !== void 0) return url;
		}
	}
	/**
	* Where an address lies, read from an anchor: a URL or an oField IRI as the hooks resolve it, where one does; a
	* Windows path from its drive letter, `C:\x.ts` or `C:/x.ts`, as the file it names; any other path read from the
	* anchor. Refused, naming the address, where it names a data ref ({@link OFieldIri.isDataRef}): a data ref holds data,
	* and code runs from a branch, a tag or a release.
	*/
	locate(address, anchor) {
		if (OFieldIri.isDataRef(OFieldIri.of(address)?.model.ref)) throw new Error(`nothing runs from a data ref: ${address}`);
		const located = /^[A-Za-z]:[\\/]/.test(address) ? new URL(`file:///${address.replaceAll("%", "%25").replaceAll("#", "%23").replaceAll("\\", "/")}`).href : /^[A-Za-z][A-Za-z\d+.-]+:/.test(address) ? address : new URL(address, anchor).href;
		return this.resolve(located, anchor) ?? located;
	}
	/**
	* The URL of the module a type IRI names, `<type>.ts`, as the hooks resolve it from a parent; refused before anything
	* resolves where the type names a data ref — a ref under `refs/` that is no branch — as what is stored as data never
	* runs, and refused, naming it, where no hook resolves it.
	*/
	moduleOf(type, parentURL) {
		if (OFieldIri.isDataRef(OFieldIri.of(type)?.model.ref)) throw new Error(`no class is loaded from a data ref: ${type}`);
		const url = this.resolve(`${type}.ts`, parentURL);
		if (url === void 0) throw new Error(`no module resolves ${type}.ts`);
		return url;
	}
	/** The first source a hook loads the URL as, the hooks asked in the order they were put in use; `undefined` where none does. */
	load(url) {
		for (const hook of this.#hooks) {
			const module = hook.load?.(url);
			if (module !== void 0) return module;
		}
	}
	/**
	* Hands a specifier's final resolution to every hook that observes. A kernel calls it however the specifier was
	* reached, by a hook or by the environment's own, so a hook that only watches need not resolve anything itself to
	* see it.
	*/
	observe(url) {
		for (const hook of this.#hooks) hook.observe?.(url);
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/habitats/browser/BrowserOFieldHook.ts
/**
* Purpose: load a SmartObject by its oField IRI in a tab.
*
* Intention: realizes {@link ModuleHook} for the `ofield` scheme, which no
* browser imports, by naming the URL a web server serves the file at: the
* IRI's own path below the base its model names. A browser extension, or
* anything else that reaches a tab's {@link ModuleHookChain}, answers in
* its place by coming first.
*/
var BrowserOFieldHook = class extends TypedSmartObject {
	name = "ofield";
	schemes = ["ofield"];
	/**
	* The URL of the file an oField IRI names, exact in case: `ofield://<namespace>/<Name>[@<ref>]:<subpath>` at
	* `<base><namespace>/<Name>[@<ref>]/<subpath>`, the ref one segment however many slashes it holds, and `<Name>.ts`
	* where it names no subpath. `ofield://npm/…` it passes on.
	*/
	resolve(specifier) {
		if (!specifier.startsWith("ofield:")) return void 0;
		const { namespace, name, ref, subpath } = new OFieldIri(specifier).model;
		if (namespace === "npm") return void 0;
		const tree = ref === void 0 ? name : `${name}@${encodeURIComponent(ref)}`;
		return new URL(`${namespace}/${tree}/${subpath ?? `${name}.ts`}`, this.model.base).href;
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/habitats/browser/BrowserStorage.ts
/**
* Purpose: find what a SmartObject is stored as, from a tab.
*
* Intention: realizes the {@link Storage} a Persistence uses over the
* browser's `fetch`, which reads only by waiting: an oField IRI at the URL
* the tab's {@link ModuleHookChain} names for it, any other address as a
* URL read from the place it anchors to, and a folder as its server lists
* it. What a read fetched, the tab's kernel keeps for the reads that answer
* at once.
*/
var BrowserStorage = class extends TypedSmartObject {
	#hooks;
	#fetched;
	/** Over the chain an oField IRI resolves through, and the texts the tab's reads have fetched, by location. */
	constructor(model, hooks, fetched) {
		super(model);
		this.#hooks = hooks;
		this.#fetched = fetched;
	}
	/** The location an address names: an oField IRI in canonical form, any other address as the URL it names from the anchor; a fragment dropped. */
	location(address) {
		if (address === "") throw new Error("an empty address names no model");
		const located = address.split("#")[0];
		if (located.startsWith("ofield:")) return new OFieldIri(located).toString();
		return new URL(located, this.model.anchor).href;
	}
	/**
	* The text at a location, fetched once and kept, or fetched again where `afresh` asks, past the browser's HTTP cache,
	* kept in its place; refused, naming it, where the server holds none, and as {@link BrowserStorage.has} is.
	*/
	async get(location, afresh = false) {
		const text = await this.#fetch(location, afresh);
		if (text === void 0) throw new Error(`no model at ${location}`);
		return text;
	}
	/** The text a read has fetched from a location; refused, naming it, where none has, as a tab reads only by waiting. */
	getSync(location) {
		const text = this.#fetched.get(location);
		if (text === void 0) throw new Error(`${location} is read only by waiting, and no read has fetched it yet`);
		return text;
	}
	/** Whether the server holds a text at a location: none where it answers 404 or 410; refused, naming the URL and the status, where it answers any other failure. */
	async has(location) {
		return await this.#fetch(location) !== void 0;
	}
	/** Whether a read has fetched a text at a location; refused, naming it, where none has. */
	hasSync(location) {
		this.getSync(location);
		return true;
	}
	/**
	* The locations below a folder, as its server names them when asked for the folder's URL ending in `/` as
	* `application/json`: a JSON list of addresses. None where it answers 404 or 410; refused, naming the URL, where it
	* answers any other failure or no list of addresses.
	*/
	async list(address) {
		const location = this.location(address);
		const url = location.startsWith("ofield:") ? this.#folderOf(location) : location.endsWith("/") ? location : `${location}/`;
		const response = await fetch(url, { headers: { accept: "application/json" } });
		if (response.status === 404 || response.status === 410) return [];
		if (!response.ok) throw new Error(`${url} answered ${response.status}`);
		let named;
		try {
			named = await response.json();
		} catch {
			named = void 0;
		}
		if (!Array.isArray(named) || !named.every((each) => typeof each === "string")) throw new Error(`${url} answered no list of locations`);
		return named.map((each) => this.location(each));
	}
	/** Refused, naming the address: a tab lists only by waiting. */
	listSync(address) {
		throw new Error(`a tab lists only by waiting: ${address}`);
	}
	/** None: a tab realizes no repository. */
	realizes() {
		return false;
	}
	/** Refused: a tab realizes no repository. */
	realized(location) {
		throw new Error(`a tab realizes nothing at ${location}`);
	}
	#folderOf(location) {
		const named = new OFieldIri(location).model;
		const below = new OFieldIri({
			...named,
			subpath: named.subpath === void 0 ? "_" : `${named.subpath.replace(/\/$/, "")}/_`
		}).toString();
		const url = this.#hooks.resolve(below, this.model.anchor);
		if (url === void 0) throw new Error(`no hook resolves ${location}`);
		return url.slice(0, -1);
	}
	async #fetch(location, afresh = false) {
		const kept = afresh ? void 0 : this.#fetched.get(location);
		if (kept !== void 0) return kept;
		const url = location.startsWith("ofield:") ? this.#hooks.resolve(location, this.model.anchor) : location;
		if (url === void 0) throw new Error(`no hook resolves ${location}`);
		const response = await fetch(url, afresh ? { cache: "no-cache" } : void 0);
		if (response.status === 404 || response.status === 410) return void 0;
		if (!response.ok) throw new Error(`${url} answered ${response.status}`);
		const text = await response.text();
		this.#fetched.set(location, text);
		return text;
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/habitats/browser/BrowserKernel.ts
var __rewriteRelativeImportExtension$2 = function(path, preserveJsx) {
	if (typeof path === "string" && /^\.\.?\//.test(path)) return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
		return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
	});
	return path;
};
/**
* Purpose: make loading work in a tab.
*
* Intention: realizes {@link Manu} over the page the 0field was
* loaded into: the script tags of its own file name the programs a tab is
* started with, where each is shown and in which view, its {@link ModuleHookChain} carries
* the {@link BrowserOFieldHook}, and its storage, which a Persistence reads,
* is a {@link BrowserStorage}. It hands out a {@link Program} for each
* tag naming one. Its model names the 0field it loads for.
*/
var BrowserKernel = class BrowserKernel extends TypedSmartObject {
	hooks = new ModuleHookChain();
	#fetched = /* @__PURE__ */ new Map();
	#recorded = /* @__PURE__ */ new WeakMap();
	#started;
	/**
	* Adds the {@link BrowserOFieldHook} to its chain, over the base the tags of its file name in `data-ofield`, or else
	* the root of the host its file came from; refused, naming them, where its tags name more than one.
	*/
	async start() {
		const named = new Set(this.#tags().flatMap((tag) => tag.dataset.ofield === void 0 ? [] : [new URL(tag.dataset.ofield, document.baseURI).href]));
		if (named.size > 1) throw new Error(`the script tags of ${this.model.oField} name more than one data-ofield: ${[...named].join(", ")}`);
		this.hooks.use(new BrowserOFieldHook({ base: [...named][0] ?? new URL("/", this.model.oField).href }));
	}
	/**
	* A program for each script tag of its file naming one in `data-start`, in the page's order: its address an oField
	* IRI as the hooks resolve it, or a URL read from the page; its words the JSON array of strings in `data-words`, none
	* where it names none, refused, naming it, where it holds anything else; shown where `data-attach` names, in the
	* view whose file `data-view` names, read as its address is; refused, naming it, where either names a file on a data
	* ref.
	*/
	get started() {
		this.#started ??= this.#tags().flatMap((tag) => {
			const { start, words, attach, view } = tag.dataset;
			if (start === void 0) return [];
			return [new Program({
				address: this.hooks.locate(start, this.anchor()),
				words: BrowserKernel.#words(words),
				...attach === void 0 ? {} : { attach },
				...view === void 0 ? {} : { view: this.hooks.locate(view, this.anchor()) }
			})];
		});
		return this.#started;
	}
	/** The URL a place reads from: the page, or a file in the folder a path names from the page, which need not exist. */
	anchor(place) {
		return place === void 0 ? document.baseURI : new URL(`${place.replace(/\/?$/, "/")}.started`, document.baseURI).href;
	}
	storage(place) {
		return new BrowserStorage({ anchor: this.anchor(place) }, this.hooks, this.#fetched);
	}
	/**
	* The class a type names, exported by default from its module. A SmartObject class named by an oField IRI is recorded
	* through its own `loaded`, the first time this kernel loads it and before any program has built it, as loaded from
	* that IRI's namespace and the version its workbench's `workbench.jsonld` names, so its element is named after that
	* release; a `workbench.jsonld` that holds no JSON object, or a version no element name holds, is refused, naming it.
	*/
	async classOf(type, place) {
		const created = (await import(__rewriteRelativeImportExtension$2(this.hooks.moduleOf(type, this.anchor(place))))).default;
		if (typeof created === "function" && created.prototype instanceof TypedSmartObject) await this.#record(type, created, place);
		return created;
	}
	/** Fills nothing: a tab keeps no store, and reads what its server serves. */
	async fill(_address) {}
	#record(type, created, place) {
		const known = this.#recorded.get(created);
		if (known !== void 0) return known;
		const recording = this.#recording(type, created, place);
		this.#recorded.set(created, recording);
		return recording;
	}
	async #recording(type, created, place) {
		const iri = OFieldIri.of(type);
		if (iri === void 0 || customElements.getName(created) !== null) return;
		const workbench = Workbench.stored(type);
		const storage = this.storage(place);
		if (!await storage.has(workbench)) return;
		const version = BrowserKernel.#version(workbench, await storage.get(workbench));
		if (version !== void 0) created.loaded(created, {
			namespace: iri.model.namespace,
			version
		});
	}
	static #version(address, text) {
		let node;
		try {
			node = JSON.parse(text);
		} catch {
			throw new Error(`${address} holds no JSON`);
		}
		if (typeof node !== "object" || node === null || Array.isArray(node)) throw new Error(`${address} holds no JSON object`);
		const { version } = node;
		if (version === void 0) return void 0;
		if (typeof version !== "string" || !/^\d+\.\d+\.\d+(-[0-9a-z.-]+)?$/.test(version)) throw new Error(`${address} names a version no element name holds: ${JSON.stringify(version)}`);
		return version;
	}
	/**
	* Shows a SmartObject, an element in a tab: as the last child of what a selector or `body` names, or filling the
	* viewport — html and body at the viewport's size without a margin, the SmartObject at theirs, laid out as its own
	* sheet lays it out, as a block where that leaves it inline — through a stylesheet it adopts, leaving the page's own;
	* refused, naming the place, where nothing in the page matches it.
	*/
	attach(smartObject, where) {
		const element = smartObject;
		if (where === "viewport") {
			const sheet = new CSSStyleSheet();
			document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
			document.body.append(element);
			const display = getComputedStyle(element).display === "inline" ? "display: block; " : "";
			sheet.replaceSync(`html, body { width: 100%; height: 100%; margin: 0 } ${CSS.escape(element.localName)} { ${display}width: 100%; height: 100% }`);
			return;
		}
		const target = where === "body" ? document.body : document.querySelector(where);
		if (target === null) throw new Error(`nothing in the page matches the place to attach to: ${where}`);
		target.append(element);
	}
	#tags() {
		return [...document.querySelectorAll("script[src]")].filter((tag) => new URL(tag.src, document.baseURI).href === this.model.oField);
	}
	static #words(written) {
		if (written === void 0) return [];
		const refused = /* @__PURE__ */ new Error(`data-words is a JSON array of strings: ${written}`);
		let words;
		try {
			words = JSON.parse(written);
		} catch {
			throw refused;
		}
		if (!Array.isArray(words) || !words.every((word) => typeof word === "string")) throw refused;
		return words;
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/0field/npm/BareSpecifier.ts
/**
* Purpose: tell a package's name from the path inside it in a bare import.
*
* Intention: the npm hook splits the bare imports a stored package makes with
* it, and a package manifest tells a bare import target by it.
*/
var BareSpecifier = class BareSpecifier extends TypedSmartObject {
	/** Neither relative, absolute, a URL nor a package's own `#import`. */
	static is(specifier) {
		return !/^[./#]/.test(specifier) && !specifier.includes(":");
	}
	/**
	* Splits a bare specifier — `name` or `@scope/name`, either with a path inside — into the package's name and the
	* subpath `.` or `./<path>`.
	*/
	constructor(specifier) {
		if (!BareSpecifier.is(specifier)) throw new TypeError(`not a bare specifier: ${specifier}`);
		super(BareSpecifier.#parts(specifier));
	}
	/** The package's name, read-only, as a parsed specifier is a value: a getter without a setter refuses the field's write. */
	get name() {
		return this.model.name;
	}
	/** The path inside the package, read-only as its name is. */
	get subpath() {
		return this.model.subpath;
	}
	static #nameOf(names) {
		return names.slice(0, names[0]?.startsWith("@") ? 2 : 1).join("/");
	}
	static #parts(specifier) {
		const given = specifier.split("/");
		const names = given.length > 1 && given.at(-1) === "" ? given.slice(0, -1) : given;
		const name = BareSpecifier.#nameOf(names);
		const rest = names.slice(name.split("/").length);
		return {
			name,
			subpath: rest.length === 0 ? "." : `./${rest.join("/")}`
		};
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/0field/npm/CommonJsModule.ts
/**
* Purpose: a stored CommonJS module runs once and hands its exports to an ES
* import, the same in every habitat.
*
* Intention: uses a {@link CommonJsHost} — the npm hook — which hands
* its {@link CommonJsModule.source} to the runtime as a {@link ModuleSource}.
*/
var CommonJsModule = class CommonJsModule {
	static #modules = /* @__PURE__ */ new Map();
	/** The URL it was first asked for by. */
	url;
	/** The CommonJS `module` record its source runs with: its exports, its file's path, and whether it ran to the end. */
	module;
	constructor(url, filename) {
		this.url = url;
		this.module = {
			exports: {},
			filename,
			loaded: false
		};
	}
	/**
	* The module at a URL, run the first time it is asked for, as Node runs CommonJS: with its own `module`, `exports`,
	* `__filename`, `__dirname` and a `require` the host resolves — a builtin by the runtime, a stored file by the
	* store, JSON parsed, CommonJS run here once per file.
	*/
	static of(url, host) {
		const file = host.fileOf(url);
		const known = file === void 0 ? void 0 : CommonJsModule.#modules.get(file.path);
		if (known !== void 0) return known;
		const read = host.read(url);
		if (file === void 0 || read === void 0) throw new Error(`no CommonJS module at ${url}`);
		const ran = new CommonJsModule(url, file.path);
		CommonJsModule.#modules.set(file.path, ran);
		ran.#run(read.source, file, host);
		return ran;
	}
	/**
	* The ES module a runtime loads in this one's place: `module.exports` as `default` and as `module.exports`, each own
	* enumerable key of it by name, as Node's own import of CommonJS gives them. An ES module's names are fixed when it
	* is loaded, so they are read from the module as it ran by then.
	*/
	get source() {
		exported().set(this.url, this.module.exports);
		const value = this.module.exports;
		const names = value !== null && (typeof value === "object" || typeof value === "function") ? Object.keys(value).filter((name) => name !== "default") : [];
		return [
			`const exported = globalThis[Symbol.for(${JSON.stringify(EXPORTED)})].get(${JSON.stringify(this.url)})`,
			"export default exported",
			"export { exported as \"module.exports\" }",
			...names.flatMap((name, index) => [`const name${index} = exported[${JSON.stringify(name)}]`, `export { name${index} as ${IDENTIFIER.test(name) ? name : JSON.stringify(name)} }`]),
			""
		].join("\n");
	}
	/**
	* Whether a source runs as CommonJS: it compiles as the body of the function a CommonJS module runs in, as Node
	* decides for a file no `package.json` gives a type — `import` and `export` statements, `import.meta` and a
	* top-level `await` compile only in an ES module, whatever text a string holds.
	*/
	static runs(source) {
		try {
			CommonJsModule.#compiled(source);
			return true;
		} catch {
			return false;
		}
	}
	static #compiled(source) {
		return new Function("exports", "require", "module", "__filename", "__dirname", source);
	}
	#run(source, file, host) {
		const require = (specifier) => {
			const target = host.required(specifier, this.url);
			if ("builtin" in target) return target.builtin;
			const read = host.read(target.url);
			if (read?.format === "json") return JSON.parse(read.source);
			if (read?.format === "commonjs") return CommonJsModule.of(target.url, host).module.exports;
			return host.esm(target.url);
		};
		require.resolve = (specifier) => {
			const target = host.required(specifier, this.url);
			return "builtin" in target ? specifier : host.fileOf(target.url)?.path ?? target.url;
		};
		CommonJsModule.#compiled(`${source}\n//# sourceURL=${this.url}`)(this.module.exports, require, this.module, file.path, file.parent?.path ?? "");
		this.module.loaded = true;
	}
};
const EXPORTED = "metatrom.oField.commonjs";
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
function exported() {
	const global = globalThis;
	return global[Symbol.for(EXPORTED)] ??= /* @__PURE__ */ new Map();
}
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/0field/json/JsonObject.ts
/**
* Purpose: keep the JSON object a file holds as a SmartObject's model.
*
* Intention: the base of the SmartObjects whose model is a JSON file of the
* store or the repository; reads it through {@link File.readJsonObject}.
*/
var JsonObject = class JsonObject extends TypedSmartObject.Class {
	/** Reads the model from a file — a missing one is empty, anything but a JSON object refused, naming the file — or takes it as given. */
	constructor(source) {
		super(source instanceof Entry ? JsonObject.#read(source) : source);
	}
	static #read(file) {
		if (!file.exists) return {};
		return file.readJsonObject();
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/0field/npm/PackageManifest.ts
/**
* Purpose: say which file of a package an import of it gets.
*
* Intention: a {@link JsonObject} over `package.json`; the npm hook asks it
* for the entry of a subpath under the habitat's conditions, by Node's package
* entry points, and for the target of a `#…` import its own files make, by
* Node's subpath imports, matched the same way.
*
* @see https://nodejs.org/api/packages.html#package-entry-points
* @see https://nodejs.org/api/packages.html#subpath-imports
*/
var PackageManifest = class extends JsonObject {
	/**
	* The file it names for a subpath — `.` or `./<path>` — as a path inside the
	* package: by `exports` under the conditions given, else `main`, else
	* `index.js`. Undefined where `exports` does not export it.
	*/
	entry(subpath, conditions) {
		const { exports, main } = this.model;
		if (exports === void 0) {
			if (subpath !== ".") return subpath.slice(2);
			return typeof main === "string" ? main.replace(/^\.\//, "") : "index.js";
		}
		return this.#matched(this.#subpaths(exports) ?? { ".": exports }, subpath, conditions);
	}
	/**
	* The target a `#…` import names under the conditions given, as `imports` writes it: a path inside the package,
	* starting with `./`, or a bare specifier, for the importer's own dependencies. Undefined where `imports` maps none.
	*/
	import(specifier, conditions) {
		if (!specifier.startsWith("#") || specifier === "#" || specifier.startsWith("#/")) throw new Error(`not a subpath import: ${specifier}`);
		const { imports } = this.model;
		if (typeof imports !== "object" || imports === null || Array.isArray(imports)) return void 0;
		return this.#matched(imports, specifier, conditions, true);
	}
	#matched(map, subpath, conditions, importing = false) {
		if (Object.hasOwn(map, subpath)) return this.#target(map[subpath], void 0, conditions, importing);
		let best;
		for (const key of Object.keys(map)) {
			const star = key.indexOf("*");
			if (star === -1 || subpath.length < key.length) continue;
			const after = key.slice(star + 1);
			if (!subpath.startsWith(key.slice(0, star)) || !subpath.endsWith(after)) continue;
			if (best !== void 0 && (star < best.before || star === best.before && key.length <= best.key.length)) continue;
			best = {
				key,
				before: star,
				match: subpath.slice(star, subpath.length - after.length)
			};
		}
		return best === void 0 ? void 0 : this.#target(map[best.key], best.match, conditions, importing);
	}
	#subpaths(exports) {
		if (typeof exports !== "object" || exports === null || Array.isArray(exports)) return void 0;
		const keys = Object.keys(exports);
		const dotted = keys.filter((key) => key.startsWith(".")).length;
		if (dotted === 0) return void 0;
		if (dotted !== keys.length) throw new Error(`exports mixes subpaths and conditions: ${keys.join(", ")}`);
		return exports;
	}
	#target(value, match, conditions, importing = false) {
		if (value === null) return void 0;
		if (typeof value === "string") {
			const target = match === void 0 ? value : value.replaceAll("*", match);
			if (value.startsWith("./")) return importing ? target : target.slice(2);
			if (importing && BareSpecifier.is(value)) return target;
			throw new Error(`an ${importing ? "import" : "export"} target starts with ./: ${value}`);
		}
		if (Array.isArray(value)) {
			for (const fallback of value) {
				const path = this.#target(fallback, match, conditions, importing);
				if (path !== void 0) return path;
			}
			return;
		}
		if (typeof value !== "object") throw new Error(`not an export target: ${JSON.stringify(value)}`);
		for (const [condition, next] of Object.entries(value)) {
			if (!conditions.includes(condition)) continue;
			const path = this.#target(next, match, conditions, importing);
			if (path !== void 0) return path;
		}
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/0field/Tags.ts
/**
* Purpose: say which releases of a workbench a store holds, each by its tag,
* and where its tree stands.
*
* Intention: reads the trees Core's installer keeps in a store
* through a {@link Folder}, each by the version its {@link Workbench} names —
* written by Descriptor's Generator, so a tree says its own version;
* {@link Releases} chooses the latest. The oField hook uses it to find the
* tree a tag or no ref names, and the stores to find the workbenches they hold
* a release of.
*/
var Tags = class extends TypedSmartObject {
	/**
	* Reads the tags of a workbench, `<namespace>/<Name>`, from its trees in a store, `0field/<namespace>/<Name>/<sha>/`: none
	* where the store holds no tree of it; refused, naming the tree and saying to rebuild the store, where a tree's
	* `workbench.jsonld` names no stable version `X.Y.Z` — a store an older installer built. A folder whose name starts with a
	* dot is the installer's, still being written, and is no tree.
	*/
	constructor(store, id) {
		const read = {};
		for (const tree of store.folder(`0field/${id}`).entries) {
			if (!isFolder(tree) || tree.name.startsWith(".")) continue;
			const version = Workbench.at(tree).version;
			if (version === void 0 || version.startsWith("v") || new Releases([version]).latest !== version) throw new Error(`${tree.path}/workbench.jsonld names no stable version: rebuild the store`);
			read[`v${version}`] = tree.name;
		}
		super(read);
	}
	/** The tag of its highest stable release; none where the store holds no tree of it. */
	get latest() {
		return new Releases(Object.keys(this.model)).latest;
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/habitats/node/loading/NodeStores.ts
/**
* Purpose: find the stores of the host this process runs on, in the order
* they are read, and the workbenches they hold.
*
* Intention: realizes {@link Stores} over Node's API — `process.env`,
* `os.homedir()`, {@link ReadOnlyNodeFolder.native} — which Node, Deno and
* Bun all implement; {@link NodeStores.of} reads the host into its
* {@link StoresModel}, and every store it hands out is a
* {@link ReadOnlyNodeFolder}. It uses each workbench's {@link Tags}.
*/
var NodeStores = class NodeStores extends TypedSmartObject {
	/** The stores of this host, found from its platform, its home folder and `env`. */
	static of(env = process.env) {
		const { homedir } = process.getBuiltinModule("node:os");
		return new NodeStores({
			platform: process.platform,
			...env.OFIELD_HOME ? { oFieldHome: ReadOnlyNodeFolder.native(env.OFIELD_HOME).path } : {},
			home: ReadOnlyNodeFolder.native(homedir()).path,
			...env.ProgramData ? { programData: ReadOnlyNodeFolder.native(env.ProgramData).path } : {}
		});
	}
	get all() {
		if (this.model.oFieldHome !== void 0) return [this.own];
		return [this.shared, this.own].filter((store) => store?.exists === true);
	}
	get own() {
		if (this.model.oFieldHome === void 0) return this.folderAt(this.model.home).folder(".0field");
		const oFieldHome = this.folderAt(this.model.oFieldHome);
		if (!oFieldHome.exists) throw new Error(`OFIELD_HOME is no folder: ${oFieldHome.path}`);
		return oFieldHome;
	}
	get shared() {
		if (this.model.platform === "darwin") return this.folderAt("/Users/Shared/.0field");
		if (this.model.platform === "win32") return this.model.programData === void 0 ? void 0 : this.folderAt(this.model.programData).folder("0field");
		return this.folderAt("/var/lib/0field");
	}
	get workbenches() {
		const folders = (folder) => folder.entries.filter(isFolder);
		const named = this.all.flatMap((store) => folders(store.folder("0field")).flatMap((namespace) => folders(namespace).map((workbench) => `${namespace.name}/${workbench.name}`).filter((id) => new Tags(store, id).latest !== void 0)));
		return [...new Set(named)].sort();
	}
	/** The {@link Folder} at an absolute POSIX path, a {@link ReadOnlyNodeFolder}. */
	folderAt(path) {
		return new ReadOnlyNodeFolder(path);
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/habitats/node/loading/NodeNpmHook.ts
/**
* Purpose: load an npm package from the store on this host's disk, without
* `node_modules`.
*
* Intention: realizes {@link ModuleHook} for `ofield://npm/…` and for the bare
* and `#…` imports a stored package makes, over Node's API —
* {@link NodeStores}, {@link ReadOnlyNodeFolder}, `node:path`, `node:module` —
* which Node, Deno and Bun all implement. It reads a package through its
* {@link PackageManifest} and the dependencies the `uses` of its descriptor,
* `<version>.descriptor.jsonld` beside its version, names,
* a specifier as an {@link OFieldIri} or a {@link BareSpecifier}, a version
* through {@link Releases}, and hands a stored CommonJS module on through a
* {@link CommonJsModule}.
*/
var NodeNpmHook = class NodeNpmHook extends TypedSmartObject {
	/** A file inside a stored package below a store: `/npm/<name>/<version>/package/…`, naming the package's name and version. */
	static stored = /\/npm\/((?:@[^/]+\/)?[^/]+)\/([^/]+)\/package\/./;
	name = "npm";
	schemes = ["ofield"];
	/**
	* The stored file an import names: `ofield://npm/…` by its version — the latest release without one, the highest
	* within a range — a bare import by the exact version its package's descriptor names in `uses`, or its own version
	* where it names the importing package itself, and a `#…` import by the `imports` of the `package.json` governing
	* the importing file; the {@link PackageManifest} picks the file. A builtin it passes on.
	*/
	resolve(specifier, parentURL) {
		return this.#resolved(specifier, parentURL, "import");
	}
	#resolved(specifier, parentURL, kind) {
		if (specifier.startsWith("ofield:")) {
			const { source, namespace, name, ref, subpath } = new OFieldIri(specifier).model;
			if (namespace !== "npm") return void 0;
			if (source !== void 0) throw new Error(`oField sources are not read yet: ${source}`);
			return this.#entry(name, ref, subpath === void 0 ? "." : `./${subpath}`, kind);
		}
		if (parentURL !== void 0 && specifier.startsWith("#")) return this.#imported(specifier, parentURL, kind);
		if (parentURL === void 0 || !BareSpecifier.is(specifier) || this.#isBuiltin(specifier)) return void 0;
		const importer = this.#packageOf(this.fileOf(parentURL));
		if (importer === void 0) return void 0;
		const { name, subpath } = new BareSpecifier(specifier);
		if (name === importer.name) {
			if (new PackageManifest(importer.folder.folder("package").file("package.json")).model.exports === void 0) throw new Error(`npm/${name}@${importer.version} has no exports to import itself by`);
			return this.#entry(name, importer.version, subpath, kind);
		}
		const descriptor = importer.folder.parent?.file(`${importer.version}.descriptor.jsonld`);
		const version = NodeNpmHook.#used(descriptor).get(name);
		if (version === void 0) throw new Error(`no ${name} in the uses of ${descriptor.path}, imported by ${parentURL}`);
		return this.#entry(name, version, subpath, kind);
	}
	/**
	* A stored file's source and its format — never guessed by the runtime's own loader, which takes a `.js` file for
	* ESM or CommonJS inconsistently across habitats. `.mjs` is always `module`, `.cjs` always `commonjs`, `.json`
	* always `json`; a `.js` file follows the nearest `package.json` above it within its package — a package bundled
	* inside another governs its own files, as Node reads it — or, where that names no `type`, whether it compiles as
	* CommonJS, as Node's own newer detection does for a file no `package.json` governs.
	*
	* A stored CommonJS module is handed on as the ES module a {@link CommonJsModule} stands in with, the same in every
	* habitat, its `require`s resolved here as Node's are: by the `require` condition, a relative one by Node's file
	* rules. A stored ES module's `import.meta.resolve(…)` is answered here too, as its import would be: the call is
	* rewritten in its source, as Deno and Bun answer it themselves, past every hook.
	*/
	load(url) {
		const read = this.#read(url);
		if (read?.format === "module" && RESOLVE.test(read.source)) return {
			source: this.#resolving(read.source),
			format: "module"
		};
		if (read?.format !== "commonjs") return read;
		return {
			source: CommonJsModule.of(url, this.#host).source,
			format: "module"
		};
	}
	#resolving(source) {
		const global = globalThis;
		global[Symbol.for(RESOLVER)] = this.#resolver;
		return source.replace(new RegExp(RESOLVE.source, "g"), `globalThis[Symbol.for(${JSON.stringify(RESOLVER)})](import.meta.url, `);
	}
	#resolver = (parentURL, specifier) => {
		const resolved = this.resolve(specifier, parentURL);
		if (resolved !== void 0) return resolved;
		if (/^\.{0,2}\//.test(specifier) || /^[a-z][a-z\d+.-]*:/i.test(specifier)) return new URL(specifier, parentURL).href;
		if (this.#isBuiltin(specifier)) return specifier.startsWith("node:") ? specifier : `node:${specifier}`;
		throw new Error(`no ${specifier} to resolve from ${parentURL}`);
	};
	#host = {
		read: (url) => this.#read(url),
		fileOf: (url) => this.fileOf(url),
		required: (specifier, parentURL) => this.#required(specifier, parentURL),
		esm: (url) => this.#esm(url)
	};
	#read(url) {
		const file = this.fileOf(url);
		const importer = this.#packageOf(file);
		if (file === void 0 || importer === void 0 || !file.exists || file.path.endsWith(".node")) return void 0;
		const source = file.readText();
		if (file.path.endsWith(".json")) return {
			source,
			format: "json"
		};
		if (file.path.endsWith(".mjs")) return {
			source,
			format: "module"
		};
		if (file.path.endsWith(".cjs")) return {
			source,
			format: "commonjs"
		};
		const type = NodeNpmHook.#governing(file, importer.folder.folder("package"))?.readJsonObject().type;
		return {
			source,
			format: type === "commonjs" ? "commonjs" : type === "module" || NodeNpmHook.looksLikeModule(source) ? "module" : "commonjs"
		};
	}
	static #governing(file, root) {
		for (let folder = file.parent; folder !== void 0 && folder.path.startsWith(root.path); folder = folder.parent) {
			if (folder.file("package.json").exists) return folder.file("package.json");
			if (folder.path === root.path) break;
		}
	}
	static looksLikeModule(source) {
		return !CommonJsModule.runs(source);
	}
	#paths = process.getBuiltinModule("node:path");
	#modules = process.getBuiltinModule("node:module");
	/** The stores in the order they are read, asked at each import. */
	#stores() {
		return NodeStores.of().all;
	}
	/**
	* The file a `file:` URL names. A runtime gives a file it reached by a relative import under its real path, so
	* inside a store reached through a link the store's own path is given back.
	* Law: `fileOf(url(file))` is `file`.
	*/
	fileOf(url) {
		if (!url.startsWith("file:")) return void 0;
		const path = this.#given(ReadOnlyNodeFolder.fromUrl(url).path);
		return ReadOnlyNodeFolder.native(this.#paths.dirname(path)).file(this.#paths.basename(path));
	}
	/** The URL the runtime loads a file by. */
	url(file) {
		return ReadOnlyNodeFolder.urlOf(file);
	}
	/** Whether a bare specifier names a module of the runtime's own, such as `fs`. */
	#isBuiltin(specifier) {
		return this.#modules.isBuiltin(specifier);
	}
	/** A module of the runtime's own, as a `require` of it hands it. */
	#builtin(specifier) {
		return process.getBuiltinModule(specifier);
	}
	/** What a stored CommonJS module's `require` of an ES module hands back. */
	#esm(url) {
		return this.#modules.createRequire(url)(ReadOnlyNodeFolder.fromUrl(url).path);
	}
	#conditions(kind) {
		return [
			kind,
			...this.model.conditions,
			"default"
		];
	}
	#entry(name, ref, subpath, kind) {
		const homes = this.#stores().map((store) => store.folder(`npm/${name}`));
		const version = new Releases(homes.flatMap((home) => home.entries.map((version) => version.name))).named(ref);
		const trees = version === void 0 ? [] : homes.map((home) => home.folder(`${version}/package`));
		const tree = trees.find((folder) => folder.exists);
		if (tree === void 0) {
			const looked = (trees.length === 0 ? homes : trees).map((folder) => folder.path);
			throw new Error(`no ${ref ?? "latest"} of npm/${name}, looked in: ${looked.join(", ") || "no store"}`);
		}
		const manifest = new PackageManifest(tree.file("package.json"));
		const path = manifest.entry(subpath, this.#conditions(kind));
		if (path === void 0) throw new Error(`npm/${name}@${version} exports no ${subpath}`);
		if (kind === "require" && manifest.model.exports === void 0) return this.#relative(`./${path}`, this.url(tree.file("package.json")));
		const file = tree.file(path);
		if (!file.exists) throw new Error(`no ${file.path} for npm/${name}@${version}`);
		return this.url(file);
	}
	#imported(specifier, parentURL, kind) {
		const file = this.fileOf(parentURL);
		const importer = this.#packageOf(file);
		if (file === void 0 || importer === void 0) return void 0;
		const manifest = NodeNpmHook.#governing(file, importer.folder.folder("package"));
		if (manifest === void 0) throw new Error(`no package.json above ${file.path} maps ${specifier}`);
		const target = new PackageManifest(manifest).import(specifier, this.#conditions(kind));
		if (target === void 0) throw new Error(`${manifest.path} imports no ${specifier}`);
		if (!target.startsWith("./")) return this.#resolved(target, parentURL, kind);
		const imported = manifest.parent.file(target.slice(2));
		if (!imported.exists) throw new Error(`no ${imported.path} for ${specifier} of npm/${importer.name}@${importer.version}`);
		return this.url(imported);
	}
	#required(specifier, parentURL) {
		if (specifier.startsWith("node:") || BareSpecifier.is(specifier) && this.#isBuiltin(specifier)) return { builtin: this.#builtin(specifier) };
		if (/^(\.{1,2}(\/|$)|\/)/.test(specifier)) return { url: this.#relative(specifier, parentURL) };
		const url = this.#resolved(specifier, parentURL, "require");
		if (url === void 0) throw new Error(`no ${specifier}, required by ${parentURL}`);
		return { url };
	}
	#relative(specifier, parentURL) {
		const base = new URL(specifier, parentURL).href.replace(/\/$/, "");
		for (const ending of [
			"",
			".js",
			".json",
			".cjs",
			"/index.js",
			"/index.json"
		]) {
			const file = this.fileOf(`${base}${ending}`);
			if (file?.exists) return this.url(file);
			if (ending === ".cjs") {
				const manifest = this.fileOf(`${base}/package.json`);
				const main = manifest?.exists ? new PackageManifest(manifest).model.main : void 0;
				if (typeof main === "string") for (const tried of [
					"",
					".js",
					"/index.js"
				]) {
					const entry = this.fileOf(`${new URL(main, `${base}/`).href.replace(/\/$/, "")}${tried}`);
					if (entry?.exists) return this.url(entry);
				}
			}
		}
		throw new Error(`no file for ${specifier}, required by ${parentURL}`);
	}
	static #used(descriptor) {
		const used = /* @__PURE__ */ new Map();
		if (!descriptor.exists) return used;
		const uses = descriptor.readJsonObject().uses;
		if (uses === void 0) return used;
		if (!Array.isArray(uses)) throw new Error(`uses is no list in ${descriptor.path}`);
		for (const id of uses) {
			const iri = typeof id === "string" ? OFieldIri.of(id)?.model : void 0;
			if (iri?.namespace !== "npm" || iri.ref === void 0) throw new Error(`no npm package at a version in the uses of ${descriptor.path}: ${JSON.stringify(id)}`);
			used.set(iri.name, iri.ref);
		}
		return used;
	}
	#packageOf(file) {
		if (file === void 0) return void 0;
		for (const store of this.#stores()) {
			if (!file.path.startsWith(`${store.path}/`)) continue;
			const match = NodeNpmHook.stored.exec(file.path.slice(store.path.length));
			if (match?.index === 0) return {
				folder: store.folder(`npm/${match[1]}/${match[2]}`),
				name: match[1],
				version: match[2]
			};
		}
	}
	#given(path) {
		if (!NodeNpmHook.stored.test(path)) return path;
		for (const store of this.#stores()) {
			const real = new ReadOnlyNodeFolder(store.path).real.path;
			if (real !== store.path && path.startsWith(`${real}/`)) return `${store.path}${path.slice(real.length)}`;
		}
		return path;
	}
};
const RESOLVE = /\bimport\.meta\.resolve\s*\(/;
const RESOLVER = "metatrom.oField.resolve";
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/0field/BuiltWorkbench.ts
/**
* Purpose: let a SmartObject run where no store is, from the workbench its
* build carries.
*
* Intention: one is the {@link Workbench} a built SmartObject carries —
* its `workbench.jsonld` as text, the classes it lists and its data files —
* registered by the build as it loads, for the realm. In Node, Deno and
* Bun the kernel asks it for a type's class and fills none of it, and the
* storage reads, finds and lists its texts there, before any store.
*/
var BuiltWorkbench = class BuiltWorkbench extends TypedSmartObject {
	static #registered = /* @__PURE__ */ new Map();
	#carried = {
		files: /* @__PURE__ */ new Map(),
		classes: /* @__PURE__ */ new Map()
	};
	/**
	* Registers the workbench a built SmartObject carries, called by the build as it loads: its `workbench.jsonld` as
	* text, the class of each descriptor that lists in `classes` — `X.descriptor.jsonld`'s by `X`, the path its type names
	* within the workbench — and each data file by its path. In Node, Deno and Bun what it carries is then read from here
	* before any store, and counted as held when the kernel fills the stores. Each text is kept as a stored one is read, a
	* leading byte order mark dropped, and the one registered holds in its model the `@id` and the version its text
	* names. Refused, naming it, where the text names no workbench by an oField IRI of its own
	* or lists its classes as anything but descriptor paths, where a class it lists is not carried, where a file's path is
	* no plain path within the workbench — `./`, `..`, `\`, a leading or a doubled `/` — or is its `workbench.jsonld`,
	* and where another text of that workbench is registered already; the same texts again leave the first registration
	* as it is, its classes the ones answered.
	*/
	static use({ workbench: given, classes, files = {} }) {
		const workbench = unmarked(given);
		let model;
		try {
			model = JSON.parse(workbench);
		} catch (cause) {
			throw new Error("a built workbench.jsonld is JSON", { cause });
		}
		if (typeof model !== "object" || model === null || Array.isArray(model)) throw new Error(`a built workbench.jsonld is a JSON object: ${workbench}`);
		const { "@id": id, classes: listed } = model;
		const named = typeof id === "string" ? OFieldIri.of(id)?.model : void 0;
		if (typeof id !== "string" || named === void 0 || named.namespace === "npm" || named.source !== void 0 || named.ref !== void 0 || named.subpath !== void 0) throw new Error(`a built workbench.jsonld names its workbench by an @id, ofield://<namespace>/<Name>: ${String(id)}`);
		if (listed !== void 0 && !(Array.isArray(listed) && listed.every((each) => typeof each === "string"))) throw new Error(`${id} lists its classes as descriptor paths`);
		for (const descriptor of listed ?? []) {
			const path = descriptor.replace(/\.descriptor\.jsonld$/, "");
			if (!Object.hasOwn(classes, path) || typeof classes[path] !== "function") throw new Error(`${id} lists the class ${path}, which its build does not carry`);
		}
		for (const path of Object.keys(files)) {
			if (path === "workbench.jsonld") throw new Error(`${id} carries its workbench.jsonld as its workbench, not among its files`);
			if (path.includes("\\") || path.split("/").some((segment) => segment === "" || segment === "." || segment === "..")) throw new Error(`${id} carries a file at ${path}, no plain path within it`);
		}
		const carried = new Map([...Object.entries(files).map(([path, text]) => [path, unmarked(text)]), ["workbench.jsonld", workbench]]);
		const key = `${named.namespace}/${named.name}`;
		const held = BuiltWorkbench.#registered.get(key)?.files;
		if (held !== void 0) {
			if (held.size === carried.size && [...carried].every(([path, text]) => held.get(path) === text)) return;
			throw new Error(`${id} is registered already by another build, which carries other texts`);
		}
		const { version } = model;
		const built = new BuiltWorkbench({
			"@id": id,
			...typeof version === "string" ? { version } : {}
		});
		built.#carried = {
			files: carried,
			classes: new Map(Object.entries(classes))
		};
		BuiltWorkbench.#registered.set(key, built);
	}
	/**
	* The workbench a build registered that an oField IRI names, by its `@id`: at no ref, at `latest`, or at its own
	* version's tag, `v<version>`, or a range holding that version; none for any other ref, a branch, a sha or a data ref
	* among them, and for an IRI of no registered workbench.
	*/
	static of(iri) {
		const named = OFieldIri.of(iri)?.model;
		if (named === void 0 || named.source !== void 0) return void 0;
		const built = BuiltWorkbench.#registered.get(`${named.namespace}/${named.name}`);
		if (built === void 0) return void 0;
		const { ref } = named;
		if (ref === void 0 || ref === "latest") return built;
		const { version } = built.model;
		const tag = `v${version}`;
		return typeof version === "string" && new Releases([tag]).named(ref) === tag ? built : void 0;
	}
	/** The texts its build carries, by their path within the workbench — its `workbench.jsonld` among them. */
	get files() {
		return this.#carried.files;
	}
	/** The classes its build carries, by the path a type names within the workbench. */
	get classes() {
		return this.#carried.classes;
	}
};
function unmarked(text) {
	return text.startsWith("﻿") ? text.slice(1) : text;
}
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/file-system/git/GitNotes.ts
/**
* Purpose: say where in a notes tree the note of a commit stands, whether git
* has fanned the tree out or not.
*
* Intention: a notes ref's tree as git keeps it, read as a {@link Folder}: a
* note is named by its commit's sha, and git splits that name into leading
* two-character folders, to any depth, as the tree grows. A storage of a
* notes ref asks it for the path of a note, and for the sha a path names.
*/
var GitNotes = class GitNotes extends TypedSmartObject {
	#folder;
	/** The notes tree at a folder. */
	constructor(folder) {
		super({ path: folder.path });
		this.#folder = folder;
	}
	/** Whether a ref holds notes, as git's `refs/notes/` does. */
	static held(ref) {
		return ref?.startsWith("refs/notes/") ?? false;
	}
	/** Whether a name is a note's: a commit's sha in full, SHA-1 or SHA-256, as git writes it. */
	static names(name) {
		return /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(name);
	}
	/**
	* The path of the note named by a sha: where it stands, flat or fanned out to whatever depth; where there is none,
	* where a new one goes — as deep as the notes already there are fanned out, flat in a tree with no fan-out.
	*/
	pathOf(sha) {
		if (!GitNotes.names(sha)) throw new Error(`a note is named by a commit's full sha: ${sha}`);
		const deepest = sha.length / 2 - 1;
		for (let depth = 0; depth <= deepest; depth++) {
			const path = GitNotes.#fanned(sha, depth);
			if (this.#folder.file(path).exists) return path;
		}
		return GitNotes.#fanned(sha, this.#depth(deepest));
	}
	/**
	* The sha a path below the tree names, its folders joined to the file's name; none for a path that is no note's,
	* a fan-out folder being no note.
	*/
	static shaOf(path) {
		const names = path.split("/");
		if (!names.slice(0, -1).every((name) => /^[0-9a-f]{2}$/.test(name))) return void 0;
		const sha = names.join("");
		return GitNotes.names(sha) ? sha : void 0;
	}
	#depth(deepest) {
		let at = this.#folder;
		let depth = 0;
		while (depth < deepest) {
			const next = at.entries.find((entry) => isFolder(entry) && /^[0-9a-f]{2}$/.test(entry.name));
			if (next === void 0) break;
			at = next;
			depth++;
		}
		return depth;
	}
	static #fanned(sha, depth) {
		return [...Array.from({ length: depth }, (_, level) => sha.slice(level * 2, level * 2 + 2)), sha.slice(depth * 2)].join("/");
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/habitats/node/loading/NodeOFieldHook.ts
/**
* Purpose: load a SmartObject by its oField IRI from this host's disk.
*
* Intention: realizes {@link ModuleHook} for the `ofield` scheme over Node's
* API — {@link NodeStores}, {@link ReadOnlyNodeFolder} — which Node, Deno and
* Bun all implement, leaving to the runtime loading the file it resolves. It
* reads a URI as an {@link OFieldIri}, a range through {@link Releases}, a
* branch from the {@link Workbench} the importing file belongs to, and a tag, or
* a URI naming no ref, by the {@link Tags} of each store.
*/
var NodeOFieldHook = class extends TypedSmartObject {
	name = "ofield";
	schemes = ["ofield"];
	/**
	* The file an oField IRI names: a tag or a sha from the stores, a range as the highest release of every store's tags
	* within it; a branch from the {@link Workbench} the importing file belongs to, which also names the branch taken when
	* the URI names no ref; the importing file's own workbench, named with no ref, from the working tree it stands in;
	* elsewhere no ref, or `latest`, is the latest release the stores hold. `ofield://npm/…` it passes on.
	*/
	resolve(specifier, parentURL) {
		if (!specifier.startsWith("ofield:")) return void 0;
		const iri = new OFieldIri(specifier);
		if (iri.model.namespace === "npm") return void 0;
		const entry = this.tree(specifier, parentURL).file(entryOf(iri));
		if (!entry.exists) throw new Error(`no ${entry.path} for ${specifier}`);
		return this.url(entry);
	}
	/**
	* The tree an oField IRI names on this host, as {@link NodeOFieldHook.resolve} finds it, whatever its subpath; refused,
	* naming where it looked, where there is none.
	*/
	tree(specifier, parentURL) {
		const { tree, missing } = this.#lookup(specifier, parentURL);
		if (tree === void 0) throw new Error(missing());
		return tree;
	}
	/** The tree an oField IRI names on this host, as {@link NodeOFieldHook.tree} finds it; none where this host holds none. */
	find(specifier, parentURL) {
		return this.#lookup(specifier, parentURL).tree;
	}
	#lookup(specifier, parentURL) {
		const { source, namespace, name, ref } = new OFieldIri(specifier).model;
		if (source !== void 0) throw new Error(`oField sources are not read yet: ${source}`);
		const id = `${namespace}/${name}`;
		const repository = Workbench.above(parentURL === void 0 ? void 0 : this.folderOf(parentURL));
		const own = ref === void 0 ? repository?.own(id) : void 0;
		if (own !== void 0) return {
			tree: own,
			missing: () => ""
		};
		const wanted = ref ?? repository?.branch(id);
		const stores = this.stores();
		const homes = stores.map((store) => store.folder(`0field/${id}`));
		const tags = new Map(stores.flatMap((store) => Object.entries(new Tags(store, id).model)));
		const latest = wanted === void 0 || wanted === "latest";
		const range = !latest && Releases.range.test(wanted);
		const tag = new Releases([...tags.keys()]).named(wanted);
		const sha = tag === void 0 ? void 0 : tags.get(tag) ?? (latest ? void 0 : tag);
		const branch = latest || range || tags.has(wanted) ? void 0 : wanted;
		const checkout = branch === void 0 ? void 0 : repository?.checkout(id, branch);
		const trees = [...sha === void 0 ? [] : homes.map((home) => home.folder(sha)), ...checkout === void 0 ? [] : [checkout]];
		const tree = trees.find((folder) => folder.exists);
		const missing = () => {
			const looked = [...homes, ...trees].map((entry) => entry.path);
			const unlisted = branch === void 0 ? "" : repository === void 0 ? "; no repository above the importing file" : checkout === void 0 ? `; git lists no checkout of ${id} on ${branch} in ${repository.path}` : "";
			return `no ${wanted ?? "latest"} of ${id}, looked in: ${looked.join(", ") || "no store"}${unlisted}`;
		};
		return {
			tree,
			missing
		};
	}
	/** The stores in the order they are read, asked at each import. */
	stores() {
		return NodeStores.of().all;
	}
	/**
	* The folder holding the file a URL names, when it names one on this host.
	* Law: `folderOf(url(file))` holds `file`, `url(folderOf(url(file)).file(file.name))` being `url(file)` — sampled
	* in `NodeOFieldHook.test.ts`.
	*/
	folderOf(url) {
		return url.startsWith("file:") ? ReadOnlyNodeFolder.fromUrl(url).parent : void 0;
	}
	/**
	* The `file:` URL of a file: by its real path where its runtime loads by real paths, so one file is one module
	* however it is reached; elsewhere by the path it is named by.
	*/
	url(file) {
		return ReadOnlyNodeFolder.urlOf(this.model.realPaths ? ReadOnlyNodeFolder.native(file.path).real : file);
	}
};
/** The file an oField IRI names within its tree: its subpath, or, naming none, the workbench's own SmartObject `<Name>.ts`. */
function entryOf(iri) {
	return iri.model.subpath ?? `${iri.model.name}.ts`;
}
/**
* The descriptor of what an oField IRI names within its tree: the descriptor it names, the one beside the file it names,
* or, where it names a data file, that of the workbench's own SmartObject.
*/
function descriptorOf(iri) {
	const entry = entryOf(iri);
	if (entry.endsWith(".descriptor.jsonld")) return entry;
	if (/\.jsonld?$/.test(entry)) return `${iri.model.name}.descriptor.jsonld`;
	return descriptorBeside(entry) ?? `${entry}.descriptor.jsonld`;
}
/** The descriptor beside a module's file, by its path or name; none where it names no module. */
function descriptorBeside(path) {
	return /\.[jt]sx?$/.test(path) ? `${path.replace(/\.[jt]sx?$/, "")}.descriptor.jsonld` : void 0;
}
//#endregion
//#region dependencies/metatrom-ag/Manu/main/habitats/node/file-system/ReadOnlyNodeStorage.ts
/**
* Purpose: find what a SmartObject is stored as on this host's disk, and
* there the repositories that are SmartObjects themselves.
*
* Intention: has the shape of the storage a Persistence uses, over
* Node's API, which Node, Deno and Bun all implement. It finds a tree
* through the {@link NodeOFieldHook}, an npm package's version through
* {@link NodeStores} and {@link Releases}, realizes a repository's root as
* its {@link Workbench}, and finds a note of a notes ref through {@link GitNotes}.
* What a build carries of a workbench it registered, a
* {@link BuiltWorkbench}, is read from there, before any tree.
*/
var ReadOnlyNodeStorage = class ReadOnlyNodeStorage extends TypedSmartObject {
	/**
	* The location an address names: an oField IRI as it stands, refused unless in canonical form, a path or a `file:` URL
	* as its `file:` URL, a fragment dropped; no other scheme is read.
	*/
	location(address) {
		if (address === "") throw new Error("an empty address names no model");
		if (address.startsWith("ofield:")) {
			const located = address.split("#")[0];
			if (ReadOnlyNodeStorage.#npm(located) === void 0) this.#parsed(located);
			return new OFieldIri(located).toString();
		}
		const scheme = /^([A-Za-z][A-Za-z\d+.-]+):/.exec(address)?.[1];
		if (scheme !== void 0 && scheme.toLowerCase() !== "file") throw new Error(`no storage here reads ${scheme}: ${address}`);
		const url = new URL(/^file:/i.test(address) ? address : ReadOnlyNodeFolder.urlOf(ReadOnlyNodeFolder.native(address)));
		if (url.search !== "") throw new Error(`a query names no file: ${address}`);
		url.hash = "";
		return url.href;
	}
	/**
	* Whether a text is stored at a location; none is where this host holds no tree the location names. A location in a
	* workbench a build registered is answered by what that build carries alone.
	*/
	async has(location) {
		return this.hasSync(location);
	}
	/** {@link ReadOnlyNodeStorage.has}, answered at once. */
	hasSync(location) {
		if (!location.startsWith("ofield:")) return new ReadOnlyNodeFile(ReadOnlyNodeFolder.fromUrl(location).path).exists;
		const built = this.#built(location);
		if (built !== void 0) return built.path !== void 0 && built.files.has(built.path);
		const npm = ReadOnlyNodeStorage.#npm(location);
		if (npm !== void 0) return this.#described(npm) !== void 0;
		const { subpath, tree: address } = this.#parsed(location);
		const tree = new NodeOFieldHook().find(location, this.model.main);
		return tree !== void 0 && subpath !== void 0 && tree.file(ReadOnlyNodeStorage.#noted(tree, address.ref, subpath)).exists;
	}
	/**
	* Whether a location names a repository by its root — a `file:` URL, or an oField IRI naming no subpath whose tree is
	* a git checkout; a tree in the stores holds no `.git`, whatever it commits, and is none.
	*/
	realizes(location) {
		const folder = this.#folder(location);
		return folder !== void 0 && Workbench.above(folder)?.path === folder.path;
	}
	/**
	* The Workbench a location names by its root, named by its root's real `file:` URL, so every address of one names
	* one, however a link on the way spells it; refused for a folder below a root, naming the root.
	*/
	realized(location) {
		const folder = this.#folder(location);
		const repository = folder === void 0 ? void 0 : Workbench.above(folder);
		if (folder === void 0 || repository === void 0) throw new Error(`no repository's root at ${location}`);
		if (repository.path !== folder.path) throw new Error(this.#below(location, repository));
		return Workbench.at(folder, ReadOnlyNodeFolder.urlOf(folder));
	}
	#folder(location) {
		let named;
		if (location.startsWith("ofield:")) {
			if (ReadOnlyNodeStorage.#npm(location) !== void 0 || new OFieldIri(location).model.source !== void 0) return void 0;
			if (this.#parsed(location).subpath !== void 0) return void 0;
			const tree = new NodeOFieldHook().find(location, this.model.main);
			if (tree === void 0 || !(tree.folder(".git").exists || tree.file(".git").exists)) return void 0;
			named = ReadOnlyNodeFolder.native(tree.path);
		} else named = ReadOnlyNodeFolder.fromUrl(location);
		try {
			const real = named.real;
			return real.exists ? real : void 0;
		} catch {
			return;
		}
	}
	#below(location, repository) {
		return `${location} lies in the repository at ${repository.path}, which is named by its root`;
	}
	/**
	* The text at a location, read as UTF-8. An oField IRI names a file in the tree the {@link NodeOFieldHook} finds for
	* it from the started file's place: a tag or a sha in the stores, a branch in its repository. An npm package's,
	* `ofield://npm/<name>@<ref>`, names instead the node describing a version, `npm/<name>/<version>.descriptor.jsonld`,
	* beside the version folder its ref names among those the stores describe: exact, the highest within a range, the
	* latest for none, as {@link Releases} reads a ref. A file of the package names none. A location in a workbench a
	* build registered is the text that build carries there, refused where it carries none.
	*/
	async get(location) {
		return this.getSync(location);
	}
	/** {@link ReadOnlyNodeStorage.get}, answered at once. */
	getSync(location) {
		const built = this.#built(location);
		if (built !== void 0) {
			const text = built.path === void 0 ? void 0 : built.files.get(built.path);
			if (text === void 0) throw new Error(`no model at ${location}`);
			return text;
		}
		const file = this.#file(location);
		if (!file.exists) {
			const folder = location.startsWith("ofield:") ? void 0 : this.#folder(location);
			const repository = folder === void 0 ? void 0 : Workbench.above(folder);
			throw new Error(repository === void 0 || repository.path === folder?.path ? `no model at ${location}` : this.#below(location, repository));
		}
		const bytes = file.read();
		try {
			return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
		} catch (error) {
			throw new Error(`a model is UTF-8: ${location}`, { cause: error });
		}
	}
	/**
	* The location of every text below an address, sorted: every name beginning with `.` skipped — a worktree's `.git`
	* among them — and, in a tree, every name an oField IRI cannot hold as it stands, one with `#`, `%` or `?`. Below an
	* address in a workbench a build registered, what that build carries there, refused where it carries nothing.
	*/
	async list(address) {
		return this.listSync(address);
	}
	/** {@link ReadOnlyNodeStorage.list}, answered at once. */
	listSync(address) {
		const located = this.location(address);
		const built = this.#built(located);
		if (built !== void 0) {
			const { tree } = this.#parsed(located);
			const below = built.path === void 0 ? "" : `${built.path}/`;
			const paths = [...built.files.keys()].filter((path) => path.startsWith(below) && !/(^|\/)\.|[#%?]/.test(path));
			if (paths.length === 0) throw new Error(`no folder at ${located}`);
			return paths.map((path) => new OFieldIri({
				...tree,
				subpath: path
			}).toString()).sort();
		}
		const { folder, at, held } = located.startsWith("ofield:") ? this.#oFieldFolder(located) : {
			folder: ReadOnlyNodeFolder.fromUrl(located),
			at: (file) => ReadOnlyNodeFolder.urlOf(file),
			held: () => true
		};
		if (!folder.exists) throw new Error(`no folder at ${located}`);
		return [...new Set([...stored(folder)].filter(held).map(at))].sort();
	}
	#built(location) {
		if (!location.startsWith("ofield:")) return void 0;
		const built = BuiltWorkbench.of(location);
		return built === void 0 ? void 0 : {
			files: built.files,
			path: this.#parsed(location).subpath
		};
	}
	#file(location) {
		if (!location.startsWith("ofield:")) return new ReadOnlyNodeFile(ReadOnlyNodeFolder.fromUrl(location).path);
		const npm = ReadOnlyNodeStorage.#npm(location);
		if (npm !== void 0) {
			const described = this.#described(npm);
			if (described === void 0) throw new Error(`no model at ${location}`);
			return described;
		}
		const { tree, subpath } = this.#tree(location);
		if (subpath === void 0) throw new Error(`an oField URI names a model by its subpath: ${location}`);
		return tree.file(subpath);
	}
	#oFieldFolder(location) {
		const { tree, subpath, address } = this.#tree(location);
		const folder = subpath === void 0 ? tree : tree.folder(subpath);
		const notes = GitNotes.held(address.ref) && subpath === void 0;
		const named = (below) => notes ? GitNotes.shaOf(below) ?? below : below;
		return {
			folder,
			at: (file) => `${new OFieldIri({
				...address,
				subpath: named(file.path.slice(tree.path.length + 1))
			})}`,
			held: (file) => !/[#%?]/.test(file.path.slice(tree.path.length + 1))
		};
	}
	#tree(location) {
		const { subpath, tree } = this.#parsed(location);
		const folder = new NodeOFieldHook().tree(location, this.model.main);
		return {
			tree: folder,
			subpath: subpath === void 0 ? void 0 : ReadOnlyNodeStorage.#noted(folder, tree.ref, subpath),
			address: tree
		};
	}
	static #npm(location) {
		const { source, namespace, name, ref, subpath } = new OFieldIri(location).model;
		if (namespace !== "npm") return void 0;
		if (source !== void 0 || subpath !== void 0) throw new Error(`a model is stored with a SmartObject, or as an npm package, not in an npm package: ${location}`);
		return {
			name,
			ref
		};
	}
	#described({ name, ref }) {
		const suffix = ".descriptor.jsonld";
		const nodes = NodeStores.of().all.flatMap((store) => {
			return store.folder(`npm/${name}`).entries.filter((entry) => entry.name.endsWith(suffix)).map((entry) => entry);
		});
		const version = new Releases(nodes.map((node) => node.name.slice(0, -18))).named(ref);
		return nodes.find((node) => node.name === `${version}${suffix}`);
	}
	#parsed(address) {
		const { subpath, ...tree } = new OFieldIri(address.split("#")[0]).model;
		if (tree.namespace === "npm") throw new Error(`a model is stored with a SmartObject, not in an npm package: ${address}`);
		if (subpath !== void 0 && /[%?]/.test(subpath)) throw new Error(`a model's subpath holds no % or ?: ${address}`);
		return {
			subpath,
			tree
		};
	}
	static #noted(tree, ref, subpath) {
		return GitNotes.held(ref) && GitNotes.names(subpath) ? new GitNotes(tree).pathOf(subpath) : subpath;
	}
};
function* stored(folder) {
	for (const entry of folder.entries.filter((entry) => !entry.name.startsWith("."))) if (entry instanceof ReadOnlyNodeFolder) yield* stored(entry);
	else yield entry;
}
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/persistence/relations/Arcs.ts
/**
* Purpose: lead from one SmartObject to SmartObjects of one class, by the
* ids its model names.
*
* Intention: the abstract SmartObject a relation extends with the shape of
* its model; uses a {@link Restoring}, and names no format and no
* storage.
*/
var Arcs = class Arcs extends TypedSmartObject.Class {
	static #restoring;
	static #made = /* @__PURE__ */ new WeakMap();
	#type;
	#from;
	/**
	* The arcs its data names, to SmartObjects of `type`. Each is created, once per id, by the {@link Restoring} that
	* made `from` — where a persistence said so through {@link Arcs.made} — else by the process's one, put in use by
	* {@link Arcs.use}, so a link resolves where its data came from and a cycle of relations is walked like any graph;
	* one of another class is refused, as what is restored is input. Given `from` in place of `type`, its class is named
	* as a type alone, where importing its value would load a second copy of it or fail: what is restored is checked as
	* a SmartObject, its class the one its stored `@type` names.
	*/
	constructor(model, type, from) {
		super(model);
		const named = typeof type === "function";
		this.#type = named ? type : TypedSmartObject;
		this.#from = named ? from : type;
	}
	/** Makes `restoring` the one every relation of this process creates its SmartObjects by. */
	static use(restoring) {
		Arcs.#restoring = restoring;
	}
	/** Records that `restoring` made a SmartObject, so the relations it comes from restore through that one. */
	static made(made, restoring) {
		Arcs.#made.set(made, restoring);
	}
	/**
	* The SmartObject of `type` an id names, created by `from` where it is a {@link Restoring} — a persistence kept for
	* another repository — else by the one that made `from`, else by this process's — only of a vocabulary's types,
	* where one is named; refused before one is in use, or where it is of another class.
	*/
	static async restore(id, type, vocabulary, from) {
		const restored = await Arcs.#by(id, from).restore(id, vocabulary);
		if (!(restored instanceof type)) throw new TypeError(`${id} restores as a ${restored.constructor.name}, not a ${type.name}`);
		return restored;
	}
	/** Whether anything is stored at an id, as `from` tells it where it is a {@link Restoring}, else the one that made it, else this process's. */
	static has(id, from) {
		return Arcs.#by(id, from).has(id);
	}
	static #by(id, from) {
		const restoring = (from instanceof TypedSmartObject ? Arcs.#made.get(from) : void 0) ?? (Arcs.#restores(from) ? from : void 0) ?? Arcs.#restoring;
		if (restoring === void 0) throw new Error(`no persistence restores ${id}: the 0field has not started one`);
		return restoring;
	}
	static #restores(given) {
		return typeof given?.restore === "function" && typeof given.has === "function";
	}
	/** Whether a value can be the id of a SmartObject: a string, not empty. */
	static isId(value) {
		return typeof value === "string" && value !== "";
	}
	/** The SmartObject at the head of the arc an id names. */
	head(id) {
		return Arcs.restore(id, this.#type, void 0, this.#from);
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/persistence/relations/Relation.ts
/**
* Purpose: reach the one SmartObject a model names.
*
* Intention: the {@link Arcs} of one id, its model a relation's data.
*/
var Relation = class Relation extends Arcs {
	constructor(model, type, from) {
		if (!Relation.isId(model?.relation)) throw new TypeError(`a Relation names the id of a SmartObject, { "relation": <id> }: ${JSON.stringify(model)}`);
		super(model, type, from);
	}
	/** The SmartObject it names, created only when asked for. */
	get() {
		return this.head(this.model.relation);
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/persistence/relations/RelationList.ts
/**
* Purpose: reach the SmartObjects a model names, in their order.
*
* Intention: the {@link Arcs} of ids in order, its model a list.
*/
var RelationList = class extends Arcs {
	constructor(model, type, from) {
		if (!Array.isArray(model?.list) || !model.list.every(Arcs.isId)) throw new TypeError(`a RelationList names the ids of SmartObjects in order, { "list": [<id>, …] }: ${JSON.stringify(model)}`);
		super(model, type, from);
	}
	/** How many it names. */
	get length() {
		return this.model.list.length;
	}
	/** The SmartObject at a place, counted from 0; refused where it names none. */
	at(index) {
		const id = this.model.list[index];
		return id === void 0 ? Promise.reject(/* @__PURE__ */ new RangeError(`a RelationList of ${this.length} has no place ${index}`)) : this.head(id);
	}
	/** Each SmartObject in order, created as it is reached, a repeated id the same SmartObject. */
	async *[Symbol.asyncIterator]() {
		for (const id of this.model.list) yield await this.head(id);
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/persistence/relations/RelationMap.ts
/**
* Purpose: reach the SmartObjects a model names, each by its key.
*
* Intention: the {@link Arcs} of ids by key, its model a map.
*/
var RelationMap = class extends Arcs {
	constructor(model, type, from) {
		const map = model?.map;
		if (typeof map !== "object" || map === null || Array.isArray(map) || !Object.values(map).every(Arcs.isId)) throw new TypeError(`a RelationMap names the ids of SmartObjects by key, { "map": { <key>: <id> } }: ${JSON.stringify(model)}`);
		super(model, type, from);
	}
	/** The keys it names a SmartObject by. */
	get keys() {
		return Object.keys(this.model.map);
	}
	/** The SmartObject of a key; refused where the key names none. */
	get(key) {
		const id = Object.hasOwn(this.model.map, key) ? this.model.map[key] : void 0;
		return id === void 0 ? Promise.reject(/* @__PURE__ */ new RangeError(`a RelationMap has no key ${JSON.stringify(key)}`)) : this.head(id);
	}
	/** Each SmartObject with its key, created as it is reached. */
	async *[Symbol.asyncIterator]() {
		for (const [key, id] of Object.entries(this.model.map)) yield [key, await this.head(id)];
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/persistence/relations/RelationSet.ts
/**
* Purpose: reach the SmartObjects a model names, each once.
*
* Intention: the {@link Arcs} of ids each named once, its model a set.
*/
var RelationSet = class extends Arcs {
	constructor(model, type, from) {
		if (!Array.isArray(model?.set) || !model.set.every(Arcs.isId)) throw new TypeError(`a RelationSet names the ids of SmartObjects, { "set": [<id>, …] }: ${JSON.stringify(model)}`);
		const seen = /* @__PURE__ */ new Set();
		const twice = model.set.find((id) => seen.size === seen.add(id).size);
		if (twice !== void 0) throw new TypeError(`a RelationSet names each SmartObject once, ${twice} twice`);
		super(model, type, from);
	}
	/** How many it names. */
	get size() {
		return this.model.set.length;
	}
	/** Whether it names the SmartObject of an id. */
	has(id) {
		return this.model.set.includes(id);
	}
	/** Each SmartObject, created as it is reached. */
	async *[Symbol.asyncIterator]() {
		for (const id of this.model.set) yield await this.head(id);
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/persistence/JsonLd.ts
/**
* Purpose: hold a SmartObject's model and type as the JSON-LD a node is
* stored as.
*
* Intention: what a `Persistence` reads and writes a stored text
* with, each the other's inverse, but for an empty RelationMap under no
* `@index` term, which reads back as an empty RelationSet; its links are the data of
* {@link Relation}, {@link RelationList}, {@link RelationSet} and
* {@link RelationMap}, its ids {@link OFieldIri}s where they name the 0field.
* A {@link Workbench} is the one node that carries its own `@context`, the
* dictionary of its words, which a node naming it reads its terms through.
*/
var JsonLd = class JsonLd extends TypedSmartObject {
	/** The deepest a node nests its arrays and objects. */
	static depth = 128;
	/**
	* The type and model of the node a text holds, read from `location`; `context` hands out the text held at an
	* address. Refused, naming the location, where the text holds no node.
	*
	* A node is one JSON object, nesting at most {@link JsonLd.depth} deep. It keeps its `@id`, or `location` where it
	* names none, and every id it names is made absolute against `location` — JSON-LD's own base — one naming its
	* scheme taken as it stands, but for an oField IRI naming no ref of the same SmartObject as a tree read at a ref that
	* pins it — a sha, a version, a range — which names that tree, its context and its type among them, where at a head
	* — no ref, `latest`, a branch, a data ref — it stands; a `file:` id is refused in a node not read from a file, so what a tree holds cannot read
	* this host's disk. Its links become the relations' data: `{"@id"}` a Relation's `{"relation"}`, a plain array of
	* them a RelationSet's `{"set"}`, `@list` a RelationList's `{"list"}`, an array of `{"@id", "@index"}` a
	* RelationMap's `{"map"}`, `{"@set"}` a set as well, so an empty one has a form; a blank node's `_:` stays data. `@context` and `@type` leave the model: the type is the
	* IRI its `@type` names, a term of its context — inline or held at the address it names — as the context defines
	* it, or else expanded through its `@vocab`; a type naming no ref of the workbench whose context the node names at a
	* ref that pins it — a version, a range — takes that ref. A context holds `@vocab` and term definitions: an IRI, or an object of
	* `@id`, `@type: "@id"` and `@container` `@set`, `@list` or `@index`. A value under a term of type `@id` is read
	* as the links it names — a string a Relation's, an array of strings under `@set` a RelationSet's, under `@list` a
	* RelationList's, an object of strings under `@index` a RelationMap's, an empty object an empty one — whatever shape it has otherwise reads as
	* above. A node of type Workbench keeps its inline `@context` in its model, as `@context`: the workbench carries its own.
	* A context at a root's `corpus.jsonld` or `context.jsonld`, the names of its `workbench.jsonld` before, is refused;
	* so is an `@id`, `@type` or `@context` of the scheme `oasis:`, the one before `ofield:`, naming `ofield://`.
	*/
	async read(text, location, context) {
		const node = object(parsed(text, location), `a node is a JSON object: ${location}`);
		if (nesting(node) > JsonLd.depth) throw new Error(`a node nests at most ${JsonLd.depth} deep: ${location}`);
		const { "@context": held, "@type": type, "@id": own, ...data } = node;
		if (typeof own === "string") OFieldIri.refuseRetired(own);
		const id = own === void 0 ? location : absolute(own, location);
		const dictionary = await this.#dictionary(held, location, context);
		const fields = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, coerced(dictionary.terms.get(key), value, location) ?? this.#data(value, location)]));
		const expanded = pinnedTo(this.#type(type, dictionary, location), location);
		const named = typeof held === "string" ? pinnedTo(expanded, absolute(held, location)) : expanded;
		if (OFieldIri.unpinned(named) !== Workbench.type) return {
			type: named,
			model: {
				"@id": id,
				...fields
			}
		};
		if (typeof held !== "object" || held === null || Array.isArray(held)) throw new Error(`a Workbench carries its own @context, inline: ${location}`);
		return {
			type: named,
			model: {
				"@id": id,
				"@context": held,
				...fields
			}
		};
	}
	/**
	* The text a model is stored as, of the type it names, at `location` where one is given; its ids as they stand, a
	* `file:` one relative to a `file:` location. An empty RelationMap under no `@index` term is written as an empty set's
	* `{"@set": []}`, so it reads back as an empty RelationSet.
	*
	* A model holding an `@context` is a workbench's: the node carries it as its own dictionary, its `@type` the term the
	* dictionary defines for the type where it defines one. Each field whose term in it is of type `@id` and has the
	* container its relation takes — none for a Relation, `@set`, `@list`, `@index` — is written as plain strings, an oField
	* id of the node's own SmartObject and ref relative to `location`.
	*
	* A type that is a term at the root of a workbench — `ofield://<namespace>/<Name>/<Term>` — or lies in a folder of it,
	* each segment a term, names that workbench's `workbench.jsonld`, the dictionary of its words, and is written in them where
	* that dictionary is given, a type in a folder by its term only where the dictionary defines it as that type, as
	* {@link JsonLd.dictionary} loads it: each field as a workbench's own is. One pinned to a ref — a sha, a version, a
	* range — names that workbench's `workbench.jsonld` at the same ref and is written as its IRI, so the ref stays with the
	* node; one outside an oField vocabulary, or at a head ref — a branch, a data ref — is written as its IRI, with no
	* context. Written to a `file:`
	* location, every `file:` id — its own among them — is relative to it, so a tree of nodes committed and read from
	* anywhere else names its own places there.
	*/
	write(model, type, location, dictionary) {
		const { "@id": own, "@context": held, ...data } = model;
		const id = typeof own === "string" ? relativeTo(own, location) : own;
		const term = type.slice(type.lastIndexOf("/") + 1);
		const context = held ?? contextOf$1(type);
		const terms = dictionaryOf(held ?? (context === void 0 ? void 0 : dictionary))?.terms;
		const at = OFieldIri.of(type)?.model;
		const named = held === void 0 && at?.ref === void 0 && at?.subpath === term || terms?.get(term)?.id === type ? term : type;
		const typed = context === void 0 ? {
			"@id": id,
			"@type": type
		} : {
			"@context": context,
			"@id": id,
			"@type": named
		};
		const fields = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, plain(terms?.get(key), value, location) ?? this.#linked(value, location)]));
		return `${JSON.stringify({
			...typed,
			...fields
		}, null, 2)}\n`;
	}
	/**
	* The dictionary a model of a type is written in, its workbench's `workbench.jsonld` loaded as {@link JsonLd.read} loads
	* the context a node names; none for a model holding its own, a workbench's, or a type written whole.
	*/
	async dictionary(model, type, location, context) {
		const address = model["@context"] === void 0 ? contextOf$1(type) : void 0;
		return address === void 0 ? void 0 : (await this.#dictionary(address, location, context)).held;
	}
	/** Every id the relations of a model name, in the order they stand. */
	relations(model) {
		const ids = [];
		const pending = [model];
		for (let value = pending.pop(); value !== void 0; value = pending.pop()) {
			const related = relationOf(value);
			if (related !== void 0) ids.push(...related.ids);
			else if (typeof value === "object" && value !== null) pending.push(...Object.values(value).reverse());
		}
		return ids;
	}
	#linked(value, location) {
		const related = relationOf(value);
		if (related === void 0) {
			if (Array.isArray(value)) return value.map((item) => this.#linked(item, location));
			if (typeof value !== "object" || value === null) return value;
			return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, this.#linked(item, location)]));
		}
		const links = related.ids.map((id) => ({ "@id": relativeTo(id, location) }));
		if (related.kind === "relation") return links[0];
		if (related.kind === "list") return { "@list": links };
		if (links.length === 0) return { "@set": [] };
		if (related.kind === "set") return links;
		return Object.keys(value.map).map((key, at) => ({
			...links[at],
			"@index": key
		}));
	}
	#type(type, dictionary, location) {
		if (typeof type !== "string" || type === "") throw new Error(`a node names its @type: ${location}`);
		if (type.includes(":")) return type;
		if (!isTerm(type)) throw new Error(`not a term: ${type}, in ${location}`);
		const defined = dictionary.terms.get(type)?.id;
		if (defined !== void 0 && defined.includes(":")) return defined;
		if (dictionary.vocab === void 0) throw new Error(`a context holds @vocab and term definitions: ${JSON.stringify(dictionary.held) ?? "none"}, in ${location}`);
		return `${dictionary.vocab}${type}`;
	}
	async #dictionary(held, location, context) {
		let inline = held;
		if (typeof held === "string") {
			const address = absolute(held, location);
			if (RETIRED_CONTEXTS.includes(OFieldIri.of(address)?.model.subpath ?? "")) throw new Error(`a node names its workbench's workbench.jsonld, not ${address}: ${location}`);
			inline = object(parsed(await context(address), address), `a context is a JSON object: ${address}`)["@context"];
		}
		return dictionaryOf(inline) ?? {
			terms: /* @__PURE__ */ new Map(),
			held: inline
		};
	}
	#data(value, location) {
		if (Array.isArray(value)) {
			if (value.length > 0 && value.every(isLink)) return { set: value.map((link) => absolute(link["@id"], location)) };
			if (value.length > 0 && value.every(isIndexed)) return { map: this.#map(value, location) };
			return value.map((item) => this.#data(item, location));
		}
		if (typeof value !== "object" || value === null) return value;
		if (isLink(value)) return { relation: absolute(value["@id"], location) };
		const keys = Object.keys(value);
		if (keys.length === 1 && keys[0] === "@set") {
			const set = value["@set"];
			if (!Array.isArray(set) || !set.every(isLink)) throw new Error(`a @set holds links alone, in ${location}`);
			return { set: set.map((link) => absolute(link["@id"], location)) };
		}
		if (keys.length === 1 && keys[0] === "@list") {
			const list = value["@list"];
			if (!Array.isArray(list) || !list.every(isLink)) throw new Error(`a @list holds links alone, in ${location}`);
			return { list: list.map((link) => absolute(link["@id"], location)) };
		}
		if (Object.hasOwn(value, "@id") && typeof value["@id"] !== "string") throw new Error(`an @id is a string: ${JSON.stringify(value["@id"])}, in ${location}`);
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, this.#data(item, location)]));
	}
	#map(indexed, location) {
		const map = /* @__PURE__ */ new Map();
		for (const link of indexed) {
			if (map.has(link["@index"])) throw new Error(`an @index names one link, ${link["@index"]} twice, in ${location}`);
			map.set(link["@index"], absolute(link["@id"], location));
		}
		return Object.fromEntries(map);
	}
};
const RETIRED_CONTEXTS = ["corpus.jsonld", "context.jsonld"];
/** Whether a word is a term a vocabulary may define: a letter or `_`, then letters, digits, `_` or `-`. */
function isTerm(word) {
	return /^[A-Za-z_][\w-]*$/.test(word);
}
function dictionaryOf(inline) {
	if (typeof inline !== "object" || inline === null || Array.isArray(inline)) return void 0;
	let vocab;
	const terms = /* @__PURE__ */ new Map();
	for (const [key, value] of Object.entries(inline)) if (key === "@vocab") {
		if (typeof value !== "string") return void 0;
		vocab = value;
	} else {
		const term = termOf$1(value);
		if (key.startsWith("@") || term === void 0) return void 0;
		terms.set(key, term);
	}
	return {
		vocab,
		terms,
		held: inline
	};
}
function termOf$1(value) {
	if (typeof value === "string") return { id: value };
	if (typeof value !== "object" || value === null || Array.isArray(value)) return void 0;
	const { "@id": id, "@type": kind, "@container": container, ...rest } = value;
	if (Object.keys(rest).length > 0 || id !== void 0 && typeof id !== "string" || kind !== void 0 && kind !== "@id") return void 0;
	const containers = {
		"@set": "set",
		"@list": "list",
		"@index": "index"
	};
	if (container !== void 0 && (typeof container !== "string" || !Object.hasOwn(containers, container))) return void 0;
	const link = kind === void 0 ? void 0 : container === void 0 ? "relation" : containers[container];
	return {
		...id === void 0 ? {} : { id },
		...link === void 0 ? {} : { link }
	};
}
function coerced(term, value, location) {
	const link = (item) => typeof item === "string" && !item.startsWith("_:");
	if (term?.link === "relation") return link(value) ? { relation: absolute(value, location) } : void 0;
	if ((term?.link === "set" || term?.link === "list") && Array.isArray(value) && value.every(link)) {
		const ids = value.map((item) => absolute(item, location));
		return term.link === "set" ? { set: ids } : { list: ids };
	}
	if (term?.link === "index" && typeof value === "object" && value !== null && !Array.isArray(value)) {
		const entries = Object.entries(value);
		if (entries.every(([, item]) => link(item))) return { map: Object.fromEntries(new Map(entries.map(([key, item]) => [key, absolute(item, location)]))) };
	}
}
function contextOf$1(type) {
	const named = OFieldIri.of(type)?.model;
	const held = named?.ref === void 0 || OFieldIri.isPinned(named.ref);
	return named !== void 0 && held && named.subpath !== void 0 && named.subpath.split("/").every(isTerm) ? Workbench.stored(type) : void 0;
}
function plain(term, value, location) {
	const related = relationOf(value);
	if (term?.link === void 0 || related === void 0 || related.kind !== (term.link === "index" ? "map" : term.link)) return void 0;
	const ids = related.ids.map((id) => relativeIn(id, location));
	if (related.kind === "relation") return ids[0];
	if (related.kind !== "map") return ids;
	const keys = Object.keys(value.map);
	return Object.fromEntries(new Map(keys.map((key, at) => [key, ids[at]])));
}
function relativeIn(id, location) {
	const to = OFieldIri.of(id)?.model;
	const from = location === void 0 ? void 0 : OFieldIri.of(location)?.model;
	if (to?.subpath === void 0 || from?.subpath === void 0 || to.source !== from.source || to.namespace !== from.namespace || to.name !== from.name || to.ref !== from.ref) return relativeTo(id, location);
	const base = from.subpath.split("/").slice(0, -1);
	const target = to.subpath.split("/");
	let common = 0;
	while (common < base.length && common < target.length - 1 && base[common] === target[common]) common++;
	const path = [...Array(base.length - common).fill(".."), ...target.slice(common)].join("/");
	return path.split("/")[0].includes(":") ? `./${path}` : path;
}
function parsed(text, location) {
	try {
		return JSON.parse(text);
	} catch (error) {
		throw new Error(`not JSON: ${location}`, { cause: error });
	}
}
function object(value, refusal) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(refusal);
	return value;
}
function absolute(reference, location) {
	if (typeof reference !== "string") throw new Error(`an @id is a string: ${JSON.stringify(reference)}, in ${location}`);
	let id;
	if (/^[A-Za-z][A-Za-z\d+.-]*:/.test(reference)) id = reference.split("#")[0];
	else {
		const base = OFieldIri.of(location);
		try {
			if (base !== void 0) id = base.resolve(reference).toString();
			else {
				const url = new URL(reference, location);
				url.hash = "";
				id = url.href;
			}
		} catch (error) {
			throw new Error(`not a link: ${reference}, in ${location}`, { cause: error });
		}
	}
	if (/^file:/i.test(id) && !location.startsWith("file:")) throw new Error(`a node not read from a file names no file: ${reference}, in ${location}`);
	return pinnedTo(id, location);
}
function pinnedTo(id, location) {
	const at = OFieldIri.of(location)?.model;
	if (at?.ref === void 0 || !OFieldIri.isPinned(at.ref)) return id;
	const named = OFieldIri.of(id)?.model;
	if (named === void 0 || named.ref !== void 0 || named.source !== at.source || named.namespace !== at.namespace || named.name !== at.name) return id;
	return `${new OFieldIri({
		...named,
		ref: at.ref
	})}`;
}
function relativeTo(id, location) {
	if (location === void 0 || !/^file:/i.test(location) || !/^file:/i.test(id)) return id;
	const from = new URL(location).pathname.split("/").slice(0, -1);
	const to = new URL(id).pathname.split("/");
	let common = 0;
	while (common < from.length && common < to.length - 1 && from[common] === to[common]) common++;
	if (common < 2) return id;
	const path = [...Array(from.length - common).fill(".."), ...to.slice(common)].join("/");
	return path.split("/")[0].includes(":") ? `./${path}` : path;
}
function nesting(value) {
	let deepest = 0;
	const pending = [[value, 1]];
	for (let next = pending.pop(); next !== void 0; next = pending.pop()) {
		const [item, depth] = next;
		if (typeof item !== "object" || item === null) continue;
		deepest = Math.max(deepest, depth);
		if (deepest > JsonLd.depth) return deepest;
		for (const child of Object.values(item)) pending.push([child, depth + 1]);
	}
	return deepest;
}
function relationOf(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return void 0;
	const keys = Object.keys(value);
	if (keys.length !== 1) return void 0;
	const kind = keys[0];
	try {
		if (kind === "relation") return {
			kind,
			ids: [new Relation(value, TypedSmartObject).model.relation]
		};
		if (kind === "list") return {
			kind,
			ids: new RelationList(value, TypedSmartObject).model.list
		};
		if (kind === "set") return {
			kind,
			ids: new RelationSet(value, TypedSmartObject).model.set
		};
		if (kind === "map") return {
			kind,
			ids: Object.values(new RelationMap(value, TypedSmartObject).model.map)
		};
	} catch {}
}
function isLink(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
	const keys = Object.keys(value);
	const id = value["@id"];
	return keys.length === 1 && keys[0] === "@id" && typeof id === "string" && !id.startsWith("_:");
}
function isIndexed(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
	const { "@id": id, "@index": index, ...rest } = value;
	return Object.keys(rest).length === 0 && typeof id === "string" && !id.startsWith("_:") && typeof index === "string";
}
//#endregion
//#region dependencies/metatrom-ag/Manu/main/habitats/node/loading/NodeInstaller.ts
/**
* Purpose: put what a start lacks into this host's stores, the seed holding
* no installer of its own.
*
* Intention: fetches the installer its model names — Core's, as
* {@link NodeInstaller.core} — at its latest release, as
* {@link Releases} picks it, with git and the credentials git holds, and runs
* it under `node` from the PATH — under Deno, Deno itself; {@link NodeKernel}
* asks it to install and to follow descriptors. Node's API, which Deno and Bun implement too.
*/
var NodeInstaller = class NodeInstaller extends TypedSmartObject {
	/** Core's installer, the one the seed fills the stores through. */
	static core = new NodeInstaller({
		repository: "https://github.com/metatrom-ag/Core",
		installation: "ofield://metatrom-ag/Core/habitats/node/installing/Installation",
		program: "habitats/node/installing/Installation.ts"
	});
	/**
	* Installs what the oField IRIs name into this host's stores, then follows the descriptors `followed` answers once
	* they are installed, installing what those use: the installer's latest release, cloned shallow into a temporary
	* folder removed afterwards, run under `node` from the PATH — Deno's own runtime under Deno — once with the IRIs and
	* once more with the descriptors `followed` answers, where it answers any, speaking on standard error; refused,
	* naming why, where git lists or clones nothing, the repository names no release, `node` does not start, or the
	* installer fails.
	*/
	install(iris, followed) {
		const { execFileSync, spawnSync } = process.getBuiltinModule("node:child_process");
		const { mkdtempSync, rmSync, writeFileSync } = process.getBuiltinModule("node:fs");
		const { tmpdir } = process.getBuiltinModule("node:os");
		const { repository, installation, program } = this.model;
		const lacking = `the stores lack ${iris.join(", ")}`;
		const git = (args) => execFileSync("git", args, {
			encoding: "utf8",
			env: {
				...process.env,
				GIT_TERMINAL_PROMPT: "0"
			},
			stdio: [
				"ignore",
				"pipe",
				"pipe"
			]
		});
		let listed;
		try {
			listed = git([
				"ls-remote",
				"--tags",
				"--refs",
				repository
			]);
		} catch (cause) {
			throw new Error(`${lacking}, and git could not list the releases of ${repository}; where GitHub refused its credentials, \`gh auth login\` gives git some`, { cause });
		}
		const tag = new Releases(listed.split("\n").flatMap((line) => /\trefs\/tags\/(.+)$/.exec(line)?.[1] ?? [])).latest;
		if (tag === void 0) throw new Error(`${lacking}, and ${repository} names no release to fill them with`);
		console.error(`${lacking}, so the installer of ${repository} at ${tag} fills them; that takes about a minute`);
		const folder = mkdtempSync(`${tmpdir()}/ofield-fill-`);
		try {
			try {
				git([
					"clone",
					"--quiet",
					"--depth",
					"1",
					"--branch",
					tag,
					repository,
					`${folder}/installer`
				]);
			} catch (cause) {
				throw new Error(`${lacking}, and git could not clone ${repository} at ${tag}`, { cause });
			}
			const run = (model) => {
				writeFileSync(`${folder}/fill.json`, JSON.stringify({
					"@type": installation,
					...model
				}));
				const ran = spawnSync("node", [`${folder}/installer/${program}`, `${folder}/fill.json`], { stdio: [
					"ignore",
					2,
					2
				] });
				if (ran.error !== void 0) throw new Error(`${lacking}, and node could not be started to fill them: ${ran.error.message}`, { cause: ran.error });
				if (ran.status !== 0) throw new Error(`${lacking}, and the installer of ${repository} at ${tag} exits ${ran.status}, having filled them only as far as it says above`);
			};
			run({ install: iris });
			const descriptors = followed();
			if (descriptors.length > 0) run({ descriptors });
		} finally {
			rmSync(folder, {
				recursive: true,
				force: true
			});
		}
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/habitats/node/loading/NodeReleaseHook.ts
/**
* Purpose: run every SmartObject of a process on the one 0field that
* started it.
*
* Intention: realizes {@link ModuleHook} over this host's disk, for the
* 0field a SmartObject carries as released.
*/
var NodeReleaseHook = class NodeReleaseHook extends TypedSmartObject {
	/** The first line of a released 0field. */
	static banner = "// @ts-self-types=\"./0field.d.ts\"";
	name = "0field";
	/**
	* The running 0field its model names, for a carried release a file on disk imports: a `0field.js` whose
	* first line is the {@link NodeReleaseHook.banner}, ended by LF or CRLF and after a byte order mark a checkout
	* may write. So both extend the same SmartObject and nothing starts twice. Any other file of that name is no
	* release, and passes on.
	*/
	resolve(specifier, parentURL) {
		if (!/^(\.{0,2}\/|file:)/.test(specifier) || !specifier.endsWith("/0field.js")) return void 0;
		if (!parentURL?.startsWith("file:")) return void 0;
		const url = new URL(specifier, parentURL).href;
		if (url === this.model.running) return void 0;
		const release = new ReadOnlyNodeFile(ReadOnlyNodeFolder.fromUrl(url).path);
		if (!release.exists) return void 0;
		const head = new TextDecoder().decode(release.head(NodeReleaseHook.banner.length + 5));
		return /^\uFEFF?(.*?)\r?\n/.exec(head)?.[1] === NodeReleaseHook.banner ? this.model.running : void 0;
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/habitats/node/loading/NodeKernel.ts
var __rewriteRelativeImportExtension$1 = function(path, preserveJsx) {
	if (typeof path === "string" && /^\.\.?\//.test(path)) return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
		return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
	});
	return path;
};
/**
* Purpose: make loading work in Node.
*
* Intention: realizes {@link Manu} over Node's module API, which Deno
* realizes too from 2.8, carrying its {@link ModuleHookChain} there: the
* {@link NodeReleaseHook}, {@link NodeOFieldHook} and {@link NodeNpmHook}.
* Its storage, which a Persistence reads, is a {@link ReadOnlyNodeStorage};
* what a model names and no store holds, or what that uses, the
* {@link NodeOFieldHook} asked, it fills through {@link NodeInstaller},
* leaving to the {@link Workbench} that holds the model what it names; it
* answers a type of a workbench a build registered from that
* {@link BuiltWorkbench}. Its model names the 0field it loads for.
*/
var NodeKernel = class NodeKernel extends TypedSmartObject {
	static #registered = false;
	hooks = new ModuleHookChain();
	/** The export conditions this habitat resolves npm packages under. */
	conditions = ["node"];
	/** Whether this habitat loads a `file:` URL it resolves itself by its real path, every link on the way followed. */
	realPaths = true;
	/**
	* Registers the chain with `module.registerHooks`, once per process, after adding this kernel's hooks to it. A
	* request no hook answers goes to the environment's own resolution.
	*/
	async start() {
		if (NodeKernel.#registered) throw new Error("Node's module hooks register once per process");
		const { registerHooks } = process.getBuiltinModule("node:module");
		if (typeof registerHooks !== "function") throw new Error("this runtime lacks module.registerHooks: Node needs 23.5, Deno 2.8");
		NodeKernel.#registered = true;
		this.addHooks();
		const hooks = this.hooks;
		registerHooks({
			resolve: (specifier, context, next) => {
				const url = hooks.resolve(specifier, context.parentURL);
				if (url !== void 0) {
					hooks.observe(url);
					return {
						url,
						shortCircuit: true
					};
				}
				const resolved = next(specifier, context);
				hooks.observe(resolved.url);
				return resolved;
			},
			load: (url, context, next) => {
				const module = hooks.load(url);
				return module === void 0 ? next(url, context) : {
					...module,
					shortCircuit: true
				};
			}
		});
	}
	/**
	* Adds this kernel's hooks to its chain, the oField hook as its {@link NodeKernel.realPaths} say, the npm hook under
	* its {@link NodeKernel.conditions}.
	*/
	addHooks() {
		this.hooks.use(new NodeReleaseHook({ running: this.model.oField }));
		this.hooks.use(new NodeOFieldHook({ realPaths: this.realPaths }));
		this.hooks.use(new NodeNpmHook({ conditions: this.conditions }));
	}
	/**
	* The one program a process is started with: the URL of the file the runtime was started with, and the words after it
	* as the runtime received them; refused where it was started with no file.
	*/
	get started() {
		this.#started ??= new Program({
			address: this.main,
			words: process.argv.slice(2)
		});
		return [this.#started];
	}
	#started;
	/** Refused: a process shows a SmartObject nowhere. */
	attach(_smartObject, where) {
		throw new Error(`this habitat shows no SmartObject, at ${where} or elsewhere`);
	}
	/** The URL of the file the runtime was started with. */
	get main() {
		const file = process.argv[1];
		if (file === void 0) throw new Error("the runtime was started with no file");
		return process.getBuiltinModule("node:url").pathToFileURL(file).href;
	}
	anchor(place) {
		return place === void 0 ? this.main : `${ReadOnlyNodeFolder.urlOf(ReadOnlyNodeFolder.native(place))}/.started`;
	}
	storage(place) {
		return new ReadOnlyNodeStorage({ main: this.anchor(place) });
	}
	/**
	* The default export of the module a type IRI names, as the place resolves it; where a build registered the workbench
	* it names, the class that build carries, from any place, refused, naming the type, where it carries none.
	*/
	async classOf(type, place) {
		const built = BuiltWorkbench.of(type);
		if (built !== void 0) {
			const path = OFieldIri.of(type)?.model.subpath ?? "";
			if (!built.classes.has(path)) throw new Error(`the build carrying ${built.model["@id"]} carries no class ${path}: ${type}`);
			return built.classes.get(path);
		}
		const url = this.hooks.moduleOf(type, this.anchor(place));
		if ([...new URL(url).pathname.matchAll(/\/dependencies\/[^/]+\/[^/]+\/(?=(.*))/g)].some(([, ref]) => OFieldIri.isDataRef(ref))) throw new Error(`no class is loaded from a data ref: ${type}`);
		return (await import(__rewriteRelativeImportExtension$1(url))).default;
	}
	/**
	* Fills, through {@link NodeInstaller.core}, every release the model at the address names by an oField IRI
	* and no store or working tree holds — its `@context`, its `@type` and each `{"@id"}` it references — and every
	* release those use, as the `uses` and `realizes` of the descriptors the stores hold say, all the way down; a plain
	* string is data and fills nothing, and its own `@id`, an npm package, a branch and a data ref — what no installer
	* installs, a release being what it installs — are left to restoring, as is a `{"@id"}` naming a ref of the repository that
	* holds the model — by the `@id` of its `workbench.jsonld`, else by its `origin` — which git reads there. Where the address is a module's `file:` URL,
	* it fills, the same way, what the descriptor beside that module uses and realizes, a relative path read within the
	* folder of the nearest `workbench.jsonld` above it, or its own folder where none is. Nothing
	* where each is held, or where no model or descriptor is there; refused, naming the file, where a descriptor it reads
	* is no JSON object. What a build registered through {@link BuiltWorkbench.use} counts as held.
	*/
	async fill(address) {
		const module = address.startsWith("file:") && descriptorBeside(address) !== void 0 ? ReadOnlyNodeFolder.fromUrl(address) : void 0;
		let node;
		let holder;
		if (module === void 0) {
			const storage = this.storage();
			const location = storage.location(address);
			if (!await storage.has(location)) return;
			holder = Workbench.above(location.startsWith("file:") ? ReadOnlyNodeFolder.fromUrl(location).parent : new NodeOFieldHook({}).find(location, this.anchor()));
			try {
				node = JSON.parse(await storage.get(location));
			} catch {
				return;
			}
		}
		const oField = new NodeOFieldHook({});
		const find = (iri) => {
			try {
				return oField.find(iri, this.anchor());
			} catch {
				return null;
			}
		};
		const lacking = /* @__PURE__ */ new Set();
		const named = [];
		const take = (value) => {
			const iri = typeof value === "string" ? OFieldIri.of(value) : void 0;
			const ref = iri?.model.ref;
			if (iri !== void 0 && iri.model.namespace !== "npm" && (ref === void 0 || ref === "latest" || OFieldIri.isPinned(ref))) named.push(iri);
		};
		const reference = (value, depth) => {
			if (depth > JsonLd.depth) return;
			if (Array.isArray(value)) value.forEach((each) => reference(each, depth + 1));
			else if (typeof value === "object" && value !== null) {
				const { "@id": id, ...rest } = value;
				const link = typeof id === "string" ? OFieldIri.of(id) : void 0;
				if (link?.model.ref === void 0 || holder?.names(`${link.model.namespace}/${link.model.name}`) !== true) take(id);
				Object.values(rest).forEach((each) => reference(each, depth + 1));
			}
		};
		if (typeof node === "object" && node !== null && !Array.isArray(node)) {
			const { "@id": _id, "@context": context, "@type": type, ...rest } = node;
			[context, type].flat().forEach(take);
			reference(rest, 0);
		}
		const read = /* @__PURE__ */ new Set();
		const follow = (descriptor, tree) => {
			if (read.has(descriptor.path) || !descriptor.exists) return;
			read.add(descriptor.path);
			const { uses, realizes } = descriptor.readJsonObject();
			for (const related of [uses, realizes].flatMap((list) => Array.isArray(list) ? list : [])) {
				if (typeof related !== "string") continue;
				const iri = OFieldIri.of(related);
				if (iri === void 0) follow(tree.file(within(tree, descriptor, related)), tree);
				else reach(iri);
			}
		};
		const reach = (iri) => {
			if (iri.model.namespace === "npm" || BuiltWorkbench.of(iri.toString()) !== void 0) return;
			const tree = find(iri.toString());
			if (tree === null) return;
			if (tree === void 0) {
				const { subpath: _subpath, ...release } = iri.model;
				lacking.add(new OFieldIri(release).toString());
			} else follow(tree.file(descriptorOf(iri)), tree);
		};
		named.forEach(reach);
		const beside = module?.parent?.file(descriptorBeside(module.name));
		if (module?.parent !== void 0 && beside !== void 0) {
			const folder = module.parent;
			follow(beside, [folder, ...folder.ancestors].find((entry) => isFolder(entry) && entry.file("workbench.jsonld").exists) ?? folder);
		}
		if (lacking.size === 0) return;
		NodeInstaller.core.install([...lacking], () => [...beside?.exists ? [beside.path] : [], ...named.flatMap((iri) => {
			const tree = find(iri.toString());
			const descriptor = tree ? tree.file(descriptorOf(iri)) : void 0;
			return descriptor?.exists ? [descriptor.path] : [];
		})]);
	}
};
function within(tree, descriptor, related) {
	const refused = (cause) => new Error(`${descriptor.path} names ${related}, which is no path within ${tree.path}`, { cause });
	let path;
	try {
		path = ReadOnlyNodeFolder.fromUrl(new URL(related, ReadOnlyNodeFolder.urlOf(descriptor)).href).path;
	} catch (cause) {
		throw refused(cause);
	}
	if (!path.startsWith(`${tree.path}/`)) throw refused();
	return path.slice(tree.path.length + 1);
}
//#endregion
//#region dependencies/metatrom-ag/Manu/main/habitats/bun/BunKernel.ts
/**
* Purpose: make loading work in Bun.
*
* Intention: realizes {@link Manu} as the {@link NodeKernel}, its
* storage, words and hooks Node's, its npm conditions Bun's — but carries
* its {@link ModuleHookChain} in Bun's runtime plugins, since Bun has no
* `module.registerHooks`.
*/
var BunKernel = class BunKernel extends NodeKernel {
	static #registered = false;
	static #running = "running/0field.js";
	static #source = /\.(m?[jt]s|[jt]sx)$/;
	#namespace = "0field";
	#schemes = /* @__PURE__ */ new Set();
	hooks;
	conditions = ["bun", "node"];
	constructor(model) {
		super(model);
		const kernel = this;
		this.hooks = new class extends ModuleHookChain {
			use(hook) {
				super.use(hook);
				for (const scheme of hook.schemes ?? []) kernel.#listen(scheme);
			}
		}();
	}
	/**
	* Carries the chain in Bun's runtime plugins, once per process, after adding the hooks the NodeKernel adds. Bun
	* reads `ofield:…` as the namespace `0field`, and runs a plugin only for namespaces it was told of — so each scheme a
	* hook names gets a plugin of its own, also when the hook arrives after the start. A hook's `file:` URL is loaded by
	* Bun itself; any other URL lives in this kernel's namespace, where only the hooks load it. Bun's `onLoad` cannot
	* pass a request on, so a hook that only observes is asked through {@link ModuleHookChain.observe}. A stored npm
	* package's bare imports reach no runtime plugin, so
	* its files are loaded rewritten, each specifier the hooks resolve replaced by what they resolve it to. Bun keeps a
	* file's imports as resolved in its transpiler cache, across processes, so a carried release resolves to a name that
	* is the same in each of them, and loading that name re-exports the release the process runs. Bun keys that cache by
	* a file's text, so each source file is loaded with where the hooks resolve its imports written below it: a process
	* whose stores or repository resolve them elsewhere reads the file afresh.
	*/
	async start() {
		if (BunKernel.#registered) throw new Error("Bun's runtime plugin registers once per process");
		this.addHooks();
		BunKernel.#registered = true;
		Bun.plugin({
			name: this.#namespace,
			setup: (build) => {
				build.onResolve({ filter: /.*/ }, ({ path, importer }) => this.#uncached(this.#resolve(path, importer)));
				build.onLoad({
					filter: /.*/,
					namespace: this.#namespace
				}, ({ path }) => {
					if (path === BunKernel.#running) return {
						contents: `export * from ${JSON.stringify(this.model.oField)}`,
						loader: "js"
					};
					const module = this.hooks.load(path);
					if (module === void 0) throw new Error(`no module hook loads ${path}`);
					return {
						contents: module.source,
						loader: module.format === "json" ? "json" : "js"
					};
				});
				const stored = NodeNpmHook.stored.source.replaceAll("\\/", "[\\\\/]");
				build.onLoad({ filter: new RegExp(`${stored}.*\\.m?js$`) }, ({ path }) => this.#rewrite(path));
				build.onLoad({ filter: BunKernel.#source }, ({ path }) => this.#keyed(path));
			}
		});
		for (const scheme of this.#schemes) this.#register(scheme);
	}
	get main() {
		return Bun.pathToFileURL(Bun.main).href;
	}
	async #rewrite(path) {
		const loaded = this.hooks.load(Bun.pathToFileURL(path).href);
		let refused;
		const built = await Bun.build({
			entrypoints: [path],
			target: "bun",
			format: "esm",
			plugins: [{
				name: `${this.#namespace}:rewrite`,
				setup: (build) => {
					if (loaded !== void 0) build.onLoad({ filter: /.*/ }, ({ path: built }) => built === path ? {
						contents: loaded.source,
						loader: "js"
					} : void 0);
					build.onResolve({ filter: /.*/ }, ({ path: specifier, importer, kind }) => {
						if (kind === "entry-point-build") return void 0;
						try {
							return {
								path: this.#resolve(specifier, importer)?.path ?? specifier,
								external: true
							};
						} catch (error) {
							refused ??= error;
							return {
								path: specifier,
								external: true
							};
						}
					});
				}
			}]
		});
		if (refused !== void 0) throw refused;
		if (!built.success) throw new AggregateError(built.logs, `${path} does not build`);
		return {
			contents: await built.outputs[0].text(),
			loader: "js"
		};
	}
	async #keyed(path) {
		const source = await Bun.file(path).text();
		const extension = path.slice(path.lastIndexOf(".") + 1);
		const loader = extension === "tsx" || extension === "jsx" ? extension : extension.endsWith("ts") ? "ts" : "js";
		const importer = BunKernel.#url(path);
		const resolved = new Bun.Transpiler({ loader }).scanImports(source).flatMap(({ path: specifier }) => {
			try {
				const url = this.hooks.resolve(BunKernel.#url(specifier), importer);
				return url === void 0 ? [] : [`${specifier} ${url}`];
			} catch {
				return [];
			}
		});
		return {
			contents: resolved.length === 0 ? source : `${source}\n// resolved: ${resolved.join(", ")}\n`,
			loader
		};
	}
	#listen(scheme) {
		if (this.#schemes.has(scheme)) return;
		this.#schemes.add(scheme);
		if (BunKernel.#registered) this.#register(scheme);
	}
	#register(scheme) {
		Bun.plugin({
			name: `${this.#namespace}:${scheme}`,
			setup: (build) => {
				build.onResolve({
					filter: /.*/,
					namespace: scheme
				}, ({ path, importer }) => this.#uncached(this.#resolve(`${scheme}:${path}`, importer)));
			}
		});
	}
	#uncached(resolved) {
		if (resolved === void 0 || resolved.namespace !== void 0 || resolved.path !== Bun.fileURLToPath(this.model.oField)) return resolved;
		return {
			path: BunKernel.#running,
			namespace: this.#namespace
		};
	}
	#resolve(specifier, importer) {
		const parentURL = !importer ? void 0 : BunKernel.#url(importer);
		const requested = BunKernel.#url(specifier);
		const url = this.hooks.resolve(requested, parentURL);
		if (url !== void 0) {
			this.#observe(url);
			return url.startsWith("file:") ? { path: Bun.fileURLToPath(url) } : {
				path: url,
				namespace: this.#namespace
			};
		}
		const native = BunKernel.#native(requested, parentURL);
		if (native !== void 0) this.#observe(native);
	}
	static #url(path) {
		return process.getBuiltinModule("node:path").isAbsolute(path) ? ReadOnlyNodeFolder.urlOf(ReadOnlyNodeFolder.native(path)) : path;
	}
	#observe(url) {
		queueMicrotask(() => this.hooks.observe(url));
	}
	static #native(specifier, parentURL) {
		if (specifier.startsWith("file:")) return specifier;
		if (!/^\.{0,2}\//.test(specifier) || !parentURL?.startsWith("file:")) return void 0;
		return new URL(specifier, parentURL).href;
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/habitats/deno/DenoKernel.ts
/**
* Purpose: load SmartObjects in the Deno habitat.
*
* Intention: realizes {@link Manu} by extending {@link NodeKernel},
* since Deno supports Node's module API from 2.8. It differs in the
* `deno` export condition, in `Deno.mainModule` as the starting file,
* because a compiled binary does not name it in `process.argv`, and in
* loading a file by the path it is named by, links kept.
*/
var DenoKernel = class extends NodeKernel {
	conditions = ["deno", "node"];
	realPaths = false;
	get main() {
		return Deno.mainModule;
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/persistence/Persistence.ts
/**
* Purpose: keep SmartObjects beyond the process that created them.
*
* Intention: has the shape of the {@link Restoring} every relation asks
* for, and uses a {@link Host}: the {@link Storage} of the habitat it
* runs in, of the started file's place or of a place a program names; the
* class a type IRI names there; and the anchor it reads that place from,
* which it hands the habitat's {@link PersistenceWriter}. It reads and
* writes a stored text as {@link JsonLd}, and speaks to {@link Relation} and to each SmartObject's
* `Lifecycle`; a {@link Workbench} it puts as the `workbench.jsonld` of the root its `@id` names.
*/
var Persistence = class Persistence extends TypedSmartObject {
	static #writer;
	static #realmTypes = /* @__PURE__ */ new WeakMap();
	/** Registers the writer that {@link Persistence.put} delegates I/O to; called by the habitat when it loads. */
	static useWriter(writer) {
		Persistence.#writer = writer;
	}
	/**
	* The type IRI a SmartObject was last restored from a stored text or put as, through any persistence of the realm;
	* `undefined` for one made in memory or realized by its host.
	*/
	static typeOf(smartObject) {
		return Persistence.#realmTypes.get(smartObject);
	}
	#host;
	#place;
	#format = new JsonLd();
	#instances = /* @__PURE__ */ new Map();
	#types = /* @__PURE__ */ new WeakMap();
	#places = /* @__PURE__ */ new WeakMap();
	#realizing = /* @__PURE__ */ new WeakSet();
	/** Over a host that may still be starting, each call waiting for it; over the storage of a place where one is named. */
	constructor(host, place) {
		super();
		this.#host = host;
		this.#place = place;
	}
	/**
	* A persistence over the storage of another place — a folder, as a path — for a program that keeps what belongs to
	* a repository other than its own; its SmartObjects are its own, apart from this one's.
	*/
	at(place) {
		return new Persistence(this.#host, place);
	}
	/**
	* The SmartObject an address names, created once per id, whether reached by where it is stored or by the `@id` it
	* holds; refused, naming it, where nothing there restores — and, where a vocabulary is named, where its type is no
	* term of it, before its class is loaded, so reading data runs no code the reader did not choose.
	*
	* Each one created is named to {@link Relation} as made here, so its relations restore through this persistence
	* too, and its `restored()` is awaited before the restore that created it resolves — anyone reaching it meanwhile,
	* a cycle or another restore, gets it as made — a failure failing that restore, naming its id. What the storage
	* realizes rather than stores — a repository — is handed out the same way, one instance for every location naming
	* it, and is of no vocabulary.
	*/
	async restore(address, vocabulary) {
		const host = await this.#host;
		const storage = host.storage(this.#place);
		const location = located(storage, address);
		const restored = await this.#once(location, async () => {
			if (storage.realizes(location)) {
				if (vocabulary !== void 0) throw new Error(`${location} is what this host realizes, no term of ${vocabulary}`);
				return this.#realized(storage.realized(location), location);
			}
			const { type, model } = await this.#read(storage, location);
			termOf(type, vocabulary, location);
			const id = model["@id"];
			if (id !== location && storage.realizes(storage.location(id))) throw new Error(`${location} claims the @id ${id}, which this host realizes`);
			return id === location ? this.#created(host, type, model, location) : this.#once(id, () => this.#created(host, type, model, location));
		});
		if (vocabulary !== void 0 && this.#realizing.has(restored)) throw new Error(`${location} is a ${restored.constructor.name} this host realizes, no term of ${vocabulary}`);
		termOf(this.#types.get(restored) ?? "", vocabulary, location);
		return restored;
	}
	/**
	* Reads the text stored at an address again into the SmartObject held here for it, through its `update`, so whoever
	* observes it hears the keys a human changed there, and none where a put of its own reads back; nothing where
	* nothing here was restored from or put at that address. Refused, naming it, where the text there now holds another
	* type than the SmartObject was restored as, or refuses as a restore refuses.
	*/
	async reread(address) {
		const storage = (await this.#host).storage(this.#place);
		const location = located(storage, address);
		const held = await this.#instances.get(location)?.catch(() => void 0);
		if (held === void 0 || this.#realizing.has(held)) return;
		const { type, model } = await this.#read(storage, location, true);
		if (type !== this.#types.get(held)) throw new Error(`${location} now holds a ${type}, where a ${this.#types.get(held)} was restored`);
		held.update(model);
	}
	async #read(storage, location, afresh = false) {
		return this.#format.read(await storage.get(location, afresh), location, contextOf(storage));
	}
	#realized(realized, location) {
		const id = realized.model["@id"];
		if (typeof id !== "string" || id === "") throw new Error(`a ${realized.constructor.name} realized at ${location} names no @id`);
		const held = () => {
			Relation.made(realized, this);
			this.#realizing.add(realized);
			this.#places.set(realized, /* @__PURE__ */ new Set([location, id]));
			return Promise.resolve(realized);
		};
		return id === location ? held() : this.#once(id, held);
	}
	/**
	* The type IRI of the node stored at an address, read through its `@context` as {@link Persistence.restore} reads
	* it, without loading its class; none for what the storage realizes; refused, as a restore is, where nothing there
	* is stored.
	*/
	async typeAt(address) {
		const storage = (await this.#host).storage(this.#place);
		const location = located(storage, address);
		if (storage.realizes(location)) return void 0;
		return (await this.#read(storage, location)).type;
	}
	/** Whether anything is stored at an address — nothing where the place it names is not on this host; refused where it names no place. */
	async has(address) {
		const storage = (await this.#host).storage(this.#place);
		const location = located(storage, address);
		return await storage.has(location) || storage.realizes(location);
	}
	/**
	* Stores SmartObjects at their `@id`s in one put, with every SmartObject held here that a relation of theirs names
	* and the storage lacks — so SmartObjects new together, a cycle among them, are stored together. A SmartObject
	* given with its type is put as that type; one alone, as it was restored or put before. It replaces only what this
	* persistence read or wrote there. Refused, nothing written, where one names no `@id` of its own location or no
	* type, would not restore as it is put, would take a place this persistence did not read or write, relates to a
	* place written here that holds nothing and nothing held, or is — or claims the `@id` of — what the storage
	* realizes. It resolves once the writer has stored them, and rejects as the writer rejects.
	*/
	async put(...given) {
		if (Persistence.#writer === void 0) throw new Error("no writer registered");
		const host = await this.#host;
		const storage = host.storage(this.#place);
		const writable = Persistence.#writer.storageFor(host.anchor(this.#place));
		const putting = /* @__PURE__ */ new Map();
		for (const item of given) {
			const [object, type] = Array.isArray(item) ? item : [item, void 0];
			putting.set(await this.#placed(storage, object), [object, type]);
		}
		const written = /* @__PURE__ */ new Map();
		const pending = [...putting];
		for (let next = pending.shift(); next !== void 0; next = pending.shift()) {
			const [location, [object, named]] = next;
			if (written.has(location)) continue;
			const model = object.model;
			const id = model["@id"];
			const type = named ?? this.#types.get(object);
			if (type === void 0) throw new Error(`a ${object.constructor.name} is put with its type the first time: ${id}`);
			const text = this.#format.write(model, type, location, await this.#format.dictionary(model, type, location, contextOf(storage)));
			await this.#readsBack(storage, text, location, type, model);
			written.set(location, {
				smartObject: object,
				type,
				text
			});
			for (const related of this.#format.relations(model)) {
				const at = this.#writableAt(storage, writable, related);
				if (at === void 0 || written.has(at) || putting.has(at) || await storage.has(at) || storage.realizes(at)) continue;
				const held = await this.#instances.get(at)?.catch(() => void 0);
				if (held === void 0) throw new Error(`${id} relates to ${related}, which is neither stored nor held`);
				pending.push([await this.#placed(storage, held), [held, void 0]]);
			}
		}
		await writable.put(new Map([...written].map(([location, { text }]) => [location, text])));
		for (const [location, { smartObject: object, type }] of written) this.#hold(object, type, location);
	}
	async #placed(storage, object) {
		const id = object.model["@id"];
		if (typeof id !== "string" || id === "") throw new Error(`a SmartObject is stored at its @id, and this ${object.constructor.name} names none`);
		if (this.#realizing.has(object)) throw new Error(`${id} is a ${object.constructor.name} this host realizes, so it is never put`);
		const root = located(storage, id);
		if (storage.realizes(root)) throw new Error(`${id} names what this host realizes, so nothing is put there`);
		const location = object instanceof Workbench ? storage.location(Workbench.stored(id)) : root;
		const known = this.#places.get(object);
		if (known?.has(location)) return location;
		if (known !== void 0) throw new Error(`${id} was read from ${[...known][0]}, so it is put there, not at ${location}`);
		if (this.#instances.has(location) || this.#instances.has(id)) throw new Error(`${id} names a SmartObject held here already, so another is not put there`);
		if (await storage.has(location)) throw new Error(`${location} holds what this persistence did not read or write, so a put does not replace it`);
		return location;
	}
	async #readsBack(storage, text, location, type, model) {
		const refused = (cause) => new Error(`${model["@id"]} would not restore as it is put`, cause === void 0 ? void 0 : { cause });
		let read;
		try {
			read = await this.#format.read(text, location, contextOf(storage));
		} catch (error) {
			throw refused(error);
		}
		if (read.type !== type || !same(read.model, model)) throw refused();
	}
	#hold(object, type, location) {
		const id = object.model["@id"];
		Relation.made(object, this);
		this.#types.set(object, type);
		Persistence.#realmTypes.set(object, type);
		this.#places.set(object, /* @__PURE__ */ new Set([
			...this.#places.get(object) ?? [],
			location,
			id
		]));
		this.#instances.set(location, Promise.resolve(object));
		this.#instances.set(id, Promise.resolve(object));
	}
	/** Every SmartObject stored below an address, created as it is reached, each once; refused as {@link Persistence.restore} refuses. */
	async *all(address, vocabulary) {
		const storage = (await this.#host).storage(this.#place);
		OFieldIri.refuseRetired(address);
		for (const location of await storage.list(address)) yield await this.restore(location, vocabulary);
	}
	#writableAt(storage, writable, related) {
		let location;
		try {
			location = storage.location(related);
		} catch {
			return;
		}
		return writable.writes(location) ? location : void 0;
	}
	#once(key, create) {
		const known = this.#instances.get(key);
		if (known !== void 0) return known;
		const created = create();
		this.#instances.set(key, created);
		created.catch(() => this.#instances.delete(key));
		return created;
	}
	async #created(host, type, model, location) {
		const id = model["@id"];
		let created;
		try {
			created = await host.classOf(type, this.#place);
		} catch (error) {
			throw new Error(`no module for the type ${type}, of ${id}`, { cause: error });
		}
		if (typeof created !== "function" || !(created.prototype instanceof TypedSmartObject)) throw new Error(`${type}.ts exports no SmartObject by default, for ${id}`);
		let restored;
		try {
			restored = new created(model);
		} catch (error) {
			throw new Error(`${type} refuses the model of ${id}`, { cause: error });
		}
		this.#hold(restored, type, location);
		try {
			await restored.restored();
		} catch (error) {
			throw new Error(`${id} fails to finish being restored`, { cause: error });
		}
		return restored;
	}
};
function same(a, b) {
	if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, at) => same(item, b[at]));
	if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return Object.is(a, b);
	const keys = Object.keys(a);
	return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && same(a[key], b[key]));
}
function located(storage, address) {
	OFieldIri.refuseRetired(address);
	return storage.location(address);
}
function contextOf(storage) {
	return async (address) => storage.get(storage.location(address));
}
function termOf(type, vocabulary, location) {
	if (vocabulary === void 0) return;
	const unpinned = OFieldIri.unpinned(type);
	if (unpinned.startsWith(vocabulary) && unpinned.slice(vocabulary.length).split("/").every(isTerm)) return;
	throw new Error(`${location} names the type ${type}, no term of ${vocabulary}, so its class is not loaded`);
}
/**
* A {@link View} typed with its object's model keys as its own fields, as `SmartObject` is with its own model's, the
* view's own members left out of them as they win at runtime; a view generic over its object extends `View.Class`.
*/
const TypedView = class View extends TypedSmartObject {
	#shown;
	static {
		const above = Object.getPrototypeOf(View.prototype);
		Object.setPrototypeOf(View.prototype, new Proxy(Object.create(above), {
			get: (below, key, receiver) => View.#forwards(below, key, receiver) ? receiver.#shown[key] : Reflect.get(below, key, receiver),
			set: (below, key, value, receiver) => {
				if (View.#awaits(below, key, receiver)) throw new Error(`a ${receiver.constructor.name} shows no SmartObject yet, so its ${String(key)} reaches none`);
				if (!View.#forwards(below, key, receiver)) return Reflect.set(below, key, value, receiver);
				receiver.#shown[key] = value;
				return true;
			}
		}));
	}
	/** The link to the SmartObject it shows, where its model holds one; it restores through whatever restored the view. */
	get object() {
		return this.model.object === void 0 ? void 0 : new Relation(this.model.object, this.type, this);
	}
	/** The SmartObject it shows, in memory; none before it shows one. */
	get smartObject() {
		return this.#shown;
	}
	/**
	* Shows `object`, linking to it where its model names an `@id`; one naming none is held in memory alone, and no link
	* is kept. From now on it hears each change to `object`, and no more to the one it showed before.
	*/
	show(object) {
		const id = object.model["@id"];
		const { object: _, ...model } = this.model;
		if (this.#shown !== void 0) TypedSmartObject.unobserve(this.#shown, this);
		this.#shown = object;
		TypedSmartObject.observe(object, this);
		this.update(Relation.isId(id) ? {
			...model,
			object: { relation: id }
		} : model);
	}
	/** Restores the SmartObject it links to before the restore resolves, so a passed-through method calls it at once, and hears its changes; refused where it is of another class than {@link View.type}. */
	async restored() {
		this.#shown = await this.object?.get();
		if (this.#shown !== void 0) TypedSmartObject.observe(this.#shown, this);
	}
	/** Does nothing, until a view overrides it; called at once with the keys of the shown object's model that changed. */
	changed(keys) {}
	static #awaits(below, key, receiver) {
		if (typeof key !== "string" || key.startsWith("@") || key in below || !(#shown in receiver) || receiver.#shown !== void 0) return false;
		const own = receiver.model;
		return !(typeof own === "object" && own !== null && !Array.isArray(own) && Object.hasOwn(own, key));
	}
	static #forwards(below, key, receiver) {
		if (typeof key !== "string" || key.startsWith("@") || key in below || !(#shown in receiver) || receiver.#shown === void 0) return false;
		const own = receiver.model;
		const shown = receiver.#shown.model;
		const holds = (model) => typeof model === "object" && model !== null && !Array.isArray(model) && Object.hasOwn(model, key);
		return !holds(own) && holds(shown);
	}
	/** The description of the object a view's description shows, the first type argument its `extends` passes; none where it passes no SmartObject. */
	static async shownBy(view) {
		const passed = view.extends?.typeArguments;
		if (passed === void 0) return void 0;
		const type = view.constructor;
		if ("list" in passed) return passed.list.length === 0 ? void 0 : new RelationList(passed, type, view).at(0);
		const first = passed[0];
		return typeof first === "object" && "relation" in first ? new Relation(first, type, view).get() : void 0;
	}
	/** The method a view's description offers under a `name`: its own, or the shown object's it passes through; none where it offers none. */
	static async offered(view, name) {
		const member = view.members.find((each) => each.name === name);
		if (member?.kind === "method") return member;
		return (await View.shownBy(view))?.methodOf(name);
	}
	/**
	* A function that calls the method `name` of whichever SmartObject is shown when the function is called, with that
	* object as `this`. A member can declare it before anything is shown: `install = this.pass('install')`. Refused,
	* naming the view's class and `name`, while nothing is shown.
	*/
	pass(name) {
		return ((...args) => {
			const shown = this.#shown;
			if (shown === void 0) throw new Error(`a ${this.constructor.name} shows no SmartObject yet, so its ${String(name)} reaches none`);
			return shown[name].apply(shown, args);
		});
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/0field/json/StringMap.ts
/**
* Purpose: keep a JSON file of names mapped to strings, and answer by name.
*
* Intention: a {@link JsonObject}.
*/
var StringMap = class extends JsonObject {
	/** Reads a file, or takes the names given; refused, naming where it came from, where a value is no string. */
	constructor(source) {
		super(source);
		if (Object.values(this.model).some((value) => typeof value !== "string")) throw new Error(`not every value a string: ${source instanceof Entry ? source.path : JSON.stringify(source)}`);
	}
	/** The string a name maps to; none where it maps none. */
	get(key) {
		return Object.hasOwn(this.model, key) ? this.model[key] : void 0;
	}
	/** Whether a name maps to a string. */
	has(key) {
		return Object.hasOwn(this.model, key);
	}
};
//#endregion
//#region dependencies/metatrom-ag/Manu/main/common/file-system/File.ts
/** Whether an {@link Entry} is a {@link File} — by the member only a `File` declares. */
function isFile(entry) {
	return "read" in entry;
}
//#endregion
//#region dependencies/metatrom-ag/Manu/main/habitats/node/file-system/ReadOnlyGitFolder.ts
/**
* Purpose: run git on one repository, whatever repository the environment
* names.
*
* Intention: a {@link ReadOnlyNodeFolder} that runs git; names where git works as
* the {@link GitRepository} there reads it.
*/
var ReadOnlyGitFolder = class extends ReadOnlyNodeFolder {
	/** The environment variables that tell git where it works, valued as git would find them in this folder: a working tree, its `.git` a folder or a pointer to one. */
	gitPlaces() {
		const repository = new GitRepository(this);
		const gitDir = repository.gitDir?.path ?? `${this.path}/.git`;
		const common = repository.commonDir?.path ?? gitDir;
		return {
			GIT_DIR: gitDir,
			GIT_WORK_TREE: this.path,
			GIT_INDEX_FILE: `${gitDir}/index`,
			GIT_OBJECT_DIRECTORY: `${common}/objects`,
			GIT_ALTERNATE_OBJECT_DIRECTORIES: "",
			GIT_COMMON_DIR: common,
			GIT_NAMESPACE: ""
		};
	}
	/** What git answers, as bytes; refused, naming the command and this folder, where git fails. */
	git(args, options = {}) {
		try {
			return process.getBuiltinModule("node:child_process").execFileSync("git", args, {
				cwd: this.path,
				stdio: [
					"pipe",
					"pipe",
					"pipe"
				],
				env: this.here(),
				...options
			});
		} catch (error) {
			throw new Error(`git ${args.join(" ")} failed in ${this.path}`, { cause: error });
		}
	}
	/** What git answers, as text without the line it ends on. */
	gitText(args, options = {}) {
		return this.git(args, options).toString("utf8").trim();
	}
	/** The process environment with each of those variables that is set redirected to this folder, as git would find it here. */
	here() {
		const env = { ...process.env };
		if (!elsewhere.some((name) => env[name] !== void 0)) return env;
		const places = this.gitPlaces();
		for (const name of elsewhere) if (env[name] !== void 0) env[name] = places[name];
		return env;
	}
};
const elsewhere = [
	"GIT_DIR",
	"GIT_WORK_TREE",
	"GIT_INDEX_FILE",
	"GIT_OBJECT_DIRECTORY",
	"GIT_ALTERNATE_OBJECT_DIRECTORIES",
	"GIT_COMMON_DIR",
	"GIT_NAMESPACE"
];
//#endregion
//#region dependencies/metatrom-ag/Manu/main/0field.ts
var __rewriteRelativeImportExtension = function(path, preserveJsx) {
	if (typeof path === "string" && /^\.\.?\//.test(path)) return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
		return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
	});
	return path;
};
/**
* Purpose: the 0field — an operating system interface that works in
* any environment.
*
* Intention: follows the Imago strategy — every part fits into what already
* exists. It speaks to the {@link Manu} each habitat realizes —
* {@link NodeKernel}, {@link DenoKernel}, {@link BunKernel}, {@link BrowserKernel} — and knows only
* that contract; it runs each {@link Program} its realm was started with —
* a process's file, a tab's script tags — and every program run beside
* them, each with its own address and words, shows one that is no
* {@link View} in the View its program names, and speaks to every
* SmartObject that carries this file as released and takes from its
* exports what it builds on, the realm's
* {@link persistence} and the kernel's {@link ModuleHookChain} among them,
* and the {@link ModuleHook} a hook written outside this tree realizes.
*/
var OField = class OField extends TypedSmartObject {
	#programs = /* @__PURE__ */ new Set();
	/**
	* Starts the kernel of this habitat — any other environment is named as not implemented yet — then each program the
	* realm was started with, in order, as {@link OField.run} runs one, the first hearing the words {@link words}
	* resolves to, and waits until each one's start has finished; {@link words} resolves to none where the realm names
	* no program. A test is no program; its runner runs it. The started file imports {@link SmartObject} from here, and
	* so starts the 0field by being run.
	*/
	async start() {
		let kernel;
		try {
			kernel = this.#kernel();
			await kernel.start();
		} catch (error) {
			loaded.reject(error);
			throw error;
		}
		loaded.resolve(kernel);
		const programs = kernel.started;
		const [first] = programs;
		if (first === void 0) return heard.resolve([]);
		if (OField.#isTest(first.model.address)) return heard.resolve(first.model.words);
		await OField.#useHooks(first.model.address, kernel.hooks);
		for (const program of programs) await this.#begin(program, program === first ? heard.resolve : () => {});
		await Promise.all(programs.map((program) => program.finished));
	}
	/**
	* Runs one more program in the running kernel, beside every other, once the kernel has started, and hands it out as
	* it begins; its {@link Program.finished} settles once its start has finished. The address is a URL, an oField IRI
	* resolved from the started file's place as its imports are, or a path read from that place; a test file, or an
	* address or a view on a data ref, is refused before anything begins, naming it. The program is the model its
	* file names by a default export that is a `URL`, restored through {@link persistence}, hearing every word; or the
	* file's default export, a {@link SmartObject} class created without arguments, or, where the first word is a
	* model's address, that model restored through {@link persistence} where it is the exported class's and refused
	* otherwise, hearing the words after it. Where the file lacks such an export, the starter's error names the file.
	* Where `attach` names a place, the habitat shows the SmartObject there before it starts, as its kernel attaches;
	* only then, where `view` names a file, read as the address is, a SmartObject that is no {@link View} is shown in that file's
	* default export, created without arguments, refused, naming the file, where it exports no View; a View shows as
	* itself. Before it imports the file, it fills the stores with what the descriptor beside that file uses, and before
	* it restores a model, with what the model names, as {@link Manu.fill} fills them — through GitHub where a
	* store lacks one.
	*/
	async run(address, { words = [], attach, view } = {}) {
		const kernel = await loaded.promise;
		if (OField.#isTest(address)) throw new Error(`a test is run by its runner, not as a program: ${address}`);
		const program = new Program({
			address: kernel.hooks.locate(address, kernel.anchor()),
			words,
			...attach === void 0 ? {} : { attach },
			...view === void 0 ? {} : { view: kernel.hooks.locate(view, kernel.anchor()) }
		});
		await kernel.fill(program.model.address);
		await this.#begin(program, () => {});
		return program;
	}
	/** The programs it runs, in the order they began. */
	get programs() {
		return [...this.#programs];
	}
	/** The program running a SmartObject; none for a SmartObject no program runs. */
	programOf(smartObject) {
		return this.programs.find((program) => program.smartObject === smartObject);
	}
	static async #viewOf(started, address) {
		const exported = (await import(__rewriteRelativeImportExtension(address))).default;
		const isView = typeof exported === "function" && exported.prototype instanceof TypedView;
		const asked = isView ? exported.viewOf : void 0;
		if (typeof asked === "function") return asked.call(exported, started);
		if (started instanceof TypedView) return started;
		if (!isView) throw new Error(`the view it names exports no View by default: ${address}`);
		const view = new exported();
		view.show(started);
		return view;
	}
	static async #useHooks(address, chain) {
		if (!address.startsWith("file:")) return;
		const workbench = Workbench.above(ReadOnlyNodeFolder.fromUrl(address).parent);
		if (workbench === void 0) return;
		const root = `${ReadOnlyNodeFolder.urlOf(ReadOnlyNodeFolder.native(workbench.path))}/`;
		for (const hook of workbench.hooks) try {
			const { default: Hook } = await import(__rewriteRelativeImportExtension(chain.locate(hook, root)));
			chain.use(new Hook(chain));
		} catch (error) {
			console.warn(`the hook ${hook} named in ${workbench.path}/workbench.jsonld is not in use: ${error.message}`);
		}
	}
	static #isTest(address) {
		return /\.test\.[^/]+$/.test(address);
	}
	async #begin(program, hear) {
		const { address, words: said } = program.model;
		const exported = (await import(__rewriteRelativeImportExtension(address))).default;
		const lacks = (fault) => /* @__PURE__ */ new Error(`${fault}: ${address}`);
		let started;
		let heard;
		if (exported instanceof URL) {
			heard = said;
			hear(heard);
			await (await loaded.promise).fill(exported.href);
			started = await persistence.restore(exported.href);
		} else {
			const [model, ...after] = said;
			heard = after;
			hear(heard);
			if (typeof exported !== "function" || !(exported.prototype instanceof TypedSmartObject)) throw lacks("the started file exports no SmartObject by default");
			if (model === void 0 && exported.length > 0) throw lacks("the SmartObject it exports needs arguments to be created");
			if (model !== void 0) await (await loaded.promise).fill(model);
			started = model === void 0 ? new exported() : await persistence.restore(model);
			if (!(started instanceof exported)) throw lacks(`${model} restores as a ${started.constructor.name}, not the SmartObject it exports`);
		}
		const { attach, view } = program.model;
		if (attach !== void 0) {
			const shown = view === void 0 ? started : await OField.#viewOf(started, view);
			(await loaded.promise).attach(shown, attach);
		}
		if (this.#programs.size === 0) this.#listen();
		this.#programs.add(program);
		program.begin(started, heard);
	}
	#listen() {
		const process = globalThis.process;
		if (typeof process?.on !== "function") return;
		let stopping = false;
		for (const [signal, code] of [["SIGINT", 130], ["SIGTERM", 143]]) process.on(signal, async () => {
			if (stopping) process.exit(code);
			stopping = true;
			await Promise.all(this.programs.map(async (program) => {
				try {
					await program.stop();
				} catch (error) {
					console.error(error);
				}
			}));
			process.exit(code);
		});
	}
	#kernel() {
		const realm = globalThis;
		const running = { oField: here };
		const notImplemented = (environment) => /* @__PURE__ */ new Error(`the 0field is not implemented for this environment yet: ${environment}`);
		const serviceWorker = realm.ServiceWorkerGlobalScope;
		if (typeof serviceWorker === "function" && realm.self instanceof serviceWorker) throw notImplemented("ServiceWorker");
		const worker = realm.WorkerGlobalScope;
		if (typeof worker === "function" && realm.self instanceof worker) throw notImplemented("WebWorker");
		if (realm.window?.document !== void 0) return new BrowserKernel(running);
		if (realm.Deno !== void 0) return new DenoKernel(running);
		if (realm.Bun !== void 0) return new BunKernel(running);
		if (typeof realm.process?.versions?.node === "string") return new NodeKernel(running);
		throw new Error("the 0field did not detect its environment");
	}
};
const here = import.meta.url;
const loaded = Promise.withResolvers();
loaded.promise.catch(() => {});
const heard = Promise.withResolvers();
loaded.promise.catch((error) => heard.reject(error));
/**
* The realm's one {@link Persistence}, over the kernel once it loads; every relation restores by it. An address is
* an oField IRI, a path or a URL — in a process a `file:` URL, in a tab one it fetches.
*/
const persistence = new Persistence(loaded.promise);
Relation.use(persistence);
/**
* The words the first program the realm was started with hears — a process's file, a tab's first tag naming one —
* available once its file is read and before it runs, so `start()` can await them. Where its file names its model,
* they are every word it was given; otherwise those after the model's address: `node Cli.ts cli.jsonld --help` hears
* `['--help']`; none where the realm names no program. Await them in `start()`, never at a module's top level, which
* the started file's import is still waiting on.
*/
const words = heard.promise;
words.catch(() => {});
/**
* The kernel's {@link ModuleHookChain}, available once the kernel has started and before the program runs, so
* `start()` can await it where awaiting {@link started} would wait on itself.
*/
const hooks = loaded.promise.then((kernel) => kernel.hooks);
hooks.catch(() => {});
/** The one {@link OField} of this realm, which runs every program; loading this file starts it. */
const oField = new OField();
/** The kernel, once each program the realm was started with has finished its start; never awaited here, as a service worker forbids top-level await. */
const started = oField.start().then(() => loaded.promise);
//#endregion
export { BuiltWorkbench, Entry, GitNotes, ModuleHookChain, NodeStores, OField, OFieldIri, Persistence, Program, ReadOnlyGitFolder, ReadOnlyNodeFile, ReadOnlyNodeFolder, ReadOnlyNodeStorage, Relation, RelationList, RelationMap, RelationSet, Releases, RootedTreeNode, TypedSmartObject as SmartObject, StringMap, TypedView as View, Workbench, hooks, isFile, isFolder, oField, persistence, started, words };
