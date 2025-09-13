// 通貨データの定義（シンボルと名前のみ）
const currencyInfo = {
    'USD': { name: '米ドル', symbol: '$' },
    'EUR': { name: 'ユーロ', symbol: '€' },
    'CAD': { name: 'カナダドル', symbol: 'C$' },
    'AUD': { name: '豪ドル', symbol: 'A$' },
    'GBP': { name: '英ポンド', symbol: '£' },
    'CHF': { name: 'スイスフラン', symbol: 'Fr' },
    'NZD': { name: 'ニュージーランドドル', symbol: 'NZ$' },
    'JPY': { name: '日本円', symbol: '¥' }
};

// 為替レートを格納する変数
let exchangeRates = {};
let isLoading = true;

// DOM要素の取得
const amountInput = document.getElementById('amount');
const fromCurrencySelect = document.getElementById('fromCurrency');
const toCurrencySelect = document.getElementById('toCurrency');
const resultDiv = document.getElementById('result');
const rateInfoDiv = document.getElementById('rateInfo');
const swapBtn = document.getElementById('swapBtn');

// 為替レートをAPIから取得
async function fetchExchangeRates() {
    try {
        isLoading = true;
        resultDiv.textContent = '読み込み中...';
        rateInfoDiv.textContent = '為替レート取得中...';

        // ExchangeRate-API の無料エンドポイント（JPYをベースに取得）
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/JPY');

        if (!response.ok) {
            throw new Error('為替レート取得失敗');
        }

        const data = await response.json();
        exchangeRates = data.rates;

        // 取得成功後、変換を実行
        isLoading = false;
        convertCurrency();

    } catch (error) {
        console.error('為替レート取得エラー:', error);
        isLoading = false;

        // エラー時はフォールバック値を使用
        exchangeRates = {
            'USD': 0.0067,
            'EUR': 0.0061,
            'CAD': 0.0090,
            'AUD': 0.0101,
            'GBP': 0.0052,
            'CHF': 0.0058,
            'NZD': 0.0109,
            'JPY': 1
        };

        resultDiv.textContent = 'オフラインモード';
        rateInfoDiv.textContent = '※固定レート使用中';

        // 3秒後に通常表示に戻す
        setTimeout(() => {
            convertCurrency();
        }, 3000);
    }
}

// 通貨セレクトボックスの初期化
function initializeCurrencySelects() {
    const currencyOptions = Object.entries(currencyInfo).map(([code, info]) =>
        `<option value="${code}">${code} - ${info.name}</option>`
    ).join('');

    fromCurrencySelect.innerHTML = currencyOptions;
    toCurrencySelect.innerHTML = currencyOptions;

    // デフォルト値の設定
    fromCurrencySelect.value = 'JPY';
    toCurrencySelect.value = 'USD';
}

// 通貨変換の計算
function convertCurrency() {
    if (isLoading || Object.keys(exchangeRates).length === 0) {
        return;
    }

    const amount = parseFloat(amountInput.value) || 0;
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;

    if (amount === 0) {
        resultDiv.textContent = '0.00';
        rateInfoDiv.textContent = '為替レート: -';
        return;
    }

    // 変換計算（JPYを基準）
    let convertedAmount;
    if (fromCurrency === toCurrency) {
        convertedAmount = amount;
    } else if (fromCurrency === 'JPY') {
        convertedAmount = amount * exchangeRates[toCurrency];
    } else if (toCurrency === 'JPY') {
        convertedAmount = amount / exchangeRates[fromCurrency];
    } else {
        // 両方が外貨の場合：JPY経由で計算
        const amountInJPY = amount / exchangeRates[fromCurrency];
        convertedAmount = amountInJPY * exchangeRates[toCurrency];
    }

    // 結果の表示
    const formattedResult = convertedAmount.toFixed(2);
    resultDiv.textContent = `${currencyInfo[toCurrency].symbol}${formattedResult}`;

    // レート情報の計算と表示
    let rate;
    if (fromCurrency === toCurrency) {
        rate = 1;
    } else if (fromCurrency === 'JPY') {
        rate = exchangeRates[toCurrency];
    } else if (toCurrency === 'JPY') {
        rate = 1 / exchangeRates[fromCurrency];
    } else {
        rate = exchangeRates[toCurrency] / exchangeRates[fromCurrency];
    }

    rateInfoDiv.textContent = `為替レート: 1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
}

// 通貨の入れ替え
function swapCurrencies() {
    const temp = fromCurrencySelect.value;
    fromCurrencySelect.value = toCurrencySelect.value;
    toCurrencySelect.value = temp;
    convertCurrency();
}

// イベントリスナーの設定
amountInput.addEventListener('input', convertCurrency);
fromCurrencySelect.addEventListener('change', convertCurrency);
toCurrencySelect.addEventListener('change', convertCurrency);
swapBtn.addEventListener('click', swapCurrencies);

// スマホでの数値入力改善
amountInput.addEventListener('focus', function() {
    if (this.value === '0') {
        this.value = '';
    }
});

amountInput.addEventListener('blur', function() {
    if (this.value === '') {
        this.value = '0';
        convertCurrency();
    }
});

// キーボード対応
document.addEventListener('keydown', function(e) {
    // Enterキーで変換実行
    if (e.key === 'Enter') {
        convertCurrency();
    }
    // Spaceキーで通貨入れ替え
    if (e.key === ' ' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        swapCurrencies();
    }
});

// 初期化
initializeCurrencySelects();

// ページ読み込み時に為替レートを取得
fetchExchangeRates();

// 30分ごとに為替レートを更新
setInterval(fetchExchangeRates, 1800000);