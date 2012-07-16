var now = new Date(),
    _ = require('./underscore-min.js');

module.exports = (function() {

    function convertMultipleObjectsToOneObject(collection) {
         var newCollection = {};
         if (collection.length > 1) {
            _.reduce(collection, function(first, second) { 
                collect(newCollection, first, second);
            });
        } else {
            collect(newCollection, collection[0]);
        }

        return newCollection;
    }

    function collect(obj) {
        var i;
        obj = obj || {};
        for(i=1;i<arguments.length;i++) {
          var arg=arguments[i];
          if(typeof arg != "object") continue;
          obj[arg.name] = arg.value;
        }
        return obj;
    }

    function deepCopy(objToBeCloned) {
        return JSON.parse(JSON.stringify(objToBeCloned));
    }

    function clone(objToBeCloned, deepCopy) {
        var cloneObj, index;

        if (null === objToBeCloned || 'object' != typeof objToBeCloned) return objToBeCloned;

        if (deepCopy) {
            cloneObj = objToBeCloned.constructor();
            for (var attr in objToBeCloned) {
                if (objToBeCloned.hasOwnProperty(attr)) {
                    cloneObj[attr] = objToBeCloned[attr];
                }
            }
        } else {
            if (Array.isArray(objToBeCloned)) {
                cloneObj = objToBeCloned.slice(0);
            } else {
                cloneObj = Object.keys(objToBeCloned);
            }
        }

        return cloneObj;
    }

    function match(text, compareTo) {
        var indexUrl,
            group,
            pattern;

        pattern = new RegExp('\^' + compareTo + '\$');
        return text.match(pattern) !== null;
    }

    /*
    From ECMAScript 5 Section 8.6.2 if you're interested:
    The value of the [[Class]] internal property is defined by this specification for every kind of built-in object. The value of the [[Class]] internal property of a host object may be any String value except one of "Arguments", "Array", "Boolean", "Date", "Error", "Function", "JSON", "Math", "Number", "Object", "RegExp", and "String". The value of a [[Class]] internal property is used internally to distinguish different kinds of objects. Note that this specification does not provide any means for a program to access that value except through Object.prototype.toString (see 15.2.4.2).
    */
    function isObject(obj) {
        return (Object.prototype.toString.call(obj) === '[object Object]');
    }

    function replaceProperty(obj, propName, propValue) {
        var key;

        if (obj) {
            for (key in obj) {
                if (isObject(obj[key])) {
                    replaceProperty(obj[key], propName, propValue);
                } else if (key === propName) {
                    obj[key] = propValue;
                }
            }
        }
    }

    function size(obj) {
        var result;

        if (!obj) {
            return 0;
        }
        
        try {
            result = Object.keys(obj).length;
        }
        catch (err) {
            if (err instanceof TypeError) {
                result = obj.length;
            }
        }
        return result;
    }

    function validate(rules) {
        var index1,
            index2,
            values,
            compareTo;

        for (index1 = size(rules); index1--;) {
            values = rules[index1].values;
            compareTo = clone(rules[index1].compareTo);
            for (index2 = size(values); index2--;) {
                if (compareTo.indexOf(values[index2]) < 0) {
                    return false;
                }
            }
        }
        return true;
    }

    function isJson(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    return {
        convertMultipleObjectsToOneObject: convertMultipleObjectsToOneObject,
        collect: collect,
        match: match,
        replaceProperty: replaceProperty,
        deepCopy: deepCopy,
        clone: clone,
        validate: validate,
        size: size,
        isJson: isJson,
        isObject: isObject
    };
}());
