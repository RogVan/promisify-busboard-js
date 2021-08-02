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

        return new Promise(function(resolve){
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

        try {
            const body = await this.makeGetRequest(POSTCODES_BASE_URL, `postcodes/${postcode}`, [])
            const parsed = JSON.parse(body)
            const out = {latitude: parsed.result.latitude, longitude: parsed.result.longitude}
            return out
        } catch (error) {
            console.log(error);
        }   
    }
        
    async getNearestStopPoints(latitude, longitude, count) {
        try {
            const response = await this.makeGetRequest(
                TFL_BASE_URL,
                `StopPoint`, 
                [
                    {name: 'stopTypes', value: 'NaptanPublicBusCoachTram'},
                    {name: 'lat', value: latitude},
                    {name: 'lon', value: longitude},
                    {name: 'radius', value: 1000},
                    {name: 'app_id', value: '' /* Enter your app id here */},
                    {name: 'app_key', value: '' /* Enter your app key here */}
                ])
                
            const stopPoints = JSON.parse(response).stopPoints.map(function(entity) { 
                        return { naptanId: entity.naptanId, commonName: entity.commonName };
                    }).slice(0, count);
                
                return this.displayStopPoints(stopPoints)
            
        } catch (error) {
            console.log(error);
        }
    }

    run() {
        const that = this;
        that.promptForPostcode()
        .then((postcode)=>postcode.replace(/\s/g, ''))
        .then((postcode)=>that.getLocationForPostCode(postcode))
        .then((out)=> that.getNearestStopPoints(out.latitude, out.longitude, 5))
    }
}