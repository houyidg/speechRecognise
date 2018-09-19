// 设置APPID/AK/SK
let isDebug = false;
const baiduConfig = {
    APP_ID: "11774993",
    API_KEY: "yO42vCGZieM64LOWRgaZiXN4",
    SECRET_KEY: "iRrRteLDjlb9AENVQZNWIgWtU5YVy0TO",
    qps: 8
}
const log4js = require('log4js');
const logger = log4js.getLogger('cheese');
const dbConfig = isDebug ? {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'call_center_data'
} : {
        host: '10.168.109.3',
        user: 'dev',
        password: 'fQUcnNi919lIn@iC22ORb9',
        database: 'kf'
    }
const resolveAudioRetryCount = 1;//每次音频解析重试次数
const pageCountByDb = 20;//数据库每次查询页数
const requestTimeout = 30 * 60 * 1000;//每个请求超时时间
const scanFileTimeByEveryDay = 10;//每天早上10点开始轮训转换为语音
export { baiduConfig, logger, dbConfig, resolveAudioRetryCount, pageCountByDb, requestTimeout, scanFileTimeByEveryDay };