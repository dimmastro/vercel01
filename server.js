import express from 'express';

const app = express()
const port = 3000

import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate"



const connections_test = {
    osmosis:{
        factoryAddress: "osmo1ymuvx9nydujjghgxxug28w48ptzcu9ysvnynqdw78qgteafj0syq247w5u",
        rpcEndpoint: "https://rpc.osmotest5.osmosis.zone"
    },
    sei:{
        factoryAddress: "sei1xmpv0ledn5rv46hkyzqjdgc20yyqldlwjv66vc7u4vw5h7fadfssnks3y6",
        rpcEndpoint: "https://rpc.atlantic-2.seinetwork.io"
    }
};
const connections = {
    inj:{
        factoryAddress: "inj1vdu3s39dl8t5l88tyqwuhzklsx9587adv8cnn9",
        rpcEndpoint: "https://sentry.tm.injective.network:443"
        // rpcEndpoint: "https://injective-rpc.publicnode.com:443"
    },
    osmosis:{
        factoryAddress: "osmo1ssw6x553kzqher0earlkwlxasfm2stnl3ms3ma2zz4tnajxyyaaqlucd45",
        rpcEndpoint: "https://rpc.osmosis.zone"
    },
    sei:{
        factoryAddress: "sei18rdj3asllguwr6lnyu2sw8p8nut0shuj3sme27ndvvw4gakjnjqqper95h",
        rpcEndpoint: "https://rpc.wallet.pacific-1.sei.io"
    }
};

const runAll = async (factoryAddress, rpcEndpoint, connectionName) => {
    const allStatus = [];
    const client = await CosmWasmClient.connect(rpcEndpoint);

    const markets = await client.queryContractSmart(
        factoryAddress,
        { markets: {limit: 100} }
    );

    for (const marketId of markets.markets) {
        console.log(marketId);

        const { market_addr: marketAddress } = await client.queryContractSmart(
            factoryAddress,
            {
                market_info: { market_id: marketId },
            }
        );

        // const price = await client.queryContractSmart(marketAddress, {
        //     spot_price: {},
        // });
        // console.log(JSON.stringify(price));

        const status = await client.queryContractSmart(marketAddress, { status: {} });

        const doll= 100
        const lev= 1
        const fee_delta= 0
        const fee_trade= 0.10 / 100 * doll
        const fee_crank= 0.20

        let short100= - status["long_funding"] * status["long_usd"] / (status["short_usd"]*1 + doll)
        if( status["long_funding"] == 0){
            short100 = - 0.90 * status["long_usd"] / (status["short_usd"]*1 + doll)
        }
        // const short100= - 0.90 * status["long_usd"] / (status["short_usd"]*1 + doll)
        const short = short100

        const h1= ((- doll * lev * short / 365 ) * 1 / 24 - fee_crank - fee_trade).toFixed(2)
        const h3= ((- doll * lev * short / 365 ) * 3 / 24 - fee_crank - fee_trade).toFixed(2)
        const h6= ((- doll * lev * short / 365 ) * 6 / 24 - fee_crank - fee_trade).toFixed(2)
        const h12= ((- doll * lev * short / 365 ) * 12 / 24 - fee_crank - fee_trade).toFixed(2)
        const sum1= ((- doll * lev * short / 365 - fee_crank ) * 1 - fee_trade).toFixed(2)
        const sum7= ((- doll * lev * short / 365 - fee_crank ) * 7 - fee_trade).toFixed(2)
        const sum30= ((- doll * lev * short  / 365 - fee_crank ) * 30 - fee_trade).toFixed(2)
        const per1 = Math.round(sum1 / doll * 365 * 100)
        const per7 = Math.round(sum7 / doll * 365 / 7 * 100)
        const per30 = Math.round(sum30 / doll * 365 / 30 * 100)



        allStatus.push({
            chain: connectionName,
            market: marketId ,
            longFunding: Math.round(status["long_funding"]*100) ,
            shortFunding: Math.round(status["short_funding"]*100),
            longUSD: Math.round(status["long_usd"]),
            shortUSD: Math.round(status["short_usd"]),
            short100: Math.round(short100*100),

            h1: (h1),
            h3: (h3),
            h6: (h6),
            h12: (h12),
            sum1: (sum1),
            sum7: (sum7),
            sum30: (sum30),
            per1: (per1),
            per7: (per7),
            per30: (per30),

            // price_usd: (price["price_usd"]),
            // price_notional: (price["price_notional"]),
            // price_base: (price["price_base"]),
            price_usd: 0,
            price_notional: 0,
            price_base: 0,

            borrow_fee: (status["borrow_fee"]*10000)/10000,
            instant_delta_neutrality_fee_value: (status["instant_delta_neutrality_fee_value"]*10000)/10000,
            delta_neutrality_fee_fund: (status["delta_neutrality_fee_fund"]*10000)/10000,
            fees_wallets: (status["fees"]["wallets"]*10000)/10000,
            fees_protocol: (status["fees"]["protocol"]*10000)/10000,
            fees_crank: (status["fees"]["crank"]*10000)/10000
        });

        // console.log(
        //     status["long_funding"],
        //     status["short_funding"],
        //     status["long_usd"],
        //     status["short_usd"]
        // );
    }

    return allStatus;
};

