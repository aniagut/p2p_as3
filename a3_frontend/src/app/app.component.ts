import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
// import * as fs from 'fs';
// import * as csvParser from 'csv-parser';
// import * as chokidar from 'chokidar';
import { HttpClient } from '@angular/common/http';
import {catchError, interval } from 'rxjs';
import {KeyValue} from '@angular/common';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  mqttEndpoint: string = 'http://localhost:3000/api/v1/sensors/air-quality/latestData/mqtt';
  core2Endpoint: string = 'http://localhost:3000/api/v1/sensors/air-quality/latestData/core2';
  latestMqttData: {[p:string]: any} = {};
  latestCore2Data: {[p:string]: any} = {};
  errorMqtt = false;
  errorCore2 = false;


  labels: {[key: string]: string} = {
    'tvoc': 'TVOC: ',
    'tvoc_avg': 'TVOC average: ',
    'tvoc_min': 'TVOC min: ',
    'tvoc_max': 'TVOC max: ',
    'eco2': 'eCO2: ',
    'eco2_min': 'eCO2 min: ',
    'eco2_max': 'eCO2 max: ',
    'eco2_avg': 'eCO2 average: '
  }

  constructor(private readonly httpClient: HttpClient,
              private readonly changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.listenForChanges();
  }

  private listenForChanges(): void {
    interval(1000).subscribe(_ => {
      this.httpClient.get<Response>(this.mqttEndpoint).pipe(catchError(err => {
        this.errorMqtt = true;
        throw err;
      })).subscribe(resp => {
        if (resp.status == 200) {
          this.errorMqtt = false;
          this.latestMqttData = resp.body as { [p: string]: any };
          this.changeDetectorRef.markForCheck();
          console.log(this.latestMqttData);
        } else {
          this.errorMqtt = true;
        }
      });
      this.httpClient.get<Response>(this.core2Endpoint).pipe(catchError(err => {
        this.errorCore2 = true;
        throw err;
      })).subscribe(resp => {
        if (resp.status == 200) {
          this.errorCore2 = false;
          this.latestCore2Data = resp.body as { [p: string]: any };
        } else {
          this.errorCore2 = true;
        }
      });
    });
  }

  //   this.csvCore2Watcher.on('change', (path: string) => {
  //
  //     // Read the updated CSV file
  //     fs.readFile(this.csvCore2FilePath, 'utf-8', (err, data) => {
  //       if (err) {
  //         console.error('Error reading file:', err);
  //         return;
  //       }
  //
  //       this.readFirstLineFromCsv(data)
  //         .then((line) => {
  //           console.log(line);
  //           if (line) {
  //             console.log('First Line:', line);
  //             // Update your UI component here with the new data (e.g., using a service or an event)
  //           } else {
  //             console.log('No lines found in the CSV.');
  //           }
  //         })
  //         .catch((error) => {
  //           console.error('Error:', error);
  //         });
  //     });
  //   });
  // }
  //
  // private readFirstLineFromCsv(csvString: string): Promise<string | null> {
  //   return new Promise((resolve, reject) => {
  //     const firstLine = csvString.split('\n')[0];
  //     if (!firstLine) {
  //       resolve(null);
  //       return;
  //     }
  //
  //     const parser = csvParser({ headers: false });
  //     const readStream = require('stream').Readable.from([firstLine]);
  //
  //     readStream.pipe(parser);
  //
  //     parser.on('data', (data) => {
  //       readStream.destroy();
  //       resolve(data);
  //     });
  //
  //     parser.on('error', (error) => {
  //       reject(error);
  //     });
  //   });
  // }
  //
  // private getLatestData(type: string) {
  //   const line = fs.readFileSync(type == 'core2' ? 'core2_measurements.csv': 'mqtt_measurements.csv')
  // }
  //
  // private generateRandomValues(): number[] {
  //   // Generate 8 random numerical values for demonstration
  //   return Array.from({ length: 8 }, () => Math.floor(Math.random() * 100));
  // }
}
