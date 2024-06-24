import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { TranslateModule } from '@ngx-translate/core';

import { PepNgxLibModule, PepAddonService } from '@pepperi-addons/ngx-lib';
import { PepRemoteLoaderModule } from '@pepperi-addons/ngx-lib/remote-loader';
import { PepSizeDetectorModule } from '@pepperi-addons/ngx-lib/size-detector';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';

import { PepLayoutBuilderModule } from '@pepperi-addons/ngx-composite-lib/layout-builder';

import { PageBlockModule } from '../page-block/page-block.module';

import { PageBuilderInternalComponent} from './index';

@NgModule({
    declarations: [
        PageBuilderInternalComponent,
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        PepNgxLibModule,
        PepRemoteLoaderModule,
        PepSizeDetectorModule,
        PepDialogModule,
        PageBlockModule,
        PepLayoutBuilderModule,
        TranslateModule.forChild()
    ],
    exports:[PageBuilderInternalComponent],
})
export class PageBuilderInternalModule {
}
