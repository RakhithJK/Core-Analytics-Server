let currentApp = localStorage.getItem("currentApp");
let appsList = [];
let accessKey = localStorage.getItem("accessKey") || "nope";

function getMode() {
    switch (currentTimeWindowMode) {
        case MINUTE_MODE_TIMER: return 'ss';
        case HOUR_MODE_TIMER: return 'mm';
        case DAY_MODE_TIMER: return 'hh';
        case YEAR_MODE_TIMER: return 'dd';
        default: return 'ss';
    }
}

function getTimeAxis() {
    switch (currentTimeWindowMode) {
        case MINUTE_MODE_TIMER: return 'Last 60 Seconds';
        case HOUR_MODE_TIMER: return 'Last 60 Minutes';
        case DAY_MODE_TIMER: return 'Last 24 Hours';
        case YEAR_MODE_TIMER: return 'Last 360 Days';
        default: return 'ss';
    }
}

function removeOptions(selectElement) {
    var i, L = selectElement.options.length - 1;
    for(i = L; i >= 0; i--) {
        selectElement.remove(i);
    }
}

function updateAppsList(jsonData) {
    let appNamesSelector = document.getElementById("appNames");
    removeOptions(appNamesSelector);
    let insertedKeys = [];
    for(let key of Object.keys(jsonData)){
        let option = document.createElement("option");
        let newKey = key.split(".")[0];
        if(!insertedKeys.includes(newKey)){
            option.text = newKey;
            insertedKeys.push(newKey);
            appNamesSelector.add(option);
        }
    }
    if(!currentApp){
        currentApp = insertedKeys[0];
    }
    appNamesSelector.value = currentApp;
    localStorage.setItem("currentApp", currentApp);
}

function updateGraphs(jsonData) {
    console.log(jsonData);
    for(let key of Object.keys(jsonData)){
        let newKey = key.split(".");
        if(newKey[0] === currentApp){
            console.log(newKey);
        }
    }
    drawChart(`totalNumPostRequests`,
        "Total post requests", jsonData[`${currentApp}.totalNumPostRequests`] ,
        getTimeAxis(), "count");
}

function updateAllGraphs() {
    window.fetch(`/status?webStatusApiAccessToken=${accessKey}&timeFrame=${getMode()}`)
        .then(async (response) => {
            let jsonData = await response.json();
            if (response.status === 401) {
                accessKey = window.prompt('Please enter webStatusApiAccessToken(can be found in analytics-config.json): ');
                if(accessKey){
                    localStorage.setItem("accessKey", accessKey);
                    updateAllGraphs();
                }
            } else if(response.ok) {
                updateAppsList(jsonData);
                updateGraphs(jsonData);
            }
            return jsonData;
        })
        .catch((err)=>{
            console.log("Something went wrong", err);
        });
}

function setData(chart, xAxisTitle, label, data) {
    chart.data.labels=[];
    chart.data.datasets.forEach((dataset) => {
        dataset.data=[];
    });
    chart.data.labels=chart.data.labels.concat(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data = dataset.data.concat(data);
    });
    chart.options.scales.xAxes.title.text = xAxisTitle;
    chart.update();
}

function drawChart(id, graphLabel, dataArray, xAxisTitle, yAxisTitle, xAxisArray) {
    const canvasElement = window.document.getElementById(id);
    const ctx = canvasElement.getContext('2d');
    if(!xAxisArray){
        xAxisArray = [];
        for(let i=0; i<dataArray.length; i++){
            xAxisArray.unshift(i);
        }
    }
    if(canvasElement.chart){
        setData(canvasElement.chart, xAxisTitle, xAxisArray, dataArray);
        return;
    }
    canvasElement.chart = new window.Chart(ctx, {
        type: 'line',
        data: {
            labels: xAxisArray,
            datasets: [{
                label: graphLabel,
                data: dataArray,
                backgroundColor: ['rgba(255, 99, 132, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: {
                    title: {
                        display: true,
                        text: yAxisTitle,
                        font: {
                            size: 15
                        }
                    },
                    ticks: {
                        precision: 0
                    }
                },
                xAxes: {
                    title: {
                        display: true,
                        text: xAxisTitle,
                        font: {
                            size: 15
                        }
                    }
                }
            },
            animation: false
        }
    });
}

updateAllGraphs();
