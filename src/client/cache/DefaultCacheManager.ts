import { AudioRecogniseModel } from './../AudioModel';

import { ICacheManager } from './ICacheManager';
import * as fs from "fs";
import * as os from "os";
import { TimeUtils } from '../../util/TimeUtils';
export class DefaultCacheManager implements ICacheManager {
    private lastHandleAudioPaths: Set<String>;//上一次处理的文件路径
    private failHandleAudioPathMap: Map<String, number>;//上一次处理的文件路径filename,retryCount
    private cacheAudioBasePath;//以及处理的audio路径文件夹
    private retryCount = 1;

    public init(cacheAudioBasePath) {
        this.lastHandleAudioPaths = new Set();
        this.failHandleAudioPathMap = new Map();
        this.cacheAudioBasePath = cacheAudioBasePath;
        !fs.existsSync(cacheAudioBasePath) && fs.mkdirSync(cacheAudioBasePath);
    }

    public getTodayCacheTaskPath(): string {
        return this.cacheAudioBasePath + '\\' + TimeUtils.getNowFormatDate() + '.txt';
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

    public removeAllTaskPath() {
        this.lastHandleAudioPaths.clear();
        this.failHandleAudioPathMap.clear();
    }

    public backUpTaskPathByTimer() {

    }

    public saveTranslateResult(model: AudioRecogniseModel) {

    }
}
