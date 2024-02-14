"use strict";

//------------------------------//------------------------------My
/** wrapper */
class My {
    /** 1:長さnの連番配列。 2:n<mのときは、n~m未満の連番配列。 3:for文でイテレータとして使うことがある。 @retrun array */
    static range = (n, m=0) => [...Array(m<n?n:m-n)].map((_, i) => (m<n?i:i+n));
    /** 長さn、要素mで埋まった配列 @retrun array */
    static rangeFills = (n, m) => [...Array(n)].map(_ => m);
    /** ランダム関数。少数切り捨て @retrun int */
    static ran = (n) => Math.floor(Math.random() * n);
}


//------------------------------//------------------------------ClassTrump
/** 主な中身は「shuffle, draw, throwCard, getSymbol, getNumber, viewCard」の6つの関数 */
class ClassTrump {
    constructor() {
        /** トランプは52枚のカードで構成されている。ジョーカーは面倒なので入れなかった。*/
        this._tower = My.range(13*4);
        /** ゴミ箱。 */
        this._trush = [];
    }

//------------------------------ClassTrump shuffle
    /** タワーをシャッフルする関数。 @_ */
    shuffle() {
        const result = [];
        while (0 < this._tower.length) {
            const pos = My.ran(this._tower.length);
            const [card] = this._tower.splice(pos, 1);  //splice()は配列を返すので.join()か[]が必要
            result.push(card);
        }
        this._tower = result;
    }

//------------------------------ClassTrump draw
    /** カードを1つ引く関数。タワーがないときは、ゴミ箱をタワーにする。 @retrun int */
    draw() {
        const isNeedTrush = (n) => (this._tower.length <= 0) ? true: false;
        if (isNeedTrush() == true) {
            this._tower = this._trush;
            this._trush = [];
            this.shuffle();
        } 
        return this._tower.shift();
    }

//------------------------------ClassTrump throwCard
    /** カードを1つ捨てる関数。方法がvalueの上書きと削除の2種類ある。 @retrun array */
    throwCard(arr, i, override=true) {
        this._trush.push(arr[i]);
        return override ?
            arr[i] = -1:              // -1が手札なしを表している。こっちはreturnの意味がない。
            arr.splice(n, 1).join();  //splice()は配列を返すのでjoin()が必要
    }

//------------------------------ClassTrump getSymbol
    /** カードの記号を割り出す関数。 @retrun int */
    getSymbol(n) {
        return Math.floor(n / 13);
    }

//------------------------------ClassTrump getNumber
    /** カードの数字を割り出す関数。 @retrun int */
    getNumber(n) {
        return n % 13;
    }

//------------------------------ClassTrump viewCard
    /** カードの記号と数字を文字で見るための関数。 @retrun array[str, str] */
    viewCard(n, ace=true) {
        const symbolData = ["♠", "♦", "♣", "♥", "☠"];
        const colorData = ["black", "red", "green", "violet", "black"];
        const numberData =  ace ?
            ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]:
            ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        const symbol = symbolData[Math.floor(n / 13)];
        const color = colorData[Math.floor(n / 13)];
        const number = numberData[n % 13];
        if (symbol != symbolData[4]) return [`${symbol}${number}`, color];
        else return [`${symbol}J`, color]
    }
}


