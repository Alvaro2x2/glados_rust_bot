# Node-prefs

> *User preferences and configuration settings persistence feature for `node.js` apps.*

## Overview

`Node-prefs` module lets you easily persist and retrieve user preferences and configuration settings in your `node.js` app. Install and include it in your project, so you can focus on your app development.

All user preferences and configuration settings are stored locally in a JSON file with a specified file path and file name.

## Installation

`npm install node-prefs`

or

`npm install --save node-prefs`

---

## Usage

```js

const NodePrefs = require('node-prefs');
const prefs = new NodePrefs({
  fileName: "config.js",
  defaults: {
    window: {
      width: 600,
      height: 300
    }
  }
});

prefs.set('foo', 'bar');
console.log(prefs.get('foo'));
//=> bar

console.log(prefs.get("window"));
//=> { width: 600, height: 300 }

// use dot-notation to access nested properties
prefs.set('window.width', 700);
console.log(prefs.get("window"));
//=> { width: 700, height: 300 }
console.log(prefs.get('window.width'));
//=> 700

prefs.delete('foo');
console.log(prefs.get('foo'));
//=> undefined

```

---

## API

* ### **Constructor:**

▸ **`new NodePrefs(mOptions)`**

Creates an instance of `NodePrefs`.

***Parameters:***

|Type|Name|Description|
|:---|:---|:----------|
|`Object`|`mOptions`|A JSON-like object containing instance options|
|`String`|`mOptions.fileName`|The name of the file where preferences are stored|
|`String`|`mOptions.sFilePath`|The full path to the settings data file.|
|`Object`|`mOptions.defaults`|A set of default settings and/or preferences|

---

* ### **Properties:**

|Type|Name|Description|Read-only|Static|
|:---|:---|:---|:---|:---|
|`Object`|**`defaults`**|The default values for this instance.|Yes|No|
|`String`|**`path`**|The full path to the configuration data file.|Yes|No|
|`Number`|**`size`**|he number of entries in the settings file (same as `length`).|Yes|No|
|`Number`|**`length`**|he number of entries in the settings file (same as `size`).|Yes|No|

---

* ### **Methods:**

▸ **`NodePrefs.parseDataFile(sFilePath, mDefaults)`**

  Reads the settings data file and returns its content as a `JSON` object.

  ***Parameters:***

  |Type|Name|Description|
  |:---|:---|:----------|
  |`String`|`sFilePath`|The full path to the settings data file.|
  |`Object`|`mDefaults`|A set of default values to return if it fails loading the settings data file.|

  ***Returns:*** `Object` - A `JSON`-like object containing the settings and user preferences iub the data file.

  ---

▸ **`NodePrefs.flattenObject(oObj, sSeparator)`**

  *Flattens* nested objects into a single-depth object. For example:

  `{ foo: 'bar', baz: { foo: 'bar' } }`

  will turn into:

  `{ foo: 'bar', 'baz.foo': 'bar' }`

  ***Parameters:***

  |Type|Name|Description|
  |:---|:---|:----------|
  |`Object`|`oObj`|The object (with nested objects) to *flatten*.|
  |`String`|`sSeparator`|A string to use as separator between the keys. By default, the separator is `.` (dot).|

  ***Returns:*** `Object` - The *flatten* object.

  ---

▸ **`NodePrefs.prototype.clear()`**

  Removes all the settings in the settings list.

  ***Parameters:*** None

  ***Returns:*** `NodePrefs` - Self-reference for method chaining calls.

  ---

▸ **`NodePrefs.prototype.delete(sKey)`**

  Removes the specified settings item from the settings list.

  ***Parameters:***

  |Type|Name|Description|
  |:---|:---|:----------|
  |`String`|`sKey`|The settings item to remove.|

  ***Returns:*** `NodePrefs` - Self-reference for method chaining calls.

  ---

▸ **`NodePrefs.prototype.entries()`**

  Returns a array containing all the `[key, value]` pairs for each settings item in the settings list.

  ***Parameters:*** None

  ***Returns:*** `Array` - The `[key, value]` pairs array.

  ---

▸ **`NodePrefs.prototype.forEach(fCallback, thisArg)`**

  Executes the given function once for each `key-value` pair in the settings list.

  ***Parameters:***

  |Type|Name|Description|
  |:---|:---|:----------|
  |`Function`|`fCallback`|The function to execute for each `key-value` pair.|
  |`Object`|`thisArg`|The value of `this` when executing the callback function.|

  ***Returns:*** `NodePrefs` - Self-reference for method chaining calls.

  ---

▸ **`NodePrefs.prototype.has(sKey)`**

  Returns whether the settings list contains a settings item with the given key or not.

  ***Parameters:***

  |Type|Name|Description|
  |:---|:---|:----------|
  |`String`|`sKey`|The key to check the settings list for.|

  ***Returns:*** `Boolean` - `true` if the settings list contains a settings item with given key, or `false` otherwise.

  ---

▸ **`NodePrefs.prototype.get(sKey)`**

  Gets the value of the settings item referenced by the given key in the settings list, or the whole list if no key is given.

  ***Parameters:***

  |Type|Name|Description|
  |:---|:---|:----------|
  |`String`|`sKey`|The key of a settings item in the settings list.|

  ***Returns:*** `any` - The value of the settings item referenced by the key in the settings list, or the whole list if no key is given.

  ---

▸ **`NodePrefs.prototype.set(sKey, sValue)`**

  Sets the given value as the value of the settings item referenced by the given key in the settings list.

  ***Parameters:***

  |Type|Name|Description|
  |:---|:---|:----------|
  |`String`|`sKey`|The key of a settings item in the settings list.|
  |`any`|`sValue`|The value to assign to the settings item referenced by the key in the settings list.|

  ***Returns:*** `NodePrefs` - Self-reference for method chaining calls.

  ---

▸ **`NodePrefs.prototype.keys()`**

  Returns the names of all enumerable settings and preferences of this object.

  ***Parameters:*** None

  ***Returns:*** `String[]` - The names of the enumerable settings and preferences.

  ---

▸ **`NodePrefs.prototype.values()`**

  Returns the names of all enumerable settings and preferences of this object.

  ***Parameters:*** None

  ***Returns:*** `String[]` - The values of the enumerable settings and preferences.

---

## Version

  1.0.7

---