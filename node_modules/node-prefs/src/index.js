/*eslint no-useless-escape:off*/
const path = require('path');
const fs = require('fs');

let mDefaults = new WeakMap();
let mPrefs = new WeakMap();
let sPath = new WeakMap();

/**
 * @class NodePrefs
 * Expose the <code>NodePrefs</code> class
 */
module.exports = class NodePrefs {
  /**
   * Reads the settings data file and returns its content as a `JSON` object.
   * @static
   * @param  {String} sFilePath The full path to the settings data file.
   * @param  {Object} mDefaults A set of default values to return if it fails loading the settings data file.
   * @return {Object} A `JSON`-like object containing the settings and user preferences iub the data file.
   * @memberof NodePrefs
   */
  static parseDataFile(sFilePath, mDefaults) {
    mDefaults = typeof mDefaults === "object" ? mDefaults : {};
    try {
      // Using the async API of node.js for this purpose
      let mData = JSON.parse(fs.readFileSync(sFilePath));
      return Object.assign(Object.assign({}, mDefaults), mData);
    } catch (error) {
      // In case of an error, just return the 'defaults" instead.
      return Object.assign({}, mDefaults);
    }
  }

  /**
   * *Flattens* nested objects into a single-depth object. For example:
   * `{ foo: 'bar', baz: { foo: 'bar' } }` will turn into: `{ foo: 'bar', 'baz.foo': 'bar' }`.
   * @static
   * @param  {Object} oObj The object (with nested objects) to *flatten*.
   * @param  {String} sSeparator A string to use as separator between the keys. By default, the separator is `.` (dot).
   * @return {Object} The *flatten* object
   * @memberof NodePrefs
   */
  static flattenObject(oObj, sSeparator) {
    oObj = typeof oObj === "object" ? oObj : {};
    sSeparator = typeof sSeparator === "string" ? sSeparator : ".";
    return Object.entries(oObj).reduce((o, aArr) => {
      if (typeof aArr[1] === "object") {
        let oTmp = NodePrefs.flattenObject(aArr[1]);
        Object.keys(oTmp).forEach((sKey) => {
          o[`${aArr[0]}${sSeparator}${sKey}`] = oTmp[sKey];
        });
      } else {
        o[aArr[0]] = aArr[1];
      }
      return o;
    }, {});
  }

  /**
   * Creates an instance of `NodePrefs`.
   * @param  {Object} mOptions 
   * @param  {String} mOptions.filePath 
   * @param  {String} mOptions.fileName 
   * @param  {Object} mOptions.defaults 
   * @memberof NodePrefs.prototype
   */
  constructor(mOptions) {
    mOptions = mOptions && typeof mOptions === "object" ? mOptions : {};
    mOptions.filePath = mOptions.filePath || process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local');
    mOptions.fileName = mOptions.fileName || "prefs";

    // Use the `fileName` option to generate the full path for the settings file
    sPath.set(this, path.join(mOptions.filePath, mOptions.fileName + '.json'));
    mDefaults.set(this, Object.freeze(mOptions.defaults));
    mPrefs.set(this, NodePrefs.parseDataFile(this.path, NodePrefs.flattenObject(this.defaults)));
  }

  /**
   * @returns {Object} - The default values for this instance.
   * @readonly
   * @memberof NodePrefs.prototype
   */
  get defaults() {
    return mDefaults.get(this);
  }

  /**
   * @returns {String} - The full path to the configuration data file.
   * @readonly
   * @memberof NodePrefs.prototype
   */
  get path() {
    return sPath.get(this);
  }

  /**
   * @returns {Number} - The number of entries in the settings file (same as `length`).
   * @readonly
   * @memberof NodePrefs.prototype
   */
  get size() {
    return Object.entries(mPrefs.get(this)).length;
  }

  /**
   * @returns {Number} - The number of entries in the settings file (same as `size`).
   * @readonly
   * @memberof NodePrefs.prototype
   */
  get length() {
    return Object.entries(mPrefs.get(this)).length;
  }

  /**
   * Removes all the settings in the settings list.
   * @return {NodePrefs} Self-reference for method chaining calls.
   * @memberof NodePrefs.prototype
   */
  clear() {
    mPrefs.set(this, {});
    return this._save();
  }

  /**
   * Removes the specified settings item from the settings list.
   * @param  {String} sKey The settings item to remove.
   * @return {NodePrefs} Self-reference for method chaining calls.
   * @memberof NodePrefs.prototype
   */
  delete(sKey) {
    delete mPrefs.get(this)[sKey];
    return this._save();
  }

  /**
   * Returns a array containing all the `[key, value]` pairs for each settings item in the settings list.
   * @return {Array} The `[key, value]` pairs array.
   * @memberof NodePrefs.prototype
   */
  entries() {
    return Object.entries(mPrefs.get(this));
  }

  /**
   * Executes the given function once for each `key-value` pair in the settings list.
   * @param  {Function} fCallback The function to execute for each `key-value` pair.
   * @param  {Object} thisArg The value of `this` when executing the callback function.
   * @return {NodePrefs} Self-reference for method chaining calls.
   * @memberof NodePrefs.prototype
   */
  forEach(fCallback, thisArg) {
    if (typeof fCallback === "function") {
      this.entries().forEach(fCallback, thisArg);
    }
    return this;
  }

  /**
   * Returns whether the settings list contains a settings item with the given key or not.
   * @param  {String} sKey The key to check the settings list for.
   * @return {Boolean} `true` if the settings list contains a settings item with given key, or `false` otherwise.
   * @memberof NodePrefs.prototype
   */
  has(sKey) {
    return Object.prototype.hasOwnProperty.call(mPrefs.get(this), "" + sKey);
  }

  /**
   * Gets the value of the settings item referenced by the given key in the settings list, or the whole list if no key is given.
   * @param  {String} sKey The key of a settings item in the settings list.
   * @return {any}  The value of the settings item referenced by the key in the settings list, or the whole list if no key is given.
   * @memberof NodePrefs.prototype
   */
  get(sKey) {
    let oPrefs = mPrefs.get(this);
    if (!sKey) {
      return Object.assign({}, oPrefs);
    } else if (Object.prototype.hasOwnProperty.call(oPrefs, sKey)) {
      return oPrefs[sKey];
    }

    let oRx = new RegExp(sKey + "[\.\S]+");
    return Object.entries(oPrefs).reduce((o, oArr) => {
      if (oRx.test(oArr[0])) {
        o = o || {};
        o[oArr[0].replace(`${sKey}.`, "")] = oArr[1];
      }
      return o;
    }, undefined);
  }

  /**
   * Sets the given value as the value of the settings item referenced by the given key in the settings list.
   * @param  {String} sKey The key of a settings item in the settings list.
   * @param  {any} sValue The value to assign to the settings item referenced by the key in the settings list.
   * @return {NodePrefs} Self-reference for method chaining calls.
   * @memberof NodePrefs.prototype
   */
  set(sKey, sValue) {
    if (typeof sKey !== 'string') {
      throw new TypeError(`Expected \`sKey\` to be of type \`string\`, got ${typeof sKey}`);
    }

    if (sValue === undefined) {
      throw new TypeError('Use the `.delete()` method to clear values');
    }

    mPrefs.get(this)[sKey] = sValue;
    return this._save();
  }

  /**
   * Returns the names of all enumerable settings and preferences of this object.
   * @return {String[]} The names of the enumerable settings and preferences.
   * @memberof NodePrefs.prototype
   */
  keys() {
    return Object.keys(mPrefs.get(this));
  }

  /**
   * Returns the values of all enumerable settings and preferences of this object.
   * @return {String[]} The values of the enumerable settings and preferences.
   * @memberof NodePrefs.prototype
   */
  values() {
    return Object.values(mPrefs.get(this));
  }

  /**
   * Persists the current state of the instance to its data file.
   * @private
   * @return {NodePrefs} Self-reference for method chaining calls.
   * @memberof NodePrefs.prototype
   */
  _save() {
    mPrefs.set(this, NodePrefs.flattenObject(mPrefs.get(this)));
    try {
      // Using the node.js' synchronous APIs for this purpose.
      fs.writeFileSync(this.path, JSON.stringify(mPrefs.get(this)));
    } catch (error) {
      // console.log(error);
    }
    return this;
  }
};
