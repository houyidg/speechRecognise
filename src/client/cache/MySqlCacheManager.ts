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
        let addSql = 'INSERT INTO audiorecognisemodel(audioId,recordDate,translateDate,content,employeeNo,clientPhone) VALUES(?,?,?,?,?,?)';
        let addSqlParams = [model.audioId, model.recordDate, model.translateDate, model.content, model.employeeNo, model.clientPhone];
        this.connection.query(addSql, addSqlParams, (err, result) => {
            if (err) {
                console.log('MySqlCacheManager [INSERT ERROR] - ', err.message);
                return;
            }
            console.log('MySqlCacheManager--------------------------INSERT----------------------------');
            console.log('MySqlCacheManager INSERT ID:', result);
            console.log('MySqlCacheManager-----------------------------------------------------------------\n\n');
        });
    }
}