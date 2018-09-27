import { PhoneSessionModel } from './../PhoneSessionModel';
import { FileUtils } from './../../util/FileUtils';
import { ICacheManager } from './ICacheManager';
import * as fs from "fs";
import * as os from "os";
import { TimeUtils } from '../../util/TimeUtils';
import { resolveAudioRetryCount, Clogger } from '../../config';
const path = require('path');
const isDebug = false;
export class DefaultCacheManager implements ICacheManager {
    private lastHandleFileNames: Set<string>;//上一次处理的文件路径
    private failHandleFileNameMap: Map<PhoneSessionModel, number>;//上一次处理的文件路径filename,retryCount
    private defaultRetryCount = resolveAudioRetryCount;
    scanCount = 0;
    supportDocumentFomrat = ['mp3', 'pcm', 'wav'];

    //path
    protected audioSrcBasePath: string;
    private cacheResBasePath: string;
    private handleTaskListPath;//已经处理过的文件名单
    private divisionPath: string;
    private transformPath: string;
    private translateTextPath: string;
    public init({ audioSrcBasePath, cacheResBasePath, handleTaskPath, divisionPath, transformPath, translateTextPath }) {
        this.lastHandleFileNames = new Set();
        this.failHandleFileNameMap = new Map();

        this.cacheResBasePath = cacheResBasePath;
        this.audioSrcBasePath = audioSrcBasePath;
        this.handleTaskListPath = handleTaskPath;
        this.divisionPath = divisionPath;
        this.transformPath = transformPath;
        this.translateTextPath = translateTextPath;
        !fs.existsSync(cacheResBasePath) && fs.mkdirSync(cacheResBasePath);
        !fs.existsSync(audioSrcBasePath) && fs.mkdirSync(audioSrcBasePath);
        !fs.existsSync(handleTaskPath) && fs.mkdirSync(handleTaskPath);
        !fs.existsSync(divisionPath) && fs.mkdirSync(divisionPath);
        !fs.existsSync(transformPath) && fs.mkdirSync(transformPath);
        !fs.existsSync(translateTextPath) && fs.mkdirSync(translateTextPath);

        isDebug && Clogger.info('DefaultCacheManager audioSrcBasePath ', audioSrcBasePath);
        isDebug && Clogger.info('DefaultCacheManager cacheResBasePath ', cacheResBasePath);
        isDebug && Clogger.info('DefaultCacheManager handleTaskPath ', handleTaskPath);
        isDebug && Clogger.info('DefaultCacheManager divisionPath', divisionPath);
        isDebug && Clogger.info('DefaultCacheManager transformPath', transformPath);
        isDebug && Clogger.info('DefaultCacheManager translateTextPath', translateTextPath);
    }

