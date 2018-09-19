"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 设置APPID/AK/SK
var isDebug = false;
var baiduConfig = {
    APP_ID: "11774993",
    API_KEY: "yO42vCGZieM64LOWRgaZiXN4",
    SECRET_KEY: "iRrRteLDjlb9AENVQZNWIgWtU5YVy0TO",
    qps: 8
};
exports.baiduConfig = baiduConfig;
var log4js = require('log4js');
var logger = log4js.getLogger('cheese');
exports.logger = logger;
var dbConfig = isDebug ? {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'call_center_data'
} : {
    host: '10.168.109.3',
    user: 'dev',
    password: 'fQUcnNi919lIn@iC22ORb9',
    database: 'kf',
    port: 3308
};
exports.dbConfig = dbConfig;
var resolveAudioRetryCount = 1; //每次音频解析重试次数
exports.resolveAudioRetryCount = resolveAudioRetryCount;
var pageCountByDb = 20; //数据库每次查询页数
exports.pageCountByDb = pageCountByDb;
var requestTimeout = 30 * 60 * 1000; //每个请求超时时间
exports.requestTimeout = requestTimeout;
var scanFileTimeByEveryDay = 10; //每天早上10点开始轮训转换为语音
exports.scanFileTimeByEveryDay = scanFileTimeByEveryDay;
