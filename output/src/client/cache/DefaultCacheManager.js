"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var os = require("os");
var TimeUtils_1 = require("../../util/TimeUtils");
var DefaultCacheManager = /** @class */ (function () {
    function DefaultCacheManager() {
    }
    DefaultCacheManager.prototype.init = function (cacheAudioBasePath) {
        this.lastHandleAudioPaths = new Set();
        this.failHandleAudioPaths = new Set();
        this.cacheAudioBasePath = cacheAudioBasePath;
        !fs.existsSync(cacheAudioBasePath) && fs.mkdirSync(cacheAudioBasePath);
    };
    DefaultCacheManager.prototype.getTodayCacheTaskPath = function () {
        return this.cacheAudioBasePath + '\\' + TimeUtils_1.TimeUtils.getNowFormatDate();
    };
    DefaultCacheManager.prototype.saveTaskPath = function (path) {
        //内存中
        this.lastHandleAudioPaths.add(path); //20161017141228
        this.removeFailTaskPath(path);
        //文件中
        var audioPath = this.getTodayCacheTaskPath();
        var isExist = fs.existsSync(audioPath);
        if (!isExist) {
            var audioPathContent = path + os.EOL;
            fs.writeFileSync(audioPath, audioPathContent);
            return false;
        }
        var content = fs.readFileSync(audioPath).toString();
        if (content.indexOf(path) < 0) {
            var audioPathContent = path + os.EOL;
            fs.appendFile(audioPath, audioPathContent, function (err) {
                if (err)
                    console.log('CacheManager saveTaskPath err', err);
            });
            return false;
        }
        return true;
    };
    DefaultCacheManager.prototype.saveFailTaskPath = function (path) {
        this.failHandleAudioPaths.add(path);
        this.removeLastTaskPathOnlyCache(path);
        this.removeLastTaskPathOnlyFile(path);
    };
    DefaultCacheManager.prototype.removeFailTaskPath = function (path) {
        this.failHandleAudioPaths.delete(path);
    };
    DefaultCacheManager.prototype.removeLastTaskPathOnlyFile = function (path) {
        var audioPath = this.getTodayCacheTaskPath();
        var content = fs.readFileSync(audioPath).toString();
        if (content.indexOf(path) > -1) {
            content.replace(path, '');
            var audioPathContent = path + os.EOL;
            fs.writeFileSync(audioPath, audioPathContent);
            return true;
        }
        return false;
    };
    DefaultCacheManager.prototype.removeLastTaskPathOnlyCache = function (path) {
        this.lastHandleAudioPaths.delete(path);
    };
    DefaultCacheManager.prototype.removeAllTaskPath = function () {
        this.lastHandleAudioPaths.clear();
        this.failHandleAudioPaths.clear();
    };
    DefaultCacheManager.prototype.backUpTaskPathByTimer = function () {
    };
    DefaultCacheManager.prototype.saveTranslateResult = function (model) {
    };
    return DefaultCacheManager;
}());
exports.DefaultCacheManager = DefaultCacheManager;
