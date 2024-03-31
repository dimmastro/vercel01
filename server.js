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

        const status = await client.queryContractSmart(marketAddress, { status: {} });

        allStatus.push({
            chain: connectionName,
            market: marketId ,
            longFunding: Math.round(status["long_funding"]*100) ,
            shortFunding: Math.round(status["short_funding"]*100),
            longUSD: Math.round(status["long_usd"]),
            shortUSD: Math.round(status["short_usd"])
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

const runAllForAllConnections = async () => {
    const allConnectionsStatus = [];

    for (const connectionName in connections) {
        const connection = connections[connectionName];
        const status = await runAll(connection.factoryAddress, connection.rpcEndpoint, connectionName);
        // allConnectionsStatus[connectionName] = status;
        allConnectionsStatus.push(...status);
    }

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


function generateHtmlTable(allConnectionsStatus) {
    let html = "";
    console.log(allConnectionsStatus);
    html += "<style>table { border-collapse: collapse; } th, td { border: 1px solid black; }</style>";

    // html += `<h2>Funding</h2>`;
    // Добавление таблицы
    html += "<table><thead><tr><th>Chain</th><th>Market</th><th>Long Funding</th><th>Short Funding</th><th>Long USD</th><th>Short USD</th></tr></thead><tbody>";

    // Сортировка массива по возрастанию shortFunding
    allConnectionsStatus.sort((a, b) => a.shortFunding - b.shortFunding);

    // Обход каждого элемента в массиве allConnectionsStatus
    allConnectionsStatus.forEach(status => {
        // Добавление заголовка для каждой цепочки
        // Добавление строк таблицы для каждого элемента в цепочке
        html += `<tr style="border: 1px solid black;"><td>${status.chain}</td><td>${status.market}</td><td>${status.longFunding}</td><td>${status.shortFunding}</td><td>${status.longUSD}</td><td>${status.shortUSD}</td></tr>`;
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