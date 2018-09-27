// 设置APPID/AK/SK
let isDebug = false;
var log4js = require('log4js');
const path = require('path');

log4js.configure({
    appenders: {
        fileOupt: {
            type: 'dateFile', filename: `logs${path.sep}`, pattern: "yyyy-MM-dd-error.log", alwaysIncludePattern: true, absolute: true, maxLogSize: 104800,
            backups: 10
        }, console: {
            type: 'console'
        }
    },
    categories: { default: { appenders: isDebug ? ['console'] : ['fileOupt'], level: 'info' } }
});

const baiduConfig = {
    APP_ID: "11774993",
    API_KEY: "yO42vCGZieM64LOWRgaZiXN4",
    SECRET_KEY: "iRrRteLDjlb9AENVQZNWIgWtU5YVy0TO",
    qps: 8
}
const Elogger = log4js.getLogger(isDebug ? 'console' : 'fileOupt');
const Clogger = Elogger;
const dbConfig = isDebug ? {
    connectionLimit: 20,
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'call_center_data'
} : {
        connectionLimit: 20,
        host: '10.168.109.3',
        user: 'dev',
        password: 'fQUcnNi919lIn@iC22ORb9',
        database: 'kf',
        port: 3308
    }
const resolveAudioRetryCount = 1;//每次音频解析重试次数
const pageCountByDb = 20;//数据库每次查询页数
const requestTimeout = 30 * 60 * 1000;//每个请求超时时间
const scanFileTimeByEveryDay = 10;//每天早上10点开始轮训转换为语音
const scanFileTimeInterval = 24 * 60 * 60;//24小时间隔执行一次任务
export { baiduConfig, Elogger, dbConfig, resolveAudioRetryCount, pageCountByDb, requestTimeout, scanFileTimeByEveryDay, Clogger, scanFileTimeInterval };