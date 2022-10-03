"use strict";
//------------------------------//------------------------------wrapper
let drawID;
const reset = () => clearInterval(drawID);
const getId = (id) => document.getElementById(id);
const getName = (name) => document.getElementsByName(name);
const getRandom = (n) => Math.floor(Math.random() * n);
const getDisplayValue = () => {for(let ele of getName("display")) {if (ele.checked) {return ele.value;}}}; //長いのでワンライナー
const gazou = () => "./img/free_" + Math.ceil(Math.random()*3) + ".jpg";

//------------------------------//------------------------------message
let msgCount=0;
const message1 = () => getId("displayAnimeCount").textContent = "描画中は数字を表示";
const message2 = () => {alert("WARNIG: 未設定の項目があります。"); (msgCount <= 3)? message3("Σ(ﾟДﾟ)"): message3("ヽ(`Д´)ﾉ");}
const message3 = (str) => {getId("displayAnimeCount").textContent = str; msgCount++;};
const message4 = () => {alert("WARNIG: 半角数字以外の文字があります。"); getId("displayAnimeCount").textContent = "(´Д｀)";}

//------------------------------InputError
function isInputError(maxX, maxY, countRounds) {
    if (maxX == false || maxY == false) {
        message2();
        return true;
    }
    const reg = /[^0-9]/;
    const exclude = (reg, str) => reg.test(str);
    if (exclude(reg, maxX) || exclude(reg, maxY) || exclude(reg, countRounds)) {
        message4();
        return true;
    }
}

//------------------------------//------------------------------count
class CountSimurater {
	constructor(countRounds) {
		this.countMax = 100;
		this.count = this.countMax;		//アニメーションにも影響するカウンタ
		this.countTick = this.countMax / countRounds;
	}
	countDown() {
        if (this.count <= 0) {
            this.count = this.countMax;
            return true;
        } else {
            this.count -= this.countTick; 
            if (this.count < 0) this.count = 0; 
            return false;
        }
	}
}

//------------------------------//------------------------------分割画像の設定
function setDrawData(img, maxX, maxY, arr) {   //分割画像の設定
    const getX = n => n % maxX;
    const getY = n => Math.floor(n / maxX);
    const width0  = img.width / maxX;
    const height0 = img.height / maxY;
    const drawData = [];
    arr.forEach(i => {drawData.push({
        sx: width0 * getX(i),
        sy: height0 * getY(i),
        sw: width0,
        sh: height0,
    });});
    return drawData;
}


//------------------------------//------------------------------必要な配列を判断
function getNeedArr(disV, co, canvas, max, maxX) {
    let needArr;
    switch (disV) {
        case "dp4":
            co.countMax = canvas.height;
            co.count = co.countMax;
            needArr = naturalArray(max);
            break;
        case "dp5": 
            co.countMax = canvas.width;
            co.count = co.countMax;
            needArr = columnArray(max, maxX);
            break;
        default: 
            needArr = randomArray(max);
    }
    return needArr;
}

//------------------------------連番配列
const naturalArray = (max) => [...Array(max)].map((_, i) => i);

//------------------------------乱数配列
function randomArray(max) {
    let arr = naturalArray(max);    //配列生成
    const result = [];
    while(arr.length > 0) {
        const ri = getRandom(arr.length);
        result.push(arr[ri]);         //追加
        arr.splice(ri, 1);           //削除(開始位置、削除個数)
    }
    return result;
}

//------------------------------配列2
function columnArray(max, maxX) {
    let result = [];
    for (let x=0; x<maxX; x++) {
        for (let y=0; y<max; y+=parseInt(maxX)) {
            result.push(y + x);
        }
    }
    return result;
}



//------------------------------//------------------------------dp6用の変数
class NeedParamDp6 { 
    constructor() {
        this.lowCount2;
        this.psx=0;
        this.psy=0;
        this.dx;
        this.dy;
    }
}

//------------------------------getParamDp6
function getParamDp6(co, ndp6, vector, sx, sy) {
    if (co.count === co.countMax) {
        vector = []
        ndp6.dx = sx - ndp6.psx;
        ndp6.dy = sy - ndp6.psy;
        (ndp6.dx < 0)? vector.push(1): vector.push(-1);
        (ndp6.dy < 0)? vector.push(1): vector.push(-1);
        if (ndp6.dx === 0) vector[0] = 0;
        if (ndp6.dy === 0) vector[1] = 0;
        if (Math.abs(ndp6.dx) > Math.abs(ndp6.dy)) {
            co.countMax = Math.abs(ndp6.dx);
            ndp6.lowCount2 = Math.abs(ndp6.dy);
        } else {
            ndp6.lowCount2 = Math.abs(ndp6.dx);
            co.countMax = Math.abs(ndp6.dy);
        }
        co.count = co.countMax;
        ndp6.psx = sx;
        ndp6.psy = sy;
    }
    let lowCount = ndp6.lowCount2 * co.count /co.countMax;
    return [vector, lowCount];
}


