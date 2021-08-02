import { createInterface } from 'readline';
import { URL } from 'url';
import request from 'request';

const readline = createInterface({
    input: process.stdin,
    output: process.stdout
});

const POSTCODES_BASE_URL = 'https://api.postcodes.io';
const TFL_BASE_URL = 'https://api.tfl.gov.uk';

export default class ConsoleRunner {

    promptForPostcode() {
        return new Promise(function(resolve){
            readline.question('\nEnter your postcode:', (postcode)=> {
                resolve(postcode)
                readline.close();
            })
        })
    }

    displayStopPoints(stopPoints) {
        stopPoints.forEach(point => {
            console.log(point.commonName);
        });
    }

    buildUrl(url, endpoint, parameters) {
        const requestUrl = new URL(endpoint, url);
        parameters.forEach(param => requestUrl.searchParams.append(param.name, param.value));
        return requestUrl.href;
    }

    async makeGetRequest(baseUrl, endpoint, parameters) {
        const url = this.buildUrl(baseUrl, endpoint, parameters);

        return new Promise(function(resolve, reject){
            request.get(url, (err, response, body) => {
                if (err) {
                    console.log(err);

                } else if (response.statusCode !==200) {
                    console.log(response.statusCode)
                } else {
                    resolve(body)
                }
            })
        })
    }

    async getLocationForPostCode(postcode) {
           
        this.makeGetRequest(POSTCODES_BASE_URL, `postcodes/${postcode}`, [])
            .then((body)=> {
                const out = JSON.parse(body)
                console.log('request successful')
                return {latitude: out.result.latitude, longitude: out.result.longitude}
            })
            .catch((err)=> console.log('Error while getting locatsssssion', err))
    }
        
    getNearestStopPoints(latitude, longitude, count, callback) {
        this.makeGetRequest(
            TFL_BASE_URL,
            `StopPoint`, 
            [
                {name: 'stopTypes', value: 'NaptanPublicBusCoachTram'},
                {name: 'lat', value: latitude},
                {name: 'lon', value: longitude},
                {name: 'radius', value: 1000},
                {name: 'app_id', value: '' /* Enter your app id here */},
                {name: 'app_key', value: '' /* Enter your app key here */}
            ],
            function(responseBody) {
                const stopPoints = JSON.parse(responseBody).stopPoints.map(function(entity) { 
                    return { naptanId: entity.naptanId, commonName: entity.commonName };
                }).slice(0, count);
                callback(stopPoints);
            }
        );
    }

    async run() {
        const that = this;
        that.promptForPostcode()
        .then((postcode)=>postcode.replace(/\s/g, ''))
        .then((postcode)=>that.getLocationForPostCode(postcode))

            
            // console.log(that.getLocationForPostCode(postcode))
        //         that.getNearestStopPoints(location.latitude, location.longitude, 5, function(stopPoints) {
        //             that.displayStopPoints(stopPoints);
        //         });
        //     });
        // });
    }
}