// const runAllForAllConnections = async () => {
//     const allConnectionsStatus = [];
//
//     for (const connectionName in connections) {
//         const connection = connections[connectionName];
//         const status = await runAll(connection.factoryAddress, connection.rpcEndpoint, connectionName);
//         // allConnectionsStatus[connectionName] = status;
//         allConnectionsStatus.push(...status);
//     }
//
//     return allConnectionsStatus;
// };

const runAllForAllConnections = async () => {
    const allConnectionsStatus = [];

    // Создание массива обещаний для каждого соединения
    const promises = Object.keys(connections).map(async connectionName => {
        const connection = connections[connectionName];
        const status = await runAll(connection.factoryAddress, connection.rpcEndpoint, connectionName);
        return status;
    });

    // Ожидание выполнения всех обещаний
    const results = await Promise.all(promises);

    // Объединение результатов
    results.forEach(statusArray => {
        allConnectionsStatus.push(...statusArray);
    });

    return allConnectionsStatus;
};



app.get('/api/fund', (req, res) => {


    runAllForAllConnections().then(allConnectionsStatus => {
        console.log("All connections status:", allConnectionsStatus);
        // res.json({
        //     'status': allConnectionsStatus
        // })
        res.json(allConnectionsStatus)

    }).catch(error => {
        console.error("Error:", error);
    });


})

app.get('/api/html', (req, res) => {
    runAllForAllConnections()
        .then(allConnectionsStatus => {
            const html = generateHtmlTable(allConnectionsStatus);
            res.send(html);
        })
        .catch(error => {
            console.error("Error:", error);
            res.status(500).send("An error occurred");
        });
});


app.get('/api/html1000', (req, res) => {
    runAllForAllConnections1000()
        .then(allConnectionsStatus => {
            const html = generateHtmlTable(allConnectionsStatus);
            res.send(html);
        })
        .catch(error => {
            console.error("Error:", error);
            res.status(500).send("An error occurred");
        });
});


function generateHtmlTable(allConnectionsStatus) {
    let html = "";
    console.log(allConnectionsStatus);
    html += "<style>table { border-collapse: collapse; } th, td { border: 1px solid black; text-align: right; }</style>";

    // html += `<h2>Funding</h2>`;
    // Добавление таблицы
    html += "<table><thead><tr><th>Chain</th><th>Market</th><th>Long Funding</th><th>Short Funding</th><th>Long USD</th>" +
        "<th>Short USD</th>" +
        "<th>short100</th>" +


        "<th>h1</th>" +
        "<th>h3</th>" +
        "<th>h6</th>" +
        "<th>h12</th>" +
        "<th>sum1</th>" +
        "<th>sum7</th>" +
        "<th>sum30</th>" +
        "<th>per1</th>" +
        "<th>per7</th>" +
        "<th>per30</th>" +

        "<th>price_usd</th>" +
        "<th>price_notional</th>" +
        "<th>price_base</th>" +

        "<th>borrow_fee</th>" +
        "<th>instant_delta_neutrality_fee_value</th>" +
        "<th>delta_neutrality_fee_fund</th>" +
        "<th>fees_wallets</th>" +
        "<th>fees_protocol</th>" +
        "<th>fees_crank</th>" +
        "</tr></thead><tbody>";


    // Сортировка массива по возрастанию shortFunding
    allConnectionsStatus.sort((a, b) => a.shortFunding - b.shortFunding);

    // Обход каждого элемента в массиве allConnectionsStatus
    allConnectionsStatus.forEach(status => {
        // Добавление заголовка для каждой цепочки
        // Добавление строк таблицы для каждого элемента в цепочке
        html += `<tr ><td>${status.chain}</td><td>${status.market}</td><td>${status.longFunding}</td><td>${status.shortFunding}</td><td>${status.longUSD}</td>
<td>${status.shortUSD}</td>
<td>${status.short100}</td>

<td>${status.h1}</td>
<td>${status.h3}</td>
<td>${status.h6}</td>
<td>${status.h12}</td>
<td>${status.sum1}</td>
<td>${status.sum7}</td>
<td>${status.sum30}</td>
<td>${status.per1}</td>
<td>${status.per7}</td>
<td>${status.per30}</td>


<td>${status.price_usd}</td>
<td>${status.price_notional}</td>
<td>${status.price_base}</td>

<td>${status.borrow_fee}</td>
<td>${status.instant_delta_neutrality_fee_value}</td>
<td>${status.delta_neutrality_fee_fund}</td>
<td>${status.fees_wallets}</td>
<td>${status.fees_protocol}</td>
<td>${status.fees_crank}</td>
</tr>`;
    });
    html += "</tbody></table>";

    return html;
}