//------------------------------//------------------------------ロードときの処理
function loard() {
    const canvas = getId("ctxs");
    if (canvas.getContext === false) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = gazou();
    img.onload = () => {
        canvas.width = img.width;    //canvasを読み込んだimgと同期
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
    }
    message1();
}


//------------------------------//------------------------------メイン  長い
//設定 → canvas,imgのタグ取得・生成,変数設定,縦横同期 → 分割画像の設定 →
// → roop => { 描画情報リセット → アニメーション描画 → 前回までの結果を描画 → カウント表示 → ループ関係の変数処理 }
function shuffle() {
    reset();
    const maxX = getId("rowId").value;
    const maxY = getId("colId").value;
    const countRounds = getId("drawAnimestion").value;                     //アニメーションの基本回数
    const drawInterval = getId("drawInterval").value;
    const disV = getDisplayValue();             //ラジオボタンの値(チェック済)を取得
    const max = maxX * maxY;
    if (isInputError(maxX, maxY, countRounds)) return;   //未設定なしで、半角数字じゃないとダメ

    //canvas & image
    const canvas = getId("ctxs");
    if (canvas.getContext === false) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();  //<img> 要素を表す HTMLImageElement オブジェクトを生成
    img.src = gazou();
    img.onload = () => {
        canvas.width  = img.width;    //canvas領域を読み込んだimgと同期
        canvas.height = img.height;
        drawID = setInterval(drawing, drawInterval / countRounds);
    }

    //ループ前の設定
    let vector;
    let idd = 0;
    const ndp6 = new NeedParamDp6();
    const co = new CountSimurater(countRounds);
    const needArr = getNeedArr(disV, co, canvas, max, maxX);
    let   drawData = setDrawData(img, maxX, maxY, needArr);

//------------------------------ループ
    function drawing() {    //描画関数
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const sx = drawData[idd].sx;
        const sy = drawData[idd].sy;
        const sw = drawData[idd].sw;
        const sh = drawData[idd].sh;
        const cvsx = () => sx + co.count * vector[0];
        const cvsy = () => sy + co.count * vector[1];
        const cvsx2 = (n) => sx + n * vector[0];
        const cvsy2 = (n) => sy + n * vector[1];
        const getVector = (n) => {   //アニメーションの方角を決める
            if (co.count === co.countMax) {
                const vectorArr = {0:[-1,-1], 1:[-1,0], 2:[-1,1], 3:[0,-1], 4:[0,1], 5:[1,-1], 6:[1,0], 7:[1,1], 8:[0,0]};
                return vectorArr[n];
            }
            return vector;
        }
        
        //アニメーション
        switch (disV) {
            case "dp1":
                ctx.drawImage(img, sx, sy, sw, sh, sx, sy, sw, sh,);
                break;
            case "dp2":
                if (getVector(3)) vector 
                vector = getVector(3);   //上から
                ctx.drawImage(img, cvsx(), cvsy(), sw, sh, cvsx(), cvsy(), sw, sh,);
                break;
            case "dp3":
                vector = getVector(getRandom(8));    //8方向
                ctx.drawImage(img, cvsx(), cvsy(), sw, sh, cvsx(), cvsy(), sw, sh,);
                break;
            case "dp4":
                vector = getVector(4);
                co.countMax = canvas.height - cvsy();
                ctx.drawImage(img, cvsx(), cvsy(), sw, sh, cvsx(), cvsy(), sw, sh,);
                break;
            case "dp5": 
                vector = getVector(6);
                co.countMax = canvas.width;
                ctx.drawImage(img, cvsx(), cvsy(), sw, sh, cvsx(), cvsy(), sw, sh,);
                break;
            case "dp6":
                const ccvl = getParamDp6(co, ndp6, vector, sx, sy); //ながいので別のところ参照
                vector   = ccvl[0];
                const lowCount = ccvl[1];
                (Math.abs(ndp6.dx) > Math.abs(ndp6.dy))?
                    ctx.drawImage(img, cvsx2(co.count), cvsy2(lowCount), sw, sh, cvsx2(co.count), cvsy2(lowCount), sw, sh,):
                    ctx.drawImage(img, cvsx2(lowCount), cvsy2(co.count), sw, sh, cvsx2(lowCount), cvsy2(co.count), sw, sh,);
                break;
        }

        //前回の描画部分
        for (let k=0; k<idd; k++) {
            const sx = drawData[k].sx;
            const sy = drawData[k].sy;
            const sw = drawData[idd].sw;
            const sh = drawData[idd].sh;
            ctx.drawImage(img, sx, sy, sw, sh, sx, sy, sw, sh,);
        }

        //カウント表示
        const viewCount = (n) => {
            while (true) {
                if (n.length >= 4) return n;
                n = "0" + n.toString();
        }};
        getId("displayAnimeCount").textContent = `カウンタ=${viewCount(Math.floor(co.count))}`;   //アラートの代わり

        //アニメーションを管理する変数の処理
		if (co.countDown()) idd++;
        if (drawData.length === idd) {
            reset();
            message1();
        }
    }
}
//------------------------------ループの終わり

