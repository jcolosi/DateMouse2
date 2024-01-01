/**
 * Hashset
 * @author: Colosi
 * @source: https://stackoverflow.com/questions/24196067/what-is-the-javascript-equivalent-to-a-c-sharp-hashset
 * @version: 1.0
 */

function Hashset() {

    this.map = {};

    this.add = function (key) {
        this.map[key] = true;
    };

    this.remove = function (key) {
        delete this.map[key];
    };

    this.clear = function () {
        this.map = {};
    };

    this.contains = function (key) {
        return this.map.hasOwnProperty(key);
    };

    this.size = function () {
        return Object.keys(this.map).length;
    };

    this.keys = function () {
        return Object.keys(this.map);
    }
};