//------------------------------//------------------------------ClassPoker
/** ClassTrumpを継承したクラス。継承する意味は特にない。
 * 主な中身は「draws, throwCards, viewHands, jugeHand」の4つの関数。
 * jugeHand関数がすごく長い。
*/
class ClassPoker extends ClassTrump {
    constructor() {
        super();    //継承の仕様上で必要なメソッド
        /**  手札は5枚。valueの-1が手札なしを表している */
        this.playerHands = My.rangeFills(5, -1);
    }

//------------------------------ClassPoker draws
    /** 配列のカードを引く関数。 @_ */
    draws(cards) {
        for (const [k, v] of cards.entries()) {
            if (v == -1) {
                const card = this.draw();
                cards[k] = card;
            }
        }
    }

//------------------------------ClassPoker throwCards
    /** 配列のカードを捨てる関数。 @_ */
    throwCards(cards, leftCards) {
        for (const [k, value] of leftCards.entries()) {
            if (value == false) {
                this.throwCard(cards, k);
            }
        }
    }

//------------------------------ClassPoker viewHands
    /** htmlに値を投げる関数。 @_ */
    viewHands(cards) {
        /** 実際はimgではなく、環境依存の文字を投げている。*/
        const imgNames = document.querySelectorAll("td[name='img']");
        const setCard = (e, n) => {
            const [str, color] = this.viewCard(n);
            e.textContent = str;
            e.style.color = color;
        };
        cards.map((n, i) => setCard(imgNames[i], n));
    }

    
//------------------------------//------------------------------ClassPoker jugeHand
    /** 役を判断する関数。長い。 @_ */
    jugeHand(cards) {
    //------------------------------jugeHand main
        const getNumber = this.getNumber;   //メソッドの中の関数ではthisが使えない
        const getSymbol = this.getSymbol;
        const isFlush = (checkFlush(cards) == "フラッシュ") ;
        const isStraight = (checkStraight(cards) == "ストレート");
        const isRoyal = (checkRoyal(cards) == "ロイヤル");

        let msg1 = "none";
        if (msg1 == "none") msg1 = checkSameNumbers(cards);
        if (msg1 == "none") if (isFlush && isStraight && isRoyal) msg1 = "ロイヤルストレートフラッシュ";
        if (msg1 == "none") if (isFlush && isStraight) msg1 = "ストレートフラッシュ";
        if (msg1 == "none") if (isFlush) msg1 = "フラッシュ";
        if (msg1 == "none") if (isStraight) msg1 = "ストレート";
        if (msg1 == "none") msg1 = "役なし";

        document.getElementById("msg1").textContent = msg1;
        return;

    //------------------------------jugeHand checkSameNumbers
        /** @return str */
        function checkSameNumbers(cards) {
            //getCardNumbers
            const cardNumbers = getNumberOrSimbol(cards, getNumber);

            //sameCount
            const [bestCount, secondBest] = getSameCounts(cardNumbers);
            
            //return hand
            if (bestCount == 5) return "5カード";
            if (bestCount == 4) return "4カード";
            if (bestCount == 3) {
                if (secondBest == 2) return "フルハウス";
                else return "3カード";
            }
            if (bestCount == 2) {
                if (secondBest == 2) return "2ペア";
            }
            return "none";
        }

    //------------------------------jugeHand checkFlush
        /** @return str */
        function checkFlush(cards) {
            //getCardSymbols
            const cardSymbols = getNumberOrSimbol(cards, getSymbol);

            //sameCount
            const [bestCount, _] = getSameCounts(cardSymbols)

            //return hand
            if (bestCount == 5) return "フラッシュ"
            return "none";
        }

    //------------------------------jugeHand checkStraight
        /** @return str */
        function checkStraight(cards) {
            //getCardNumbers
            const cardNumbers = getNumberOrSimbol(cards, getNumber);

            //return hand
            for (let i of My.range(cardNumbers.length-1)) {
                if (cardNumbers[i]+1 != cardNumbers[i+1]) return "none";
            }
            return "ストレート";
        }
    
    //------------------------------jugeHand checkRoyal
        /** @return str */
        function checkRoyal(cards) {
            //getCardNumbers
            const cardNumbers = getNumberOrSimbol(cards, getNumber);
            
            //動くけど、これでいいんだろうか？？ソート済みが前提になってしまっている。
            if (cardNumbers[4] == 12) return "ロイヤル"
            else return "none";
        }

    //------------------------------jugeHand getNumberOrSimbol
        /** 配列で割り振られた指標番号からカードの数字や記号を割り出す関数を呼び出す関数。
         * jugeHandの関数はみんなこの3行を書いていたので切り出した。  @retrun array*/
        function getNumberOrSimbol(cards, getFunc) {
            const cardNumbers = [];
            cards.map(card => cardNumbers.push(getFunc(card)));
            cardNumbers.sort((a, b) => a - b);
            return cardNumbers;
        }

    //------------------------------jugeHand getSameCounts
        /** カードの数字や記号を数える関数。 @retrun [int, int] */
        function getSameCounts(cardElements) {
            //sameCount
            let bestCount = 0;
            let secondBest = 0;
            let count = 0;
            let searchElement = -1;

            for (const element of cardElements) {
                if (searchElement == element) {
                    count += 1;
                } else {
                    if (bestCount <= count) {
                        secondBest = bestCount;
                        bestCount = count;
                    }
                    count = 1;
                    searchElement = element;
                }
            }

            //sameCount last
            if (bestCount < count) {
                secondBest = bestCount;
                bestCount = count;
            } else if (secondBest < count) {
                secondBest = count;
            }

            return [bestCount, secondBest];
        }
    }
}



