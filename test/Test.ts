var moment = require('moment');
console.log("001===>>>  ", moment().format('YYYY-MM-DD hh:mm:ss'));
new Promise((resolve, reject) => {
    reject(-1);
}).then((rs) => {
    //Attaches callbacks for the resolution and/or rejection of the Promise.
    let s = undefined;
    console.log('rs1', rs);
    // return new Promise((resolve, reject) => { reject(-33) });
}, (rs) => {
    console.log('rj1', rs);
}).then((rs) => {
    //如果上一个Then不返回值，这里接收到undefined
    console.log('rs2', rs);
}, (rs) => {
    console.log('rj2', rs);
}).catch((rj) => {
    //Attaches a callback for only the rejection of the Promise.
    console.log('catch', rj);
});

let arr = ['11', '22'];
arr.forEach((e) => {
    console.log('e', e);
});
for (let e in arr) {
    console.log('for in e', e);
}

for (let e of arr) {
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

async function zuix() {
    let rs = await new Promise((rs, rj) => {
        rj(222);
    });
    console.log('zuix ', rs);
}
try {
    zuix();
} catch (e) {
    console.log('zuix e', e);
}
