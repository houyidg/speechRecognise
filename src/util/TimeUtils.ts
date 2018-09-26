import { Clogger } from "../config";

/**
 * 
 * @param timeOffset hh:mm:ss
 */
export class TimeUtils {
    public static getSecondByTimeOffset(timeOffset: string): string[] {
        let rsArr = ['0'];
        try {
            let arr = timeOffset.split(':');
            let secondTime = parseInt(arr[0]) * 60 * 60 + parseInt(arr[1]) * 60 + parseInt(arr[2]);
            let numberArr = [0];
            TimeUtils.genTimeQuantum(secondTime, numberArr);
            rsArr = TimeUtils.genAssignFormatTimeQuanTum(numberArr);
        } catch (error) {
            Clogger.info('getSecondByTimeOffset error', error);
        }
        return rsArr;
    }

    /**
     * 
     * @param startTime hh:mm:ss
     * @param endTime 
     */
    public static getMinDuration(startTime: string, endTime: string): string {
        let startArr = startTime.split(':');
        let endArr = endTime.split(':');
        let rs = '00:01:00';
        if (endArr[1].localeCompare(startArr[1]) > 0) {//end minute more than start
        } else {
            rs = `00:00:${endArr[2]}`;
        }
        return rs;
    }

    private static genAssignFormatTimeQuanTum(arr: number[]): string[] {
        let rs = [];
        arr.forEach(element => {
            let hour: any = parseInt(element / 3600 + '');
            if (hour < 10) {
                hour = '0' + hour;
            }
            let minute: any = parseInt((element / 60) % 60 + '');
            if (minute < 10) {
                minute = '0' + minute;
            }
            let second: any = parseInt(element % 60 + '');
            if (second < 10) {
                second = '0' + second;
            }
            rs.push(`${hour}:${minute}:${second}`);
        });
        return rs;
    }
    private static genTimeQuantum(time, arr: number[]) {
        let maxValue = -1;
        if (time > (maxValue = arr[arr.length - 1])) {
            arr.push(Math.min(time, maxValue + 60));
            TimeUtils.genTimeQuantum(time, arr);
        }
    }

    public static getNowFormatDate() {
        var date = new Date();
        var seperator1 = "-";
        var year = date.getFullYear();
        var month: any = date.getMonth() + 1;
        var strDate: any = date.getDate();
        if (month >= 1 && month <= 9) {
            month = "0" + month;
        }
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }
        var currentdate = year + seperator1 + month + seperator1 + strDate;
        return currentdate;
    }

    public static getNowAccurateDate() {
        var date = new Date();
        // var year = date.getFullYear();
        // var month: any = date.getMonth() + 1;
        // var day: any = date.getDate();
        // let mis = date.getHours() * 60 * 60 * 1000 + date.getMinutes() * 60 * 1000 + date.getSeconds() * 1000 + "";
        // if (month >= 1 && month <= 9) {
        //     month = "0" + month;
        // }
        // if (day >= 0 && day <= 9) {
        //     day = "0" + day;
        // }
        return date.getTime() + '';
    }
}