    public getNeedHandleFiles(): any {
        this.scanCount++;
        let scanFiles = fs.readdirSync(this.getAudioSrcBasePath());
        Clogger.info('DefaultCacheManager 开始扫描指定目录下的文件,自动过滤非音频文件、已经解析的文件 扫描次数:', this.scanCount);
        let meetFiles: string[] = scanFiles.filter((fileName) => {
            if (this.lastHandleFileNames.has(fileName)) {
                return false;
            }
            let absolutePath = `${this.getAudioSrcBasePath()}${path.sep}${fileName}`;
            let stat = fs.lstatSync(absolutePath)
            if (!stat.isFile()) {
                isDebug && Clogger.info('filter ', fileName, '  !stat.isFile():', !stat.isFile());
                return false;
            }
            let isHandle = this.isSaveTaskPath(fileName);
            if (isHandle) {
                isDebug && Clogger.info('filter ', fileName, '  isHandle:', isHandle);
                return false;
            }
            let suffix = fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length);
            if (this.supportDocumentFomrat.indexOf(suffix) < 0) {
                isDebug && Clogger.info('filter ', fileName, '  只支持mp3和1分钟时长的pcm和wav格式音频');
                return false;
            }
            return true;
        });
        let newMeetModels = meetFiles.map<PhoneSessionModel>((fileName, index, files) => {
            let model: PhoneSessionModel = new PhoneSessionModel();
            model.buildModel({ fileName });
            return model;
        });
        return newMeetModels;
    }

    public getTodayCacheTaskPath(): string {
        return this.handleTaskListPath + path.sep + TimeUtils.getNowFormatDate() + '.txt';
    }

    public getAudioSrcBasePath() {
        return this.audioSrcBasePath;
    }
    public getDivisionPath() {
        return this.divisionPath;
    }
    public getTransformPath() {
        return this.transformPath;
    }
    public getTranslateTextPath() {
        return this.translateTextPath;
    }

    public isSaveTaskPath(path: string): boolean {
        //内存中
        this.lastHandleFileNames.add(path);//20161017141228
        //文件中
        let audioPath = this.getTodayCacheTaskPath();
        let isExist = fs.existsSync(audioPath);
        if (!isExist) {
            let audioPathContent = path + os.EOL;
            fs.writeFileSync(audioPath, audioPathContent);
            return false;
        }
        let content = fs.readFileSync(audioPath).toString();
        if (content.indexOf(path) < 0) {
            let audioPathContent = path + os.EOL;
            fs.appendFile(audioPath, audioPathContent, (err) => {
                if (err)
                    Clogger.info('CacheManager saveTaskPath err', err);
            });
            return false;
        }
        return true;
    }

    public saveFailTaskPath(path: PhoneSessionModel) {
        let isExist = this.failHandleFileNameMap.has(path);
        let retryCount = 1;
        if (isExist) {
            retryCount = this.failHandleFileNameMap.get(path);
            retryCount++;
        }
        this.failHandleFileNameMap.set(path, retryCount);
    }

    public getRetryModelsByToday(): PhoneSessionModel[] {
        let retryTasks: PhoneSessionModel[] = [];
        this.failHandleFileNameMap.forEach((value, key, map) => {
            if (value <= this.defaultRetryCount) {
                retryTasks.push(key);
            }
        });
        return retryTasks;
    }

    public removeFailTaskPath(path: PhoneSessionModel) {
        let isExist = this.failHandleFileNameMap.has(path);
        if (isExist) {
            this.failHandleFileNameMap.delete(path);
        }
    }

    public removeLastTaskPathOnlyFile(fileName: string) {
        let audioPath = this.getTodayCacheTaskPath();
        let content = fs.readFileSync(audioPath).toString();
        if (content.indexOf(fileName) > -1) {
            content.replace(fileName, '');
            let audioPathContent = fileName + os.EOL;
            fs.writeFileSync(audioPath, audioPathContent);
            return true;
        }
        return false;
    }

    public removeLastTaskPathOnlyCache(path: string) {
        this.lastHandleFileNames.delete(path);
    }

    public removeAllTaskCacheByOneLoop() {
        FileUtils.rmdirOnlyFile(this.transformPath);
        FileUtils.rmdirOnlyFile(this.divisionPath);
    }

    public removeAllTaskCacheByAtTime() {
        this.lastHandleFileNames.clear();
        this.failHandleFileNameMap.clear();
        FileUtils.rmdirOnlyFile(this.audioSrcBasePath);
        FileUtils.rmdirOnlyFile(this.handleTaskListPath);
    }

    public saveTranslateText(sessionModel: PhoneSessionModel, fileNameExcludeSuffix, translateTextArr: string[]) {
        let translateTextPath = this.getTranslateTextPath() + path.sep + TimeUtils.getNowFormatDate();
        !fs.existsSync(translateTextPath) && fs.mkdirSync(translateTextPath);
        translateTextPath += path.sep + fileNameExcludeSuffix + '.txt';
        fs.writeFileSync(translateTextPath, translateTextArr.join(os.EOL));
    }
}
