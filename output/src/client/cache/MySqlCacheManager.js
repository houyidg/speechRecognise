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
var mysql = require('mysql');
var node_fetch_1 = require("node-fetch");
var fs = require("fs");
var MySqlCacheManager = /** @class */ (function (_super) {
    __extends(MySqlCacheManager, _super);
    function MySqlCacheManager() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.pageCount = 20;
        _this.pageNo = 0;
        return _this;
    }
    MySqlCacheManager.prototype.init = function (_a) {
        var audioSrcBasePath = _a.audioSrcBasePath, cacheResBasePath = _a.cacheResBasePath, handleTaskPath = _a.handleTaskPath, divisionPath = _a.divisionPath, transformPath = _a.transformPath, translateTextPath = _a.translateTextPath;
        _super.prototype.init.call(this, { audioSrcBasePath: audioSrcBasePath, cacheResBasePath: cacheResBasePath, handleTaskPath: handleTaskPath, divisionPath: divisionPath, transformPath: transformPath, translateTextPath: translateTextPath });
        this.connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'call_center_data'
        });
    };
    MySqlCacheManager.prototype.saveTranslateText = function (sessionModel, fileNameExcludeSuffix, translateTextArr) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                _super.prototype.saveTranslateText.call(this, sessionModel, fileNameExcludeSuffix, translateTextArr);
                return [2 /*return*/, new Promise(function (rs, rj) {
                        sessionModel.call_content_baidu = translateTextArr.join();
                        var sql = 'UPDATE call_history SET call_content_baidu=? WHERE id = ?';
                        var params = [sessionModel.call_content_baidu, sessionModel.id];
                        _this.connection.query(sql, params, function (err, result) {
                            err && console.log('MySqlCacheManager [UPDATE ERROR] - ', err.message);
                            rs(1);
                        });
                    })];
            });
        });
    };
    MySqlCacheManager.prototype.getAllUnTranslateList = function () {
        var _this = this;
        return new Promise(function (rs, rj) {
            var searchSql = "SELECT id,monitor_filename FROM call_history WHERE LENGTH(call_content_baidu)<1 ORDER BY create_time limit 0," + _this.pageCount;
            _this.connection.query(searchSql, [], function (err, result) {
                if (err) {
                    console.log('MySqlCacheManager [SELECT ERROR] - ', err.message);
                    return;
                }
                console.log('MySqlCacheManager  getAllUnTranslateList result  ', result);
                rs(result);
            });
        });
    };
    MySqlCacheManager.prototype.getNeedHandleFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var models, rsArr, _i, rsArr_1, ele, id, monitor_filename, fileName, model;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        models = [];
                        return [4 /*yield*/, this.getAllUnTranslateList()];
                    case 1:
                        rsArr = _a.sent();
                        if (!(rsArr && rsArr.length > 0)) return [3 /*break*/, 5];
                        _i = 0, rsArr_1 = rsArr;
                        _a.label = 2;
                    case 2:
                        if (!(_i < rsArr_1.length)) return [3 /*break*/, 5];
                        ele = rsArr_1[_i];
                        id = ele.id, monitor_filename = ele.monitor_filename;
                        return [4 /*yield*/, this.downLoadFileByUrl(monitor_filename)];
                    case 3:
                        fileName = _a.sent();
                        console.log('getNeedHandleFiles rs', fileName);
                        if (fileName && fileName.length > 0) {
                            model = new PhoneSessionModel_1.PhoneSessionModel();
                            model.buildModel({ id: id, fileName: fileName });
                            models.push(model);
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, models];
                }
            });
        });
    };
    MySqlCacheManager.prototype.downLoadFileByUrl = function (url, path) {
        if (path === void 0) { path = this.audioSrcBasePath; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, node_fetch_1.default(url)
                        .then(function (res) {
                        return new Promise(function (resolve, reject) {
                            var fileName = url.substring(url.lastIndexOf('/') + 1, url.length);
                            path = path + "\\" + url.substring(url.lastIndexOf('/') + 1, url.length);
                            var dest = fs.createWriteStream(path);
                            res.body.pipe(dest);
                            res.body.on('error', function (err) {
                                reject(err);
                            });
                            dest.on('finish', function () {
                                resolve(fileName);
                            });
                            dest.on('error', function (err) {
                                reject(err);
                            });
                        });
                    })];
            });
        });
    };
    return MySqlCacheManager;
}(DefaultCacheManager_1.DefaultCacheManager));
exports.MySqlCacheManager = MySqlCacheManager;
