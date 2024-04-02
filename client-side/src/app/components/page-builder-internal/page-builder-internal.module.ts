import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { PepNgxLibModule, PepAddonService } from '@pepperi-addons/ngx-lib';
import { PageBuilderInternalComponent} from './index';
import { PepRemoteLoaderModule } from '@pepperi-addons/ngx-lib/remote-loader';
// import { DragDropModule } from '@angular/cdk/drag-drop';
import { TranslateModule } from '@ngx-translate/core';

// import { SectionModule } from '../section/section.module'
import { PepSizeDetectorModule } from '@pepperi-addons/ngx-lib/size-detector';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { PepSkeletonLoaderModule } from '@pepperi-addons/ngx-lib/skeleton-loader';

import { PepLayoutBuilderModule } from '@pepperi-addons/ngx-composite-lib/layout-builder';


@NgModule({
    declarations: [
        PageBuilderInternalComponent,
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        PepNgxLibModule,
        // PepSkeletonLoaderModule,
        PepRemoteLoaderModule,
        PepSizeDetectorModule,
        PepDialogModule,
        // DragDropModule,
        // SectionModule,
        PepLayoutBuilderModule,
        TranslateModule.forChild()
    ],
    exports:[PageBuilderInternalComponent],
})
export class PageBuilderInternalModule {
}
