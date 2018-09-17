"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FileUtils_1 = require("./../../util/FileUtils");
var fs = require("fs");
var os = require("os");
var TimeUtils_1 = require("../../util/TimeUtils");
var DefaultCacheManager = /** @class */ (function () {
    function DefaultCacheManager() {
        this.retryCount = 1;
    }
    DefaultCacheManager.prototype.init = function (_a) {
        var audioSrcBasePath = _a.audioSrcBasePath, cacheResBasePath = _a.cacheResBasePath, handleTaskPath = _a.handleTaskPath, divisionPath = _a.divisionPath, transformPath = _a.transformPath, translateTextPath = _a.translateTextPath;
        this.lastHandleAudioPaths = new Set();
        this.failHandleAudioPathMap = new Map();
        this.audioSrcBasePath = audioSrcBasePath;
        this.cacheResBasePath = cacheResBasePath;
        this.handleTaskPath = handleTaskPath;
        this.divisionPath = divisionPath;
        this.transformPath = transformPath;
        this.translateTextPath = translateTextPath;
        !fs.existsSync(audioSrcBasePath) && fs.mkdirSync(audioSrcBasePath);
        !fs.existsSync(cacheResBasePath) && fs.mkdirSync(cacheResBasePath);
        !fs.existsSync(handleTaskPath) && fs.mkdirSync(handleTaskPath);
        !fs.existsSync(divisionPath) && fs.mkdirSync(divisionPath);
        !fs.existsSync(transformPath) && fs.mkdirSync(transformPath);
        !fs.existsSync(translateTextPath) && fs.mkdirSync(translateTextPath);
        console.log('DefaultCacheManager audioSrcBasePath ', audioSrcBasePath);
        console.log('DefaultCacheManager cacheResBasePath ', cacheResBasePath);
        console.log('DefaultCacheManager handleTaskPath ', handleTaskPath);
        console.log('DefaultCacheManager divisionPath', divisionPath);
        console.log('DefaultCacheManager transformPath', transformPath);
        console.log('DefaultCacheManager translateTextPath', translateTextPath);
    };
    DefaultCacheManager.prototype.getTodayCacheTaskPath = function () {
        return this.handleTaskPath + '\\' + TimeUtils_1.TimeUtils.getNowFormatDate() + '.txt';
    };
    DefaultCacheManager.prototype.getAudioSrcBasePath = function () {
        return this.audioSrcBasePath;
    };
    DefaultCacheManager.prototype.getDivisionPath = function () {
        return this.divisionPath;
    };
    DefaultCacheManager.prototype.getTransformPath = function () {
        return this.transformPath;
    };
    DefaultCacheManager.prototype.getTranslateTextPath = function () {
        return this.translateTextPath;
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
    DefaultCacheManager.prototype.removeAllTaskCacheData = function () {
        this.lastHandleAudioPaths.clear();
        this.failHandleAudioPathMap.clear();
        FileUtils_1.FileUtils.rmdirOnlyDir(this.cacheResBasePath);
    };
    DefaultCacheManager.prototype.saveTranslateResultToDb = function (model) {
    };
    DefaultCacheManager.prototype.saveTranslateTextToFile = function (_a) {
        var fileNameExcludeSuffix = _a.fileNameExcludeSuffix, translateTextArr = _a.translateTextArr;
        var translateTextPath = this.getTranslateTextPath() + '\\' + TimeUtils_1.TimeUtils.getNowFormatDate();
        !fs.existsSync(translateTextPath) && fs.mkdirSync(translateTextPath);
        translateTextPath += '\\' + fileNameExcludeSuffix + '.txt';
        fs.writeFileSync(translateTextPath, translateTextArr.join(os.EOL));
    };
    DefaultCacheManager.prototype.getAllUnTranslateList = function () {
        return null;
    };
    return DefaultCacheManager;
}());
exports.DefaultCacheManager = DefaultCacheManager;
