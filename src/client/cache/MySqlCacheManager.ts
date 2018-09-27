import { PhoneSessionModel } from '../PhoneSessionModel';
import { DefaultCacheManager } from './DefaultCacheManager';
import fetch from 'node-fetch';
import * as fs from "fs";
import { dbConfig, pageCountByDb, Elogger, Clogger } from '../../config';
const mysql = require('mysql');
const path = require('path');
const maxRecogniseCount = 2;
const ISDEBUG = false;
export class MySqlCacheManager extends DefaultCacheManager {
    private pool;
    private pageCount = pageCountByDb;
    public init({ audioSrcBasePath, cacheResBasePath, handleTaskPath, divisionPath, transformPath, translateTextPath }) {
        super.init({ audioSrcBasePath, cacheResBasePath, handleTaskPath, divisionPath, transformPath, translateTextPath });
        try {
            this.pool = mysql.createPool(dbConfig);
        } catch (e) {
            Elogger.error(e);
        }
    }
    /**
     * Connection.prototype._handleProtocolError = function(err) {
      this.state = 'protocol_error';
      this.emit('error', err);
    };
    
    Connection.prototype._handleProtocolDrain = function() {
      this.emit('drain');
    };
    
    Connection.prototype._handleProtocolConnect = function() {
      this.state = 'connected';
      this.emit('connect');
    };
    
    Connection.prototype._handleProtocolHandshake = function _handleProtocolHandshake(packet) {
      this.state    = 'authenticated';
      this.threadId = packet.threadId;
    };
    
    Connection.prototype._handleProtocolEnd = function(err) {
      this.state = 'disconnected';
      this.emit('end', err);
    };
     */

    // private makeSoureConnection(): boolean {
    //     let rs = false;
    //     try {
    //         this.pool = mysql.createConnection(dbConfig);
    //     } catch (e) {
    //         Elogger.error(e);
    //     }
    //     return rs;
    // }

    public async saveTranslateText(sessionModel: PhoneSessionModel, fileNameExcludeSuffix, translateTextArr: string[]) {
        super.saveTranslateText(sessionModel, fileNameExcludeSuffix, translateTextArr);
        return new Promise((rs, rj) => {
            sessionModel.call_content_baidu = translateTextArr.join();
            let sql = 'UPDATE call_history SET call_content_baidu=? WHERE id = ?';
            let params = [sessionModel.call_content_baidu, sessionModel.id];
            this.pool && this.pool.query(sql, params, (err, result) => {
                err && Elogger.error('MySqlCacheManager saveTranslateText [UPDATE ERROR] - ', err.message);
                rs(1);
            });
        }).catch((e) => {
            Elogger.error('MySqlCacheManager saveTranslateText catch - ', e);
        });
    }

    private async  addBaiDuRecogniseCount(id) {
        let selectListPromise = await new Promise<any>((rs, rj) => {
            let searchSql = `SELECT baidu_recognise_count FROM call_history WHERE id=?`;
            this.pool && this.pool.query(searchSql, [id], (err, result) => {
                if (err) {
                    Elogger.error('MySqlCacheManager  addBaiDuRecogniseCount[SELECT ERROR] - ', err.message);
                    rs(false);
                    return;
                }
                ISDEBUG && Clogger.info('MySqlCacheManager  addBaiDuRecogniseCount SELECT result  ', result);
                rs(result);
            });
        });
        let baidu_recognise_count = selectListPromise[0].baidu_recognise_count;
        let updatePromise = await new Promise((rs, rj) => {
            let searchSql = `UPDATE  call_history SET baidu_recognise_count = ? WHERE id=?`;
            this.pool && this.pool.query(searchSql, [baidu_recognise_count + 1, id], (err, result) => {
                if (err) {
                    Elogger.error('MySqlCacheManager addBaiDuRecogniseCount [UPDATE ERROR] - ', err.message);
                    rs(false);
                    return;
                }
                ISDEBUG && Clogger.info('MySqlCacheManager  addBaiDuRecogniseCount UPDATE result  ', result);
                rs("1");
            });
        }).catch((e) => {
            Elogger.error('MySqlCacheManager addBaiDuRecogniseCount catch - ', e);
        });

        return updatePromise;
    }

