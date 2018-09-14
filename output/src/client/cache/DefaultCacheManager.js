"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var os = require("os");
var TimeUtils_1 = require("../../util/TimeUtils");
var DefaultCacheManager = /** @class */ (function () {
    function DefaultCacheManager() {
        this.retryCount = 1;
    }
    DefaultCacheManager.prototype.init = function (cacheAudioBasePath) {
        this.lastHandleAudioPaths = new Set();
        this.failHandleAudioPathMap = new Map();
        this.cacheAudioBasePath = cacheAudioBasePath;
        !fs.existsSync(cacheAudioBasePath) && fs.mkdirSync(cacheAudioBasePath);
    };
    DefaultCacheManager.prototype.getTodayCacheTaskPath = function () {
        return this.cacheAudioBasePath + '\\' + TimeUtils_1.TimeUtils.getNowFormatDate() + '.txt';
    };
    DefaultCacheManager.prototype.saveTaskPath = function (path) {
        //内存中
        this.lastHandleAudioPaths.add(path); //20161017141228
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
        var isExist = this.failHandleAudioPathMap.has(path);
        var retryCount = 1;
        if (isExist) {
            retryCount = this.failHandleAudioPathMap.get(path);
            retryCount++;
        }
        this.failHandleAudioPathMap.set(path, retryCount);
    };
    DefaultCacheManager.prototype.getRetryTaskPathsByToday = function () {
        var _this = this;
        var retryTasks = [];
        this.failHandleAudioPathMap.forEach(function (value, key, map) {
            if (value == _this.retryCount) {
                retryTasks.push(key);
            }
        });
        return retryTasks;
    };
    DefaultCacheManager.prototype.removeFailTaskPath = function (path) {
        var isExist = this.failHandleAudioPathMap.has(path);
        if (isExist) {
            this.failHandleAudioPathMap.delete(path);
        }
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
        this.failHandleAudioPathMap.clear();
    };
    DefaultCacheManager.prototype.backUpTaskPathByTimer = function () {
    };
    DefaultCacheManager.prototype.saveTranslateResult = function (model) {
    };
    return DefaultCacheManager;
}());
exports.DefaultCacheManager = DefaultCacheManager;
