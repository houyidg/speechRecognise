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
Object.defineProperty(exports, "__esModule", { value: true });
var mysql = require('mysql');
var DefaultCacheManager_1 = require("./DefaultCacheManager");
var MySqlCacheManager = /** @class */ (function (_super) {
    __extends(MySqlCacheManager, _super);
    function MySqlCacheManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MySqlCacheManager.prototype.init = function (_a) {
        var audioSrcBasePath = _a.audioSrcBasePath, cacheResBasePath = _a.cacheResBasePath, handleTaskPath = _a.handleTaskPath, divisionPath = _a.divisionPath, transformPath = _a.transformPath, translateTextPath = _a.translateTextPath;
        _super.prototype.init.call(this, { audioSrcBasePath: audioSrcBasePath, cacheResBasePath: cacheResBasePath, handleTaskPath: handleTaskPath, divisionPath: divisionPath, transformPath: transformPath, translateTextPath: translateTextPath });
        //CREATE SCHEMA `speech_recognise_result` DEFAULT CHARACTER SET utf8 ;
        this.connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'call_center_data'
        });
    };
    MySqlCacheManager.prototype.saveTranslateResultToDb = function (model) {
        _super.prototype.saveTranslateResultToDb.call(this, model);
        var sql = 'UPDATE call_history SET call_content_baidu=? WHERE id = ?';
        var params = [model.call_content_baidu, model.id];
        this.connection.query(sql, params, function (err, result) {
            if (err) {
                console.log('MySqlCacheManager [INSERT ERROR] - ', err.message);
                return;
            }
        });
    };
    MySqlCacheManager.prototype.getAllUnTranslateList = function () {
        var _this = this;
        return new Promise(function (rs, rj) {
            var searchSql = 'SELECT id FROM call_history ORDER BY create_time';
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
    return MySqlCacheManager;
}(DefaultCacheManager_1.DefaultCacheManager));
exports.MySqlCacheManager = MySqlCacheManager;
