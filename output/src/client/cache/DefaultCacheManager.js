"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PhoneSessionModel_1 = require("./../PhoneSessionModel");
var FileUtils_1 = require("./../../util/FileUtils");
var fs = require("fs");
var os = require("os");
var TimeUtils_1 = require("../../util/TimeUtils");
var config_1 = require("../../config");
var path = require('path');
var isDebug = false;
var DefaultCacheManager = /** @class */ (function () {
    function DefaultCacheManager() {
        this.defaultRetryCount = config_1.resolveAudioRetryCount;
        this.scanCount = 0;
        this.supportDocumentFomrat = ['mp3', 'pcm', 'wav'];
    }
    DefaultCacheManager.prototype.init = function (_a) {
        var audioSrcBasePath = _a.audioSrcBasePath, cacheResBasePath = _a.cacheResBasePath, handleTaskPath = _a.handleTaskPath, divisionPath = _a.divisionPath, transformPath = _a.transformPath, translateTextPath = _a.translateTextPath;
        this.lastHandleFileNames = new Set();
        this.failHandleFileNameMap = new Map();
        this.cacheResBasePath = cacheResBasePath;
        this.audioSrcBasePath = audioSrcBasePath;
        this.handleTaskListPath = handleTaskPath;
        this.divisionPath = divisionPath;
        this.transformPath = transformPath;
        this.translateTextPath = translateTextPath;
        !fs.existsSync(cacheResBasePath) && fs.mkdirSync(cacheResBasePath);
        !fs.existsSync(audioSrcBasePath) && fs.mkdirSync(audioSrcBasePath);
        !fs.existsSync(handleTaskPath) && fs.mkdirSync(handleTaskPath);
        !fs.existsSync(divisionPath) && fs.mkdirSync(divisionPath);
        !fs.existsSync(transformPath) && fs.mkdirSync(transformPath);
        !fs.existsSync(translateTextPath) && fs.mkdirSync(translateTextPath);
        isDebug && console.log('DefaultCacheManager audioSrcBasePath ', audioSrcBasePath);
        isDebug && console.log('DefaultCacheManager cacheResBasePath ', cacheResBasePath);
        isDebug && console.log('DefaultCacheManager handleTaskPath ', handleTaskPath);
        isDebug && console.log('DefaultCacheManager divisionPath', divisionPath);
        isDebug && console.log('DefaultCacheManager transformPath', transformPath);
        isDebug && console.log('DefaultCacheManager translateTextPath', translateTextPath);
    };
    DefaultCacheManager.prototype.getNeedHandleFiles = function () {
        var _this = this;
        this.scanCount++;
        var scanFiles = fs.readdirSync(this.getAudioSrcBasePath());
        console.log('DefaultCacheManager 开始扫描指定目录下的文件,自动过滤非音频文件、已经解析的文件 扫描次数:', this.scanCount);
        var meetFiles = scanFiles.filter(function (fileName) {
            if (_this.lastHandleFileNames.has(fileName)) {
                return false;
            }
            var absolutePath = "" + _this.getAudioSrcBasePath() + path.sep + fileName;
            var stat = fs.lstatSync(absolutePath);
            if (!stat.isFile()) {
                isDebug && console.log('filter ', fileName, '  !stat.isFile():', !stat.isFile());
                return false;
            }
            var isHandle = _this.isSaveTaskPath(fileName);
            if (isHandle) {
                isDebug && console.log('filter ', fileName, '  isHandle:', isHandle);
                return false;
            }
            var suffix = fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length);
            if (_this.supportDocumentFomrat.indexOf(suffix) < 0) {
                isDebug && console.log('filter ', fileName, '  只支持mp3和1分钟时长的pcm和wav格式音频');
                return false;
            }
            return true;
        });
        var newMeetModels = meetFiles.map(function (fileName, index, files) {
            var model = new PhoneSessionModel_1.PhoneSessionModel();
            model.buildModel({ fileName: fileName });
            return model;
        });
        return newMeetModels;
    };
    DefaultCacheManager.prototype.getTodayCacheTaskPath = function () {
        return this.handleTaskListPath + path.sep + TimeUtils_1.TimeUtils.getNowFormatDate() + '.txt';
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
    DefaultCacheManager.prototype.isSaveTaskPath = function (path) {
        //内存中
        this.lastHandleFileNames.add(path); //20161017141228
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
        var isExist = this.failHandleFileNameMap.has(path);
        var retryCount = 1;
        if (isExist) {
            retryCount = this.failHandleFileNameMap.get(path);
            retryCount++;
        }
        this.failHandleFileNameMap.set(path, retryCount);
    };
    DefaultCacheManager.prototype.getRetryModelsByToday = function () {
        var _this = this;
        var retryTasks = [];
        this.failHandleFileNameMap.forEach(function (value, key, map) {
            if (value <= _this.defaultRetryCount) {
                retryTasks.push(key);
            }
        });
        return retryTasks;
    };
    DefaultCacheManager.prototype.removeFailTaskPath = function (path) {
        var isExist = this.failHandleFileNameMap.has(path);
        if (isExist) {
            this.failHandleFileNameMap.delete(path);
        }
    };
    DefaultCacheManager.prototype.removeLastTaskPathOnlyFile = function (fileName) {
        var audioPath = this.getTodayCacheTaskPath();
        var content = fs.readFileSync(audioPath).toString();
        if (content.indexOf(fileName) > -1) {
            content.replace(fileName, '');
            var audioPathContent = fileName + os.EOL;
            fs.writeFileSync(audioPath, audioPathContent);
            return true;
        }
        return false;
    };
    DefaultCacheManager.prototype.removeLastTaskPathOnlyCache = function (path) {
        this.lastHandleFileNames.delete(path);
    };
    DefaultCacheManager.prototype.removeAllTaskCacheByOneLoop = function () {
        // FileUtils.rmdirOnlyFile(this.cacheResBasePath, [this.handleTaskListPath, this.audioSrcBasePath, this.translateTextPath]);
        FileUtils_1.FileUtils.rmdirOnlyFile(this.cacheResBasePath, [this.handleTaskListPath]);
    };
    DefaultCacheManager.prototype.removeAllTaskCacheByAtTime = function () {
        this.lastHandleFileNames.clear();
        this.failHandleFileNameMap.clear();
        FileUtils_1.FileUtils.rmdirOnlyFile(this.handleTaskListPath);
        // FileUtils.rmdirOnlyFile(this.audioSrcBasePath);
    };
    DefaultCacheManager.prototype.saveTranslateText = function (sessionModel, fileNameExcludeSuffix, translateTextArr) {
        var translateTextPath = this.getTranslateTextPath() + path.sep + TimeUtils_1.TimeUtils.getNowFormatDate();
        !fs.existsSync(translateTextPath) && fs.mkdirSync(translateTextPath);
        translateTextPath += path.sep + fileNameExcludeSuffix + '.txt';
        fs.writeFileSync(translateTextPath, translateTextArr.join(os.EOL));
    };
    return DefaultCacheManager;
}());
exports.DefaultCacheManager = DefaultCacheManager;
