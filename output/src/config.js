"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 设置APPID/AK/SK
var BAIDU_CONFIG = {
    APP_ID: "11774993",
    API_KEY: "yO42vCGZieM64LOWRgaZiXN4",
    SECRET_KEY: "iRrRteLDjlb9AENVQZNWIgWtU5YVy0TO"
};
exports.BAIDU_CONFIG = BAIDU_CONFIG;
var log4js = require('log4js');
var logger = log4js.getLogger('cheese');
exports.logger = logger;
var dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'call_center_data'
};
exports.dbConfig = dbConfig;
