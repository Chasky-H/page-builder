import { Injectable } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { DataViewScreenSize } from '@pepperi-addons/papi-sdk';

@Injectable({ providedIn: 'root' })
export class UtilitiesService {
    
    constructor(
        private translate: TranslateService,
        private dialogService: PepDialogService,
        ) {
        //
    }

    getObjectSize(obj: any, sizeType: 'byte' | 'kb' | 'mb' = 'byte') {
        let str = '';
        if (typeof obj === 'string') {
            // If obj is a string, then use it
            str = obj;
        } else {
            // Else, make obj into a string
            str = JSON.stringify(obj);
        }
        
        // Get the length of the Uint8Array
        const bytes = new TextEncoder().encode(str).length;

        if (sizeType === 'byte') {
            return bytes;
        } else {
            const kiloBytes = bytes / 1024;
            
            if (sizeType === 'kb') {
                return kiloBytes;
            } else { // if (sizeType === 'mb') {
                return kiloBytes / 1024;
            }
        }
    };
      
    // logSizeInBytes(description, obj) {
    //     const bytes = this.getObjectSize(obj);
    //     console.log(`${description} is approximately ${bytes} B`);
    // };
      
    // logSizeInKb(description, obj) {
    //     const bytes = this.getObjectSize(obj, 'kb');
    //     const kb = (bytes / 1000).toFixed(2);
    //     console.log(`${description} is approximately ${kb} kB`);
    // };

    isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    mergeDeep(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();
      
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) {
                        Object.assign(target, { [key]: {} });
                    }

                    this.mergeDeep(target[key], source[key]);
                } else {
                    if (Array.isArray(target[key]) && Array.isArray(source[key])) {
                        if (!target[key]) {
                            Object.assign(target, { [key]: source[key] });
                        } else {
                            for (let index = 0; index < source[key].length; index++) {
                                const srcElement = source[key][index];
                                
                                if (target[key].length > index) {
                                    this.mergeDeep(target[key][index], srcElement);
                                } else {
                                    target[key].push(srcElement);
                                }
                            }
                        }
                    } else {
                        Object.assign(target, { [key]: source[key] });
                    }
                }
            }
        } 
      
        return this.mergeDeep(target, ...sources);
    }

    showDialogMsg(message: string, title: string = ''): any {
        title = title.length > 0 ? title: this.translate.instant('MESSAGES.TITLE_NOTICE');

        const data = new PepDialogData({
            title: title,
            content: message,
        });

        return this.dialogService.openDefaultDialog(data);
    }

}