    public getAllUnTranslateList(): Promise<any> {
        let selectListPromise = new Promise<any>(async (rs, rj) => {
            let searchSql = `SELECT id,monitor_filename FROM call_history WHERE call_content_baidu IS NULL AND baidu_recognise_count < ${maxRecogniseCount}  ORDER BY create_time LIMIT 0, ${this.pageCount}`;
            this.pool && this.pool.query(searchSql, [], (err, result) => {
                if (err) {
                    Elogger.error('MySqlCacheManager getAllUnTranslateList [SELECT ERROR] - ', err.message);
                    rs(false);
                    return;
                }
                ISDEBUG && Clogger.info('MySqlCacheManager  getAllUnTranslateList result  ', result);
                rs(result);
            });
        }).catch((e) => {
            Elogger.error('MySqlCacheManager getAllUnTranslateList catch - ', e);
        });
        return selectListPromise;
    }

    public async getNeedHandleFiles() {
        let startTime = new Date().getTime() / 1000;
        let models: PhoneSessionModel[] = [];
        let rsArr = await this.getAllUnTranslateList();
        Clogger.info('\r\n');
        Clogger.info('---getNeedHandleFiles rsArr:', rsArr && rsArr.length);
        let promiseArr = [];
        Promise.all([]);
        if (rsArr && rsArr.length > 0) {
            for (let ele of rsArr) {
                let handleArr = this.handleEleFromDb(ele);
                promiseArr.push(handleArr);
            }
        }
        let groupPromise = await Promise.all(promiseArr);
        Clogger.info('---groupPromise:', groupPromise);
        for (let ele of groupPromise) {
            let fileDownLoadRs = ele[0];
            if (fileDownLoadRs) {//
                let id = fileDownLoadRs[0];
                let fileName = fileDownLoadRs[1];
                if (fileName && fileName.length > 0 && id) {
                    let model = new PhoneSessionModel();
                    model.buildModel({ id, fileName });
                    models.push(model);
                }
            }
        }
        Clogger.info('---getNeedHandleFiles 从数据拿取数据,下载音频文件 cost time:', (new Date().getTime() / 1000 - startTime).toFixed(0), '秒');
        Clogger.info('\r\n');
        return models;
        // return super.getNeedHandleFiles();
    }

    private async handleEleFromDb({ id, monitor_filename }) {
        let downLoadRs = this.downLoadFileByUrl(id, monitor_filename);
        let addCountRs = this.addBaiDuRecogniseCount(id);
        return Promise.all([downLoadRs, addCountRs]);
    }

    /**
     * @param url 返回filename
     * @param audioPath 
     */
    private async downLoadFileByUrl(id, url: string, audioBasePath = this.audioSrcBasePath): Promise<any> {
        try {
            Clogger.info('downLoadFileByUrl audioBasePath:', audioBasePath, '  url:', url);
            return fetch(url).then(
                (res) => {
                    return new Promise((resolve, reject) => {
                        Clogger.info('downLoadFileByUrl res', res.status);
                        let responseHeader = res.headers;
                        let contentType: string = responseHeader.get('Content-Type');
                        Clogger.info('downLoadFileByUrl contentType', contentType);
                        if (contentType.toLowerCase().indexOf('audio') > -1) {
                            let fileName = url.substring(url.lastIndexOf('/') + 1, url.length);
                            let audioPath = audioBasePath + path.sep + url.substring(url.lastIndexOf('/') + 1, url.length);
                            Clogger.info('downLoadFileByUrl fileName:', fileName, '   audioPath:', audioPath, '  url:', url);
                            let dest = fs.createWriteStream(audioPath);
                            res.body.pipe(dest);
                            res.body.on('error', err => {
                                Elogger.error('downLoadFileByUrl body error ', err);
                                this.makeSureNoExist(audioPath);
                                resolve(-1);
                            });
                            dest.on('finish', () => {
                                resolve([id, fileName]);
                            });
                            dest.on('error', err => {
                                Elogger.error('downLoadFileByUrl dest error ', err);
                                this.makeSureNoExist(audioPath);
                                resolve(-1);
                            });
                        } else {
                            Elogger.error('downLoadFileByUrl contentType error ', contentType);
                            resolve(-1);
                        }
                    });
                }).catch((e) => {
                    Elogger.error('downLoadFileByUrl catch e0', e);
                });
        } catch (e) {
            Elogger.error('downLoadFileByUrl catch e', e);
        }
    }

    makeSureNoExist(audioPath) {
        try {
            fs.existsSync(audioPath) && fs.unlinkSync(audioPath);
        } catch (e) {
            Clogger.info('makeSureNoExist catch e', e);
        }
    }
}