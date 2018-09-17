import { PhoneSessionModel } from '../PhoneSessionModel';
/**
    缓存组件
    *  这次执行任务时保存以及缓存所有路径
    *  这次执行失败时保存以及缓存路径
    *  定时备份执行的任务
    *  定时清除失败任务和执行任务的路径文件
    *  保存翻译后的任务
 */
export interface ICacheManager {
    getAudioSrcBasePath();
    getDivisionPath();
    getTransformPath();
    getTranslateTextPath();
    getNeedHandleFiles();
    init({ audioSrcBasePath, cacheResBasePath, handleTaskPath, divisionPath, transformPath, translateTextPath })
    /**
     * @param path 
     * return true 代表已经在处理或者处理完成， false 
     */
    isSaveTaskPath(path: string): boolean;
    saveFailTaskPath(path: string);
    removeLastTaskPathOnlyCache(path: string);
    removeLastTaskPathOnlyFile(path: string);
    removeFailTaskPath(path: string);
    getRetryModelsByToday(): PhoneSessionModel[];
    removeAllTaskCacheByOneLoop();//remove 这次loop
    removeAllTaskCacheByAtTime();//remove 这次调度(多次loop)
    getTodayCacheTaskPath();
    saveTranslateText(sessionModel: PhoneSessionModel, fileNameExcludeSuffix, translateTextArr: string[]);
}

