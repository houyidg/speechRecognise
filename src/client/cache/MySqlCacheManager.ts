import { PhoneSessionModel } from '../PhoneSessionModel';
import { DefaultCacheManager } from './DefaultCacheManager';
const mysql = require('mysql');
import fetch from 'node-fetch';
import * as fs from "fs";
export class MySqlCacheManager extends DefaultCacheManager {
    private connection;
    private pageCount = 20;
    private pageNo = 0;
    public init({ audioSrcBasePath, cacheResBasePath, handleTaskPath, divisionPath, transformPath, translateTextPath }) {
        super.init({ audioSrcBasePath, cacheResBasePath, handleTaskPath, divisionPath, transformPath, translateTextPath });
        this.connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'call_center_data'
        });
    }

    public async saveTranslateText(sessionModel: PhoneSessionModel, fileNameExcludeSuffix, translateTextArr: string[]) {
        super.saveTranslateText(sessionModel, fileNameExcludeSuffix, translateTextArr);
        return new Promise((rs, rj) => {
            sessionModel.call_content_baidu = translateTextArr.join();
            let sql = 'UPDATE call_history SET call_content_baidu=? WHERE id = ?';
            let params = [sessionModel.call_content_baidu, sessionModel.id];
            this.connection.query(sql, params, (err, result) => {
                err && console.log('MySqlCacheManager [UPDATE ERROR] - ', err.message);
                rs(1);
            });
        });
    }

    public getAllUnTranslateList(): Promise<[{ id, monitor_filename }]> {
        return new Promise((rs, rj) => {
            let searchSql = "SELECT id,monitor_filename FROM call_history WHERE LENGTH(call_content_baidu)<1 ORDER BY create_time limit 0," + this.pageCount;
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

    public async getNeedHandleFiles() {
        let models: PhoneSessionModel[] = [];
        let rsArr = await this.getAllUnTranslateList();
        if (rsArr && rsArr.length > 0) {
            for (let ele of rsArr) {
                let { id, monitor_filename } = ele;
                let fileName = await this.downLoadFileByUrl(monitor_filename);
                console.log('getNeedHandleFiles rs', fileName);
                if (fileName && fileName.length > 0) {
                    let model = new PhoneSessionModel();
                    model.buildModel({ id, fileName });
                    models.push(model);
                }
            }
        }
        return models;
    }

    private async downLoadFileByUrl(url: string, path = this.audioSrcBasePath): Promise<string> {
        return fetch(url)
            .then(res => {
                return new Promise((resolve, reject) => {
                    let fileName = url.substring(url.lastIndexOf('/') + 1, url.length);
                    path = path + "\\" + url.substring(url.lastIndexOf('/') + 1, url.length);
                    const dest = fs.createWriteStream(path);
                    res.body.pipe(dest);
                    res.body.on('error', err => {
                        reject(err);
                    });
                    dest.on('finish', () => {
                        resolve(fileName);
                    });
                    dest.on('error', err => {
                        reject(err);
                    });
                });
            });
    }
}