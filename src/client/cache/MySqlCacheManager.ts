import { PhoneSessionModel } from '../PhoneSessionModel';
import { DefaultCacheManager } from './DefaultCacheManager';
import fetch from 'node-fetch';
import * as fs from "fs";
import { dbConfig, pageCountByDb } from '../../config';
const mysql = require('mysql');
const path = require('path');
const maxRecogniseCount = 2;
const ISDEBUG = false;
export class MySqlCacheManager extends DefaultCacheManager {
    private connection;
    private pageCount = pageCountByDb;
    public init({ audioSrcBasePath, cacheResBasePath, handleTaskPath, divisionPath, transformPath, translateTextPath }) {
        super.init({ audioSrcBasePath, cacheResBasePath, handleTaskPath, divisionPath, transformPath, translateTextPath });
        this.connection = mysql.createConnection(dbConfig);
    }

    public async saveTranslateText(sessionModel: PhoneSessionModel, fileNameExcludeSuffix, translateTextArr: string[]) {
        // super.saveTranslateText(sessionModel, fileNameExcludeSuffix, translateTextArr);
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


    private async  addBaiDuRecogniseCount(id) {
        let selectListPromise = await new Promise<[{ baidu_recognise_count }]>((rs, rj) => {
            let searchSql = `SELECT baidu_recognise_count FROM call_history WHERE id=?`;
            this.connection.query(searchSql, [id], (err, result) => {
                if (err) {
                    console.log('MySqlCacheManager [SELECT ERROR] - ', err.message);
                    return;
                }
                ISDEBUG && console.log('MySqlCacheManager  addBaiDuRecogniseCount SELECT result  ', result);
                rs(result);
            });
        });
        let baidu_recognise_count = selectListPromise[0].baidu_recognise_count;
        let updatePromise = await new Promise((rs, rj) => {
            let searchSql = `UPDATE  call_history SET baidu_recognise_count = ? WHERE id=?`;
            this.connection.query(searchSql, [baidu_recognise_count + 1, id], (err, result) => {
                if (err) {
                    console.log('MySqlCacheManager [UPDATE ERROR] - ', err.message);
                    return;
                }
                ISDEBUG && console.log('MySqlCacheManager  addBaiDuRecogniseCount UPDATE result  ', result);
                rs("1");
            });
        });

        return updatePromise;
    }

    public getAllUnTranslateList(): Promise<[{ id, monitor_filename }]> {
        let selectListPromise = new Promise<[{ id, monitor_filename }]>(async (rs, rj) => {
            let searchSql = `SELECT id,monitor_filename FROM call_history WHERE call_content_baidu IS NULL AND baidu_recognise_count < ${maxRecogniseCount}  ORDER BY create_time LIMIT 0, ${this.pageCount}`;
            this.connection.query(searchSql, [], (err, result) => {
                if (err) {
                    console.log('MySqlCacheManager [SELECT ERROR] - ', err.message);
                    return;
                }
                ISDEBUG && console.log('MySqlCacheManager  getAllUnTranslateList result  ', result);
                rs(result);
            });
        });
        return selectListPromise;
    }

    public async getNeedHandleFiles() {
        let startTime = new Date().getTime() / 1000;
        let models: PhoneSessionModel[] = [];
        let rsArr = await this.getAllUnTranslateList();
        console.log('\r\n');
        console.log('---getNeedHandleFiles rsArr:', rsArr);
        let promiseArr = [];
        Promise.all([]);
        if (rsArr && rsArr.length > 0) {
            for (let ele of rsArr) {
                let handleArr = this.handleEleFromDb(ele);
                promiseArr.push(handleArr);
            }
        }
        let groupPromise = await Promise.all(promiseArr);
        console.log('---groupPromise:', groupPromise);
        for (let ele of groupPromise) {
            let rs = ele[0];
            if (rs != -1) {
                let id = rs[0];
                let fileName = rs[1];
                if (fileName && fileName.length > 0) {
                    let model = new PhoneSessionModel();
                    model.buildModel({ id, fileName });
                    models.push(model);
                }
            }
        }
        console.log('---getNeedHandleFiles 从数据拿取数据,下载音频文件 cost time:', (new Date().getTime() / 1000 - startTime).toFixed(0), '秒');
        console.log('\r\n');
        return models;
        // return super.getNeedHandleFiles();
    }

    private async handleEleFromDb({ id, monitor_filename }) {
        let addCountRs = this.addBaiDuRecogniseCount(id);
        let downLoadRs = this.downLoadFileByUrl(id, monitor_filename);
        return Promise.all([downLoadRs, addCountRs]);
    }

    /**
     * @param url 返回filename
     * @param audioPath 
     */
    private async downLoadFileByUrl(id, url: string, audioPath = this.audioSrcBasePath): Promise<string> {
        let fileName = url.substring(url.lastIndexOf('/') + 1, url.length);
        audioPath = audioPath + path.sep + url.substring(url.lastIndexOf('/') + 1, url.length);
        console.log('fileName ', fileName, ' audioPath', audioPath);
        return fetch(url)
            .then(
                (res) => {
                    return new Promise((resolve, reject) => {
                        console.log('downLoadFileByUrl res', res.status);
                        let responseHeader = res.headers;
                        let contentType: string = responseHeader.get('Content-Type');
                        console.log('downLoadFileByUrl contentType', contentType);
                        if (contentType.toLowerCase().indexOf('audio') > -1) {
                            const dest = fs.createWriteStream(audioPath);
                            res.body.pipe(dest);
                            res.body.on('error', err => {
                                console.log('downLoadFileByUrl body error ', err);
                                fs.existsSync(audioPath) && fs.unlinkSync(audioPath);
                                resolve(-1);
                            });
                            dest.on('finish', () => {
                                resolve([id, fileName]);
                            });
                            dest.on('error', err => {
                                console.log('downLoadFileByUrl dest error ', err);
                                fs.existsSync(audioPath) && fs.unlinkSync(audioPath);
                                resolve(-1);
                            });
                        } else {
                            resolve(-1);
                        }
                    });
                },
                (rj) => {
                    fs.existsSync(audioPath) && fs.unlinkSync(audioPath);
                    console.log('downLoadFileByUrl catch path', audioPath, ' rj', rj);
                    return new Promise((resolve, reject) => {
                        resolve(-1);
                    });
                });
    }
}