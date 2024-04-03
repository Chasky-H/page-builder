import { MatTabsModule } from '@angular/material/tabs';
import { PepGroupButtonsModule } from '@pepperi-addons/ngx-lib/group-buttons';
import { HttpClientModule } from '@angular/common/http';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PepNgxLibModule  } from '@pepperi-addons/ngx-lib';
import { PageBuilderEditorComponent} from  './page-builder-editor.component';
import { PepRemoteLoaderModule } from '@pepperi-addons/ngx-lib/remote-loader';
import { OverlayModule} from '@angular/cdk/overlay';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepTextareaModule, } from '@pepperi-addons/ngx-lib/textarea';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PepCheckboxModule } from '@pepperi-addons/ngx-lib/checkbox';

import { PepColorModule } from '@pepperi-addons/ngx-lib/color';
import { PepImageModule } from '@pepperi-addons/ngx-lib/image';
import { PepGroupButtonsSettingsModule } from '@pepperi-addons/ngx-composite-lib/group-buttons-settings';
import { PepDraggableItemsModule } from '@pepperi-addons/ngx-lib/draggable-items';
import { MatSliderModule } from '@angular/material/slider'
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { PepManageParametersModule } from '@pepperi-addons/ngx-composite-lib/manage-parameters';
import { PepFlowPickerButtonModule } from '@pepperi-addons/ngx-composite-lib/flow-picker-button';

@NgModule({
    declarations: [
        PageBuilderEditorComponent
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        PepNgxLibModule,
        PepRemoteLoaderModule,
        PepSelectModule,
        PepTextboxModule,
        DragDropModule,
        OverlayModule,
        MatTabsModule,
        PepButtonModule,
        PepCheckboxModule,
        PepGroupButtonsModule,
        PepColorModule,
        PepImageModule,
        PepGroupButtonsSettingsModule,
        PepDraggableItemsModule,
        PepDialogModule,
        MatSliderModule,
        PepTextareaModule,
        PepManageParametersModule,
        PepFlowPickerButtonModule,
        // TranslateModule.forChild()
        // ({
        //     loader: {
        //         provide: TranslateLoader,
        //         useFactory: (addonService: PepAddonService) => 
        //             PepAddonService.createMultiTranslateLoader(addonService, ['ngx-lib', 'ngx-composite-lib'], config.AddonUUID),
        //         deps: [PepAddonService]
        //     }, isolate: false
        // }),
    ],
    exports:[PageBuilderEditorComponent]
})
export class PageBuilderEditorModule {
    constructor(
        // private pepIconRegistry: PepIconRegistry
        ) {
        // this.pepIconRegistry.registerIcons(pepIcons);
    }
}
