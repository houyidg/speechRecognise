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
            database: 'speech_recognise_result'
        });
    };
    MySqlCacheManager.prototype.saveTranslateResultToDb = function (model) {
        var _this = this;
        _super.prototype.saveTranslateResultToDb.call(this, model);
        var searchSql = 'SELECT audioId FROM audiorecognisemodel WHERE audioId=?';
        this.connection.query(searchSql, [model.audioId], function (err, result) {
            if (err) {
                console.log('MySqlCacheManager [SELECT ERROR] - ', err.message);
                return;
            }
            var sql = 'INSERT INTO audiorecognisemodel(audioId,recordDate,translateDate,content,employeeNo,clientPhone) VALUES(?,?,?,?,?,?)';
            var params = [model.audioId, model.recordDate, model.translateDate, model.content, model.employeeNo, model.clientPhone];
            if (result && result[0] && result[0].audioId && result[0].audioId == model.audioId) {
                sql = 'UPDATE audiorecognisemodel SET recordDate=?,translateDate=?,content=?,employeeNo=?,clientPhone=? WHERE audioId = ?';
                params = [model.recordDate, model.translateDate, model.content, model.employeeNo, model.clientPhone, model.audioId];
            }
            _this.connection.query(sql, params, function (err, result) {
                if (err) {
                    console.log('MySqlCacheManager [INSERT ERROR] - ', err.message);
                    return;
                }
            });
        });
    };
    return MySqlCacheManager;
}(DefaultCacheManager_1.DefaultCacheManager));
exports.MySqlCacheManager = MySqlCacheManager;