app.use('/', express.static('public'));

app.get('/api/weather', (req, res) => {
    res.json({
        'temperature': 30
    })
})

app.get('/api/currency', (req, res) => {
    res.json({
        'USD': 100
    })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})



const runAll1000 = async (factoryAddress, rpcEndpoint, connectionName) => {
    const allStatus = [];
    const client = await CosmWasmClient.connect(rpcEndpoint);

    const markets = await client.queryContractSmart(
        factoryAddress,
        { markets: {limit: 100} }
    );

    for (const marketId of markets.markets) {
        console.log(marketId);

        const { market_addr: marketAddress } = await client.queryContractSmart(
            factoryAddress,
            {
                market_info: { market_id: marketId },
            }
        );

        // const price = await client.queryContractSmart(marketAddress, {
        //     spot_price: {},
        // });
        // console.log(JSON.stringify(price));

        const status = await client.queryContractSmart(marketAddress, { status: {} });

        const doll= 1000
        const lev= 1
        const fee_delta= 0
        const fee_trade= 0.10 / 100 * doll
        const fee_crank= 0.20

        let short100= - status["long_funding"] * status["long_usd"] / (status["short_usd"]*1 + doll)
        if( status["long_funding"] == 0){
            short100 = - 0.90 * status["long_usd"] / (status["short_usd"]*1 + doll)
        }
        // const short100= - 0.90 * status["long_usd"] / (status["short_usd"]*1 + doll)
        const short = short100

        const h1= ((- doll * lev * short / 365 ) * 1 / 24 - fee_crank - fee_trade).toFixed(2)
        const h3= ((- doll * lev * short / 365 ) * 3 / 24 - fee_crank - fee_trade).toFixed(2)
        const h6= ((- doll * lev * short / 365 ) * 6 / 24 - fee_crank - fee_trade).toFixed(2)
        const h12= ((- doll * lev * short / 365 ) * 12 / 24 - fee_crank - fee_trade).toFixed(2)
        const sum1= ((- doll * lev * short / 365 - fee_crank ) * 1 - fee_trade).toFixed(2)
        const sum7= ((- doll * lev * short / 365 - fee_crank ) * 7 - fee_trade).toFixed(2)
        const sum30= ((- doll * lev * short  / 365 - fee_crank ) * 30 - fee_trade).toFixed(2)
        const per1 = Math.round(sum1 / doll * 365 * 100)
        const per7 = Math.round(sum7 / doll * 365 / 7 * 100)
        const per30 = Math.round(sum30 / doll * 365 / 30 * 100)



        allStatus.push({
            chain: connectionName,
            market: marketId ,
            longFunding: Math.round(status["long_funding"]*100) ,
            shortFunding: Math.round(status["short_funding"]*100),
            longUSD: Math.round(status["long_usd"]),
            shortUSD: Math.round(status["short_usd"]),
            short100: Math.round(short100*100),

            h1: (h1),
            h3: (h3),
            h6: (h6),
            h12: (h12),
            sum1: (sum1),
            sum7: (sum7),
            sum30: (sum30),
            per1: (per1),
            per7: (per7),
            per30: (per30),

            // price_usd: (price["price_usd"]),
            // price_notional: (price["price_notional"]),
            // price_base: (price["price_base"]),
            price_usd: 0,
            price_notional: 0,
            price_base: 0,

            borrow_fee: (status["borrow_fee"]*10000)/10000,
            instant_delta_neutrality_fee_value: (status["instant_delta_neutrality_fee_value"]*10000)/10000,
            delta_neutrality_fee_fund: (status["delta_neutrality_fee_fund"]*10000)/10000,
            fees_wallets: (status["fees"]["wallets"]*10000)/10000,
            fees_protocol: (status["fees"]["protocol"]*10000)/10000,
            fees_crank: (status["fees"]["crank"]*10000)/10000
        });

        // console.log(
        //     status["long_funding"],
        //     status["short_funding"],
        //     status["long_usd"],
        //     status["short_usd"]
        // );
    }

    return allStatus;
};

const runAllForAllConnections1000 = async () => {
    const allConnectionsStatus = [];

    // Создание массива обещаний для каждого соединения
    const promises = Object.keys(connections).map(async connectionName => {
        const connection = connections[connectionName];
        const status = await runAll1000(connection.factoryAddress, connection.rpcEndpoint, connectionName);
        return status;
    });

    // Ожидание выполнения всех обещаний
    const results = await Promise.all(promises);

    // Объединение результатов
    results.forEach(statusArray => {
        allConnectionsStatus.push(...statusArray);
    });

    return allConnectionsStatus;
};
