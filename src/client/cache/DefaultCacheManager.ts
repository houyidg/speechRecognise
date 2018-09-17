import { FileUtils } from './../../util/FileUtils';
import { AudioRecogniseModel } from './../AudioModel';

import { ICacheManager } from './ICacheManager';
import * as fs from "fs";
import * as os from "os";
import { TimeUtils } from '../../util/TimeUtils';
export class DefaultCacheManager implements ICacheManager {
    private lastHandleAudioPaths: Set<String>;//上一次处理的文件路径
    private failHandleAudioPathMap: Map<String, number>;//上一次处理的文件路径filename,retryCount
    private retryCount = 1;
    //path
    private audioSrcBasePath: string;
    private cacheResBasePath: string;
    private handleTaskPath;//
    private divisionPath: string;
    private transformPath: string;
    private translateTextPath: string;

    public init({ audioSrcBasePath, cacheResBasePath, handleTaskPath, divisionPath, transformPath, translateTextPath }) {
        this.lastHandleAudioPaths = new Set();
        this.failHandleAudioPathMap = new Map();

        this.audioSrcBasePath = audioSrcBasePath;
        this.cacheResBasePath = cacheResBasePath;
        this.handleTaskPath = handleTaskPath;
        this.divisionPath = divisionPath;
        this.transformPath = transformPath;
        this.translateTextPath = translateTextPath;
        !fs.existsSync(audioSrcBasePath) && fs.mkdirSync(audioSrcBasePath);
        !fs.existsSync(cacheResBasePath) && fs.mkdirSync(cacheResBasePath);
        !fs.existsSync(handleTaskPath) && fs.mkdirSync(handleTaskPath);
        !fs.existsSync(divisionPath) && fs.mkdirSync(divisionPath);
        !fs.existsSync(transformPath) && fs.mkdirSync(transformPath);
        !fs.existsSync(translateTextPath) && fs.mkdirSync(translateTextPath);

        console.log('DefaultCacheManager audioSrcBasePath ', audioSrcBasePath);
        console.log('DefaultCacheManager cacheResBasePath ', cacheResBasePath);
        console.log('DefaultCacheManager handleTaskPath ', handleTaskPath);
        console.log('DefaultCacheManager divisionPath', divisionPath);
        console.log('DefaultCacheManager transformPath', transformPath);
        console.log('DefaultCacheManager translateTextPath', translateTextPath);
    }

    public getTodayCacheTaskPath(): string {
        return this.handleTaskPath + '\\' + TimeUtils.getNowFormatDate() + '.txt';
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

    public saveTaskPath(path: string): boolean {
        //内存中
        this.lastHandleAudioPaths.add(path);//20161017141228
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
                    console.log('CacheManager saveTaskPath err', err);
            });
            return false;
        }
        return true;
    }

    public saveFailTaskPath(path: string) {
        let isExist = this.failHandleAudioPathMap.has(path);
        let retryCount = 1;
        if (isExist) {
            retryCount = this.failHandleAudioPathMap.get(path);
            retryCount++;
        }
        this.failHandleAudioPathMap.set(path, retryCount);

    }

    public getRetryTaskPathsByToday(): string[] {
        let retryTasks = [];
        this.failHandleAudioPathMap.forEach((value, key, map) => {
            if (value == this.retryCount) {
                retryTasks.push(key);
            }
        });
        return retryTasks;
    }

    public removeFailTaskPath(path: string) {
        let isExist = this.failHandleAudioPathMap.has(path);
        if (isExist) {
            this.failHandleAudioPathMap.delete(path);
        }
    }

    public removeLastTaskPathOnlyFile(path: string) {
        let audioPath = this.getTodayCacheTaskPath();
        let content = fs.readFileSync(audioPath).toString();
        if (content.indexOf(path) > -1) {
            content.replace(path, '');
            let audioPathContent = path + os.EOL;
            fs.writeFileSync(audioPath, audioPathContent);
            return true;
        }
        return false;
    }

    public removeLastTaskPathOnlyCache(path: string) {
        this.lastHandleAudioPaths.delete(path);
    }

    public removeAllTaskCacheData() {
        this.lastHandleAudioPaths.clear();
        this.failHandleAudioPathMap.clear();
        FileUtils.rmdirOnlyDir(this.cacheResBasePath);
    }

    public saveTranslateResultToDb(model: AudioRecogniseModel) {

    }

    public saveTranslateTextToFile({ fileNameExcludeSuffix, translateTextArr }) {
        let translateTextPath = this.getTranslateTextPath() + '\\' + TimeUtils.getNowFormatDate();
        !fs.existsSync(translateTextPath) && fs.mkdirSync(translateTextPath);
        translateTextPath += '\\' + fileNameExcludeSuffix + '.txt';
        fs.writeFileSync(translateTextPath, translateTextArr.join(os.EOL));
    }
}
