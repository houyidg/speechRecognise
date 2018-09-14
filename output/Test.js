var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var moment = require('moment');
console.log("001===>>>  ", moment().format('YYYY-MM-DD hh:mm:ss'));
new Promise(function (resolve, reject) {
    reject(-1);
}).then(function (rs) {
    //Attaches callbacks for the resolution and/or rejection of the Promise.
    var s = undefined;
    console.log('rs1', rs);
    // return new Promise((resolve, reject) => { reject(-33) });
}, function (rs) {
    console.log('rj1', rs);
}).then(function (rs) {
    //如果上一个Then不返回值，这里接收到undefined
    console.log('rs2', rs);
}, function (rs) {
    console.log('rj2', rs);
}).catch(function (rj) {
    //Attaches a callback for only the rejection of the Promise.
    console.log('catch', rj);
});
var arr = ['11', '22'];
arr.forEach(function (e) {
    console.log('e', e);
});
for (var e in arr) {
    console.log('for in e', e);
}
for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
    var e = arr_1[_i];
    console.log('for of e', e);
}
// let { result1 } = {
//     corpus_no: '6600535123448247414',
//     err_msg: 'success.',
//     err_no: 0,
//     result:
//         ['你好这里是脱光客户中心，什么需要写一万或者是有什么要咨询的吗？忘了什么事情啊但是暂时没有，那不客气有疑问欢迎随时致电，好吧，，好的再见，'],
//     sn: '467773926101536806841'
// };
// let { bar, foo } = { foo: "aaa", bar: "bbb" };
// console.log('result', result1);
function zuix() {
    return __awaiter(this, void 0, void 0, function () {
        var rs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (rs, rj) {
                        rj(222);
                    })];
                case 1:
                    rs = _a.sent();
                    console.log('zuix ', rs);
                    return [2 /*return*/];
            }
        });
    });
}
try {
    zuix();
}
catch (e) {
    console.log('zuix e', e);
}