//------------------------------//------------------------------functions
/** htmlのmessageとeventやstyleを設定する関数  @_*/
function initHtml() {
    //append
    //inputはあとでremove()で消すので追加が必要だった。いい案が思いつかなかったのでinnerHTMLで上書き。
    const text1 = document.getElementById("setCheckbox5").innerHTML;
    if (text1.search("input") < 0) {
        let text2 = "";
        for (const _ of My.range(5)) {
            text2 += "<td><input type='checkbox' name='hands'></td>\n";
        }
        document.getElementById("setCheckbox5").innerHTML = text2;
    }
    
    //css
    //単位emは親要素に指定したサイズが基準になる単位で、デフォルト値は1em=16px
    document.querySelector("table").style.margin = "auto";
    document.querySelector("table").style.tableLayout = "fixed";    //fixedは枠からはみ出すことがある。
    document.querySelector("table").style.width = "800px";
    for (const e of document.querySelectorAll("body")) {
        e.style.fontSize = "2em";
    }
    for (const e of document.querySelectorAll("td")) {
        e.style.textAlign = "center";
        e.style.margin = "auto";
    }
    for (const e of document.querySelectorAll("input[type='checkbox']")) {
        e.style.width = "2em";
        e.style.height = "2em";
    }
    for (const e of document.querySelectorAll("input[type='button']")) {
        e.style.padding = "0.2em 0.5em";    // 上下 | 左右
        e.style.fontSize = "0.6em";
    }
    //msg
    document.title = "1人ポーカー"
    const msgTh = `1人ポーカー`
    const msg1 = `残したいカードにチェックを入れてください。`;
    const msgBD = `カードを交換する`;
    document.getElementById("th").textContent = msgTh;
    document.getElementById("msg1").textContent = msg1;
    document.getElementById("btnDraw").value = msgBD;
    //event
    document.getElementById("btnDraw").addEventListener("click", onClickEvent1);
    document.getElementById("btnDraw").removeEventListener("click", onLoard);
}

//------------------------------
/** checkedBoxからチェック済の場所の値を配列にして返す関数。一応チェックを外している。  @return array[bool] */
function getCheckedBools(checkedBoxs) {
    checkedBoxs = document.querySelectorAll("input[name='hands']");
    const checkedBools = [];
    for (const e of checkedBoxs) {
        checkedBools.push(e.checked);
        e.checked = false;
    }
    // ? const checkedBools2 = checkedBools.map(b => !b)   //反転用
    return checkedBools;
}

//------------------------------
/** event1の終わりに実行する処理群 @_ */
function finishEvent1(poker, checkedBoxs) {
    /** checkedBoxを消す関数。反対から削除しないとうまくいかないかった。 */
    const removeCheckedBoxs = (checkedBoxs) => {
        const cbl = checkedBoxs.length
        for (let i of My.range(cbl)) {
            checkedBoxs[cbl-1-i].remove();
        }
    }

    poker.throwCards(player, My.rangeFills(5, false));
    removeCheckedBoxs(checkedBoxs);
    document.getElementById("btnDraw").value = "もう一回やる";
    document.getElementById("btnDraw").removeEventListener("click", onClickEvent1);
    document.getElementById("btnDraw").addEventListener("click", onLoard);
}



//------------------------------//------------------------------global
const poker = new ClassPoker();
const player = poker.playerHands;

//------------------------------//------------------------------onLord
/** onLoardの関数 @_ */
function onLoard() {
    initHtml();
    poker.shuffle();
    poker.draws(player);
    player.sort((a, b) => a - b);
    poker.viewHands(player);
}

//------------------------------//------------------------------onClickEevent
/** onClickEventの関数 @_  */
function onClickEvent1() {
    const checkedBoxs = document.querySelectorAll("input[name='hands']");
    const leftCards = getCheckedBools(checkedBoxs);
    poker.throwCards(player, leftCards);
    poker.draws(player);
    poker.viewHands(player);
    poker.jugeHand(player);
    finishEvent1(poker, checkedBoxs);
}
