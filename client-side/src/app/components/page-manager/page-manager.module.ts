import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
// import { OverlayModule} from '@angular/cdk/overlay';
// import { DragDropModule } from '@angular/cdk/drag-drop';

import { TranslateModule } from '@ngx-translate/core';

// import { MatCardModule } from '@angular/material/card';
// import { MatIconModule } from '@angular/material/icon';
// import { MatButtonModule } from '@angular/material/button';

import { PepRemoteLoaderModule } from '@pepperi-addons/ngx-lib/remote-loader';

import { PepNgxLibModule, PepAddonService } from '@pepperi-addons/ngx-lib';
// import { PepGroupButtonsModule } from '@pepperi-addons/ngx-lib/group-buttons';
import { PepIconModule, pepIconNumberPlus, PepIconRegistry, pepIconSystemBolt, pepIconSystemClose,
    pepIconSystemEdit, pepIconSystemMove, pepIconSystemBin, pepIconViewCardMd, pepIconSystemView, pepIconDeviceMobile, pepIconDeviceTablet, pepIconDeviceDesktop } from '@pepperi-addons/ngx-lib/icon';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
// import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
// import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
// import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
// import { PepCheckboxModule } from '@pepperi-addons/ngx-lib/checkbox';
// import { PepSideBarModule } from '@pepperi-addons/ngx-lib/side-bar';
// import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { PepSnackBarModule } from '@pepperi-addons/ngx-lib/snack-bar';

import { PepNgxCompositeLibModule } from '@pepperi-addons/ngx-composite-lib';
import { PepLayoutBuilderModule } from '@pepperi-addons/ngx-composite-lib/layout-builder';

import { PageBuilderInternalModule } from '../page-builder-internal/page-builder-internal.module';
import { PageBuilderEditorModule } from '../page-builder-editor/page-builder-editor.module';
// import { SectionEditorModule } from '../section-editor/section-editor.module';

import { PageManagerComponent} from './page-manager.component';
// import { ModuleFederationToolsModule } from '@angular-architects/module-federation-tools';

const pepIcons = [
    pepIconSystemClose,
    pepIconNumberPlus,
    pepIconSystemEdit,
    pepIconSystemMove,
    pepIconSystemBin,
    pepIconDeviceDesktop,
    pepIconDeviceTablet,
    pepIconDeviceMobile,
    pepIconSystemView
];

const routes: Routes = [
    {
        path: '',
        component: PageManagerComponent,
        data: { showSidebar: false, addPadding: false}
    }
];

@NgModule({
    declarations: [
        PageManagerComponent,
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        PepNgxLibModule,
        // PepPluginProxyComponent,
        PageBuilderInternalModule,
        PageBuilderEditorModule,
        // SectionEditorModule,
        PepTopBarModule,
        // MatCardModule,
        // MatButtonModule,
        // PepSideBarModule,
        // PepMenuModule,
        PepDialogModule,
        PepSnackBarModule,
        // PepPageLayoutModule,
        // PepSelectModule,
        // PepTextboxModule,
        // DragDropModule,
        // OverlayModule,
        PepButtonModule,
        // PepCheckboxModule,
        // PepGroupButtonsModule,
        // PepIconModule,
        // MatIconModule,
        PepRemoteLoaderModule,
        PepNgxCompositeLibModule,
        PepLayoutBuilderModule,
        TranslateModule.forChild(),
        // ModuleFederationToolsModule,
        RouterModule.forChild(routes)
    ],
    exports:[PageManagerComponent]
})
export class PageManagerModule {
    constructor(
        private pepIconRegistry: PepIconRegistry
    ) {
        this.pepIconRegistry.registerIcons(pepIcons);
    }
}
