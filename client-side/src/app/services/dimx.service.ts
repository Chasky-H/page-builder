// import { Injectable, ViewContainerRef } from "@angular/core";
// import { NavigationService } from "./navigation.service";
// import { PepDIMXHelperService } from "@pepperi-addons/ngx-composite-lib";

// @Injectable()
// export class DIMXService {
//     constructor(
//         private navigationService: NavigationService,
//         private dimxService: PepDIMXHelperService
//     ) {
//     }

//     register(viewContainerRef: ViewContainerRef, onDIMXProcessDoneCallback: (dimxEvent: any) => void) {
//         const dimxHostObject = {
//             DIMXAddonUUID: this.navigationService.addonUUID,
//             DIMXResource: 'PagesDrafts'
//         };

//         this.dimxService.register(viewContainerRef, dimxHostObject, onDIMXProcessDoneCallback);
//     }

//     import() {
//         const options = {
//             OwnerID: this.navigationService.addonUUID,
//         };

//         this.dimxService.recursive_import(options);
//     }

//     export(pageKey: string, pageName: string) {
//         const options = { 
//             DIMXExportFormat: 'json',
//             DIMXExportIncludeDeleted: true,
//             DIMXExportFileName: pageName || `page_${pageKey}`,
//             DIMXExportWhere: 'Key="' + pageKey + '"'
//         };
//         this.dimxService.recursive_export(options);
//     }
// }