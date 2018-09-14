import { AudioRecogniseModel } from './../AudioModel';
const mysql = require('mysql');
import { DefaultCacheManager } from './DefaultCacheManager';
import { clearTimeout } from 'timers';
export class MySqlCacheManager extends DefaultCacheManager {
    private connection;

    public init(cacheAudioBasePath) {
        super.init(cacheAudioBasePath);
        //CREATE SCHEMA `speech_recognise_result` DEFAULT CHARACTER SET utf8 ;
        this.connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'speech_recognise_result'
        });
    }

    public saveTranslateResult(model: AudioRecogniseModel) {
        super.saveTranslateResult(model);
        let searchSql = 'SELECT audioId FROM audiorecognisemodel WHERE audioId=?';
        this.connection.query(searchSql, [model.audioId], (err, result) => {
            if (err) {
                console.log('MySqlCacheManager [SELECT ERROR] - ', err.message);
                return;
            }
            let sql = 'INSERT INTO audiorecognisemodel(audioId,recordDate,translateDate,content,employeeNo,clientPhone) VALUES(?,?,?,?,?,?)';
            let params = [model.audioId, model.recordDate, model.translateDate, model.content, model.employeeNo, model.clientPhone];
            if (result && result[0] && result[0].audioId && result[0].audioId == model.audioId) {
                sql = 'UPDATE audiorecognisemodel SET recordDate=?,translateDate=?,content=?,employeeNo=?,clientPhone=? WHERE audioId = ?';
                params = [model.recordDate, model.translateDate, model.content, model.employeeNo, model.clientPhone, model.audioId];
            }
            this.connection.query(sql, params, (err, result) => {
                if (err) {
                    console.log('MySqlCacheManager [INSERT ERROR] - ', err.message);
                    return;
                }
            });
        });
    }
}