"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var PhoneSessionModel_1 = require("../PhoneSessionModel");
var DefaultCacheManager_1 = require("./DefaultCacheManager");
var node_fetch_1 = require("node-fetch");
var fs = require("fs");
var config_1 = require("../../config");
var mysql = require('mysql');
var path = require('path');
var maxRecogniseCount = 2;
var ISDEBUG = false;
var MySqlCacheManager = /** @class */ (function (_super) {
    __extends(MySqlCacheManager, _super);
    function MySqlCacheManager() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.pageCount = config_1.pageCountByDb;
        return _this;
    }
    MySqlCacheManager.prototype.init = function (_a) {
        var audioSrcBasePath = _a.audioSrcBasePath, cacheResBasePath = _a.cacheResBasePath, handleTaskPath = _a.handleTaskPath, divisionPath = _a.divisionPath, transformPath = _a.transformPath, translateTextPath = _a.translateTextPath;
        _super.prototype.init.call(this, { audioSrcBasePath: audioSrcBasePath, cacheResBasePath: cacheResBasePath, handleTaskPath: handleTaskPath, divisionPath: divisionPath, transformPath: transformPath, translateTextPath: translateTextPath });
        try {
            this.connection = mysql.createConnection(config_1.dbConfig);
        }
        catch (e) {
            config_1.logger.error(e);
        }
    };
    MySqlCacheManager.prototype.saveTranslateText = function (sessionModel, fileNameExcludeSuffix, translateTextArr) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                // super.saveTranslateText(sessionModel, fileNameExcludeSuffix, translateTextArr);
                return [2 /*return*/, new Promise(function (rs, rj) {
                        sessionModel.call_content_baidu = translateTextArr.join();
                        var sql = 'UPDATE call_history SET call_content_baidu=? WHERE id = ?';
                        var params = [sessionModel.call_content_baidu, sessionModel.id];
                        _this.connection && _this.connection.query(sql, params, function (err, result) {
                            err && config_1.logger.error('MySqlCacheManager saveTranslateText [UPDATE ERROR] - ', err.message);
                            rs(1);
                        });
                    })];
            });
        });
    };
    MySqlCacheManager.prototype.addBaiDuRecogniseCount = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var selectListPromise, baidu_recognise_count, updatePromise;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (rs, rj) {
                            var searchSql = "SELECT baidu_recognise_count FROM call_history WHERE id=?";
                            _this.connection && _this.connection.query(searchSql, [id], function (err, result) {
                                if (err) {
                                    config_1.logger.error('MySqlCacheManager  addBaiDuRecogniseCount[SELECT ERROR] - ', err.message);
                                    rs(false);
                                    return;
                                }
                                ISDEBUG && console.log('MySqlCacheManager  addBaiDuRecogniseCount SELECT result  ', result);
                                rs(result);
                            });
                        })];
                    case 1:
                        selectListPromise = _a.sent();
                        baidu_recognise_count = selectListPromise[0].baidu_recognise_count;
                        return [4 /*yield*/, new Promise(function (rs, rj) {
                                var searchSql = "UPDATE  call_history SET baidu_recognise_count = ? WHERE id=?";
                                _this.connection && _this.connection.query(searchSql, [baidu_recognise_count + 1, id], function (err, result) {
                                    if (err) {
                                        config_1.logger.error('MySqlCacheManager addBaiDuRecogniseCount [UPDATE ERROR] - ', err.message);
                                        rs(false);
                                        return;
                                    }
                                    ISDEBUG && console.log('MySqlCacheManager  addBaiDuRecogniseCount UPDATE result  ', result);
                                    rs("1");
                                });
                            })];
                    case 2:
                        updatePromise = _a.sent();
                        return [2 /*return*/, updatePromise];
                }
            });
        });
    };
    MySqlCacheManager.prototype.getAllUnTranslateList = function () {
        var _this = this;
        var selectListPromise = new Promise(function (rs, rj) { return __awaiter(_this, void 0, void 0, function () {
            var searchSql;
            return __generator(this, function (_a) {
                searchSql = "SELECT id,monitor_filename FROM call_history WHERE call_content_baidu IS NULL AND baidu_recognise_count < " + maxRecogniseCount + "  ORDER BY create_time LIMIT 0, " + this.pageCount;
                this.connection && this.connection.query(searchSql, [], function (err, result) {
                    if (err) {
                        config_1.logger.error('MySqlCacheManager getAllUnTranslateList [SELECT ERROR] - ', err.message);
                        rs(false);
                        return;
                    }
                    ISDEBUG && console.log('MySqlCacheManager  getAllUnTranslateList result  ', result);
                    rs(result);
                });
                return [2 /*return*/];
            });
        }); });
        return selectListPromise;
    };
    MySqlCacheManager.prototype.getNeedHandleFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, models, rsArr, promiseArr, _i, rsArr_1, ele, handleArr, groupPromise, _a, groupPromise_1, ele, rs, id, fileName, model;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = new Date().getTime() / 1000;
                        models = [];
                        return [4 /*yield*/, this.getAllUnTranslateList()];
                    case 1:
                        rsArr = _b.sent();
                        console.log('\r\n');
                        console.log('---getNeedHandleFiles rsArr:', rsArr);
                        promiseArr = [];
                        Promise.all([]);
                        if (rsArr && rsArr.length > 0) {
                            for (_i = 0, rsArr_1 = rsArr; _i < rsArr_1.length; _i++) {
                                ele = rsArr_1[_i];
                                handleArr = this.handleEleFromDb(ele);
                                promiseArr.push(handleArr);
                            }
                        }
                        return [4 /*yield*/, Promise.all(promiseArr)];
                    case 2:
                        groupPromise = _b.sent();
                        console.log('---groupPromise:', groupPromise);
                        for (_a = 0, groupPromise_1 = groupPromise; _a < groupPromise_1.length; _a++) {
                            ele = groupPromise_1[_a];
                            rs = ele[0];
                            if (rs != -1) {
                                id = rs[0];
                                fileName = rs[1];
                                if (fileName && fileName.length > 0) {
                                    model = new PhoneSessionModel_1.PhoneSessionModel();
                                    model.buildModel({ id: id, fileName: fileName });
                                    models.push(model);
                                }
                            }
                        }
                        console.log('---getNeedHandleFiles 从数据拿取数据,下载音频文件 cost time:', (new Date().getTime() / 1000 - startTime).toFixed(0), '秒');
                        console.log('\r\n');
                        return [2 /*return*/, models];
                }
            });
        });
    };
    MySqlCacheManager.prototype.handleEleFromDb = function (_a) {
        var id = _a.id, monitor_filename = _a.monitor_filename;
        return __awaiter(this, void 0, void 0, function () {
            var downLoadRs, addCountRs;
            return __generator(this, function (_b) {
                downLoadRs = this.downLoadFileByUrl(id, monitor_filename);
                addCountRs = this.addBaiDuRecogniseCount(id);
                return [2 /*return*/, Promise.all([downLoadRs, addCountRs])];
            });
        });
    };
    /**
     * @param url 返回filename
     * @param audioPath
     */
    MySqlCacheManager.prototype.downLoadFileByUrl = function (id, url, audioPath) {
        if (audioPath === void 0) { audioPath = this.audioSrcBasePath; }
        return __awaiter(this, void 0, void 0, function () {
            var fileName;
            return __generator(this, function (_a) {
                fileName = url.substring(url.lastIndexOf('/') + 1, url.length);
                audioPath = audioPath + path.sep + url.substring(url.lastIndexOf('/') + 1, url.length);
                console.log('fileName ', fileName, ' audioPath', audioPath);
                return [2 /*return*/, node_fetch_1.default(url)
                        .then(function (res) {
                        return new Promise(function (resolve, reject) {
                            console.log('downLoadFileByUrl res', res.status);
                            var responseHeader = res.headers;
                            var contentType = responseHeader.get('Content-Type');
                            console.log('downLoadFileByUrl contentType', contentType);
                            if (contentType.toLowerCase().indexOf('audio') > -1) {
                                var dest = fs.createWriteStream(audioPath);
                                res.body.pipe(dest);
                                res.body.on('error', function (err) {
                                    config_1.logger.error('downLoadFileByUrl body error ', err);
                                    fs.existsSync(audioPath) && fs.unlinkSync(audioPath);
                                    resolve(-1);
                                });
                                dest.on('finish', function () {
                                    resolve([id, fileName]);
                                });
                                dest.on('error', function (err) {
                                    config_1.logger.error('downLoadFileByUrl dest error ', err);
                                    fs.existsSync(audioPath) && fs.unlinkSync(audioPath);
                                    resolve(-1);
                                });
                            }
                            else {
                                config_1.logger.error('downLoadFileByUrl contentType error ', contentType);
                                resolve(-1);
                            }
                        });
                    }, function (rj) {
                        fs.existsSync(audioPath) && fs.unlinkSync(audioPath);
                        config_1.logger.error('downLoadFileByUrl catch path', audioPath, ' rj', rj);
                        return new Promise(function (resolve, reject) {
                            resolve(-1);
                        });
                    })];
            });
        });
    };
    return MySqlCacheManager;
}(DefaultCacheManager_1.DefaultCacheManager));
exports.MySqlCacheManager = MySqlCacheManager;
