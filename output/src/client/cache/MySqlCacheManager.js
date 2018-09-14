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
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.timeout = 10 * 1000;
        return _this;
    }
    MySqlCacheManager.prototype.init = function (cacheAudioBasePath) {
        _super.prototype.init.call(this, cacheAudioBasePath);
        //CREATE SCHEMA `speech_recognise_result` DEFAULT CHARACTER SET utf8 ;
        this.connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'speech_recognise_result'
        });
    };
    MySqlCacheManager.prototype.saveTranslateResult = function (model) {
        _super.prototype.saveTranslateResult.call(this, model);
        // this.makeSureConnected();
        var addSql = 'INSERT INTO audiorecognisemodel(audioId,recordDate,translateDate,content,employeeNo,clientPhone) VALUES(?,?,?,?,?,?)';
        var addSqlParams = [model.audioId, model.recordDate, model.translateDate, model.content, model.employeeNo, model.clientPhone];
        this.connection.query(addSql, addSqlParams, function (err, result) {
            if (err) {
                console.log('MySqlCacheManager [INSERT ERROR] - ', err.message);
                return;
            }
            console.log('MySqlCacheManager--------------------------INSERT----------------------------');
            console.log('MySqlCacheManager INSERT ID:', result);
            console.log('MySqlCacheManager-----------------------------------------------------------------\n\n');
        });
        // this.connection.end();
    };
    MySqlCacheManager.prototype.makeSureConnected = function () {
        this.connection.connect();
    };
    return MySqlCacheManager;
}(DefaultCacheManager_1.DefaultCacheManager));
exports.MySqlCacheManager = MySqlCacheManager;
