"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require('fs');
var path = require('path');
var FileUtils = /** @class */ (function () {
    function FileUtils() {
    }
    FileUtils.rmdirOnlyFile = function (dir, excludeDir) {
        console.log('--------------------------------rmdirOnlyDir :', dir);
        var arr = [dir];
        var current = null;
        var index = 0;
        while (current = arr[index++]) {
            // 读取当前文件，并做一个判断，文件目录分别处理
            if (current == excludeDir) {
                continue;
            }
            var stat = fs.statSync(current);
            //如果文件是目录
            if (stat.isDirectory()) {
                //读取当前目录，拿到所有文件
                var files = fs.readdirSync(current);
                // 将文件添加到文件池
                arr = arr.concat(files.map(function (file) { return path.join(current, file); }));
            }
        }
        //遍历删除文件
        for (var i = arr.length - 1; i >= 0; i--) {
            // 读取当前文件，并做一个判断，文件目录分别处理
            var stat = fs.statSync(arr[i]);
            // 目录和文件的删除方法不同
            if (stat.isDirectory()) {
                // fs.rmdirSync(arr[i])
            }
            else {
                fs.unlinkSync(arr[i]);
            }
        }
    };
    return FileUtils;
}());
exports.FileUtils = FileUtils;
