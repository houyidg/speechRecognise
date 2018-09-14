"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 * @param timeOffset hh:mm:ss
 */
var TimeUtils = /** @class */ (function () {
    function TimeUtils() {
    }
    TimeUtils.getSecondByTimeOffset = function (timeOffset) {
        var rsArr = ['0'];
        try {
            var arr_1 = timeOffset.split(':');
            var secondTime = parseInt(arr_1[0]) * 60 * 60 + parseInt(arr_1[1]) * 60 + parseInt(arr_1[2]);
            var numberArr = [0];
            TimeUtils.genTimeQuantum(secondTime, numberArr);
            rsArr = TimeUtils.genAssignFormatTimeQuanTum(numberArr);
        }
        catch (error) {
            console.log('getSecondByTimeOffset error', error);
        }
        return rsArr;
    };
    /**
     *
     * @param startTime hh:mm:ss
     * @param endTime
     */
    TimeUtils.getMinDuration = function (startTime, endTime) {
        var startArr = startTime.split(':');
        var endArr = endTime.split(':');
        var rs = '00:01:00';
        if (endArr[1].localeCompare(startArr[1]) > 0) { //end minute more than start
        }
        else {
            rs = "00:00:" + endArr[2];
        }
        return rs;
    };
    TimeUtils.genAssignFormatTimeQuanTum = function (arr) {
        var rs = [];
        arr.forEach(function (element) {
            var hour = parseInt(element / 3600 + '');
            if (hour < 10) {
                hour = '0' + hour;
            }
            var minute = parseInt((element / 60) % 60 + '');
            if (minute < 10) {
                minute = '0' + minute;
            }
            var second = parseInt(element % 60 + '');
            if (second < 10) {
                second = '0' + second;
            }
            rs.push(hour + ":" + minute + ":" + second);
        });
        return rs;
    };
    TimeUtils.genTimeQuantum = function (time, arr) {
        var maxValue = -1;
        if (time > (maxValue = arr[arr.length - 1])) {
            arr.push(Math.min(time, maxValue + 60));
            TimeUtils.genTimeQuantum(time, arr);
        }
    };
    TimeUtils.getNowFormatDate = function () {
        var date = new Date();
        var seperator1 = "-";
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var strDate = date.getDate();
        if (month >= 1 && month <= 9) {
            month = "0" + month;
        }
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }
        var currentdate = year + seperator1 + month + seperator1 + strDate;
        return currentdate;
    };
    return TimeUtils;
}());
exports.TimeUtils = TimeUtils;