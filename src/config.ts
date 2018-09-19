// 设置APPID/AK/SK
const BAIDU_CONFIG = {
    APP_ID: "11774993",
    API_KEY: "yO42vCGZieM64LOWRgaZiXN4",
    SECRET_KEY: "iRrRteLDjlb9AENVQZNWIgWtU5YVy0TO"
}
const log4js = require('log4js');
const logger = log4js.getLogger('cheese');
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'call_center_data'
}
export { BAIDU_CONFIG, logger, dbConfig };