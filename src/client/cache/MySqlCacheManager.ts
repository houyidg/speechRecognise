import { PhoneSessionModel } from '../PhoneSessionModel';
const mysql = require('mysql');
import { DefaultCacheManager } from './DefaultCacheManager';
export class MySqlCacheManager extends DefaultCacheManager {
    private connection;
    public init({ audioSrcBasePath, cacheResBasePath, handleTaskPath, divisionPath, transformPath, translateTextPath }) {
        super.init({ audioSrcBasePath, cacheResBasePath, handleTaskPath, divisionPath, transformPath, translateTextPath });
        //CREATE SCHEMA `speech_recognise_result` DEFAULT CHARACTER SET utf8 ;
        this.connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'call_center_data'
        });
    }

    public saveTranslateResultToDb(model: PhoneSessionModel) {
        super.saveTranslateResultToDb(model);
        let sql = 'UPDATE call_history SET call_content_baidu=? WHERE id = ?';
        let params = [model.call_content_baidu, model.id];
        this.connection.query(sql, params, (err, result) => {
            if (err) {
                console.log('MySqlCacheManager [INSERT ERROR] - ', err.message);
                return;
            }
        });
    }

    public getAllUnTranslateList() {
        return new Promise((rs, rj) => {
            let searchSql = 'SELECT id FROM call_history ORDER BY create_time';
            this.connection.query(searchSql, [], (err, result) => {
                if (err) {
                    console.log('MySqlCacheManager [SELECT ERROR] - ', err.message);
                    return;
                }
                console.log('MySqlCacheManager  getAllUnTranslateList result  ', result);
                rs(result);
            });
        });
    }
}