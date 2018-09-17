
const fs = require('fs')
const path = require('path')
export class FileUtils {

    public static rmdirOnlyDir(dir) {
        console.log('--------------------------------rmdirOnlyDir :', dir);
        let arr = [dir]
        let current = null
        let index = 0
        while (current = arr[index++]) {
            // 读取当前文件，并做一个判断，文件目录分别处理
            let stat = fs.statSync(current)
            //如果文件是目录
            if (stat.isDirectory()) {
                //读取当前目录，拿到所有文件
                let files = fs.readdirSync(current)
                // 将文件添加到文件池
                arr = [...arr, ...files.map(file => path.join(current, file))]
            }
        }
        //遍历删除文件
        for (var i = arr.length - 1; i >= 0; i--) {
            // 读取当前文件，并做一个判断，文件目录分别处理
            let stat = fs.statSync(arr[i])
            // 目录和文件的删除方法不同
            if (stat.isDirectory()) {
                // fs.rmdirSync(arr[i])
            } else {
                fs.unlinkSync(arr[i])
            }
        }
    }
}
