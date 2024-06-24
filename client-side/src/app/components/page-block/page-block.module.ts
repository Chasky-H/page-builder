import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageBlockComponent } from './page-block.component'
// import { DragDropModule } from '@angular/cdk/drag-drop';
// import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepRemoteLoaderModule } from '@pepperi-addons/ngx-lib/remote-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { PepAddonService, PepNgxLibModule } from '@pepperi-addons/ngx-lib';
// import { HideInModule } from '../hide-in/hide-in.module';
import { PepDraggableItemsModule } from '@pepperi-addons/ngx-lib/draggable-items';
// import { PepSkeletonLoaderModule } from '@pepperi-addons/ngx-lib/skeleton-loader';
// import { ModuleFederationToolsModule } from '@angular-architects/module-federation-tools';

// import { PepPluginProxyComponent } from '@pepperi-addons/ngx-lib/plugin';

@NgModule({
    declarations: [
        PageBlockComponent,
    ],
    imports: [
        CommonModule,
        // DragDropModule,
        PepNgxLibModule,
        // PepButtonModule,
        // PepPluginProxyComponent,
        // ToolbarModule,
        // PepSkeletonLoaderModule,
        PepRemoteLoaderModule,
        // HideInModule,
        PepDraggableItemsModule,
        // ModuleFederationToolsModule,
        TranslateModule.forChild()
    ],
    exports: [PageBlockComponent]
})
export class PageBlockModule { }
